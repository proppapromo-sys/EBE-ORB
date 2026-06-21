/**
 * walletStore.ts — ORB's Wallet: a per-owner balance plus a ledger of payments.
 *
 * This is how "Hey ORB, take care of this bill" actually moves money. Every payment is created
 * PENDING and must be confirmed by the owner (confirm-first, law 5) before it's paid — nothing
 * here can bypass that. Money is held in integer cents to avoid float drift. Durable in Supabase
 * (`orb_wallet` + `orb_wallet_txns`) when configured, process-memory otherwise.
 */
import { supabase } from './supabase.js';

export type PaymentRail = 'balance' | 'stripe' | 'card' | 'bank' | 'manual';
export type TxnType = 'topup' | 'payment';
export type TxnStatus = 'pending' | 'paid' | 'canceled' | 'failed';

export type WalletTxn = {
  id: string;
  userKey: string;
  type: TxnType;
  payee?: string;
  amountCents: number; // always positive; type decides direction
  currency: string;
  rail: PaymentRail;
  memo?: string;
  status: TxnStatus;
  note?: string; // result detail (e.g. Stripe id, or why it failed)
  createdAt: string;
  settledAt?: string;
};

export type Wallet = { userKey: string; balanceCents: number; currency: string };

const W_TABLE = 'orb_wallet';
const T_TABLE = 'orb_wallet_txns';
const wmem = new Map<string, Wallet>();
const tmem: WalletTxn[] = [];
const id = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}`;

export async function getWallet(userKey: string): Promise<Wallet> {
  if (supabase) {
    const { data } = await supabase.from(W_TABLE).select('*').eq('user_key', userKey).single();
    if (data) return { userKey, balanceCents: Number(data.balance_cents) || 0, currency: data.currency ?? 'usd' };
    return { userKey, balanceCents: 0, currency: 'usd' };
  }
  return wmem.get(userKey) ?? { userKey, balanceCents: 0, currency: 'usd' };
}

async function setBalance(userKey: string, balanceCents: number, currency: string): Promise<void> {
  if (supabase) {
    await supabase.from(W_TABLE).upsert(
      { user_key: userKey, balance_cents: balanceCents, currency, updated_at: new Date().toISOString() },
      { onConflict: 'user_key' }
    );
    return;
  }
  wmem.set(userKey, { userKey, balanceCents, currency });
}

function rowToTxn(r: Record<string, unknown>): WalletTxn {
  return {
    id: String(r.id), userKey: String(r.user_key), type: r.type as TxnType,
    payee: (r.payee as string) ?? undefined, amountCents: Number(r.amount_cents) || 0,
    currency: (r.currency as string) ?? 'usd', rail: (r.rail as PaymentRail) ?? 'balance',
    memo: (r.memo as string) ?? undefined, status: (r.status as TxnStatus) ?? 'pending',
    note: (r.note as string) ?? undefined, createdAt: String(r.created_at),
    settledAt: (r.settled_at as string) ?? undefined
  };
}

async function insertTxn(t: WalletTxn): Promise<WalletTxn> {
  if (supabase) {
    const { data, error } = await supabase.from(T_TABLE).insert({
      id: t.id, user_key: t.userKey, type: t.type, payee: t.payee ?? null, amount_cents: t.amountCents,
      currency: t.currency, rail: t.rail, memo: t.memo ?? null, status: t.status, note: t.note ?? null,
      created_at: t.createdAt, settled_at: t.settledAt ?? null
    }).select().single();
    if (error || !data) throw new Error(`wallet txn failed: ${error?.message ?? 'no row'}`);
    return rowToTxn(data);
  }
  tmem.unshift(t);
  return t;
}

export async function listTxns(userKey: string, limit = 50): Promise<WalletTxn[]> {
  if (supabase) {
    const { data } = await supabase.from(T_TABLE).select('*').eq('user_key', userKey)
      .order('created_at', { ascending: false }).limit(limit);
    return (data ?? []).map(rowToTxn);
  }
  return tmem.filter((t) => t.userKey === userKey).slice(0, limit);
}

export async function getTxn(userKey: string, txnId: string): Promise<WalletTxn | null> {
  if (supabase) {
    const { data } = await supabase.from(T_TABLE).select('*').eq('user_key', userKey).eq('id', txnId).single();
    return data ? rowToTxn(data) : null;
  }
  return tmem.find((t) => t.id === txnId && t.userKey === userKey) ?? null;
}

async function patchTxn(userKey: string, txnId: string, fields: Partial<WalletTxn>): Promise<WalletTxn | null> {
  if (supabase) {
    const upd: Record<string, unknown> = {};
    if (fields.status) upd.status = fields.status;
    if (fields.note !== undefined) upd.note = fields.note;
    if (fields.settledAt !== undefined) upd.settled_at = fields.settledAt;
    const { data } = await supabase.from(T_TABLE).update(upd).eq('user_key', userKey).eq('id', txnId).select().single();
    return data ? rowToTxn(data) : null;
  }
  const t = tmem.find((x) => x.id === txnId && x.userKey === userKey);
  if (!t) return null;
  Object.assign(t, fields);
  return t;
}

/** Add money to the wallet balance (records a paid top-up). */
export async function topUp(userKey: string, amountCents: number, memo?: string): Promise<{ wallet: Wallet; txn: WalletTxn }> {
  const w = await getWallet(userKey);
  const next = w.balanceCents + Math.max(0, Math.round(amountCents));
  await setBalance(userKey, next, w.currency);
  const txn = await insertTxn({
    id: id('topup'), userKey, type: 'topup', amountCents: Math.round(amountCents), currency: w.currency,
    rail: 'balance', memo, status: 'paid', createdAt: new Date().toISOString(), settledAt: new Date().toISOString()
  });
  return { wallet: { ...w, balanceCents: next }, txn };
}

/** Create a PENDING payment. Never moves money — that only happens on confirm. */
export async function requestPayment(userKey: string, p: {
  payee: string; amountCents: number; rail?: PaymentRail; memo?: string;
}): Promise<WalletTxn> {
  const w = await getWallet(userKey);
  return insertTxn({
    id: id('pay'), userKey, type: 'payment', payee: p.payee, amountCents: Math.max(0, Math.round(p.amountCents)),
    currency: w.currency, rail: p.rail ?? 'balance', memo: p.memo, status: 'pending', createdAt: new Date().toISOString()
  });
}

/** Mark a pending payment paid and deduct from balance (used by the balance rail). */
export async function settleFromBalance(userKey: string, txn: WalletTxn, note?: string): Promise<WalletTxn | null> {
  const w = await getWallet(userKey);
  await setBalance(userKey, w.balanceCents - txn.amountCents, w.currency);
  return patchTxn(userKey, txn.id, { status: 'paid', note, settledAt: new Date().toISOString() });
}

export async function markTxn(userKey: string, txnId: string, status: TxnStatus, note?: string): Promise<WalletTxn | null> {
  return patchTxn(userKey, txnId, { status, note, settledAt: status === 'paid' ? new Date().toISOString() : undefined });
}

export async function clearUserWallet(userKey: string): Promise<void> {
  if (supabase) {
    await supabase.from(T_TABLE).delete().eq('user_key', userKey);
    await supabase.from(W_TABLE).delete().eq('user_key', userKey);
    return;
  }
  wmem.delete(userKey);
  for (let i = tmem.length - 1; i >= 0; i--) if (tmem[i].userKey === userKey) tmem.splice(i, 1);
}

export const walletDurable = Boolean(supabase);

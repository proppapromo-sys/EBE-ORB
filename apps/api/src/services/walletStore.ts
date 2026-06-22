/**
 * walletStore.ts — the Wallet's payment LEDGER. ORB never holds money: a licensed provider
 * (Stripe) custodies and moves the funds. This store is only ORB's record of the payments it
 * has been asked to make. Every payment is created PENDING and must be confirmed by the owner
 * (confirm-first, law 5) before the provider sends it — nothing here can bypass that. Amounts
 * are integer cents to avoid float drift. Durable in Supabase (`orb_wallet_txns`), memory else.
 */
import { supabase } from './supabase.js';

export type PaymentRail = 'stripe' | 'card' | 'bank' | 'manual';
export type TxnStatus = 'pending' | 'paid' | 'canceled' | 'failed';

export type WalletTxn = {
  id: string;
  userKey: string;
  payee?: string;
  amountCents: number; // always positive
  currency: string;
  rail: PaymentRail;
  memo?: string;
  status: TxnStatus;
  note?: string; // result detail (e.g. Stripe id, or why it failed)
  createdAt: string;
  settledAt?: string;
};

const T_TABLE = 'orb_wallet_txns';
const tmem: WalletTxn[] = [];
const id = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}`;

function rowToTxn(r: Record<string, unknown>): WalletTxn {
  return {
    id: String(r.id), userKey: String(r.user_key),
    payee: (r.payee as string) ?? undefined, amountCents: Number(r.amount_cents) || 0,
    currency: (r.currency as string) ?? 'usd', rail: (r.rail as PaymentRail) ?? 'stripe',
    memo: (r.memo as string) ?? undefined, status: (r.status as TxnStatus) ?? 'pending',
    note: (r.note as string) ?? undefined, createdAt: String(r.created_at),
    settledAt: (r.settled_at as string) ?? undefined
  };
}

async function insertTxn(t: WalletTxn): Promise<WalletTxn> {
  if (supabase) {
    const { data, error } = await supabase.from(T_TABLE).insert({
      id: t.id, user_key: t.userKey, payee: t.payee ?? null, amount_cents: t.amountCents,
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

/** Create a PENDING payment. Never moves money — that only happens on confirm (via the provider). */
export async function requestPayment(userKey: string, p: {
  payee: string; amountCents: number; rail?: PaymentRail; memo?: string; currency?: string;
}): Promise<WalletTxn> {
  return insertTxn({
    id: id('pay'), userKey, payee: p.payee, amountCents: Math.max(0, Math.round(p.amountCents)),
    currency: p.currency ?? 'usd', rail: p.rail ?? 'stripe', memo: p.memo, status: 'pending', createdAt: new Date().toISOString()
  });
}

export async function markTxn(userKey: string, txnId: string, status: TxnStatus, note?: string): Promise<WalletTxn | null> {
  return patchTxn(userKey, txnId, { status, note, settledAt: status === 'paid' ? new Date().toISOString() : undefined });
}

export async function clearUserWallet(userKey: string): Promise<void> {
  if (supabase) { await supabase.from(T_TABLE).delete().eq('user_key', userKey); return; }
  for (let i = tmem.length - 1; i >= 0; i--) if (tmem[i].userKey === userKey) tmem.splice(i, 1);
}

export const walletDurable = Boolean(supabase);

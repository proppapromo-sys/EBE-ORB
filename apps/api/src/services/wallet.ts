/**
 * wallet.ts — the confirm-first payment brain. ORB never holds money: a licensed provider
 * (Stripe) custodies the funds and moves them. ORB only instructs the provider, after the owner
 * confirms.
 *
 * "Hey ORB, take care of this bill" → payBill() creates a PENDING payment and ORB reads the
 * amount + payee back. Money only moves in confirmPayment(), which the owner triggers by
 * confirming. Rails:
 *   • stripe  — pay via the owner's connected Stripe (the company holding the money).
 *   • card / bank — prepared, then handed off to be completed by the owner (until those
 *                   funding sources are connected — safe by default, no silent movement).
 *   • manual  — ORB preps everything; the owner pays in their own app.
 */
import {
  requestPayment, getTxn, markTxn, type WalletTxn, type PaymentRail
} from './walletStore.js';
import { getCredential } from './credentialStore.js';
import { getPlatformKey } from './platformKeys.js';

/** The default rail comes from the central Payments & Banking section (BILL_PAY_RAIL). */
export function defaultBillRail(): PaymentRail {
  const r = (getPlatformKey('BILL_PAY_RAIL') || '').toLowerCase();
  return (['stripe', 'card', 'bank', 'manual'] as const).includes(r as PaymentRail) ? (r as PaymentRail) : 'stripe';
}

export const RAILS: { rail: PaymentRail; label: string; ready: boolean; note: string }[] = [
  { rail: 'stripe', label: 'Stripe', ready: true, note: 'Stripe holds and moves the money; ORB just instructs it.' },
  { rail: 'card', label: 'Card on file', ready: false, note: 'Approve with a tap once your card is connected.' },
  { rail: 'bank', label: 'Bank (bill pay)', ready: false, note: 'Pay any biller once your bank is connected.' },
  { rail: 'manual', label: 'I\'ll pay it myself', ready: true, note: 'ORB preps it; you pay in your own app.' }
];

export function dollarsToCents(amount: number): number {
  return Math.round(amount * 100);
}
export function fmt(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
}

export type WalletView = {
  provider: 'stripe';
  connected: boolean;
  availableCents: number | null; // real Stripe available balance (null if not connected)
  pendingCents: number | null;
  currency: string;
  note: string;
};

/** Read the REAL balance from the provider (Stripe). ORB stores no balance of its own. */
export async function getWalletView(userKey: string): Promise<WalletView> {
  const cred = await getCredential(userKey, 'stripe');
  if (!cred?.secretKey) {
    return { provider: 'stripe', connected: false, availableCents: null, pendingCents: null, currency: 'usd',
      note: 'Connect Stripe in Settings — your money stays with Stripe, ORB never holds it.' };
  }
  try {
    const r = await fetch('https://api.stripe.com/v1/balance', { headers: { authorization: `Bearer ${cred.secretKey}` } });
    if (!r.ok) return { provider: 'stripe', connected: true, availableCents: null, pendingCents: null, currency: 'usd', note: `Stripe error ${r.status}.` };
    const d = (await r.json()) as { available?: { amount: number; currency: string }[]; pending?: { amount: number; currency: string }[] };
    const avail = d.available?.[0];
    const pend = d.pending?.[0];
    return {
      provider: 'stripe', connected: true,
      availableCents: avail?.amount ?? 0, pendingCents: pend?.amount ?? 0,
      currency: avail?.currency ?? 'usd', note: 'Balance held by Stripe.'
    };
  } catch (e) {
    return { provider: 'stripe', connected: true, availableCents: null, pendingCents: null, currency: 'usd',
      note: e instanceof Error ? e.message : 'Could not read Stripe balance.' };
  }
}

/** Create a pending bill payment. Returns the txn + a spoken-ready confirmation line. */
export async function payBill(userKey: string, p: {
  payee: string; amountCents: number; rail?: PaymentRail; memo?: string;
}): Promise<{ txn: WalletTxn; say: string }> {
  const txn = await requestPayment(userKey, { ...p, rail: p.rail ?? defaultBillRail() });
  const say = `I've set up ${fmt(txn.amountCents, txn.currency)} to ${txn.payee}` +
    `${txn.memo ? ` for ${txn.memo}` : ''}. Say "confirm" and I'll send it, or "cancel" to drop it.`;
  return { txn, say };
}

/** Confirm + execute a pending payment via its rail. The only place money actually moves. */
export async function confirmPayment(userKey: string, txnId: string): Promise<{ ok: boolean; txn: WalletTxn | null; say: string }> {
  const txn = await getTxn(userKey, txnId);
  if (!txn) return { ok: false, txn: null, say: "I couldn't find that payment." };
  if (txn.status !== 'pending') return { ok: false, txn, say: `That payment is already ${txn.status}.` };

  if (txn.rail === 'stripe') {
    const cred = await getCredential(userKey, 'stripe');
    if (!cred?.secretKey) return { ok: false, txn, say: 'Connect Stripe in Settings first and I\'ll send it.' };
    const res = await stripePayout(cred.secretKey, txn);
    const done = await markTxn(userKey, txnId, res.ok ? 'paid' : 'failed', res.note);
    return { ok: res.ok, txn: done, say: res.ok ? `Done — Stripe is sending ${fmt(txn.amountCents, txn.currency)} to ${txn.payee}.` : `Stripe couldn't send it: ${res.note}` };
  }

  // card / bank / manual — prepare and hand off (no silent money movement until connected).
  const done = await markTxn(userKey, txnId, 'paid', 'Prepared for you to complete.');
  return {
    ok: true, txn: done,
    say: `I've got ${fmt(txn.amountCents, txn.currency)} to ${txn.payee} ready — finish it from your ${txn.rail === 'manual' ? 'own app' : txn.rail} and I'll mark it done.`
  };
}

export async function cancelPayment(userKey: string, txnId: string): Promise<WalletTxn | null> {
  const txn = await getTxn(userKey, txnId);
  if (!txn || txn.status !== 'pending') return txn;
  return markTxn(userKey, txnId, 'canceled', 'Canceled by owner.');
}

// ── Stripe payout (real) — Stripe moves the money from the owner's Stripe balance ─────────────
async function stripePayout(secretKey: string, txn: WalletTxn): Promise<{ ok: boolean; note: string }> {
  try {
    const body = new URLSearchParams({
      amount: String(txn.amountCents),
      currency: txn.currency,
      description: `${txn.payee}${txn.memo ? ' — ' + txn.memo : ''}`.slice(0, 200)
    });
    const r = await fetch('https://api.stripe.com/v1/payouts', {
      method: 'POST',
      headers: { authorization: `Bearer ${secretKey}`, 'content-type': 'application/x-www-form-urlencoded' },
      body
    });
    const d = (await r.json()) as { id?: string; error?: { message?: string } };
    if (r.ok && d.id) return { ok: true, note: `Stripe payout ${d.id}` };
    return { ok: false, note: d.error?.message ?? `Stripe error ${r.status}` };
  } catch (e) {
    return { ok: false, note: e instanceof Error ? e.message : 'stripe payout failed' };
  }
}

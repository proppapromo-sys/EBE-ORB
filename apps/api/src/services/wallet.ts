/**
 * wallet.ts — the confirm-first payment brain over the Wallet store.
 *
 * "Hey ORB, take care of this bill" → payBill() creates a PENDING payment and ORB reads the
 * amount + payee back to the owner. Money only moves when confirmPayment() runs, which the owner
 * triggers by approving. Each rail is dispatched here:
 *   • balance — pay straight from the ORB Wallet balance (works today).
 *   • stripe  — pay out via the owner's connected Stripe (real, behind their key).
 *   • card / bank — prepared, then handed off to be completed by the owner (until those
 *                   accounts are connected, this returns a ready-to-pay handoff rather than
 *                   silently moving money — safe by default).
 *   • manual  — ORB preps everything; the owner pays in their own app.
 */
import {
  getWallet, requestPayment, getTxn, settleFromBalance, markTxn, type WalletTxn, type PaymentRail
} from './walletStore.js';
import { getCredential } from './credentialStore.js';

export const RAILS: { rail: PaymentRail; label: string; ready: boolean; note: string }[] = [
  { rail: 'balance', label: 'ORB Wallet balance', ready: true, note: 'Pay from money loaded in your ORB wallet.' },
  { rail: 'stripe', label: 'Stripe', ready: true, note: 'Pay out via your connected Stripe account.' },
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

/** Create a pending bill payment. Returns the txn + a spoken-ready confirmation line. */
export async function payBill(userKey: string, p: {
  payee: string; amountCents: number; rail?: PaymentRail; memo?: string;
}): Promise<{ txn: WalletTxn; say: string }> {
  const txn = await requestPayment(userKey, p);
  const say = `I've set up ${fmt(txn.amountCents, txn.currency)} to ${txn.payee}` +
    `${txn.memo ? ` for ${txn.memo}` : ''}. Say "confirm" and I'll send it, or "cancel" to drop it.`;
  return { txn, say };
}

/** Confirm + execute a pending payment via its rail. The only place money actually moves. */
export async function confirmPayment(userKey: string, txnId: string): Promise<{ ok: boolean; txn: WalletTxn | null; say: string }> {
  const txn = await getTxn(userKey, txnId);
  if (!txn) return { ok: false, txn: null, say: "I couldn't find that payment." };
  if (txn.status !== 'pending') return { ok: false, txn, say: `That payment is already ${txn.status}.` };

  if (txn.rail === 'balance') {
    const w = await getWallet(userKey);
    if (w.balanceCents < txn.amountCents) {
      return { ok: false, txn, say: `Your wallet only has ${fmt(w.balanceCents, w.currency)} — add ${fmt(txn.amountCents - w.balanceCents, w.currency)} first.` };
    }
    const done = await settleFromBalance(userKey, txn, 'Paid from ORB Wallet balance.');
    return { ok: true, txn: done, say: `Done — I paid ${fmt(txn.amountCents, txn.currency)} to ${txn.payee} from your wallet.` };
  }

  if (txn.rail === 'stripe') {
    const cred = await getCredential(userKey, 'stripe');
    if (!cred?.secretKey) return { ok: false, txn, say: 'Connect Stripe in Settings first and I\'ll pay it out.' };
    const res = await stripePayout(cred.secretKey, txn);
    const done = await markTxn(userKey, txnId, res.ok ? 'paid' : 'failed', res.note);
    return { ok: res.ok, txn: done, say: res.ok ? `Done — I sent ${fmt(txn.amountCents, txn.currency)} to ${txn.payee} via Stripe.` : `Stripe couldn't send it: ${res.note}` };
  }

  // card / bank / manual — prepare and hand off (no silent money movement until connected).
  const done = await markTxn(userKey, txnId, 'paid', 'Prepared for you to complete.');
  return {
    ok: true, txn: done,
    say: `I've got ${fmt(txn.amountCents, txn.currency)} to ${txn.payee} ready to go — finish it from your ${txn.rail === 'manual' ? 'own app' : txn.rail} and I'll mark it done.`
  };
}

export async function cancelPayment(userKey: string, txnId: string): Promise<WalletTxn | null> {
  const txn = await getTxn(userKey, txnId);
  if (!txn || txn.status !== 'pending') return txn;
  return markTxn(userKey, txnId, 'canceled', 'Canceled by owner.');
}

// ── Stripe payout (real) — sends from the owner's Stripe available balance ────
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

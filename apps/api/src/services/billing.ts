/**
 * billing.ts — Stripe subscriptions per ORB tier. Keys are read LIVE (from the in-app owner settings
 * or env) so they can be set from inside the app without a restart. Hosted Stripe Checkout creates
 * the subscription; a webhook flips the user's plan. Supports monthly/annual cycles and free trials.
 * Fully optional — no key = billing off, never throws at startup.
 */
import Stripe from 'stripe';
import { setUserPlan } from './planStore.js';
import { getPlatformKey } from './platformKeys.js';
import { PLANS, type PlanId } from '../billing/plans.js';

export type BillingCycle = 'monthly' | 'annual';

const secret = () => getPlatformKey('STRIPE_SECRET_KEY');
const webhookSecret = () => getPlatformKey('STRIPE_WEBHOOK_SECRET');
const baseUrl = () => (getPlatformKey('PUBLIC_BASE_URL') || '').replace(/\/$/, '');
const trialDays = () => Math.max(0, Number(getPlatformKey('ORB_TRIAL_DAYS') || 0)) || undefined;

// Memoized client, rebuilt if the key changes (so setting the key in-app takes effect immediately).
let _stripe: Stripe | null = null;
let _forKey = '';
function stripe(): Stripe | null {
  const k = secret();
  if (!k || /your_|placeholder|changeme/i.test(k)) { _stripe = null; _forKey = ''; return null; }
  if (_stripe && _forKey === k) return _stripe;
  try { _stripe = new Stripe(k); _forKey = k; return _stripe; }
  catch (err) { console.warn('[billing] Stripe init failed:', err instanceof Error ? err.message : err); _stripe = null; return null; }
}

export function billingConfigured(): boolean {
  return Boolean(stripe());
}

/** The Stripe price id for a plan + cycle, from settings (e.g. STRIPE_PRICE_PRO / STRIPE_PRICE_PRO_ANNUAL). */
function priceFor(plan: PlanId, cycle: BillingCycle): string | undefined {
  if (plan === 'free') return undefined;
  const suffix = cycle === 'annual' ? '_ANNUAL' : '';
  return getPlatformKey(`STRIPE_PRICE_${plan.toUpperCase()}${suffix}`);
}

/** Which tiers are purchasable right now (have a configured monthly price). */
export function purchasablePlans(): { id: PlanId; name: string; price: string; ready: boolean; annual: boolean }[] {
  const on = Boolean(stripe());
  return PLANS.map((p) => ({
    id: p.id, name: p.name, price: p.price,
    ready: p.id === 'free' ? true : Boolean(on && priceFor(p.id, 'monthly')),
    annual: Boolean(on && priceFor(p.id, 'annual'))
  }));
}

/** Create a hosted Checkout session for a tier; returns the URL to send the user to. */
export async function createCheckoutSession(
  userId: string, plan: PlanId, cycle: BillingCycle = 'monthly'
): Promise<{ url: string }> {
  const s = stripe();
  if (!s) throw new Error('Billing is not configured. Set STRIPE_SECRET_KEY.');
  const price = priceFor(plan, cycle) || priceFor(plan, 'monthly');
  if (!price) throw new Error(`No Stripe price configured for the "${plan}" plan (set STRIPE_PRICE_${plan.toUpperCase()}).`);
  const base = baseUrl() || 'http://localhost:8080';
  const days = trialDays();
  const session = await s.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    client_reference_id: userId,
    metadata: { userId, plan, cycle },
    subscription_data: { metadata: { userId, plan }, ...(days ? { trial_period_days: days } : {}) },
    success_url: `${base}/?upgraded=${plan}`,
    cancel_url: `${base}/?checkout=canceled`
  });
  if (!session.url) throw new Error('Stripe did not return a checkout URL.');
  return { url: session.url };
}

/** Verify and process a Stripe webhook. Raw body required for signature verification. */
export async function handleWebhook(rawBody: Buffer, signature: string | undefined): Promise<{ received: true }> {
  const s = stripe();
  const ws = webhookSecret();
  if (!s || !ws) throw new Error('Webhook not configured.');
  if (!signature) throw new Error('Missing Stripe signature.');
  const event = s.webhooks.constructEvent(rawBody, signature, ws);

  switch (event.type) {
    case 'checkout.session.completed': {
      const sess = event.data.object as Stripe.Checkout.Session;
      const userId = sess.client_reference_id ?? sess.metadata?.userId;
      const plan = sess.metadata?.plan as PlanId | undefined;
      if (userId && plan) await setUserPlan(userId, plan);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (userId) await setUserPlan(userId, 'free'); // downgrade on cancel
      break;
    }
    default:
      break;
  }
  return { received: true };
}

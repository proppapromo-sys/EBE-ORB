/**
 * billing.ts — Stripe subscriptions, one per ORB tier. Hosted Stripe Checkout (no card data ever
 * touches our server) creates the subscription; a webhook flips the user's plan in planStore, which
 * in turn unlocks council depth and Build power. Fully optional: with no STRIPE_SECRET_KEY the whole
 * module degrades to "not configured" and never crashes the app.
 */
import Stripe from 'stripe';
import { setUserPlan } from './planStore.js';
import { PLANS, type PlanId } from '../billing/plans.js';

const secret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const baseUrl = (process.env.PUBLIC_BASE_URL ?? '').replace(/\/$/, '');

// Lazy, guarded init — a missing/placeholder key disables billing instead of throwing at startup.
function initStripe(): Stripe | null {
  if (!secret || /your_|placeholder|changeme/i.test(secret)) return null;
  try {
    return new Stripe(secret);
  } catch (err) {
    console.warn('[billing] Stripe init failed — billing disabled:', err instanceof Error ? err.message : err);
    return null;
  }
}
const stripe = initStripe();

export const billingConfigured = Boolean(stripe);

/** The Stripe price id for a plan, from env (e.g. STRIPE_PRICE_PRO). Free has no price. */
function priceFor(plan: PlanId): string | undefined {
  if (plan === 'free') return undefined;
  return process.env[`STRIPE_PRICE_${plan.toUpperCase()}`];
}

/** Which tiers are actually purchasable right now (have a configured price). */
export function purchasablePlans(): { id: PlanId; name: string; price: string; ready: boolean }[] {
  return PLANS.map((p) => ({
    id: p.id, name: p.name, price: p.price,
    ready: p.id === 'free' ? true : Boolean(stripe && priceFor(p.id))
  }));
}

/** Create a hosted Checkout session for a tier; returns the URL to send the user to. */
export async function createCheckoutSession(userId: string, plan: PlanId): Promise<{ url: string }> {
  if (!stripe) throw new Error('Billing is not configured. Set STRIPE_SECRET_KEY.');
  const price = priceFor(plan);
  if (!price) throw new Error(`No Stripe price configured for the "${plan}" plan (set STRIPE_PRICE_${plan.toUpperCase()}).`);
  const base = baseUrl || 'http://localhost:8080';
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    client_reference_id: userId,
    metadata: { userId, plan },
    subscription_data: { metadata: { userId, plan } },
    success_url: `${base}/?upgraded=${plan}`,
    cancel_url: `${base}/?checkout=canceled`
  });
  if (!session.url) throw new Error('Stripe did not return a checkout URL.');
  return { url: session.url };
}

/** Verify and process a Stripe webhook. Raw body required for signature verification. */
export async function handleWebhook(rawBody: Buffer, signature: string | undefined): Promise<{ received: true }> {
  if (!stripe || !webhookSecret) throw new Error('Webhook not configured.');
  if (!signature) throw new Error('Missing Stripe signature.');
  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object as Stripe.Checkout.Session;
      const userId = s.client_reference_id ?? s.metadata?.userId;
      const plan = s.metadata?.plan as PlanId | undefined;
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
      break; // ignore everything else for now
  }
  return { received: true };
}

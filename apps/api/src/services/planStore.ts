/**
 * planStore.ts — which subscription tier each user is on. This is the link between billing and
 * capability: the council's escalation cap and Build mode's depth both read from here. Persists in
 * Supabase (`orb_user_plans`) when configured, with an in-memory cache so reads are instant and it
 * still works without a database. Defaults to 'free'.
 */
import { supabase } from './supabase.js';
import { getPlan, PLANS, type PlanId } from '../billing/plans.js';

const TABLE = 'orb_user_plans';
const cache = new Map<string, PlanId>(); // userId -> plan

// The owner(s) get full top-tier access — they run ORB, they aren't paying customers.
const OWNER_EMAILS = (process.env.ORB_OWNER_EMAILS || 'proppapromo@gmail.com')
  .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
export function isOwner(userId: string): boolean {
  return OWNER_EMAILS.includes(String(userId).trim().toLowerCase());
}

/** Read a user's current plan (owner → enterprise; else cache → Supabase → 'free'). */
export async function getUserPlan(userId: string): Promise<PlanId> {
  if (isOwner(userId)) return 'enterprise';
  if (cache.has(userId)) return cache.get(userId)!;
  if (supabase) {
    try {
      const { data } = await supabase.from(TABLE).select('plan').eq('user_id', userId).maybeSingle();
      if (data?.plan) {
        const plan = getPlan(String(data.plan)).id;
        cache.set(userId, plan);
        return plan;
      }
    } catch { /* table may not exist yet — fall back to free */ }
  }
  return 'free';
}

/** Synchronous best-effort read (cache only) — for hot paths that already warmed the cache. */
export function getUserPlanCached(userId: string): PlanId {
  if (isOwner(userId)) return 'enterprise';
  return cache.get(userId) ?? 'free';
}

/** How many users are on each tier (Supabase → in-memory). Powers the owner Admin dashboard. */
export async function planCounts(): Promise<Record<PlanId, number>> {
  const counts = Object.fromEntries(PLANS.map((p) => [p.id, 0])) as Record<PlanId, number>;
  if (supabase) {
    try {
      const { data } = await supabase.from(TABLE).select('plan');
      if (data) { for (const r of data) counts[getPlan(String(r.plan)).id]++; return counts; }
    } catch { /* fall back to cache */ }
  }
  for (const p of cache.values()) counts[p]++;
  return counts;
}

/** Set a user's plan (called by the Stripe webhook on subscribe/cancel). */
export async function setUserPlan(userId: string, planId: string): Promise<PlanId> {
  const plan = getPlan(planId).id;
  cache.set(userId, plan);
  if (supabase) {
    try {
      await supabase.from(TABLE).upsert(
        { user_id: userId, plan, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    } catch { /* keep the in-memory value even if persistence fails */ }
  }
  return plan;
}

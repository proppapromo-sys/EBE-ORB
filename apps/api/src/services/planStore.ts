/**
 * planStore.ts — which subscription tier each user is on. This is the link between billing and
 * capability: the council's escalation cap and Build mode's depth both read from here. Persists in
 * Supabase (`orb_user_plans`) when configured, with an in-memory cache so reads are instant and it
 * still works without a database. Defaults to 'free'.
 */
import { supabase } from './supabase.js';
import { getPlan, type PlanId } from '../billing/plans.js';

const TABLE = 'orb_user_plans';
const cache = new Map<string, PlanId>(); // userId -> plan

/** Read a user's current plan (cache → Supabase → 'free'). */
export async function getUserPlan(userId: string): Promise<PlanId> {
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
  return cache.get(userId) ?? 'free';
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

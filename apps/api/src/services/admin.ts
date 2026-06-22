/**
 * admin.ts — monetization metrics for the owner dashboard. Turns plan counts into the money
 * scoreboard: MRR, ARR, paid users, conversion, ARPU. Source of truth is planStore (who's on what).
 */
import { planCounts } from './planStore.js';
import type { PlanId } from '../billing/plans.js';

// Monthly price per tier (Enterprise counted at its floor). Kept in sync with billing/plans.ts.
const MONTHLY: Record<PlanId, number> = {
  free: 0, personal: 29.99, pro: 59.99, entrepreneur: 99, executive: 249, enterprise: 499
};

const r2 = (n: number) => Math.round(n * 100) / 100;

export async function monetizationMetrics() {
  const counts = await planCounts();
  let mrr = 0, paid = 0, total = 0;
  for (const [id, n] of Object.entries(counts) as [PlanId, number][]) {
    total += n;
    const price = MONTHLY[id] || 0;
    if (price > 0) { paid += n; mrr += n * price; }
  }
  return {
    counts,
    totalUsers: total,
    paidUsers: paid,
    freeUsers: total - paid,
    mrr: r2(mrr),
    arr: r2(mrr * 12),
    arpu: paid ? r2(mrr / paid) : 0,
    conversion: total ? Math.round((paid / total) * 1000) / 10 : 0, // % of users who pay
    prices: MONTHLY
  };
}

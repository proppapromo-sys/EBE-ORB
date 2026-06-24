/**
 * behavior.ts — ORB's Behavior Prediction (#5): anticipating likely future actions before they happen.
 * It doesn't read minds — it reads patterns. By combining what drives the user (motivation), how they
 * tolerate risk (decision profile), what they're working toward (goals), and what they keep putting off
 * (commitments), ORB infers the moves they're likely to make next — the way a chief of staff who knows
 * you can finish your sentence. Patterns, not certainty.
 */
import { topDrivers } from './motivation.js';
import { getPrefs } from './convoPrefs.js';
import { decisionProfile } from './personality.js';
import { listObjectives } from './objectives.js';
import { pendingGoals } from './goals.js';

export type PredictInput = { drivers: string[]; risk: 'low' | 'medium' | 'high'; objectives: string[]; deferring: string[] };

/** Pure synthesis: patterns → likely future behaviors. Testable on its own. */
export function synthesizePredictions(inp: PredictInput): string[] {
  const out: string[] = [];
  const has = (d: string) => inp.drivers.includes(d);
  if (inp.risk === 'high' || has('achievement') || has('freedom')) out.push('lean toward bold moves — expansion, new ventures, or investment when the upside is real');
  if (inp.risk === 'low' || has('security')) out.push('favor protecting and consolidating what already works over risky bets');
  if (has('legacy')) out.push('prioritize long-term, impact-driven projects over quick wins');
  if (inp.objectives.length) out.push(`keep pushing on "${inp.objectives[0]}"`);
  if (inp.deferring.length) out.push(`keep putting off "${inp.deferring[0]}" unless it's made quick and easy`);
  return [...new Set(out)].slice(0, 5);
}

/** Predict the user's likely next moves from everything ORB has learned about them. */
export async function predictBehavior(userId: string): Promise<string[]> {
  const [drivers, prefs, objs, pend] = await Promise.all([
    topDrivers(userId).catch(() => [] as string[]),
    getPrefs(userId).catch(() => ({ traits: {} as Awaited<ReturnType<typeof getPrefs>>['traits'] })),
    listObjectives(userId).catch(() => []),
    pendingGoals(userId, 3).catch(() => [])
  ]);
  const risk = decisionProfile(prefs.traits).risk;
  return synthesizePredictions({ drivers, risk, objectives: objs.map((o) => o.label), deferring: pend.map((g) => g.action) });
}

export function formatPredictions(preds: string[]): string {
  if (!preds.length) return "I don't have enough of your patterns yet to call your next moves — give it a little time and I'll start to see the shape.";
  return 'Reading your patterns — goals, what drives you, how you weigh risk — here\'s what you\'ll likely do:\n' +
    preds.map((p) => `• ${p}`).join('\n') + '\n\n(Patterns, not certainty. You can always surprise me — and the better choice sometimes is the surprising one.)';
}

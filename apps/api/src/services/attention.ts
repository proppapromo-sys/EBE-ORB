/**
 * attention.ts — ORB's Attention Engine: the spotlight. Memory answers "what do I know?"; attention
 * answers "what should I care about RIGHT NOW?". Every tracked item gets a Priority Score (0–100)
 * following the brain's natural hierarchy — survival/threat first, then goals & deadlines, then
 * novelty, then rewards, then routine — so ORB focuses on what matters instead of everything at once.
 */
import { pendingGoals, type Goal } from './goals.js';

export type Tier = 'emergency' | 'deadline' | 'goal' | 'novelty' | 'reward' | 'routine';
export type FocusItem = { label: string; score: number; tier: Tier };

// The hierarchy, top to bottom. Survival/threat dominates; routine sinks.
const EMERGENCY = /\b(emergency|urgent|critical|asap|immediately|breach|hacked|down|outage|failed|failure|overdue|lawsuit|injur(?:y|ed)|fire|accident|threat|danger|evacuat|leak|fraud|stolen|crash|911|emergencies)\b/i;
const DEADLINE = /\b(due|deadline|today|tonight|tomorrow|by (?:end of|eod|cob)|expir|closing|payroll|tax(?:es)?|invoice|payment|renew|file|submit)\b/i;
const NOVELTY = /\b(new|just (?:in|now)|unexpected|alert|breaking|changed|update)\b/i;
const REWARD = /\b(opportunity|deal|win|bonus|offer|lead|prospect|revenue|profit|reward|discount|raise)\b/i;

export function classifyTier(text: string, fromGoal = false): Tier {
  const t = text || '';
  if (EMERGENCY.test(t)) return 'emergency';
  if (DEADLINE.test(t)) return 'deadline';
  if (NOVELTY.test(t)) return 'novelty';
  if (REWARD.test(t)) return 'reward';
  return fromGoal ? 'goal' : 'routine';
}

const BASE: Record<Tier, number> = { emergency: 90, deadline: 62, goal: 48, novelty: 38, reward: 28, routine: 14 };

/**
 * Priority Score (0–100). Tier sets the floor; signals nudge within it — importance, how long it's
 * aged, how many times it's been put off, and how soon it's due.
 */
export function priorityScore(text: string, sig: { importance?: number; deferrals?: number; ageDays?: number; dueInHours?: number; fromGoal?: boolean } = {}): number {
  const tier = classifyTier(text, sig.fromGoal);
  let s = BASE[tier];
  s += Math.min(8, ((sig.importance ?? 1) - 1) * 4);          // importance 1..3 → +0..8
  s += Math.min(9, (sig.deferrals ?? 0) * 3);                 // keeps getting put off → climbs
  s += Math.min(5, sig.ageDays ?? 0);                         // ages upward
  if (sig.dueInHours != null) s += sig.dueInHours <= 24 ? 10 : sig.dueInHours <= 72 ? 5 : 0;
  return Math.max(1, Math.min(100, Math.round(s)));
}

function scoreGoal(g: Goal): FocusItem {
  const ageDays = (Date.now() - g.created) / 86400000;
  const score = priorityScore(g.action, { importance: g.importance, deferrals: g.deferrals, ageDays, fromGoal: true });
  return { label: g.action, score, tier: classifyTier(g.action, true) };
}

/** The ranked spotlight: what deserves the user's attention right now, highest score first. */
export async function focusList(userId: string, n = 6): Promise<FocusItem[]> {
  const goals = await pendingGoals(userId, 12).catch(() => [] as Goal[]);
  return goals.map(scoreGoal).sort((a, b) => b.score - a.score).slice(0, n);
}

export function formatFocus(items: FocusItem[]): string {
  if (!items.length) return "Nothing's pressing for your attention right now — you're on top of things.";
  const flag = (t: Tier) => (t === 'emergency' ? ' ⚠️' : '');
  return 'What deserves your attention right now:\n' +
    items.map((it) => `[${it.score}] ${it.label}${flag(it.tier)}`).join('\n');
}

/**
 * selfreg.ts — ORB's Self-Regulation (#7): the bridge between knowing and doing. Most people know what
 * they should do; the challenge is doing it consistently. ORB watches the gap between intentions and
 * execution — follow-through rate, the high-value thing being avoided, and discipline trend — and
 * coaches by keeping actions aligned with goals, not by nagging.
 */
import { goalStats } from './goals.js';

export type SelfRegInput = { done: number; open: number; deferred: number; avoided: string | null };

/** Pure synthesis of an execution / discipline read. Testable on its own. */
export function buildSelfReg(s: SelfRegInput): string {
  const total = s.done + s.open;
  if (!total) return "Nothing tracked yet to gauge your execution — give me a few commitments to watch and I'll keep you honest.";
  const rate = Math.round((s.done / total) * 100);
  const lines = [`Follow-through: you've closed ${s.done} of ${total} commitments (${rate}%).`];
  if (s.avoided) lines.push(`What you keep avoiding that actually matters: "${s.avoided}". That's the one to protect time for first.`);
  if (rate < 40) lines.push('Discipline read: more is slipping than landing — one daily focus block on a single high-value task will move more than a new plan.');
  else if (rate >= 70) lines.push('Discipline read: strong follow-through — you do what you say. Keep protecting that.');
  else lines.push('Discipline read: steady, with room to tighten — pick the one thing above and finish it before adding anything new.');
  return "Here's where your execution stands:\n" + lines.map((l) => `• ${l}`).join('\n');
}

export async function selfRegulation(userId: string): Promise<string> {
  const s = await goalStats(userId).catch(() => ({ done: 0, open: 0, deferred: 0, avoided: null }));
  return buildSelfReg(s);
}

/**
 * coherence.ts — ORB's Coherence Engine (#28): keeping every layer internally consistent. Synthesis
 * combines the pieces; Coherence makes sure they don't contradict each other. The core question is
 * "does everything fit together?" — stated priorities vs. actual behavior, goals vs. values, plans vs.
 * actions. The classic gap: "health is important" + never exercises; "customer first" + slow support.
 *
 * Two parts, both honest about scope:
 *  - detectCoherenceGaps(): a REAL check over the goals ORB already stores. A goal the person keeps
 *    calling important but keeps deferring is a measured stated-vs-done gap — no model needed.
 *  - COHERENCE_DIRECTIVE: the reasoning frame for broader alignment questions (mission vs. reality,
 *    value conflicts) that draws on the user's stored goals, values, and purpose.
 */
import type { Goal } from './goals.js';

export type CoherenceGap = { action: string; importance: number; deferrals: number; note: string };

/**
 * Find goals where what the person SAYS matters (importance) is contradicted by what they DO
 * (repeated deferral). High importance + repeated deferral = the stated priority isn't being lived.
 * Pure and deterministic so it's directly testable; sorted worst-gap-first.
 */
export function detectCoherenceGaps(goals: Goal[]): CoherenceGap[] {
  const gaps: CoherenceGap[] = [];
  for (const g of goals) {
    if (g.done) continue;
    if (g.importance >= 2 && g.deferrals >= 2) {
      gaps.push({
        action: g.action,
        importance: g.importance,
        deferrals: g.deferrals,
        note: `You've called "${g.action}" important but pushed it ${g.deferrals + 1} times — stated priority and actual time aren't lined up.`,
      });
    }
  }
  // Worst first: weigh how important it's claimed to be against how often it's dropped.
  return gaps.sort((a, b) => (b.importance + b.deferrals) - (a.importance + a.deferrals));
}

/** One-line summary of the gaps for a reply, or '' when everything lines up. */
export function formatCoherence(gaps: CoherenceGap[]): string {
  if (!gaps.length) return '';
  const lines = gaps.slice(0, 3).map((g) => `• ${g.note}`);
  return `A few things don't line up between what you've said matters and where your time is going:\n${lines.join('\n')}`;
}

export const COHERENCE_QUERY = /\b(does (?:this|it|everything|that) (?:all )?(?:fit|line up|add up|make sense together|hang together)|coheren(?:t|ce)|consisten(?:t|cy)|am i (?:being )?consistent|are (?:we|my goals|my values|these) (?:aligned|consistent|in conflict|contradict)|out of (?:sync|alignment)|contradict(?:s|ion|ing)?|conflict(?:s|ing)? (?:with|between)|aligned? with (?:my|our|the)|do my (?:actions|goals|values|priorities)|where am i (?:drifting|misaligned|inconsistent)|mixed (?:signals|messages)|practice what i preach|walk the talk|stated (?:vs|versus) actual)\b/i;

export const COHERENCE_DIRECTIVE = ' Check coherence, not just correctness: look for where things contradict each other — stated priorities vs. how time is actually spent, goals vs. values, mission vs. reality, this plan vs. their other goals. Where you have their goals, values, or purpose, compare against them and name any gap plainly and kindly (e.g. "you call X important but keep deferring it"). Don\'t invent conflicts; if it all lines up, say so. End with the single smallest correction that would bring the most back into alignment.';

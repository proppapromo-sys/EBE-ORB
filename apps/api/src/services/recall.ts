/**
 * recall.ts — ORB's Cosmic Memory Engine (#43): so nothing learned is ever permanently lost. Continuity
 * (#42) preserves context; this preserves LEARNING and, above all, retrieves it at the moment it
 * applies. Civilization compounds because knowledge survives — without memory every generation starts
 * over. The frame is a memory hierarchy: Events (what happened) → Lessons (what was learned) →
 * Principles (what stays true) → Wisdom (what should guide the future), and the retrieval question
 * "what have we seen before that applies here?".
 *
 * Real, not just framing: the retrieval runs over the lessons ORB already earns and stores (lessons.ts,
 * orb_lessons), surfacing the relevant ones when the user asks if anything like this has come up before.
 * Distinct from #35 (which captures lessons and answers "what have I learned about X") — this is the
 * "does this remind you of anything we've been through?" retrieval lens plus the hierarchy directive.
 * Honest scope: ORB threads one user's memory; a civilization-scale shared archive needs durable
 * multi-user state it doesn't yet run.
 */

// "have we seen this before", "does this remind you of anything", "anything like this in the past"
export const RECALL_QUERY = /\b(have (?:we|i) (?:seen|been through|dealt with|faced|hit) (?:this|something like this|anything like this)|seen this before|does this remind you|remind you of (?:anything|something)|anything like this (?:before|in the past)|when (?:have|did) (?:we|i) (?:see|face|deal with) (?:this|something similar)|what (?:do|did) we (?:know|learn) from (?:past|before|last time)|has this (?:come up|happened) before|sound familiar|ring a bell|last time (?:this|we|something)|history repeat)\b/i;

export const COSMIC_MEMORY_DIRECTIVE = ' Treat memory as a hierarchy, not a log: distinguish the one-off event (what happened) from the lesson (what was learned), the principle (what stays true), and the wisdom (what should guide the next call) — and lead with the highest tier that applies. Ask "what have we seen before that applies here?": connect this to past experience, what was learned then, and what carries over now. Be honest about retrieval integrity — how confident you are it\'s the same situation, and what context might differ — so a remembered lesson informs without overfitting to a case that isn\'t actually parallel.';

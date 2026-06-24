/**
 * resonance.ts — ORB's Resonance Engine (#29): amplification. Synthesis combines and Coherence keeps
 * it consistent; Resonance asks "what, if reinforced, makes the whole greater than the sum of its
 * parts?". Like pushing a swing in rhythm, small inputs at the right point compound: the strength to
 * lean into, the habit that lifts everything else, the message that lands, the few leverage points
 * where a little more energy resonates through the whole system.
 *
 * Directive engine — it steers the council to find what to amplify (and what dampens the signal),
 * drawing on the user's goals, strengths, and momentum already in context. Adds no store.
 */
export const RESONANCE_QUERY = /\b(amplif(?:y|ies|ication)|what'?s working|double down|lean into|what should i (?:do more|focus more)|reinforce|momentum|what'?s resonating|resonat(?:e|es|ing|ance)|leverage points?|highest leverage|force multiplier|compound(?:s|ing)? (?:my|the|our)|what lands|where (?:do i|should i) put more|play to (?:my|our) strengths?|biggest lever|what (?:gives|gets) the most)\b/i;

export const RESONANCE_DIRECTIVE = ' Find what to amplify, not just what to add: identify the few strengths, habits, messages, or moves already working that — reinforced — would lift everything else (the leverage points where a little more energy resonates through the whole). Name what to double down on AND what is dampening the signal and could be removed. Favor compounding a proven strength over starting something new. Be concrete: which one or two things, and the next push that makes them resonate further.';

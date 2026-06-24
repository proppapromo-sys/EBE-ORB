/**
 * awakening.ts — ORB's Awakening Engine (#48): expanding the frame of reference itself. Learning adds
 * information; awakening changes perception. Many limits aren't lack of intelligence but limited
 * perspective — the realization that the current model is incomplete is where every paradigm shift
 * begins (old understanding → contradiction → insight → new understanding). The move is to surface the
 * hidden assumption, the missing variable, the blind spot the person can't see from inside their frame.
 *
 * Distinct from #36 discovery (generate/test hypotheses about external unknowns) and #30 transcendence
 * (break past a known constraint): this is the reframe lens turned on the asker\'s OWN seeing — "what am
 * I assuming that might be wrong?", "what would someone who sees this differently notice?". Directive
 * engine; steers the council to challenge the frame, adds no store.
 */
export const AWAKENING_QUERY = /\b(blind ?spots?|what am i (?:not seeing|missing here|assuming|too close to)|what (?:assumption|belief)s? (?:am i|are we) (?:making|taking for granted)|what (?:would|might) (?:i|we) (?:be )?(?:wrong about|missing)|see (?:this|it) differently|different (?:lens|frame|angle|perspective)|reframe|other way to (?:see|look at)|challenge (?:my|our|the) (?:thinking|assumptions?|frame)|what would (?:someone|a (?:skeptic|critic|outsider)|the other side) (?:say|see|think)|am i (?:too close|missing something|stuck in)|stuck in (?:my|our|a) (?:thinking|head|frame|way)|shift (?:my|the) perspective|new way of seeing|what'?s the thing i can'?t see|open my eyes|paradigm)\b/i;

export const AWAKENING_DIRECTIVE = ' Challenge the frame, not just the answer: assume the current way of seeing this is incomplete and look for the blind spot the person can\'t see from inside it. Name the hidden assumption they\'re treating as fact, the variable they\'ve left out, and what someone who genuinely disagrees — a skeptic, an outsider, the other side — would notice first. Offer at least one real reframe that makes the situation look different, and say what would change if it\'s right. Be honest and specific rather than contrarian for its own sake: the goal is a perspective shift that reveals something true they hadn\'t considered, plus how to check whether it holds.';

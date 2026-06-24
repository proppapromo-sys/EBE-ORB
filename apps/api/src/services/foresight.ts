/**
 * foresight.ts — ORB's Reality Navigation & Strategic Foresight (#15): not predicting the future, but
 * preparing for it. There is no single future — there are possible, probable, and preferred ones. When
 * the user looks ahead, ORB sketches scenarios (best / likely / worst), names the trend or weak signal
 * driving each, and recommends how to POSITION now — the move that pays off across futures, plus the
 * cheap option that preserves flexibility. Observe → orient → forecast → position → act → adapt.
 */
export const FORESIGHT_QUERY = /\b(what'?s (?:coming|next|the future)|where (?:is|are|will) .+ (?:heading|going|be)|future of|the trend|trends?\b|forecast|scenario|what (?:should i|could i|might) (?:prepare for|expect|see coming)|position (?:myself|for|us)|opportunit(?:y|ies) (?:ahead|emerging|coming)|risks? (?:ahead|emerging|on the horizon)|in (?:five|ten|\d+) years|long[- ]term outlook|get ahead of|disrupt|what'?s (?:emerging|next for))\b/i;

export const FORESIGHT_DIRECTIVE = ' Think like a strategic navigator, not a fortune-teller: sketch the plausible futures — best case, most-likely, worst case — with rough odds; name the trend or weak signal driving each (what is accelerating vs declining). Then say how to POSITION now: the move that pays off across several of those futures, and the cheap option that preserves flexibility if you are wrong. Prepare and position; don\'t just predict.';

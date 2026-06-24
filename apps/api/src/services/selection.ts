/**
 * selection.ts — ORB's Possibility Selection Engine (#54): choosing which future to pursue. Possibilities
 * are infinite, resources are finite, so choice is the real constraint. Where #44 Possibility GENERATES
 * the option space and #4 Decision handles a single "should I X or Y?", #54 is selection ACROSS many
 * options: evaluate and prioritize by value, risk, feasibility, impact, and alignment to purpose; make
 * opportunity cost explicit (choosing one path means not choosing others); and think in a portfolio of
 * bets (safe / growth / transformational) rather than betting everything on one.
 *
 * Directive engine; leans on the user's stored purpose/values for the alignment filter. Steers the
 * council to rank and choose rigorously, not just list. No store.
 */
export const SELECTION_QUERY = /\b(which (?:one|option|path|future|opportunity|project|of these) should (?:i|we)|how (?:do|should) (?:i|we) (?:choose|decide|prioriti[sz]e) (?:between|among|across)|prioriti[sz]e (?:between|among|across|these|the|my|our)|what (?:should|do) (?:i|we) (?:focus on|pursue|pick) (?:first|out of|among)|rank (?:these|the|my|our) (?:options|opportunities|projects|priorities)|opportunity cost|highest (?:priority|value|leverage) (?:option|bet|move)|where (?:should|do) (?:i|we) (?:put|focus|invest) (?:my|our) (?:time|money|resources|effort|energy)|what'?s the best use of|too many (?:options|things|projects)|which bets?|portfolio of)\b/i;

export const SELECTION_DIRECTIVE = ' Select, don\'t just list: when there are several options, evaluate them against each other on what matters here — value/impact, probability, feasibility, cost, risk, and alignment with their purpose and values — and make a clear recommendation, not a menu. Make opportunity cost explicit: choosing one path means giving up others, so name what each choice forecloses. Where it fits, frame it as a portfolio — a safe bet, a growth bet, a transformational bet — rather than all-or-nothing on one. Favor the small choice with outsized long-term leverage, and end with the one to pursue first and why.';

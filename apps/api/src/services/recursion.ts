/**
 * recursion.ts — ORB's Recursion Engine (#47): intelligence applying its own processes to itself. Most
 * systems improve performance; this improves the process that produces the performance — and then the
 * process that improves that. Self-reference: model the model, learn how you learn, go up a level. The
 * core move is climbing the recursive ladder (fix the thing → improve how you produce the thing →
 * improve how you improve) rather than staying at the object level.
 *
 * Distinct from #6 meta-cognition (how do I know this, how confident — reasoning about a single belief)
 * and #16 architecture (ORB describing its own stack): this is the leverage move of operating one level
 * up — on the system that generates the outcomes, not just the outcomes. Applies as readily to the
 * user (improve how you decide, not just this decision) as to ORB itself. Directive engine; no store,
 * and honest that ORB does not literally rewrite its own code at runtime — the human and build loop do.
 */
export const RECURSION_QUERY = /\b(improve (?:the|my|our|your|how (?:i|we|you)) (?:improve|process|learning|system|method|approach)|how (?:do|should) (?:i|we|you) (?:learn how|improve how|get better at getting better)|the process (?:itself|that (?:produces|creates|generates))|go up a level|one level up|meta[- ]?level|second[- ]?order (?:improvement|change|fix)|model the model|the system (?:that|behind the)|(?:fix|work on|improve|change|address) the (?:system|process)\b|fix (?:the|how) (?:we|i|you) (?:work|decide|operate)|recursi(?:on|ve)|improve the improvement|optimize how (?:i|we|you) (?:learn|improve|decide)|better at (?:learning|deciding|improving))\b/i;

export const RECURSION_DIRECTIVE = ' Go up a level, don\'t just solve the instance: as well as the immediate fix, look at the process that produced it and how that process could improve — fix the thing, then improve how the thing gets made, then how that improvement happens. Ask what would make the next hundred decisions better, not only this one (better system → better outcomes, compounding). Where it fits, turn the lens reflexively: how do we know this, how is that working, and what would upgrade the method itself? Keep it concrete — name the one change at the process level that pays off repeatedly rather than once.';

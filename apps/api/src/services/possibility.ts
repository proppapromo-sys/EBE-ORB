/**
 * possibility.ts — ORB's Infinite Possibility Engine (#44): exploring the futures that could exist.
 * Memory protects the past; possibility creates the future. Most ask "what is?"; this asks "what could
 * be?" and navigates the space of potential futures, opportunities, and innovations. Reality isn't one
 * future but many branching ones — so the frame maps them (probable / possible / preferred / avoidable),
 * generates distinct scenarios (best / expected / worst / breakthrough), and scores each path by impact,
 * probability, difficulty, benefit, and risk to find the future most worth creating.
 *
 * Distinct from #15 foresight (positioning / what's coming) and the decision engine (choosing between
 * options already on the table): this one GENERATES the option space — what if? why not? what else? —
 * before narrowing. Directive engine; steers the council, adds no store. Honest scope: ORB reasons over
 * scenarios and probabilities, it does not run live Monte-Carlo simulation against external data.
 */
export const POSSIBILITY_QUERY = /\b(what(?:'s| is) possible|what could (?:be|happen|we (?:do|build|become))|possible futures?|alternative (?:futures?|paths?|scenarios?)|scenarios?|best case|worst case|range of (?:outcomes|possibilities)|what are (?:my|the|our) options|explore (?:the )?(?:possibilities|options|what'?s possible)|what if (?:we|i)|why not (?:try|do|build)|what else (?:could|can) (?:we|i)|map (?:out )?(?:the|my|our) (?:options|possibilities|futures)|brainstorm (?:options|possibilities|futures)|the (?:option|possibility|opportunity) space|branching (?:paths|futures|outcomes)|where (?:could|might) this (?:go|lead))\b/i;

export const POSSIBILITY_DIRECTIVE = ' Open the possibility space before narrowing: don\'t jump to one answer — generate a few genuinely distinct futures from here (a likely case, a strong upside/breakthrough case, and a downside to avoid), and note which are probable vs. merely possible vs. preferred. For the live paths, weigh impact, probability, difficulty, benefit, and risk so the comparison is honest, not just optimistic. Ask "what if / why not / what else?" to surface options that aren\'t obvious. Then land it: of the futures worth pursuing, name the one most worth creating and the first concrete move toward it — possibility is only useful if it becomes a choice.';

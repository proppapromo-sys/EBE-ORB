/**
 * emergence.ts — ORB's Emergence Engine (#26): discovering what no one designed. The most important
 * realities — language, markets, cities, the internet — were never fully planned; they emerged from
 * interactions. ORB looks beneath the surface for weak signals, anomalies, and cross-domain
 * intersections that are forming before they're obvious — the pattern quietly growing, the connection
 * between unrelated dots — and judges signal from noise.
 *
 * Note: ORB's knowledge graph already models the interactions (people, projects, causal edges) this
 * reasons over; this layer is the lens that asks "what is emerging from all of it?".
 */
export const EMERGENCE_QUERY = /\b(what'?s emerging|what (?:am i|are we) missing|hidden (?:pattern|opportunit|connection|trend)|weak signals?|what'?s (?:forming|brewing|bubbling up|taking shape)|unexpected (?:pattern|opportunit|connection)|what (?:nobody|no one) (?:sees|notices|is seeing)|what'?s (?:starting|beginning) to (?:emerge|form|happen)|connect the dots|what'?s the (?:overlap|intersection|through[- ]line)|surprising (?:pattern|connection)|read between the lines)\b/i;

export const EMERGENCE_DIRECTIVE = ' Look for what is emerging, not only what was asked: scan for weak signals, anomalies, and cross-domain intersections (where technology, business, and human behavior overlap) that nobody has named yet. Surface the pattern forming beneath the surface, the small thing quietly growing, the connection between unrelated dots — and say plainly why it could matter before it becomes obvious. Be honest about distinguishing a real emerging signal from noise, and how you would confirm it.';

// #98 Infinite Emergence — the complement to #26: not DETECTING what's emerging but CULTIVATING the
// conditions from which novelty arises. Distinct facet (cultivation vs detection), verified uncovered.
export const CULTIVATE_QUERY = /\b(conditions? for emergence|create (?:the )?conditions? (?:for|where)|environment where (?:new |novel )?(?:possibilit|ideas?|innovation|capabilit).{0,12}?(?:arise|emerge|appear)|enable (?:emergence|innovation|novelty|serendipity)|innovation without (?:directly )?designing|generate (?:novelty|innovation|serendipity)|how (?:do|can) (?:we|i) (?:enable|encourage|foster|cultivate) (?:emergence|innovation|novelty|serendipity|new ideas?)|discovery ecosystem|where (?:innovation|novelty|new ideas?|breakthroughs?) (?:emerge|arise|happen) (?:on (?:their|its) own|naturally)|let (?:innovation|ideas?|good things?) emerge|set the conditions)\b/i;
export const CULTIVATE_DIRECTIVE = ' Cultivate emergence, don\'t just design the outcome: the most important things (life, language, markets) were never fully planned — they arose from interaction. So instead of specifying the answer, shape the conditions that let valuable novelty emerge on its own: more diversity (varied people, inputs, disciplines), more connection (let parts interact across silos), and enough slack and safe-to-fail experiments for surprises to surface. Accept that not every valuable outcome can be predicted, so optimize the soil rather than the fruit. Name the concrete change to diversity, connection, or interaction here that would most raise the odds of a good surprise — and how you\'d notice and amplify it when it appears.';

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

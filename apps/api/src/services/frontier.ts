/**
 * frontier.ts — ORB's Universal Discovery Engine (#52): expanding the frontier of what's known. Honest
 * positioning: this is deliberately NARROW because the bulk of "discovery" is already built — #36 Truth
 * Discovery (hypothesize/test the unknown), #26 Emergence (weak signals forming), and #25 Genesis
 * (whitespace / what should exist). To avoid firing redundant directives on the same questions, #52
 * covers only the facet those don't: the proactive frontier stance — every answer reveals a new
 * frontier, so actively scan for the undiscovered OPPORTUNITY or risk at the edge of the current map
 * (hidden strengths, unexplored adjacencies, the white space others haven't named yet).
 *
 * Directive engine; steers the council toward the edge of the known. Honest scope: ORB reasons toward
 * the frontier over the user's context, it does not autonomously scan external markets or literature —
 * real discovery against the world needs the data feeds ORB doesn't yet ingest.
 */
export const FRONTIER_QUERY = /\b(what(?:'s| is) (?:undiscovered|unexplored|uninvented|at the (?:edge|frontier))|the (?:next )?frontier|what opportunit(?:y|ies) (?:am i|are we) (?:not seeing|missing|overlooking)|(?:hidden|untapped|unrecognized) (?:opportunit|potential|strength|advantage)|white ?space|unexplored (?:territory|adjacenc|opportunit|ground)|what hasn'?t been (?:tried|explored|done|discovered)|undiscovered (?:opportunit|truth|potential)|push (?:the|past the) frontier|edge of (?:what(?:'s| is) known|the map|our knowledge)|what'?s (?:out there|over the horizon) (?:that|we)|uncharted)\b/i;

export const FRONTIER_DIRECTIVE = ' Push toward the frontier, not just the known: treat the current map as incomplete and actively scan its edges for the undiscovered opportunity or risk — the hidden strength, the unexplored adjacency, the white space nobody has named here yet. Ask what hasn\'t been tried, what others in this space are overlooking, and what becomes visible at the boundary of the obvious. Be concrete and honest about confidence (and that real confirmation may need data you don\'t have): name the most promising unexplored edge and the cheapest probe that would reveal whether something real is there.';

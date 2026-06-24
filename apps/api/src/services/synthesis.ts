/**
 * synthesis.ts — ORB's Synthesis Engine (#27): integration, not invention or discovery. Many of the
 * biggest breakthroughs were not made from nothing — they combined existing things in new ways
 * (phone + computer + internet = smartphone). Where Emergence asks "what is forming?", Synthesis asks
 * "how do these separate pieces combine into something greater than the sum of their parts?".
 *
 * ORB's edge here is structural: a single turn already fans out to several models (the council) and
 * draws on the user's goals, values, memory, knowledge graph, and predictions. Synthesis is the frame
 * that fuses those fragments — cross-domain, multi-perspective, multi-agent — into one understanding
 * instead of returning them as separate facts. This is a directive engine; it steers, it adds no store.
 */
export const SYNTHESIS_QUERY = /\b(synthesi[sz]e|combine|integrate|connect (?:these|the|all)|tie (?:it|this|these|everything) together|bring (?:it|this|these|everything) together|put (?:it|this|these) together|pull (?:it|this|these|everything) together|how (?:do|does|can) (?:these|they|all|it|this)\b.{0,20}?(?:fit|combine|connect|relate|come together)|common thread|unify|unified (?:view|picture|understanding)|bigger (?:synthesis|combination)|across (?:domains|disciplines|fields)|intersection of|what'?s the through[- ]line|join the dots|sum of (?:its|the) parts|holistic (?:view|picture))\b/i;

export const SYNTHESIS_DIRECTIVE = ' Synthesize rather than list: combine the separate pieces — across domains, perspectives, and what you already know about this person (their goals, values, memory, and the connections in their world) — into one integrated understanding that is greater than the sum of its parts. Name the specific intersections and the through-line; where perspectives appear to disagree, find the partial truth each holds and fuse them. End on what new becomes possible once these are combined, not just a restatement of each piece.';

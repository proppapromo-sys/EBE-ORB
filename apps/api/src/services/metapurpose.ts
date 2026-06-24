/**
 * metapurpose.ts — ORB's Infinite Recursion of Purpose Engine (#50): purpose beyond completion. Goals
 * get achieved and missions get completed, but purpose keeps deepening. Each level of understanding
 * reveals a larger context, which reveals a larger purpose. The move is to climb the purpose hierarchy
 * (task → goal → mission → purpose → meta-purpose) by repeatedly asking "why does that matter?", and to
 * widen the circle of who it serves (self → org → society → future generations) as capability grows.
 *
 * Distinct from #14 purpose (store/read the user's stated north star) and #22 unified purpose (align one
 * decision to it): this is the recursive DEEPENING — using the why-chain to surface a greater purpose
 * than the one currently named. Directive engine; leans on the user's stored purpose/values, no store.
 */
export const METAPURPOSE_QUERY = /\b(why does (?:that|this|it) (?:matter|really matter|ultimately matter)|what(?:'s| is) the (?:bigger|deeper|real|ultimate) (?:why|purpose|point|reason)|greater purpose|higher purpose|what(?:'s| is) it (?:all )?(?:for|in service of|ultimately about)|what (?:am i|are we) (?:really|ultimately) (?:doing this for|here for)|why (?:do|should) (?:i|we) (?:even )?(?:do|continue|keep going|bother)|deeper meaning|what(?:'s| is) the meaning (?:behind|of)|to what end|the why behind the why|what purpose does (?:this|that) serve|why continue)\b/i;

export const METAPURPOSE_DIRECTIVE = ' Climb the purpose chain, don\'t stop at the goal: take what they\'re doing and keep asking "why does that matter?" up the ladder (task → goal → mission → purpose → the greater purpose beyond it) until you reach the deepest why that still rings true. Where you know their stated purpose and values, connect this back to them — and notice when a larger purpose is coming into view than the one currently named, or when the circle of who it serves could widen (themselves → the people around them → something lasting). Keep it honest and grounded, not grandiose: end on the deeper reason that would actually change how they approach the next step.';

/**
 * harmony.ts — ORB's Harmony Engine (#31): dynamic balance, not stagnation or compromise. Transcendence
 * pushes past limits; Harmony makes sure growth doesn't create instability. Every powerful system faces
 * the same failure mode — optimizing one variable (profit without sustainability, growth without
 * stability, speed without accuracy) until it collapses. Harmony holds the competing forces in
 * equilibrium so progress stays sustainable: health vs. work, revenue vs. team, today vs. the decade.
 *
 * Directive engine — it steers the council to balance the many variables at once rather than maximize
 * one, and to flag where a move strengthens one thing at the cost of another. Adds no store.
 */
export const HARMONY_QUERY = /\b(balance|imbalance|out of balance|work[-/ ]?life|sustainab(?:le|ility)|burn(?:ing)? ?out|burnt out|overextend|spread (?:too )?thin|trade[- ]?off|tradeoffs?|at the (?:expense|cost) of|competing (?:priorities|demands|forces)|too much (?:on|focus on)|juggl(?:e|ing)|equilibrium|harmon(?:y|ious|ize)|stretched thin|stability vs|growth vs|sustainable pace|keep (?:it )?(?:all )?balanced|spread myself|align (?:competing|the|different|everyone'?s|conflicting) (?:interests|goals|priorities|incentives|values|parties)|coexist (?:without|with)|(?:work|fit) together without conflict|find common ground|mutual(?:ly)? benefi|reconcile (?:competing|the|different)|competing (?:goods|interests|values|goals)|how (?:do|can) (?:these|we|they) (?:coexist|align|work together)|win[- ]?win)\b/i;

export const HARMONY_DIRECTIVE = ' Balance the forces, don\'t maximize one: the goal isn\'t maximum output but sustainable flourishing, so weigh the competing variables at once (e.g. health, relationships, purpose, money, learning — or revenue, customers, team, operations) rather than winning one at the cost of the others. For the move in question, say plainly what gets stronger, what gets weaker, and what could become unstable, across both the near term and the long term. Where there\'s strain or burnout risk, name it. Recommend the balanced path that can actually be sustained, not just the one that looks best today.';

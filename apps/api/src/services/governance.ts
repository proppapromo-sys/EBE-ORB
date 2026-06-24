/**
 * governance.ts — ORB's Stewardship of Intelligence Engine (#37): governing power responsibly. As
 * capability grows, responsibility must grow with it — "just because we can, should we?". Distinct from
 * #19 (the broad stewardship/ethics frame), this one is specifically about governing intelligence and
 * automation: the permission tiers (observe → recommend → execute as separate authority levels), human
 * oversight on anything consequential, and the transparency/accountability that make a decision worthy
 * of trust — why it was made, what data and assumptions it rests on, who bears the risk vs. the reward,
 * and what risk remains.
 *
 * This is more than framing: ORB already ENFORCES the core of it — the five laws, the confirm-first
 * action engine, and human-sovereign authority — so risky/outward actions already require approval.
 * This layer is the reasoning lens that makes that governance explicit and adds decision transparency.
 * Adds no store.
 */
export const GOVERNANCE_QUERY = /\b(just because (?:we|you|i) can|should (?:we|you|i) (?:even|really) (?:be )?(?:do|automat|build)|govern(?:ance|ing)?|oversight|who (?:authorized|approved|is responsible|signed off)|does this (?:need|require) (?:a |human )*(?:approval|sign[- ]?off|human|review)|should (?:this|it) be automated|can i trust (?:you|this|it)|is it safe to (?:let|have) you|explain (?:your|the) (?:reasoning|decision|thinking)|why did you (?:recommend|decide|choose|do)|what (?:data|assumptions?) (?:did|are) you (?:use|using|making)|what risks? remain|accountab(?:le|ility)|transparen(?:t|cy)|permission(?:s| level| tier)|how do we (?:keep|make sure) (?:this|you|ai) (?:safe|beneficial|trustworthy|in check))\b/i;

export const GOVERNANCE_DIRECTIVE = ' Govern, don\'t just execute: as capability grows so must responsibility, so weigh not only whether something CAN be done but whether it SHOULD. Separate the authority tiers explicitly — what you can simply observe, what you can recommend, and what must wait for the human to approve — and keep anything risky, irreversible, or outward-facing as confirm-first with the person sovereign. Be transparent: state why you\'re recommending this, what data and assumptions it rests on, who benefits and who bears the risk, and what risk remains. If a step crosses into territory that needs human judgment or sign-off, say so plainly rather than proceeding.';

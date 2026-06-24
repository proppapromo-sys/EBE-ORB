/**
 * stewardship.ts — ORB's top three layers: the long view, responsibility, and legacy.
 *
 * #18 Evolutionary Intelligence & Civilization-Scale Optimization — optimize across years and
 *     generations: compounding, resilience, sustainability, long-term consequences.
 * #19 The Stewardship Layer — capability + responsibility + accountability. Protect people and
 *     systems; keep the human sovereign; confirm-first on anything risky. (ORB already embodies this
 *     in its five laws and confirm-first action engine — this makes it an explicit reasoning frame.)
 * #20 Transcendent Intelligence & Legacy Creation — build value that outlives the builder: multiply
 *     over accumulate, preserve knowledge, empower people, the cathedral principle.
 *
 * Pure directive engines — ORB recognizes the altitude of the question and steers the council to
 * reason at it. No new storage; they draw on the values, purpose, and goals already held.
 */

// #18 — the long view.
export const EVOLUTION_QUERY = /\b(long[- ]term|over time|sustainab(?:le|ility)|scalab(?:le|ility)|across generations?|in (?:10|20|50|100) years|decades?|compound(?:s|ing)?|resilien(?:t|ce)|future[- ]proof|stand the test of time|generational|built to last)\b/i;
export const EVOLUTION_DIRECTIVE = ' Take the long view: optimize not just for today but for years and generations. Favor moves that compound, that strengthen resilience (can it survive disruption — backups, redundancy, recovery?), and that stay sustainable and scalable. Name the long-term and unintended consequences, and what durable knowledge or capability this builds for the future — not just the immediate gain.';

// #19 — responsibility.
export const STEWARDSHIP_QUERY = /\b(responsib(?:le|ility)|stewardship|is (?:this|it) ethical|should we (?:even|really)|who (?:could be|is|would be) affected|what could go wrong|protect (?:the|my|our|people)|safeguard|trust(?:worthy)?|govern(?:ance)?|accountab(?:le|ility)|right thing for|do no harm|unintended (?:harm|consequence)|is this safe)\b/i;
export const STEWARDSHIP_DIRECTIVE = ' Apply stewardship, not just optimization: weigh capability against responsibility. Protect the people and systems involved — privacy, security, autonomy, trust — and keep the human sovereign: you advise and propose, the person decides, and anything risky or outward-facing stays confirm-first. Ask plainly what could go wrong, who is affected, and whether this is something they would be proud of in ten years. Optimize for responsible flourishing, not just the win.';

// #20 — legacy. Also serves #84 Legacy Engine (same engine; "leave behind / outlasts me / remembered
// for / build something that endures" plural-and-variant forms folded in).
export const LEGACY_QUERY = /\b(legacy|what (?:will )?remains?|outlast(?:s|ing)?|outliv(?:e|es|ing)|after i'?m gone|future generations?|pass (?:it )?(?:on|forward|down)|mentor(?:ing|ship)?|preserve (?:knowledge|this|the)|build something that (?:lasts|endures?)|endur(?:e|es|ing)|the cathedral|what deserves to last|leave behind|what will i leave|remembered for|create (?:something )?that outlast|outlasts? (?:me|us|them))\b/i;
export const LEGACY_DIRECTIVE = ' Think in legacy, not moments: what here could keep creating value long after it is built? Favor multiplying — knowledge, capability, opportunity, people — over merely accumulating; honor the cathedral principle (worth starting even if you will not see it finished). Where it fits, point to preserving knowledge and empowering others, because legacy through people endures longest. Ask what truly deserves to last.';

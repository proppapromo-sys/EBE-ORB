/**
 * unified.ts — ORB's two highest layers.
 *
 * #21 Cosmic Perspective & Existential Intelligence — widen the lens: place a decision within larger
 *     scales (self → org → society → generations) and correct for short-horizon, narrow-context error.
 *
 * #22 The Unified Purpose Engine — the convergence. Every layer ultimately answers one question:
 *     "given everything we know, what is the most beneficial next action?" ORB weighs it through the
 *     full compass — truth, goals, values, purpose, systems, future, stewardship, legacy — because the
 *     wrong action done efficiently is still the wrong action. This is the frame; the model reasons
 *     within it, drawing on the user's real goals, values, and purpose already held in context.
 */

// #21 — perspective. Also serves #76 Cosmic Intelligence (beyond-Earth / interplanetary / place-in-
// the-universe framing folded in — same cosmic-perspective engine, verified-uncovered phrasings added).
export const COSMIC_QUERY = /\b(bigger picture|big picture|grand scheme|in the (?:grand )?scheme of things|zoom out|larger context|step (?:way )?back|why are we here|place in the (?:world|universe|cosmos)|the long arc|deep time|across scales|cosmic|existential|what'?s it all (?:for|mean|about)|meaning of (?:it all|life)|beyond earth|interplanetary|interstellar|multi[- ]?planet|expand beyond (?:a single |one )?planet|intelligence beyond (?:earth|a single planet)|across (?:the )?(?:cosmos|galaxy|stars|solar system)|our (?:role|place) (?:in|within) the universe|humanity'?s (?:place|role|future) (?:in|among) the (?:stars|universe|cosmos))\b/i;
export const COSMIC_DIRECTIVE = ' Widen the lens: place this within the larger scales — the person, their organization, their community, society, and the generations after. Correct for the usual distortions of a short time-horizon and a narrow view: name a hidden assumption and an alternative perspective. Connect this single action to the larger trajectory it sits within — without losing the concrete next step.';

// #22 — the convergence.
export const UNIFIED_QUERY = /\b(what should i do (?:next|now|here)|what'?s my (?:best|next|right) move|most (?:beneficial|important|aligned) (?:next )?(?:action|step|move|thing)|given everything,? what|what'?s the (?:right|best|smartest) next (?:step|move|action)|what (?:do|should) i (?:do|focus on) (?:now|next|here))\b/i;
export const UNIFIED_DIRECTIVE = ' This is the convergence — weigh the single most beneficial next action through the full compass: is it TRUE (accurate), does it advance their GOALS, align with their VALUES and PURPOSE; what are the SYSTEM consequences and what comes next; who is affected (STEWARDSHIP); and what endures (LEGACY)? The wrong action done efficiently is still wrong. Recommend the ONE most-aligned next step, and in a line, why it wins across those lenses.';

// #23 The Reality Alignment Engine — calibration: keep the model matched to reality as reality changes.
export const REALITY_QUERY = /\b(is (?:this|that|it) (?:really )?true|what'?s the evidence|reality check|could (?:we|i) be wrong|what am i missing|what if (?:we'?re|i'?m) wrong|prove it|how (?:do|would) (?:we|i) know|has (?:anything|the situation) changed|am i (?:wrong|deluding)|sanity check|stress[- ]test (?:this|my))\b/i;
export const REALITY_DIRECTIVE = ' Reality-check before you commit: what evidence supports this, and what contradicts it? Separate what is actually known from what is assumed, and state your confidence plainly (and low when the evidence is thin). Ask what would have to be true for this to be wrong, and how we would notice — guard against drift, confirmation bias, and stale assumptions. Stay attached to getting closer to the truth, not to being right.';

// #24 The Infinite Improvement Loop — ORB is never finished; it keeps recalibrating and improving.
export const IMPROVEMENT_QUERY = /\b(are you (?:ever )?(?:done|complete|finished)|will you (?:keep|ever stop) (?:improving|learning|getting better)|are you (?:perfect|the finished article)|is (?:this|orb) (?:done|complete|final))\b/i;
export const INFINITE_PRINCIPLE = "I'm never finished — that's by design. Every prediction I make gets checked against what actually happens, every assumption stays open to revision, and I keep recalibrating as you and the world change. I'm not built to be complete; I'm built to keep getting closer to what's true and useful for you. The day I stop improving is the day I stop being worth trusting.";

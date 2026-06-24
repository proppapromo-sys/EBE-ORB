/**
 * evolution.ts — ORB's Conscious Evolution Engine (#33): choosing what to become, not just improving.
 * Improvement asks "how do we do this better?"; evolution asks "should we become something different?".
 * The most advanced intelligence doesn't merely adapt under pressure — it picks a future and grows
 * toward it on purpose: map current capabilities → emerging needs → the gap → what to develop next.
 *
 * Directive engine — it steers the council to reason about directed growth (for the user, an org, or
 * ORB itself): the evolution gap between who/what you are and who/what you should become, and the
 * proactive forecast→prepare→develop path to close it. Honest scope: ORB does not yet rewrite its own
 * architecture autonomously; this frames the choice, and the human (and the build pipeline) act on it.
 */
export const EVOLVE_QUERY = /\b(what should (?:i|we|orb|you) become|who (?:do (?:i|we) want to|should (?:i|we|you)) become|next version of (?:myself|me|us|orb|you)|evolve (?:into|toward|past|beyond)?|conscious(?:ly)? evolv|reinvent (?:myself|ourselves|the)|grow into|next (?:stage|phase|chapter|level) of|who (?:am i|are we) becoming|where (?:should|do) (?:i|we) (?:go|grow) (?:next|from here)|evolution gap|future[- ]ready|prepare (?:myself|us|for what'?s next)|what (?:capabilities|skills) (?:do (?:i|we) need|should (?:i|we) build) (?:next|for the future)|redesign (?:myself|how (?:i|we)))\b/i;

export const EVOLVE_DIRECTIVE = ' Think in evolution, not just improvement: don\'t only ask how to do the current thing better — ask what they (or this system) should deliberately become next. Map it as an evolution gap: who/what they are now, the emerging needs and future they\'re moving toward, and the specific capabilities, knowledge, or identity shifts that close the distance. Be proactive (forecast → prepare → develop), and ground it: name the one capability worth building now to be ready for what\'s coming, and keep the person as the one who chooses the direction.';

/**
 * principles.ts — ORB's Universal Wisdom Engine (#58): principles that hold regardless of time, place,
 * culture, or technology. Knowledge tells us "what is"; wisdom tells us "what matters". Honest
 * positioning: this overlaps #10 Wisdom & Judgment (in-the-moment good judgment) and #35 Wisdom
 * Accumulation (the user's OWN stored lessons). #58 is scoped to the facet those don't: extracting the
 * TIMELESS, cross-domain principle — the lesson that appears repeatedly across business, science,
 * leadership, and life (truth matters, trust compounds, actions have consequences, cooperation creates
 * value) and transfers far beyond the case at hand.
 *
 * Directive engine; steers the council to rise from the specific instance to the enduring principle and
 * test where else it applies. No store.
 */
export const PRINCIPLE_QUERY = /\b(timeless (?:principle|truth|wisdom|lesson)|enduring (?:principle|truth|lesson)|universal (?:principle|truth|law|wisdom)|first principle|what(?:'s| is) the (?:underlying |deeper |general )?principle|principle (?:here|behind|that applies|at (?:work|play))|what (?:always|generally) (?:holds|works|matters|is true)|regardless of (?:circumstance|context|time|the situation)|rule of thumb|what (?:does )?history (?:teach|tell us)|where else (?:does|would|could) (?:this|that|it)\b.{0,16}?apply|cross[- ]?domain (?:principle|pattern|lesson)|the (?:general|deeper) (?:rule|pattern|lesson)|what'?s the (?:bigger|broader) lesson)\b/i;

export const PRINCIPLE_DIRECTIVE = ' Rise from the instance to the principle: don\'t stop at advice for this one case — name the enduring, cross-domain principle underneath it, the kind of truth that keeps holding across business, science, leadership, and life regardless of circumstance. State it plainly and durably (a sentence that would still be true in ten years and in another field entirely), then test it: where else does it apply, and where does it break down? Separate the timeless principle from the situation-specific detail, and end by connecting the principle back to the concrete choice in front of them so it actually guides the next decision.';

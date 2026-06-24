/**
 * principles.ts — ORB's Universal Wisdom Engine (#58) AND Principle Discovery Engine (#72). #72 is the
 * same capability as #58 — extracting timeless, cross-domain principles — framed as "what fundamental
 * LAW governs this?". Rather than a colliding duplicate engine, #72's distinctive phrasings (underlying/
 * fundamental law, fundamental truth, what law explains this pattern, few principles explaining many,
 * the recurrence test) are folded into PRINCIPLE_QUERY here, verified against a coverage check.
 *
 * Honest positioning: this overlaps #10 Wisdom & Judgment (in-the-moment good judgment) and #35 Wisdom
 * Accumulation (the user's OWN stored lessons). #58/#72 is scoped to the facet those don't: rising from
 * the specific instance to the enduring, cross-domain principle/law that keeps holding regardless of
 * circumstance.
 *
 * Directive engine; steers the council to rise from instance to principle and test where else it
 * applies. No store.
 */
export const PRINCIPLE_QUERY = /\b(timeless (?:principle|truth|wisdom|lesson)|enduring (?:principle|truth|lesson)|universal (?:principle|truth|law|wisdom)|first principle|what(?:'s| is) the (?:underlying |deeper |general )?principle|principle (?:here|behind|that applies|at (?:work|play))|what (?:always|generally) (?:holds|works|matters|is true)|regardless of (?:circumstance|context|time|the situation)|rule of thumb|what (?:does )?history (?:teach|tell us)|where else (?:does|would|could) (?:this|that|it)\b.{0,16}?apply|cross[- ]?domain (?:principle|pattern|lesson)|the (?:general|deeper) (?:rule|pattern|lesson)|what'?s the (?:bigger|broader) lesson|(?:underlying|fundamental|deeper|deepest) (?:law|truth)|what (?:law|principle) (?:explains|governs|underlies)|fundamental (?:law|truth|principle)|(?:pattern|principle) (?:appears?|repeats?|recurs?|shows up) (?:repeatedly )?across (?:domains|fields|time)|few principles (?:that )?explain|deeper principle (?:that )?explains)\b/i;

export const PRINCIPLE_DIRECTIVE = ' Rise from the instance to the principle: don\'t stop at advice for this one case — name the enduring, cross-domain principle underneath it, the kind of truth that keeps holding across business, science, leadership, and life regardless of circumstance. State it plainly and durably (a sentence that would still be true in ten years and in another field entirely), then test it: where else does it apply, and where does it break down? Separate the timeless principle from the situation-specific detail, and end by connecting the principle back to the concrete choice in front of them so it actually guides the next decision.';

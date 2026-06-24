/**
 * source.ts — ORB's Source Engine (#45): tracing reality back to where it comes from. Most systems
 * analyze symptoms; advanced ones analyze causes; this one seeks origins — the generating mechanism and
 * conditions that created the effect in the first place. It runs the why-chain (why? why? why?…) down
 * the source hierarchy: Effect → Cause → System → Principle → Source, refusing to stop at the first
 * visible cause when a deeper one is generating it.
 *
 * Distinct from #36 discovery (generate/test hypotheses about the unknown) and #13 systems (map the
 * feedback structure): this is specifically the descent from symptom to origin — "what created the
 * conditions for this?". ORB also has a literal causal tracer in the knowledge graph (graph.ts
 * traceCausal) for entities it has stored; this directive is the general reasoning posture. No store.
 */
export const SOURCE_QUERY = /\b(where (?:does|did) (?:this|it|that)\b.{0,30}?come from|trace (?:it|this|that) back|trace (?:the|its) (?:origin|source|roots?)|the (?:deeper|deepest|underlying|ultimate|original) (?:cause|source|origin|reason|driver)|what (?:created|generated|caused|drives?|is driving|is generating) (?:this|it|that|the)|what'?s (?:underneath|beneath|behind) (?:this|it|that|the)|symptom(?:s)? (?:vs|versus|not the) (?:cause|root|source)|go deeper than|five whys|5 whys|keep asking why|what'?s the (?:source|origin) of|originate(?:s|d)? from|what conditions (?:created|led to|gave rise)|get past the symptom|address the (?:root|source) (?:not|rather than))\b/i;

export const SOURCE_DIRECTIVE = ' Trace this to its source, don\'t stop at the symptom: keep asking why down the chain (effect → cause → system → principle → source) until you reach the generating mechanism — the condition that actually created this, not just the nearest visible cause. Separate the symptom you can see from the origin that produces it, and check whether fixing the surface would just let it regrow from the same root. Name the deepest source you can defend (and how confident you are), then the change at that level — rather than a patch on the symptom — that would actually resolve it.';

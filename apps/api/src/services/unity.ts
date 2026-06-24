/**
 * unity.ts — ORB's Unity Engine (#46): seeing reality as one interconnected whole. Coordination manages
 * relationships, synthesis combines pieces, harmony balances forces — unity recognizes that the
 * relationships themselves are part of a larger whole, that nothing exists in isolation. Many failures
 * come from optimizing a part while ignoring the whole; this frame holds the whole-system view, tracing
 * how a local action ripples across people, processes, markets, and domains that look separate but
 * aren't.
 *
 * Distinct from #13 systems-thinking (map one system's feedback loops and leverage) and #27 synthesis
 * (fuse ideas into one understanding): this is the cross-domain interconnection lens — dependencies and
 * ripple effects ACROSS what appear to be separate systems. ORB\'s knowledge graph already models real
 * cross-entity connections this reasons over. Directive engine; steers, adds no store.
 */
export const UNITY_QUERY = /\b(how (?:does|do) (?:everything|it all|these|all of (?:this|these)) (?:connect|fit together|relate|interrelate|tie together)|everything (?:is )?connected|interconnect(?:ed|ions?)?|interdependen(?:t|ce|cies)|ripple effects?|knock[- ]?on effects?|downstream effects?|how (?:does|will) (?:this|that|it) (?:affect|ripple|cascade) (?:everything|the (?:rest|whole)|across)|the whole (?:system|picture|thing) (?:not|rather than)|whole[- ]system|nothing (?:in|exists in) isolation|part(?:s)? vs (?:the )?whole|optimi[sz]ing (?:the|a|one|each) part|dependencies (?:between|across)|web of|how (?:are|is) (?:these|this) (?:all )?(?:linked|related|connected)|big(?:ger)? interconnected (?:picture|whole)|second[- ]order effects? across)\b/i;

export const UNITY_DIRECTIVE = ' Hold the whole-system view: treat the parts as interconnected, not isolated — nothing here exists on its own. Trace how this local action ripples outward across the people, processes, markets, and domains that look separate but influence each other, and surface the dependencies and second-order effects that a parts-only view would miss. Watch specifically for optimizing one part at the expense of the whole. Then name where in the web of connections the single most beneficial change sits — the point where one move strengthens the whole rather than just a piece of it.';

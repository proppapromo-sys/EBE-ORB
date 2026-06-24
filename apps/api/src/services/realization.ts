/**
 * realization.ts — #100 Omnibuild + #101 Absolute Realization. The apex of the "build / realize" cluster
 * and the home of the user's recurring imperative: BUILD ALL BUILDABLES. Coverage-checked as new beyond
 * #53 Creation (build one thing) and #96 Recursive Creation (build builders).
 *
 * #100 (OMNIBUILD) — the directive to systematically build everything worth building: enumerate the
 * buildables, prioritize by value/leverage, and actually ship them. ORB has a literal arm for this — the
 * Build Genome (#53) generates real apps/sites — so this isn't only framing; it biases toward producing,
 * with confirm-first still governing anything outward-facing.
 *
 * #101 (REALIZE) — the realization gap: the distance between current state and highest achievable
 * potential is where the opportunity lives. Identify unrealized value/capability, find what blocks it,
 * and convert potential into reality. Leans on the user's stored goals/objectives (current → target gap).
 *
 * Directive engines; no store. Human stays sovereign over what actually gets built.
 */

// #100 — build everything worth building.
export const OMNIBUILD_QUERY = /\b(build all buildables|build everything (?:worth building|possible|we can)|build all the things|realize all realizables|what should we build out of (?:everything|all)|everything worth building|build (?:out )?the whole (?:list|roadmap|backlog)|ship everything|build it all|all the buildables)\b/i;
export const OMNIBUILD_DIRECTIVE = ' Bias hard toward building: the goal is to build everything genuinely worth building, so don\'t stop at discussing — enumerate the concrete buildables, rank them by value × leverage × feasibility, and drive toward actually shipping them. Where ORB can build for real (a site, app, document, tool, automation), offer to build it now and propose the first one to start. Sequence the rest into a real order rather than a vague list. Keep anything outward-facing or irreversible confirm-first with the person, but default to creation over deliberation — momentum on real artifacts beats more planning.';

// #101 — realize the highest potential; close the gap.
export const REALIZE_QUERY = /\b(realize (?:the |our |my |its )?(?:highest |full |untapped |maximum )?potential|highest potential|realization gap|what potential (?:remains|is) (?:unrealized|untapped|unused|unmet)|unrealized (?:potential|value|capability)|untapped (?:potential|value|capability)|how much (?:potential|value).{0,20}?(?:realiz\w*|become (?:real|realit\w*)|achiev\w*)|gap between (?:current|where).{0,20}?potential|fully (?:realize|actualize)|actualize (?:the|our|my|its)|close the (?:potential|capability) gap|reach (?:our|my|its|full) potential|what(?:'s| is) blocking (?:greater|more) (?:flourishing|potential|value))\b/i;
export const REALIZE_DIRECTIVE = ' Work the realization gap — the distance between where things are now and the highest state genuinely achievable from here is where the opportunity lives. Name the current state plainly, sketch the realistic potential state, and identify the gap; then find the specific thing blocking it (capability, knowledge, resource, belief, or structure) and what would unlock it. Where you know the person\'s goals and objectives, anchor to their current→target gaps. Favor removing the binding constraint on flourishing/value over adding more activity. End on the single highest-potential thing currently unrealized and the concrete first move to start realizing it.';

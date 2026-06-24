/**
 * orchestration.ts — ORB's Orchestration & Autonomous Execution (#17): turning intelligence into
 * coordinated action. Intelligence without execution is just potential. When the user needs to GET
 * something done, ORB decomposes the goal into an executable plan — the few workstreams, the concrete
 * next actions with sequence and dependencies, what will block it, the single first step, and how
 * success is measured — then governs execution confirm-first (it proposes; the human approves anything
 * that spends money or goes outward).
 *
 * Note: ORB already has the execution primitives — the confirm-first action engine (actions.ts), the
 * risk-gated genome cycle, and proactive alerts. This layer adds the planning/decomposition frame on
 * top. Fully autonomous monitoring/triggering needs a background worker (a separate, infra build).
 */
export const PLAN_QUERY = /\b(plan (?:out |for )|break down |break .+ into (?:steps|tasks)|map (?:out|this out)|lay out (?:a|the|my)|outline (?:a|the|my)|decompose|game ?plan|action plan|road ?map|step[- ]by[- ]step|how (?:do|should) i (?:go about|execute|tackle|approach)|put together a plan|where do i (?:start|begin) with)\b/i;

export const ORCHESTRATION_DIRECTIVE = ' Turn this into an executable plan, not just advice: break the goal into the few key workstreams; under each, list the concrete next actions with a rough sequence and dependencies (what must come first); flag what is most likely to block it; name the single first step to take today; and state how success will be measured. Keep it tight and doable. Anything that spends money or goes outward stays confirm-first — propose it, the user approves.';

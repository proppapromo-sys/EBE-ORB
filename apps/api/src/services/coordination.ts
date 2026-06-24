/**
 * coordination.ts — ORB's Universal Coordination Engine (#39): synchronizing many independent actors
 * without chaos. Most failures aren't intelligence failures, they're coordination failures — projects,
 * teams, and organizations break down when information, incentives, and timing fall out of sync. 100
 * average minds coordinated beat 100 brilliant minds in chaos. This frame is about getting independent
 * decision-makers to act as one coherent system: the right information to the right person at the right
 * time, aligned incentives (most conflict is misaligned incentives), clear who-does-what, and less
 * delay/confusion/waste/conflict at the handoffs.
 *
 * Distinct from #17 (orchestration — sequencing ONE plan's steps) and #12 (collective intelligence —
 * aggregating a group's knowledge): this is alignment ACROSS multiple independent parties. ORB already
 * embodies a piece of it literally — the multi-model council (GPT/Claude/Gemini) is multi-agent
 * coordination toward one answer. Directive engine; steers the reasoning, adds no store.
 */
export const COORDINATION_QUERY = /\b(coordinate (?:between|across|with|the team|everyone|people|stakeholders?)|get everyone (?:on the same page|aligned|in sync|pulling)|(?:keep|stay) (?:everyone|the team|us) (?:in sync|aligned|on the same page)|(?:team|stakeholder|cross[- ]?functional|organi[sz]ational) alignment|align (?:the )?(?:team|stakeholders?|incentives|everyone|people|interests)|who (?:should|does|owns?) (?:do |handle |own )?what|misaligned incentives?|(?:reduce|cut) (?:friction|handoffs?|delays?)|hand[- ]?offs?|everyone pulling in the same direction|getting people (?:aligned|to work together)|silos?|out of sync|step on each other|duplicat(?:e|ed|ing) (?:work|effort)|conflicting priorities across|who needs to know)\b/i;

export const COORDINATION_DIRECTIVE = ' Treat this as a coordination problem, not just a planning one: the goal is independent people or teams acting as one coherent system without friction. Get the right information to the right person at the right time — name who needs to know what. Look hardest at incentives, since most conflict is misaligned incentives rather than bad intent: find the shared interest and the mutually beneficial outcome. Make ownership unambiguous (who decides, who does, who is informed), and call out the handoffs, duplicated effort, silos, or out-of-sync points where coordination tends to break — then the smallest change that reduces that friction.';

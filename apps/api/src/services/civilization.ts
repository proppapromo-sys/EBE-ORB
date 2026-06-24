/**
 * civilization.ts — ORB's Civilization Operating System (#38): coordinating at scale. Every system
 * ORB touches sits inside a larger one, and the largest is human civilization — the structure that lets
 * markets, science, education, and large-scale cooperation exist at all. This frame zooms past the
 * individual and the organization to the systemic level: how knowledge is created, preserved,
 * distributed, and applied; how resources and opportunity flow; how institutions coordinate; and what
 * strengthens resilience and future generations.
 *
 * Directive engine — it steers the council to reason about planetary-scale coordination, second-order
 * effects on institutions and the commons, and what advances/protects civilization. Honest scope: ORB
 * is a per-user system, not a live civilization platform — this is the altitude at which it reasons
 * about society-scale questions, not a claim to coordinate billions. The human stays sovereign. No store.
 */
export const CIVILIZATION_QUERY = /\b(civili[sz]ation|society|societal|humanity|human race|at (?:planetary|civilization|societal|global) scale|institutions?|public (?:good|policy|health)|the commons|future generations?|at scale across|coordinate (?:people|society|institutions|humanity|everyone)|collective (?:action|good)|whole (?:of )?society|social (?:structure|system|infrastructure)|knowledge infrastructure|how (?:do|should) (?:societies|civilizations|institutions|nations) |what (?:benefits|advances|protects) humanity|good of (?:society|humanity|all)|species[- ]level)\b/i;

export const CIVILIZATION_DIRECTIVE = ' Reason at civilization scale here: zoom past the individual and the single organization to the systemic level — how knowledge gets created, preserved, and shared; how resources and opportunity flow; how institutions (schools, hospitals, businesses, governments, communities) coordinate or fail to. Name the second-order effects on the wider system and the commons, what strengthens collective resilience and future generations, and where incentives are misaligned. Keep it grounded in what this person can actually influence, and weigh what genuinely benefits and protects people at scale — with the human sovereign over any large-scale call.';

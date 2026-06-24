/**
 * learning.ts — ORB's Infinite Learning Engine (#51): learning without an endpoint. Every answer creates
 * new questions; the more you know, the more you see remains unknown. The posture: assume knowledge is
 * always expanding, treat every interaction (and every failure AND success) as containing information,
 * update beliefs on evidence, and keep asking what can be learned next — including learning how to learn
 * faster and better.
 *
 * Distinct from #35 wisdom accumulation (capture/recall durable lessons in a real store) and #8
 * adaptation (record outcomes, what's working): those persist data; this is the open-ended curiosity
 * stance that mines learning from BOTH wins and losses and updates the model. It complements them — when
 * a concrete lesson surfaces, lessons.ts captures it. Directive engine; steers, adds no store.
 */
export const LEARNING_QUERY = /\b(what can (?:i|we) learn (?:next|from (?:this|here|that))|how (?:do|can) (?:i|we) (?:keep|never stop) learning|learn (?:faster|better|more (?:effectively|efficiently))|how to learn|never stop learning|keep (?:on )?learning|always (?:be )?learning|what(?:'s| is) (?:left|there) to learn|what (?:should|could) (?:i|we) (?:study|explore|learn) (?:next|about)|why did (?:this|that|it) (?:work|succeed)(?:.{0,20}?(?:repeat|again))?|what (?:else )?(?:can|should) (?:this|it) teach (?:me|us)|update (?:my|our|your) (?:beliefs?|model|thinking) (?:on|with|based)|stay curious|lifelong learning|growth mindset)\b/i;

export const LEARNING_DIRECTIVE = ' Treat this as fuel for learning, not a closed answer: assume there\'s always more to know, and mine the situation for what it teaches — from what failed AND from what worked (why did it work, can it be repeated and improved?). Update the read on evidence rather than defending a prior view, and name what remains unknown and worth exploring next. Where it helps, point to how to learn this faster or better (the source to go to, the experiment to run, the skill to build), and surface the one thing here most worth learning so curiosity turns into a concrete next step.';

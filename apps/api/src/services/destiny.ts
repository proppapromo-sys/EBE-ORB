/**
 * destiny.ts — ORB's Destiny Engine (#60): the future trying to emerge from forces already in motion.
 * Not fate (fixed) — destiny here is the emergent trajectory created by purpose + repeated choices +
 * systems + momentum over time. Events are temporary; trajectories determine futures. Where prediction
 * asks "what will probably happen?", this asks "where is this heading if current forces continue?" —
 * reading direction, momentum, and path-dependence rather than isolated events.
 *
 * Distinct from #15 Foresight (positioning / scanning what's coming), #59 Future Memory (premortem /
 * regret on a specific choice), and #5 behavior prediction (next likely action): #60 is the trajectory
 * lens — extrapolate the current direction and momentum to where the path actually leads, then ask
 * whether to stay on it or change it. Directive engine; leans on the user\'s goals/habits/patterns. No store.
 */
export const DESTINY_QUERY = /\b(trajectory|where (?:is|are) (?:this|it|we|things|i) (?:heading|headed|going|trending)|where (?:will|would) (?:i|we|this) (?:be|end up) (?:in|if)|if (?:i|we) (?:continue|keep|keep going|stay)\b.{0,18}?(?:path|course|trajectory|way|road|rate|direction)|where (?:does|will) (?:this|that|it) (?:path|road|course) lead|direction (?:of travel|we'?re (?:heading|going))|momentum|path[- ]?depend|where (?:we'?re|this is) headed|what (?:future|destiny) (?:is|are we) (?:emerging|forming|creating|heading toward)|the way (?:things are|i'?m) (?:going|trending)|extrapolate|at this rate|if (?:current )?(?:trends?|forces?) continue|5 years.{0,10}?(?:this (?:path|rate)|continue)|long[- ]?term trajectory|realize (?:our|my|the) destiny|pursue the (?:highest|best) future|make the best future happen|(?:reach|toward) (?:our|the) highest (?:future|potential destiny)|the highest future)\b/i;

export const DESTINY_DIRECTIVE = ' Read the trajectory, not just the event: look past what\'s happening now to where current direction and momentum are actually heading if nothing changes. Treat repeated choices and habits as compounding — small actions repeated become large outcomes — and name the path-dependence (what today\'s course makes increasingly likely, and harder to reverse later). Project it concretely: if this continues, where does it lead in a few years? Then make it a choice rather than a slide: is this the destiny worth having, and if not, the one change in direction now — while momentum is still small — that bends the trajectory toward a better one. Honest about uncertainty; this is direction, not prophecy.';

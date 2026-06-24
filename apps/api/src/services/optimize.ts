/**
 * optimize.ts — #73 Infinite Optimization + #74 Evolution Acceleration. Both verified (coverage check)
 * to fill genuine gaps, not duplicate existing engines.
 *
 * #73 (OPT) is the bottleneck/continuous-improvement lens — distinct from #24 Infinite Improvement
 * (ORB's own "never finished" identity) and #47 Recursion (improve the process abstractly). Its core
 * move is theory-of-constraints: every system has one bottleneck; find it, improve THAT (improving
 * non-bottlenecks is wasted), measure → analyze → improve → repeat, and cut waste — while balancing
 * efficiency against resilience/adaptability rather than over-optimizing one.
 *
 * #74 (ACCEL) is about the RATE of progress, not progress itself — "improve how fast we improve". Its
 * lever is cycle time and feedback speed: shorten the loop from idea → impact, remove the delays/
 * friction slowing learning, and treat faster feedback as the multiplier — responsibly (speed balanced
 * with safety and resilience; acceleration without wisdom creates risk).
 *
 * Directive engines; no store.
 */

// #73 — optimize the system: find and fix the bottleneck.
export const OPT_QUERY = /\b(how (?:can|could|do) (?:i|we|this|it) (?:work|run|perform|do) (?:better|more efficiently)|(?:the |a )?bottleneck|(?:binding )?constraint (?:limiting|on|that)|what(?:'s| is) (?:limiting|capping|throttling) (?:performance|throughput|growth|output)|continuous(?:ly)? improve|continuous improvement|highest[- ]?performing version|optimi[sz]e (?:this|the|our|for)|where(?:'s| is) the (?:waste|inefficiency|friction|slack)|streamline|what (?:can|should) be (?:removed|cut|eliminated|trimmed)|make (?:this|it) (?:more efficient|leaner|faster)|theory of constraints|reduce waste|biggest inefficiency)\b/i;
export const OPT_DIRECTIVE = ' Optimize by the bottleneck, not everywhere at once: a system\'s output is capped by its single binding constraint, so find that bottleneck first — improving anything else is mostly wasted effort. Name the constraint, the change that relieves it, and how you\'d measure whether throughput actually rose (measure → improve → re-find the new bottleneck → repeat). Cut what adds no value, but don\'t over-optimize one dimension into fragility — balance efficiency with resilience and adaptability. End on the single highest-leverage improvement to make next, and what it would unlock.';

// #74 — accelerate the RATE of progress: shorten the loop.
export const ACCEL_QUERY = /\b(faster|speed (?:this|it|things) up|accelerate|acceleration|improve faster|learn faster|move faster|what(?:'s| is) (?:slowing|holding back|delaying) (?:us|progress|this|me)|what(?:'s| is) taking (?:too|so) long|cycle time|time (?:from|to) (?:idea|market|impact)|feedback (?:loop|speed|cycle)|tighten the loop|shorten the (?:loop|cycle|feedback)|rate of (?:progress|improvement|learning|change)|rate limiter|what could move (?:faster|quicker)|ship (?:faster|quicker)|reduce (?:the )?(?:delay|lag|time))\b/i;
export const ACCEL_DIRECTIVE = ' Work on the rate of progress, not just progress: the goal is to improve how FAST things improve. Look at cycle time and feedback speed — how long from idea to impact, and how quickly results teach you something — because faster feedback compounds into faster learning. Find the specific delay, friction, or wait-state slowing the loop and the change that tightens it. Treat speed as a multiplier but a responsible one: balance it against safety and resilience, since acceleration without wisdom creates risk. Name the one change that would most shorten the loop without breaking it.';

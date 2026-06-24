/**
 * recursivecreation.ts — ORB's Recursive Creation Engine (#96): creation that becomes self-generating.
 * Coverage-checked as new: distinct from #47 Recursion (improve the process one level up) and #53
 * Creation (build the thing). The core move is meta-creation — build the thing that builds more things:
 * a builder is valuable, a builder of builders is transformational. Favor capability creators over
 * outputs, exponential leverage over linear output, systems/platforms/skills that generate more of
 * themselves.
 *
 * Fittingly, ORB embodies a literal version: the Build Genome (#53) ships real apps, and this layer is
 * the directive to prefer building the generator over the artifact. Directive engine; no store.
 */
export const RECREATE_QUERY = /\b(systems? that (?:create|build|generate|make) (?:systems?|more)|build(?:ers?)? of builders?|creator of creators?|create (?:more )?(?:builders?|creators?)|builder of builders?|things? that (?:keep|continue) building|build (?:something|a system|a thing) that (?:keeps |continues? )?build|what (?:can|could) build more builders|(?:knowledge|intelligence|capability|skills?) that (?:creates?|improves?|generates?) (?:more )?(?:knowledge|intelligence|capability|skills?|itself)|self[- ]?(?:improving|expanding|generating|replicating)|exponential (?:capability|leverage|growth) (?:rather|not|instead)|capability (?:creators?|multiplier)|leverage that (?:creates?|compounds into) (?:more )?leverage|recursive (?:creation|capability|growth)|build (?:the )?(?:builder|generator|platform) (?:not|rather than) (?:the |just )?(?:output|the thing))\b/i;

export const RECREATE_DIRECTIVE = ' Build the thing that builds more things, not just the output: a builder is valuable, a builder of builders is transformational. Where there\'s a choice, favor the capability creator over the one-off result — the platform, system, skill, or process that generates more of itself — and look for exponential leverage (each unit of effort creating more future capability) rather than linear output. Ask what, once built, would keep producing value or producing new builders with less and less input from you. Stay grounded: name the concrete builder-of-builders move with the highest multiplication, and the first real step to stand it up.';

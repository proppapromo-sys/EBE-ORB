/**
 * preservation.ts — ORB's Legacy of Reality Engine (#41): ensuring progress endures across generations.
 * Civilizations are judged not by what they create but by what remains. Where #20 frames legacy as
 * multiplying lasting value (the cathedral principle) and #35 captures one person's lessons, this layer
 * is specifically about PRESERVATION and TRANSMISSION: protecting beneficial knowledge, systems, and
 * values from being lost, and transferring them forward — institutional memory that survives people
 * leaving, documenting what's too important to lose, and thinking on a generational horizon (decades,
 * not quarters). Legacy isn't freezing the past; it's preserving the best while letting it evolve.
 *
 * Directive engine that draws on what ORB already preserves for real (memories, lessons, knowledge
 * graph, stated values/purpose). Honest scope: ORB persists a single user's context well, but true
 * cross-generational, organization-wide archival memory would need shared multi-user state and durable
 * archives it doesn't yet run. This steers the reasoning toward durability; the human decides what lasts.
 */
export const PRESERVATION_QUERY = /\b(preserve|preservation|don'?t lose|not (?:get )?lost|institutional memory|knowledge transfer|capture (?:this|the|our) (?:knowledge|learnings?|process|context)|document (?:this|it|the|our) (?:for|so)|what (?:must|should) (?:survive|endure|outlast|be preserved|be remembered)|too important to lose|pass (?:down|on) the knowledge|hand (?:this|it) (?:down|over to)|before (?:it'?s|they'?re|we'?re) (?:gone|lost|forgotten)|when (?:people|they|someone) leaves?|continuity|archive|for (?:future|the next) (?:generation|team|owner)|generational|decades? from now|centur|stand the test of time|keep this from being forgotten)\b/i;

export const PRESERVATION_DIRECTIVE = ' Think about what must endure, not just what works now: protect and transfer the beneficial knowledge, systems, and values here so they survive the people who made them. Ask what is too important to lose and how to capture it (documentation, institutional memory, mentoring) so the same lessons aren\'t relearned when someone leaves. Stretch the horizon to decades and the next generation/owner, not just this quarter. Preserve the best while letting it evolve — legacy is not freezing the past. Name the one thing worth documenting or handing forward now so today\'s progress still creates value long after.';

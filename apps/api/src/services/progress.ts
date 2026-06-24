/**
 * progress.ts — #85 Infinite Continuity + #86 Eternal Evolution. The source frames these as a matched
 * pair: continuity ensures progress never STOPS; eternal evolution ensures it never STAGNATES. They're
 * two halves of one idea — keeping progress both alive and improving across time — so they share one
 * engine. (Coverage-checked: #42 Continuity, #24 Infinite Improvement, #33 Conscious Evolution, and #73
 * Optimization left these "progress never stops / never stagnates / reinvent before obsolescence"
 * phrasings uncovered.)
 *
 * The stance: survival/continuity alone breeds stagnation and repetition; lasting progress needs
 * periodic reinvention — challenge the assumptions, remake the system before it goes obsolete, no final
 * ceiling. Directive engine; no store.
 */
export const PROGRESS_QUERY = /\b(progress never (?:stops?|stalls?|stagnates?|ends?)|keep progress (?:going|alive|moving)|never stop(?:s|ping)? (?:improving|evolving|growing|progressing)|avoid (?:stagnation|complacency|obsolescence|stagnating)|how do we (?:keep|never stop) (?:improving|evolving|growing) (?:forever|over time)?|never stagnate|stops? evolving|becomes? obsolete|periodic reinvention|reinvent\w* (?:before|ourselves|the (?:system|business|org))|what needs (?:to be )?reinvent\w*|keep (?:improving|evolving) forever|continuous improvement (?:without|forever|across)|how (?:does|do) (?:progress|civilization|we) (?:continue|keep) (?:improving|across (?:time|generations|centuries))|avoid (?:rigidity|decline))\b/i;

export const PROGRESS_DIRECTIVE = ' Keep progress both alive and improving: continuity alone breeds repetition and stability alone breeds stagnation, so the goal isn\'t just to sustain what works but to keep it getting better. Ask what assumptions have gone stale and what would need reinventing before it slides into obsolescence — anything that stops evolving eventually does. Favor periodic reinvention over clinging to the current form, and treat improvement as having no final ceiling. Be concrete and honest, not just aspirational: name the specific thing here at risk of stagnating, and the next reinvention or improvement that keeps it moving forward.';

/**
 * antifragility.ts — ORB's Antifragility Engine (#34): gaining from disorder. Robust withstands shocks;
 * antifragile improves because of them (Stress + Learning + Adaptation = Strength). Reality is volatile,
 * so systems that need perfect conditions eventually break. The frame treats stress as INFORMATION —
 * it reveals weaknesses, bottlenecks, and single points of failure — and turns failure into knowledge:
 * redundancy and fallbacks, small experiments to avoid large blowups, optionality (keep future moves
 * open), and portfolio thinking to spread risk.
 *
 * Directive engine — it steers the council to ask "how can this adversity become an advantage?" and to
 * stress-test for hidden fragility (concentration, dependency, single points of failure) before it
 * bites. ORB already embodies some of this structurally (never-throw services, in-memory fallbacks,
 * the multi-model council as redundancy); this makes it an explicit reasoning lens. Adds no store.
 */
export const ANTIFRAGILE_QUERY = /\b(antifragil(?:e|ity)|stronger (?:from|through|because of)|gain from (?:disorder|stress|chaos|volatility)|what (?:if|happens (?:if|when)) .{0,40}?(?:fails?|drops?|breaks?|goes wrong|collapses?)|single point of failure|concentration risk|dependency risk|what could break|stress[- ]?test|fail[- ]?safe|redundan(?:t|cy)|fallback|contingency|worst[- ]?case|too dependent on|over[- ]?reliant|optionality|keep (?:my|our) options open|hedge|spread the risk|resilien(?:t|ce) (?:to|against)|bounce back|recover (?:from|faster)|learn from (?:this )?failure|turn (?:this|it|adversity|the setback) (?:into|to) (?:an? )?(?:advantage|strength)|setback)\b/i;

export const ANTIFRAGILE_DIRECTIVE = ' Look for antifragility, not just survival: ask how this stress, failure, or uncertainty could be turned into an advantage. Treat the problem as information — what weakness, bottleneck, or single point of failure does it reveal? Favor moves that add redundancy and fallbacks, that prefer small reversible experiments over one big irreversible bet, and that preserve optionality (keep future moves open) and spread concentration/dependency risk. Where something failed, harvest the lesson into a concrete change. Stress-test the plan: name what happens if the key assumption, dependency, or input breaks — and what would make the system come out stronger, not just intact.';

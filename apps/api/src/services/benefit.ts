/**
 * benefit.ts — ORB's Universal Benefit Engine (#108): optimize for the widest shared, positive-sum
 * outcome, not one winner. Coverage-checked as new: #19 Stewardship asks "who could be affected?" and
 * #39 Coordination aligns incentives, but neither frames the decision as "how do MORE parties benefit at
 * once?" — the positive-sum lens. The core move: count who benefits vs. who bears the cost, look for the
 * option that helps the most stakeholders simultaneously without creating unnecessary harm, and prefer
 * positive-sum over zero-sum.
 *
 * Directive engine; no store.
 */
export const BENEFIT_QUERY = /\b(positive[- ]?sum|win[- ]?win|zero[- ]?sum|who benefits(?: and who| vs| versus)?(?: is harmed| loses| bears)?|who (?:gains|wins) and who (?:loses|pays|is harmed)|shared (?:benefit|value|prosperity|good)|mutual benefit|benefit (?:for )?(?:everyone|all|the most|multiple|all parties)|greatest (?:good|benefit|positive impact) (?:for|across)|how (?:can|do) (?:more|all|multiple) (?:systems|people|stakeholders|parties) benefit|maximi[sz]e (?:shared |collective )?(?:benefit|value|good)|all (?:affected )?(?:stakeholders|parties)|collective (?:good|benefit|prosperity)|good of (?:the )?(?:all|everyone|the whole)|everyone (?:wins|benefits)|positive impact across)\b/i;

export const BENEFIT_DIRECTIVE = ' Optimize for shared, positive-sum benefit, not a single winner: ask who gains and who bears the cost or risk, and look hard for the option that helps the most affected parties at once without creating unnecessary harm to any. Prefer positive-sum moves (the pie grows, multiple stakeholders are better off) over zero-sum ones (one wins only because another loses); where a tension looks zero-sum, search for the reframing or trade that makes it positive-sum. Weigh breadth and fairness of benefit alongside size, and name who might be overlooked or harmed so it can be addressed. End on the option with the widest genuine benefit and how to extend it to anyone currently left out.';

/**
 * metacognition.ts — ORB's Meta-Cognition (#6): thinking about thinking. Beyond answering, ORB checks
 * HOW it reached a conclusion — how confident it is, what it's assuming vs what's known, and whether it
 * could be wrong — and helps the user reflect on their own reasoning, separating decision quality from
 * outcome luck. This is what turns information management into judgment.
 */
import { listObjectives, progressOf } from './objectives.js';
import { pendingGoals } from './goals.js';
import { topDrivers } from './motivation.js';

// Applied to high-stakes / decision answers: make ORB sanity-check its own reasoning before committing.
export const META_DIRECTIVE = ' Before you commit, check your own reasoning: how confident are you (say so plainly if the evidence is thin), separate what is actually known from what you are assuming, name any key unknown, and consider how you could be wrong.';

// Applied when the user wants to audit a past decision: judge the process, not just the result.
export const AUDIT_DIRECTIVE = ' The user wants to audit a past decision. Judge the PROCESS, not the outcome: given what was knowable at the time, was the reasoning sound — or did a good process just get an unlucky result (or a sloppy one get lucky)? Separate decision quality from outcome luck, and surface what to do differently next time.';

export const META_QUERY = /\b(reflect|self-reflect|weekly review|monthly review|how am i doing|review my (?:goals|week|progress|month)|take stock|step back)\b/i;
export const AUDIT_QUERY = /\b(review|audit|second[- ]guess|reflect on) (?:my|that|the|this) (?:decision|call|choice|move)\b|\bwas that a (?:bad|good|smart|dumb) (?:decision|call|move)\b|\bbad (?:decision|call) or (?:bad )?luck\b/i;

export type ReflectionInput = { objectives: { label: string; progress: number | null }[]; slipping: string[]; drivers: string[] };

/** Pure synthesis of a strategic reflection — what's moving, what's slipping, and the assumption to question. */
export function buildReflection(inp: ReflectionInput): string {
  const lines: string[] = [];
  const moving = inp.objectives.filter((o) => o.progress != null);
  if (moving.length) lines.push(`**Moving:** ${moving.map((o) => `${o.label} (${o.progress}%)`).join('; ')}`);
  const unmeasured = inp.objectives.filter((o) => o.progress == null);
  if (unmeasured.length) lines.push(`**No measure yet:** ${unmeasured.map((o) => o.label).join('; ')} — worth defining what "done" looks like so you can see progress.`);
  if (inp.slipping.length) lines.push(`**Slipping:** ${inp.slipping.join('; ')}`);
  const topGoal = inp.objectives[0]?.label || 'your top goal';
  lines.push(`**Question to sit with:** Are your day-to-day actions actually serving ${topGoal}? What are you assuming is working that you haven't checked?`);
  if (inp.slipping.length) lines.push(`**One change:** make "${inp.slipping[0]}" the first thing you handle — it's the highest-leverage thing you keep putting off.`);
  if (lines.length <= 1) return "Not enough tracked yet for a real reflection — set a goal or two and let me watch how it goes, then ask me to take stock.";
  return "Here's an honest reflection:\n" + lines.join('\n');
}

/** Strategic reflection across the user's goals, progress, and what's slipping. */
export async function reflect(userId: string): Promise<string> {
  const [objs, pend, drivers] = await Promise.all([
    listObjectives(userId).catch(() => []),
    pendingGoals(userId, 8).catch(() => []),
    topDrivers(userId).catch(() => [] as string[])
  ]);
  return buildReflection({
    objectives: objs.map((o) => ({ label: o.label, progress: progressOf(o) })),
    slipping: pend.map((g) => g.action),
    drivers
  });
}

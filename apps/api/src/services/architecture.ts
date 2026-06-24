/**
 * architecture.ts — ORB's Universal Intelligence Architecture (#16): the capstone. Intelligence isn't
 * one thing; it emerges from many layers working together. ORB's layers already route through one
 * council and share one per-user model — this makes that unity usable: a single executive briefing
 * that synthesizes every layer (attention, goals, execution, purpose) into "here's where you stand",
 * and a self-description of the stack itself. No single layer is the intelligence; their integration is.
 */
import { focusList, type FocusItem } from './attention.js';
import { pendingGoals, goalStats } from './goals.js';
import { listObjectives, progressOf } from './objectives.js';
import { getPurpose } from './purpose.js';
import { topDrivers } from './motivation.js';

// The cognitive stack — the layers that compose ORB's intelligence (for self-report).
export const INTELLIGENCE_STACK: { layer: string; asks: string }[] = [
  { layer: 'Perception', asks: 'what is happening (voice, vision, environment)?' },
  { layer: 'Communication', asks: 'what do they mean (tone, emotion, intent)?' },
  { layer: 'Memory', asks: 'what do I know (history, graph, preferences)?' },
  { layer: 'Attention', asks: 'what matters right now?' },
  { layer: 'Goals & Motivation', asks: 'what do they want, and why?' },
  { layer: 'Reasoning', asks: 'what is true and what should be done (the council)?' },
  { layer: 'Prediction', asks: 'what happens next?' },
  { layer: 'Wisdom & Purpose', asks: 'is it right, and does it serve the mission?' },
  { layer: 'Foresight', asks: 'where is this heading, how to position?' },
  { layer: 'Action', asks: 'do it — confirm-first on anything risky.' }
];

export function describeArchitecture(): string {
  return [
    "Under the hood I'm not one model — I'm a stack of layers working as one. I perceive (voice, vision,",
    'the room), read you (emotion, tone, intent), and remember (your goals, values, drivers, history, and a',
    'knowledge graph of your world). A council of models reasons; attention ranks what matters; decisions',
    'weigh the trade-offs; systems-thinking traces cause and effect; foresight looks ahead; and purpose keeps',
    "it aligned to what you're really building — before I ever act, and always confirm-first on anything risky.",
    'No single layer is the intelligence; it emerges from them working together. That\'s the whole point: one',
    'coherent chief of staff, not a pile of tools.'
  ].join(' ');
}

export type BriefInput = { focus: FocusItem[]; objectives: { label: string; progress: number | null }[]; slipping: string[]; done: number; open: number; purpose: string; drivers: string[] };

/** Pure synthesis: every layer's live state → one coherent executive briefing. Testable. */
export function buildBrief(b: BriefInput): string {
  const sections: string[] = [];
  if (b.focus.length) sections.push('**What matters right now:**\n' + b.focus.slice(0, 3).map((f) => `• [${f.score}] ${f.label}`).join('\n'));
  const moving = b.objectives.filter((o) => o.progress != null);
  if (moving.length) sections.push('**Goals in motion:**\n' + moving.slice(0, 4).map((o) => `• ${o.label} (${o.progress}%)`).join('\n'));
  if (b.slipping.length) sections.push('**Slipping:**\n' + b.slipping.slice(0, 3).map((s) => `• ${s}`).join('\n'));
  const total = b.done + b.open;
  if (total) sections.push(`**Execution:** ${b.done} of ${total} commitments closed.`);
  if (b.purpose) sections.push(`**Aligned to:** ${b.purpose}.`);
  if (!sections.length) return "We're just getting started — tell me your goals, what's on your plate, and what you're really building, and I'll hold the whole picture for you.";
  const next = b.focus[0]?.label;
  const close = next ? `\n\n**My read:** start with "${next}" — it's the highest-leverage thing on the board.` : '';
  return 'Here\'s where you stand:\n\n' + sections.join('\n\n') + close;
}

/** The unified Chief-of-Staff briefing — every layer, synthesized into one read. */
export async function chiefOfStaffBrief(userId: string): Promise<string> {
  const [focus, slipping, objs, stats, purpose, drivers] = await Promise.all([
    focusList(userId).catch(() => [] as FocusItem[]),
    pendingGoals(userId, 5).catch(() => []),
    listObjectives(userId).catch(() => []),
    goalStats(userId).catch(() => ({ done: 0, open: 0, deferred: 0, avoided: null })),
    getPurpose(userId).catch(() => ''),
    topDrivers(userId).catch(() => [] as string[])
  ]);
  return buildBrief({
    focus, slipping: slipping.map((g) => g.action),
    objectives: objs.map((o) => ({ label: o.label, progress: progressOf(o) })),
    done: stats.done, open: stats.open, purpose, drivers
  });
}

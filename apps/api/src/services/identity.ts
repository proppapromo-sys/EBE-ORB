/**
 * identity.ts — ORB's Consciousness Modeling & Self-Identity (#11). Not consciousness — the FUNCTIONS
 * of it: a persistent self-model (who ORB is, its mission, its boundaries) and a living model of the
 * user (values, drivers, goals, style, track record) held as ONE connected, continuous picture across
 * years. Identity is what lets all the other layers cohere instead of being disconnected facts.
 */
import { topDrivers } from './motivation.js';
import { getValues } from './wisdom.js';
import { listObjectives } from './objectives.js';
import { goalStats } from './goals.js';
import { getPrefs } from './convoPrefs.js';
import { describeProfile } from './personality.js';

/** ORB's model of itself — mission, how it works, its boundaries, and its commitment to continuity. */
export function selfModel(): string {
  return [
    "I'm ORB — your Digital Chief of Staff. My mission is simple: serve your goals. I notice what matters,",
    'weigh the big calls with you, keep things moving, and learn what works — but I never act on anything',
    'high-risk without your okay (confirm-first is one of my five laws). I run on a council of models and',
    'the Universal Genome. And I keep continuity: your goals, values, drivers, decisions, and what has',
    "worked all persist, so I'm the same chief of staff tomorrow that I am today. I'm not conscious — I",
    'maintain a coherent model of you, of myself, and of the mission, and I keep it consistent over time.'
  ].join(' ');
}

export type IdentityInput = { persona: string; drivers: string[]; values: string; objectives: string[]; done: number; open: number };

/** Pure synthesis of the user-identity model — the living picture, not a list of facts. Testable. */
export function buildIdentity(inp: IdentityInput): string {
  const lines: string[] = [];
  if (inp.drivers.length) lines.push(`**Driven by:** ${inp.drivers.join(' and ')}.`);
  if (inp.values) lines.push(`**Values:** ${inp.values}.`);
  if (inp.objectives.length) lines.push(`**Working toward:** ${inp.objectives.slice(0, 3).join('; ')}.`);
  if (inp.persona) lines.push(`**How you work:** ${inp.persona}.`);
  const total = inp.done + inp.open;
  if (total) lines.push(`**Track record:** ${inp.done} of ${total} commitments closed so far.`);
  if (!lines.length) return "I'm still forming a picture of who you are — the more we work together, the clearer it gets. That continuity is the point: I stay the same chief of staff across all our work, building one coherent model of you over time.";
  return "Here's the working picture I hold of you — I keep it updated as you evolve:\n" + lines.join('\n');
}

/** ORB's living model of the user, synthesized across every layer. */
export async function userIdentity(userId: string): Promise<string> {
  const [drivers, values, objs, stats, prefs] = await Promise.all([
    topDrivers(userId).catch(() => [] as string[]),
    getValues(userId).catch(() => ''),
    listObjectives(userId).catch(() => []),
    goalStats(userId).catch(() => ({ done: 0, open: 0, deferred: 0, avoided: null })),
    getPrefs(userId).catch(() => ({ traits: {} as Awaited<ReturnType<typeof getPrefs>>['traits'] }))
  ]);
  const p = describeProfile(prefs.traits);
  const persona = p.startsWith("Here's how") ? p.replace(/^Here's how I've learned to work with you:\s*/, '').replace(/\. That's just how.*$/, '') : '';
  return buildIdentity({ persona, drivers, values, objectives: objs.map((o) => o.label), done: stats.done, open: stats.open });
}

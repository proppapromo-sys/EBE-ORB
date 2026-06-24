/**
 * objectives.ts — ORB's Goal Systems layer. A chief of staff doesn't just ask "what do you want?" but
 * "what are you trying to accomplish?". Humans are gap-closing machines: a goal is a desired future
 * state, and the gap from where you are now drives action. ORB tracks that gap, the goal hierarchy
 * (Identity → Strategic → Tactical), the goal type (outcome / performance / process), progress toward
 * target, and conflicts between competing goals — so it knows not just what you're doing, but what
 * you're trying to become. (Daily tasks live in goals.ts; this is the layer above them.)
 *
 * Per-user, Supabase-backed (orb_objectives) with an in-memory fallback. Never throws.
 */
import { supabase } from './supabase.js';

export type GoalLevel = 'identity' | 'strategic' | 'tactical';
export type GoalType = 'outcome' | 'performance' | 'process';
export type Objective = { id: string; label: string; level: GoalLevel; type: GoalType; start?: number; current?: number; target?: number; unit?: string; created: number; updated: number };

const cache = new Map<string, Map<string, Objective>>();
function omap(userId: string): Map<string, Objective> { let m = cache.get(userId); if (!m) { m = new Map(); cache.set(userId, m); } return m; }
const idOf = (label: string) => label.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '').replace(/\b(the|a|an|my|to|our|of)\b/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);

// Parse "$50k", "50,000", "20%", "1.2m" → a number; null if none.
export function parseNum(s: string): number | null {
  const m = /(\d+(?:[.,]\d+)?)\s*([km%])?/i.exec((s || '').replace(/[$,]/g, (c) => (c === ',' ? '' : '')));
  if (!m) return null;
  let v = parseFloat(m[1]); if (!isFinite(v)) return null;
  const suf = (m[2] || '').toLowerCase();
  if (suf === 'k') v *= 1000; else if (suf === 'm') v *= 1_000_000;
  return v;
}

const IDENTITY = /\b(i am|i'?m|become|be (?:an?|the))\b.*\b(entrepreneur|investor|owner|founder|leader|ceo|expert|builder|creator)\b|\bbecome (?:an?|the)\b/i;
const TACTICAL = /\b(launch|create|hire|set up|build (?:a|the|my)|design|write|ship|release|open|fix|migrate|publish)\b/i;
const STRATEGIC = /\b(grow|scale|expand|double|triple|increase|reach|hit|revenue|market share|profit|customers|business|brand)\b/i;
export function classifyLevel(text: string): GoalLevel {
  if (IDENTITY.test(text)) return 'identity';
  if (STRATEGIC.test(text)) return 'strategic';
  if (TACTICAL.test(text)) return 'tactical';
  return 'strategic';
}
const PROCESS = /\b\d+\s+\w+\s+(?:per|a|each)\s+(?:day|week|month)\b|\bevery (?:day|week|morning)\b|\bdaily\b/i;
const PERFORMANCE = /\bby\s+\d+\s*%|\b(increase|improve|reduce|cut|boost|raise)\b.*\bby\b|\b\d+\s*%/i;
export function classifyType(text: string): GoalType {
  if (PROCESS.test(text)) return 'process';
  if (PERFORMANCE.test(text)) return 'performance';
  return 'outcome';
}

/** Pull a structured objective out of a stated goal, or null if it isn't one. */
export function parseObjective(text: string): Omit<Objective, 'id' | 'created' | 'updated'> | null {
  const t = (text || '').trim();
  const lead = /\b(?:goal is to|goal is|want to|trying to|aim to|plan to|hoping to|working (?:on|toward)|i need to grow|let'?s)\s+/i;
  if (!lead.test(t) && !/\bmy (?:goal|objective|target)\b/i.test(t)) return null;
  let label = t.replace(/^.*?\b(?:goal is to|goal is|want to|trying to|aim to|plan to|hoping to|working (?:on|toward))\s+/i, '').trim() || t;
  label = label.replace(/\s+from\s+\$?[\d.,km%]+\s+to\s+\$?[\d.,km%]+.*$/i, '').replace(/\s+(?:to|reach|hit)\s+\$?[\d.,km%]+.*$/i, '').replace(/[.!?]+$/, '').trim() || label;
  let start: number | undefined, target: number | undefined, unit: string | undefined;
  const fromTo = t.match(/from\s+(\$?[\d.,]+\s*[km]?%?)\s+to\s+(\$?[\d.,]+\s*[km]?%?)/i);
  if (fromTo) { start = parseNum(fromTo[1]) ?? undefined; target = parseNum(fromTo[2]) ?? undefined; }
  else { const to = t.match(/\b(?:to|reach|hit|of|at)\s+(\$?[\d.,]+\s*[km]?%?)/i); if (to) target = parseNum(to[1]) ?? undefined; }
  if (/\$/.test(t)) unit = '$'; else if (/%/.test(t)) unit = '%';
  return { label, level: classifyLevel(t), type: classifyType(t), start, current: start, target, unit };
}

async function load(userId: string): Promise<Map<string, Objective>> {
  const m = omap(userId);
  if (m.size || !supabase) return m;
  try {
    const { data } = await supabase.from('orb_objectives').select('*').eq('user_id', userId);
    for (const r of data ?? []) m.set(r.id, { id: r.id, label: r.label, level: r.level, type: r.type, start: r.start ?? undefined, current: r.current ?? undefined, target: r.target ?? undefined, unit: r.unit ?? undefined, created: Date.parse(r.created) || Date.now(), updated: Date.parse(r.updated) || Date.now() });
  } catch { /* in-memory only */ }
  return m;
}
async function persist(userId: string, o: Objective): Promise<void> {
  if (!supabase) return;
  try { await supabase.from('orb_objectives').upsert({ user_id: userId, id: o.id, label: o.label, level: o.level, type: o.type, start: o.start ?? null, current: o.current ?? null, target: o.target ?? null, unit: o.unit ?? null, created: new Date(o.created).toISOString(), updated: new Date(o.updated).toISOString() }, { onConflict: 'user_id,id' }); }
  catch { /* keep in-memory */ }
}

export async function setObjective(userId: string, parsed: ReturnType<typeof parseObjective>): Promise<Objective | null> {
  if (!parsed) return null;
  const id = idOf(parsed.label); if (id.length < 2) return null;
  const map = await load(userId); const now = Date.now();
  const existing = map.get(id);
  const o: Objective = existing
    ? { ...existing, ...parsed, start: existing.start ?? parsed.start, updated: now }
    : { id, created: now, updated: now, ...parsed };
  map.set(id, o); await persist(userId, o);
  return o;
}

/** Move the needle on a tracked goal — "revenue is now $40k". Returns the updated objective. */
export async function updateProgress(userId: string, labelOrMetric: string, value: number): Promise<Objective | null> {
  const map = await load(userId); const key = idOf(labelOrMetric);
  let best: Objective | undefined;
  for (const o of map.values()) if (o.id.includes(key) || key.includes(o.id) || o.label.toLowerCase().includes(labelOrMetric.toLowerCase())) { best = o; break; }
  if (!best) return null;
  best.current = value; if (best.start == null) best.start = value; best.updated = Date.now();
  await persist(userId, best);
  return best;
}

/** Percent of the gap closed (current vs target, from the starting point). Null if not measurable. */
export function progressOf(o: Objective): number | null {
  if (o.current == null || o.target == null) return null;
  const start = o.start ?? 0;
  if (o.target === start) return o.current >= o.target ? 100 : 0;
  return Math.max(0, Math.min(100, Math.round(((o.current - start) / (o.target - start)) * 100)));
}

export async function listObjectives(userId: string, level?: GoalLevel): Promise<Objective[]> {
  const order: GoalLevel[] = ['identity', 'strategic', 'tactical'];
  const all = [...(await load(userId)).values()];
  return (level ? all.filter((o) => o.level === level) : all).sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level));
}

// Competing goals: classic work-growth vs personal-life tension.
const WORK = /\b(grow|scale|expand|revenue|business|work|hustle|launch|clients|profit|empire)\b/i;
const LIFE = /\b(family|kids|wife|husband|partner|health|rest|balance|time off|vacation|sleep|gym|hobby|friends)\b/i;
export function detectConflicts(objs: Objective[]): [string, string][] {
  const out: [string, string][] = [];
  for (let i = 0; i < objs.length; i++) for (let j = i + 1; j < objs.length; j++) {
    const a = objs[i].label, b = objs[j].label;
    if ((WORK.test(a) && LIFE.test(b)) || (LIFE.test(a) && WORK.test(b))) out.push([a, b]);
  }
  return out;
}

export function formatObjectives(objs: Objective[]): string {
  if (!objs.length) return "I'm not tracking any goals for you yet — tell me what you're working toward (e.g. \"my goal is to grow revenue to $50k/month\").";
  const lines = objs.map((o) => {
    const p = progressOf(o);
    const bar = p == null ? '' : ` — ${p}% there${o.unit === '$' ? ` (${o.current ?? '?'} → ${o.target})` : o.target != null ? ` (${o.current ?? '?'} → ${o.target}${o.unit || ''})` : ''}`;
    return `• [${o.level}] ${o.label}${bar}`;
  });
  const conflicts = detectConflicts(objs);
  if (conflicts.length) lines.push('', `⚖️ Possible tension: "${conflicts[0][0]}" vs "${conflicts[0][1]}" — worth deciding which wins when they collide.`);
  return 'Here\'s what you\'re working toward:\n' + lines.join('\n');
}

/** A compact line of the user's goals to hand the model, so it frames answers around what they serve. */
export async function goalsContext(userId: string): Promise<string> {
  const objs = (await listObjectives(userId)).slice(0, 4);
  if (!objs.length) return '';
  return `The user's active goals (connect your answer to these where genuinely relevant, don't force it): ${objs.map((o) => o.label).join('; ')}.`;
}

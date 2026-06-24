/**
 * motivation.ts — ORB's Motivation Engine. Goals answer "what do I want?"; motivation answers "why am
 * I willing to work for it?". Two people chasing $1M may be driven by freedom, status, or security —
 * same goal, different psychology. ORB learns which drivers persist for a user (Achievement, Freedom,
 * Security, Legacy) and frames why things matter, how it encourages, and how it weighs trade-offs in
 * those terms. Motivations persist even as goals change.
 *
 * Per-user, Supabase-backed (orb_motivation) with an in-memory fallback. Learned from the words the
 * user chose to use — never from private speech. Never throws.
 */
import { supabase } from './supabase.js';

export type Driver = 'achievement' | 'freedom' | 'security' | 'legacy';
export type DriverState = { s: number; n: number };
export type Motivation = Partial<Record<Driver, DriverState>>;

const cache = new Map<string, Motivation>();
const DECAY = 0.85, RATE = 0.15;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

const SIGNALS: { k: Driver; re: RegExp }[] = [
  { k: 'achievement', re: /\b(win|winning|succeed|success|achieve|achievement|growth|best|results?|performance|level up|crush(?:ing)?|dominate|milestone|beat the|ambitious|excel|number one|top of)\b/i },
  { k: 'freedom', re: /\b(freedom|independent|independence|flexible|flexibility|autonomy|my own (?:boss|terms|time|schedule)|on my (?:own )?terms|no boss|be free|escape the|options|untethered|call my own shots)\b/i },
  { k: 'security', re: /\b(security|secure|stable|stability|safe|safety|protect|protection|predictable|certainty|backup|savings|cushion|peace of mind|risk[- ]averse|steady|rainy day|fallback)\b/i },
  { k: 'legacy', re: /\b(legacy|impact|influence|contribution|contribute|change the world|give back|lasting|generations?|my (?:kids|children|family)'?s future|mission|purpose|meaning|leave behind|build something (?:that lasts|bigger)|matter)\b/i }
];

const LABEL: Record<Driver, string> = {
  achievement: 'achievement — progress and wins',
  freedom: 'freedom — autonomy and control',
  security: 'security — stability and peace of mind',
  legacy: 'legacy — lasting impact and contribution'
};

async function load(userId: string): Promise<Motivation> {
  if (cache.has(userId)) return cache.get(userId)!;
  let m: Motivation = {};
  if (supabase) {
    try {
      const { data } = await supabase.from('orb_motivation').select('drivers').eq('user_id', userId).maybeSingle();
      if (data?.drivers && typeof data.drivers === 'object') m = data.drivers as Motivation;
    } catch { /* in-memory */ }
  }
  cache.set(userId, m); return m;
}
async function persist(userId: string, m: Motivation): Promise<void> {
  if (!supabase) return;
  try { await supabase.from('orb_motivation').upsert({ user_id: userId, drivers: m, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }); }
  catch { /* keep in-memory */ }
}

/** Read the drivers a message hints at and fold them into the running profile. */
export async function observeMotivation(userId: string, text: string): Promise<void> {
  const hits = SIGNALS.filter((s) => s.re.test(text || '')).map((s) => s.k);
  if (!hits.length) return;
  const m = { ...(await load(userId)) };
  for (const k of hits) { const cur = m[k] ?? { s: 0, n: 0 }; m[k] = { s: clamp01(cur.s * DECAY + RATE), n: Math.min(999, cur.n + 1) }; }
  cache.set(userId, m); await persist(userId, m);
}

/** Explicitly set a driver as primary (a strong, immediate signal). */
export async function setDriver(userId: string, k: Driver): Promise<void> {
  const m = { ...(await load(userId)) };
  m[k] = { s: 1, n: Math.max(3, (m[k]?.n ?? 0) + 1) };
  cache.set(userId, m); await persist(userId, m);
}

function confident(d?: DriverState): boolean { return !!d && d.n >= 2 && d.s >= 0.25; }

/** The drivers that have been earned, strongest first. */
export async function topDrivers(userId: string): Promise<Driver[]> {
  const m = await load(userId);
  return (Object.keys(m) as Driver[]).filter((k) => confident(m[k])).sort((a, b) => (m[b]!.s) - (m[a]!.s));
}

/** A quiet directive so the model frames why-it-matters and encouragement around the user's drivers. */
export async function motivationDirective(userId: string): Promise<string> {
  const top = (await topDrivers(userId)).slice(0, 2);
  if (!top.length) return '';
  return ` The user is driven mainly by ${top.map((k) => LABEL[k]).join(' and ')}. Where it fits naturally, frame why things matter, your encouragement, and trade-offs in those terms — never force it.`;
}

/** Plain-language read-back of what drives the user. */
export async function describeMotivation(userId: string): Promise<string> {
  const top = await topDrivers(userId);
  if (!top.length) return "I'm still learning what really drives you — it'll come through as we work together. Nothing about it is stored beyond a few simple signals.";
  const names = top.slice(0, 3).map((k) => LABEL[k].split(' — ')[0]);
  const last = names.pop()!;
  const joined = names.length ? `${names.join(', ')}, and ${last}` : last;
  return `What seems to drive you most: ${joined}. I keep that in mind in how I prioritize and encourage — say "I'm driven by <freedom/security/achievement/legacy>" to set it directly.`;
}

/** Detect an explicit "I'm driven by X" statement and return the driver. */
export function parseDriver(text: string): Driver | null {
  if (!/\b(i'?m driven by|what (?:drives|motivates) me is|my (?:motivation|driver|main driver) is|i care most about)\b/i.test(text)) return null;
  for (const s of SIGNALS) if (s.re.test(text)) return s.k;
  if (/\bstatus|recognition|respect\b/i.test(text)) return 'achievement';
  return null;
}

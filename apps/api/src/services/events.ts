/**
 * events.ts — ORB's behavioral event log + habit detection. The foundation under behavior prediction
 * and self-regulation: a timestamped record of what actually happens, so ORB can learn the user's
 * patterns (cue → action → reward → repeat) rather than only inferring from stated goals. Time-of-day
 * and day-of-week clustering turns repeated activity into a recognized habit.
 *
 * Per-user, Supabase-backed (orb_events) with an in-memory fallback. Never throws.
 */
import { supabase } from './supabase.js';

export type OrbEvent = { kind: string; label: string; at: number };
const cache = new Map<string, OrbEvent[]>();
const MAX = 200;
function elist(userId: string): OrbEvent[] { let a = cache.get(userId); if (!a) { a = []; cache.set(userId, a); } return a; }

export async function logEvent(userId: string, kind: string, label = ''): Promise<void> {
  const e: OrbEvent = { kind, label: (label || '').slice(0, 80), at: Date.now() };
  const a = elist(userId); a.push(e); if (a.length > MAX) a.splice(0, a.length - MAX);
  if (supabase) { try { await supabase.from('orb_events').insert({ user_id: userId, kind: e.kind, label: e.label, at: new Date(e.at).toISOString() }); } catch { /* in-memory */ } }
}

async function load(userId: string): Promise<OrbEvent[]> {
  const a = elist(userId);
  if (a.length || !supabase) return a;
  try {
    const { data } = await supabase.from('orb_events').select('kind,label,at').eq('user_id', userId).order('at', { ascending: false }).limit(MAX);
    for (const r of (data ?? []).reverse()) a.push({ kind: r.kind, label: r.label, at: Date.parse(r.at) || Date.now() });
  } catch { /* in-memory */ }
  return a;
}
export async function recentEvents(userId: string, n = 20): Promise<OrbEvent[]> { return (await load(userId)).slice(-n); }

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function hourBand(h: number): string {
  if (h < 5) return 'late night'; if (h < 8) return 'early morning'; if (h < 12) return 'morning';
  if (h < 14) return 'midday'; if (h < 18) return 'afternoon'; if (h < 21) return 'evening'; return 'night';
}
function phrase(kind: string, label: string, when: string): string {
  if (kind === 'active') return `You're usually active in the ${when}.`;
  const what = label || kind;
  return `You tend to ${what} in the ${when}.`;
}

/** Pure: cluster repeated events by time-of-day / day-of-week into recognized habits. Testable. */
export function analyzePatterns(events: OrbEvent[], minN = 3): string[] {
  const groups = new Map<string, OrbEvent[]>();
  for (const e of events) { const k = `${e.kind}|${e.label}`; if (!groups.has(k)) groups.set(k, []); groups.get(k)!.push(e); }
  const out: string[] = [];
  for (const [, evs] of groups) {
    if (evs.length < minN) continue;
    const bands: Record<string, number> = {}, days: Record<string, number> = {};
    for (const e of evs) { const d = new Date(e.at); bands[hourBand(d.getHours())] = (bands[hourBand(d.getHours())] || 0) + 1; const wd = DAYS[d.getDay()]; days[wd] = (days[wd] || 0) + 1; }
    const [topBand, bc] = Object.entries(bands).sort((a, b) => b[1] - a[1])[0];
    const { kind, label } = { kind: evs[0].kind, label: evs[0].label };
    if (bc / evs.length >= 0.5) out.push(phrase(kind, label, topBand));
    const [topDay, dc] = Object.entries(days).sort((a, b) => b[1] - a[1])[0];
    if (evs.length >= 4 && dc / evs.length >= 0.5) out.push(`${label || kind} tends to land on ${topDay}.`);
  }
  return out.slice(0, 5);
}

export async function habitPredictions(userId: string): Promise<string[]> { return analyzePatterns(await load(userId)); }

export function formatPatterns(patterns: string[]): string {
  if (!patterns.length) return "I'm still building a picture of your routines — the more we work together, the more patterns I'll spot.";
  return 'Patterns I\'ve noticed in how you work:\n' + patterns.map((p) => `• ${p}`).join('\n');
}

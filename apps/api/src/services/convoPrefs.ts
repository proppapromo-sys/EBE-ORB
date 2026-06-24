/**
 * convoPrefs.ts — Adaptive Conversation Memory. Learns *how* a user likes to talk with ORB (not
 * what they say privately): preferred answer length, their natural pause before finishing a thought,
 * and the short commands they reach for most. Per-user, Supabase-backed (orb_convo_prefs) with an
 * in-memory fallback. Never throws.
 *
 * Privacy: this stores small preference signals only — answer-length, a pause number, and short
 * commands the user deliberately issued TO ORB. No raw audio, no transcripts of background speech.
 * Long or private-looking sentences are never recorded; ORB only ever receives the finished text the
 * user chose to send.
 */
import { supabase } from './supabase.js';
import { applySignals, type Traits } from './personality.js';

export type ConvoStyle = 'short' | 'detailed';
// Humor Levels — graduated, the way a chief of staff dials their register to the relationship.
export type HumorLevel = 'professional' | 'executive' | 'friendly' | 'playful';
export const HUMOR_LEVELS: HumorLevel[] = ['professional', 'executive', 'friendly', 'playful'];
export type ConvoPrefs = { style: ConvoStyle; pauseMs: number; commands: Record<string, number>; wit: boolean; humor: HumorLevel; traits: Traits };
const DEFAULTS: ConvoPrefs = { style: 'short', pauseMs: 1600, commands: {}, wit: true, humor: 'executive', traits: {} };

function levelToWit(h: HumorLevel): boolean { return h !== 'professional'; }
function witToLevel(w: boolean): HumorLevel { return w ? 'executive' : 'professional'; }

const TABLE = 'orb_convo_prefs';
const cache = new Map<string, ConvoPrefs>();

const MAX_COMMANDS = 24;            // keep only the user's most-used phrasings
const MAX_CMD_WORDS = 8;            // a "command" is short; longer text is private speech — never stored

function clone(p: ConvoPrefs): ConvoPrefs {
  return { style: p.style, pauseMs: p.pauseMs, commands: { ...p.commands }, wit: p.wit, humor: p.humor, traits: { ...p.traits } };
}

export async function getPrefs(userId: string): Promise<ConvoPrefs> {
  if (cache.has(userId)) return clone(cache.get(userId)!);
  if (supabase) {
    try {
      const { data } = await supabase.from(TABLE).select('style,pause_ms,commands,wit,humor,traits').eq('user_id', userId).maybeSingle();
      if (data) {
        const wit = data.wit !== false;   // on by default
        const humor: HumorLevel = HUMOR_LEVELS.includes(data.humor) ? data.humor : witToLevel(wit);   // migrate legacy
        const p: ConvoPrefs = {
          style: data.style === 'detailed' ? 'detailed' : 'short',
          pauseMs: Number(data.pause_ms) || DEFAULTS.pauseMs,
          commands: (data.commands && typeof data.commands === 'object') ? data.commands as Record<string, number> : {},
          wit: levelToWit(humor), humor,
          traits: (data.traits && typeof data.traits === 'object') ? data.traits as Traits : {}
        };
        cache.set(userId, p); return clone(p);
      }
    } catch { /* fall back */ }
  }
  return clone(DEFAULTS);
}

export async function getStyle(userId: string): Promise<ConvoStyle> {
  return (await getPrefs(userId)).style;
}

export async function setPrefs(userId: string, patch: Partial<ConvoPrefs>): Promise<ConvoPrefs> {
  const cur = { ...(cache.get(userId) ?? DEFAULTS), ...patch };
  cur.pauseMs = Math.max(800, Math.min(3000, cur.pauseMs));   // keep it sane
  cur.commands = cur.commands ?? {};
  cur.traits = cur.traits ?? {};
  // Keep the graduated humor level and the legacy wit flag in lockstep, whichever side was set.
  if (patch.humor !== undefined) cur.wit = levelToWit(cur.humor);
  else if (patch.wit !== undefined) cur.humor = witToLevel(cur.wit);
  cache.set(userId, cur);
  await persist(userId, cur);
  return clone(cur);
}

/**
 * One observation per message: learn the user's favorite phrasing AND nudge their communication
 * tendencies, then persist once. Privacy: only short commands are stored; trait signals are derived
 * from the finished text the user sent — never background speech, never raw audio.
 */
export async function observeMessage(userId: string, text: string): Promise<void> {
  const cur = cache.get(userId) ? clone(cache.get(userId)!) : clone(DEFAULTS);
  const key = normalizeCommand(text);
  if (key) {
    cur.commands[key] = (cur.commands[key] || 0) + 1;
    const entries = Object.entries(cur.commands).sort((a, b) => b[1] - a[1]);
    if (entries.length > MAX_COMMANDS) cur.commands = Object.fromEntries(entries.slice(0, MAX_COMMANDS));
  }
  cur.traits = applySignals(cur.traits, text);
  cache.set(userId, cur);
  await persist(userId, cur);
}

/** Forget the learned profile — clears tendencies and remembered commands. Explicit prefs are kept. */
export async function resetProfile(userId: string): Promise<void> {
  const cur = cache.get(userId) ? clone(cache.get(userId)!) : clone(DEFAULTS);
  cur.traits = {};
  cur.commands = {};
  cache.set(userId, cur);
  await persist(userId, cur);
}

/** Reduce a command to a stable, comparable form. Returns '' for anything that isn't a short command. */
function normalizeCommand(text: string): string {
  const t = (text || '').trim().toLowerCase().replace(/[?.!,]+$/g, '').replace(/\s+/g, ' ');
  if (!t) return '';
  const words = t.split(' ');
  if (words.length > MAX_CMD_WORDS) return '';   // too long to be a "command" — treat as private speech
  return t;
}

/**
 * Learn a favorite phrasing: bump the count for a short command the user just issued. Silently
 * ignores anything too long (private speech) so we only ever remember deliberate, repeated commands.
 */
export async function recordCommand(userId: string, text: string): Promise<void> {
  const key = normalizeCommand(text);
  if (!key) return;
  const cur = cache.get(userId) ? clone(cache.get(userId)!) : clone(DEFAULTS);
  cur.commands[key] = (cur.commands[key] || 0) + 1;
  // Cap memory: keep only the top phrasings by frequency.
  const entries = Object.entries(cur.commands).sort((a, b) => b[1] - a[1]);
  if (entries.length > MAX_COMMANDS) cur.commands = Object.fromEntries(entries.slice(0, MAX_COMMANDS));
  cache.set(userId, cur);
  await persist(userId, cur);
}

/** The user's most-used commands (count ≥ 2 — i.e. actually recurring), most frequent first. */
export async function topCommands(userId: string, n = 5): Promise<string[]> {
  const { commands } = await getPrefs(userId);
  return Object.entries(commands).filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
}

async function persist(userId: string, cur: ConvoPrefs): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from(TABLE).upsert(
      { user_id: userId, style: cur.style, pause_ms: cur.pauseMs, commands: cur.commands, wit: cur.wit, humor: cur.humor, traits: cur.traits, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  } catch { /* keep in-memory */ }
}

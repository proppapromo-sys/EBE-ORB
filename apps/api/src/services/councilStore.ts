/**
 * councilStore.ts — persist every Multi-Model Council run (ORB logs everything).
 *
 * Durable in Supabase (`orb_council_runs`) when configured, process-memory otherwise so the
 * audit trail works with zero setup. Best-effort: a logging failure never breaks a council run.
 */
import { supabase } from './supabase.js';
import type { CouncilResult } from '../brains/council.js';

export type CouncilRunSummary = {
  id: string;
  userKey: string;
  request: string;
  finalAnswer: string;
  approvalCount: number;
  approvalTitles: string[];
  fullyConfigured: boolean;
  council: { role: string; label: string; provider: string; model: string; ok: boolean; output: string }[];
  createdAt: string;
};

const TABLE = 'orb_council_runs';
const mem: CouncilRunSummary[] = [];

/** Record a completed council run. Returns the run id (best-effort; never throws). */
export async function saveCouncilRun(userKey: string, result: CouncilResult): Promise<string | null> {
  const council = result.council.map((b) => ({
    role: b.role, label: b.label, provider: b.provider, model: b.model, ok: b.ok, output: b.output
  }));
  try {
    if (supabase) {
      const { data, error } = await supabase.from(TABLE).insert({
        user_key: userKey,
        request: result.request,
        final_answer: result.finalAnswer,
        approval_count: result.approvalRequired.count,
        approval_titles: result.approvalRequired.titles,
        council,
        cycle: { actions: result.cycle.actions },
        fully_configured: result.fullyConfigured
      }).select('id').single();
      if (error || !data) return null;
      return String(data.id);
    }
    const id = `run_${Math.random().toString(36).slice(2, 10)}`;
    mem.unshift({
      id, userKey, request: result.request, finalAnswer: result.finalAnswer,
      approvalCount: result.approvalRequired.count, approvalTitles: result.approvalRequired.titles,
      fullyConfigured: result.fullyConfigured, council, createdAt: new Date().toISOString()
    });
    if (mem.length > 200) mem.length = 200;
    return id;
  } catch {
    return null;
  }
}

export async function listCouncilRuns(userKey: string, limit = 20): Promise<CouncilRunSummary[]> {
  if (supabase) {
    const { data } = await supabase.from(TABLE).select('*')
      .eq('user_key', userKey).order('created_at', { ascending: false }).limit(limit);
    return (data ?? []).map((r) => ({
      id: String(r.id), userKey: r.user_key, request: r.request, finalAnswer: r.final_answer ?? '',
      approvalCount: r.approval_count ?? 0, approvalTitles: r.approval_titles ?? [],
      fullyConfigured: Boolean(r.fully_configured), council: r.council ?? [], createdAt: String(r.created_at)
    }));
  }
  return mem.filter((r) => r.userKey === userKey).slice(0, limit);
}

export const councilLogDurable = Boolean(supabase);

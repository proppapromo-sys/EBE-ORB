/**
 * actionStore.ts — the confirm-first action queue (law 5: never chase).
 *
 * Surfaced actions land here as `pending`. Low-risk ones may auto-approve; medium/high-risk
 * ones wait for the owner. Execution only ever runs an `approved` action and routes it back
 * through the connector that raised it. Durable in Supabase (`orb_action_queue`) when
 * configured, in-memory otherwise so the workflow runs with zero setup.
 */
import { supabase } from './supabase.js';
import { getConnector } from '../connectors/index.js';
import type { OrbAction } from '../types/orb.js';

export type QueuedActionStatus = 'pending' | 'approved' | 'executed' | 'rejected';

export type QueuedAction = {
  id: string;
  userKey: string;
  title: string;
  description: string;
  domain: string;
  riskLevel: string;
  requiresApproval: boolean;
  status: QueuedActionStatus;
  toolName?: string;
  connector?: string;
  payload: Record<string, unknown>;
  result?: unknown;
  edge?: number;
  stake?: number;
  createdAt: string;
  approvedAt?: string;
  executedAt?: string;
};

const TABLE = 'orb_action_queue';
const mem = new Map<string, QueuedAction>();

function rowToAction(r: Record<string, unknown>): QueuedAction {
  return {
    id: String(r.id),
    userKey: String(r.user_key),
    title: String(r.title),
    description: String(r.description),
    domain: String(r.domain),
    riskLevel: String(r.risk_level),
    requiresApproval: Boolean(r.requires_approval),
    status: r.status as QueuedActionStatus,
    toolName: (r.tool_name as string) ?? undefined,
    connector: (r.connector as string) ?? undefined,
    payload: (r.payload as Record<string, unknown>) ?? {},
    result: r.result ?? undefined,
    edge: r.edge != null ? Number(r.edge) : undefined,
    stake: r.stake != null ? Number(r.stake) : undefined,
    createdAt: String(r.created_at),
    approvedAt: (r.approved_at as string) ?? undefined,
    executedAt: (r.executed_at as string) ?? undefined
  };
}

/** Queue a surfaced action. Low-risk actions arrive pre-approved (auto-safe). */
export async function enqueueAction(userKey: string, action: OrbAction): Promise<QueuedAction> {
  const payload = (action.payload ?? {}) as Record<string, unknown>;
  const status: QueuedActionStatus = action.requiresApproval ? 'pending' : 'approved';
  const base = {
    user_key: userKey,
    title: action.title,
    description: action.description,
    domain: action.domain,
    risk_level: action.riskLevel,
    requires_approval: action.requiresApproval,
    status,
    tool_name: action.toolName ?? null,
    connector: (payload.connector as string) ?? null,
    payload,
    edge: (payload.edge as number) ?? null,
    stake: (payload.stake as number) ?? null
  };

  if (supabase) {
    const { data, error } = await supabase.from(TABLE).insert(base).select().single();
    if (error || !data) throw new Error(`enqueue failed: ${error?.message ?? 'no row'}`);
    return rowToAction(data);
  }

  const id = `act_${Math.random().toString(36).slice(2, 10)}`;
  const queued: QueuedAction = {
    id,
    userKey,
    title: action.title,
    description: action.description,
    domain: action.domain,
    riskLevel: action.riskLevel,
    requiresApproval: action.requiresApproval,
    status,
    toolName: action.toolName,
    connector: payload.connector as string | undefined,
    payload,
    edge: payload.edge as number | undefined,
    stake: payload.stake as number | undefined,
    createdAt: new Date().toISOString(),
    approvedAt: status === 'approved' ? new Date().toISOString() : undefined
  };
  mem.set(id, queued);
  return queued;
}

export async function listActions(userKey: string, status?: QueuedActionStatus): Promise<QueuedAction[]> {
  if (supabase) {
    let q = supabase.from(TABLE).select('*').eq('user_key', userKey);
    if (status) q = q.eq('status', status);
    const { data } = await q.order('created_at', { ascending: false });
    return (data ?? []).map(rowToAction);
  }
  return [...mem.values()]
    .filter((a) => a.userKey === userKey && (!status || a.status === status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function getAction(userKey: string, id: string): Promise<QueuedAction | null> {
  if (supabase) {
    const { data } = await supabase.from(TABLE).select('*').eq('user_key', userKey).eq('id', id).single();
    return data ? rowToAction(data) : null;
  }
  const a = mem.get(id);
  return a && a.userKey === userKey ? a : null;
}

async function patch(userKey: string, id: string, fields: Record<string, unknown>): Promise<QueuedAction | null> {
  if (supabase) {
    const { data } = await supabase.from(TABLE).update(fields).eq('user_key', userKey).eq('id', id).select().single();
    return data ? rowToAction(data) : null;
  }
  const a = mem.get(id);
  if (!a || a.userKey !== userKey) return null;
  if (fields.status) a.status = fields.status as QueuedActionStatus;
  if (fields.approved_at) a.approvedAt = String(fields.approved_at);
  if (fields.executed_at) a.executedAt = String(fields.executed_at);
  if ('result' in fields) a.result = fields.result;
  return a;
}

export async function approveAction(userKey: string, id: string): Promise<QueuedAction | null> {
  return patch(userKey, id, { status: 'approved', approved_at: new Date().toISOString() });
}

export async function rejectAction(userKey: string, id: string): Promise<QueuedAction | null> {
  return patch(userKey, id, { status: 'rejected' });
}

/** Execute an approved action through its connector. Confirm-first: refuses if not approved. */
export async function executeAction(
  userKey: string,
  id: string,
  live = false
): Promise<{ action: QueuedAction; result: unknown }> {
  const action = await getAction(userKey, id);
  if (!action) throw new Error('action not found');
  if (action.status !== 'approved') throw new Error(`action is "${action.status}" — approve it before executing`);

  let result: unknown = { dryRun: !live, message: 'No connector bound; recorded as dry-run.' };
  if (action.connector) {
    const connector = getConnector(action.connector);
    if (connector?.execute) {
      result = await connector.execute(userKey, {
        title: action.title,
        description: action.description,
        domain: action.domain as OrbAction['domain'],
        riskLevel: action.riskLevel as OrbAction['riskLevel'],
        requiresApproval: action.requiresApproval,
        toolName: action.toolName,
        payload: { ...action.payload, live }
      });
    }
  }

  const updated = await patch(userKey, id, {
    status: 'executed',
    executed_at: new Date().toISOString(),
    result
  });
  return { action: updated ?? action, result };
}

export async function clearUserActions(userKey: string): Promise<void> {
  if (supabase) { await supabase.from(TABLE).delete().eq('user_key', userKey); return; }
  for (const [id, a] of mem) if (a.userKey === userKey) mem.delete(id);
}

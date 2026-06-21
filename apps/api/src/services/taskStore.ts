/**
 * taskStore.ts — tasks EBE tracks for the owner.
 *
 * Open tasks that are due soon or overdue surface into the genome cycle as attention signals
 * (see TasksConnector), so the chief-of-staff actually nudges you. Durable in Supabase
 * (`orb_task_items`) when configured, process-memory otherwise.
 */
import { supabase } from './supabase.js';

export type TaskStatus = 'open' | 'done';
export type Task = {
  id: string;
  userKey: string;
  title: string;
  description?: string;
  status: TaskStatus;
  domain: string;
  priority: number; // 1..10
  dueAt?: string;
  createdAt: string;
  completedAt?: string;
};

const TABLE = 'orb_task_items';
const mem: Task[] = [];
const clampPri = (n: unknown) => Math.max(1, Math.min(10, Number(n) || 5));

function rowToTask(r: Record<string, unknown>): Task {
  return {
    id: String(r.id), userKey: String(r.user_key), title: String(r.title),
    description: (r.description as string) ?? undefined, status: (r.status as TaskStatus) ?? 'open',
    domain: (r.domain as string) ?? 'personal', priority: Number(r.priority) || 5,
    dueAt: (r.due_at as string) ?? undefined, createdAt: String(r.created_at),
    completedAt: (r.completed_at as string) ?? undefined
  };
}

export async function createTask(userKey: string, t: {
  title: string; description?: string; domain?: string; priority?: number; dueAt?: string;
}): Promise<Task> {
  const base = {
    user_key: userKey, title: t.title, description: t.description ?? null,
    domain: t.domain ?? 'personal', priority: clampPri(t.priority), due_at: t.dueAt ?? null, status: 'open'
  };
  if (supabase) {
    const { data, error } = await supabase.from(TABLE).insert(base).select().single();
    if (error || !data) throw new Error(`createTask failed: ${error?.message ?? 'no row'}`);
    return rowToTask(data);
  }
  const rec: Task = {
    id: `task_${Math.random().toString(36).slice(2, 10)}`, userKey, title: t.title, description: t.description,
    status: 'open', domain: base.domain, priority: base.priority, dueAt: t.dueAt, createdAt: new Date().toISOString()
  };
  mem.unshift(rec);
  return rec;
}

export async function listTasks(userKey: string, status?: TaskStatus): Promise<Task[]> {
  if (supabase) {
    let q = supabase.from(TABLE).select('*').eq('user_key', userKey);
    if (status) q = q.eq('status', status);
    const { data } = await q.order('priority', { ascending: false }).order('due_at', { ascending: true });
    return (data ?? []).map(rowToTask);
  }
  return mem.filter((t) => t.userKey === userKey && (!status || t.status === status))
    .sort((a, b) => b.priority - a.priority);
}

async function patch(userKey: string, id: string, fields: Record<string, unknown>): Promise<Task | null> {
  if (supabase) {
    const { data } = await supabase.from(TABLE).update(fields).eq('user_key', userKey).eq('id', id).select().single();
    return data ? rowToTask(data) : null;
  }
  const t = mem.find((x) => x.id === id && x.userKey === userKey);
  if (!t) return null;
  if (fields.status) t.status = fields.status as TaskStatus;
  if ('completed_at' in fields) t.completedAt = (fields.completed_at as string) ?? undefined;
  return t;
}

export const completeTask = (u: string, id: string) => patch(u, id, { status: 'done', completed_at: new Date().toISOString() });
export const reopenTask = (u: string, id: string) => patch(u, id, { status: 'open', completed_at: null });

export async function deleteTask(userKey: string, id: string): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase.from(TABLE).delete().eq('user_key', userKey).eq('id', id);
    return !error;
  }
  const i = mem.findIndex((x) => x.id === id && x.userKey === userKey);
  if (i >= 0) { mem.splice(i, 1); return true; }
  return false;
}

export const taskDurable = Boolean(supabase);

/**
 * graph.ts — ORB's Digital Spatial Mapping: a living knowledge graph of the user's world. Instead of
 * folders and databases, ORB holds entities (projects, people, businesses, documents, deals…) and the
 * relationships between them — so you navigate by meaning, not by location. You don't ask "where is the
 * file"; you ask "what do I know about this project?" and ORB walks the connections.
 *
 * Per-user, Supabase-backed (orb_graph_nodes / orb_graph_edges) with an in-memory fallback. Never throws.
 */
import { supabase } from './supabase.js';

export type GraphNode = { id: string; type: string; label: string };
export type GraphEdge = { from: string; to: string; rel: string };
export type Neighbor = { label: string; type: string; rel: string; dir: 'out' | 'in' };
export type AboutResult = { node: GraphNode; neighbors: Neighbor[] };

type UserGraph = { nodes: Map<string, GraphNode>; edges: GraphEdge[] };
const mem = new Map<string, UserGraph>();

const idOf = (label: string) => (label || '').toLowerCase().trim().replace(/\s+/g, ' ').replace(/^(?:the|my|our|a|an)\s+/, '');

function local(userId: string): UserGraph {
  let g = mem.get(userId);
  if (!g) { g = { nodes: new Map(), edges: [] }; mem.set(userId, g); }
  return g;
}

/** Add (or update) an entity. Returns its node. */
export async function addEntity(userId: string, label: string, type = 'thing'): Promise<GraphNode | null> {
  const id = idOf(label);
  if (!id || id.length < 2 || id.length > 80) return null;
  const node: GraphNode = { id, type, label: label.trim() };
  local(userId).nodes.set(id, node);
  if (supabase) {
    try { await supabase.from('orb_graph_nodes').upsert({ user_id: userId, id, type, label: node.label }, { onConflict: 'user_id,id' }); }
    catch { /* keep in-memory */ }
  }
  return node;
}

/** Relate two entities (creating either if needed). Edge is de-duplicated. */
export async function relate(userId: string, a: string, b: string, rel = 'linked to'): Promise<boolean> {
  const an = await addEntity(userId, a);
  const bn = await addEntity(userId, b);
  if (!an || !bn || an.id === bn.id) return false;
  const g = local(userId);
  if (!g.edges.some((e) => e.from === an.id && e.to === bn.id && e.rel === rel)) g.edges.push({ from: an.id, to: bn.id, rel });
  if (supabase) {
    try { await supabase.from('orb_graph_edges').upsert({ user_id: userId, from_id: an.id, to_id: bn.id, rel }, { onConflict: 'user_id,from_id,to_id,rel' }); }
    catch { /* keep in-memory */ }
  }
  return true;
}

async function load(userId: string): Promise<UserGraph> {
  const g = local(userId);
  if ((g.nodes.size || g.edges.length) || !supabase) return g;
  try {
    const [{ data: ns }, { data: es }] = await Promise.all([
      supabase.from('orb_graph_nodes').select('id,type,label').eq('user_id', userId),
      supabase.from('orb_graph_edges').select('from_id,to_id,rel').eq('user_id', userId)
    ]);
    for (const n of ns ?? []) g.nodes.set(n.id, { id: n.id, type: n.type, label: n.label });
    for (const e of es ?? []) g.edges.push({ from: e.from_id, to: e.to_id, rel: e.rel });
  } catch { /* in-memory only */ }
  return g;
}

/** Find the entity that best matches a query and return its immediate connections. Null if unknown. */
export async function aboutEntity(userId: string, query: string): Promise<AboutResult | null> {
  const g = await load(userId);
  if (!g.nodes.size) return null;
  const q = idOf(query);
  if (!q) return null;
  let match: GraphNode | undefined = g.nodes.get(q);
  if (!match) {
    // fuzzy: prefer the longest label that overlaps the query (or vice-versa)
    let best = 0;
    for (const n of g.nodes.values()) {
      if (n.id.includes(q) || q.includes(n.id)) { if (n.id.length > best) { best = n.id.length; match = n; } }
    }
  }
  if (!match) return null;
  const neighbors: Neighbor[] = [];
  for (const e of g.edges) {
    if (e.from === match.id) { const t = g.nodes.get(e.to); if (t) neighbors.push({ label: t.label, type: t.type, rel: e.rel, dir: 'out' }); }
    else if (e.to === match.id) { const f = g.nodes.get(e.from); if (f) neighbors.push({ label: f.label, type: f.type, rel: e.rel, dir: 'in' }); }
  }
  return { node: match, neighbors };
}

export type IngestItem = { label: string; type: string; mentions?: string[] };

/** Bulk-ingest entities (e.g. from a calendar/drive sync) and link each to the things it mentions. */
export async function ingestItems(userId: string, items: IngestItem[]): Promise<number> {
  let added = 0;
  for (const it of items) {
    const node = await addEntity(userId, it.label, it.type);
    if (!node) continue;
    added++;
    for (const m of it.mentions ?? []) await relate(userId, it.label, m, 'mentions');
  }
  return added;
}

// ── Systems Thinking: cause→effect propagation through the graph ──
const CAUSAL = new Set(['causes', 'reduces', 'leads to', 'drives', 'triggers']);
function findNode(g: UserGraph, query: string): GraphNode | null {
  const q = idOf(query); if (!q) return null;
  let match = g.nodes.get(q);
  if (!match) { let best = 0; for (const n of g.nodes.values()) if (n.id.includes(q) || q.includes(n.id)) { if (n.id.length > best) { best = n.id.length; match = n; } } }
  return match ?? null;
}
export type CausalStep = { label: string; rel: string };
export type Trace = { start: GraphNode; chains: CausalStep[][] };

/** Follow causal edges from an entity to surface the downstream cause→effect chains (with delays in mind). */
export async function traceCausal(userId: string, query: string, depth = 4): Promise<Trace | null> {
  const g = await load(userId);
  const start = findNode(g, query);
  if (!start) return null;
  const chains: CausalStep[][] = [];
  const walk = (id: string, path: CausalStep[], seen: Set<string>, d: number) => {
    const outs = g.edges.filter((e) => e.from === id && CAUSAL.has(e.rel));
    if (!outs.length || d === 0) { if (path.length) chains.push(path); return; }
    for (const e of outs) {
      const t = g.nodes.get(e.to); if (!t || seen.has(t.id)) continue;
      walk(t.id, [...path, { label: t.label, rel: e.rel }], new Set([...seen, t.id]), d - 1);
    }
  };
  walk(start.id, [], new Set([start.id]), depth);
  return { start, chains: chains.slice(0, 6) };
}

export function formatTrace(t: Trace | null): string {
  if (!t || !t.chains.length) return `I don't have downstream effects mapped for ${t?.start.label || 'that'} yet — tell me what it causes ("X causes Y", "X reduces Z") and I'll trace the chain.`;
  const lines = t.chains.map((chain) => `${t.start.label} ${chain.map((s) => `→ ${s.rel} → ${s.label}`).join(' ')}`);
  return `Tracing the system from **${t.start.label}** (mind the delays — effects arrive later):\n${lines.join('\n')}`;
}

/** Turn a subgraph into a navigable, human answer. */
export function formatAbout(r: AboutResult): string {
  const head = `Here's what I know about **${r.node.label}**${r.node.type !== 'thing' ? ` (${r.node.type})` : ''}.`;
  if (!r.neighbors.length) return `${head} I don't have any connections mapped for it yet — tell me how it relates to other things and I'll remember.`;
  const lines = r.neighbors.map((n) => `- ${n.dir === 'out' ? `${n.rel} → ${n.label}` : `${n.label} → ${n.rel} this`}${n.type !== 'thing' ? ` (${n.type})` : ''}`);
  return `${head} It's connected to ${r.neighbors.length} thing${r.neighbors.length === 1 ? '' : 's'}:\n${lines.join('\n')}`;
}

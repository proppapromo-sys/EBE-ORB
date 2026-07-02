/**
 * health.ts — ORB assembling and assessing your connected systems for broken/damaged ones. This is the
 * concrete "data retrieval → assemble → assess" loop:
 *
 *   RETRIEVE — ask each connector for its real status() (connected / needs_auth / error / disabled),
 *              and for self-connect providers (Stripe, Shopify) run a LIVE check against their API so a
 *              stored-but-now-invalid key shows up as broken, not "connected".
 *   ASSEMBLE — collect them into one snapshot: system, domain, state, detail, checkedAt.
 *   ASSESS   — classify each: healthy (connected + responding), degraded (connected but a read failed),
 *              down (connected but the API rejected/errored — i.e. broken/damaged), not_connected
 *              (eyes closed on that system), disabled.
 *
 * Honest scope: ORB can only assess systems it's connected to. "Damaged" here means connected-but-failing
 * or reads-failing — it diagnoses live integration health, not deep forensic data recovery. Never throws;
 * a check that fails to run is itself reported (degraded/down), never a crash. The classifier is pure/tested.
 */
import { connectors } from '../connectors/index.js';
import { INTEGRATIONS, testConnection } from './integrations.js';
import { getCredential } from './credentialStore.js';
import type { ConnectorStatus } from '../types/orb.js';

export type SystemState = 'healthy' | 'degraded' | 'down' | 'not_connected' | 'disabled';
export type SystemHealth = { system: string; domain: string; state: SystemState; detail: string; checkedAt: string };

// worst → best, so the assembled report and the UI lead with what's broken.
const ORDER: Record<SystemState, number> = { down: 0, degraded: 1, not_connected: 2, healthy: 3, disabled: 4 };

/** Pure: classify one system from its connector status and (optionally) whether a live read succeeded. */
export function assess(status: ConnectorStatus, readOk?: boolean): SystemState {
  if (status === 'disabled') return 'disabled';
  if (status === 'needs_auth') return 'not_connected';
  if (status === 'error') return 'down';                 // connected but failing = broken/damaged
  return readOk === false ? 'degraded' : 'healthy';       // status === 'connected'
}

/** Retrieve + assemble the health of every system for a user. Never throws. */
export async function assembleHealth(userId: string): Promise<SystemHealth[]> {
  const now = new Date().toISOString();

  const conn = await Promise.all(connectors.map(async (c) => {
    let status: ConnectorStatus;
    try { status = await c.status(userId); } catch { status = 'error'; }
    const state = assess(status);
    const detail = state === 'down' ? 'connected but the connector is erroring' : state === 'not_connected' ? 'not connected yet' : state === 'disabled' ? 'off' : 'connected and responding';
    return { system: c.name, domain: String(c.domain), state, detail, checkedAt: now } as SystemHealth;
  }));

  // Self-connect providers get a LIVE check — this is where a broken/expired key surfaces.
  const integ = await Promise.all(INTEGRATIONS.map(async (i) => {
    const fields = await getCredential(userId, i.provider).catch(() => null);
    if (!fields) return { system: i.label, domain: String(i.domain), state: 'not_connected' as SystemState, detail: 'not connected yet', checkedAt: now };
    const test = await testConnection(i.provider, fields).catch(() => ({ ok: false, note: 'live check failed to run' }));
    return { system: i.label, domain: String(i.domain), state: (test.ok ? 'healthy' : 'down') as SystemState, detail: test.note, checkedAt: now };
  }));

  return [...conn, ...integ].sort((a, b) => ORDER[a.state] - ORDER[b.state]);
}

/** The subset that's actually broken/damaged (connected but failing) — the real problems. */
export function brokenSystems(reports: SystemHealth[]): SystemHealth[] {
  return reports.filter((r) => r.state === 'down' || r.state === 'degraded');
}

/** Human-readable diagnostic: what's broken first, then a one-line roll-up. */
export function formatHealth(reports: SystemHealth[]): string {
  if (!reports.length) return "No systems are wired up yet — connect Google, Stripe, or Shopify and I'll watch their health.";
  const broken = brokenSystems(reports);
  const healthy = reports.filter((r) => r.state === 'healthy').length;
  const missing = reports.filter((r) => r.state === 'not_connected').length;
  const head = broken.length
    ? `${broken.length} system${broken.length === 1 ? '' : 's'} need attention:`
    : `All ${healthy} connected system${healthy === 1 ? ' is' : 's are'} healthy.`;
  const lines = broken.map((r) => `• ${r.system} — ${r.state === 'down' ? 'DOWN' : 'degraded'}: ${r.detail}. I can walk you through reconnecting it.`);
  const tail = `\n(${healthy} healthy · ${broken.length} broken · ${missing} not connected)`;
  return [head, ...lines].join('\n') + tail;
}

// "system health / is anything broken / assess my systems / diagnostics / what's down"
export const HEALTH_QUERY = /\b(system health|health check|run (?:a )?diagnostics?|diagnos(?:e|tics?)|is anything (?:broken|down|damaged|failing)|assess (?:my|the|our) (?:systems?|connections?|integrations?|setup)|are (?:my|our) (?:systems?|connections?|integrations?) (?:working|ok|okay|healthy|up)|check (?:my|the|our)? ?(?:connections?|integrations?|systems?)|what'?s (?:down|broken|damaged|not working|failing)|status of (?:my|our|the) (?:systems?|connections?|integrations?)|which (?:systems?|connections?) (?:are|is) (?:down|broken))\b/i;

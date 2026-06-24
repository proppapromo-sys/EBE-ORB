/**
 * worker/tick.ts — the process a scheduler (cron, systemd timer, platform cron job) runs on an interval
 * to make ORB proactive. It does NOT loop on its own — it does one pass and exits, so the schedule lives
 * outside (e.g. crontab: `*\/30 * * * *  cd apps/api && npm run worker`). Keeping the loop external means
 * no long-lived process to leak or crash-loop, matching the rest of the codebase's never-throw posture.
 *
 * Users to scan come from PROACTIVE_USERS (comma-separated) or argv; absent that it scans 'demo-user'.
 * Output is the fresh per-user insights — a real cron would pipe these to a notifier or persist them for
 * the next session. ORB surfaces; the human decides. No autonomous action.
 */
import { runTick } from '../services/proactive.js';

async function main() {
  const fromArgs = process.argv.slice(2);
  const fromEnv = (process.env.PROACTIVE_USERS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const userIds = (fromArgs.length ? fromArgs : fromEnv.length ? fromEnv : ['demo-user']);
  const results = await runTick(userIds);
  if (!results.length) { console.log('[proactive] nothing to surface this tick'); return; }
  for (const { userId, insights } of results) {
    console.log(`[proactive] ${userId}: ${insights.length} insight(s)`);
    for (const i of insights) console.log(`  - (${i.kind}) ${i.message}`);
  }
}

main().catch((e) => { console.error('[proactive] tick failed:', e); process.exitCode = 1; });

/**
 * demo.ts — end-to-end proof the TypeScript genome learns, mirroring the Python seed.
 * Run:  npm --workspace apps/api exec tsx src/genome/demo.ts
 */
import { runOrbCycle } from './orbBranch.js';
import { connectors } from '../connectors/index.js';
import { Journal, categoryTrust } from './genome.js';

async function main() {
  console.log('UNIVERSAL GENOME (TS) — ORB end-to-end demo\n');

  const journal = new Journal();
  console.log('cycle 1 (eyes inert at 0.5 — no votes yet):');
  const report = await runOrbCycle(connectors, 'demo-user', { journal });
  for (const a of report.actions) {
    console.log(
      `  🎯 ${a.title}  [${a.riskLevel}${a.requiresApproval ? ' · approve' : ' · auto'}]  edge ${
        (a.payload as { edge: number }).edge
      }`
    );
  }
  console.log(
    `  vetoed ${report.vetoed.length} · passed ${report.passed.length} · dropped ${report.dropped.length}`
  );

  // forward-validate: commerce kept paying off; noise didn't
  for (const r of await journal.read()) {
    if (r.kind !== 'decision' || !r.id) continue;
    journal.recordOutcome('orb', r.id, r.category === 'inventory' ? 1 : -1);
  }
  const learned = categoryTrust(await journal.read());
  const rounded = Object.fromEntries(
    Object.entries(learned).map(([k, v]) => [k, Math.round(v * 100) / 100])
  );
  console.log('\nlearned category trust from the record:', rounded);
  console.log('law 4 in action — proven lanes climb above the 0.55 vote bar; duds sink.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

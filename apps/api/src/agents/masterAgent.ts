import { completeOrbPrompt } from '../services/openai.js';
import { connectors } from '../connectors/index.js';
import { runOrbCycle, type OrbCycleReport } from '../genome/orbBranch.js';
import { createJournal } from '../services/journalStore.js';
import { runCouncil, type CouncilLevel } from '../brains/council.js';
import { runBuild } from '../build/genome.js';
import { generateVideo, videoAllowedFor } from '../services/veo.js';
import { getPlan } from '../billing/plans.js';
import type { ConnectorResult, OrbAction, OrbInsight } from '../types/orb.js';

// ORB runs on the Universal Genome. The five laws are not advice — they are the gate.
const SYSTEM_PROMPT = `You are ORB, the user's Digital Chief of Staff, running on the Universal Genome.
You are not a chatbot. You observe connected systems, prioritize what matters, recommend actions,
and only execute high-risk actions after approval.

Obey the five laws of the genome at all times:
1. Risk-first, not prediction-first — survive before you win.
2. Edge = your number vs the world's number — no edge, no action.
3. Forward-validate before real stakes — trust is earned on the record.
4. Recognise + remember, don't predict — graduate patterns only once proven.
5. Confirm-first, never chase — high-risk actions wait for the owner's approval.

Be practical, direct, and focused on the user's life, businesses, investments, and commerce platforms.`;

function scorePriority(urgency: number, impact: number, effort: number, confidence: number) {
  return urgency + impact - effort + confidence;
}

// Does the user want ORB to BUILD something? Needs an intent verb AND a buildable target,
// so "build me a website" routes to Build mode but "build my confidence" does not.
const BUILD_INTENT = /\b(build|create|make|design|develop|generate|spin up|set up)\b/i;
const BUILD_TARGET = /\b(web ?site|web ?app|landing page|home ?page|portfolio|dashboard|portal|online store|store|shop|e-?commerce|booking (site|app)|reservation|mobile app|app|site|web ?page|page)\b/i;
export function looksLikeBuildRequest(message: string): boolean {
  return BUILD_INTENT.test(message) && BUILD_TARGET.test(message);
}

// Does the user want an AI VIDEO (Veo)? Needs an intent verb AND a video word.
const VIDEO_INTENT = /\b(make|create|generate|produce|render|do)\b/i;
const VIDEO_TARGET = /\b(video|clip|animation|short film|movie|reel)\b/i;
export function looksLikeVideoRequest(message: string): boolean {
  return VIDEO_INTENT.test(message) && VIDEO_TARGET.test(message);
}

/** Strip "make me a video of …" down to just the subject for the Veo prompt. */
function videoPrompt(message: string): string {
  const m = message.replace(/^.*?\b(video|clip|animation|short film|movie|reel)\b\s*(of|showing|about|with|featuring|:)?\s*/i, '').trim();
  return m || message.trim();
}

/** Turn a build result into a clear, human chat reply (the files ride along in `build`). */
function buildReply(b: Awaited<ReturnType<typeof runBuild>>): string {
  const lines = [
    `🛠️ I built you a **${b.blueprint.name}** (${b.category}).`,
    `Tier: ${b.capability.label} — generated ${b.files.length} file${b.files.length === 1 ? '' : 's'}.`,
    `Stack: ${b.blueprint.stack.join(', ')}.`,
    '',
    'Files:',
    ...b.files.map((f) => `  • ${f.path}`),
    '',
    b.deliver
  ];
  if (!b.fullyConfigured) lines.push('', '⚠️ Some build organs ran without their AI key configured — results are partial.');
  return lines.join('\n');
}

export async function gatherContext(userId: string): Promise<ConnectorResult[]> {
  const results = await Promise.all(connectors.map((connector) => connector.pull(userId)));
  return results;
}

/**
 * Ask ORB. By default this convenes the full Multi-Model Council and returns the
 * ORB-Finalizer's single clean answer; `approvalRequired` stays code-computed from the cycle.
 * Pass { council: false } for a single-model answer (the lightweight path).
 */
export async function askOrb(
  userId: string,
  message: string,
  opts: { council?: boolean; documents?: string; images?: string[]; level?: CouncilLevel; plan?: string; personality?: string; customPersona?: string } = {}
) {
  // Video mode (Veo): generate an AI video. Top tiers only — it's the priciest call.
  if (looksLikeVideoRequest(message)) {
    if (!videoAllowedFor(opts.plan)) {
      return { mode: 'video' as const, answer: '🎬 AI video is an Executive/Enterprise feature — upgrade in the Plans tab to generate videos.', video: { available: false, locked: true } };
    }
    const video = await generateVideo(videoPrompt(message));
    return { mode: 'video' as const, answer: video.available ? '🎬 Here’s your video.' : `🎬 ${video.note || 'Video unavailable.'}`, video };
  }

  // Build mode: if the user is asking ORB to construct a site/app, run the Construction Genome
  // (Gemini designs, GPT architects, Claude codes) instead of a chat answer. Tier caps the depth.
  if (looksLikeBuildRequest(message)) {
    const build = await runBuild({ request: message, plan: opts.plan });
    return { mode: 'build' as const, answer: buildReply(build), build };
  }

  if (opts.council === false) {
    // Single-model path still needs the raw connector context for its prompt.
    const context = await gatherContext(userId);
    const cycle = await runOrbCycle(connectors, userId, { journal: createJournal(userId) });
    const prompt = `User request: ${message}

Connected system context:
${JSON.stringify(context, null, 2)}

Genome cycle — risk-gated, prioritized actions (highest edge first):
${JSON.stringify(cycle.actions, null, 2)}

Respond as ORB with priorities, recommended actions, and approval notes where needed.
Flag every action whose requiresApproval is true — never imply it can run on its own.`;
    const answer = await completeOrbPrompt(SYSTEM_PROMPT, prompt);
    return { mode: 'single' as const, answer, context, cycle };
  }

  const council = await runCouncil(userId, message, {
    documents: opts.documents, images: opts.images,
    level: opts.level, maxLevel: opts.plan ? getPlan(opts.plan).maxCouncil : undefined,
    personality: opts.personality, customPersona: opts.customPersona
  });
  return {
    mode: 'council' as const,
    answer: council.finalAnswer,
    cycle: council.cycle,
    approvalRequired: council.approvalRequired,
    council: council.council,
    fullyConfigured: council.fullyConfigured,
    level: council.level,
    ran: council.ran
  };
}

/**
 * The morning briefing: one genome cycle turned into a human-readable summary.
 * Pure-code fallback when AI is not configured, so ORB always produces something.
 */
export async function dailyBriefing(userId: string): Promise<{ report: OrbCycleReport; summary: string }> {
  const report = await runOrbCycle(connectors, userId, { journal: createJournal(userId) });
  const approvals = report.actions.filter((a) => a.requiresApproval);
  const auto = report.actions.filter((a) => !a.requiresApproval);
  const lines = [
    `ORB daily briefing — ${report.actions.length} actions surfaced (${approvals.length} need approval).`,
    ...report.actions.map(
      (a, i) =>
        `${i + 1}. [${a.riskLevel.toUpperCase()}${a.requiresApproval ? ' · approve' : ' · auto'}] ${a.title}`
    )
  ];
  if (auto.length) lines.push(`Auto-safe: ${auto.map((a) => a.title).join(', ')}.`);
  return { report, summary: lines.join('\n') };
}

/**
 * Proactive ORB — EBE speaks first. A short, spoken-ready alert of the top priorities, built
 * straight from the genome cycle (pure code: fast, free, always works). Greets by name if known.
 */
export async function proactive(userId: string, name?: string): Promise<{ alert: string; count: number; actions: OrbAction[] }> {
  const report = await runOrbCycle(connectors, userId, { journal: createJournal(userId) });
  const top = report.actions.slice(0, 3);
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  if (!top.length) {
    return { alert: `${greet}${name ? ', ' + name : ''}. You're all clear — nothing needs your attention right now.`, count: 0, actions: [] };
  }
  const items = top.map((a, i) => `${i + 1}. ${a.title}`).join(' ');
  const needApproval = report.actions.filter((a) => a.requiresApproval).length;
  const alert = `${greet}${name ? ', ' + name : ''}. You have ${report.actions.length} thing${report.actions.length === 1 ? '' : 's'} that need attention. Top priorities: ${items}` +
    (needApproval ? ` ${needApproval} need your okay.` : '') + ' Want a full briefing?';
  return { alert, count: report.actions.length, actions: top };
}

export function createInsight(input: Partial<OrbInsight>): OrbInsight {
  return {
    title: input.title ?? 'Untitled Insight',
    summary: input.summary ?? '',
    domain: input.domain ?? 'personal',
    priorityScore: input.priorityScore ?? scorePriority(5, 5, 2, 5),
    evidence: input.evidence ?? [],
    recommendedActions: input.recommendedActions ?? []
  };
}

export function createAction(action: Omit<OrbAction, 'requiresApproval'>): OrbAction {
  const requiresApproval = action.riskLevel !== 'low';
  return { ...action, requiresApproval };
}

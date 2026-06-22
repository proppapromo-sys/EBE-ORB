/**
 * builder.ts — the Construction Machine. Runs the seven organs over a brief and returns real,
 * generated files. Provider split is deliberate:
 *   🎨 design        → Gemini   (your design agent)
 *   🏗  architecture → GPT      (structure & stack reasoning)
 *   ⌨️  code          → Claude   (writes the files)
 *   🔎 review        → Claude   (design ↔ code agreement, higher tiers only)
 * Degrades gracefully: a missing provider key yields a labelled, ok:false organ — the pipeline
 * still completes so the owner sees exactly what's wired and what isn't.
 */
import { getProviderClient } from '../brains/providers.js';
import type { BrainProvider } from '../brains/types.js';
import { getBlueprint, inferCategory } from './blueprints.js';
import { buildCapability } from './tiers.js';
import type {
  BuildBrief, BuildResult, BuildStageResult, GeneratedFile, BuildOrgan, Blueprint
} from './types.js';

const env = (k: string, fallback: string) => process.env[k] ?? fallback;
const MODEL: Record<BrainProvider, string> = {
  gemini: env('ORB_BUILD_DESIGN_MODEL', 'gemini-2.5-flash'),
  openai: env('ORB_BUILD_ARCH_MODEL', 'gpt-4.1'),
  anthropic: env('ORB_BUILD_CODE_MODEL', 'claude-sonnet-4-6')
};

const LAWS = `You build on the Universal Construction Genome. Five laws:
1) Structure-first — a sound skeleton before any feature.
2) Reuse the proven — start from the blueprint, never from zero.
3) Design and code are one organism — they must agree.
4) Remember every build — note reusable decisions.
5) Confirm-first, ship safe — nothing deploys without the owner's go-ahead.`;

async function runOrgan(
  organ: BuildOrgan, label: string, provider: BrainProvider,
  system: string, user: string, images?: string[]
): Promise<BuildStageResult> {
  const client = getProviderClient(provider);
  const model = MODEL[provider];
  try {
    const { text, ok, note } = await client.complete({ model, system, user, images });
    return { organ, label, provider, model, output: text, ok, note };
  } catch (err) {
    return { organ, label, provider, model, output: '', ok: false, note: err instanceof Error ? err.message : 'organ error' };
  }
}

/** Pull a JSON array of files out of a model response; tolerant of prose/code-fence wrapping. */
function parseFiles(text: string, maxFiles: number): GeneratedFile[] {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start !== -1 && end > start) {
    try {
      const arr = JSON.parse(text.slice(start, end + 1)) as unknown;
      if (Array.isArray(arr)) {
        return arr
          .filter((f): f is GeneratedFile =>
            !!f && typeof (f as GeneratedFile).path === 'string' && typeof (f as GeneratedFile).contents === 'string')
          .slice(0, maxFiles);
      }
    } catch { /* fall through to notes file */ }
  }
  // Couldn't parse structured files — keep the model's work as a single notes file rather than lose it.
  return [{ path: 'BUILD_NOTES.md', contents: text.trim() || '(no code returned)' }];
}

function blueprintContext(bp: Blueprint): string {
  return [
    `BLUEPRINT: ${bp.name} (${bp.id})`,
    `Summary: ${bp.summary}`,
    `Stack: ${bp.stack.join(', ')}`,
    `Structure:\n${bp.structure.map((s) => `  - ${s}`).join('\n')}`,
    `Components: ${bp.components.join(', ')}`,
    `Design defaults: ${JSON.stringify(bp.designDefaults)}`,
    `Launch checklist: ${bp.launchChecklist.join('; ')}`
  ].join('\n');
}

export async function runBuild(brief: BuildBrief): Promise<BuildResult> {
  const category = brief.category ?? inferCategory(brief.request);
  const bp = getBlueprint(category);
  const cap = buildCapability(brief.plan);
  const bpCtx = blueprintContext(bp);
  const brand = brief.brand ? `\nBRAND: ${JSON.stringify(brief.brand)}` : '';
  const stages: BuildStageResult[] = [];

  // 🎨 DESIGN — Gemini shapes the look from the blueprint's design defaults.
  const design = await runOrgan('design', 'Gemini-Designer', 'gemini',
    `${LAWS}\nYou are the Designer. Using the blueprint's design defaults as a starting point, define a concrete design system for THIS build: palette, typography, spacing, key screens/sections and their layout, and the overall feel. Be specific and buildable. Plain text, no code.`,
    `BRIEF: ${brief.request}${brand}\n\n${bpCtx}`);
  stages.push(design);

  // 🏗 ARCHITECTURE — GPT decides stack, file structure and data model from blueprint + design.
  const architecture = await runOrgan('architecture', 'GPT-Architect', 'openai',
    `${LAWS}\nYou are the Architect. Produce the concrete build plan: confirmed stack, exact file/folder tree, data model, and the order to build in. Honor the blueprint structure; adapt it to the brief. Be specific enough that a coder needs no further questions. Plain text.`,
    `BRIEF: ${brief.request}\n\n${bpCtx}\n\nDESIGN DIRECTION:\n${design.output}\n\nTIER: ${cap.label} (target ~${cap.maxFiles} files).`);
  stages.push(architecture);

  // ⌨️ CODE — Claude writes the actual files, returned as a strict JSON array.
  const code = await runOrgan('code', 'Claude-Builder', 'anthropic',
    `${LAWS}\nYou are the Builder. Write the real, working files for this build following the architecture and design exactly. Keep within roughly ${cap.maxFiles} files (start with the most important). Each file must be complete and runnable.\nRESPOND WITH ONLY a JSON array, no prose, no markdown fences: [{"path":"relative/path","contents":"full file contents"}].`,
    `BRIEF: ${brief.request}\n\n${bpCtx}\n\nDESIGN:\n${design.output}\n\nARCHITECTURE:\n${architecture.output}`);
  stages.push(code);
  const files = parseFiles(code.output, cap.maxFiles);

  // 🔎 REVIEW — higher tiers get a design↔code agreement pass.
  let review: string | undefined;
  if (cap.review) {
    const rv = await runOrgan('review', 'Claude-Reviewer', 'anthropic',
      `${LAWS}\nYou are the Reviewer. Check that the generated files match the architecture and the design, that the launch checklist is addressed, and flag anything missing or inconsistent. Be concrete. Plain text.`,
      `CHECKLIST: ${bp.launchChecklist.join('; ')}\n\nDESIGN:\n${design.output}\n\nARCHITECTURE:\n${architecture.output}\n\nFILES:\n${files.map((f) => f.path).join('\n')}`);
    stages.push(rv);
    review = rv.output;
  }

  // 🚀 DELIVER — how to run/deploy. Deploy only offered to tiers that allow it.
  const deliver = cap.canDeploy
    ? `Ready to deploy. ${files.length} files generated. ORB can push this live (your tier allows it) — just say the word and confirm.`
    : `${files.length} files generated. Download the package and run it, or hand to your team. Upgrade to deploy live directly from ORB.`;

  return {
    request: brief.request,
    category,
    generatedAt: new Date().toISOString(),
    plan: cap.plan,
    capability: { label: cap.label, depth: cap.depth, maxFiles: cap.maxFiles, canDeploy: cap.canDeploy },
    blueprint: { id: bp.id, name: bp.name, stack: bp.stack },
    design: design.output,
    architecture: architecture.output,
    files,
    review,
    deliver,
    stages,
    fullyConfigured: stages.every((s) => s.ok)
  };
}

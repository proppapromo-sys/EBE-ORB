/**
 * genome.ts — the Universal Construction Genome, stated plainly. Same shape as the decision
 * genome (five laws + organs), but its job is to BUILD software for clients. One skeleton, four
 * (and growing) build families; only the blueprint differs. This file is the soul + the public
 * surface — import from here.
 */
export const CONSTRUCTION_LAWS = [
  'Structure-first — a sound skeleton before any feature.',
  'Reuse the proven — start from the blueprint, never from zero.',
  'Design and code are one organism — they must agree.',
  'Remember every build — each finished project sharpens the library.',
  'Confirm-first, ship safe — nothing deploys without the owner’s go-ahead.'
] as const;

export const CONSTRUCTION_ORGANS = [
  { organ: 'brief',        icon: '📋', role: 'The need enters in plain words.' },
  { organ: 'blueprint',    icon: '🗂',  role: 'The proven skeleton for this build family.' },
  { organ: 'design',       icon: '🎨', role: 'Gemini — layout, look, design system.' },
  { organ: 'architecture', icon: '🏗',  role: 'GPT — stack, file structure, data model.' },
  { organ: 'code',         icon: '⌨️',  role: 'Claude — the actual files.' },
  { organ: 'review',       icon: '🔎', role: 'Council — design ↔ code agreement (higher tiers).' },
  { organ: 'deliver',      icon: '🚀', role: 'Package or deploy live (tier-gated).' }
] as const;

export { runBuild } from './builder.js';
export { BLUEPRINTS, getBlueprint, inferCategory } from './blueprints.js';
export { buildCapability } from './tiers.js';
export type {
  BuildBrief, BuildResult, Blueprint, BuildCategory, GeneratedFile
} from './types.js';

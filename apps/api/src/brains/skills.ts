/**
 * skills.ts — ORB's skills: named capabilities the assistant can be asked to use. Some are open to
 * any user; some are OWNER-ONLY (only the main account can trigger them). Voice cloning and voice
 * recognition/learning are owner-only skills — the main user just *tells* ORB, no buttons.
 */
import { isOwner } from '../services/planStore.js';

export type Skill = {
  id: string;
  name: string;
  summary: string;
  ownerOnly: boolean;
  triggers?: RegExp;   // present only for skills invoked by talking to ORB
};

export const SKILLS: Skill[] = [
  {
    id: 'voice-clone',
    name: 'Voice Cloning',
    summary: 'Record the main user’s voice so ORB speaks in it. Owner-only.',
    ownerOnly: true,
    triggers: /(clone|copy|record|learn|train|use|change|update|set).{0,20}\bvoice\b|\bvoice\b.{0,20}(clone|cloning|copy|record|learn|train|change|update)/i
  },
  {
    id: 'voice-recognition',
    name: 'Voice Recognition & Learning',
    summary: 'ORB learns and recognizes the main user by voice, and improves over time. Owner-only.',
    ownerOnly: true,
    triggers: /(voice recognition|recogni[sz]e .{0,12}voice|know my voice|enroll .{0,12}voice|voice (id|print|learning|profile))/i
  },
  // Capabilities listed for /skills (invoked elsewhere, not by these triggers):
  { id: 'build', name: 'Build', summary: 'Construct websites, web apps, stores and mobile apps.', ownerOnly: false },
  { id: 'video', name: 'AI Video', summary: 'Generate video with Runway or Veo.', ownerOnly: false },
  { id: 'council', name: 'Multi-AI Council', summary: 'Deep analysis across GPT, Claude and Gemini for heavy tasks.', ownerOnly: false }
];

/** Find a talk-triggered skill for a message, if any. */
export function matchSkill(message: string): Skill | null {
  for (const s of SKILLS) if (s.triggers && s.triggers.test(message)) return s;
  return null;
}

export function listSkills() {
  return SKILLS.map(({ id, name, summary, ownerOnly }) => ({ id, name, summary, ownerOnly }));
}

export { isOwner };

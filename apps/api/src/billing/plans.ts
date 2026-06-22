/**
 * plans.ts — ORB pricing tiers as data. Charge by how much of your life/business ORB manages,
 * not by "AI messages." Each plan caps the council's max escalation level (cost control).
 */
import type { CouncilLevel } from '../brains/council.js';

export type PlanId = 'free' | 'personal' | 'pro' | 'entrepreneur' | 'executive' | 'enterprise';

export type Plan = {
  id: PlanId;
  name: string;
  price: string;
  blurb: string;
  includes: string[];
  maxCouncil: CouncilLevel;     // most brains a request may convene on this plan
  integrations: 'limited' | 'core' | 'all';
};

export const PLANS: Plan[] = [
  { id: 'free', name: 'ORB Free', price: '$0/mo', blurb: 'Try it.',
    includes: ['Basic chat', 'Notes', 'Tasks', 'Reminders', 'Limited memory', 'Daily briefing'],
    maxCouncil: 'standard', integrations: 'limited' },
  { id: 'personal', name: 'ORB Personal', price: '$29.99/mo', blurb: 'Your personal digital chief of staff.',
    includes: ['Calendar', 'Gmail', 'Contacts', 'Memory', 'Daily briefing', 'Tasks', 'Voice assistant'],
    maxCouncil: 'important', integrations: 'core' },
  { id: 'pro', name: 'ORB Pro', price: '$59.99/mo', blurb: 'For power users.',
    includes: ['Multiple AI models', 'Finance tracking', 'Investments', 'Travel', 'Smart home', 'Advanced memory', 'Custom workflows'],
    maxCouncil: 'high', integrations: 'all' },
  { id: 'entrepreneur', name: 'ORB Entrepreneur', price: '$99/mo', blurb: 'For business owners.',
    includes: ['Personal + Business ORB', 'Business dashboards', 'CRM', 'QuickBooks', 'Team management', 'Reporting'],
    maxCouncil: 'high', integrations: 'all' },
  { id: 'executive', name: 'ORB Executive', price: '$249/mo', blurb: 'The full multi-AI council.',
    includes: ['Multi-AI council (GPT + Claude + Gemini)', 'Advanced analytics', 'Unlimited integrations', 'Business intelligence', 'Workflow automation'],
    maxCouncil: 'critical', integrations: 'all' },
  { id: 'enterprise', name: 'ORB Enterprise', price: '$499–$2,500+/mo', blurb: 'Multi-location, franchises, agencies.',
    includes: ['Multiple users', 'Departmental ORBs', 'Custom AI agents', 'Custom integrations', 'API access', 'White-label'],
    maxCouncil: 'critical', integrations: 'all' }
];

export function getPlan(id?: string): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

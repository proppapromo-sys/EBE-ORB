import { BaseConnector } from './base.js';
import type { OrbSignalInput } from '../types/orb.js';

export class GmailConnector extends BaseConnector {
  constructor() {
    super('gmail', 'communication');
  }

  async signals(_userId: string): Promise<OrbSignalInput[]> {
    return [
      {
        id: 'gmail-vendor-invoice',
        name: 'Vendor invoice due in 2 days',
        description: 'Charcoal supplier invoice #4821 ($1,240) is due Friday.',
        domain: 'communication',
        category: 'finance',
        riskLevel: 'medium',
        urgency: 0.85,
        impact: 0.6,
        effort: 0.2,
        confidence: 0.8,
        toolName: 'gmail.draftReply',
      },
      {
        id: 'gmail-newsletter',
        name: 'Marketing newsletter',
        description: 'Weekly industry newsletter — low signal.',
        domain: 'communication',
        category: 'noise',
        riskLevel: 'low',
        urgency: 0.1,
        impact: 0.05,
        effort: 0.1,
        confidence: 0.9,
      },
    ];
  }
}

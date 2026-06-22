import { BaseConnector } from './base.js';
import type { OrbSignalInput, ConnectorStatus } from '../types/orb.js';
import { getAccessToken, gmailUnreadImportant, isConfigured } from './google.js';

export class GmailConnector extends BaseConnector {
  constructor() {
    super('gmail', 'communication');
  }

  async status(userId: string): Promise<ConnectorStatus> {
    if (!isConfigured()) return 'disabled';
    return (await getAccessToken(userId)) ? 'connected' : 'needs_auth';
  }

  async signals(userId: string): Promise<OrbSignalInput[]> {
    // Live path: when the user has connected Google, derive a real signal from the inbox.
    try {
      const token = await getAccessToken(userId);
      if (token) {
        const unread = await gmailUnreadImportant(token);
        if (unread > 0) {
          return [
            {
              id: 'gmail-unread-important',
              name: `${unread} important unread email${unread === 1 ? '' : 's'}`,
              description: `You have ${unread} unread message(s) flagged important in Gmail.`,
              domain: 'communication',
              category: 'email',
              riskLevel: 'low',
              urgency: Math.min(0.9, 0.4 + unread * 0.05),
              impact: Math.min(0.8, 0.3 + unread * 0.04),
              effort: 0.2,
              confidence: 0.9,
              toolName: 'gmail.triage'
            }
          ];
        }
        return [];
      }
    } catch {
      // fall through to sample signals on any live error (resilience)
    }
    return this.sampleSignals();
  }

  private sampleSignals(): OrbSignalInput[] {
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
        toolName: 'gmail.draftReply'
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
        confidence: 0.9
      }
    ];
  }
}

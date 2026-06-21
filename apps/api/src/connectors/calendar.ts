import { BaseConnector } from './base.js';
import type { OrbSignalInput, ConnectorStatus } from '../types/orb.js';
import { getAccessToken, calendarToday, isConfigured } from './google.js';

export class CalendarConnector extends BaseConnector {
  constructor() {
    super('google_calendar', 'calendar');
  }

  async status(userId: string): Promise<ConnectorStatus> {
    if (!isConfigured()) return 'disabled';
    return (await getAccessToken(userId)) ? 'connected' : 'needs_auth';
  }

  async signals(userId: string): Promise<OrbSignalInput[]> {
    try {
      const token = await getAccessToken(userId);
      if (token) {
        const events = await calendarToday(token);
        if (events.length) {
          return [
            {
              id: 'cal-today',
              name: `${events.length} event${events.length === 1 ? '' : 's'} today`,
              description: events.map((e) => e.summary).slice(0, 5).join(' · '),
              domain: 'calendar',
              category: 'scheduling',
              riskLevel: 'low',
              urgency: Math.min(0.9, 0.4 + events.length * 0.08),
              impact: 0.4,
              effort: 0.15,
              confidence: 0.9,
              toolName: 'calendar.review'
            }
          ];
        }
        return [];
      }
    } catch {
      // fall through to sample on live error
    }
    return this.sampleSignals();
  }

  private sampleSignals(): OrbSignalInput[] {
    return [
      {
        id: 'cal-double-booking',
        name: 'Double-booked at 3pm',
        description: 'Supplier call overlaps the staff 1:1 — one needs to move.',
        domain: 'calendar',
        category: 'scheduling',
        riskLevel: 'medium',
        urgency: 0.9,
        impact: 0.45,
        effort: 0.2,
        confidence: 0.85,
        toolName: 'calendar.reschedule'
      }
    ];
  }
}

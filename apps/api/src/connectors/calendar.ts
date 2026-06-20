import { BaseConnector } from './base.js';
import type { OrbSignalInput } from '../types/orb.js';

export class CalendarConnector extends BaseConnector {
  constructor() {
    super('google_calendar', 'calendar');
  }

  async signals(_userId: string): Promise<OrbSignalInput[]> {
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
        toolName: 'calendar.reschedule',
      },
    ];
  }
}

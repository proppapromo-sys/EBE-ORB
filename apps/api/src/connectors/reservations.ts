import { BaseConnector } from './base.js';
import type { ConnectorStatus, OrbAction } from '../types/orb.js';
import { bookReservation, opentableConfigured, type ReservationRequest } from '../services/reservations.js';

/** Books restaurant tables. Always available in link mode; partner API when configured. */
export class ReservationsConnector extends BaseConnector {
  constructor() {
    super('reservations', 'personal');
  }

  async status(): Promise<ConnectorStatus> {
    return 'connected'; // one-tap link mode always works; partner API when OPENTABLE_API_TOKEN set
  }

  async execute(_userId: string, action: OrbAction) {
    const r = (action.payload?.reservation ?? {}) as ReservationRequest;
    const result = await bookReservation(r);
    return {
      connector: this.name,
      status: 'connected' as ConnectorStatus,
      data: { ...result, opentableConnected: opentableConfigured() },
      checkedAt: new Date().toISOString()
    };
  }
}

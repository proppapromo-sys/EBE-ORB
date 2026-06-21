import 'dotenv/config';
import { BaseConnector } from './base.js';
import type { OrbSignalInput, ConnectorStatus } from '../types/orb.js';
import { getWeather } from '../services/weather.js';

/**
 * Weather sense. Uses DEFAULT_LAT/DEFAULT_LON (env) for the operator's location and surfaces a
 * genome signal only when something is actionable (high rain chance or extreme temperature).
 */
export class WeatherConnector extends BaseConnector {
  private lat = Number(process.env.DEFAULT_LAT);
  private lon = Number(process.env.DEFAULT_LON);

  constructor() {
    super('weather', 'personal');
  }

  async status(): Promise<ConnectorStatus> {
    return Number.isFinite(this.lat) && Number.isFinite(this.lon) ? 'connected' : 'disabled';
  }

  async signals(): Promise<OrbSignalInput[]> {
    if (!Number.isFinite(this.lat) || !Number.isFinite(this.lon)) return [];
    try {
      const w = await getWeather(this.lat, this.lon, process.env.DEFAULT_CITY);
      if (!w.available) return [];
      const out: OrbSignalInput[] = [];
      if ((w.precipProb ?? 0) >= 50) {
        out.push({
          id: 'weather-rain',
          name: `Rain likely today (${w.precipProb}%)`,
          description: `${w.description}. Plan around it — foot traffic and deliveries may be affected.`,
          domain: 'personal', category: 'weather', riskLevel: 'low',
          urgency: 0.5, impact: 0.4, effort: 0.1, confidence: 0.7, toolName: 'weather.review'
        });
      }
      if ((w.highC ?? 20) >= 35 || (w.lowC ?? 10) <= -5) {
        out.push({
          id: 'weather-extreme',
          name: `Extreme temperature today`,
          description: `High ${w.highC}°C / Low ${w.lowC}°C — check on staff, stock, and equipment.`,
          domain: 'personal', category: 'weather', riskLevel: 'low',
          urgency: 0.55, impact: 0.45, effort: 0.15, confidence: 0.7, toolName: 'weather.review'
        });
      }
      return out;
    } catch {
      return [];
    }
  }
}

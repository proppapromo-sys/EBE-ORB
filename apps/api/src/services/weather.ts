/**
 * weather.ts — EBE's weather sense (Open-Meteo, no API key required).
 *
 * Degrades gracefully: if the network/egress isn't available, returns available:false with
 * a clearly-labelled sample so the UI always renders something.
 */
const WMO: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Rain showers', 81: 'Rain showers', 82: 'Violent rain showers',
  85: 'Snow showers', 86: 'Snow showers', 95: 'Thunderstorm', 96: 'Thunderstorm + hail', 99: 'Thunderstorm + hail'
};
export function describeWeather(code: number): string {
  return WMO[code] ?? 'Unknown';
}

export type Weather = {
  available: boolean;
  place?: string;
  tempC?: number; tempF?: number;
  code?: number; description?: string;
  precipProb?: number; // %
  highC?: number; lowC?: number;
  note?: string;
};

export async function geocode(city: string): Promise<{ lat: number; lon: number; name: string } | null> {
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
    if (!r.ok) return null;
    const d = (await r.json()) as { results?: { latitude: number; longitude: number; name: string; admin1?: string; country_code?: string }[] };
    const g = d.results?.[0];
    return g ? { lat: g.latitude, lon: g.longitude, name: [g.name, g.admin1, g.country_code].filter(Boolean).join(', ') } : null;
  } catch {
    return null;
  }
}

export async function getWeather(lat: number, lon: number, place?: string): Promise<Weather> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code,precipitation_probability` +
      `&daily=temperature_2m_max,temperature_2m_min&temperature_unit=celsius&forecast_days=1&timezone=auto`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`weather ${r.status}`);
    const d = (await r.json()) as {
      current?: { temperature_2m: number; weather_code: number; precipitation_probability?: number };
      daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[] };
    };
    const c = d.current;
    const tempC = c?.temperature_2m;
    return {
      available: true,
      place,
      tempC,
      tempF: tempC != null ? Math.round((tempC * 9) / 5 + 32) : undefined,
      code: c?.weather_code,
      description: c ? describeWeather(c.weather_code) : undefined,
      precipProb: c?.precipitation_probability,
      highC: d.daily?.temperature_2m_max?.[0],
      lowC: d.daily?.temperature_2m_min?.[0]
    };
  } catch (e) {
    return {
      available: false,
      place,
      tempF: 72, tempC: 22, description: 'Partly cloudy (sample)', precipProb: 10,
      note: e instanceof Error ? e.message : 'weather unavailable'
    };
  }
}

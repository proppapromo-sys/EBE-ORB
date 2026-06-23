/**
 * reference.ts — ORB's reference desk: dictionary, Wikipedia (encyclopedia), world geography, and
 * currency conversion. All free, no API key. Each returns a compact string for the model to speak,
 * or null if nothing's found / unreachable.
 */

// World time — computed instantly via Intl (no network). City → IANA timezone.
const CITY_TZ: Record<string, string> = {
  tokyo: 'Asia/Tokyo', london: 'Europe/London', paris: 'Europe/Paris', berlin: 'Europe/Berlin', rome: 'Europe/Rome',
  madrid: 'Europe/Madrid', amsterdam: 'Europe/Amsterdam', moscow: 'Europe/Moscow', dubai: 'Asia/Dubai',
  'hong kong': 'Asia/Hong_Kong', singapore: 'Asia/Singapore', beijing: 'Asia/Shanghai', shanghai: 'Asia/Shanghai',
  delhi: 'Asia/Kolkata', mumbai: 'Asia/Kolkata', sydney: 'Australia/Sydney', seoul: 'Asia/Seoul',
  'new york': 'America/New_York', 'los angeles': 'America/Los_Angeles', chicago: 'America/Chicago',
  denver: 'America/Denver', 'las vegas': 'America/Los_Angeles', seattle: 'America/Los_Angeles',
  atlanta: 'America/New_York', miami: 'America/New_York', austin: 'America/Chicago', toronto: 'America/Toronto',
  'mexico city': 'America/Mexico_City', 'sao paulo': 'America/Sao_Paulo', 'san francisco': 'America/Los_Angeles'
};
export function timeIn(city: string): string | null {
  const tz = CITY_TZ[city.toLowerCase().trim()];
  if (!tz) return null;
  try {
    const s = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date());
    return `Time — ${city}: ${s} (${tz})`;
  } catch { return null; }
}

/** Define a word (dictionaryapi.dev). */
export async function defineWord(word: string): Promise<string | null> {
  try {
    const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!r.ok) return null;
    const d = (await r.json()) as { word: string; phonetic?: string; meanings?: { partOfSpeech?: string; definitions?: { definition: string }[] }[] }[];
    const e = d?.[0];
    if (!e?.meanings?.length) return null;
    const defs = e.meanings.slice(0, 2).map((m) => `(${m.partOfSpeech}) ${m.definitions?.[0]?.definition ?? ''}`.trim()).filter(Boolean);
    return `Definition — ${e.word}${e.phonetic ? ` ${e.phonetic}` : ''}: ${defs.join('; ')}`;
  } catch { return null; }
}

/** Encyclopedia summary (Wikipedia REST). */
export async function wikiSummary(query: string): Promise<string | null> {
  try {
    const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.trim().replace(/\s+/g, '_'))}`,
      { headers: { 'accept': 'application/json' } });
    if (!r.ok) return null;
    const d = (await r.json()) as { type?: string; title?: string; extract?: string };
    if (!d.extract || d.type === 'disambiguation') return null;
    return `Encyclopedia — ${d.title}: ${d.extract}`;
  } catch { return null; }
}

/** Country facts (REST Countries): capital, population, region, currency, languages. */
export async function countryInfo(name: string): Promise<string | null> {
  try {
    const r = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fields=name,capital,population,region,subregion,currencies,languages`);
    if (!r.ok) return null;
    const arr = (await r.json()) as any[];
    const c = arr?.[0];
    if (!c) return null;
    const cur = c.currencies ? Object.values(c.currencies).map((x: any) => x.name).join(', ') : '—';
    const langs = c.languages ? Object.values(c.languages).join(', ') : '—';
    return `Geography — ${c.name?.common}: capital ${c.capital?.[0] ?? '—'}, population ${Number(c.population).toLocaleString()}, ${c.subregion || c.region}, currency ${cur}, languages ${langs}.`;
  } catch { return null; }
}

/** Convert currency (open.er-api.com, no key). */
export async function convertCurrency(amount: number, from: string, to: string): Promise<string | null> {
  try {
    const r = await fetch(`https://open.er-api.com/v6/latest/${from.toUpperCase()}`);
    if (!r.ok) return null;
    const d = (await r.json()) as { rates?: Record<string, number> };
    const rate = d.rates?.[to.toUpperCase()];
    if (!rate) return null;
    return `Currency — ${amount} ${from.toUpperCase()} = ${(amount * rate).toFixed(2)} ${to.toUpperCase()} (rate ${rate}).`;
  } catch { return null; }
}

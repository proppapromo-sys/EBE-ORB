/**
 * stocks.ts — live stock/index quotes via Stooq (free, no API key). Returns the latest close.
 * Degrades gracefully: unreachable or unknown symbol → null.
 */
export type Quote = { ticker: string; name: string; price: number; currency: string };

export async function getQuote(rawTicker: string): Promise<Quote | null> {
  const t = rawTicker.trim();
  // Indices keep their ^ symbol; US equities get a .us suffix for Stooq.
  let sym = t.toLowerCase().replace(/[^a-z.^]/g, '');
  if (!sym) return null;
  if (!sym.startsWith('^') && !sym.includes('.')) sym = `${sym}.us`;
  try {
    const r = await fetch(`https://stooq.com/q/l/?s=${encodeURIComponent(sym)}&f=sd2t2ohlcvn&h&e=csv`);
    if (!r.ok) return null;
    const lines = (await r.text()).trim().split('\n');
    if (lines.length < 2) return null;
    // Symbol,Date,Time,Open,High,Low,Close,Volume,Name
    const c = lines[1].split(',');
    const close = c[6];
    if (!close || close === 'N/D') return null;
    return { ticker: t.toUpperCase().replace(/^\$/, ''), name: c[8] || t.toUpperCase(), price: Number(close), currency: 'USD' };
  } catch {
    return null;
  }
}

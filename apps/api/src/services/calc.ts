/**
 * calc.ts — a real mathematics calculator (safe, no eval) and a measurements/unit converter.
 * Both are exact and run locally. The model phrases the result; the math is done here.
 */

// ── Safe arithmetic evaluator (recursive descent) ──
const FUNCS: Record<string, (x: number) => number> = {
  sqrt: Math.sqrt, cbrt: Math.cbrt, sin: Math.sin, cos: Math.cos, tan: Math.tan,
  log: Math.log10, ln: Math.log, abs: Math.abs, round: Math.round, floor: Math.floor, ceil: Math.ceil, exp: Math.exp
};
const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E };

export function calculate(input: string): number | null {
  const s = input.replace(/\s+/g, '').toLowerCase();
  let i = 0;
  const expr = (): number => { let v = term(); while (s[i] === '+' || s[i] === '-') { const op = s[i++]; const t = term(); v = op === '+' ? v + t : v - t; } return v; };
  const term = (): number => { let v = pow(); while (s[i] === '*' || s[i] === '/' || s[i] === '%') { const op = s[i++]; const t = pow(); v = op === '*' ? v * t : op === '/' ? v / t : v % t; } return v; };
  const pow = (): number => { const v = unary(); if (s[i] === '^') { i++; return Math.pow(v, pow()); } return v; };
  const unary = (): number => { if (s[i] === '-') { i++; return -unary(); } if (s[i] === '+') { i++; return unary(); } return atom(); };
  const atom = (): number => {
    if (s[i] === '(') { i++; const v = expr(); if (s[i] === ')') i++; return v; }
    const num = /^[0-9]*\.?[0-9]+/.exec(s.slice(i));
    if (num) { i += num[0].length; return parseFloat(num[0]); }
    const id = /^[a-z]+/.exec(s.slice(i));
    if (id) {
      i += id[0].length;
      if (s[i] === '(') { i++; const arg = expr(); if (s[i] === ')') i++; if (FUNCS[id[0]]) return FUNCS[id[0]](arg); throw new Error('fn'); }
      if (id[0] in CONSTS) return CONSTS[id[0]];
    }
    throw new Error('parse');
  };
  try { const v = expr(); if (i < s.length) return null; return Number.isFinite(v) ? v : null; }
  catch { return null; }
}

// ── Unit conversion ──
const FACTORS: Record<string, Record<string, number>> = {
  length: { m: 1, meter: 1, meters: 1, km: 1000, kilometer: 1000, cm: 0.01, mm: 0.001, mile: 1609.344, miles: 1609.344, mi: 1609.344, ft: 0.3048, foot: 0.3048, feet: 0.3048, in: 0.0254, inch: 0.0254, inches: 0.0254, yard: 0.9144, yards: 0.9144, yd: 0.9144, nmi: 1852 },
  mass: { g: 1, gram: 1, grams: 1, kg: 1000, mg: 0.001, lb: 453.592, lbs: 453.592, pound: 453.592, pounds: 453.592, oz: 28.3495, ounce: 28.3495, ounces: 28.3495, ton: 1e6, tonne: 1e6, stone: 6350.29 },
  volume: { l: 1, liter: 1, liters: 1, litre: 1, ml: 0.001, gal: 3.78541, gallon: 3.78541, gallons: 3.78541, qt: 0.946353, quart: 0.946353, pt: 0.473176, pint: 0.473176, cup: 0.236588, cups: 0.236588, floz: 0.0295735, tbsp: 0.0147868, tsp: 0.00492892 },
  area: { sqm: 1, sqft: 0.092903, sqkm: 1e6, acre: 4046.86, hectare: 10000, sqmi: 2.59e6 },
  speed: { mps: 1, kph: 0.277778, kmh: 0.277778, mph: 0.44704, knot: 0.514444, knots: 0.514444 },
  time: { s: 1, sec: 1, second: 1, seconds: 1, min: 60, minute: 60, minutes: 60, hr: 3600, hour: 3600, hours: 3600, day: 86400, days: 86400, week: 604800, weeks: 604800 },
  data: { b: 1, byte: 1, kb: 1024, mb: 1048576, gb: 1073741824, tb: 1099511627776 }
};
const TEMP = new Set(['c', 'celsius', 'f', 'fahrenheit', 'k', 'kelvin']);
function normUnit(u: string): string { return u.toLowerCase().replace(/[°"'.\s]/g, '').replace(/s$/, (m) => m); }

function convTemp(v: number, from: string, to: string): number | null {
  const f = from[0], t = to[0];
  let c: number; // to Celsius
  if (f === 'c') c = v; else if (f === 'f') c = (v - 32) * 5 / 9; else if (f === 'k') c = v - 273.15; else return null;
  if (t === 'c') return c; if (t === 'f') return c * 9 / 5 + 32; if (t === 'k') return c + 273.15; return null;
}

export function convertUnits(value: number, fromRaw: string, toRaw: string): { value: number; from: string; to: string } | null {
  const from = normUnit(fromRaw), to = normUnit(toRaw);
  if (TEMP.has(from) && TEMP.has(to)) { const r = convTemp(value, from, to); return r == null ? null : { value: r, from: fromRaw, to: toRaw }; }
  for (const cat of Object.values(FACTORS)) {
    if (from in cat && to in cat) return { value: value * cat[from] / cat[to], from: fromRaw, to: toRaw };
  }
  return null;
}

/** Seeded project-NPV environment (SYNTHETIC) and summary statistics (analytics/mc.py). */
import { Xoshiro128ss } from "./rng";

export const Z95 = 1.959963984540054;
export interface Preset { label: string; investment_median: number; revenue_multiplier: number; delay_years: number }
export const PRESETS: Record<string, Preset> = {
  build_now: { label: "BUILD NOW", investment_median: 100, revenue_multiplier: 1, delay_years: 0 },
  phased: { label: "PHASED", investment_median: 70, revenue_multiplier: 0.75, delay_years: 0 },
  delay_one_year: { label: "DELAY ONE YEAR", investment_median: 100, revenue_multiplier: 1, delay_years: 1 },
};
export const HORIZON = 8;
export type Draw = [number, number, number, number, number];

export function triInv(u: number, a: number, c: number, b: number): number {
  const fc = (c - a) / (b - a);
  return u < fc ? a + Math.sqrt(u * (b - a) * (c - a)) : b - Math.sqrt((1 - u) * (b - a) * (b - c));
}
/** the five raw draws of one future, in this fixed order, whatever the decision (common random numbers) */
export function drawInputs(rng: Xoshiro128ss): Draw {
  return [rng.normal(), rng.normal(), rng.uniform(), rng.normal(), rng.uniform()];
}
export interface Outcome { investment: number; npv: number; recovered: number[]; paybackYear: number | null }
export function evaluate(d: Draw, pre: Preset): Outcome {
  const [zi, zr, ug, zm, ur] = d;
  const inv = Math.exp(Math.log(pre.investment_median) + 0.15 * zi);
  const r1 = pre.revenue_multiplier * (48 + 8 * zr);
  const g = triInv(ug, -0.02, 0.06, 0.15);
  const m = 0.35 + 0.05 * zm;
  const r = 0.07 + 0.05 * ur;
  const k = pre.delay_years;
  const pvInv = inv / (1 + r) ** k;
  let cf = r1 * m, pv = 0;
  const cum = [0];
  for (let s = 1; s <= 8; s++) { pv += cf / (1 + r) ** (s + k); cum.push(pv); cf *= 1 + g; }
  const npv = pv - pvInv;
  const rec = new Array<number>(HORIZON + 1).fill(0);
  for (let t = k + 1; t <= HORIZON; t++) rec[t] = cum[t - k]! / pvInv;
  let pay: number | null = null;
  for (let t = 1; t <= HORIZON; t++) {
    if (rec[t]! >= 1) { pay = t - 1 + (1 - rec[t - 1]!) / (rec[t]! - rec[t - 1]!); break; }
  }
  return { investment: inv, npv, recovered: rec, paybackYear: pay };
}
export function runDetail(seed: number, n: number, pre: Preset): Outcome[] {
  const rng = new Xoshiro128ss(seed);
  const out: Outcome[] = [];
  for (let i = 0; i < n; i++) out.push(evaluate(drawInputs(rng), pre));
  return out;
}
export const run = (seed: number, n: number) => runDetail(seed, n, PRESETS.build_now!).map((o) => o.npv);

export function percentile(sorted: number[], p: number): number {
  const h = (sorted.length - 1) * p;
  const lo = Math.floor(h), hi = Math.min(lo + 1, sorted.length - 1);
  return sorted[lo]! + (h - lo) * (sorted[hi]! - sorted[lo]!);
}
export interface Summary { n: number; mean: number; sd: number; se: number; ci95_lo: number; ci95_hi: number; p_loss: number; p05: number; p50: number; p95: number }
export function summarize(x: number[]): Summary {
  const n = x.length;
  let sum = 0;
  for (const v of x) sum += v;
  const mean = sum / n;
  let ss = 0, loss = 0;
  for (const v of x) { ss += (v - mean) ** 2; if (v < 0) loss++; }
  const sd = Math.sqrt(ss / (n - 1)), se = sd / Math.sqrt(n);
  const s = [...x].sort((a, b) => a - b);
  return { n, mean, sd, se, ci95_lo: mean - Z95 * se, ci95_hi: mean + Z95 * se, p_loss: loss / n, p05: percentile(s, 0.05), p50: percentile(s, 0.5), p95: percentile(s, 0.95) };
}

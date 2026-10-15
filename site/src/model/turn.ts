/** The Turn: geometry of one future as a thread, and the cached outcomes of a seeded run under a decision. */
import { PRESETS, drawInputs, evaluate, summarize, triInv, type Draw, type Outcome, type Preset } from "./mc";
import { Xoshiro128ss } from "./rng";

export const SEED_DEFAULT = 20261011;
export const SAMPLES_PER_YEAR = 12;
export interface Decision { key: string; label: string; preset: Preset }
export const DECISIONS: Decision[] = [
  { key: "build_now", label: "BUILD NOW", preset: PRESETS.build_now! },
  { key: "phased", label: "PHASED", preset: PRESETS.phased! },
  { key: "delay_one_year", label: "DELAY ONE YEAR", preset: PRESETS.delay_one_year! },
];
/** Y, the hour hand: cash recovered as a share of that future's own investment at fractional year t (linear within a year) */
export function recoveredAt(rec: number[], t: number): number {
  const i = Math.min(Math.floor(t), rec.length - 2);
  const f = t - i;
  return rec[i]! + (rec[i + 1]! - rec[i]!) * f;
}
/** polar thread: radius R t / 8, angle 360 deg x recovered, clockwise from 12 o'clock; returns x,y pairs relative to the centre */
export function threadXY(rec: number[], R: number, upToYear = 8, out?: Float32Array): Float32Array {
  const n = upToYear * SAMPLES_PER_YEAR + 1;
  const a = out ?? new Float32Array(n * 2);
  for (let k = 0; k < n; k++) {
    const t = k / SAMPLES_PER_YEAR;
    const th = 2 * Math.PI * recoveredAt(rec, t), r = (R * t) / 8;
    a[k * 2] = r * Math.sin(th);
    a[k * 2 + 1] = -r * Math.cos(th);
  }
  return a;
}
const cache = new Map<string, { draws: Draw[] }>();
export function drawsFor(seed: number, n: number): Draw[] {
  const key = `${seed}`;
  let c = cache.get(key);
  if (!c || c.draws.length < n) {
    const rng = new Xoshiro128ss(seed);
    c = { draws: Array.from({ length: n }, () => drawInputs(rng)) };
    cache.set(key, c);
  }
  return c.draws;
}
export interface Run { outcomes: Outcome[]; npv: number[]; summary: ReturnType<typeof summarize>; paybackShare: number; medianPayback: number | null; lossShare: number }
const runCache = new Map<string, Run>();
/** the n futures of `seed` under one decision: the same draws for every decision (common random numbers) */
export function runFor(seed: number, n: number, d: Decision): Run {
  const k = `${seed}|${n}|${d.key}`;
  const hit = runCache.get(k);
  if (hit) return hit;
  const draws = drawsFor(seed, n);
  const outcomes = new Array<Outcome>(n);
  for (let i = 0; i < n; i++) outcomes[i] = evaluate(draws[i]!, d.preset);
  const npv = outcomes.map((o) => o.npv);
  const pays = outcomes.map((o) => o.paybackYear).filter((v): v is number => v !== null).sort((a, b) => a - b);
  const run: Run = {
    outcomes, npv, summary: summarize(npv), paybackShare: pays.length / n, lossShare: npv.filter((v) => v < 0).length / n,
    medianPayback: pays.length ? pays[Math.floor((pays.length - 1) / 2)]! : null,
  };
  if (runCache.size > 12) runCache.delete(runCache.keys().next().value!);
  runCache.set(k, run);
  return run;
}

/** the recovered share of one future (rec packed 9 per future, years 0..8) at fractional year t */
export function recAtPacked(rec: ArrayLike<number>, off: number, t: number): number {
  const i = Math.min(Math.floor(t), 7);
  const f = t - i;
  return rec[off + i]! + (rec[off + i + 1]! - rec[off + i]!) * f;
}
export interface Polar { cx: number; cy: number; R: number }
export interface Fall { x0: number; y0: number; w: number; h: number }
/** FALL x spans 0% to this share of the investment recovered */
export const FALL_SPAN = 1.8;
/** the Unroll (VISUAL_DESIGN 0): the point of one thread at year t, u = 0 is the Turn, u = 1 is the waterfall; a straight blend of the two targets */
export function unrollPoint(rec: ArrayLike<number>, off: number, t: number, u: number, p: Polar, f: Fall): [number, number] {
  const s = recAtPacked(rec, off, t), th = 2 * Math.PI * s, r = (p.R * t) / 8;
  const px = p.cx + r * Math.sin(th), py = p.cy - r * Math.cos(th);
  const fx = f.x0 + (Math.min(s, FALL_SPAN) / FALL_SPAN) * f.w, fy = f.y0 + (t / 8) * f.h;
  return [px + (fx - px) * u, py + (fy - py) * u];
}

/** the five readable inputs of future i (the thread inspector): investment, first-year revenue, growth, margin, discount rate */
export function inputsOf(draws: ArrayLike<number>, i: number, preset: Preset) {
  const zi = draws[i * 5]!, zr = draws[i * 5 + 1]!, ug = draws[i * 5 + 2]!, zm = draws[i * 5 + 3]!, ur = draws[i * 5 + 4]!;
  return {
    investment: Math.exp(Math.log(preset.investment_median) + 0.15 * zi),
    revenue1: preset.revenue_multiplier * (48 + 8 * zr),
    growth: triInv(ug, -0.02, 0.06, 0.15),
    margin: 0.35 + 0.05 * zm,
    rate: 0.07 + 0.05 * ur,
  };
}

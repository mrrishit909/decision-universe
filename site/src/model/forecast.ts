/** Seeded AR(1) series, simple exponential smoothing and AR(1) by OLS with analytic intervals (analytics/forecast.py). */
import { normPpf } from "./dists";
import { Xoshiro128ss } from "./rng";

export const ALPHAS = Array.from({ length: 99 }, (_, i) => (i + 1) / 100);
export function genSeries(seed: number, n: number, mu: number, phi: number, sigma: number): number[] {
  const rng = new Xoshiro128ss(seed);
  const x = [mu + (sigma / Math.sqrt(1 - phi * phi)) * rng.normal()];
  for (let i = 1; i < n; i++) x.push(mu + phi * (x[x.length - 1]! - mu) + sigma * rng.normal());
  return x;
}
function sesSse(x: number[], a: number): [number, number] {
  let lev = x[0]!, sse = 0;
  for (let t = 1; t < x.length; t++) { const e = x[t]! - lev; sse += e * e; lev = a * x[t]! + (1 - a) * lev; }
  return [sse, lev];
}
export interface SesFit { alpha: number; sse: number; level: number; sigma2: number }
export function sesFit(x: number[]): SesFit {
  let best: [number, number, number] | null = null;
  for (const a of ALPHAS) { const [sse, lev] = sesSse(x, a); if (best === null || sse < best[1]) best = [a, sse, lev]; }
  const [alpha, sse, level] = best!;
  return { alpha, sse, level, sigma2: sse / (x.length - 1) };
}
export interface Ar1Fit { phi: number; c: number; mu: number; sigma2: number; last: number }
export function ar1Fit(x: number[]): Ar1Fit {
  const n = x.length;
  const y = x.slice(1), z = x.slice(0, -1);
  let ym = 0, zm = 0;
  for (let i = 0; i < n - 1; i++) { ym += y[i]!; zm += z[i]!; }
  ym /= n - 1; zm /= n - 1;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n - 1; i++) { sxy += (z[i]! - zm) * (y[i]! - ym); sxx += (z[i]! - zm) ** 2; }
  const phi = sxy / sxx, c = ym - phi * zm;
  let rss = 0;
  for (let i = 0; i < n - 1; i++) rss += (y[i]! - c - phi * z[i]!) ** 2;
  return { phi, c, mu: c / (1 - phi), sigma2: rss / (n - 3), last: x[n - 1]! };
}
export function sesForecast(f: SesFit, h: number, level: number): [number, number, number] {
  const sd = Math.sqrt(f.sigma2 * (1 + (h - 1) * f.alpha ** 2));
  const z = normPpf((1 + level) / 2);
  return [f.level, f.level - z * sd, f.level + z * sd];
}
export function ar1Forecast(f: Ar1Fit, h: number, level: number): [number, number, number] {
  const m = f.mu + f.phi ** h * (f.last - f.mu);
  let v = 0;
  for (let j = 0; j < h; j++) v += f.phi ** (2 * j);
  v *= f.sigma2;
  const z = normPpf((1 + level) / 2);
  return [m, m - z * Math.sqrt(v), m + z * Math.sqrt(v)];
}

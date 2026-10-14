/** Causal estimators (module 10; analytics/causal.py): naive, OLS coefficient, regression adjustment, IPW (all ATT). */
import { Xoshiro128ss } from "./rng";

/** Gauss-Jordan with partial pivoting: solves A x = b for small dense systems */
export function solve(Ain: number[][], bin: number[]): number[] {
  const n = bin.length;
  const A = Ain.map((r, i) => [...r, bin[i]!]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r]![c]!) > Math.abs(A[p]![c]!)) p = r;
    [A[c], A[p]] = [A[p]!, A[c]!];
    const d = A[c]![c]!;
    for (let j = c; j <= n; j++) A[c]![j]! /= d;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = A[r]![c]!;
      if (f !== 0) for (let j = c; j <= n; j++) A[r]![j]! -= f * A[c]![j]!;
    }
  }
  return A.map((r) => r[n]!);
}
const gram = (Z: number[][], w?: number[]) => {
  const k = Z[0]!.length;
  const G = Array.from({ length: k }, () => new Array<number>(k).fill(0));
  for (let i = 0; i < Z.length; i++) { const wi = w ? w[i]! : 1; for (let a = 0; a < k; a++) for (let b = a; b < k; b++) G[a]![b]! += wi * Z[i]![a]! * Z[i]![b]!; }
  for (let a = 0; a < k; a++) for (let b = 0; b < a; b++) G[a]![b] = G[b]![a]!;
  return G;
};
export function ols(Z: number[][], y: number[]): number[] {
  const k = Z[0]!.length;
  const Zty = new Array<number>(k).fill(0);
  for (let i = 0; i < Z.length; i++) for (let a = 0; a < k; a++) Zty[a]! += Z[i]![a]! * y[i]!;
  return solve(gram(Z), Zty);
}
export function logisticNewton(X: number[][], t: number[], iters: number, ridge = 1e-8): number[] {
  const Z = X.map((r) => [1, ...r]);
  const k = Z[0]!.length;
  let beta = new Array<number>(k).fill(0);
  for (let it = 0; it < iters; it++) {
    const p = Z.map((r) => 1 / (1 + Math.exp(-r.reduce((s, v, j) => s + v * beta[j]!, 0))));
    const grad = new Array<number>(k).fill(0);
    for (let i = 0; i < Z.length; i++) for (let a = 0; a < k; a++) grad[a]! += Z[i]![a]! * (t[i]! - p[i]!);
    for (let a = 1; a < k; a++) grad[a]! -= ridge * beta[a]!;
    const H = gram(Z, p.map((v) => v * (1 - v)));
    for (let a = 1; a < k; a++) H[a]![a]! += ridge;
    const step = solve(H, grad);
    beta = beta.map((b, j) => b + step[j]!);
  }
  return beta;
}
export function pscore(X: number[][], t: number[], iters: number): { e: number[]; beta: number[] } {
  const n = X.length, k = X[0]!.length;
  const mu = new Array<number>(k).fill(0), sd = new Array<number>(k).fill(0);
  for (const r of X) r.forEach((v, j) => (mu[j]! += v / n));
  for (const r of X) r.forEach((v, j) => (sd[j]! += (v - mu[j]!) ** 2 / n));
  const Xs = X.map((r) => r.map((v, j) => (v - mu[j]!) / Math.sqrt(sd[j]!)));
  const beta = logisticNewton(Xs, t, iters);
  const e = Xs.map((r) => Math.min(0.99, Math.max(0.01, 1 / (1 + Math.exp(-(beta[0]! + r.reduce((s, v, j) => s + v * beta[j + 1]!, 0)))))));
  return { e, beta };
}
export function estimators(y: number[], t: number[], X: number[][], iters: number) {
  const n = y.length;
  let sy1 = 0, n1 = 0, sy0 = 0, n0 = 0;
  for (let i = 0; i < n; i++) { if (t[i] === 1) { sy1 += y[i]!; n1++; } else { sy0 += y[i]!; n0++; } }
  const naive = sy1 / n1 - sy0 / n0;
  const b = ols(X.map((r, i) => [1, t[i]!, ...r]), y);
  const idxC = [...Array(n).keys()].filter((i) => t[i] !== 1), idxT = [...Array(n).keys()].filter((i) => t[i] === 1);
  const b0 = ols(idxC.map((i) => [1, ...X[i]!]), idxC.map((i) => y[i]!));
  const pred = idxT.map((i) => [1, ...X[i]!].reduce((s, v, j) => s + v * b0[j]!, 0));
  const ra = sy1 / n1 - pred.reduce((s, v) => s + v, 0) / idxT.length;
  const { e, beta } = pscore(X, t, iters);
  let sw = 0, swy = 0, sw2 = 0;
  for (const i of idxC) { const w = e[i]! / (1 - e[i]!); sw += w; swy += w * y[i]!; sw2 += w * w; }
  return { naive, ols_coef: b[1]!, ra_att: ra, ipw_att: sy1 / n1 - swy / sw, ess_controls: (sw * sw) / sw2, ps_beta: beta };
}
export function synthetic(seed: number, n: number, gamma: number, tau = 1) {
  const rng = new Xoshiro128ss(seed);
  const X: number[][] = [], t: number[] = [], y: number[] = [];
  for (let i = 0; i < n; i++) {
    const x1 = rng.normal(), x2 = rng.normal();
    const p = 1 / (1 + Math.exp(-gamma * (0.8 * x1 + 0.6 * x2)));
    const ti = rng.uniform() < p ? 1 : 0;
    y.push(tau * ti + 2 * x1 + 1.5 * x2 + rng.normal());
    t.push(ti); X.push([x1, x2]);
  }
  return { y, t, X };
}

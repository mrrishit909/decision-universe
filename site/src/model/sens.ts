/** Ishigami (A = 7, B = 0.1): analytic Sobol indices, Saltelli/Jansen estimators and OAT (analytics/sens.py). */
import { Xoshiro128ss } from "./rng";

const A_ = 7, B_ = 0.1, PI = Math.PI;
export const ishigami = (x1: number, x2: number, x3: number) => Math.sin(x1) + A_ * Math.sin(x2) ** 2 + B_ * x3 ** 4 * Math.sin(x1);
export function analytic() {
  const v1 = 0.5 * (1 + (B_ * PI ** 4) / 5) ** 2, v2 = A_ ** 2 / 8, v13 = B_ ** 2 * PI ** 8 * (1 / 18 - 1 / 50);
  const v = A_ ** 2 / 8 + (B_ * PI ** 4) / 5 + (B_ ** 2 * PI ** 8) / 18 + 0.5;
  return { V: v, V1: v1, V2: v2, V3: 0, V13: v13, S: [v1 / v, v2 / v, 0], ST: [(v1 + v13) / v, v2 / v, v13 / v] };
}
export function saltelli(seed: number, N: number) {
  const rng = new Xoshiro128ss(seed);
  const X = new Float64Array(N * 6);
  for (let i = 0; i < N; i++) for (let j = 0; j < 6; j++) X[i * 6 + j] = -PI + 2 * PI * rng.uniform();
  const fA = new Float64Array(N), fB = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    fA[i] = ishigami(X[i * 6]!, X[i * 6 + 1]!, X[i * 6 + 2]!);
    fB[i] = ishigami(X[i * 6 + 3]!, X[i * 6 + 4]!, X[i * 6 + 5]!);
  }
  // sample variance (ddof 1) of concat(fA, fB)
  let mean = 0;
  for (let i = 0; i < N; i++) mean += fA[i]! + fB[i]!;
  mean /= 2 * N;
  let ss = 0;
  for (let i = 0; i < N; i++) ss += (fA[i]! - mean) ** 2 + (fB[i]! - mean) ** 2;
  const V = ss / (2 * N - 1);
  const S: number[] = [], ST: number[] = [];
  for (let k = 0; k < 3; k++) {
    let s1 = 0, s2 = 0;
    for (let i = 0; i < N; i++) {
      const a = [X[i * 6]!, X[i * 6 + 1]!, X[i * 6 + 2]!];
      a[k] = X[i * 6 + 3 + k]!;
      const fk = ishigami(a[0]!, a[1]!, a[2]!);
      s1 += fB[i]! * (fk - fA[i]!);
      s2 += (fA[i]! - fk) ** 2;
    }
    S.push(s1 / N / V);
    ST.push((0.5 * s2) / N / V);
  }
  return { seed, N, V, S, ST, evaluations: N * 5 };
}
export function oat(base: [number, number, number], k = 21) {
  const grid = Array.from({ length: k }, (_, i) => -PI + (2 * PI * i) / (k - 1));
  const sweeps = [0, 1, 2].map((j) => {
    const y = grid.map((g) => { const x = [...base]; x[j] = g; return ishigami(x[0]!, x[1]!, x[2]!); });
    return { input: `x${j + 1}`, y, range: Math.max(...y) - Math.min(...y) };
  });
  return { base, grid, f_base: ishigami(...base), sweeps };
}

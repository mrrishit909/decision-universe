import { Xoshiro128ss } from "./rng";

/** k seeded samples of n uniforms: empirical CDF minus the true CDF on a grid of n+1 points (the sampling error, pinned at both ends) */
export function bridges(seed: number, k: number, n: number): Float32Array {
  const r = new Xoshiro128ss(seed), out = new Float32Array(k * (n + 1));
  for (let s = 0; s < k; s++) {
    const u = Array.from({ length: n }, () => r.uniform()).sort((a, b) => a - b);
    for (let j = 0; j <= n; j++) {
      const x = j / n;
      let c = 0;
      while (c < n && u[c]! <= x) c++;
      out[s * (n + 1) + j] = c / n - x;
    }
  }
  return out;
}

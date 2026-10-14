/** Conjugate updating and the frequentist intervals beside it (analytics/bayes.py). Credible and confidence are never the same word. */
import { beta } from "./dists";
import { Z95 } from "./mc";
import { Xoshiro128ss } from "./rng";

export function betaBinomial(a0: number, b0: number, k: number, n: number) {
  const a = a0 + k, b = b0 + n - k;
  const d = beta(a, b);
  const ph = n ? k / n : 0;
  const z2 = Z95 * Z95;
  let wil: [number, number];
  if (n) {
    const centre = (ph + z2 / (2 * n)) / (1 + z2 / n);
    const half = (Z95 * Math.sqrt((ph * (1 - ph)) / n + z2 / (4 * n * n))) / (1 + z2 / n);
    wil = [Math.max(0, centre - half), Math.min(1, centre + half)];
  } else wil = [0, 1];
  return {
    prior: [a0, b0] as [number, number], k, n, post: [a, b] as [number, number], post_mean: a / (a + b), post_sd: Math.sqrt((a * b) / ((a + b) ** 2 * (a + b + 1))),
    credible95: [d.ppf(0.025), d.ppf(0.975)] as [number, number], p_gt_half: 1 - d.cdf(0.5), confidence95_wilson: wil, mle: ph,
  };
}
export function normalNormal(m0: number, s0: number, sigma: number, n: number, ybar: number) {
  const tau = 1 / s0 ** 2 + n / sigma ** 2;
  const mean = (m0 / s0 ** 2 + (n * ybar) / sigma ** 2) / tau;
  const sd = 1 / Math.sqrt(tau);
  const hw = (Z95 * sigma) / Math.sqrt(n);
  return { prior: [m0, s0] as [number, number], sigma, n, ybar, post_mean: mean, post_sd: sd, credible95: [mean - Z95 * sd, mean + Z95 * sd] as [number, number], confidence95_z: [ybar - hw, ybar + hw] as [number, number] };
}
export function sequential(seed: number, pTrue: number, n: number) {
  const rng = new Xoshiro128ss(seed);
  const flips: number[] = [], rows: { n: number; k: number; mean: number; cr_lo: number; cr_hi: number; ci_lo: number; ci_hi: number }[] = [];
  let k = 0;
  for (let i = 1; i <= n; i++) {
    const x = rng.uniform() < pTrue ? 1 : 0;
    flips.push(x); k += x;
    if (i <= 10 || i % 5 === 0) {
      const r = betaBinomial(1, 1, k, i);
      rows.push({ n: i, k, mean: r.post_mean, cr_lo: r.credible95[0], cr_hi: r.credible95[1], ci_lo: r.confidence95_wilson[0], ci_hi: r.confidence95_wilson[1] });
    }
  }
  return { seed, p_true: pTrue, flips, path: rows };
}

/** pdf / cdf / quantile for normal, lognormal, beta, gamma, poisson (analytics/dists.py). */
import { betainc, gammaincP, gammaincQ, lbeta, lgamma } from "./special";

const A = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
const B = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
const C = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
const D = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
export const SQRT2PI = 2.5066282746310002;

export const normPdf = (z: number) => Math.exp(-0.5 * z * z) / SQRT2PI;
export function normCdf(z: number): number {
  const q = gammaincQ(0.5, 0.5 * z * z);
  return z >= 0 ? 1 - 0.5 * q : 0.5 * q;
}
export function normPpf(p: number): number {
  if (p <= 0 || p >= 1) throw new RangeError("p must be in (0, 1)");
  let x: number;
  if (p < 0.02425) {
    const q = Math.sqrt(-2 * Math.log(p));
    x = (((((C[0]! * q + C[1]!) * q + C[2]!) * q + C[3]!) * q + C[4]!) * q + C[5]!) / ((((D[0]! * q + D[1]!) * q + D[2]!) * q + D[3]!) * q + 1);
  } else if (p > 1 - 0.02425) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((C[0]! * q + C[1]!) * q + C[2]!) * q + C[3]!) * q + C[4]!) * q + C[5]!) / ((((D[0]! * q + D[1]!) * q + D[2]!) * q + D[3]!) * q + 1);
  } else {
    const q = p - 0.5, r = q * q;
    x = ((((((A[0]! * r + A[1]!) * r + A[2]!) * r + A[3]!) * r + A[4]!) * r + A[5]!) * q) / (((((B[0]! * r + B[1]!) * r + B[2]!) * r + B[3]!) * r + B[4]!) * r + 1);
  }
  for (let i = 0; i < 2; i++) {
    const e = normCdf(x) - p;
    const u = e * SQRT2PI * Math.exp(0.5 * x * x);
    x -= u / (1 + 0.5 * x * u);
  }
  return x;
}
export type Dist = { pdf: (x: number) => number; cdf: (x: number) => number; ppf: (p: number) => number };

export const normal = (mu: number, sigma: number): Dist => ({
  pdf: (x) => normPdf((x - mu) / sigma) / sigma, cdf: (x) => normCdf((x - mu) / sigma), ppf: (p) => mu + sigma * normPpf(p),
});
export const lognormal = (mu: number, sigma: number): Dist => ({
  pdf: (x) => (x <= 0 ? 0 : normPdf((Math.log(x) - mu) / sigma) / (x * sigma)),
  cdf: (x) => (x <= 0 ? 0 : normCdf((Math.log(x) - mu) / sigma)),
  ppf: (p) => Math.exp(mu + sigma * normPpf(p)),
});
function bisect(cdf: (x: number) => number, lo: number, hi: number, p: number): number {
  for (let i = 0; i < 300; i++) {
    const mid = 0.5 * (lo + hi);
    if (mid <= lo || mid >= hi) break;
    if (cdf(mid) < p) lo = mid; else hi = mid;
  }
  return 0.5 * (lo + hi);
}
export const beta = (a: number, b: number): Dist => {
  const cdf = (x: number) => betainc(a, b, x);
  return {
    pdf: (x) => (x <= 0 || x >= 1 ? 0 : Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - lbeta(a, b))),
    cdf, ppf: (p) => bisect(cdf, 0, 1, p),
  };
};
export const gamma = (k: number, theta: number): Dist => {
  const cdf = (x: number) => gammaincP(k, x / theta);
  return {
    pdf: (x) => (x <= 0 ? 0 : Math.exp((k - 1) * Math.log(x) - x / theta - lgamma(k) - k * Math.log(theta))),
    cdf,
    ppf: (p) => { let hi = k * theta + 10 * Math.sqrt(k) * theta; while (cdf(hi) < p) hi *= 2; return bisect(cdf, 0, hi, p); },
  };
};
export const poisson = (lam: number): Dist => {
  const cdf = (k: number) => (k < 0 ? 0 : gammaincQ(Math.floor(k) + 1, lam));
  return {
    pdf: (k) => (k < 0 ? 0 : Math.exp(-lam + k * Math.log(lam) - lgamma(k + 1))),
    cdf,
    ppf: (p) => { let k = 0; while (cdf(k) < p) k++; return k; },
  };
};

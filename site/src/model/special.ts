/** lgamma, regularized incomplete gamma and beta from exp, log, sqrt only (analytics/special.py, line for line). */
const LANCZOS = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
const HALF_LN_2PI = 0.9189385332046727;
const EPS = 1e-16, TINY = 1e-300;

export function lgamma(x: number): number {
  if (x < 0.5) return lgamma(x + 1) - Math.log(x);
  x -= 1;
  let a = LANCZOS[0]!;
  const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += LANCZOS[i]! / (x + i);
  return HALF_LN_2PI + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
export const lbeta = (a: number, b: number) => lgamma(a) + lgamma(b) - lgamma(a + b);

function gser(a: number, x: number): number {
  let term = 1 / a, s = term, ap = a;
  for (let i = 0; i < 100000; i++) {
    ap += 1; term *= x / ap; s += term;
    if (Math.abs(term) < Math.abs(s) * EPS) break;
  }
  return s * Math.exp(-x + a * Math.log(x) - lgamma(a));
}
function gcf(a: number, x: number): number {
  let b = x + 1 - a, c = 1 / TINY, d = 1 / b, h = d;
  for (let i = 1; i < 100000; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b; if (Math.abs(d) < TINY) d = TINY;
    c = b + an / c; if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const de = d * c;
    h *= de;
    if (Math.abs(de - 1) < EPS) break;
  }
  return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}
export function gammaincP(a: number, x: number): number {
  if (x <= 0) return 0;
  return x < a + 1 ? gser(a, x) : 1 - gcf(a, x);
}
export function gammaincQ(a: number, x: number): number {
  if (x <= 0) return 1;
  return x < a + 1 ? 1 - gser(a, x) : gcf(a, x);
}
function betacf(a: number, b: number, x: number): number {
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < TINY) d = TINY;
  d = 1 / d;
  let h = d;
  for (let m = 1; m < 100000; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c; if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c; if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const de = d * c;
    h *= de;
    if (Math.abs(de - 1) < EPS) break;
  }
  return h;
}
export function betainc(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lead = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lbeta(a, b));
  if (x < (a + 1) / (a + b + 2)) return (lead * betacf(a, b, x)) / a;
  return 1 - (lead * betacf(b, a, 1 - x)) / b;
}

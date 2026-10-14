/** Cost-sensitive threshold on the published test probabilities (module 6; analytics/credit.py cost_at, argmin_threshold). */
export const C_FN = 5, C_FP = 1;
export const THRESHOLDS = Array.from({ length: 101 }, (_, i) => i / 100);
export interface Confusion { tp: number; fp: number; fn: number; tn: number; cost: number }
export function costAt(p: ArrayLike<number>, y: ArrayLike<number>, t: number, cFn = C_FN, cFp = C_FP): Confusion {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (let i = 0; i < p.length; i++) {
    const rej = p[i]! > t;
    if (rej) { if (y[i] === 1) tp++; else fp++; } else if (y[i] === 1) fn++; else tn++;
  }
  return { tp, fp, fn, tn, cost: (cFn * fn + cFp * fp) / p.length };
}
export function argminThreshold(p: ArrayLike<number>, y: ArrayLike<number>, cFn = C_FN, cFp = C_FP): [number, number] {
  let bt = 0, bc: number | null = null;
  for (const t of THRESHOLDS) {
    const c = costAt(p, y, t, cFn, cFp).cost;
    if (bc === null || c < bc - 1e-12) { bt = t; bc = c; }
  }
  return [bt, bc!];
}
/** the calibrated optimum when probabilities are calibrated: c_fp / (c_fp + c_fn) */
export const thresholdTheory = (cFn: number, cFp: number) => cFp / (cFp + cFn);

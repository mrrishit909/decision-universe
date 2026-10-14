/** Minimal-change MODEL counterfactual search (module 9; analytics/counterfactual.py). Not a causal claim. */
export interface CfModel {
  intercept: number; coef: number[]; names: string[];
  num_features: string[]; num_mean: number[]; num_sd: number[];
  categories: Record<string, string[]>;
}
export type Row = Record<string, number | string>;
export const DURATIONS = [6, 9, 12, 15, 18, 24, 30, 36, 42, 48, 60, 72];
export const MULTS = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
export const INSTALL = [1, 2, 3, 4];

export function pBad(m: CfModel, row: Row): number {
  let z = m.intercept;
  const nn = m.num_features.length;
  m.num_features.forEach((f, i) => {
    const v = f === "log_amount" ? Math.log(Number(row.amount)) : Number(row[f]);
    z += (m.coef[i]! * (v - m.num_mean[i]!)) / m.num_sd[i]!;
  });
  // categorical one-hots follow `names` ("column=level"), not the key order of `categories`
  for (let k = nn; k < m.names.length; k++) {
    const [col, lv] = m.names[k]!.split("=");
    if (row[col!] === lv) z += m.coef[k]!;
  }
  return 1 / (1 + Math.exp(-z));
}
export interface CfResult { target: number; base_p_bad: number; found: boolean; cost?: number; p_bad_after?: number; changes?: Record<string, [number | string, number | string]>; n_changed?: number }
export function search(m: CfModel, row: Row, target: number): CfResult {
  const sd: Record<string, number> = {};
  m.num_features.forEach((f, i) => (sd[f] = m.num_sd[i]!));
  const base = pBad(m, row);
  let best: { cost: number; p: number; changes: Record<string, [number | string, number | string]> } | null = null;
  const dur0 = Number(row.duration), amt0 = Number(row.amount), inst0 = Number(row.installment_rate);
  const durs = [...new Set([...DURATIONS, Math.trunc(dur0)])].sort((a, b) => a - b);
  const chk = m.categories.checking!, sav = m.categories.savings!;
  for (const d of durs) for (const mult of MULTS) {
    const amt = Math.floor(amt0 * mult + 0.5);
    for (const inst of INSTALL) for (const c of chk) for (const s of sav) {
      const cand = { ...row, duration: d, amount: amt, installment_rate: inst, checking: c, savings: s };
      const p = pBad(m, cand);
      if (p > target) continue;
      const cost = Math.abs(d - dur0) / sd.duration! + Math.abs(Math.log(amt) - Math.log(amt0)) / sd.log_amount! + Math.abs(inst - inst0) / sd.installment_rate! + (c !== row.checking ? 1 : 0) + (s !== row.savings ? 1 : 0);
      if (best === null || cost < best.cost - 1e-12) {
        const changes: Record<string, [number | string, number | string]> = {};
        for (const k of ["duration", "amount", "installment_rate", "checking", "savings"] as const) if (cand[k] !== row[k]) changes[k] = [row[k]!, cand[k]];
        best = { cost, p, changes };
      }
    }
  }
  return { target, base_p_bad: base, found: best !== null, ...(best ? { cost: best.cost, p_bad_after: best.p, changes: best.changes, n_changed: Object.keys(best.changes).length } : {}) };
}

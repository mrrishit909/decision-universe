/** The transferable form of one seeded run, shared by the worker and the main-thread fallback. */
import { DECISIONS, runFor, drawsFor, type Decision } from "./turn";
import type { Preset } from "./mc";
import type { Summary } from "./mc";

export interface DecisionPack {
  key: string; label: string; summary: Summary;
  paybackShare: number; lossShare: number; medianPayback: number | null;
  /** nDraw x 9 recovered shares (year 0..8) */ rec: Float32Array;
  npv: Float64Array; inv: Float64Array;
  /** NaN = never completes the turn within 8 years */ pay: Float64Array;
}
export interface RunPack { seed: number; n: number; nDraw: number; draws: Float64Array; decisions: DecisionPack[]; ms: number }

export function makePack(seed: number, n: number, nDraw: number, custom: Preset | null = null): RunPack {
  const t0 = performance.now();
  const nd = Math.min(nDraw, n);
  const d = drawsFor(seed, n);
  const draws = new Float64Array(nd * 5);
  for (let i = 0; i < nd; i++) for (let k = 0; k < 5; k++) draws[i * 5 + k] = d[i]![k]!;
  const list: Decision[] = custom ? [...DECISIONS, { key: "custom", label: "CUSTOM LEVERS", preset: custom }] : DECISIONS;
  const decisions = list.map((dec) => {
    const r = runFor(seed, n, dec);
    const rec = new Float32Array(nd * 9), npv = new Float64Array(nd), inv = new Float64Array(nd), pay = new Float64Array(nd);
    for (let i = 0; i < nd; i++) {
      const o = r.outcomes[i]!;
      for (let t = 0; t < 9; t++) rec[i * 9 + t] = o.recovered[t]!;
      npv[i] = o.npv; inv[i] = o.investment; pay[i] = o.paybackYear ?? NaN;
    }
    return { key: dec.key, label: dec.label, summary: r.summary, paybackShare: r.paybackShare, lossShare: r.lossShare, medianPayback: r.medianPayback, rec, npv, inv, pay };
  });
  return { seed, n, nDraw: nd, draws, decisions, ms: performance.now() - t0 };
}

/// <reference lib="webworker" />
/** The compute worker: the PRNG, the Monte Carlo runs and the ten LAB instruments run here, off the main thread. */
import { makePack, type RunPack } from "../model/runpack";
import { runModule, type Artifacts, type LabResult, type ModuleId } from "../model/lab";
import { Xoshiro128ss } from "../model/rng";
import { saltelli } from "../model/sens";
import { bridges } from "../model/bridges";
import type { Preset } from "../model/mc";

declare const self: DedicatedWorkerGlobalScope;
export type ToCompute =
  | { type: "run"; id: number; seed: number; n: number; nDraw: number; custom: Preset | null }
  | { type: "u32"; id: number; seed: number; count: number }
  | { type: "bridges"; id: number; seed: number; k: number; n: number }
  | { type: "saltelli"; id: number; seed: number; N: number }
  | { type: "module"; id: number; mod: ModuleId; art: Artifacts; seed: number };
export type FromCompute =
  | { type: "run"; id: number; pack: RunPack }
  | { type: "module"; id: number; result: LabResult }
  | { type: "u32"; id: number; values: number[] }
  | { type: "bridges"; id: number; values: Float32Array }
  | { type: "saltelli"; id: number; S: number[]; ST: number[]; V: number; ms: number }
  | { type: "error"; id: number; message: string };

self.onmessage = (e: MessageEvent<ToCompute>) => {
  const m = e.data;
  try {
    if (m.type === "run") {
      const pack = makePack(m.seed, m.n, m.nDraw, m.custom);
      const tr: Transferable[] = [pack.draws.buffer];
      for (const d of pack.decisions) tr.push(d.rec.buffer, d.npv.buffer, d.inv.buffer, d.pay.buffer);
      self.postMessage({ type: "run", id: m.id, pack } satisfies FromCompute, tr);
    } else if (m.type === "u32") {
      const r = new Xoshiro128ss(m.seed);
      self.postMessage({ type: "u32", id: m.id, values: Array.from({ length: m.count }, () => r.nextU32()) } satisfies FromCompute);
    } else if (m.type === "bridges") {
      const out = bridges(m.seed, m.k, m.n);
      self.postMessage({ type: "bridges", id: m.id, values: out } satisfies FromCompute, [out.buffer]);
    } else if (m.type === "saltelli") {
      const t0 = performance.now(), s = saltelli(m.seed, m.N);
      self.postMessage({ type: "saltelli", id: m.id, S: s.S, ST: s.ST, V: s.V, ms: performance.now() - t0 } satisfies FromCompute);
    } else self.postMessage({ type: "module", id: m.id, result: runModule(m.mod, m.art, m.seed) } satisfies FromCompute);
  } catch (err) { self.postMessage({ type: "error", id: m.id, message: (err as Error).message } satisfies FromCompute); }
};


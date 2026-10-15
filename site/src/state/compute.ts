/**
 * Main-thread client of the compute worker. The worker is created after first paint. If it cannot start, the same
 * code runs on the main thread (state `mode: "main"`, shown in the chip), so every statement stays true.
 */
import { makePack, type RunPack } from "../model/runpack";
import { runModule, type Artifacts, type LabResult, type ModuleId } from "../model/lab";
import { Xoshiro128ss } from "../model/rng";
import { saltelli } from "../model/sens";
import type { Preset } from "../model/mc";
import { bridges } from "../model/bridges";
import type { FromCompute, ToCompute } from "../workers/compute.worker";
import { store } from "./store";

export interface ComputeState {
  status: "idle" | "computing" | "ready";
  mode: "worker" | "main";
  /** the last returned run's elapsed ms (real) */ ms: number;
  seed: number; n: number;
}
export const computeState = store<ComputeState>({ status: "idle", mode: "worker", ms: 0, seed: 0, n: 0 });
/** test hook: forces the worker to be unavailable (the main-thread fallback must still answer) */
export const computeHooks = { failWorker: false };

let worker: Worker | null = null;
let broken = false;
let nextId = 1;
const waiting = new Map<number, { ok: (v: unknown) => void; bad: (e: Error) => void }>();

function ensure(): Worker | null {
  if (worker || broken) return worker;
  if (computeHooks.failWorker) { broken = true; computeState.set({ mode: "main" }); return null; }
  try {
    worker = new Worker(new URL("../workers/compute.worker.ts", import.meta.url), { type: "module", name: "compute" });
    worker.onmessage = (e: MessageEvent<FromCompute>) => {
      const m = e.data, w = waiting.get(m.id);
      if (!w) return;
      waiting.delete(m.id);
      if (m.type === "error") w.bad(new Error(m.message)); else w.ok(m.type === "run" ? m.pack : m.type === "module" ? m.result : m.type === "saltelli" ? { S: m.S, ST: m.ST, V: m.V, ms: m.ms } : m.values);
    };
    worker.onerror = (ev) => {
      ev.preventDefault();
      broken = true; worker = null;
      computeState.set({ mode: "main" });
      waiting.forEach((w) => w.bad(new Error("WORKER FAILED")));
      waiting.clear();
    };
  } catch { broken = true; worker = null; computeState.set({ mode: "main" }); }
  return worker;
}
type OmitId<T> = T extends unknown ? Omit<T, "id"> : never;
function ask<T>(msg: OmitId<ToCompute>, fallback: () => T): Promise<T> {
  const w = ensure();
  if (!w) return Promise.resolve().then(fallback);
  const id = nextId++;
  return new Promise<T>((ok, bad) => {
    waiting.set(id, { ok: ok as (v: unknown) => void, bad });
    w.postMessage({ ...msg, id } as ToCompute);
  }).catch(() => fallback());
}
let latest = 0;
/** One seeded run: `nDraw` threads' worth of arrays, statistics from all `n`. Latest request wins the state line. */
export async function computeRun(seed: number, n: number, nDraw: number, custom: Preset | null = null): Promise<RunPack> {
  const me = ++latest;
  computeState.set({ status: "computing", seed, n });
  const t0 = performance.now();
  const pack = await ask<RunPack>({ type: "run", seed, n, nDraw, custom }, () => { computeState.set({ mode: "main" }); return makePack(seed, n, nDraw, custom); });
  if (me === latest) computeState.set({ status: "ready", ms: performance.now() - t0, seed, n });
  return pack;
}
export function computeModule(mod: ModuleId, art: Artifacts, seed: number): Promise<LabResult> {
  return ask<LabResult>({ type: "module", mod, art, seed }, () => runModule(mod, art, seed));
}

/** the first `count` u32 of the stream, recomputed live (worker, or the main thread if the worker is unavailable) */
export function computeU32(seed: number, count: number): Promise<number[]> {
  return ask<number[]>({ type: "u32", seed, count }, () => { const r = new Xoshiro128ss(seed); return Array.from({ length: count }, () => r.nextU32()); });
}
export function computeBridges(seed: number, k: number, n: number): Promise<Float32Array> {
  return ask<Float32Array>({ type: "bridges", seed, k, n }, () => bridges(seed, k, n));
}
export function computeSaltelli(seed: number, N: number): Promise<{ S: number[]; ST: number[]; V: number; ms: number }> {
  return ask({ type: "saltelli", seed, N }, () => { const t0 = performance.now(), s = saltelli(seed, N); return { S: s.S, ST: s.ST, V: s.V, ms: performance.now() - t0 }; });
}

/**
 * Main-thread client of the HiGHS worker. Created lazily (S06 entry or a LAB deep link), never on the LCP path.
 * Latest solve wins; RETRY re-creates the worker; real byte progress while the wasm streams.
 */
import type { FromWorker, ToWorker } from "../workers/highs.worker";

export interface HighsState { status: "idle" | "loading" | "ready" | "error"; loaded: number; total: number | null; version: string; loadMs: number; error: string | null }
export interface SolveResult { status: string; objective: number | null; columns: Record<string, number>; ms: number }
let state: HighsState = { status: "idle", loaded: 0, total: null, version: "", loadMs: 0, error: null };
const listeners = new Set<() => void>();
const set = (p: Partial<HighsState>) => { state = { ...state, ...p }; listeners.forEach((l) => l()); };
export const getHighs = () => state;
export const subscribeHighs = (l: () => void) => { listeners.add(l); return () => void listeners.delete(l); };

let worker: Worker | null = null;
let nextId = 1;
const waiting = new Map<number, { ok: (r: SolveResult) => void; bad: (m: string) => void }>();
/** test hook: forces the next worker creation to fail */
export const highsHooks = { fail: false };

function fail(message: string) {
  worker?.terminate();
  worker = null;
  waiting.forEach((w) => w.bad(message));
  waiting.clear();
  set({ status: "error", error: message });
}
function create() {
  if (worker) return;
  set({ status: "loading", loaded: 0, total: null, error: null });
  if (highsHooks.fail) { fail("WORKER COULD NOT START (FORCED)"); return; }
  try {
    worker = new Worker(new URL("../workers/highs.worker.ts", import.meta.url), { type: "module", name: "highs" });
  } catch (e) { fail(`WORKER COULD NOT START (${(e as Error).message})`); return; }
  worker.onmessage = (e: MessageEvent<FromWorker>) => {
    const m = e.data;
    if (m.type === "progress") set({ loaded: m.loaded, total: m.total });
    else if (m.type === "ready") set({ status: "ready", version: m.version, loadMs: m.loadMs, error: null });
    else if (m.type === "result") { waiting.get(m.id)?.ok({ status: m.status, objective: m.objective, columns: m.columns, ms: m.ms }); waiting.delete(m.id); }
    else if (m.type === "error" && m.where === "solve" && m.id !== undefined) { waiting.get(m.id)?.bad(m.message.toUpperCase()); waiting.delete(m.id); }
    else if (m.type === "error") fail(`SOLVER LOAD FAILED (${m.message})`);
  };
  worker.onerror = (e) => { e.preventDefault(); fail("WORKER COULD NOT LOAD"); };
  worker.postMessage({ type: "init" } satisfies ToWorker);
}
export function startHighs() { if (state.status === "idle") create(); }
export function retryHighs() { if (state.status === "error") { worker = null; create(); } }
/** resolves when the solver is ready, or rejects on a load failure */
function ready(): Promise<void> {
  return new Promise((ok, bad) => {
    const check = () => {
      if (state.status === "ready") { off(); ok(); } else if (state.status === "error") { off(); bad(new Error(state.error ?? "SOLVER UNAVAILABLE")); }
    };
    const off = subscribeHighs(check);
    startHighs();
    check();
  });
}
export async function solveLp(text: string): Promise<SolveResult> {
  await ready();
  const id = nextId++;
  return new Promise((ok, bad) => {
    waiting.set(id, { ok, bad: (m) => bad(new Error(m)) });
    worker!.postMessage({ type: "solve", id, text, options: { output_flag: false, threads: 1, random_seed: 0 } } satisfies ToWorker);
  });
}

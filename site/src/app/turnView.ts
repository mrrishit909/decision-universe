/** The one store the Turn layer, the ledgers and the inspector derive from. */
import { store } from "../state/store";
import type { RunPack } from "../model/runpack";
import type { Preset } from "../model/mc";

export type Mode = "none" | "turn" | "pair" | "fall";
export interface TurnView {
  mode: Mode;
  cam: "G0" | "G1" | "G2" | "G5";
  /** the decision keys: A is the left or only Turn, B the right of a PAIR */
  decA: string; decB: string;
  alpha: number;
  /** 0 = the Turn, 1 = the waterfall */ unroll: number;
  /** a drawn future's index, lit in both Turns of a pair; null = none */ hovered: number | null;
  /** performance.now() when the S08 echo began, 0 when idle */ echoStart: number;
  seed: number; n: number;
  pack: RunPack | null;
  /** THE LAB lever set, a fourth decision "custom" when non-null */ custom: Preset | null;
  /** how many futures are drawn this run (min of the tier cap and n) */ drawn: number;
}
export const SEED = 20261011;
export const turnView = store<TurnView>({
  mode: "turn", cam: "G0", decA: "build_now", decB: "phased", alpha: 1, unroll: 0, hovered: null, echoStart: 0, seed: SEED, n: 20000, pack: null, custom: null, drawn: 0,
});
export function setTurn(p: Partial<TurnView>) {
  const cur = turnView.get() as unknown as Record<string, unknown>;
  for (const k of Object.keys(p)) if (cur[k] !== (p as Record<string, unknown>)[k]) { turnView.set(p); return; }
}
export const decIndex = (key: string) => (key === "build_now" ? 0 : key === "phased" ? 1 : key === "delay_one_year" ? 2 : 3);
/** the visitor's last decision and seed, read by S08 */
export const visitor = { decision: "build_now", seed: SEED, label: "BUILD NOW" };

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { getActive, getProgress } from "../scroll/engine";
import { useActiveScene, useLatest, useProgress } from "../scroll/hooks";
import { stepState } from "../motion/progress";
import { turnView, setTurn } from "../app/turnView";
import { HonestyChip, type Honesty } from "../components/HonestyChip";

/** Steps with hysteresis for a pinned scene; applied on every tick of the ACTIVE scene and again when a direct jump activates it. */
export function useSteps(id: string, thresholds: readonly number[], apply: (step: number, p: number) => void) {
  const prev = useRef(0);
  const cb = useLatest(apply);
  useProgress(id, (p) => {
    if (getActive() !== id) return;
    prev.current = stepState(prev.current, p, thresholds);
    cb.current(prev.current, p);
  });
  const active = useActiveScene();
  useEffect(() => {
    if (active !== id) return;
    const p = getProgress(id);
    prev.current = thresholds.filter((t) => p >= t).length;
    cb.current(prev.current, p);
  }, [active, id]); // eslint-disable-line react-hooks/exhaustive-deps
}
export const useTurn = () => useSyncExternalStore(turnView.subscribe, turnView.get, turnView.get);
export { setTurn };

export function Column({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`scene-col ${className}`}>{children}</div>;
}
/** inline on D; a scrim panel above the nav on T and M (text never sits on the light) */
export function Lower({ children }: { children: ReactNode }) { return <div className="scene-lower" tabIndex={0} role="group" aria-label="Controls and readouts">{children}</div>; }
/** the chip text comes from the artifact's tags map: "OBSERVED/DERIVED" prints as OBSERVED · DERIVED */
export function Tag({ text }: { text: string }) {
  const [first, ...rest] = text.split("/");
  const head = (first ?? "SYNTHETIC").toUpperCase() as Honesty;
  return <HonestyChip tag={head} detail={rest.length ? rest.join(" · ") : undefined} />;
}
/** the unit line printed under every Turn view */
export function UnitLine({ drawn, n, seed }: { drawn: number; n: number; seed: number }) {
  return <p className="unit-line mono-label" data-unit-line>OUTWARD = YEARS · ONE FULL TURN = MONEY BACK · {drawn.toLocaleString("en-US")} OF {n.toLocaleString("en-US")} FUTURES DRAWN · SEED {seed}</p>;
}
/** hollow brackets: a confidence interval (a net cast by a procedure); never filled */
export function Bracket({ lo, hi, min, max, label }: { lo: number; hi: number; min: number; max: number; label: string }) {
  const k = (v: number) => `${(((v - min) / (max - min)) * 100).toFixed(2)}%`;
  return (
    <svg className="bracket" data-interval="confidence" role="img" aria-label={label} width="100%" height="14">
      <line x1={k(lo)} x2={k(hi)} y1="7" y2="7" stroke="#fff" strokeWidth="1" />
      <line x1={k(lo)} x2={k(lo)} y1="1" y2="13" stroke="#fff" strokeWidth="1" />
      <line x1={k(hi)} x2={k(hi)} y1="1" y2="13" stroke="#fff" strokeWidth="1" />
    </svg>
  );
}
/** the footer on every scene from S01: licence note, seed, the scene's citation and the first limitation, verbatim */
export function Foot({ meta, cite }: { meta: any; cite?: ReactNode }) {  
  if (!meta) return null;
  return (
    <p className="scene-foot mono-label" data-foot>
      {meta.licence_note} · SEED {meta.seed}{cite ? <> · {cite}</> : null} · {meta.limitations[0]}
    </p>
  );
}

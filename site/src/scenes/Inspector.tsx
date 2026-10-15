import { useMemo } from "react";
import { useTurn, setTurn } from "./common";
import { decIndex } from "../app/turnView";
import { inputsOf } from "../model/turn";
import { PRESETS } from "../model/mc";
import { fmt, pct } from "../app/data";

/** Thread Inspector (interaction 13): futures sorted by final NPV; the range input is keyboard-native (Left/Right). */
export function Inspector({ dec }: { dec: string }) {
  const v = useTurn();
  const d = v.pack?.decisions[decIndex(dec)];
  const order = useMemo(() => {
    if (!d) return [] as number[];
    const n = Math.min(v.drawn, d.npv.length);
    return Array.from({ length: n }, (_, i) => i).sort((a, b) => d.npv[a]! - d.npv[b]!);
  }, [d, v.drawn]);
  if (!d || !v.pack || !order.length) return <p className="state-line">COMPUTING THE FUTURES</p>;
  const rank = v.hovered === null ? -1 : order.indexOf(v.hovered);
  const preset = dec === "custom" && v.custom ? v.custom : PRESETS[dec]!;
  const i = v.hovered;
  const inp = i === null ? null : inputsOf(v.pack.draws, i, preset);
  return (
    <div className="inspector-inline" data-inspector>
      <label className="slider">
        <span className="mono-label">THREAD, SORTED BY FINAL NPV</span>
        <input type="range" min={0} max={order.length - 1} step={1} value={Math.max(0, rank)} aria-valuetext={i === null ? "none chosen" : `future ${i}`}
          onChange={(e) => setTurn({ hovered: order[Number(e.target.value)]! })} onBlur={() => undefined} />
      </label>
      {i !== null && inp ? (
        <p className="readout mono-label" data-thread={i}>
          FUTURE {i} · INVESTMENT {fmt(inp.investment, 1)} · FIRST-YEAR REVENUE {fmt(inp.revenue1, 1)} · GROWTH {pct(inp.growth)} · MARGIN {pct(inp.margin)} · DISCOUNT RATE {pct(inp.rate)} · NPV {fmt(d.npv[i]!, 1)} M USD · PAYBACK {Number.isNaN(d.pay[i]!) ? "NEVER" : `YEAR ${d.pay[i]!.toFixed(1)}`}
        </p>
      ) : <p className="note-line">LIGHTS ONE WORLD IN EVERY TURN.</p>}
    </div>
  );
}

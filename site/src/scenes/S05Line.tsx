import { useMemo, useRef, useState } from "react";
import { Track } from "../scroll/Track";
import { WordReveal } from "../components/WordReveal";
import { useArtifact } from "../data/useArtifact";
import { ArtifactStatus, SceneErrors } from "../components/StateUI";
import { META, M06, M09, fmt } from "../app/data";
import { costAt, argminThreshold, thresholdTheory } from "../model/credit";
import { Column, Lower, Tag, Foot, useSteps, setTurn } from "./common";
import { HonestyChip } from "../components/HonestyChip";
import type { SceneDef } from "../app/scenes";

 
const CW = 380, CH = 480, X0 = 96, X1 = 236;

function Column5({ m, t, setT, cFn }: { m: any; t: number; setT: (t: number) => void; cFn: number }) {
  const p: number[] = m.test.p_bad, y: number[] = m.test.y_bad;
  const curve = useMemo(() => Array.from({ length: 101 }, (_, k) => ({ t: k / 100, c: costAt(p, y, k / 100, cFn, 1).cost })), [p, y, cFn]);
  const cmax = Math.max(...curve.map((c) => c.c));
  const [tOpt] = argminThreshold(p, y, cFn, 1);
  const theory = thresholdTheory(cFn, 1);
  const Y = (v: number) => 14 + v * (CH - 28);
  const ref = useRef<SVGSVGElement>(null);
  const drag = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const v = ((e.clientY - r.top) / r.height) * CH;
    setT(Math.round(Math.min(1, Math.max(0, (v - 14) / (CH - 28))) * 100) / 100);
  };
  const path = curve.map((c, i) => `${i ? "L" : "M"}${(252 + (c.c / cmax) * 110).toFixed(1)},${Y(c.t).toFixed(1)}`).join(" ");
  const marks: [string, number][] = [[`OPTIMUM ${fmt(tOpt, 2)}`, tOpt], ["0.5", 0.5], [`1/${Math.round(1 / theory)} THEORY`, theory]];
  return (
    <svg ref={ref} className="credit" viewBox={`0 0 ${CW} ${CH}`} role="img" aria-label="Credit column: 250 test applicants by predicted probability of default, top is 0, bottom is 1"
      onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); drag(e); }} onPointerMove={(e) => { if (e.buttons) drag(e); }}>
      {p.map((v, i) => (
        <line key={i} x1={X0} x2={X1} y1={Y(v)} y2={Y(v)} stroke={y[i] ? "#B48CFF" : "#fff"} strokeWidth="1" strokeOpacity={v > t ? 0.4 : 0.9} />
      ))}
      <path d={path} fill="none" stroke="#fff" strokeWidth="1" />
      {curve.map((c) => c.t).includes(tOpt) ? <rect x={252 + (curve[Math.round(tOpt * 100)]!.c / cmax) * 110 - 3} y={Y(tOpt) - 3} width="6" height="6" fill="#fff" /> : null}
      {marks.map(([label, v], i) => (
        <g key={label}>
          <line x1={X0 - 8} x2={X0 - 2} y1={Y(v)} y2={Y(v)} stroke="#fff" />
          <text x={X0 - 12} y={Y(v) + (i === 2 ? 11 : i === 1 ? 3 : -4)} textAnchor="end" className="svg-t">{label}</text>
        </g>
      ))}
      <line x1={X0 - 24} x2={X1 + 8} y1={Y(t)} y2={Y(t)} stroke="#fff" strokeWidth="1" data-threshold-line />
      <rect x={X1 + 8} y={Y(t) - 22} width="44" height="44" fill="#fff" fillOpacity="0.9" data-handle />
      <text x={X1 + 30} y={Y(t) + 4} textAnchor="middle" fontSize="11" fill="#000">{fmt(t, 2)}</text>
      <text x="0" y="10" className="svg-t">P(BAD) 0</text><text x="0" y={CH - 2} className="svg-t">1</text>
    </svg>
  );
}

function Cards({ m9 }: { m9: any }) {
  const [i, setI] = useState(0);
  const disp = m9.features.display;
  const name = (f: string) => disp.features[f] ?? f;
  const val = (f: string, v: any) => (disp.categories[f]?.[v] ?? (typeof v === "number" ? fmt(v) : String(v)));
  const a = m9.applicants[i], r = m9.results[i];
  return (
    <div className="cf" data-cf tabIndex={0} role="group" aria-label="Counterfactuals">
      <div className="cf-cards" role="radiogroup" aria-label="Applicant">
        {m9.applicants.map((x: any, k: number) => (
          <button key={k} type="button" role="radio" aria-checked={k === i} className={`chip-btn ${k === i ? "is-on" : ""}`} onClick={() => setI(k)}>APPLICANT {x.row_1based}</button>
        ))}
      </div>
      <p className="note-line">{fmt(a.duration)} MONTHS · {fmt(a.amount)} DM · {val("checking", a.checking).toUpperCase()} · SAVINGS {val("savings", a.savings).toUpperCase()}</p>
      {r.targets.map((t: any) => (
        <div key={t.target} className="cf-target" data-target={t.target}>
          <p className="readout mono-label">TARGET {fmt(t.target, 3)} · P(BAD) {fmt(t.base_p_bad, 3)} {t.found ? `TO ${fmt(t.p_bad_after, 3)}` : "· NO CHANGE FOUND IN THE SEARCHED GRID"}</p>
          {t.found ? <ul className="step-list">{Object.entries(t.changes).map(([f, [from, to]]: any) => <li key={f} className="on">{name(f).toUpperCase()}: {String(val(f, from)).toUpperCase()} → {String(val(f, to)).toUpperCase()}</li>)}</ul> : null}
        </div>
      ))}
      <p className="note-line" data-immutable>CANNOT CHANGE: {m9.features.immutable.map((f: string) => `${name(f).toUpperCase()} ${String(val(f, a[f])).toUpperCase()}`).join(" · ")}</p>
      <p className="caveat cf-label" data-cf-label>MODEL COUNTERFACTUAL · NOT A CAUSAL CLAIM · WHAT FLIPS THIS MODEL, NOT WHAT CHANGES A LIFE</p>
    </div>
  );
}

/** S05 Draw the line: the credit column, the cost of each mistake, then model counterfactuals. */
export function S05Line({ def }: { def: SceneDef }) {
  const [meta] = useArtifact(META);
  const [m6, r6] = useArtifact(M06);
  const [m9, r9] = useArtifact(M09);
  const [t, setT] = useState(0.5);
  const [cFn, setCFn] = useState(5);
  const [stage, setStage] = useState(0);
  useSteps(def.id, [0.7], (s) => { setStage(s); setTurn({ mode: "turn", cam: "G1", alpha: 0.12, unroll: 0 }); });
  const m = m6.status === "ready" ? m6.data : null;
  const c = m ? costAt(m.test.p_bad, m.test.y_bad, t, cFn, 1) : null;
  const pub = m ? m.vectors.find((v: any) => v.kind === "cost" && v.c_fn === cFn && Math.abs(v.t - t) < 1e-9) : null;
  const iqr = m?.repeated_splits.t_opt_iqr;
  return (
    <Track id={def.id} height={def.track} landing={def.landing} className="scene scene-line">
      <SceneErrors id={def.id} specs={[M06, M09, META]} />
      <Column>
        <p className="scene-kicker">S05 · {stage ? "WHAT WOULD FLIP THE MODEL" : "DRAW THE LINE"}</p>
        <WordReveal as="h2" id={`${def.id}-title`} tabIndex={-1} data-scene-heading className="scene-title scene-title--sm"
          text={stage ? "What would flip the model?" : "Where you draw the line depends on what a mistake costs."} mode={{ kind: "time", playKey: stage + 1, per: 500, stagger: 50 }} />
        <p className="caveat">{stage ? "SMALLEST CHANGE TO THE INPUTS THAT FLIPS THE MODEL'S DECISION." : `HERE, APPROVING A BAD LOAN COSTS ${cFn === 5 ? "FIVE" : cFn} TIMES REJECTING A GOOD ONE.`}</p>
        <div className="chip-row">
          {stage ? (m9.status === "ready" ? <><Tag text={m9.data.tags.applicants} /><Tag text={m9.data.tags.model} /></> : null)
            : (m ? <><Tag text={m.tags.test} /><HonestyChip tag="DERIVED" detail="COST CURVE" /></> : null)}
        </div>
      </Column>
      <div className="visual visual--credit">
        {!stage ? (
          <ArtifactStatus file="m06_credit.json" state={m6} retry={r6} empty="UNAVAILABLE">{(mm) => <Column5 m={mm} t={t} setT={setT} cFn={cFn} />}</ArtifactStatus>
        ) : (
          <ArtifactStatus file="m09_counterfactual.json" state={m9} retry={r9} empty="UNAVAILABLE">{(mm) => <Cards m9={mm} />}</ArtifactStatus>
        )}
      </div>
      <Lower>
        {!stage && c ? (
          <>
            <div className="ctl-row">
              <label className="slider"><span className="mono-label">THRESHOLD {fmt(t, 2)}</span>
                <input type="range" min={0.01} max={1} step={0.01} value={t} onChange={(e) => setT(Number(e.target.value))} aria-label="Rejection threshold" /></label>
              <label className="slider"><span className="mono-label">COST OF APPROVING A BAD LOAN {cFn}</span>
                <input type="range" min={1} max={10} step={1} value={cFn} onChange={(e) => setCFn(Number(e.target.value))} aria-label="Cost of approving a bad loan" /></label>
              <button type="button" className="btn-square" onClick={() => { setT(0.5); setCFn(5); }}>RESET</button>
            </div>
            <p className="readout mono-label" data-cost>COST PER APPLICANT {fmt(c.cost, 3)} · APPROVED BAD {c.fn} · REJECTED GOOD {c.fp}</p>
            <p className="note-line" data-parity>{pub ? `MATCHES PYTHON REFERENCE (1 OF 1 VECTORS) · RUNNING IN YOUR BROWSER` : "NO PUBLISHED VECTOR FOR THIS THRESHOLD AND COST · COMPUTED IN YOUR BROWSER FROM THE PUBLISHED PROBABILITIES"}</p>
            <p className="note-line">GRID OPTIMUM {fmt(m.optimum.t_opt_grid, 2)} · REPEATED SPLITS MEDIAN {fmt(m.repeated_splits.t_opt_median, 2)}, MIDDLE HALF {fmt(iqr[0], 2)} TO {fmt(iqr[1], 2)} (30 SPLITS, PRECOMPUTED · PYTHON REFERENCE) · AT 5:1 THE CALIBRATED THEORY SAYS 1/6</p>
            <p className="scene-foot mono-label">UCI · CC BY 4.0 · HOFMANN (1994) · DOI {m.dataset.doi}</p>
          </>
        ) : null}
      </Lower>
        <Foot meta={meta.status === "ready" ? meta.data : null} cite={stage ? "UCI GERMAN CREDIT · CC BY 4.0" : undefined} />
    </Track>
  );
}

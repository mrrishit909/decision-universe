import { useMemo, useState, useSyncExternalStore } from "react";
import { Track } from "../scroll/Track";
import { WordReveal } from "../components/WordReveal";
import { Radio } from "../components/Radio";
import { useArtifact } from "../data/useArtifact";
import { ArtifactStatus, SceneErrors } from "../components/StateUI";
import { META, M05, fmt } from "../app/data";
import { windowed } from "../motion/progress";
import { easeSymmetric } from "../motion/ease";
import { Xoshiro128ss } from "../model/rng";
import { turnView } from "../app/turnView";
import { fallBox, classOf } from "../app/geometry";
import { Column, Lower, Tag, UnitLine, Foot, useSteps, useTurn, setTurn } from "./common";
import { HonestyChip } from "../components/HonestyChip";
import type { SceneDef } from "../app/scenes";

 
type Method = "AR(1)" | "SES";
const W = 360, H = 520;

function Forecast({ m, method, level }: { m: any; method: Method; level: "0.8" | "0.95" }) {
  const x: number[] = m.series.x, nt = m.series.n_train;
  const iv = (method === "AR(1)" ? m.intervals.ar1 : m.intervals.ses)[level] as number[][];
  const hold: number[] = m.intervals.holdout;
  const all = [...x, ...iv.flat()];
  const lo = Math.min(...all) - 2, hi = Math.max(...all) + 2;
  const px = (v: number) => 12 + ((v - lo) / (hi - lo)) * (W - 24);
  const total = nt + 12, py = (t: number) => 10 + (t / total) * (H - 20);
  const hist = x.slice(0, nt).map((v, i) => `${i ? "L" : "M"}${px(v).toFixed(1)},${py(i).toFixed(1)}`).join(" ");
  const covered = hold.filter((v, h) => v >= iv[h]![1]! && v <= iv[h]![2]!).length;
  const mean = iv.map((r, h) => `${h ? "L" : "M"}${px(r[0]!).toFixed(1)},${py(nt + h).toFixed(1)}`).join(" ");
  const lo_ = iv.map((r, h) => `${h ? "L" : "M"}${px(r[1]!).toFixed(1)},${py(nt + h).toFixed(1)}`).join(" ");
  const hi_ = iv.map((r, h) => `${h ? "L" : "M"}${px(r[2]!).toFixed(1)},${py(nt + h).toFixed(1)}`).join(" ");
  // 40 seeded paths from the fitted AR(1) model, simulated in the browser
  const paths = useMemo(() => {
    const f = m.fits.ar1, rng = new Xoshiro128ss(m.series.seed + 7), out: string[] = [];
    const sd = Math.sqrt(f.sigma2);
    for (let s = 0; s < 40; s++) {
      let cur = f.last, d = `M${px(cur).toFixed(1)},${py(nt - 1).toFixed(1)}`;
      for (let h = 1; h <= 12; h++) { cur = f.mu + f.phi * (cur - f.mu) + sd * rng.normal(); d += `L${px(cur).toFixed(1)},${py(nt - 1 + h).toFixed(1)}`; }
      out.push(d);
    }
    return out;
  }, [m]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <svg className="forecast" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Forecast: time runs downward; the series falls to now, then forecast paths with dashed prediction interval hairlines">
        <path d={hist} fill="none" stroke="#fff" strokeWidth="1.2" />
        {method === "AR(1)" ? paths.map((d, i) => <path key={i} d={d} fill="none" stroke="#fff" strokeOpacity="0.12" strokeWidth="1" />) : null}
        <path d={mean} fill="none" stroke="#fff" strokeWidth="1.2" />
        <path d={lo_} data-interval="prediction" fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="4 4" />
        <path d={hi_} data-interval="prediction" fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="4 4" />
        {hold.map((v, h) => <rect key={h} x={px(v) - 2} y={py(nt + h) - 2} width="4" height="4" fill={v >= iv[h]![1]! && v <= iv[h]![2]! ? "#fff" : "#B48CFF"} />)}
        <text x="12" y={py(nt) - 6} className="svg-t">NOW</text>
      </svg>
      <p className="readout mono-label" data-coverage>{Number(level) * 100}% INTERVAL COVERED {covered} OF {hold.length} HOLD-OUT VALUES ({fmt((covered / hold.length) * 100, 0)}%)</p>
    </>
  );
}

/** S04 The Unroll: the Turn becomes a waterfall (time falls), then a forecast whose bands are counted. */
export function S04Unroll({ def }: { def: SceneDef }) {
  const v = useTurn();
  const [meta] = useArtifact(META);
  const [m5, retry] = useArtifact(M05);
  const [method, setMethod] = useState<Method>("AR(1)");
  const [level, setLevel] = useState<"80" | "95">("95");
  const [phase, setPhase] = useState(0);
  useSteps(def.id, [0.5], (_s, p) => {
    const u = easeSymmetric(windowed(p, 0, 0.4));
    const hand = windowed(p, 0.42, 0.55);
    setTurn({ mode: u > 0 ? "fall" : "turn", cam: "G1", unroll: u, alpha: 1 - hand * 0.88 });
    setPhase(p >= 0.5 ? 1 : 0);
  });
  const lv = (level === "95" ? "0.95" : "0.8") as "0.8" | "0.95";
  const cls = typeof window === "undefined" ? "D" : classOf(document.documentElement.clientWidth);
  const fb = fallBox(document.documentElement.clientWidth, innerHeight);
  void cls; void turnView;
  const cov = m5.status === "ready" ? m5.data.coverage : null;
  const covRow = cov ? (method === "AR(1)" ? cov.ar1 : cov.ses)[lv] as number[] : null;
  useSyncExternalStore(turnView.subscribe, turnView.get, turnView.get);
  return (
    <Track id={def.id} height={def.track} landing={def.landing} className="scene scene-unroll">
      <SceneErrors id={def.id} specs={[M05, META]} />
      <Column>
        <p className="scene-kicker">S04 · THE TURN UNROLLS</p>
        <WordReveal as="h2" id={`${def.id}-title`} tabIndex={-1} data-scene-heading className="scene-title scene-title--sm"
          text={phase ? "A forecast band is a promise. Count how often it keeps it." : "Unroll the turn, and time falls."} mode={{ kind: "time", playKey: phase + 1, per: 500, stagger: 60 }} />
        <div className="chip-row">
          {phase ? <>
            <ArtifactStatus file="m05_forecast.json" state={m5} retry={retry} empty="UNAVAILABLE">{(m) => <><Tag text={m.tags.series} /><Tag text={m.tags.intervals} /><HonestyChip tag="SIMULATED" detail="COVERAGE STUDY" /></>}</ArtifactStatus>
          </> : <HonestyChip tag="SYNTHETIC" />}
        </div>
      </Column>
      {!phase ? (
        <div className="fall-labels" aria-hidden="true" style={{ left: fb.x0, top: fb.y0, width: fb.w, height: fb.h }}>
          <span style={{ left: 0, top: -22 }}>0% RECOVERED</span>
          <span style={{ left: "55.5%", top: -22 }}>100%</span>
          <span style={{ right: 0, top: -22 }}>180%</span>
          <span style={{ left: 0, top: 0 }}>YEAR 0</span>
          <span style={{ left: 0, bottom: 0 }}>YEAR 8 ↓</span>
        </div>
      ) : null}
      <div className={`visual visual--forecast ${phase ? "is-on" : ""}`}>
        <ArtifactStatus file="m05_forecast.json" state={m5} retry={retry} empty="UNAVAILABLE">{(m) => phase ? <Forecast m={m} method={method} level={lv} /> : null}</ArtifactStatus>
      </div>
      <Lower>
        {phase ? (
          <>
            <div className="ctl-row">
              <Radio label="LEVEL" value={level} options={["80", "95"] as const} onChange={setLevel} render={(x) => `${x}%`} />
              <Radio label="METHOD" value={method} options={["AR(1)", "SES"] as const} onChange={setMethod} />
            </div>
            <ArtifactStatus file="m05_forecast.json" state={m5} retry={retry} empty="UNAVAILABLE">{(m) => (
              <>
                <p className="note-line">{level}% PREDICTION INTERVAL · {m.spec.labels.prediction.toUpperCase()}</p>
                {covRow ? <p className="readout mono-label" data-coverage-study>{level}% INTERVAL COVERED {fmt(Math.min(...covRow) * 100, 1)}% TO {fmt(Math.max(...covRow) * 100, 1)}% OF {fmt(m.coverage.reps)} SIMULATED SERIES, HORIZONS 1 TO 12 · PRECOMPUTED · PYTHON REFERENCE</p> : null}
                {method === "SES" ? <p className="note-line">{m.spec.reading.toUpperCase()}</p> : null}
                <p className="note-line">40 SEEDED PATHS FROM THE FITTED AR(1) MODEL · SEED {m.series.seed + 7} · RUNNING IN YOUR BROWSER</p>
              </>
            )}</ArtifactStatus>
          </>
        ) : <p className="note-line">ANGLE BECOMES x (SHARE OF THE INVESTMENT RECOVERED), RADIUS BECOMES y (YEARS, DOWNWARD). 100% RECOVERED IS A GAP OF NO LIGHT.</p>}
        <UnitLine drawn={v.drawn} n={v.n} seed={v.seed} />
      </Lower>
        <Foot meta={meta.status === "ready" ? meta.data : null} />
    </Track>
  );
}

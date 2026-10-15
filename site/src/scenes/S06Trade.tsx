import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Track } from "../scroll/Track";
import { WordReveal } from "../components/WordReveal";
import { Radio } from "../components/Radio";
import { useArtifact } from "../data/useArtifact";
import { ArtifactStatus, SceneErrors, LoadingLine, RetryButton } from "../components/StateUI";
import { META, M07, M08, fmt } from "../app/data";
import { lpText, type LpProblem } from "../model/lp";
import { getHighs, solveLp, startHighs, subscribeHighs, retryHighs } from "../state/highs";
import { computeSaltelli } from "../state/compute";
import { Column, Lower, Tag, Foot, useSteps, useTurn, setTurn } from "./common";
import { useActiveScene } from "../scroll/hooks";
import { HonestyChip } from "../components/HonestyChip";
import type { SceneDef } from "../app/scenes";

 
const PW = 380, PH = 360;

function Pareto({ m, live }: { m: any; live: { e: number; profit: number } | null }) {
  const f = m.front as any[];
  const e0 = f[0].emissions, e1 = f[f.length - 1].emissions, p0 = f[0].profit, p1 = f[f.length - 1].profit;
  const X = (e: number) => 30 + ((e - e0) / (e1 - e0)) * (PW - 60), Y = (p: number) => PH - 40 - ((p - p0) / (p1 - p0)) * (PH - 80);
  return (
    <svg className="pareto" viewBox={`0 0 ${PW} ${PH}`} role="img" aria-label="Pareto front: profit against emissions, 21 efficient points">
      {f.map((pt: any, i: number) => {
        const anchor = i === 0 || i === f.length - 1;
        return <rect key={i} x={X(pt.emissions) - 3} y={Y(pt.profit) - 3} width="6" height="6" fill={anchor ? "#B48CFF" : "#fff"} data-front={i} />;
      })}
      {live ? <rect x={X(live.e) - 5} y={Y(live.profit) - 5} width="10" height="10" fill="none" stroke="#fff" strokeWidth="1.5" data-live-point /> : null}
      <text x="30" y={PH - 14} className="svg-t">LESS EMISSIONS ·· {fmt(e0, 0)}</text>
      <text x={PW - 30} y={PH - 14} textAnchor="end" className="svg-t">{fmt(e1, 0)} ·· MORE EMISSIONS</text>
      <text x="30" y="14" className="svg-t">MORE PROFIT ↑ {fmt(p1, 0)}</text>
    </svg>
  );
}

const SOBOL_N = [256, 1024, 4096, 16384] as const;
function Sobol({ m, est }: { m: any; est: { S: number[]; ST: number[]; N: number; ms: number; seed: number } | null }) {
  const S: number[] = m.analytic.S, inter = Math.max(0, 1 - S.reduce((a, b) => a + b, 0));
  const parts = [...S, inter], names = ["S1 x1", "S2 x2", "S3 x3", "INTERACTIONS"];
  const H = 300, col = 90;
  let y = 20;
  const reps = m.sobol.find((s: any) => s.N === (est?.N ?? 1024));
  return (
    <svg className="sobol" viewBox="0 0 460 340" role="img" aria-label="Variance split of the Ishigami function into first-order shares and interactions">
      {parts.map((v, i) => {
        const h = v * H, yy = y; y += h;
        return (
          <g key={i} data-part={i}>
            <rect x="120" y={yy} width={col} height={Math.max(0, h - 1)} fill="#690DE2" fillOpacity={0.45 + 0.15 * (i % 2)} stroke="#B48CFF" strokeWidth="1" />
            <rect x="116" y={yy - 1} width={col + 8} height="2" fill="#fff" />
            <text x="116" y={yy + h / 2 + 4} textAnchor="end" className="svg-t">{names[i]} {fmt(v, 3)}</text>
            {i < 3 && est ? <rect x={120 + col + 14 + est.S[i]! * 80} y={yy + h / 2 - 1} width="1" height="12" fill="#fff" data-estimate={i} /> : null}
            {i < 3 && reps ? <text x={120 + col + 14} y={yy + h / 2 + 24} className="svg-t">{reps.replicates} REPLICATES · MEAN {fmt(reps.S_mean[i], 2)}</text> : null}
          </g>
        );
      })}
    </svg>
  );
}

/** S06 Trade-offs and what matters: a live HiGHS solve, then Saltelli indices recomputed in a worker. */
export function S06Trade({ def }: { def: SceneDef }) {
  const v = useTurn();
  const active = useActiveScene();
  const [meta] = useArtifact(META);
  const [m7, r7] = useArtifact(M07);
  const [m8, r8] = useArtifact(M08);
  const hs = useSyncExternalStore(subscribeHighs, getHighs, getHighs);
  const [stage, setStage] = useState(0);
  const [eps, setEps] = useState<number | null>(null);
  const [live, setLive] = useState<{ e: number; profit: number; status: string; ms: number; match: boolean } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [nSob, setNSob] = useState<number>(1024);
  const [est, setEst] = useState<{ S: number[]; ST: number[]; N: number; ms: number; seed: number } | null>(null);
  useSteps(def.id, [0.5], (s) => { setStage(s); setTurn({ mode: "turn", cam: "G1", alpha: 0.12, unroll: 0 }); });
  // the solver worker is created at S06 entry, never before
  useEffect(() => { if (active === def.id) startHighs(); }, [active, def.id]);
  const m = m7.status === "ready" ? m7.data : null;
  const e0 = m ? m.front[0].emissions : 0, e1 = m ? m.front[m.front.length - 1].emissions : 1;
  const epsV = eps ?? (m ? m.front[m.compromise_index].eps : 0);
  const seq = useRef(0);
  const solve = (e: number) => {
    if (!m) return;
    setEps(e);
    const me = ++seq.current;
    const p = m.problem as LpProblem;
    setErr(null);
    solveLp(lpText(p, p.b[0]!, e)).then((r) => {
      if (me !== seq.current) return;
      const hit = m.front.find((pt: any) => Math.abs(pt.eps - e) < 1e-9);
      setLive({ e, profit: r.objective ?? NaN, status: r.status, ms: r.ms, match: !!hit && Math.abs((r.objective ?? NaN) - hit.profit) <= 1e-6 + 1e-7 * Math.abs(hit.profit) });
    }).catch((x: Error) => { if (me === seq.current) setErr(x.message); });
  };
  useEffect(() => {
    if (stage !== 1 || m8.status !== "ready") return;
    let alive = true;
    void computeSaltelli(v.seed, nSob).then((r) => { if (alive) setEst({ S: r.S, ST: r.ST, N: nSob, ms: r.ms, seed: v.seed }); });
    return () => { alive = false; };
  }, [stage, nSob, v.seed, m8.status]);
  const vec = m8.status === "ready" ? m8.data.vectors.find((x: any) => x.kind === "saltelli" && x.seed === v.seed && x.N === nSob) : null;
  const gridEps = useMemo(() => (m ? m.front.map((p: any) => p.eps as number) : []), [m]);
  return (
    <Track id={def.id} height={def.track} landing={def.landing} className="scene scene-trade">
      <SceneErrors id={def.id} specs={[M07, M08, META]} />
      <Column>
        <p className="scene-kicker">S06 · {stage ? "WHAT MATTERS" : "TRADE-OFFS"}</p>
        <WordReveal as="h2" id={`${def.id}-title`} tabIndex={-1} data-scene-heading className="scene-title scene-title--sm"
          text="Some trade-offs are efficient. Most inputs are not what matters." mode={{ kind: "scrub", track: def.id, from: 0, to: 0.16 }} />
        <div className="chip-row">
          {!stage ? (m ? <><Tag text={m7.status === "ready" ? m7.data.tags.front : "DERIVED"} /><HonestyChip tag="SYNTHETIC" detail="PROBLEM" /></> : null)
            : (m8.status === "ready" ? <><Tag text={m8.data.tags.analytic} /><Tag text={m8.data.tags.sobol} /></> : null)}
        </div>
      </Column>
      <div className="visual visual--trade">
        {!stage ? (
          <ArtifactStatus file="m07_pareto.json" state={m7} retry={r7} empty="UNAVAILABLE">{(mm) => <Pareto m={mm} live={live && !err ? { e: live.e, profit: live.profit } : null} />}</ArtifactStatus>
        ) : (
          <ArtifactStatus file="m08_sensitivity.json" state={m8} retry={r8} empty="UNAVAILABLE">{(mm) => <Sobol m={mm} est={est} />}</ArtifactStatus>
        )}
      </div>
      <Lower>
        {!stage ? (
          <>
            {hs.status === "loading" ? <LoadingLine file="highs.wasm" loaded={hs.loaded} total={hs.total} /> : null}
            {hs.status === "error" ? <div className="state-error"><p className="state-line state-line--error">SOLVER UNAVAILABLE ({hs.error}) · SHOWING PRECOMPUTED · PYTHON REFERENCE</p><RetryButton onClick={retryHighs} /></div> : null}
            <label className="slider">
              <span className="mono-label">EPSILON: EMISSIONS CAP {fmt(epsV, 0)}</span>
              <input type="range" min={e0} max={e1} step={1} value={epsV} disabled={hs.status === "error"} aria-disabled={hs.status === "error"} title={hs.status === "error" ? "The solver could not load" : undefined}
                onChange={(e) => solve(Number(e.target.value))} aria-label="Emissions cap epsilon" />
            </label>
            <div className="ctl-row">
              <button type="button" className="btn-square" onClick={() => solve(gridEps[0])}>CLEANEST</button>
              <button type="button" className="btn-square" onClick={() => m && solve(gridEps[m.compromise_index])}>COMPROMISE</button>
              <button type="button" className="btn-square" onClick={() => solve(gridEps[gridEps.length - 1])}>MOST PROFIT</button>
              <button type="button" className="btn-square" onClick={() => { setEps(null); setLive(null); setErr(null); }}>RESET</button>
            </div>
            {live && !err ? (
              <p className="readout mono-label" data-solve>
                {live.status.toUpperCase()} · PROFIT {fmt(live.profit, 2)} AT CAP {fmt(live.e, 0)} · SOLVED IN YOUR BROWSER · HiGHS {hs.version} · {fmt(live.ms, 1)} MS · {live.match ? "MATCHES PYTHON REFERENCE (1 OF 1 VECTORS)" : "NO PUBLISHED VECTOR FOR THIS EPSILON · COMPUTED IN YOUR BROWSER"}
              </p>
            ) : err ? <p className="state-line state-line--error">SOLVE FAILED ({err})</p> : <p className="note-line">MOVE THE CAP: EACH POSITION IS A LIVE LINEAR PROGRAM. {m ? `${m.front.length} PUBLISHED POINTS, ALL OPTIMAL, PRECOMPUTED · PYTHON REFERENCE.` : ""}</p>}
            <p className="scene-foot mono-label">SOLVER: HiGHS (HUANGFU AND HALL), WEBASSEMBLY BUILD highs-js 1.15.3 · THE CURVE BETWEEN POINTS IS NEVER INTERPOLATED</p>
          </>
        ) : (
          <>
            <div className="ctl-row">
              <Radio label="N" value={String(nSob)} options={SOBOL_N.map(String)} render={(x) => Number(x).toLocaleString("en-US")} onChange={(x) => setNSob(Number(x))} />
              <button type="button" className="btn-square" onClick={() => setNSob(1024)}>RESET</button>
            </div>
            {est ? (
              <p className="readout mono-label" data-saltelli>
                RUNNING IN YOUR BROWSER · SEED {est.seed} · N {fmt(est.N)} · {fmt(est.ms, 0)} MS · S1 {est.S.map((x) => fmt(x, 3)).join(" · ")} · TOTAL {est.ST.map((x) => fmt(x, 3)).join(" · ")} · {vec ? "MATCHES PYTHON REFERENCE (1 OF 1 VECTORS)" : `NO PUBLISHED VECTOR FOR SEED ${est.seed} AT N ${fmt(est.N)} · COMPUTED IN YOUR BROWSER`}
              </p>
            ) : <p className="state-line" role="status">RUNNING IN YOUR BROWSER · SEED {v.seed}</p>}
            {m8.status === "ready" ? <p className="note-line">ANALYTIC INDICES (WHITE BARS): S1 {m8.data.analytic.S.map((x: number) => fmt(x, 3)).join(" · ")} · TOTAL {m8.data.analytic.ST.map((x: number) => fmt(x, 3)).join(" · ")}. x3 HAS NO FIRST-ORDER SHARE AND A LARGE TOTAL: IT MATTERS ONLY THROUGH x1.</p> : null}
          </>
        )}
      </Lower>
        <Foot meta={meta.status === "ready" ? meta.data : null} cite={stage ? "ISHIGAMI AND HOMMA (1990) · SALTELLI ET AL. (2008)" : "HiGHS"} />
    </Track>
  );
}

import { useMemo, useState } from "react";
import { Track } from "../scroll/Track";
import { WordReveal } from "../components/WordReveal";
import { Radio } from "../components/Radio";
import { useArtifact } from "../data/useArtifact";
import { ArtifactStatus, SceneErrors } from "../components/StateUI";
import { META, M04, fmt } from "../app/data";
import { betaBinomial } from "../model/bayes";
import { Column, Lower, Tag, Foot, useSteps, setTurn } from "./common";
import type { SceneDef } from "../app/scenes";

 
interface Row { label: string; n: number; cr: [number, number]; ci: [number, number]; live?: boolean }
const SHOW = [1, 2, 3, 5, 10, 20, 50, 100, 200];
const PRIORS: Record<string, [number, number]> = { "BETA(1,1) UNIFORM": [1, 1], "BETA(0.5,0.5)": [0.5, 0.5], "BETA(2,8)": [2, 8], "BETA(5,5)": [5, 5], "BETA(20,20)": [20, 20] };
const W = 300, ROW = 30, LABEL = 62;

function Column2({ rows, trueRate }: { rows: Row[]; trueRate: number | null }) {
  const x = (v: number) => LABEL + v * (W - LABEL - 6);
  return (
    <svg className="belief" viewBox={`0 0 ${W} ${rows.length * ROW + 24}`} role="img" aria-label="Belief column: time runs downward, each row one stage of evidence">
      <text x={LABEL} y="10" className="svg-t">RATE 0</text><text x={W - 6} y="10" textAnchor="end" className="svg-t">1</text>
      {rows.map((r, i) => {
        const y = 18 + i * ROW;
        return (
          <g key={`${r.label}-${i}`} data-row={i}>
            <text x="0" y={y + 9} className="svg-t">{r.label}</text>
            <rect data-interval="credible" x={x(r.cr[0])} y={y} width={Math.max(1, x(r.cr[1]) - x(r.cr[0]))} height="9" fill="#690DE2" fillOpacity="0.7" />
            <line data-interval="credible" x1={x(r.cr[0])} x2={x(r.cr[0])} y1={y} y2={y + 9} stroke="#B48CFF" strokeWidth="1" />
            <line data-interval="credible" x1={x(r.cr[1])} x2={x(r.cr[1])} y1={y} y2={y + 9} stroke="#B48CFF" strokeWidth="1" />
            <g data-interval="confidence">
              <line x1={x(r.ci[0])} x2={x(r.ci[1])} y1={y + 18} y2={y + 18} stroke="#fff" strokeWidth="1" />
              <line x1={x(r.ci[0])} x2={x(r.ci[0])} y1={y + 14} y2={y + 22} stroke="#fff" strokeWidth="1" />
              <line x1={x(r.ci[1])} x2={x(r.ci[1])} y1={y + 14} y2={y + 22} stroke="#fff" strokeWidth="1" />
            </g>
            {trueRate !== null ? <rect x={x(trueRate) - 1} y={y + 3} width="2" height="2" fill="#fff" /> : null}
          </g>
        );
      })}
    </svg>
  );
}

/** S03b Learning: a belief narrows as evidence arrives. Credible = filled band; confidence = hollow brackets; never one for the other. */
export function S03bLearning({ def }: { def: SceneDef }) {
  const [meta] = useArtifact(META);
  const [m4, retry] = useArtifact(M04);
  const [stage, setStage] = useState(0);
  const [priorKey, setPriorKey] = useState("BETA(1,1) UNIFORM");
  const [obs, setObs] = useState<boolean[]>([]);
  useSteps(def.id, [0.2, 0.4, 0.6, 0.8], (s) => { setStage(s); setTurn({ mode: "turn", cam: "G1", alpha: 0.2, unroll: 0 }); });
  const pub: Row[] = useMemo(() => {
    if (m4.status !== "ready") return [];
    const prior = betaBinomial(1, 1, 0, 0);
    const rows: Row[] = [{ label: "PRIOR", n: 0, cr: prior.credible95 as [number, number], ci: prior.confidence95_wilson as [number, number] }];
    for (const p of m4.data.sequential.path) if (SHOW.includes(p.n)) rows.push({ label: `n ${p.n} · k ${p.k}`, n: p.n, cr: [p.cr_lo, p.cr_hi], ci: [p.ci_lo, p.ci_hi] });
    return rows;
  }, [m4]);
  const limit = [1, 6, 8, 100, 100][stage]!;
  const shown = pub.filter((r) => (stage === 0 ? r.n === 0 : r.n <= [0, 10, 50, 200, 200][stage]!)).slice(0, limit);
  const [a0, b0] = PRIORS[priorKey]!;
  const live: Row[] = useMemo(() => {
    const out: Row[] = [];
    let k = 0;
    const first = betaBinomial(a0, b0, 0, 0);
    out.push({ label: "YOURS", n: 0, cr: first.credible95 as [number, number], ci: first.confidence95_wilson as [number, number], live: true });
    obs.forEach((s, i) => {
      k += s ? 1 : 0;
      const g = betaBinomial(a0, b0, k, i + 1);
      out.push({ label: `n ${i + 1} · k ${k}`, n: i + 1, cr: g.credible95 as [number, number], ci: g.confidence95_wilson as [number, number], live: true });
    });
    return out.slice(-9);
  }, [obs, a0, b0]);
  const post = betaBinomial(a0, b0, obs.filter(Boolean).length, obs.length);
  const labels = m4.status === "ready" ? m4.data.spec.labels : null;
  const cov = m4.status === "ready" ? m4.data.coverage : null;
  const same = cov && JSON.stringify(cov.credible_uniform_prior) === JSON.stringify(cov.wilson_confidence);
  return (
    <Track id={def.id} height={def.track} landing={def.landing} className="scene scene-learning">
      <SceneErrors id={def.id} specs={[M04, META]} />
      <Column>
        <p className="scene-kicker">S03b · LEARNING NARROWS A BELIEF</p>
        <WordReveal as="h2" id={`${def.id}-title`} tabIndex={-1} data-scene-heading className="scene-title" text="Evidence narrows a belief." mode={{ kind: "scrub", track: def.id, from: 0, to: 0.15 }} />
        <ArtifactStatus file="m04_bayes.json" state={m4} retry={retry} empty="UNAVAILABLE">{(m) => <Tag text={m.tags.sequential} />}</ArtifactStatus>
        <div className="iv-words" data-words-block>
          <p className="caveat" data-words="credible"><i className="swatch swatch--fill" /> 95% CREDIBLE INTERVAL · {labels ? labels.credible95.toUpperCase() : ""}</p>
          <p className="caveat" data-words="confidence"><i className="swatch swatch--bracket" /> 95% CONFIDENCE INTERVAL · {labels ? labels["confidence95_*"].toUpperCase() : ""}</p>
        </div>
      </Column>
      <div className="visual visual--belief">
        <ArtifactStatus file="m04_bayes.json" state={m4} retry={retry} empty="UNAVAILABLE">{(m) => (
          <>
            {stage < 4 ? <Column2 rows={[...shown, ...live.slice(0, 0)]} trueRate={m.sequential.p_true} /> : null}
            {stage >= 4 && cov ? (
              <div className="coverage" data-coverage>
                <p className="mono-label">EXACT COVERAGE AT n {cov.n}, TRUE RATE {cov.p.join(" · ")}</p>
                <p className="readout mono-label" data-words="credible">CREDIBLE (UNIFORM PRIOR) {cov.credible_uniform_prior.map((x: number) => fmt(x * 100, 1)).join("% · ")}%</p>
                <p className="readout mono-label" data-words="confidence">WILSON CONFIDENCE {cov.wilson_confidence.map((x: number) => fmt(x * 100, 1)).join("% · ")}%</p>
                <p className="readout mono-label" data-words="credible">CREDIBLE, BETA(2,8) PRIOR {cov.credible_beta_2_8_prior.map((x: number) => fmt(x * 100, 1)).join("% · ")}%</p>
                {same ? <p className="note-line">AT n {cov.n} THE TWO PROCEDURES COVER THE SAME SET OF OUTCOMES, SO THE NUMBERS ARE EQUAL. THE STATEMENTS ARE STILL DIFFERENT: ONE IS A PROBABILITY GIVEN THE DATA, THE OTHER A LONG-RUN RATE.</p> : null}
                <p className="note-line">AVERAGE CREDIBLE COVERAGE OVER A UNIFORM PRIOR {fmt(cov.credible_average_over_uniform_prior * 100, 1)}% · PRECOMPUTED · PYTHON REFERENCE</p>
              </div>
            ) : null}
          </>
        )}</ArtifactStatus>
      </div>
      <Lower>
        <div className="ctl-row">
          <Radio label="PRIOR" value={priorKey} options={Object.keys(PRIORS)} onChange={(k) => { setPriorKey(k); setObs([]); }} asSelect />
          <button type="button" className="btn-square" onClick={() => setObs((o) => [...o, true])}>SUCCESS</button>
          <button type="button" className="btn-square" onClick={() => setObs((o) => [...o, false])}>FAILURE</button>
          <button type="button" className="btn-square" onClick={() => { setObs([]); setStage(0); setPriorKey("BETA(1,1) UNIFORM"); }}>RESET</button>
        </div>
        <div className="live-belief" data-live aria-live="polite">
          <Column2 rows={live} trueRate={null} />
          <p className="readout mono-label" data-posterior>YOUR EVIDENCE: {obs.filter(Boolean).length} SUCCESS IN {obs.length} · POSTERIOR BETA({a0 + obs.filter(Boolean).length}, {b0 + obs.length - obs.filter(Boolean).length}) · CREDIBLE {fmt(post.credible95[0]!, 3)} TO {fmt(post.credible95[1]!, 3)} · CONFIDENCE (WILSON) {fmt(post.confidence95_wilson[0]!, 3)} TO {fmt(post.confidence95_wilson[1]!, 3)} · RUNNING IN YOUR BROWSER</p>
        </div>
      </Lower>
        <Foot meta={meta.status === "ready" ? meta.data : null} />
    </Track>
  );
}

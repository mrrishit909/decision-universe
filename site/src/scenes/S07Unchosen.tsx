import { useState } from "react";
import { Track } from "../scroll/Track";
import { WordReveal } from "../components/WordReveal";
import { Radio } from "../components/Radio";
import { useArtifact } from "../data/useArtifact";
import { ArtifactStatus, SceneErrors } from "../components/StateUI";
import { META, M10, FACTS, VALIDATION, fmt, fv } from "../app/data";
import { Column, Lower, Tag, Foot, useSteps, setTurn } from "./common";
import { HonestyChip } from "../components/HonestyChip";
import type { SceneDef } from "../app/scenes";

 
const KEYS = ["naive", "ols_coef", "ra_att", "ipw_att"] as const;
type K = (typeof KEYS)[number];
const W = 400;

function Dag({ d }: { d: any }) {
  const pos: Record<string, [number, number]> = { X: [30, 24], P: [30, 84], U: [30, 144], T: [170, 54], Y: [300, 84] };
  return (
    <svg className="dag" viewBox="0 0 340 170" role="img" aria-label="Causal graph">
      {d.edges.map((e: string[], i: number) => { const a = e[0]!, b = e[1]!; return (
        <line key={i} x1={pos[a]![0] + 8} y1={pos[a]![1]} x2={pos[b]![0] - 8} y2={pos[b]![1]} stroke="#fff" strokeOpacity={a === "U" ? 0.45 : 0.9} strokeWidth="1" />
      ); })}
      {d.nodes.map((n: any) => (
        <g key={n.id}>
          <rect x={pos[n.id]![0] - 3} y={pos[n.id]![1] - 3} width="6" height="6" fill={n.unobserved ? "#B48CFF" : "#fff"} />
          <text x={pos[n.id]![0] + 8} y={pos[n.id]![1] - 6} className="svg-t">{n.id}{n.unobserved ? " (UNOBSERVED)" : ""}</text>
        </g>
      ))}
    </svg>
  );
}

function Rows({ m, sample, synth, gamma, sel }: { m: any; sample: string; synth: boolean; gamma: string; sel: K }) {
  const bench = m.nsw.benchmark.estimate;
  const rows = KEYS.map((k) => {
    if (synth) { const est = m.synthetic.reps_mean[gamma][k]; return { k, est, lo: null as number | null, hi: null as number | null, gap: est - 1 }; }
    const r = (sample === "NSW CONTROLS" ? m.nsw.experiment_estimators : m.nsw.observational_estimators)[k];
    return { k, est: r.estimate, lo: r.ci95[0] as number, hi: r.ci95[1] as number, gap: r.gap_vs_benchmark as number };
  });
  const mn = synth ? -0.5 : -17500, mx = synth ? 4 : 4500, ref = synth ? 1 : bench;
  const X = (v: number) => 10 + ((v - mn) / (mx - mn)) * (W - 20);
  return (
    <svg className="estimators" viewBox={`0 0 ${W} 250`} role="img" aria-label="Estimators beside the benchmark">
      <rect x={X(ref) - 1} y="18" width="2" height="222" fill="#fff" data-benchmark />
      <text x={X(ref) - 6} y="12" textAnchor="end" className="svg-t">{synth ? "TRUE EFFECT 1 (KNOWN, SYNTHETIC)" : `EXPERIMENTAL BENCHMARK (NSW, RANDOMISED) ${fmt(bench, 2)} USD`}</text>
      {!synth ? <g data-interval="confidence"><line x1={X(m.nsw.benchmark.ci95[0])} x2={X(m.nsw.benchmark.ci95[1])} y1="26" y2="26" stroke="#fff" /><line x1={X(m.nsw.benchmark.ci95[0])} x2={X(m.nsw.benchmark.ci95[0])} y1="21" y2="31" stroke="#fff" /><line x1={X(m.nsw.benchmark.ci95[1])} x2={X(m.nsw.benchmark.ci95[1])} y1="21" y2="31" stroke="#fff" /></g> : null}
      {rows.map((r, i) => {
        const y = 62 + i * 46, on = r.k === sel;
        return (
          <g key={r.k} data-estimator={r.k} opacity={on ? 1 : 0.55}>
            <rect x={X(r.est) - 3} y={y - 3} width="6" height="6" fill="#fff" />
            {r.lo !== null ? <g data-interval="confidence"><line x1={X(r.lo)} x2={X(r.hi!)} y1={y + 10} y2={y + 10} stroke="#fff" /><line x1={X(r.lo)} x2={X(r.lo)} y1={y + 6} y2={y + 14} stroke="#fff" /><line x1={X(r.hi!)} x2={X(r.hi!)} y1={y + 6} y2={y + 14} stroke="#fff" /></g> : null}
            <text x="10" y={y + 28} className="svg-t" textLength={undefined}>{m.nsw.estimator_info[r.k].name.toUpperCase()} {fmt(r.est, 2)} · GAP {fmt(r.gap, 2)} {synth ? "" : "USD"}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** S07 The future you didn't choose: every observational estimate beside the experiment, then the argument stack. */
export function S07Unchosen({ def }: { def: SceneDef }) {
  const [meta] = useArtifact(META);
  const [m10, retry] = useArtifact(M10);
  const [facts] = useArtifact(FACTS);
  const [val] = useArtifact(VALIDATION);
  const [sample, setSample] = useState("PSID CONTROLS");
  const [sel, setSel] = useState<K>("ipw_att");
  const [synth, setSynth] = useState(false);
  const [gamma, setGamma] = useState("1.0");
  const [stage, setStage] = useState(0);
  useSteps(def.id, [0.6, 0.66, 0.72, 0.78, 0.84, 0.9, 0.96], (s) => { setStage(s); setTurn({ mode: "turn", cam: "G1", alpha: 0.15, unroll: 0 }); });
  const me = meta.status === "ready" ? meta.data : null;
  const v = val.status === "ready" ? val.data : null;
  const passed = v ? v.checks.filter((c: any) => c.passed).length : null;
  const ex: [string, string][] = [
    ["Is this just random?", `Every random number comes from one seeded generator (seed ${me?.seed ?? "..."}), recomputed in your browser and checked against a Python reference. Change the seed and the futures change; the references say so.`],
    ["Credible or confidence?", "They are different statements and different marks. A credible interval is a probability given the data and a prior; a confidence interval is a long-run rate of a procedure. Never one for the other."],
    ["Is the model's counterfactual a cause?", "No. It is the smallest change that flips this model's output. It says nothing about what would change a life."],
    ["Does the observational estimate work?", facts.status === "ready" ? `Against the randomised benchmark of ${fmt(fv(facts.data, "nsw_benchmark_usd"), 2)} USD, the naive comparison misses by ${fmt(fv(facts.data, "nsw_gap_naive_usd"), 0)} USD, regression adjustment by ${fmt(fv(facts.data, "nsw_gap_ra_usd"), 0)}, weighting by ${fmt(fv(facts.data, "nsw_gap_ipw_usd"), 0)}, which leans on about ${fmt(fv(facts.data, "nsw_ipw_ess_controls"), 1)} effective controls.` : "Loading."],
    ["Are the numbers checked?", v ? `${passed} of ${v.checks.length} checks pass. Failures recorded: ${v.failures_recorded.length === 0 ? "none" : v.failures_recorded.map((f: any) => f.name ?? JSON.stringify(f)).join("; ")}.` : "Loading."],
    ["Is any of this real?", "Only the German applicants and the NSW and PSID earnings are observed. Every other future on this site is synthetic and seeded."],
    ["Who made the data?", `${(me?.citations ?? []).slice(0, 3).join(" ")} Credit data: Hofmann (1994), UCI, CC BY 4.0.`],
  ];
  return (
    <Track id={def.id} height={def.track} landing={def.landing} className="scene scene-unchosen">
      <SceneErrors id={def.id} specs={[M10, META, FACTS, VALIDATION]} />
      {stage === 0 ? (
        <>
          <Column>
            <p className="scene-kicker">S07 · THE FUTURE YOU DID NOT CHOOSE</p>
            <WordReveal as="h2" id={`${def.id}-title`} tabIndex={-1} data-scene-heading className="scene-title scene-title--sm"
              text="The future you didn't choose cannot be observed. An experiment is the closest you get." mode={{ kind: "scrub", track: def.id, from: 0, to: 0.2 }} />
            <div className="chip-row">{m10.status === "ready" ? (synth ? <HonestyChip tag="SYNTHETIC" /> : <Tag text={m10.data.tags.nsw} />) : null}</div>
          </Column>
          <div className="visual visual--estimators">
            <ArtifactStatus file="m10_causal.json" state={m10} retry={retry} empty="UNAVAILABLE">{(m) => <><Dag d={m.dag} /><Rows m={m} sample={sample} synth={synth} gamma={gamma} sel={sel} /></>}</ArtifactStatus>
          </div>
          <Lower>
            <div className="ctl-row">
              <Radio label="ESTIMATOR" value={sel} options={KEYS} onChange={setSel} render={(k) => ({ naive: "NAIVE", ols_coef: "OLS", ra_att: "ADJUSTMENT", ipw_att: "WEIGHTING" })[k]} />
              <Radio label="SAMPLE" value={sample} options={["NSW CONTROLS", "PSID CONTROLS"]} onChange={setSample} disabled={() => (synth ? "Not used in the synthetic world" : null)} />
              <button type="button" className="btn-square" aria-pressed={synth} onClick={() => setSynth((s) => !s)}>SYNTHETIC CONFOUNDED WORLD</button>
              {synth ? <Radio label="CONFOUNDING" value={gamma} options={["0.0", "1.0"]} onChange={setGamma} /> : null}
            </div>
            {m10.status === "ready" ? (
              <>
                <ol className="assump" data-assumptions tabIndex={0} aria-label="Assumptions">{m10.data.assumptions.map((a: string, i: number) => (
                  <li key={i} className={m10.data.nsw.estimator_info[sel].assumptions.includes(i) ? "on" : ""}>{a}</li>))}</ol>
                <p className="note-line">{m10.data.nsw.estimator_info[sel].short.toUpperCase()}. {m10.data.nsw.estimator_info[sel].note.toUpperCase()}</p>
                {sel === "ipw_att" && !synth && sample === "PSID CONTROLS" ? <p className="readout mono-label" data-ess>EFFECTIVE CONTROLS ≈ {fmt(m10.data.nsw.overlap.ess_controls, 1)} OF {fmt(m10.data.nsw.observational_sample.n_psid_controls)}</p> : null}
                <p className="scene-foot mono-label"><a className="doi" href={m10.data.spec.link} rel="noreferrer">NBER · ATTRIBUTABLE NON-COMMERCIAL USE</a> · LALONDE (1986) · DEHEJIA AND WAHBA (1999, 2002) · {synth ? "30 SEEDED REPLICATES, MEAN SHOWN" : "PRECOMPUTED · PYTHON REFERENCE, MICRODATA NOT SHIPPED"}</p>
              </>
            ) : null}
          </Lower>
            <Foot meta={me} />
        </>
      ) : (
        <>
          <p className="scene-kicker s07-kicker">S07 · SEVEN OBJECTIONS</p>
          <h2 id={`${def.id}-title`} tabIndex={-1} data-scene-heading className="s07-title">How we know.</h2>
          <div className="argstack" data-argstack>
            {ex.slice(0, stage).map(([q, a], i) => (
              <div key={q} className={`ex ${i < stage - 1 ? "ex--old" : ""}`} style={{ ["--back" as string]: stage - 1 - i }}>
                <p className="ex__q">{q}</p>
                <div className="ex__a"><p>{a}</p></div>
              </div>
            )).slice(-3)}
          </div>
          <Foot meta={me} />
        </>
      )}
    </Track>
  );
}

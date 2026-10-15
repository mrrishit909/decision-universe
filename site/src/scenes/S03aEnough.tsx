import { useState, useSyncExternalStore } from "react";
import { Track } from "../scroll/Track";
import { WordReveal } from "../components/WordReveal";
import { Radio } from "../components/Radio";
import { useArtifact } from "../data/useArtifact";
import { ArtifactStatus, SceneErrors } from "../components/StateUI";
import { META, M03, fmt, pct } from "../app/data";
import { computeState } from "../state/compute";
import { Column, Lower, Tag, UnitLine, Bracket, Foot, useSteps, useTurn, setTurn } from "./common";
import type { SceneDef } from "../app/scenes";

const NS = [100, 1000, 10000, 20000, 100000] as const;
const THRESH = [0.2, 0.4, 0.6, 0.8];

/** S03a Enough futures: the spread of futures does not shrink; the uncertainty about the average does. */
export function S03aEnough({ def }: { def: SceneDef }) {
  const v = useTurn();
  const cs = useSyncExternalStore(computeState.subscribe, computeState.get, computeState.get);
  const [meta] = useArtifact(META);
  const [m3, retry] = useArtifact(M03);
  const [n, setN] = useState<number>(20000);
  const pick = (k: number) => { setN(k); setTurn({ n: Math.min(k, 20000), mode: "turn", cam: "G2", alpha: 1, unroll: 0 }); };
  useSteps(def.id, THRESH, (step) => pick(NS[step === 0 ? 3 : step - 1]!));
  const live = n <= 20000 && v.pack && v.pack.n === n ? v.pack.decisions[0]!.summary : null;
  const row = (m: any) => m.convergence.find((c: any) => c.n === n);  
  const stat = (m: any) => live ?? (n === 100000 ? row(m) : null);  
  return (
    <Track id={def.id} height={def.track} landing={def.landing} className="scene scene-enough">
      <SceneErrors id={def.id} specs={[M03, META]} />
      <Column>
        <p className="scene-kicker">S03a · HOW MANY FUTURES ARE ENOUGH</p>
        <WordReveal as="h2" id={`${def.id}-title`} tabIndex={-1} data-scene-heading className="scene-title scene-title--sm"
          text="More futures do not make the future less uncertain. They make the average less uncertain." mode={{ kind: "scrub", track: def.id, from: 0, to: 0.18 }} />
        <ArtifactStatus file="m03_montecarlo.json" state={m3} retry={retry} empty="UNAVAILABLE">{(m) => <Tag text={m.tags.convergence} />}</ArtifactStatus>
      </Column>
      <Lower>
        <Radio label="FUTURES n" value={String(n)} options={NS.map(String)} render={(k) => Number(k).toLocaleString("en-US")} onChange={(k) => pick(Number(k))} />
        <ArtifactStatus file="m03_montecarlo.json" state={m3} retry={retry} empty="UNAVAILABLE">{(m) => {
          const s = stat(m);
          const se1k = m.convergence.find((c: any) => c.n === 1000).se, se100k = m.convergence.find((c: any) => c.n === 100000).se;  
          if (!s) return <p className="state-line" role="status" data-computing>RUNNING IN YOUR BROWSER · SEED {v.seed} · {cs.status === "computing" ? "COMPUTING" : `${Math.round(cs.ms)} MS`}</p>;
          return (
            <div className="ledger" data-ledger data-n={n}>
              <p className="readout mono-label">
                {n === 100000 ? "PRECOMPUTED · PYTHON REFERENCE" : `RUNNING IN YOUR BROWSER · SEED ${v.seed} · ${Math.round(cs.ms)} MS`} · {v.drawn.toLocaleString("en-US")} DRAWN · STATISTICS FROM ALL {fmt(n)}
              </p>
              <Bracket lo={s.ci95_lo} hi={s.ci95_hi} min={0} max={25} label={`95% confidence interval of the mean ${fmt(s.ci95_lo, 2)} to ${fmt(s.ci95_hi, 2)}`} />
              <p className="readout mono-label" data-stat>MEAN NPV {fmt(s.mean, 2)} M USD · SE {fmt(s.se, 3)} · 95% CI {fmt(s.ci95_lo, 2)} TO {fmt(s.ci95_hi, 2)} · P(LOSS) {pct(s.p_loss, 1)} · SPREAD OF FUTURES (SD) {fmt(s.sd, 1)}</p>
              <p className="note-line">100 X THE FUTURES · {fmt(se1k / se100k, 1)} X NARROWER (STANDARD ERROR, n 1,000 TO 100,000). THE SPREAD OF FUTURES DOES NOT SHRINK.</p>
              <p className="note-line">{m.spec.ci_is.toUpperCase()}</p>
            </div>
          );
        }}</ArtifactStatus>
        <button type="button" className="btn-square" onClick={() => pick(20000)}>RESET</button>
        <UnitLine drawn={v.drawn} n={Math.min(n, 20000) === n ? n : n} seed={v.seed} />
      </Lower>
        <Foot meta={meta.status === "ready" ? meta.data : null} />
    </Track>
  );
}

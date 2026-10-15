import { useState } from "react";
import { Track } from "../scroll/Track";
import { WordReveal } from "../components/WordReveal";
import { Radio } from "../components/Radio";
import { useArtifact } from "../data/useArtifact";
import { ArtifactStatus, SceneErrors } from "../components/StateUI";
import { META, M03, fmt, pct } from "../app/data";
import { Column, Lower, Tag, UnitLine, Bracket, Foot, useSteps, useTurn, setTurn } from "./common";
import { Inspector } from "./Inspector";
import { DECISIONS } from "../model/turn";
import type { SceneDef } from "../app/scenes";

const LABEL = Object.fromEntries(DECISIONS.map((d) => [d.key, d.label]));
const KEYS = DECISIONS.map((d) => d.key);

/** S01 Another decision: the same worlds under another decision, keyed by draw index. */
export function S01Another({ def }: { def: SceneDef }) {
  const v = useTurn();
  const [meta] = useArtifact(META);
  const [m3, retry] = useArtifact(M03);
  const [b, setB] = useState("phased");
  useSteps(def.id, [0.35, 0.55, 0.75], (step) => {
    if (step === 0) setTurn({ mode: "turn", cam: "G0", alpha: 1, unroll: 0 });
    else if (step === 1) setTurn({ mode: "turn", cam: "G1", alpha: 1, unroll: 0 });
    else setTurn({ mode: "pair", cam: "G1", alpha: 1, unroll: 0 });
  });
  const pickB = (k: string) => { setB(k); setTurn({ decB: k, mode: "pair" }); };
  const sums = v.pack ? [v.decA, v.decB].map((k) => ({ k, d: v.pack!.decisions.find((x) => x.key === k)! })) : [];
  const lo = v.pack ? Math.min(...v.pack.decisions.map((d) => d.summary.ci95_lo)) - 2 : 0;
  const hi = v.pack ? Math.max(...v.pack.decisions.map((d) => d.summary.ci95_hi)) + 2 : 1;
  return (
    <Track id={def.id} height={def.track} landing={def.landing} className={`scene scene-another ${v.mode === "pair" ? "is-pair" : ""}`}>
      <SceneErrors id={def.id} specs={[M03, META]} />
      <Column>
        <p className="scene-kicker">S01 · SAME WORLDS, ANOTHER DECISION</p>
        <WordReveal as="h2" id={`${def.id}-title`} tabIndex={-1} data-scene-heading className="scene-title scene-title--md" text="Same chance. Another decision. Different futures." mode={{ kind: "scrub", track: def.id, from: 0, to: 0.3 }} />
        <p className="caveat">EACH LINE IS ONE SIMULATED WORLD. UNDER BOTH DECISIONS IT MEETS THE SAME LUCK; ONLY THE CHOICE DIFFERS.</p>
        <ArtifactStatus file="m03_montecarlo.json" state={m3} retry={retry} empty="UNAVAILABLE">{(m) => <Tag text={m.tags.paths} />}</ArtifactStatus>
      </Column>
      <Lower>
        <Radio label="DECISION B" value={b} options={KEYS} render={(k) => LABEL[k]!} onChange={pickB} />
        {sums.length ? (
          <ul className="ledger-pair" data-ledger>
            {sums.map(({ k, d }, idx) => (
              <li key={`${idx}-${k}`} data-decision={k}>
                <b className="mono-label">{idx === 0 ? "A" : "B"} · {LABEL[k]}</b>
                <span className="readout mono-label">MEAN NPV {fmt(d.summary.mean, 1)} M USD · P(LOSS) {pct(d.lossShare, 1)} · MEDIAN PAYBACK {d.medianPayback === null ? "NEVER" : `YEAR ${d.medianPayback.toFixed(1)}`}</span>
                <Bracket lo={d.summary.ci95_lo} hi={d.summary.ci95_hi} min={lo} max={hi} label={`95% confidence interval of the mean ${fmt(d.summary.ci95_lo, 2)} to ${fmt(d.summary.ci95_hi, 2)}`} />
                <span className="note-line">95% CONFIDENCE INTERVAL OF THE MEAN {fmt(d.summary.ci95_lo, 2)} TO {fmt(d.summary.ci95_hi, 2)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="state-line">COMPUTING THE FUTURES</p>}
        <p className="note-line">THE PROCEDURE BEHIND THE BRACKETS COVERS THE TRUE MEAN IN 95% OF REPEATED RUNS.</p>
        <p className="note-line" data-crn>COMMON RANDOM NUMBERS: SAME {fmt(v.n)} WORLDS, SAME SEED {v.seed}</p>
        <Inspector dec={v.decA} />
        <button type="button" className="btn-square" onClick={() => { setB("phased"); setTurn({ decA: "build_now", decB: "phased", hovered: null }); }}>RESET</button>
        <UnitLine drawn={v.drawn} n={v.n} seed={v.seed} />
      </Lower>
        <Foot meta={meta.status === "ready" ? meta.data : null} />
    </Track>
  );
}

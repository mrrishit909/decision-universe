import { useEffect } from "react";
import { Track } from "../scroll/Track";
import { WordReveal } from "../components/WordReveal";
import { useActiveScene } from "../scroll/hooks";
import { useArtifact } from "../data/useArtifact";
import { META, pct } from "../app/data";
import { LINKS, type SceneDef } from "../app/scenes";
import { turnView, visitor, setTurn, SEED } from "../app/turnView";
import { decIndex } from "../app/turnView";
import { Foot, useTurn } from "./common";

/** S08 closing: the Turn on the visitor's last decision and seed, the first-turn growth once more. */
export function S08Closing({ def, onReplay }: { def: SceneDef; onReplay?: () => void }) {
  const active = useActiveScene();
  const v = useTurn();
  const [meta] = useArtifact(META);
  useEffect(() => {
    if (active !== def.id) return;
    setTurn({ mode: "turn", cam: "G0", alpha: 1, unroll: 0, hovered: null, decA: visitor.decision, echoStart: performance.now() });
  }, [active, def.id]);
  const d = v.pack?.decisions[decIndex(v.decA)];
  const label = d?.label ?? visitor.label;
  return (
    <Track id={def.id} height={def.track} landing={def.landing} className="scene scene-closing">
      <div className="s08-scrim" aria-hidden="true" />
      <WordReveal as="h2" id={`${def.id}-title`} tabIndex={-1} data-scene-heading className="s08-para" text="Every decision creates a different future." mode={{ kind: "scrub", track: def.id, from: 0.1, to: 0.5 }} />
      <p className="s08-yours mono-label" data-yours>
        YOUR DECISION: {label} · SEED {v.seed} · {d ? pct(d.paybackShare, 0) : "..."} CLOSE THE TURN
      </p>
      <div className="s08-actions">
        <button type="button" className="btn-square" onClick={() => setTurn({ echoStart: performance.now() })}>REPLAY</button>
        <button type="button" className="btn-square" onClick={() => { visitor.decision = "build_now"; visitor.seed = SEED; visitor.label = "BUILD NOW"; setTurn({ decA: "build_now", seed: SEED, custom: null, echoStart: performance.now() }); onReplay?.(); }}>RESET</button>
      </div>
      <ul className="s08-links"><li><a className="doi" href={LINKS.source} rel="noreferrer">SOURCE</a></li><li><a className="doi" href={`${LINKS.source}/blob/main/docs/LIMITATIONS.md`} rel="noreferrer">LIMITATIONS</a></li></ul>
      <div className="s08-foot"><Foot meta={meta.status === "ready" ? meta.data : null} /></div>
    </Track>
  );
}
void turnView;

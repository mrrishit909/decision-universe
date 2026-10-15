import { useEffect, useLayoutEffect } from "react";
import { Nav } from "../components/Nav";
import { Track } from "../scroll/Track";
import { jumpTo, registerTrack, resolveInitialHash } from "../scroll/engine";
import { useActiveScene } from "../scroll/hooks";
import { NAV_ITEMS, SCENES, navActive, type SceneDef } from "./scenes";
import { useIntro } from "./useIntro";
import { TurnLayer } from "./TurnLayer";
import { TurnOpening } from "./TurnOpening";
import { DRAWN_CAP, classOf } from "./geometry";
import { setTurn, turnView } from "./turnView";
import { computeRun } from "../state/compute";
import { S01Another } from "../scenes/S01Another";
import { S02Real } from "../scenes/S02Real";
import { S03aEnough } from "../scenes/S03aEnough";
import { S03bLearning } from "../scenes/S03bLearning";
import { S04Unroll } from "../scenes/S04Unroll";
import { S05Line } from "../scenes/S05Line";
import { S06Trade } from "../scenes/S06Trade";
import { S07Unchosen } from "../scenes/S07Unchosen";
import { Lab } from "../scenes/Lab";
import { S08Closing } from "../scenes/S08Closing";

const SCENE_COMPONENTS: Record<string, (p: { def: SceneDef; onReplay?: () => void }) => React.ReactNode> = {
  another: S01Another, real: S02Real, enough: S03aEnough, learning: S03bLearning, unroll: S04Unroll, line: S05Line, trade: S06Trade, unchosen: S07Unchosen, lab: Lab, closing: S08Closing,
};

/** App: the static S00 track (index.html), the Turn canvas layer, the React scenes and the nav. */
export function App({ onReplayHook }: { onReplayHook?: (fn: () => void) => void }) {
  const active = useActiveScene();
  const intro = useIntro();
  useLayoutEffect(() => {
    const el = document.getElementById("turn");
    return el ? registerTrack("turn", el, SCENES[0]!.landing) : undefined;
  }, []);
  useEffect(() => { resolveInitialHash(); }, []);
  useEffect(() => { onReplayHook?.(intro.replay); }, [intro.replay, onReplayHook]);
  // the seeded run: created after first paint, never on the LCP path; re-runs on a new seed, n or lever set
  useEffect(() => {
    let cancelled = false;
    const go = () => {
      const v = turnView.get();
      const cap = DRAWN_CAP[classOf(document.documentElement.clientWidth)];
      void computeRun(v.seed, v.n, cap, v.custom).then((pack) => {
        if (cancelled || turnView.get().seed !== pack.seed || turnView.get().n !== pack.n) return;
        setTurn({ pack, drawn: Math.min(pack.n, pack.nDraw, cap) });
      });
    };
    const first = setTimeout(go, 60);
    let lastKey = "";
    const off = turnView.subscribe(() => {
      const v = turnView.get();
      const key = `${v.seed}|${v.n}|${JSON.stringify(v.custom)}`;
      if (key !== lastKey && v.pack) { lastKey = key; go(); }
      else if (!v.pack && !lastKey) lastKey = key;
    });
    return () => { cancelled = true; clearTimeout(first); off(); };
  }, []);
  return (
    <>
      <TurnLayer />
      <TurnOpening />
      <Nav
        items={NAV_ITEMS}
        active={navActive(active)}
        onJump={(id) => jumpTo(id, undefined, { push: true, focus: true })}
        introPlaying={!intro.navIn}
        onSkip={intro.skip}
        onReplay={intro.replay}
      />
      {SCENES.slice(1).map((s) => {
        const C = SCENE_COMPONENTS[s.id];
        return C ? <C key={s.id} def={s} onReplay={s.id === "closing" ? intro.replay : undefined} /> : <Track key={s.id} id={s.id} height={s.track} landing={s.landing}><div /></Track>;
      })}
    </>
  );
}

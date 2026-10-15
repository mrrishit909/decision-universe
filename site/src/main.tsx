import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "lenis/dist/lenis.css";
import "./styles/app.css";
import "./styles/scenes.css";
import { ErrorBoundary } from "./app/ErrorBoundary";
import { App } from "./app/App";
import { getActive, getProgress, jumpTo, startEngine } from "./scroll/engine";
import { intro } from "./app/intro";
import { turnView, setTurn } from "./app/turnView";
import { drawn } from "./app/TurnLayer";
import { computeHooks, computeState } from "./state/compute";
import { highsHooks, getHighs } from "./state/highs";
import { unrollPoint, threadXY } from "./model/turn";

// Test and evidence hook (du = Decision Universe): the same instant-jump path the nav uses.
let replay: () => void = () => {};
Object.assign(window, {
  __du: {
    jumpTo, getProgress,
    freeze: (t: number) => { intro.frozen = t; if (t >= 0) intro.playing = true; },
    introStats: () => ({ playing: intro.playing }),
    debug: () => ({ frames: 2, scene: getActive() }),
    view: () => { const { pack, ...rest } = turnView.get(); return { ...rest, packSeed: pack?.seed ?? null, packN: pack?.n ?? null, nDraw: pack?.nDraw ?? 0 }; },
    set: (p: Parameters<typeof setTurn>[0]) => setTurn(p),
    /** what is drawn: centres, radii, thread count, payback squares */
    drawn: () => ({ ...drawn, cams: drawn.cams.map((c) => ({ ...c })) }),
    /** the Turn is the backdrop by design (text sits on scrims); contrast is pixel-sampled instead */
    discs: () => [] as { cx: number; cy: number; R: number }[],
    marks: () => [] as { name: string; x: number; y: number; w: number; h: number }[],
    /** the published-vector geometry for tests: one future's vertex at year t */
    vertex: (dec: number, i: number, t: number, u: number) => {
      const pk = turnView.get().pack!, d = pk.decisions[dec]!, c = drawn.cams[0]!;
      return unrollPoint(d.rec, i * 9, t, u, { cx: c.c[0], cy: c.c[1], R: c.R }, { x0: 0, y0: 0, w: 1, h: 1 });
    },
    thread: (dec: number, i: number) => { const d = turnView.get().pack!.decisions[dec]!; return threadXY(Array.from(d.rec.slice(i * 9, i * 9 + 9)), 1); },
    pack: () => { const p = turnView.get().pack; return p ? { seed: p.seed, n: p.n, nDraw: p.nDraw, decisions: p.decisions.map((d) => ({ key: d.key, mean: d.summary.mean, se: d.summary.se, pLoss: d.summary.p_loss, paybackShare: d.paybackShare, medianPayback: d.medianPayback, npv: Array.from(d.npv.slice(0, 16)), pay: Array.from(d.pay.slice(0, 16)), rec0: Array.from(d.rec.slice(0, 9)) })), draws: Array.from(p.draws.slice(0, 5 * 16)) } : null; },
    compute: () => ({ ...computeState.get() }),
    failWorker: () => { computeHooks.failWorker = true; },
    failHighs: () => { highsHooks.fail = true; },
    highs: () => ({ ...getHighs() }),
    replay: () => replay(),
  },
});

const q = new URLSearchParams(location.search).get("fail");
if (q === "worker") computeHooks.failWorker = true;
if (q === "highs") highsHooks.fail = true;
startEngine();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App onReplayHook={(fn) => { replay = fn; }} />
    </ErrorBoundary>
  </StrictMode>,
);

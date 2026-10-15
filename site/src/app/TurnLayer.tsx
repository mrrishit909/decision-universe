import { useEffect, useRef } from "react";
import { addFrame } from "../motion/loop";
import { useActiveScene } from "../scroll/hooks";
import { motionEnabled } from "../state/motion";
import { camera, fallBox, pairCamera, DRAWN_CAP, classOf, type Cam } from "./geometry";
import { turnView, decIndex } from "./turnView";
import { intro, introTime } from "./intro";
import { drawTurn, drawFall, compositeGlow } from "../graphics/turn";

/** what the layer drew last, for the tests and the labels (the numbers shown equal the geometry drawn) */
export const drawn = { cams: [] as { c: [number, number]; R: number; dec: string }[], grow: 0, n: 0, mode: "none", w: 0, h: 0, paying: 0, threads: 0 };
const GROW_START = 400, GROW_PER_YEAR = 400;
export const ECHO_MS = 1600;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lg = (a: number, b: number, t: number) => Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * t);

export function TurnLayer() {
  const ref = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLCanvasElement | null>(null);
  const active = useActiveScene();
  const activeRef = useRef(active);
  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => {
    const cv = ref.current!, ctx = cv.getContext("2d")!;
    const glowCv = (glowRef.current = document.createElement("canvas"));
    const gctx = glowCv.getContext("2d")!;
    let W = 0, H = 0, dpr = 1, sig = "", last = 0;
    // eased cameras (a, b), unroll and glow
    let ca: Cam | null = null, cb: Cam | null = null, u = 0, pairMix = 0, rewind = 0, rewindFrom = "", rewindTo = "", decNow = "";
    let prevPack: unknown = null, rewindStart = 0;
    const size = () => {
      W = document.documentElement.clientWidth; H = innerHeight;
      dpr = Math.min(W < 768 ? 1.5 : 2, devicePixelRatio || 1);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = `${W}px`; cv.style.height = `${H}px`;
      glowCv.width = Math.ceil(W / 4); glowCv.height = Math.ceil(H / 4);
      sig = ""; ca = null; cb = null;
    };
    size(); addEventListener("resize", size);
    const off = addFrame((now) => {
      const dt = last ? Math.min(100, now - last) : 16; last = now;
      const v = turnView.get(), pack = v.pack, motion = motionEnabled();
      if (!pack || v.mode === "none") { if (sig !== "none") { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); sig = "none"; drawn.mode = "none"; drawn.threads = 0; } return; }
      const cls = classOf(W), nDraw = Math.min(v.n, pack.nDraw, DRAWN_CAP[cls]);
      // growth: the S00 intro, or the S08 echo replay
      let grow = 8, glowAmt = 1;
      if (intro.playing && motion) {
        const t = introTime(now);
        grow = Math.max(0, Math.min(8, (t - GROW_START) / GROW_PER_YEAR));
        glowAmt = Math.max(0, Math.min(1, (t - 3600) / 600));
      } else if (v.echoStart > 0) {
        const e = now - v.echoStart;
        if (e >= ECHO_MS) { turnView.set({ echoStart: 0 }); } else { grow = Math.max(0, Math.min(8, (e / ECHO_MS) * 8)); glowAmt = Math.max(0, (e / ECHO_MS - 0.7) / 0.3); }
      }
      // camera targets
      const act = activeRef.current;
      const pair = v.mode === "pair", fall = v.mode === "fall";
      const tgtA = pair ? pairCamera(W, H).a : camera(v.cam, W, H);
      const tgtB = pair ? pairCamera(W, H).b : tgtA;
      const k = motion ? 1 - Math.exp(-dt / 120) : 1;
      ca = ca ? { c: [lerp(ca.c[0], tgtA.c[0], k), lerp(ca.c[1], tgtA.c[1], k)], R: lg(ca.R, tgtA.R, k) } : tgtA;
      cb = cb ? { c: [lerp(cb.c[0], tgtB.c[0], k), lerp(cb.c[1], tgtB.c[1], k)], R: lg(cb.R, tgtB.R, k) } : tgtB;
      u = motion ? lerp(u, v.unroll, 1 - Math.exp(-dt / 140)) : v.unroll;
      if (Math.abs(u - v.unroll) < 0.001) u = v.unroll;
      pairMix = motion ? lerp(pairMix, pair ? 1 : 0, 1 - Math.exp(-dt / 140)) : pair ? 1 : 0;
      if (Math.abs(pairMix - (pair ? 1 : 0)) < 0.002) pairMix = pair ? 1 : 0;
      // re-wind: when the decision of the left Turn changes, blend the same futures' angles over 800 ms (keyed by index)
      const decKey = v.decA;
      if (decNow && decNow !== decKey && prevPack === pack) { rewindFrom = decNow; rewindTo = decKey; rewindStart = now; }
      decNow = decKey; prevPack = pack;
      if (rewindStart) { rewind = Math.min(1, (now - rewindStart) / 800); if (rewind >= 1 || !motion) { rewindStart = 0; rewind = 0; rewindFrom = ""; rewindTo = ""; } }
      const dA = pack.decisions[decIndex(v.decA)]!, dB = pack.decisions[decIndex(v.decB)]!;
      const rwA = rewindStart && rewindFrom ? pack.decisions[decIndex(rewindFrom)]! : null;
      const rwB = rewindStart && rewindTo ? pack.decisions[decIndex(rewindTo)]! : null;
      const settled = ca.c[0] === tgtA.c[0] && ca.R === tgtA.R && u === v.unroll && pairMix === (pair ? 1 : 0) && !rewindStart;
      const animating = grow < 8 || !settled || v.echoStart > 0 || (intro.playing && motion);
      const key = `${W}x${H}|${v.mode}|${v.cam}|${v.decA}|${v.decB}|${nDraw}|${v.alpha}|${u.toFixed(3)}|${v.hovered}|${pack.seed}|${pack.n}|${act === "lab" ? 1 : 0}`;
      if (!animating && key === sig) return;
      sig = key;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      gctx.setTransform(1, 0, 0, 1, 0, 0);
      gctx.clearRect(0, 0, glowCv.width, glowCv.height);
      const fk = fall || u > 0.001;
      const drawsInfo: typeof drawn.cams = [];
      if (fk) {
        const f = fallBox(W, H), pol = { cx: ca.c[0], cy: ca.c[1], R: ca.R };
        drawFall(ctx, gctx, { p: pol, f, a: dA, n: nDraw, u, alpha: v.alpha, glow: glowAmt, hovered: v.hovered });
        drawsInfo.push({ c: ca.c, R: ca.R, dec: v.decA });
      } else {
        const showB = pairMix > 0.02;
        const ghostFor = (d: typeof dA) => (d === dA ? dB : dA);
        drawTurn(ctx, gctx, { cx: ca.c[0], cy: ca.c[1], R: ca.R, a: rwA ?? dA, b: rwB ?? undefined, u: rewind, n: nDraw, grow, alpha: v.alpha, glow: glowAmt, hovered: v.hovered, ghost: showB ? ghostFor(dA) : undefined });
        drawsInfo.push({ c: [ca.c[0], ca.c[1]], R: ca.R, dec: v.decA });
        if (showB) {
          drawTurn(ctx, gctx, { cx: cb.c[0], cy: cb.c[1], R: cb.R, a: dB, n: nDraw, grow, alpha: v.alpha * pairMix, glow: glowAmt, hovered: v.hovered, ghost: ghostFor(dB) });
          drawsInfo.push({ c: [cb.c[0], cb.c[1]], R: cb.R, dec: v.decB });
        }
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      compositeGlow(ctx, glowCv, W, H, glowAmt * v.alpha);
      let paying = 0;
      for (let i = 0; i < nDraw; i++) if (dA.pay[i]! === dA.pay[i]!) paying++;
      Object.assign(drawn, { cams: drawsInfo, grow, n: nDraw, mode: fk ? "fall" : v.mode, w: W, h: H, paying, threads: nDraw });
    }, 30);
    return () => { off(); removeEventListener("resize", size); };
  }, []);
  return <canvas ref={ref} className="turn-layer" aria-hidden="true" />;
}

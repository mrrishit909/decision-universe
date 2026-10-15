/** Canvas2D renderer of the Turn, the pair and the waterfall (VISUAL_DESIGN 0 "The Turn: encoding"). Pure drawing: no state. */
import { SAMPLES_PER_YEAR, unrollPoint, type Fall, type Polar } from "../model/turn";
import type { DecisionPack } from "../model/runpack";

const WHITE = "rgba(255,255,255,0.12)", VIOLET = "rgba(180,140,255,0.12)";
const K = SAMPLES_PER_YEAR;

export interface Paths { w: Path2D; v: Path2D }
const unitCache = new WeakMap<Float32Array, Map<string, Paths>>();

/** unit-radius thread paths (R = 1) up to `upTo` years, polar; `mix` blends toward another decision's recovered shares */
export function unitPaths(a: DecisionPack, n: number, upTo: number, b?: DecisionPack, u = 0): Paths {
  const settled = (!b || u === 0 || u === 1) && upTo >= 8;
  const src = b && u === 1 ? b : a;
  const ck = `${n}|${settled ? "s" : "x"}`;
  if (settled) {
    const hit = unitCache.get(src.rec)?.get(ck);
    if (hit) return hit;
  }
  const w = new Path2D(), v = new Path2D();
  const steps = Math.max(1, Math.round(upTo * K));
  const cnt = Math.min(n, a.npv.length);
  for (let i = 0; i < cnt; i++) {
    const useB = !!b && u >= 0.5;
    const loss = (useB ? b!.npv[i]! : a.npv[i]!) < 0;
    const p = loss ? v : w, o = i * 9;
    p.moveTo(0, 0);
    for (let k = 1; k <= steps; k++) {
      const t = k / K, j = Math.min(Math.floor(t), 7), f = t - j;
      let s = a.rec[o + j]! + (a.rec[o + j + 1]! - a.rec[o + j]!) * f;
      if (b && u > 0) {
        const s2 = b.rec[o + j]! + (b.rec[o + j + 1]! - b.rec[o + j]!) * f;
        s += (s2 - s) * u;
      }
      const th = 2 * Math.PI * s, r = t / 8;
      p.lineTo(r * Math.sin(th), -r * Math.cos(th));
    }
  }
  const out = { w, v };
  if (settled) {
    let m = unitCache.get(src.rec);
    if (!m) unitCache.set(src.rec, (m = new Map()));
    m.set(ck, out);
  }
  return out;
}

export interface TurnDraw { cx: number; cy: number; R: number; a: DecisionPack; b?: DecisionPack; u?: number; n: number; grow: number; alpha: number; glow: number; hovered: number | null; ghost?: DecisionPack }

/** one Turn: threads, glow pass, payback ladder squares, decision square */
export function drawTurn(ctx: CanvasRenderingContext2D, glow: CanvasRenderingContext2D | null, d: TurnDraw) {
  const paths = unitPaths(d.a, d.n, d.grow, d.b, d.u ?? 0);
  ctx.save();
  ctx.globalAlpha = d.alpha;
  ctx.globalCompositeOperation = "lighter";
  ctx.translate(d.cx, d.cy);
  ctx.scale(d.R, d.R);
  ctx.lineWidth = 0.8 / d.R;
  ctx.lineJoin = "round";
  ctx.strokeStyle = WHITE; ctx.stroke(paths.w);
  ctx.strokeStyle = VIOLET; ctx.stroke(paths.v);
  ctx.restore();
  if (glow && d.glow > 0) {
    glow.save();
    glow.translate(d.cx / 4, d.cy / 4);
    glow.scale(d.R / 4, d.R / 4);
    glow.lineWidth = 2 / (d.R / 4);
    glow.strokeStyle = "rgba(255,255,255,0.5)";
    glow.stroke(paths.w); glow.stroke(paths.v);
    glow.restore();
  }
  const src = d.b && (d.u ?? 0) >= 0.5 ? d.b : d.a;
  // payback ladder: a 2px square on the 12 o'clock ray at the payback year (40%), only for threads that closed their turn within `grow`
  ctx.save();
  ctx.globalAlpha = d.alpha * 0.4;
  ctx.fillStyle = "#fff";
  const cnt = Math.min(d.n, src.pay.length);
  for (let i = 0; i < cnt; i++) {
    const t = src.pay[i]!;
    if (t === t && t <= d.grow) ctx.fillRect(d.cx - 1, d.cy - (d.R * t) / 8 - 1, 2, 2);
  }
  ctx.restore();
  if (d.hovered !== null && d.hovered < cnt) {
    for (const [pk, al, lw] of [[src, 1, 2], ...(d.ghost ? [[d.ghost, 0.25, 1.5] as const] : [])] as const) {
      ctx.save();
      ctx.globalAlpha = d.alpha * al;
      ctx.strokeStyle = pk.npv[d.hovered]! < 0 ? "#B48CFF" : "#fff";
      ctx.lineWidth = lw;
      ctx.beginPath();
      const o = d.hovered * 9, steps = Math.round(d.grow * K);
      ctx.moveTo(d.cx, d.cy);
      for (let k = 1; k <= steps; k++) {
        const t = k / K, j = Math.min(Math.floor(t), 7), f = t - j;
        const s = pk.rec[o + j]! + (pk.rec[o + j + 1]! - pk.rec[o + j]!) * f, th = 2 * Math.PI * s, r = (d.R * t) / 8;
        ctx.lineTo(d.cx + r * Math.sin(th), d.cy - r * Math.cos(th));
      }
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.save();
  ctx.globalAlpha = d.alpha;
  ctx.fillStyle = "#fff";
  ctx.fillRect(d.cx - 2, d.cy - 2, 4, 4);
  ctx.restore();
}

export interface FallDraw { p: Polar; f: Fall; a: DecisionPack; n: number; u: number; alpha: number; glow: number; hovered: number | null }
/** the Unroll / waterfall: the same threads, angle becomes x and radius becomes y downward; 100% recovered is a 2px gap of no light */
export function drawFall(ctx: CanvasRenderingContext2D, glow: CanvasRenderingContext2D | null, d: FallDraw) {
  const w = new Path2D(), v = new Path2D();
  const cnt = Math.min(d.n, d.a.npv.length), steps = 8 * K;
  for (let i = 0; i < cnt; i++) {
    const p = d.a.npv[i]! < 0 ? v : w, o = i * 9;
    let [x, y] = unrollPoint(d.a.rec, o, 0, d.u, d.p, d.f);
    p.moveTo(x, y);
    for (let k = 1; k <= steps; k++) { [x, y] = unrollPoint(d.a.rec, o, k / K, d.u, d.p, d.f); p.lineTo(x, y); }
  }
  ctx.save();
  ctx.globalAlpha = d.alpha;
  ctx.globalCompositeOperation = "lighter";
  ctx.lineWidth = 1;
  ctx.strokeStyle = WHITE; ctx.stroke(w);
  ctx.strokeStyle = VIOLET; ctx.stroke(v);
  ctx.restore();
  if (glow && d.glow > 0) {
    glow.save(); glow.scale(0.25, 0.25); glow.lineWidth = 2; glow.strokeStyle = "rgba(255,255,255,0.5)"; glow.stroke(w); glow.stroke(v); glow.restore();
  }
  if (d.u > 0.98) {
    // the 100% line is a gap of no light, never a drawn line
    const x = d.f.x0 + (1 / 1.8) * d.f.w;
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillRect(x - 1, d.f.y0 - 4, 2, d.f.h + 8);
    ctx.restore();
  }
}

/** glow pass: the threads rendered at 1/4 resolution, tinted #690DE2, blurred, screen-blended at 40% */
export function compositeGlow(ctx: CanvasRenderingContext2D, glow: HTMLCanvasElement, w: number, h: number, amount: number) {
  if (amount <= 0) return;
  const g = glow.getContext("2d")!;
  g.save();
  g.globalCompositeOperation = "source-in";
  g.fillStyle = "#690DE2";
  g.fillRect(0, 0, glow.width, glow.height);
  g.restore();
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.4 * amount;
  try { ctx.filter = "blur(24px)"; } catch { /* no filter support: unblurred tint, still follows the threads */ }
  ctx.drawImage(glow, 0, 0, w, h);
  ctx.restore();
}

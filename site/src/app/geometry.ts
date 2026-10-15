/** Camera states for the Turn (VISUAL_DESIGN 3.3). c = Turn centre, R = radius at year 8, in the reference frame of the viewport class. */
export type Cls = "D" | "T" | "M";
export type CamName = "G0" | "G1" | "G2" | "G5";
export interface Cam { c: [number, number]; R: number }
export interface PairCam { a: Cam; b: Cam }
export interface FallBox { x0: number; y0: number; w: number; h: number }
const REF = { D: [1440, 900], T: [768, 1024], M: [390, 844] } as const;
const G = {
  D: { G0: { c: [1010, 470], R: 590 }, G1: { c: [1120, 470], R: 330 }, G2: { c: [1000, 470], R: 380 }, G5: { c: [980, 470], R: 360 } },
  T: { G0: { c: [470, 700], R: 620 }, G1: { c: [384, 700], R: 280 }, G2: { c: [384, 560], R: 330 }, G5: { c: [384, 520], R: 300 } },
  M: { G0: { c: [195, 600], R: 460 }, G1: { c: [195, 250], R: 170 }, G2: { c: [195, 330], R: 180 }, G5: { c: [195, 280], R: 170 } },
} as const;
const PAIR = {
  D: { a: { c: [700, 470], R: 230 }, b: { c: [1120, 470], R: 230 } },
  T: { a: { c: [384, 380], R: 170 }, b: { c: [384, 760], R: 170 } },
  M: { a: { c: [195, 270], R: 125 }, b: { c: [195, 560], R: 125 } },
} as const;
const FALL = { D: [560, 120, 800, 680], T: [48, 360, 672, 600], M: [16, 300, 358, 460] } as const;
export const classOf = (w: number): Cls => (w < 768 ? "M" : w < 1024 ? "T" : "D");
const sc = (c: Cls, w: number, h: number) => ({ sx: w / REF[c][0], sy: h / REF[c][1], sr: Math.min(w / REF[c][0], h / REF[c][1]) });
export function camera(name: CamName, w: number, h: number): Cam {
  const cls = classOf(w), { sx, sy, sr } = sc(cls, w, h), g = G[cls][name];
  return { c: [g.c[0] * sx, g.c[1] * sy], R: g.R * sr };
}
export function pairCamera(w: number, h: number): PairCam {
  const cls = classOf(w), { sx, sy, sr } = sc(cls, w, h), p = PAIR[cls];
  const f = (x: { c: readonly number[]; R: number }): Cam => ({ c: [x.c[0]! * sx, x.c[1]! * sy], R: x.R * sr });
  return { a: f(p.a), b: f(p.b) };
}
export function fallBox(w: number, h: number): FallBox {
  const cls = classOf(w), { sx, sy } = sc(cls, w, h), f = FALL[cls];
  return { x0: f[0] * sx, y0: f[1] * sy, w: f[2] * sx, h: f[3] * sy };
}
/** threads drawn per viewport class (the tier cap; the ledger says `n_drawn OF n`) */
export const DRAWN_CAP = { D: 1200, T: 800, M: 500 } as const;

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DECISIONS, runFor, threadXY, recoveredAt, SEED_DEFAULT } from "./turn";

const m3 = JSON.parse(readFileSync(join(process.cwd(), "public/data/m03_montecarlo.json"), "utf8"));
describe("the Turn", () => {
  it("every future starts pointing straight up at year 0 and ends at radius R", () => {
    const o = runFor(SEED_DEFAULT, 64, DECISIONS[0]!).outcomes[0]!;
    const xy = threadXY(o.recovered, 100);
    expect(xy[0]).toBe(0); expect(xy[1]).toBe(-0);
    expect(Math.hypot(xy[xy.length - 2]!, xy[xy.length - 1]!)).toBeCloseTo(100, 4);
  });
  it("the winding angle is 360 degrees x recovered at each year end", () => {
    const o = runFor(SEED_DEFAULT, 64, DECISIONS[0]!).outcomes[0]!;
    expect(recoveredAt(o.recovered, 4)).toBeCloseTo(o.recovered[4]!, 12);
    expect(recoveredAt(o.recovered, 4.5)).toBeCloseTo((o.recovered[4]! + o.recovered[5]!) / 2, 12);
  });
  it("same worlds, another decision: the 16 published futures keep their index under all three decisions", () => {
    for (const d of DECISIONS) {
      const r = runFor(m3.paths.seed, 16, d);
      m3.paths.decisions[d.key].forEach((w: any, i: number) => expect(Math.abs(r.outcomes[i]!.npv - w.npv)).toBeLessThan(1e-6));
    }
  });
  it("the 20,000-future share that closes the turn equals the published P(loss) complement for NPV", () => {
    const r = runFor(SEED_DEFAULT, 20000, DECISIONS[0]!);
    expect(Math.abs(r.lossShare - m3.run.p_loss)).toBeLessThan(1e-9);
  });
});
import { unrollPoint, recAtPacked } from "./turn";
describe("the Unroll", () => {
  const r = runFor(SEED_DEFAULT, 8, DECISIONS[0]!).outcomes[3]!;
  const rec = Float32Array.from(r.recovered);
  const p = { cx: 700, cy: 400, R: 300 }, f = { x0: 100, y0: 50, w: 800, h: 600 };
  it("u = 0 lies on the polar target and u = 1 on the cartesian target", () => {
    for (const t of [1, 3.5, 8]) {
      const s = recAtPacked(rec, 0, t);
      const [x0, y0] = unrollPoint(rec, 0, t, 0, p, f);
      expect(x0).toBeCloseTo(p.cx + ((p.R * t) / 8) * Math.sin(2 * Math.PI * s), 6);
      expect(y0).toBeCloseTo(p.cy - ((p.R * t) / 8) * Math.cos(2 * Math.PI * s), 6);
      const [x1, y1] = unrollPoint(rec, 0, t, 1, p, f);
      expect(x1).toBeCloseTo(f.x0 + (Math.min(s, 1.8) / 1.8) * f.w, 6);
      expect(y1).toBeCloseTo(f.y0 + (t / 8) * f.h, 6);
    }
  });
});

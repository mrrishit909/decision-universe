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

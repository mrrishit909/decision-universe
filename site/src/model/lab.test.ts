import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MODULE_IDS, runModule, type Artifacts } from "./lab";

const f: Record<string, string> = { m01: "m01_distributions", m02: "m02_sampling", m03: "m03_montecarlo", m04: "m04_bayes", m05: "m05_forecast", m06: "m06_credit", m07: "m07_pareto", m08: "m08_sensitivity", m09: "m09_counterfactual", m10: "m10_causal" };
const art = Object.fromEntries(MODULE_IDS.map((id) => [id, JSON.parse(readFileSync(join(process.cwd(), `public/data/${f[id]}.json`), "utf8"))])) as Artifacts;
describe("THE LAB parity", () => {
  it("all ten modules match their published vectors at the published seed", () => {
    for (const id of MODULE_IDS) { const r = runModule(id, art, 20261011); expect(r.diff, id).toBeNull(); expect(r.parity, id).toBe("match"); expect(r.total).toBeGreaterThan(0); }
  });
  it("at another seed the seeded modules say NO PUBLISHED VECTOR, never MATCH", () => {
    for (const id of ["m02", "m03", "m04"] as const) expect(runModule(id, art, 7).parity, id).toBe("novector");
  });
  it("PRECOMPUTED rows are unchanged by the seed", () => {
    expect(runModule("m06", art, 7).lines).toEqual(runModule("m06", art, 20261011).lines);
    expect(runModule("m09", art, 7).lines).toEqual(runModule("m09", art, 20261011).lines);
  });
});

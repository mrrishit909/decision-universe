import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Xoshiro128ss, splitmix32Seq } from "./rng";
import * as dist from "./dists";
import { evaluate, drawInputs, PRESETS, run, summarize, runDetail } from "./mc";
import { betaBinomial, normalNormal, sequential } from "./bayes";
import { genSeries, sesFit, ar1Fit, sesForecast, ar1Forecast } from "./forecast";
import { costAt, argminThreshold, thresholdTheory } from "./credit";
import { analytic, ishigami, saltelli, oat } from "./sens";
import { search, pBad, type CfModel } from "./counterfactual";
import { estimators, synthetic } from "./causal";
import { lpText, type LpProblem } from "./lp";

const D = join(process.cwd(), "public/data");
const J = <T,>(f: string) => JSON.parse(readFileSync(join(D, f), "utf8")) as T;
const near = (g: number, w: number, abs: number, rel = 0) => expect(Math.abs(g - w), `${g} vs ${w}`).toBeLessThanOrEqual(abs + rel * Math.abs(w));
const arr = (g: number[], w: number[], abs: number, rel = 0) => { expect(g.length).toBe(w.length); g.forEach((v, i) => near(v, w[i]!, abs, rel)); };

describe("m02 sampling: the PRNG is bit-exact", () => {
  const m = J<any>("m02_sampling.json");
  it("first 16 u32 for every published seed", () => {
    for (const v of m.seed_vectors) {
      const r = new Xoshiro128ss(v.seed);
      expect(Array.from({ length: 16 }, () => r.nextU32())).toEqual(v.first_16_u32);
    }
  });
  it("first 1000 u32 of the published seed, uniforms and normals", () => {
    const r = new Xoshiro128ss(m.seed);
    expect(Array.from({ length: 1000 }, () => r.nextU32())).toEqual(m.first_1000_u32);
    const u = new Xoshiro128ss(m.seed);
    arr(Array.from({ length: 20 }, () => u.uniform()), m.uniform_first, 1e-12);
    const n = new Xoshiro128ss(m.seed);
    arr(Array.from({ length: 20 }, () => n.normal()), m.normal_first, 1e-9);
    expect(splitmix32Seq(1)).toHaveLength(4);
  });
  it("moments of 100,000 draws equal the published moments", () => {
    const r = new Xoshiro128ss(m.seed + 1 - 1);
    let su = 0, suu = 0, sn = 0, snn = 0;
    const N = m.moments.n;
    for (let i = 0; i < N; i++) { const u = r.uniform(); su += u; suu += u * u; }
    const r2 = new Xoshiro128ss(m.seed + 1); // the build draws the normals from seed + 1
    for (let i = 0; i < N; i++) { const z = r2.normal(); sn += z; snn += z * z; }
    near(su / N, m.moments.uniform_mean, 1e-9);
    near(sn / N, m.moments.normal_mean, 1e-9);
    near(snn / N - (sn / N) ** 2, m.moments.normal_var, 2e-5);
    void suu;
  });
});

describe("m01 distributions: pdf, cdf and quantile", () => {
  const m = J<any>("m01_distributions.json");
  const make = (c: any): dist.Dist => {
    const p = c.params;
    switch (c.dist) {
      case "normal": return dist.normal(p.mu, p.sigma);
      case "lognormal": return dist.lognormal(p.mu, p.sigma);
      case "beta": return dist.beta(p.a, p.b);
      case "gamma": return dist.gamma(p.shape, p.scale);
      case "poisson": return dist.poisson(p.lambda ?? p.lam);
      default: throw new Error(c.dist);
    }
  };
  m.cases.forEach((c: any, i: number) => {
    it(`case ${i} ${c.dist} ${JSON.stringify(c.params)}`, () => {
      const d = make(c);
      arr(c.x.map((x: number) => d.cdf(x)), c.cdf, m.tolerance.abs, m.tolerance.rel);
      arr(c.x.map((x: number) => d.pdf(x)), c.pdf, m.tolerance.abs, m.tolerance.rel);
      arr(c.p.map((p: number) => d.ppf(p)), c.quantile, c.discrete ? 0 : m.tolerance.abs * 10, m.tolerance.rel * 10);
    });
  });
});

describe("m03 Monte Carlo", () => {
  const m = J<any>("m03_montecarlo.json");
  it("the 6 published vectors", () => {
    for (const v of m.vectors) {
      const s = summarize(run(v.seed, v.n));
      near(s.mean, v.mean, 1e-8, 1e-9); near(s.sd, v.sd, 1e-8, 1e-9); near(s.se, v.se, 1e-8, 1e-9);
      near(s.p05, v.p05, 1e-8, 1e-9); near(s.p50, v.p50, 1e-8, 1e-9); near(s.p95, v.p95, 1e-8, 1e-9); near(s.p_loss, v.p_loss, 1e-9);
      arr(run(v.seed, 5), v.first_5, 1e-8, 1e-9);
    }
  });
  it("the 20,000-trial run and the convergence prefixes", () => {
    const x = run(m.run.seed, 100000);
    const s = summarize(x.slice(0, m.run.n));
    near(s.mean, m.run.mean, 1e-7, 1e-9); near(s.p_loss, m.run.p_loss, 1e-9); near(s.p50, m.run.p50, 1e-6, 1e-8);
    near(summarize(x).mean, m.run.mean_n100000, 1e-7, 1e-9);
    for (const c of m.convergence) near(summarize(x.slice(0, c.n)).mean, c.mean, 1e-7, 1e-9);
  });
  it("sixteen futures per decision under common random numbers", () => {
    const rng = new Xoshiro128ss(m.paths.seed);
    const draws = Array.from({ length: 16 }, () => drawInputs(rng));
    arr(draws[0]!, m.paths.draws[0], 1e-8, 1e-9);
    for (const key of ["build_now", "phased", "delay_one_year"]) {
      draws.forEach((d, i) => {
        const o = evaluate(d, PRESETS[key]!), w = m.paths.decisions[key][i];
        near(o.npv, w.npv, 1e-7, 1e-8); near(o.investment, w.investment, 1e-7, 1e-8);
        arr(o.recovered, w.recovered, 1e-7, 1e-8);
        if (w.payback_year === null) expect(o.paybackYear).toBeNull(); else near(o.paybackYear!, w.payback_year, 1e-7, 1e-8);
      });
    }
    expect(runDetail(m.paths.seed, 16, PRESETS.build_now!)).toHaveLength(16);
  });
});

describe("m04 Bayes", () => {
  const m = J<any>("m04_bayes.json");
  it("beta-binomial rows: posterior, credible and Wilson intervals", () => {
    for (const r of m.beta_binomial) {
      const g = betaBinomial(r.prior[0], r.prior[1], r.k, r.n);
      arr(g.credible95, r.credible95, 1e-7, 1e-7); arr(g.confidence95_wilson, r.confidence95_wilson, 1e-8, 1e-8);
      near(g.post_mean, r.post_mean, 1e-8); near(g.p_gt_half, r.p_gt_half, 1e-7, 1e-6);
    }
  });
  it("normal-normal rows", () => {
    for (const r of m.normal_normal) {
      const g = normalNormal(r.prior[0], r.prior[1], r.sigma, r.n, r.ybar);
      arr(g.credible95, r.credible95, 1e-8, 1e-8); arr(g.confidence95_z, r.confidence95_z, 1e-8, 1e-8);
    }
  });
  it("the sequential path and its flips", () => {
    const s = sequential(m.sequential.seed, m.sequential.p_true, 200);
    expect(s.flips).toEqual(m.sequential.flips);
    s.path.forEach((p, i) => { near(p.cr_lo, m.sequential.path[i].cr_lo, 1e-7, 1e-7); near(p.ci_hi, m.sequential.path[i].ci_hi, 1e-8, 1e-8); });
  });
  it("credible and confidence intervals are different objects", () => {
    const g = betaBinomial(1, 1, 3, 10);
    expect(g.credible95).not.toEqual(g.confidence95_wilson);
  });
});

describe("m05 forecast intervals", () => {
  const m = J<any>("m05_forecast.json");
  it("published vectors: fits and h-step intervals for SES and AR(1)", () => {
    for (const v of m.vectors) {
      const x = genSeries(v.seed, v.n, v.mu, v.phi, v.sigma);
      arr(x.slice(-3), v.x_last_3, 1e-6, 1e-8);
      const s = sesFit(x), a = ar1Fit(x);
      near(s.alpha, v.ses.alpha, 1e-12); near(s.level, v.ses.level, 1e-6, 1e-8); near(s.sigma2, v.ses.sigma2, 1e-6, 1e-8);
      near(a.phi, v.ar1.phi, 1e-6, 1e-8); near(a.sigma2, v.ar1.sigma2, 1e-6, 1e-8); near(a.mu, v.ar1.mu, 1e-5, 1e-8);
      for (const lvl of ["0.8", "0.95"]) {
        v.forecast_ses[lvl].forEach((w: number[], h: number) => arr(sesForecast(s, h + 1, Number(lvl)), w, 1e-6, 1e-8));
        v.forecast_ar1[lvl].forEach((w: number[], h: number) => arr(ar1Forecast(a, h + 1, Number(lvl)), w, 1e-6, 1e-8));
      }
    }
  });
  it("the displayed series: seed, fits and its 12-step intervals", () => {
    const x = genSeries(m.series.seed, m.series.x.length, m.series.mu, m.series.phi, m.series.sigma);
    arr(x, m.series.x, 1e-6, 1e-8);
    const train = x.slice(0, m.series.n_train);
    near(sesFit(train).alpha, m.fits.ses.alpha, 1e-12);
    near(ar1Fit(train).phi, m.fits.ar1.phi, 1e-6, 1e-8);
  });
});

describe("m06 cost-sensitive thresholds", () => {
  const m = J<any>("m06_credit.json");
  it("confusion counts and costs at every published threshold and cost ratio", () => {
    for (const v of m.vectors) {
      if (v.kind === "cost") {
        const c = costAt(m.test.p_bad, m.test.y_bad, v.t, v.c_fn, v.c_fp);
        expect([c.tp, c.fp, c.fn, c.tn]).toEqual([v.tp, v.fp, v.fn, v.tn]);
        near(c.cost, v.cost, 1e-9);
      } else {
        const [t, c] = argminThreshold(m.test.p_bad, m.test.y_bad, v.c_fn, v.c_fp);
        near(t, v.t_opt_grid, 1e-9); near(c, v.cost, 1e-9); near(thresholdTheory(v.c_fn, v.c_fp), v.t_theory, 1e-9);
      }
    }
  });
  it("the curve and the optimum", () => {
    m.curve.points.forEach((p: any) => near(costAt(m.test.p_bad, m.test.y_bad, p.t).cost, p.cost, 1e-9));
    const [t, c] = argminThreshold(m.test.p_bad, m.test.y_bad);
    near(t, m.optimum.t_opt_grid, 1e-12); near(c, m.optimum.cost_opt, 1e-9);
  });
});

describe("m08 sensitivity", () => {
  const m = J<any>("m08_sensitivity.json");
  it("function values, analytic indices and Saltelli estimates", () => {
    for (const v of m.vectors) {
      if (v.kind === "function") v.points.forEach((p: number[], i: number) => near(ishigami(p[0]!, p[1]!, p[2]!), v.f[i], 1e-9, 1e-9));
      else { const s = saltelli(v.seed, v.N); arr(s.S, v.S, 1e-8, 1e-8); arr(s.ST, v.ST, 1e-8, 1e-8); near(s.V, v.V, 1e-8, 1e-8); }
    }
    const a = analytic();
    arr(a.S, m.analytic.S, 1e-9); arr(a.ST, m.analytic.ST, 1e-9); near(a.V, m.analytic.V, 1e-9);
  });
  it("OAT at the origin sees no x3 effect", () => {
    const o = oat([0, 0, 0]);
    expect(o.sweeps[2]!.range).toBeLessThan(1e-12);
  });
});

describe("m09 model counterfactuals", () => {
  const m = J<any>("m09_counterfactual.json");
  const model = m.model as CfModel;
  it("every applicant: base probability and the minimal change at both targets", () => {
    m.applicants.forEach((row: any, i: number) => {
      const res = m.results[i];
      for (const t of res.targets) {
        const g = search(model, row, t.target);
        near(g.base_p_bad, t.base_p_bad, 1e-8, 1e-8);
        expect(g.found).toBe(t.found);
        if (t.found) { expect(g.changes).toEqual(t.changes); near(g.cost!, t.cost, 1e-7, 1e-8); near(g.p_bad_after!, t.p_bad_after, 1e-8, 1e-8); }
      }
    });
    expect(pBad(model, m.applicants[0])).toBeGreaterThan(0);
  });
});

describe("m10 causal estimators on the synthetic data", () => {
  const m = J<any>("m10_causal.json");
  for (const v of m.vectors) {
    it(`seed ${v.seed} gamma ${v.gamma}`, () => {
      const s = synthetic(v.seed, v.n, v.gamma, v.tau_true);
      const e = estimators(s.y, s.t, s.X, 25);
      expect(s.t.reduce((a, b) => a + b, 0)).toBe(v.n_treated);
      near(e.naive, v.naive, 1e-6, 1e-6); near(e.ols_coef, v.ols_coef, 1e-6, 1e-6); near(e.ra_att, v.ra_att, 1e-6, 1e-6); near(e.ipw_att, v.ipw_att, 1e-6, 1e-6);
      near(e.ess_controls, v.ess_controls, 1e-4, 1e-6); arr(e.ps_beta, v.ps_beta, 1e-6, 1e-5);
    });
  }
});

describe("m07 LP text", () => {
  const m = J<any>("m07_pareto.json");
  it("the builder reproduces the published example byte for byte", () => {
    const p = m.problem as LpProblem;
    const pt = m.front[m.lp_text.example_point];
    const text = lpText(p, p.b[0]!, pt.eps);
    expect(text).toBe(m.lp_text.example);
  });
});

import { loadHighs, solveText } from "./lpsolve";
import { epsGrid } from "./lp";
describe("m07 Pareto front: HiGHS solves every published epsilon to the published profit", () => {
  const m = J<any>("m07_pareto.json");
  it("the 21-point front and the labor-hours variants", async () => {
    const mod: any = await import("highs");
    const h = await loadHighs(mod.default ?? mod, (f) => join(process.cwd(), "node_modules/highs/build", f));
    const p = m.problem as LpProblem;
    for (const pt of m.front) {
      const s = solveText(h, lpText(p, p.b[0]!, pt.eps));
      expect(s.status).toBe("Optimal");
      near(s.objective, pt.profit, 1e-6, 1e-7);
    }
    for (const v of m.vectors) {
      const labor = v.labor_hours;
      const eps = epsGrid(v.e_lo, v.e_hi, v.eps_profit.length - 1);
      eps.forEach((e, k) => { const s = solveText(h, lpText(p, labor, e)); near(s.objective, v.eps_profit[k][1], 1e-6, 1e-7); });
    }
  });
});

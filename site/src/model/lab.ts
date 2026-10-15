/**
 * THE LAB: the ten instruments run in the visitor's browser, each against its published vectors (VISUAL_DESIGN 3.4).
 * Pure and synchronous (m07's HiGHS solves run in their own worker and are driven from the scene).
 * Parity is reported only where a published vector exists for the seed in use, never otherwise.
 */
import { Xoshiro128ss } from "./rng";
import * as dist from "./dists";
import { PRESETS, drawInputs, evaluate, run, summarize } from "./mc";
import { betaBinomial, normalNormal, sequential } from "./bayes";
import { genSeries, sesFit, ar1Fit, sesForecast, ar1Forecast } from "./forecast";
import { costAt, argminThreshold } from "./credit";
import { analytic, ishigami, saltelli } from "./sens";
import { search, type CfModel } from "./counterfactual";
import { estimators, synthetic } from "./causal";
import { lpText, type LpProblem } from "./lp";

 
export type ModuleId = "m01" | "m02" | "m03" | "m04" | "m05" | "m06" | "m07" | "m08" | "m09" | "m10";
export interface LabResult {
  id: ModuleId;
  /** match: every vector matched; mismatch: first difference in `diff`; novector: this seed has no published vector */
  parity: "match" | "mismatch" | "novector";
  k: number; total: number;
  diff: string | null;
  /** what was recomputed, one short line per fact */
  lines: string[];
  ms: number;
  /** what stays PRECOMPUTED · PYTHON REFERENCE, verbatim */
  precomputed: string;
}
export type Artifacts = Record<ModuleId, any>;
const canon = (v: unknown): string => JSON.stringify(v, (_k, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1))) : x));
const close = (g: number, w: number, abs: number, rel = 0) => Math.abs(g - w) <= abs + rel * Math.abs(w);
class Check {
  k = 0; total = 0; diff: string | null = null;
  num(name: string, g: number, w: number, abs: number, rel = 0) {
    this.total++;
    if (close(g, w, abs, rel)) this.k++; else this.diff ??= `${name}: got ${g}, want ${w}`;
  }
  arr(name: string, g: ArrayLike<number>, w: ArrayLike<number>, abs: number, rel = 0) {
    this.total++;
    let ok = g.length === w.length;
    for (let i = 0; ok && i < w.length; i++) ok = close(g[i]!, w[i]!, abs, rel);
    if (ok) this.k++; else this.diff ??= `${name}: arrays differ`;
  }
  eq(name: string, g: unknown, w: unknown) {
    this.total++;
    if (canon(g) === canon(w)) this.k++; else this.diff ??= `${name}: differs`;
  }
}
const PRE: Record<ModuleId, string> = {
  m01: "NONE: ALL OF IT RUNS HERE",
  m02: "NONE: ALL OF IT RUNS HERE",
  m03: "THE 100,000-TRIAL CONVERGENCE PREFIX IS A TABLE ROW",
  m04: "NONE: ALL OF IT RUNS HERE",
  m05: "THE 2,000-REPLICATE COVERAGE STUDY (NUMPY PCG64) STAYS PRECOMPUTED · PYTHON REFERENCE",
  m06: "THE MODEL FIT, PLATT SCALING AND REPEATED SPLITS STAY PRECOMPUTED · PYTHON REFERENCE",
  m07: "NONE: THE LP SOLVES RUN HERE IN HIGHS WEBASSEMBLY",
  m08: "NONE: ALL OF IT RUNS HERE",
  m09: "THE MODEL FIT STAYS PRECOMPUTED · PYTHON REFERENCE",
  m10: "EVERY NSW AND PSID NUMBER AND ITS BOOTSTRAP INTERVAL STAYS PRECOMPUTED · PYTHON REFERENCE (MICRODATA IS NOT SHIPPED)",
};
export const SEEDED: Record<ModuleId, boolean> = { m01: false, m02: true, m03: true, m04: true, m05: false, m06: false, m07: false, m08: true, m09: false, m10: true };

function m01(a: any, c: Check) {
  const mk = (x: any): dist.Dist => {
    const p = x.params;
    switch (x.dist) {
      case "normal": return dist.normal(p.mu, p.sigma);
      case "lognormal": return dist.lognormal(p.mu, p.sigma);
      case "beta": return dist.beta(p.a, p.b);
      case "gamma": return dist.gamma(p.shape, p.scale);
      default: return dist.poisson(p.lambda ?? p.lam);
    }
  };
  const t = a.tolerance;
  a.cases.forEach((x: any, i: number) => {
    const d = mk(x);
    c.arr(`case ${i} cdf`, x.x.map((v: number) => d.cdf(v)), x.cdf, t.abs, t.rel);
    c.arr(`case ${i} pdf`, x.x.map((v: number) => d.pdf(v)), x.pdf, t.abs, t.rel);
    c.arr(`case ${i} quantile`, x.p.map((v: number) => d.ppf(v)), x.quantile, x.discrete ? 0 : t.abs * 10, t.rel * 10);
  });
  return [`${a.cases.length} DISTRIBUTIONS: PDF, CDF, QUANTILE`, `MAX INTEGRAL ERROR ${a.checks.max_abs_integral_error.toExponential(1)} (PUBLISHED)`];
}
function m02(a: any, c: Check, seed: number) {
  const r = new Xoshiro128ss(seed);
  const u32 = Array.from({ length: 16 }, () => r.nextU32());
  if (seed === a.seed) {
    const r2 = new Xoshiro128ss(seed);
    c.eq("first 1000 u32", Array.from({ length: 1000 }, () => r2.nextU32()), a.first_1000_u32);
    const u = new Xoshiro128ss(seed), n = new Xoshiro128ss(seed);
    c.arr("uniforms", Array.from({ length: 20 }, () => u.uniform()), a.uniform_first, 1e-12);
    c.arr("normals", Array.from({ length: 20 }, () => n.normal()), a.normal_first, 1e-9);
  }
  for (const v of a.seed_vectors) { const q = new Xoshiro128ss(v.seed); c.eq(`seed ${v.seed}`, Array.from({ length: 16 }, () => q.nextU32()), v.first_16_u32); }
  return [`SEED ${seed}: FIRST 8 U32 ${u32.slice(0, 8).join(" ")}`];
}
function m03(a: any, c: Check, seed: number) {
  const t = a.tolerance;
  if (seed === a.run.seed) {
    const x = run(seed, a.run.n), s = summarize(x);
    c.num("mean", s.mean, a.run.mean, 1e-7, 1e-9); c.num("p_loss", s.p_loss, a.run.p_loss, 1e-9); c.num("p50", s.p50, a.run.p50, 1e-6, 1e-8);
    const rng = new Xoshiro128ss(a.paths.seed);
    const draws = Array.from({ length: 16 }, () => drawInputs(rng));
    for (const key of Object.keys(PRESETS)) draws.forEach((d, i) => c.num(`${key} ${i}`, evaluate(d, PRESETS[key]!).npv, a.paths.decisions[key][i].npv, 1e-7, 1e-8));
  }
  for (const v of a.vectors) { const s = summarize(run(v.seed, v.n)); c.num(`vec ${v.seed} mean`, s.mean, v.mean, t.abs, t.rel); c.num(`vec ${v.seed} sd`, s.sd, v.sd, t.abs, t.rel); }
  const s = summarize(run(seed, 20000));
  return [`SEED ${seed} · 20,000 FUTURES: MEAN ${s.mean.toFixed(2)} M USD · P(LOSS) ${(s.p_loss * 100).toFixed(1)}%`, `95% CONFIDENCE INTERVAL OF THE MEAN ${s.ci95_lo.toFixed(2)} TO ${s.ci95_hi.toFixed(2)}`];
}
function m04(a: any, c: Check, seed: number) {
  for (const r of a.beta_binomial) {
    const g = betaBinomial(r.prior[0], r.prior[1], r.k, r.n);
    c.arr("credible", g.credible95, r.credible95, 1e-7, 1e-7); c.arr("wilson", g.confidence95_wilson, r.confidence95_wilson, 1e-8, 1e-8);
  }
  for (const r of a.normal_normal) { const g = normalNormal(r.prior[0], r.prior[1], r.sigma, r.n, r.ybar); c.arr("nn credible", g.credible95, r.credible95, 1e-8, 1e-8); c.arr("nn z", g.confidence95_z, r.confidence95_z, 1e-8, 1e-8); }
  const live = sequential(seed, a.sequential.p_true, 200);
  if (seed === a.sequential.seed) {
    c.eq("flips", live.flips, a.sequential.flips);
    live.path.forEach((p, i) => { c.num(`cr_lo ${i}`, p.cr_lo, a.sequential.path[i].cr_lo, 1e-7, 1e-7); c.num(`ci_hi ${i}`, p.ci_hi, a.sequential.path[i].ci_hi, 1e-8, 1e-8); });
  }
  const last = live.path[live.path.length - 1]!;
  return [`SEED ${seed} · 200 FLIPS AT P ${a.sequential.p_true}: ${live.flips.reduce((x: number, y: number) => x + y, 0)} SUCCESSES`, `AFTER ${last.n}: CREDIBLE ${last.cr_lo.toFixed(3)} TO ${last.cr_hi.toFixed(3)} · CONFIDENCE ${last.ci_lo.toFixed(3)} TO ${last.ci_hi.toFixed(3)}`];
}
function m05(a: any, c: Check) {
  for (const v of a.vectors) {
    const x = genSeries(v.seed, v.n, v.mu, v.phi, v.sigma), s = sesFit(x), f = ar1Fit(x);
    c.arr("x_last_3", x.slice(-3), v.x_last_3, 1e-6, 1e-8);
    c.num("ses alpha", s.alpha, v.ses.alpha, 1e-12); c.num("ses level", s.level, v.ses.level, 1e-6, 1e-8); c.num("ar1 phi", f.phi, v.ar1.phi, 1e-6, 1e-8);
    for (const lvl of ["0.8", "0.95"]) {
      v.forecast_ses[lvl].forEach((w: number[], h: number) => c.arr(`ses ${lvl} h${h + 1}`, sesForecast(s, h + 1, Number(lvl)), w, 1e-6, 1e-8));
      v.forecast_ar1[lvl].forEach((w: number[], h: number) => c.arr(`ar1 ${lvl} h${h + 1}`, ar1Forecast(f, h + 1, Number(lvl)), w, 1e-6, 1e-8));
    }
  }
  const x = genSeries(a.series.seed, a.series.x.length, a.series.mu, a.series.phi, a.series.sigma);
  c.arr("series", x, a.series.x, 1e-6, 1e-8);
  const f = ar1Fit(x.slice(0, a.series.n_train));
  return [`${a.series.x.length}-POINT SERIES · AR(1) PHI ${f.phi.toFixed(3)} · SES ALPHA ${sesFit(x.slice(0, a.series.n_train)).alpha.toFixed(2)}`];
}
function m06(a: any, c: Check) {
  for (const v of a.vectors) {
    if (v.kind === "cost") { const r = costAt(a.test.p_bad, a.test.y_bad, v.t, v.c_fn, v.c_fp); c.eq(`counts t ${v.t}`, [r.tp, r.fp, r.fn, r.tn], [v.tp, v.fp, v.fn, v.tn]); c.num("cost", r.cost, v.cost, 1e-9); }
    else { const [t, cost] = argminThreshold(a.test.p_bad, a.test.y_bad, v.c_fn, v.c_fp); c.num("t_opt", t, v.t_opt_grid, 1e-9); c.num("cost_opt", cost, v.cost, 1e-9); }
  }
  const [t, cost] = argminThreshold(a.test.p_bad, a.test.y_bad);
  return [`250 TEST APPLICANTS · OPTIMUM T ${t.toFixed(2)} · COST ${cost.toFixed(3)} PER APPLICANT (5:1 MATRIX)`];
}
function m08(a: any, c: Check, seed: number) {
  for (const v of a.vectors) {
    if (v.kind === "function") v.points.forEach((p: number[], i: number) => c.num(`f ${i}`, ishigami(p[0]!, p[1]!, p[2]!), v.f[i], 1e-9, 1e-9));
    else { const s = saltelli(v.seed, v.N); c.arr(`S ${v.seed}`, s.S, v.S, 1e-8, 1e-8); c.arr(`ST ${v.seed}`, s.ST, v.ST, 1e-8, 1e-8); }
  }
  const an = analytic();
  c.arr("analytic S", an.S, a.analytic.S, 1e-9); c.arr("analytic ST", an.ST, a.analytic.ST, 1e-9);
  const s = saltelli(seed, 1024);
  return [`SEED ${seed} · N 1,024 · S1 ${s.S.map((v: number) => v.toFixed(3)).join(" ")} · ANALYTIC ${an.S.map((v) => v.toFixed(3)).join(" ")}`];
}
function m09(a: any, c: Check) {
  const model = a.model as CfModel;
  a.applicants.forEach((row: any, i: number) => {
    for (const t of a.results[i].targets) {
      const g = search(model, row, t.target);
      c.num("base", g.base_p_bad, t.base_p_bad, 1e-8, 1e-8); c.eq("found", g.found, t.found);
      if (t.found) { c.eq("changes", g.changes, t.changes); c.num("after", g.p_bad_after!, t.p_bad_after, 1e-8, 1e-8); }
    }
  });
  return [`${a.applicants.length} APPLICANTS · EXHAUSTIVE MINIMAL-CHANGE SEARCH AT TWO TARGETS`, "MODEL COUNTERFACTUAL · NOT A CAUSAL CLAIM"];
}
function m10(a: any, c: Check) {
  const lines: string[] = [];
  for (const v of a.vectors) {
    const s = synthetic(v.seed, v.n, v.gamma, v.tau_true), e = estimators(s.y, s.t, s.X, 25);
    c.num("naive", e.naive, v.naive, 1e-6, 1e-6); c.num("ols", e.ols_coef, v.ols_coef, 1e-6, 1e-6); c.num("ra", e.ra_att, v.ra_att, 1e-6, 1e-6); c.num("ipw", e.ipw_att, v.ipw_att, 1e-6, 1e-6);
    lines.push(`SYNTHETIC WORLD SEED ${v.seed}, CONFOUNDING ${v.gamma}: NAIVE ${e.naive.toFixed(2)} · IPW ${e.ipw_att.toFixed(2)} · TRUE ${v.tau_true}`);
  }
  return lines;
}
const RUN: Record<ModuleId, (a: any, c: Check, seed: number) => string[]> = { m01, m02, m03, m04, m05, m06, m07: () => [], m08, m09, m10 };
/** vectors are published at the artifact's own seed (and the vector seeds); the SEED field matters only for seeded modules */
const publishedSeed = (id: ModuleId, a: any): number | null => (id === "m02" || id === "m03" ? a.seed ?? a.run?.seed : id === "m04" ? a.sequential.seed : id === "m08" || id === "m10" ? null : null);

export function runModule(id: ModuleId, art: Artifacts, seed: number): LabResult {
  const t0 = performance.now();
  const a = art[id];
  const c = new Check();
  let lines: string[];
  if (id === "m07") {
    const p = a.problem as LpProblem;
    c.eq("lp text", lpText(p, p.b[0]!, a.front[a.lp_text.example_point].eps), a.lp_text.example);
    lines = [`${a.front.length} FRONT POINTS · LP TEXT BYTE-IDENTICAL TO THE REFERENCE (SHA ${String(a.lp_text.example_sha256).slice(0, 12)})`];
  } else lines = RUN[id](a, c, seed);
  const pub = publishedSeed(id, a);
  // seeded modules show parity only at a seed that has published vectors; m08 and m10 vectors carry their own seeds, so they always match
  const novector = SEEDED[id] && pub !== null && seed !== pub && id !== "m08" && id !== "m10";
  return {
    id, k: c.k, total: c.total, diff: c.diff, lines, precomputed: PRE[id], ms: performance.now() - t0,
    parity: novector ? "novector" : c.k === c.total ? "match" : "mismatch",
  };
}
export const MODULE_IDS: ModuleId[] = ["m01", "m02", "m03", "m04", "m05", "m06", "m07", "m08", "m09", "m10"];

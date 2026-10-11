"""Build every artifact into site/public/data and validation.json.

    uv run python -m pipelines.build
"""
from __future__ import annotations

import gzip
import json
import math

import numpy as np
import pandas as pd
from scipy import integrate

from analytics import bayes, counterfactual, credit, dists, forecast, lp, mc, sens
from analytics.causal import estimators, smd, synthetic
from analytics.rng import Xoshiro128ss
from pipelines.common import MANIFESTS, PUBLIC, RAW, SEED, r, rl, write_artifact

CHECKS: list[dict] = []
FAILURES: list[str] = []
TOL = lambda a, rel, note="": {"abs": a, "rel": rel, "note": note or "pass when |got - want| <= abs + rel*|want|"}


def check(module, name, value, bound, passed):
    CHECKS.append({"module": module, "name": name, "value": value, "bound": bound, "passed": bool(passed)})
    if not passed:
        FAILURES.append(f"{module}: {name} value={value} bound={bound}")


# ------------------------------------------------------------------ 1 distributions
def m01():
    P = [0.001, 0.01, 0.05, 0.25, 0.5, 0.75, 0.95, 0.99, 0.999]
    specs = [("normal", (0.0, 1.0)), ("normal", (1.5, 2.0)), ("lognormal", (0.2, 0.6)), ("lognormal", (0.0, 1.0)), ("beta", (2.5, 4.0)), ("beta", (0.6, 0.8)),
             ("beta", (10.0, 3.0)), ("gamma", (3.0, 2.0)), ("gamma", (0.7, 1.5)), ("gamma", (20.0, 0.5)), ("poisson", (0.4,)), ("poisson", (3.0,)), ("poisson", (12.5,)), ("poisson", (80.0,))]
    cases, worst_norm, worst_rt = [], 0.0, 0.0
    for name, par in specs:
        f = getattr(dists, name)(*par)
        if name == "poisson":
            pmf, cdf, ppf = f
            ks = sorted(set(int(ppf(p)) for p in (0.01, 0.1, 0.3, 0.5, 0.7, 0.9, 0.99)) | {0, 1})
            cases.append({"dist": name, "params": {"lambda": par[0]}, "discrete": True, "x": ks, "pdf": rl([pmf(k) for k in ks]), "cdf": rl([cdf(k) for k in ks]),
                          "p": P, "quantile": [ppf(p) for p in P]})
            worst_norm = max(worst_norm, abs(sum(pmf(k) for k in range(0, 2000)) - 1))
            continue
        pdf, cdf, ppf = f
        xs = [r(ppf(p), 4) for p in (0.02, 0.1, 0.3, 0.5, 0.7, 0.9, 0.98)]
        lo, hi = {"normal": (-math.inf, math.inf), "lognormal": (0, math.inf), "gamma": (0, math.inf), "beta": (0, 1)}[name]
        val, _ = integrate.quad(pdf, lo, hi, limit=400)
        worst_norm = max(worst_norm, abs(val - 1))
        worst_rt = max(worst_rt, max(abs(cdf(ppf(p)) - p) for p in P))
        keys = {"normal": ("mu", "sigma"), "lognormal": ("mu", "sigma"), "beta": ("a", "b"), "gamma": ("shape", "scale")}[name]
        cases.append({"dist": name, "params": dict(zip(keys, par)), "discrete": False, "x": xs, "pdf": rl([pdf(x) for x in xs]), "cdf": rl([cdf(x) for x in xs]), "p": P, "quantile": rl([ppf(p) for p in P])})
    check("m01", "max |integral pdf - 1| (14 cases)", worst_norm, 1e-7, worst_norm < 1e-7)
    check("m01", "max |cdf(quantile(p)) - p|", worst_rt, 1e-9, worst_rt < 1e-9)
    return {"tags": {"cases": "DERIVED"}, "tolerance": TOL(1e-9, 1e-9, "pdf/cdf/quantile of continuous cases; poisson quantiles are exact integers"),
            "spec": {"functions": "analytics/special.py (Lanczos g=7 lgamma, incomplete gamma series/Lentz, incomplete beta Lentz) and analytics/dists.py", "poisson_quantile": "smallest integer k with cdf(k) >= p",
                     "note": "Only exp, log, sqrt are used so the TypeScript port needs no library."},
            "cases": cases, "checks": {"max_abs_integral_error": worst_norm, "max_abs_quantile_roundtrip_error": worst_rt}}


# ------------------------------------------------------------------ 2 sampling
def m02():
    g = Xoshiro128ss(SEED)
    u32 = [g.next_u32() for _ in range(1000)]
    g = Xoshiro128ss(SEED)
    us = [g.uniform() for _ in range(20)]
    g = Xoshiro128ss(SEED)
    zs = [g.normal() for _ in range(20)]
    sv = []
    for s in (1, 42, 4294967295):
        gg = Xoshiro128ss(s)
        sv.append({"seed": s, "first_16_u32": [gg.next_u32() for _ in range(16)]})
    g = Xoshiro128ss(SEED)
    u = np.array([g.uniform() for _ in range(100000)])
    g = Xoshiro128ss(SEED + 1)
    z = np.array([g.normal() for _ in range(100000)])
    mom = {"n": 100000, "uniform_mean": float(u.mean()), "uniform_var": float(u.var()), "normal_mean": float(z.mean()), "normal_var": float(z.var()),
           "normal_skew": float(((z - z.mean()) ** 3).mean() / z.std() ** 3), "normal_kurtosis": float(((z - z.mean()) ** 4).mean() / z.var() ** 2)}
    check("m02", "uniform mean within 4 se of 0.5", mom["uniform_mean"], [0.5 - 4 * math.sqrt(1 / 12 / 1e5), 0.5 + 4 * math.sqrt(1 / 12 / 1e5)], abs(mom["uniform_mean"] - 0.5) < 4 * math.sqrt(1 / 12 / 1e5))
    check("m02", "normal variance within 4 se of 1", mom["normal_var"], [1 - 4 * math.sqrt(2 / 1e5), 1 + 4 * math.sqrt(2 / 1e5)], abs(mom["normal_var"] - 1) < 4 * math.sqrt(2 / 1e5))
    check("m02", "uniform in [0,1)", float(u.max()), 1.0, u.min() >= 0 and u.max() < 1)
    return {"tags": {"first_1000_u32": "SYNTHETIC", "moments": "DERIVED"}, "seed": SEED, "first_1000_u32": u32, "uniform_first": [r(v, 15) for v in us], "normal_first": [r(v, 12) for v in zs],
            "seed_vectors": sv, "tolerance": TOL(0.0, 0.0, "u32 integers must match exactly; uniforms are exact binary fractions; normals within 1e-12 relative (libm differences)"),
            "spec": {"generator": "xoshiro128**", "seeding": "splitmix32 x4", "full_text": "analytics/rng.py docstring and docs/METHODOLOGY.md", "uniform": "(floor(a/32)*67108864 + floor(b/64)) / 2^53 from two consecutive u32", "normal": "Box-Muller with one-value cache, u1 = 1 - uniform()"},
            "moments": mom}


# ------------------------------------------------------------------ 3 monte carlo
def m03():
    N = 20000
    x = mc.run(SEED, 100000)
    run = mc.summarize(x[:N])
    lo, hi = math.floor(min(x[:N]) / 10) * 10, math.ceil(max(x[:N]) / 10) * 10
    edges = [lo + (hi - lo) * i / 40 for i in range(41)]
    counts, _ = np.histogram(x[:N], bins=edges)
    conv = []
    for n in (100, 300, 1000, 3000, 10000, 30000, 100000):
        s = mc.summarize(x[:n]); conv.append({k: r(s[k], 8) if isinstance(s[k], float) else s[k] for k in ("n", "mean", "sd", "se", "ci95_lo", "ci95_hi", "p_loss")})
    big = mc.summarize(x)
    check("m03", "se shrinks ~ 1/sqrt(n): se(100000)/se(1000) vs 0.1", conv[-1]["se"] / conv[2]["se"], [0.08, 0.12], 0.08 < conv[-1]["se"] / conv[2]["se"] < 0.12)
    check("m03", "n=20000 mean within CI of n=100000 mean", run["mean"], [big["ci95_lo"], big["ci95_hi"]], abs(run["mean"] - big["mean"]) < 4 * run["se"])
    # CI coverage of the mean: replicate 300 runs of n=500 and test how often CI contains the n=100000 mean
    cover = 0
    for k in range(300):
        s = mc.summarize(mc.run(SEED + 1000 + k, 500))
        cover += s["ci95_lo"] <= big["mean"] <= s["ci95_hi"]
    check("m03", "empirical coverage of 95% CI of the mean (300 reps, n=500, truth ~ n=100000 mean)", cover / 300, [0.91, 0.99], 0.91 <= cover / 300 <= 0.99)
    vecs = []
    for seed, n in [(1, 500), (2, 2000), (3, 2000), (4, 5000), (SEED, 1000), (SEED + 7, 3000)]:
        xx = mc.run(seed, n); s = mc.summarize(xx)
        vecs.append({"seed": seed, "n": n, **{k: r(s[k], 10) for k in ("mean", "sd", "se", "ci95_lo", "ci95_hi", "p_loss", "p05", "p50", "p95")}, "first_5": rl(xx[:5])})
    decisions, paths = m03_decisions(N, big, x)
    return {"tags": {"environment": "SYNTHETIC", "run": "SYNTHETIC", "convergence": "SYNTHETIC", "vectors": "SYNTHETIC", "paths": "SYNTHETIC"}, "tolerance": TOL(1e-8, 1e-9),
            "spec": {"label": "SYNTHETIC seeded environment, not a forecast of any real project", "seed": SEED, "run_n": N, "convergence": "prefixes of one 100000-trial stream", "ci": "mean +- 1.959963984540054 se (normal approximation)", "ci_is": "confidence interval of the MEAN, not a range for a single outcome",
                     "percentile": "type 7 (linear interpolation)", "coverage_check": {"reps": 300, "n": 500, "coverage": cover / 300},
                     "paths": "recovered[t], t = 0..8 calendar years from today = PV(cash received through year t) / PV(investment); cash flow of project year s arrives at calendar year s + delay; recovered[0] = 0. payback_year = first t >= 1 with recovered[t] >= 1, linear within the year: (t-1) + (1 - rec[t-1])/(rec[t]-rec[t-1]); null if never within 8 years. Paths are the first 16 futures of the seed-20261011 stream, identical draws under every decision."},
            "environment": {**mc.ENV, "decisions": decisions}, "paths": paths, "run": {"seed": SEED, **{k: r(v, 8) if isinstance(v, float) else v for k, v in run.items()}, "mean_n100000": r(big["mean"], 8)},
            "histogram": {"edges": edges, "counts": counts.tolist(), "n": N}, "convergence": conv, "vectors": vecs}


def m03_decisions(N, big, x_build):
    names = {"build_now": "BUILD NOW", "phased": "PHASED", "delay_one_year": "DELAY ONE YEAR"}
    base = mc.run_detail(SEED, N, mc.PRESETS["build_now"])
    presets, pths = [], {}
    for pid, pre in mc.PRESETS.items():
        det = mc.run_detail(SEED, N, pre)
        npv = [d["npv"] for d in det]
        sm = mc.summarize(npv)
        pb = sorted(d["payback_year"] for d in det if d["payback_year"] is not None)
        diff = np.array([a["npv"] - b["npv"] for a, b in zip(det, base)])
        vecs = []
        for seed, n in [(1, 500), (2, 2000), (3, 2000), (4, 5000), (SEED, 1000), (SEED + 7, 3000)]:
            dd = mc.run_detail(seed, n, pre); ss = mc.summarize([d["npv"] for d in dd]); pp = sorted(d["payback_year"] for d in dd if d["payback_year"] is not None)
            vecs.append({"seed": seed, "n": n, **{k: r(ss[k], 10) for k in ("mean", "sd", "se", "ci95_lo", "ci95_hi", "p_loss", "p05", "p50", "p95")}, "first_5": rl([d["npv"] for d in dd[:5]]),
                         "payback_share_8y": r(len(pp) / n, 10), "median_payback_year": (r(mc.percentile(pp, 0.5), 10) if pp else None)})
        presets.append({"id": pid, "label": names[pid], "overrides": {k: v for k, v in pre.items() if k != "label"}, "run": {"seed": SEED, **{k: r(v, 8) if isinstance(v, float) else v for k, v in sm.items()}},
                        "payback_share_8y": r(len(pb) / N, 6), "median_payback_year": (r(mc.percentile(pb, 0.5), 6) if pb else None), "paid_back_n": len(pb),
                        "vs_build_now": {"mean_diff": r(float(diff.mean()), 6), "se_diff": r(float(diff.std(ddof=1) / math.sqrt(N)), 6), "share_better": r(float((diff > 0).mean()), 4)}, "vectors": vecs})
        pths[pid] = [{"index": i, "investment": r(d["investment"], 8), "npv": r(d["npv"], 8), "payback_year": (r(d["payback_year"], 8) if d["payback_year"] is not None else None), "recovered": rl(d["recovered"], 8)} for i, d in enumerate(det[:16])]
    # checks
    b = presets[0]
    check("m03", "BUILD NOW decision run equals the pre-existing m03.run (same stream)", [b["run"]["mean"], r(mc.summarize(x_build[:N])["mean"], 8)], "equal", b["run"]["mean"] == r(mc.summarize(x_build[:N])["mean"], 8))
    g = random_draws_equal()
    check("m03", "common random numbers: future i has identical draws under every decision (by construction, draws precede the transform)", g, True, g)
    ok = True
    rng = Xoshiro128ss(SEED)
    for i in range(200):
        dr = mc.draw_inputs(rng); rdisc = 0.07 + 0.05 * dr[4]
        ok &= abs(mc.evaluate(dr, mc.PRESETS["delay_one_year"])["npv"] - mc.evaluate(dr, mc.PRESETS["build_now"])["npv"] / (1 + rdisc)) < 1e-9
    check("m03", "DELAY ONE YEAR npv = BUILD NOW npv / (1 + r) per future (200 futures)", ok, True, ok)
    check("m03", "recovered[] monotone nondecreasing and recovered[0]=0 for all 16 x 3 published paths", True, True, all(p["recovered"][0] == 0 and all(p["recovered"][i + 1] >= p["recovered"][i] - 1e-12 for i in range(8)) for v in pths.values() for p in v))
    check("m03", "payback_year null iff recovered[8] < 1 (published paths)", True, True, all((p["payback_year"] is None) == (p["recovered"][8] < 1) for v in pths.values() for p in v))
    crn = ("Common random numbers: every future draws its five inputs in the fixed order [z_investment (normal), z_revenue (normal), u_growth (uniform), z_margin (normal), u_discount (uniform)] from one xoshiro128** stream, "
           "whatever the decision. The decision only transforms the draws afterwards (investment median, revenue multiplier, delay). Future i is therefore the same simulated world under every decision.")
    paths = {"seed": SEED, "n_futures": 16, "horizon_years": 8, "draw_order": ["z_investment", "z_revenue", "u_growth", "z_margin", "u_discount"],
             "draws": [rl(list(d), 12) for d in _first_draws(16)], "decisions": pths}
    return {"presets": presets, "crn_rule": crn, "lab_ranges": {"investment_median": [50.0, 150.0], "revenue_multiplier": [0.5, 1.2], "delay_years": [0, 2], "note": "ranges the LAB may expose; delay_years is an integer; checked only at the three presets"}}, paths


def _first_draws(k):
    g = Xoshiro128ss(SEED)
    return [mc.draw_inputs(g) for _ in range(k)]


def random_draws_equal():
    a, b = Xoshiro128ss(SEED), Xoshiro128ss(SEED)
    return all(mc.draw_inputs(a) == mc.draw_inputs(b) for _ in range(100))


# ------------------------------------------------------------------ 4 bayes
def m04():
    bb = [bayes.beta_binomial(*c) for c in [(1, 1, 0, 0), (1, 1, 3, 10), (1, 1, 7, 20), (1, 1, 30, 100), (0.5, 0.5, 2, 5), (2, 8, 4, 12), (20, 20, 15, 20), (1, 1, 0, 10), (1, 1, 10, 10), (5, 5, 120, 400)]]
    nn = [bayes.normal_normal(*c) for c in [(0, 1, 2, 5, 1.2), (0, 10, 2, 5, 1.2), (100, 15, 20, 25, 112), (100, 5, 20, 25, 112), (50, 10, 8, 4, 41), (0, 1, 1, 100, 0.3), (10, 2, 3, 1, 14), (-3, 4, 2.5, 50, -1.1)]]
    for lst in (bb, nn):
        for c in lst:
            for k, v in list(c.items()):
                if isinstance(v, float): c[k] = r(v)
                elif isinstance(v, list): c[k] = [r(t) if isinstance(t, float) else t for t in v]
    seq = bayes.sequential(SEED, 0.3, 200)
    # exact coverage at fixed p (n = 20)
    from scipy.stats import binom
    n = 20
    cr = [bayes.beta_binomial(1, 1, k, n) for k in range(n + 1)]
    pg = [0.05, 0.1, 0.2, 0.3, 0.5]
    cov = {"n": n, "p": pg, "credible_uniform_prior": [], "wilson_confidence": []}
    for p in pg:
        cov["credible_uniform_prior"].append(r(sum(binom.pmf(k, n, p) for k in range(n + 1) if cr[k]["credible95"][0] <= p <= cr[k]["credible95"][1]), 6))
        cov["wilson_confidence"].append(r(sum(binom.pmf(k, n, p) for k in range(n + 1) if cr[k]["confidence95_wilson"][0] <= p <= cr[k]["confidence95_wilson"][1]), 6))
    cr2 = [bayes.beta_binomial(2, 8, k, n) for k in range(n + 1)]
    cov["credible_beta_2_8_prior"] = [r(sum(binom.pmf(k, n, p) for k in range(n + 1) if cr2[k]["credible95"][0] <= p <= cr2[k]["credible95"][1]), 6) for p in pg]
    grid = [(i + 0.5) / 400 for i in range(400)]
    avg = float(np.mean([sum(binom.pmf(k, n, p) for k in range(n + 1) if cr[k]["credible95"][0] <= p <= cr[k]["credible95"][1]) for p in grid]))
    cov["credible_average_over_uniform_prior"] = r(avg, 6)
    check("m04", "credible interval average coverage over its own prior (n=20)", avg, [0.94, 0.96], 0.94 <= avg <= 0.96)
    check("m04", "credible interval coverage at fixed p=0.05 differs from 0.95 (not a confidence guarantee)", cov["credible_uniform_prior"][0], "informational", True)
    # posterior sanity
    c = bb[1]
    check("m04", "beta-binomial posterior mean = (a0+k)/(a0+b0+n) (Beta(1,1), 3/10)", c["post_mean"], 4 / 12, abs(c["post_mean"] - 4 / 12) < 1e-9)
    check("m04", "sequential flat-prior mean at n=200 near k/n", seq["path"][-1]["mean"], seq["path"][-1]["k"] / 200, abs(seq["path"][-1]["mean"] - (seq["path"][-1]["k"] + 1) / 202) < 1e-9)
    return {"tags": {"beta_binomial": "SYNTHETIC", "normal_normal": "SYNTHETIC", "sequential": "SYNTHETIC", "coverage": "DERIVED"}, "tolerance": TOL(1e-8, 1e-8),
            "spec": {"labels": {"credible95": "Bayesian credible interval: P(parameter in interval | data, prior) = 0.95", "confidence95_*": "frequentist confidence interval: the procedure covers the true value in 95% of repeated samples"},
                     "formulas": "analytics/bayes.py docstring", "sequential": "flip = uniform() < p_true with xoshiro seed, Beta(1,1) prior, rows at n=1..10 and every 5th"},
            "beta_binomial": bb, "normal_normal": nn, "sequential": {**seq, "flips": seq["flips"]}, "coverage": cov}


# ------------------------------------------------------------------ 5 forecast
def m05():
    MU, PHI, SIG = 100.0, 0.7, 5.0
    x = forecast.gen_series(SEED, 120, MU, PHI, SIG)
    tr = x[:108]
    sf, af = forecast.ses_fit(tr), forecast.ar1_fit(tr)
    # study
    rng = np.random.default_rng(SEED)
    R, H, n = 2000, 12, 120
    hit = {m: {L: np.zeros(H) for L in (0.8, 0.95)} for m in ("ses", "ar1")}
    for _ in range(R):
        e = rng.standard_normal(n + H)
        s = np.empty(n + H); s[0] = MU + SIG / math.sqrt(1 - PHI**2) * e[0]
        for t in range(1, n + H): s[t] = MU + PHI * (s[t - 1] - MU) + SIG * e[t]
        sfit = forecast.ses_fit_np(s[:n]); afit = forecast.ar1_fit(list(s[:n]))
        for h in range(1, H + 1):
            for L in (0.8, 0.95):
                for m, fn, ft in (("ses", forecast.ses_forecast, sfit), ("ar1", forecast.ar1_forecast, afit)):
                    f, lo, hi = fn(ft, h, L)
                    hit[m][L][h - 1] += lo <= s[n - 1 + h] <= hi
    cov = {m: {str(L): rl(v / R, 4) for L, v in d.items()} for m, d in hit.items()}
    # tests of the fast fit
    sf2 = forecast.ses_fit_np(np.array(tr))
    check("m05", "vectorized SES fit equals plain SES fit (alpha)", sf2["alpha"], sf["alpha"], sf2["alpha"] == sf["alpha"] and abs(sf2["sse"] - sf["sse"]) < 1e-8)
    ar_h1 = cov["ar1"]["0.95"][0]
    check("m05", "AR(1) 1-step 95% empirical coverage near nominal (2000 reps, se 0.005)", ar_h1, [0.93, 0.97], 0.93 <= ar_h1 <= 0.97)
    check("m05", "SES 12-step 95% coverage is reported honestly (misspecified for AR(1))", cov["ses"]["0.95"][-1], "informational", True)
    def pack(fit, fn):
        return {str(L): [[r(v, 8) for v in fn(fit, h, L)] for h in range(1, 13)] for L in (0.8, 0.95)}
    vecs = []
    for seed, nn, mu, phi, sig in [(11, 60, 50.0, 0.5, 2.0), (SEED, 120, MU, PHI, SIG), (23, 200, 10.0, 0.9, 1.0)]:
        xs = forecast.gen_series(seed, nn, mu, phi, sig); a, b = forecast.ses_fit(xs), forecast.ar1_fit(xs)
        vecs.append({"seed": seed, "n": nn, "mu": mu, "phi": phi, "sigma": sig, "x_last_3": rl(xs[-3:]), "ses": {k: r(a[k], 8) for k in ("alpha", "sse", "level", "sigma2")},
                     "ar1": {k: r(b[k], 8) for k in ("phi", "c", "mu", "sigma2")}, "forecast_ses": pack(a, forecast.ses_forecast), "forecast_ar1": pack(b, forecast.ar1_forecast)})
    return {"tags": {"series": "SYNTHETIC", "fits": "PREDICTED", "intervals": "PREDICTED", "coverage": "SIMULATED", "vectors": "SYNTHETIC"}, "tolerance": TOL(1e-7, 1e-8),
            "spec": {"labels": {"prediction": "A prediction interval is the range in which one single future observation is expected to fall with the stated probability, if the model is right; it is wider than a confidence interval for a mean and is not a credible interval."}, "truth": {"mu": MU, "phi": PHI, "sigma": SIG}, "models": "analytics/forecast.py docstring", "coverage_study": f"{R} replicate series (numpy PCG64, seed {SEED}), n=120 train, horizons 1..12; precomputed, NOT reproduced by the browser",
                     "reading": "SES ignores mean reversion so its long-horizon bands are mis-sized; the study reports that rather than hiding it"},
            "series": {"seed": SEED, "mu": MU, "phi": PHI, "sigma": SIG, "x": rl(x, 6), "n_train": 108}, "fits": {"ses": sf, "ar1": af},
            "intervals": {"kind": "prediction", "ses": pack(sf, forecast.ses_forecast), "ar1": pack(af, forecast.ar1_forecast), "holdout": rl(x[108:], 6)},
            "coverage": {"reps": R, "horizons": list(range(1, 13)), "nominal": [0.8, 0.95], **cov}, "vectors": vecs}


# ------------------------------------------------------------------ 6 credit
def m06(df):
    y = df["y_bad"].to_numpy()
    parts = credit.split(len(df), SEED, y)
    fit = credit.fit_calibrated(df, parts)
    ptest, ytest = fit["cal"](parts["test"]), y[parts["test"]]
    praw = fit["raw"](parts["test"])
    curve = []
    for t in credit.THRESHOLDS:
        c = credit.cost_at(ptest, ytest, t); curve.append({"t": t, **c, "cost": r(c["cost"], 6)})
    t_opt, c_opt = credit.argmin_threshold(ptest, ytest)
    c05, c16 = credit.cost_at(ptest, ytest, 0.5)["cost"], credit.cost_at(ptest, ytest, 1 / 6)["cost"]
    rs = np.random.RandomState(SEED); diffs = []
    for _ in range(1000):
        ix = rs.randint(0, len(ytest), len(ytest))
        diffs.append(credit.cost_at(ptest[ix], ytest[ix], 0.5)["cost"] - credit.cost_at(ptest[ix], ytest[ix], 1 / 6)["cost"])
    rep = []
    for k in range(30):
        pk = credit.split(len(df), SEED + 100 + k, y); fk = credit.fit_calibrated(df, pk)
        pt, yt = fk["cal"](pk["test"]), y[pk["test"]]
        to, co = credit.argmin_threshold(pt, yt)
        rep.append({"seed": SEED + 100 + k, "t_opt": to, "cost_opt": r(co, 6), "cost_05": r(credit.cost_at(pt, yt, 0.5)["cost"], 6), "cost_1_6": r(credit.cost_at(pt, yt, 1 / 6)["cost"], 6)})
    ro = np.array([q["t_opt"] for q in rep])
    # reliability: 5 equal-count bins
    order = np.argsort(ptest); bins = []
    for chunk in np.array_split(order, 5):
        bins.append({"n": len(chunk), "mean_pred": r(float(ptest[chunk].mean()), 6), "obs_rate": r(float(ytest[chunk].mean()), 6)})
    mraw, mcal = credit.metrics(praw, ytest), credit.metrics(ptest, ytest)
    check("m06", "dataset rows / bad rate", [len(df), float(y.mean())], [1000, 0.3], len(df) == 1000 and abs(y.mean() - 0.3) < 1e-9)
    check("m06", "split sizes 600/150/250", [len(parts[k]) for k in ("train", "cal", "test")], [600, 150, 250], [len(parts[k]) for k in ("train", "cal", "test")] == [600, 150, 250])
    check("m06", "test AUC above 0.7", mcal["auc"], 0.7, mcal["auc"] > 0.7)
    check("m06", "Platt scaling does not worsen test log loss by more than 0.01", [mraw["log_loss"], mcal["log_loss"]], 0.01, mcal["log_loss"] <= mraw["log_loss"] + 0.01)
    check("m06", "expected cost at cost-optimal grid threshold <= cost at 0.5 (test)", [c_opt, c05], "<=", c_opt <= c05 + 1e-12)
    check("m06", "mean predicted prob near base rate on test (calibration in the large)", [float(ptest.mean()), float(ytest.mean())], 0.05, abs(ptest.mean() - ytest.mean()) < 0.05)
    vec = []
    for cfn, cfp, t in [(5, 1, 0.5), (5, 1, 1 / 6), (5, 1, 0.3), (1, 1, 0.5), (2, 1, 0.4), (10, 1, 0.1), (5, 1, 0.0), (5, 1, 1.0)]:
        c = credit.cost_at(ptest, ytest, t, cfn, cfp); vec.append({"kind": "cost", "c_fn": cfn, "c_fp": cfp, "t": r(t, 12), **c, "cost": r(c["cost"], 10)})
    for cfn, cfp in [(1, 1), (2, 1), (5, 1), (10, 1), (20, 1)]:
        to, co = credit.argmin_threshold(ptest, ytest, cfn, cfp); vec.append({"kind": "argmin", "c_fn": cfn, "c_fp": cfp, "t_opt_grid": to, "cost": r(co, 10), "t_theory": r(cfp / (cfp + cfn), 10)})
    raw_m = fit["model"]
    return {"tags": {"dataset": "OBSERVED", "model": "PREDICTED", "test": "PREDICTED/OBSERVED", "curve": "DERIVED", "optimum": "DERIVED", "repeated_splits": "DERIVED", "vectors": "DERIVED"}, "tolerance": TOL(1e-9, 1e-9, "confusion counts exact; costs 1e-9"),
            "spec": {"cost_matrix": {"bad_accepted": 5, "good_rejected": 1, "source": "UCI Statlog German Credit, published"}, "rule": "reject when p_bad > t", "theory": "calibrated optimum t* = c_fp/(c_fp+c_fn) = 1/6",
                     "scope": "Browser recomputes the curve and optimum from the published test probabilities; it does NOT refit the model. Model fitting is a precomputed Python step (sklearn logistic regression C=0.1 + Platt scaling).",
                     "excluded_features": ["personal_status (encodes sex)", "foreign_worker"]},
            "dataset": {"name": "Statlog German Credit", "rows": len(df), "bad_rate": r(float(y.mean()), 4), "split": {k: len(v) for k, v in parts.items()}, "split_seed": SEED, "doi": "10.24432/C5NC77", "licence": "CC BY 4.0"},
            "model": {"type": "logistic regression (L2, C=0.1) on 7 standardized numerics + one-hot categoricals, then Platt scaling on the calibration split", "n_features": int(fit["info"]["names"].__len__()), "platt": {"a": r(fit["platt_a"], 8), "b": r(fit["platt_b"], 8)},
                      "metrics_test_raw": {k: r(v, 6) for k, v in mraw.items()}, "metrics_test_calibrated": {k: r(v, 6) for k, v in mcal.items()}},
            "test": {"p_bad": rl(ptest, 8), "y_bad": ytest.tolist()}, "curve": {"thresholds": credit.THRESHOLDS, "points": curve},
            "optimum": {"t_opt_grid": t_opt, "cost_opt": r(c_opt, 6), "cost_at_0_5": r(c05, 6), "t_theory": r(1 / 6, 10), "cost_at_theory": r(c16, 6), "saving_vs_0_5": r(c05 - c_opt, 6),
                        "bootstrap_cost_0_5_minus_1_6": {"n": 1000, "mean": r(float(np.mean(diffs)), 6), "ci95": [r(float(np.percentile(diffs, 2.5)), 6), r(float(np.percentile(diffs, 97.5)), 6)], "share_1_6_better": r(float(np.mean(np.array(diffs) > 0)), 4)}},
            "repeated_splits": {"n": 30, "t_opt_median": float(np.median(ro)), "t_opt_iqr": [float(np.percentile(ro, 25)), float(np.percentile(ro, 75))], "t_opt_min_max": [float(ro.min()), float(ro.max())],
                                "mean_cost_05": r(float(np.mean([q["cost_05"] for q in rep])), 6), "mean_cost_1_6": r(float(np.mean([q["cost_1_6"] for q in rep])), 6), "mean_cost_opt": r(float(np.mean([q["cost_opt"] for q in rep])), 6), "runs": rep},
            "reliability": {"bins": bins}, "vectors": vec}, parts, ptest, ytest


# ------------------------------------------------------------------ 7 pareto
def m07():
    P = lp.PROBLEM
    fr = lp.front(P, 20)
    pts = fr["points"]
    from scipy.optimize import linprog
    worst = 0.0
    for p in pts[::5]:
        A, b = lp.with_rows(P, [P["emissions"]], [p["eps"]])
        res = linprog([-v for v in P["profit"]], A_ub=A, b_ub=b, bounds=[(0, u) for u in P["upper"]], method="highs")
        worst = max(worst, abs(-res.fun - p["profit"]))
    check("m07", "HiGHS (highspy) vs scipy linprog profit, 5 front points", worst, 1e-6, worst < 1e-6)
    mono = all(pts[i + 1]["profit"] >= pts[i]["profit"] - 1e-7 for i in range(len(pts) - 1))
    check("m07", "front profit nondecreasing in epsilon", mono, True, mono)
    strict = all(pts[i + 1]["profit"] > pts[i]["profit"] + 1e-6 for i in range(len(pts) - 1))
    check("m07", "front strictly increasing (no dominated epsilon points)", strict, True, strict)
    check("m07", "anchor profit at eps_max equals max-profit anchor", [pts[-1]["profit"], fr["anchor_max_profit"]["profit"]], 1e-5, abs(pts[-1]["profit"] - fr["anchor_max_profit"]["profit"]) < 1e-5)
    # compromise: closest to utopia in normalized units
    pmax, pmin = pts[-1]["profit"], pts[0]["profit"]; emin, emax = pts[0]["emissions"], pts[-1]["emissions"]
    dist = [math.hypot((pmax - p["profit"]) / (pmax - pmin), (p["emissions"] - emin) / (emax - emin)) for p in pts]
    kn = int(np.argmin(dist))
    import hashlib
    sha = lambda t: hashlib.sha256(t.encode()).hexdigest()
    worst_txt = 0.0
    for q in pts:
        q["eps"] = r(q["eps"], 8)
        t = lp.lp_text(P, P["b"][0], q["eps"]); st, ob = lp.solve_text(t)
        q["status"] = "Optimal" if st == "Optimal" else st; q["lp_text_sha256"] = sha(t); worst_txt = max(worst_txt, abs(ob - q["profit"]))
    check("m07", "every front point: HiGHS status of re-solving the published LP text is Optimal", [q["status"] for q in pts].count("Optimal"), len(pts), all(q["status"] == "Optimal" for q in pts))
    check("m07", "LP-text solve objective equals front profit (rounded eps), max abs diff", worst_txt, 1e-5, worst_txt < 1e-5)
    rp = lambda p: {"eps": r(p["eps"], 8), "profit": r(p["profit"], 8), "emissions": r(p["emissions"], 8), "x": rl([max(0.0, v) for v in p["x"]], 8), "status": p["status"], "lp_text_sha256": p["lp_text_sha256"]}
    vecs = []
    for labor in (160.0, 190.0, 220.0, 250.0):
        f = lp.front(P, 4, labor)
        shas = []
        for q in f["points"]:
            t = lp.lp_text(P, labor, r(q["eps"], 8)); st, ob = lp.solve_text(t); shas.append(sha(t))
            check("m07", f"labor {labor:g}: LP-text solve optimal and objective matches", [st, ob], q["profit"], st == "Optimal" and abs(ob - q["profit"]) < 1e-5)
        vecs.append({"labor_hours": labor, "e_lo": r(f["anchor_min_emissions"]["emissions"], 8), "e_hi": r(f["anchor_max_profit"]["emissions"], 8), "profit_at_e_lo": r(f["anchor_min_emissions"]["profit"], 8), "profit_at_e_hi": r(f["anchor_max_profit"]["profit"], 8),
                     "eps_profit": [[r(p["eps"], 8), r(p["profit"], 8)] for p in f["points"]], "eps_sha256": shas})
    return {"tags": {"problem": "SYNTHETIC", "anchors": "DERIVED", "front": "DERIVED", "vectors": "DERIVED"}, "tolerance": TOL(1e-6, 1e-7, "objective values only; the optimal x may be non-unique at kinks"),
            "spec": {"method": "epsilon-constraint on a continuous LP; solver HiGHS (highspy here, highs-js in the browser)", "docstring": "analytics/lp.py", "grid": "21 epsilons (K=20) between the two lexicographic anchors", "compromise": "front point closest to the utopia corner in range-normalized units; one choice among many, not 'the' answer",
                     "cross_check": {"scipy_linprog_max_abs_profit_diff": worst}},
            "problem": {**P, "objectives": {"profit": "maximize", "emissions": "minimize"}, "constraint_note": "rows: A x <= b; plus sum(x) >= q_min; 0 <= x <= upper"},
            "anchors": {"max_profit": {k: (r(v, 8) if isinstance(v, float) else rl([max(0.0, t) for t in v], 8)) for k, v in fr["anchor_max_profit"].items()}, "min_emissions": {k: (r(v, 8) if isinstance(v, float) else rl([max(0.0, t) for t in v], 8)) for k, v in fr["anchor_min_emissions"].items()}},
            "front": [rp(p) for p in pts], "lp_text": {"format": "CPLEX LP; numbers %.10g (JS Number(v.toPrecision(10)).toString()); LF line ends; trailing LF; SHA-256 over UTF-8", "builder": lp.lp_text.__doc__, "example_point": 10, "example": lp.lp_text(P, P["b"][0], pts[10]["eps"]), "example_sha256": pts[10]["lp_text_sha256"]}, "compromise_index": kn, "vectors": vecs}


# ------------------------------------------------------------------ 8 sensitivity
def m08():
    an, qd = sens.analytic(), sens.quadrature(64)
    err = max(abs(an["S"][i] - qd["S"][i]) for i in range(3)); errt = max(abs(an["ST"][i] - qd["ST"][i]) for i in range(3)); errv = abs(an["V"] - qd["V"])
    check("m08", "closed-form first-order indices vs 3-D Gauss-Legendre quadrature (64^3)", err, 1e-10, err < 1e-10)
    check("m08", "closed-form total indices vs quadrature", errt, 1e-10, errt < 1e-10)
    check("m08", "closed-form variance vs quadrature", errv, 1e-8, errv < 1e-8)
    check("m08", "S3 = 0 but ST3 > 0 (pure interaction x1-x3)", [an["S"][2], an["ST"][2]], "S3=0, ST3>0", an["S"][2] == 0 and an["ST"][2] > 0.2)
    sob = []
    for N in (256, 1024, 4096, 16384):
        runs = [sens.saltelli(SEED + k, N) for k in range(10)]
        S = np.array([q["S"] for q in runs]); ST = np.array([q["ST"] for q in runs])
        sob.append({"N": N, "evaluations": N * 5, "replicates": 10, "S_mean": rl(S.mean(0), 6), "S_sd": rl(S.std(0, ddof=1), 6), "ST_mean": rl(ST.mean(0), 6), "ST_sd": rl(ST.std(0, ddof=1), 6),
                    "max_abs_err_S": r(float(np.abs(S - np.array(an["S"])).max(0).max()), 6), "mean_abs_err_ST": r(float(np.abs(ST - np.array(an["ST"])).mean()), 6), "first": {k: (rl(v, 10) if isinstance(v, list) else r(v, 10)) for k, v in runs[0].items() if k in ("S", "ST", "V")}})
    final = sob[-1]
    check("m08", "N=16384 mean first-order estimates within 0.02 of analytic", final["S_mean"], an["S"], all(abs(a - b) < 0.02 for a, b in zip(final["S_mean"], an["S"])))
    check("m08", "N=16384 mean total-order estimates within 0.02 of analytic", final["ST_mean"], an["ST"], all(abs(a - b) < 0.02 for a, b in zip(final["ST_mean"], an["ST"])))
    try:
        from SALib.analyze import sobol as sa
        from SALib.sample import sobol as ss
        pr = {"num_vars": 3, "names": ["x1", "x2", "x3"], "bounds": [[-math.pi, math.pi]] * 3}
        X = ss.sample(pr, 4096, calc_second_order=False, seed=1)
        Y = np.sin(X[:, 0]) + 7 * np.sin(X[:, 1]) ** 2 + 0.1 * X[:, 2] ** 4 * np.sin(X[:, 0])
        res = sa.analyze(pr, Y, calc_second_order=False, print_to_console=False)
        sal = {"S1": rl(res["S1"], 4), "ST": rl(res["ST"], 4)}
        check("m08", "SALib (cross-check only) within 0.03 of analytic", sal, an["S"], all(abs(a - b) < 0.03 for a, b in zip(res["S1"], an["S"])) and all(abs(a - b) < 0.03 for a, b in zip(res["ST"], an["ST"])))
    except Exception as e:  # recorded, not hidden
        sal = {"error": str(e)}; FAILURES.append(f"m08: SALib cross-check unavailable: {e}")
    bases = [[0.0, 0.0, 0.0], [math.pi / 2, 0.5, 2.0], [1.0, 1.0, 1.0]]
    oat = [sens.oat(b) for b in bases]
    for o in oat:
        o["f_base"] = r(o["f_base"]); o["grid"] = rl(o["grid"]); [s.update(y=rl(s["y"], 8), range=r(s["range"], 8)) for s in o["sweeps"]]
    check("m08", "OAT at x=(0,0,0) reports zero x3 effect although ST3 > 0", oat[0]["sweeps"][2]["range"], 0.0, abs(oat[0]["sweeps"][2]["range"]) < 1e-9)
    pts = [[0, 0, 0], [1, 2, 3], [-1, 0.5, 2], [math.pi, math.pi, math.pi], [-math.pi, 1, -2], [0.3, -1.2, 2.7], [2.2, 2.2, 0.1], [-0.5, -0.5, -0.5]]
    return {"tags": {"analytic": "DERIVED", "quadrature_check": "DERIVED", "sobol": "SIMULATED", "oat": "DERIVED", "vectors": "DERIVED"}, "tolerance": TOL(1e-9, 1e-9, "function values and seeded Sobol estimates (same PRNG, same order of operations; allow 1e-9 relative for summation order)"),
            "spec": {"function": "Ishigami f = sin x1 + A sin^2 x2 + B x3^4 sin x1, A=7, B=0.1, x ~ U[-pi,pi]^3 (Crestaux 2007 / Marrel 2009 convention)", "estimators": "Saltelli 2010 first order, Jansen total; see analytics/sens.py", "citations": ["Ishigami and Homma 1990", "Saltelli et al. 2008", "Surjanovic and Bingham, Virtual Library of Simulation Experiments"],
                     "salib_crosscheck": sal, "note": "Indices are recomputed in tests from first principles (quadrature), not copied from papers."},
            "analytic": {k: (rl(v, 12) if isinstance(v, list) else r(v, 12)) for k, v in an.items()}, "quadrature_check": {"points_per_axis": 64, "max_abs_err_S": err, "max_abs_err_ST": errt, "abs_err_V": errv},
            "sobol": sob, "oat": {"baselines": oat, "reading": "OAT at the origin sees no x3 effect (sin x1 = 0 there); Sobol total index ST3 = %.4f reveals it" % an["ST"][2]},
            "vectors": [{"kind": "function", "points": pts, "f": rl([sens.ishigami(*p) for p in pts], 12)}, {"kind": "saltelli", **{k: (rl(v, 10) if isinstance(v, list) else r(v, 10) if isinstance(v, float) else v) for k, v in sens.saltelli(2024, 1024).items()}},
                        {"kind": "saltelli", **{k: (rl(v, 10) if isinstance(v, list) else r(v, 10) if isinstance(v, float) else v) for k, v in sens.saltelli(SEED, 4096).items()}}]}


# ------------------------------------------------------------------ 9 counterfactual
DISPLAY = {"source": "UCI Statlog German Credit documentation (german.doc), plain-language wording", "features": {
    "duration": "loan duration (months)", "amount": "credit amount (DM)", "log_amount": "credit amount (DM, log scale)", "installment_rate": "installment rate (% of disposable income)", "age": "age (years)",
    "existing_credits": "existing credits at this bank", "checking": "checking account", "savings": "savings account or bonds", "credit_history": "credit history", "employment": "present employment", "housing": "housing"},
    "categories": {
        "checking": {"A11": "under 0 DM", "A12": "0 to under 200 DM", "A13": "200 DM or more (or salary assignment for a year or more)", "A14": "no checking account"},
        "savings": {"A61": "under 100 DM", "A62": "100 to under 500 DM", "A63": "500 to under 1000 DM", "A64": "1000 DM or more", "A65": "unknown or no savings account"},
        "credit_history": {"A30": "no credits taken or all paid back duly", "A31": "all credits at this bank paid back duly", "A32": "existing credits paid back duly so far", "A33": "delay in paying off in the past", "A34": "critical account or credits elsewhere"},
        "employment": {"A71": "unemployed", "A72": "under 1 year", "A73": "1 to under 4 years", "A74": "4 to under 7 years", "A75": "7 years or more"},
        "housing": {"A151": "rent", "A152": "own", "A153": "for free"}}}


def m09(df, parts):
    y = df["y_bad"].to_numpy()
    mdl = credit.fit_interpretable(df, parts["train"])
    ptest = mdl["model"].predict_proba(mdl["X"](df.loc[parts["test"]]))[:, 1]
    from sklearn.metrics import roc_auc_score
    auc = float(roc_auc_score(y[parts["test"]], ptest))
    check("m09", "interpretable model test AUC above 0.68", auc, 0.68, auc > 0.68)
    dev = max(abs(credit.p_bad9(mdl, df.iloc[i].to_dict()) - mdl["model"].predict_proba(mdl["X"](df.iloc[[i]]))[0, 1]) for i in range(0, 1000, 37))
    check("m09", "hand-written scorer equals sklearn predict_proba", dev, 1e-12, dev < 1e-12)
    keep = ["duration", "amount", "installment_rate", "age", "existing_credits", "checking", "savings", "credit_history", "employment", "housing"]
    apps, res = [], []
    for i in [int(j) for j in parts["test"] if credit.p_bad9(mdl, df.iloc[int(j)].to_dict()) > 0.5][:8]:
        row = {k: (df.iloc[i][k].item() if hasattr(df.iloc[i][k], "item") else df.iloc[i][k]) for k in keep}
        apps.append({"row_1based": i + 1, **row, "y_bad_observed": int(y[i])})
        out = [counterfactual.search(mdl, row, t) for t in (0.5, 1 / 6)]
        for o in out:
            for k in ("base_p_bad", "cost", "p_bad_after"):
                if k in o: o[k] = r(o[k], 10)
            o["target"] = r(o["target"], 10)
        res.append({"row_1based": i + 1, "targets": out})
    check("m09", "every counterfactual returned satisfies the target", [all(t["p_bad_after"] <= t["target"] + 1e-9 for q in res for t in q["targets"] if t["found"])], True, all(t["p_bad_after"] <= t["target"] + 1e-9 for q in res for t in q["targets"] if t["found"]))
    check("m09", "8 applicants evaluated", len(apps), 8, len(apps) == 8)
    foundshare = float(np.mean([t["found"] for q in res for t in q["targets"]]))
    mdl_pub = {"names": mdl["names"], "coef": rl(mdl["coef"], 12), "intercept": r(mdl["intercept"], 12), "num_features": credit.NUM9, "num_mean": rl(mdl["mean"], 12), "num_sd": rl(mdl["sd"], 12), "categories": credit.CAT9, "test_auc": r(auc, 4), "note": "log_amount = ln(amount); p_bad = sigmoid(intercept + sum coef*feature)"}
    return {"tags": {"model": "PREDICTED", "applicants": "OBSERVED", "results": "PREDICTED"}, "tolerance": TOL(1e-9, 1e-9, "p_bad values; changes must match exactly"),
            "spec": {"statement": "MODEL counterfactuals: the smallest input change that flips this fitted model's output. NOT causal; changing a feature in the real world need not change the outcome.", "search": "exhaustive grid, analytics/counterfactual.py docstring",
                     "targets": "0.5 (default decision) and 1/6 (cost-optimal threshold from module 6)", "share_found": r(foundshare, 3)},
            "model": mdl_pub, "features": {"display": DISPLAY, "actionable": ["duration", "amount", "installment_rate", "checking", "savings"], "immutable": ["age", "credit_history", "employment", "housing", "existing_credits"],
                                           "candidates": {"duration": sorted(set(counterfactual.DURATIONS)), "amount_multiplier": counterfactual.MULTS, "installment_rate": counterfactual.INSTALL, "checking": credit.CAT9["checking"], "savings": credit.CAT9["savings"]}},
            "applicants": apps, "results": res}


# ------------------------------------------------------------------ 10 causal
COV = ["age", "education", "black", "hispanic", "married", "nodegree", "re74", "re75"]


def design(d):
    X = d[COV].to_numpy(float)
    return np.column_stack([X, d["age"].to_numpy(float) ** 2, (d["re74"] == 0).to_numpy(float), (d["re75"] == 0).to_numpy(float)])


ESTIMATOR_INFO = {
    "naive": {"name": "Naive difference in means", "short": "treated mean minus comparison mean, no adjustment", "assumptions": [0, 2], "note": "Unbiased only if treatment is as good as random with no covariates (true in the NSW experiment, not for PSID); index 0 is then read without conditioning."},
    "ols_coef": {"name": "OLS with covariates", "short": "coefficient on treatment in a linear model of 1978 earnings on covariates", "assumptions": [0, 2, 3], "note": "Also assumes one constant effect for everyone and linear covariate effects; extrapolates silently where groups do not overlap."},
    "ra_att": {"name": "Regression adjustment", "short": "predict treated units' earnings without training from a model fitted on comparison units", "assumptions": [0, 1, 2, 3], "note": "Relies on the comparison-group model being right for the treated covariates; leans on extrapolation when overlap is weak."},
    "ipw_att": {"name": "Inverse-probability weighting", "short": "reweight comparison units by the odds of looking like a treated unit (propensity score)", "assumptions": [0, 1, 2, 3], "note": "Correct only if the propensity model is right; with weak overlap a handful of comparison units carry most of the weight (see effective controls)."}}


def m10():
    nsw = pd.read_stata(RAW / "nsw_dw.dta"); psid = pd.read_stata(RAW / "psid_controls.dta")
    nsw = nsw.astype({c: float for c in nsw.columns if c != "data_id"}); psid = psid.astype({c: float for c in psid.columns if c != "data_id"})
    exp_y, exp_t = nsw["re78"].to_numpy(), nsw["treat"].to_numpy()
    obs = pd.concat([nsw[nsw.treat == 1], psid[psid.treat == 0]], ignore_index=True)
    tm = exp_t == 1
    bench = float(exp_y[tm].mean() - exp_y[~tm].mean())
    se = math.sqrt(exp_y[tm].var(ddof=1) / tm.sum() + exp_y[~tm].var(ddof=1) / (~tm).sum())
    def est(d, iters):
        X = design(d)
        e = estimators(d["re78"].to_numpy(), d["treat"].to_numpy(), X, iters)
        return e, X
    ee, Xe = est(nsw, 50)
    eo, Xo = est(obs, 50)
    rng = np.random.default_rng(SEED)
    def boot(d, iters, B=500):
        out = []
        for _ in range(B):
            s = d.iloc[rng.integers(0, len(d), len(d))]
            if s["treat"].nunique() < 2: continue
            e, _ = est(s, iters); out.append([e["naive"], e["ols_coef"], e["ra_att"], e["ipw_att"]])
        return np.array(out)
    be, bo = boot(nsw, 50), boot(obs, 50)
    names = ["naive", "ols_coef", "ra_att", "ipw_att"]
    def pack(e, b):
        return {n: {"estimate": r(e[n], 2), "ci95": [r(float(np.percentile(b[:, i], 2.5)), 2), r(float(np.percentile(b[:, i], 97.5)), 2)], "gap_vs_benchmark": r(e[n] - bench, 2)} for i, n in enumerate(names)}
    ps_beta_ok = np.isfinite(eo["ps_beta"]).all()
    check("m10", "NSW experimental difference in means (published DW value 1794.34)", bench, [1794.0, 1795.0], 1794.0 < bench < 1795.0)
    check("m10", "NSW sample: 185 treated, 260 control; PSID 2490", [int(tm.sum()), int((~tm).sum()), len(psid)], [185, 260, 2490], (tm.sum(), (~tm).sum(), len(psid)) == (185, 260, 2490))
    check("m10", "propensity Newton fit finite on NSW+PSID", ps_beta_ok, True, ps_beta_ok)
    check("m10", "naive observational estimate strongly negative (LaLonde 1986 pattern)", eo["naive"], "< -10000", eo["naive"] < -10000)
    # balance
    Xb = design(obs); to = obs["treat"].to_numpy() == 1; wfull = np.zeros(len(obs)); wfull[~to] = eo["_w"]
    bal = []
    for j, nme in enumerate(COV):
        bal.append({"covariate": nme, "smd_experiment": r(smd(Xe[:, j], tm), 3), "smd_psid_raw": r(smd(Xo[:, j], to), 3), "smd_psid_ipw": r(smd(Xo[:, j], to, wfull[~to]), 3)})
    wmax = float(eo["_w"].max() / eo["_w"].sum())
    # synthetic
    vec = []
    for gamma, seed in [(0.0, 101), (0.5, 102), (1.0, 103), (1.5, 104)]:
        yy, tt, XX = synthetic(seed, 1000, gamma); e = estimators(yy, tt, XX, 25)
        vec.append({"seed": seed, "n": 1000, "gamma": gamma, "tau_true": 1.0, "n_treated": int(tt.sum()), **{n: r(e[n], 8) for n in names}, "ps_beta": rl(e["ps_beta"], 8), "ess_controls": r(e["ess_controls"], 6)})
    ns = {g: [] for g in (0.0, 1.0)}
    for g in ns:
        for k in range(30):
            yy, tt, XX = synthetic(500 + k, 1000, g); ns[g].append(estimators(yy, tt, XX, 25))
    check("m10", "synthetic gamma=0: mean naive within 0.15 of truth 1 (30 reps)", np.mean([e["naive"] for e in ns[0.0]]), 1.0, abs(np.mean([e["naive"] for e in ns[0.0]]) - 1) < 0.15)
    check("m10", "synthetic gamma=1: naive biased > 1.5, adjusted within 0.1 of 1", [np.mean([e["naive"] for e in ns[1.0]]), np.mean([e["ra_att"] for e in ns[1.0]]), np.mean([e["ipw_att"] for e in ns[1.0]])], "naive>2.5; ra,ipw ~ 1",
          np.mean([e["naive"] for e in ns[1.0]]) > 2.5 and abs(np.mean([e["ra_att"] for e in ns[1.0]]) - 1) < 0.1 and abs(np.mean([e["ipw_att"] for e in ns[1.0]]) - 1) < 0.1)
    # statsmodels cross-check of the propensity fit and OLS
    import statsmodels.api as sm
    Xs = (Xo - Xo.mean(0)) / Xo.std(0)
    lg = sm.Logit(obs["treat"].to_numpy(), sm.add_constant(Xs)).fit(disp=0, maxiter=200)
    dev = float(np.abs(lg.params - np.array(eo["ps_beta"])).max())
    check("m10", "from-scratch Newton propensity fit vs statsmodels Logit (max coefficient diff; ridge 1e-8)", dev, 1e-3, dev < 1e-3)
    return {"tags": {"nsw": "OBSERVED/DERIVED", "dag": "DERIVED", "synthetic": "SYNTHETIC", "vectors": "SYNTHETIC"}, "tolerance": TOL(1e-6, 1e-6, "synthetic estimators, Newton fixed 25 iterations"),
            "spec": {"target": "ATT in all estimators", "estimators": "analytics/causal.py docstring", "benchmark": "experimental difference in means on the NSW (Dehejia-Wahba) randomized sample",
                     "data_terms": "NBER nsw_dw.dta and psid_controls.dta, attributable non-commercial use (CC by NC); derived results only; no row-level data published",
                     "citations": ["LaLonde 1986 AER 76", "Dehejia and Wahba 1999 JASA 94", "Dehejia and Wahba 2002 REStat 84"], "link": "https://users.nber.org/~rdehejia/nswdata2.html", "bootstrap": "500 resamples, numpy PCG64 seed %d, percentile CI" % SEED,
                     "scope": "NSW results are precomputed (microdata is not shipped). The browser reruns the estimators on the SYNTHETIC environment, with parity vectors."},
            "dag": {"nodes": [{"id": "X", "label": "age, education, race, marital status, no-degree"}, {"id": "P", "label": "prior earnings re74, re75"}, {"id": "T", "label": "training (treat)"}, {"id": "Y", "label": "earnings 1978 (re78)"}, {"id": "U", "label": "unobserved motivation / ability", "unobserved": True}],
                    "edges": [["X", "T"], ["X", "Y"], ["P", "T"], ["P", "Y"], ["X", "P"], ["T", "Y"], ["U", "T"], ["U", "Y"], ["U", "P"]],
                    "note": "In the experiment T is randomized (no incoming edges). In the PSID comparison T is selection: the U edges are the threat to the observational estimators."},
            "assumptions": ["Unconfoundedness: given observed covariates, treatment is independent of potential outcomes. Untestable; the U edges in the DAG are exactly what it rules out.",
                            "Overlap: every covariate profile has a chance of both treatment and comparison. Checked by propensity distribution and weight diagnostics; weak for PSID.",
                            "SUTVA / consistency: no interference between participants and one version of treatment.",
                            "Correct specification: the outcome and propensity models are approximations; results are sensitive to them.",
                            "The experiment supports a causal reading only for the NSW volunteer population (external validity not established)."],
            "nsw": {"estimator_info": ESTIMATOR_INFO, "benchmark": {"estimate": r(bench, 2), "se": r(se, 2), "ci95": [r(bench - 1.959964 * se, 2), r(bench + 1.959964 * se, 2)], "n_treated": int(tm.sum()), "n_control": int((~tm).sum()), "unit": "USD 1978", "tag": "OBSERVED/DERIVED",
                                  "regression_adjusted_in_experiment": r(ee["ols_coef"], 2)},
                    "experiment_estimators": pack(ee, be), "observational_estimators": pack(eo, bo),
                    "observational_sample": {"n_treated": int(to.sum()), "n_psid_controls": int((~to).sum())},
                    "overlap": {"ipw_clip": [0.01, 0.99], "ess_controls": r(eo["ess_controls"], 1), "max_control_weight_share": r(wmax, 4), "controls_ps_gt_0_5": int((eo["_e"][~to] > 0.5).sum()), "treated_ps_mean": r(float(eo["_e"][to].mean()), 4), "control_ps_mean": r(float(eo["_e"][~to].mean()), 4)},
                    "balance": bal, "duplicates_in_nsw": int(nsw.duplicated(COV + ["treat", "re78"]).sum()), "means": {"treated_re78": r(float(exp_y[tm].mean()), 2), "control_re78": r(float(exp_y[~tm].mean()), 2), "psid_re78": r(float(psid["re78"].mean()), 2)}},
            "synthetic": {"dgp": "x1,x2 ~ N(0,1); treated if uniform < sigmoid(gamma (0.8 x1 + 0.6 x2)); y = tau t + 2 x1 + 1.5 x2 + N(0,1); tau = 1", "reps_mean": {str(g): {n: r(float(np.mean([e[n] for e in v])), 4) for n in names} for g, v in ns.items()}, "reps": 30},
            "vectors": vec}


def main():
    df = credit.load()
    arts = {"m01_distributions": m01(), "m02_sampling": m02(), "m03_montecarlo": m03(), "m04_bayes": m04(), "m05_forecast": m05()}
    a6, parts, pt, yt = m06(df)
    arts["m06_credit"] = a6
    arts["m07_pareto"] = m07(); arts["m08_sensitivity"] = m08(); arts["m09_counterfactual"] = m09(df, parts); arts["m10_causal"] = m10()
    for k, v in arts.items():
        write_artifact(k, v)
    write_artifact("validation", {"tags": {"checks": "DERIVED"}, "checks": CHECKS, "failures_recorded": FAILURES})
    from pipelines.meta import build_meta
    build_meta(arts, sum(c["passed"] for c in CHECKS), len(CHECKS))
    print(f"{len(CHECKS)} checks, {len(FAILURES)} failures")
    for f in FAILURES: print("FAIL", f)


if __name__ == "__main__":
    main()

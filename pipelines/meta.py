"""meta.json and facts.json, built from the already-written module artifacts."""
from __future__ import annotations

import gzip
import json
import platform
import sys

from pipelines.common import MANIFESTS, PUBLIC, SEED, write_artifact

MODS = [("m01_distributions", "Distributions", "DERIVED", "Lanczos lgamma, incomplete gamma/beta (Press et al., Numerical Recipes style); Acklam normal quantile"),
        ("m02_sampling", "Sampling", "SYNTHETIC", "xoshiro128** (Blackman and Vigna 2018), splitmix32 seeding"),
        ("m03_montecarlo", "Monte Carlo", "SYNTHETIC", "seeded project-NPV environment"),
        ("m04_bayes", "Conjugate Bayes", "SYNTHETIC", "beta-binomial, normal-normal; Wilson 1927"),
        ("m05_forecast", "Forecast intervals", "SYNTHETIC/PREDICTED", "SES (ETS A,N,N), AR(1) by OLS"),
        ("m06_credit", "Cost-sensitive thresholds", "OBSERVED/PREDICTED", "UCI Statlog German Credit, cost matrix 5:1"),
        ("m07_pareto", "LP and Pareto", "SYNTHETIC/DERIVED", "epsilon-constraint, HiGHS"),
        ("m08_sensitivity", "Sensitivity", "DERIVED", "Ishigami; Saltelli 2010, Jansen 1999"),
        ("m09_counterfactual", "Counterfactuals", "OBSERVED/PREDICTED", "model counterfactual search (not causal)"),
        ("m10_causal", "Causal", "OBSERVED/DERIVED", "NSW vs PSID; LaLonde 1986, Dehejia and Wahba 1999, 2002")]


def build_meta(arts: dict, passed: int = 0, total: int = 0) -> None:
    man = json.loads((MANIFESTS / "raw_manifest.json").read_text())
    f = man["files"]
    lic = {"nsw_dw.dta": "CC by NC (attributable non-commercial use)", "psid_controls.dta": "CC by NC (attributable non-commercial use)", "german.data": "CC BY 4.0"}
    use = {"nsw_dw.dta": "module 10 experimental benchmark", "psid_controls.dta": "module 10 observational comparison group", "german.data": "modules 6 and 9"}
    src = [{"id": k, "name": k, "url": f[k]["url"], "retrieved_at_utc": man["retrieved_at_utc"], "sha256": f[k]["sha256"], "md5": f[k]["md5"], "bytes": f[k]["bytes"], "licence": lic[k], "use": use[k], "tag": "OBSERVED"} for k in lic]
    n6, n10, n3 = arts["m06_credit"], arts["m10_causal"], arts["m03_montecarlo"]
    names = list(arts) + ["meta", "facts", "validation"]
    meta = {"tags": {"sources": "OBSERVED", "modules": "DERIVED"}, "project": "decision-universe", "tagline": "Every Decision Creates a Different Future", "seed": SEED, "sources": src,
            "citations": ["LaLonde, R. (1986). Evaluating the Econometric Evaluations of Training Programs. AER 76, 604-620.", "Dehejia, R. and Wahba, S. (1999). Causal Effects in Non-Experimental Studies. JASA 94(448), 1053-1062.",
                          "Dehejia, R. and Wahba, S. (2002). Propensity Score Matching Methods for Non-Experimental Causal Studies. REStat 84, 151-161.", "NBER data page: https://users.nber.org/~rdehejia/nswdata2.html",
                          "Hofmann, H. (1994). Statlog (German Credit Data). UCI Machine Learning Repository. https://doi.org/10.24432/C5NC77 (CC BY 4.0)",
                          "Ishigami, T. and Homma, T. (1990). An importance quantification technique in uncertainty analysis for computer models. IEEE ISUMA.", "Saltelli, A. et al. (2008). Global Sensitivity Analysis: The Primer. Wiley.",
                          "Blackman, D. and Vigna, S. (2018). Scrambled linear pseudorandom number generators (xoshiro128**)."],
            "licence_note": "NSW/PSID data are distributed by NBER for attributable non-commercial use (CC by NC). This non-monetized portfolio publishes derived results only and never the raw or row-level data. German Credit is CC BY 4.0.",
            "limitations": ["Seeded environments are SYNTHETIC and illustrate method, not any real project, series or population.", "NSW results come from one small volunteer sample (445 rows); PSID estimators depend heavily on specification.",
                            "The German Credit test split has 250 rows, so the empirical optimal threshold is noisy; the repeated-split table shows the spread.", "Counterfactuals are model counterfactuals, not causal.", "The forecast coverage study and bootstraps are precomputed (numpy PCG64), not reproduced in the browser."],
            "modules": [{"id": f"m{i+1:02d}", "name": n, "artifact": f"{a}.json", "tag": t, "reference": ref} for i, (a, n, t, ref) in enumerate(MODS)],
            "artifacts": [f"{n}.json" for n in names], "artifact_bytes": {}, "environment": {"python": sys.version.split()[0], "platform": platform.system()}}
    opt, nb = n6["optimum"], n10["nsw"]
    d3 = n3["environment"]["decisions"]["presets"]
    nvec = sum(len(a["vectors"]) for a in arts.values() if "vectors" in a) + sum(len(p["vectors"]) for p in d3) + len(arts["m02_sampling"]["seed_vectors"]) + len(arts["m01_distributions"]["cases"])
    F = lambda v, u, t, note="": {"value": v, "unit": u, "tag": t, "note": note}
    facts = {
        "nsw_benchmark_usd": F(nb["benchmark"]["estimate"], "USD 1978", "OBSERVED/DERIVED", "randomized difference in means"),
        "nsw_benchmark_se": F(nb["benchmark"]["se"], "USD", "DERIVED"),
        "nsw_psid_naive_usd": F(nb["observational_estimators"]["naive"]["estimate"], "USD 1978", "OBSERVED/DERIVED", "treated vs PSID, no adjustment"),
        "nsw_psid_ra_usd": F(nb["observational_estimators"]["ra_att"]["estimate"], "USD 1978", "OBSERVED/DERIVED"),
        "nsw_psid_ipw_usd": F(nb["observational_estimators"]["ipw_att"]["estimate"], "USD 1978", "OBSERVED/DERIVED"),
        "nsw_gap_naive_usd": F(nb["observational_estimators"]["naive"]["gap_vs_benchmark"], "USD", "DERIVED"),
        "nsw_gap_ols_usd": F(nb["observational_estimators"]["ols_coef"]["gap_vs_benchmark"], "USD", "DERIVED"),
        "nsw_gap_ra_usd": F(nb["observational_estimators"]["ra_att"]["gap_vs_benchmark"], "USD", "DERIVED"),
        "nsw_gap_ipw_usd": F(nb["observational_estimators"]["ipw_att"]["gap_vs_benchmark"], "USD", "DERIVED"),
        "credit_cost_at_0_5": F(opt["cost_at_0_5"], "cost units per applicant", "PREDICTED/OBSERVED", "test split n=250"),
        "credit_cost_optimal": F(opt["cost_opt"], "cost units per applicant", "PREDICTED/OBSERVED"),
        "credit_threshold_optimal": F(opt["t_opt_grid"], "p_bad", "PREDICTED/OBSERVED", "empirical grid optimum on test"),
        "credit_threshold_theory": F(opt["t_theory"], "p_bad", "DERIVED", "c_fp/(c_fp+c_fn) = 1/6"),
        "credit_test_auc": F(n6["model"]["metrics_test_calibrated"]["auc"], "AUC", "PREDICTED"),
        "mc_mean_npv": F(n3["run"]["mean"], "USD M", "SYNTHETIC"), "mc_p_loss": F(n3["run"]["p_loss"], "share", "SYNTHETIC"),
        "ishigami_s1": F(arts["m08_sensitivity"]["analytic"]["S"][0], "index", "DERIVED"), "ishigami_st3": F(arts["m08_sensitivity"]["analytic"]["ST"][2], "index", "DERIVED"),
        "mc_payback_share_8y": F(d3[0]["payback_share_8y"], "share", "SYNTHETIC", "BUILD NOW; discounted payback within 8 calendar years"),
        "mc_payback_share_8y_phased": F(d3[1]["payback_share_8y"], "share", "SYNTHETIC"), "mc_payback_share_8y_delay_one_year": F(d3[2]["payback_share_8y"], "share", "SYNTHETIC", "window cuts the last project year"),
        "mc_median_payback_year": F(d3[0]["median_payback_year"], "years from today", "SYNTHETIC", "BUILD NOW; median among futures that pay back within 8 years"),
        "mc_median_payback_year_phased": F(d3[1]["median_payback_year"], "years from today", "SYNTHETIC"), "mc_median_payback_year_delay_one_year": F(d3[2]["median_payback_year"], "years from today", "SYNTHETIC"),
        "mc_se": F(n3["run"]["se"], "USD M", "SYNTHETIC", "standard error of the mean NPV, n = 20000"), "mc_n": F(n3["run"]["n"], "futures", "SYNTHETIC"), "mc_mean_n100000": F(n3["run"]["mean_n100000"], "USD M", "SYNTHETIC", "mean NPV over the 100000-trial stream"),
        "validation_passed": F(passed, "checks", "DERIVED", "pipeline checks passed (validation.json)"), "validation_total": F(total, "checks", "DERIVED"),
        "parity_vectors_total": F(nvec, "vectors", "DERIVED", "entries in every vectors array incl. per-decision vectors, plus m02 seed_vectors and m01 cases"),
        "nsw_ipw_ess_controls": F(nb["overlap"]["ess_controls"], "effective controls", "DERIVED", "of 2490 PSID controls"),
        "pareto_points": F(len(arts["m07_pareto"]["front"]), "points", "DERIVED"),
    }
    write_artifact("facts", {"tags": {"facts": "DERIVED"}, "facts": facts})
    write_artifact("meta", meta)
    for n in names:
        meta["artifact_bytes"][n] = {"raw": (PUBLIC / f"{n}.json").stat().st_size, "gzip": len(gzip.compress((PUBLIC / f"{n}.json").read_bytes(), 9, mtime=0))}
    write_artifact("meta", meta)

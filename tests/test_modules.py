import json, math, shutil, subprocess
import numpy as np
import pytest
from jsonschema import Draft202012Validator
from scipy import stats

from analytics import bayes, credit, forecast, lp, mc, sens
from analytics.causal import estimators, synthetic
from analytics.rng import Xoshiro128ss
from pipelines.common import CONTRACTS, PUBLIC, ROOT


def test_xoshiro_hand_vector():
    g = Xoshiro128ss(0); g.s = [1, 2, 3, 4]
    assert g.next_u32() == 11520  # rotl(2*5,7)*9
    assert g.next_u32() == 0  # hand-derived: s1 becomes 2^2^... = 0 after the first step


@pytest.mark.skipif(not shutil.which("node"), reason="node not installed")
def test_prng_js_port_matches_artifact():
    out = subprocess.run(["node", str(ROOT / "tests/parity/rng_check.mjs")], capture_output=True, text=True, check=True).stdout
    assert json.loads(out)["mismatches"] == 0


def test_normal_moments_ks():
    g = Xoshiro128ss(5); z = [g.normal() for _ in range(20000)]
    assert stats.kstest(z, "norm").pvalue > 0.001


def test_mc_ci_coverage_and_determinism():
    assert mc.run(3, 50) == mc.run(3, 50)
    big = mc.summarize(mc.run(99, 60000))["mean"]
    hits = sum((lambda s: s["ci95_lo"] <= big <= s["ci95_hi"])(mc.summarize(mc.run(k, 400))) for k in range(150))
    assert 0.88 <= hits / 150 <= 0.99


def test_bayes_conjugacy_and_labels():
    c = bayes.beta_binomial(1, 1, 7, 20)
    assert c["post"] == [8, 14]
    from scipy.stats import beta
    assert abs(c["credible95"][0] - beta.ppf(0.025, 8, 14)) < 1e-9 and abs(c["credible95"][1] - beta.ppf(0.975, 8, 14)) < 1e-9
    n = bayes.normal_normal(0, 1, 2, 5, 1.2)
    tau = 1 + 5 / 4
    assert abs(n["post_mean"] - (5 * 1.2 / 4) / tau) < 1e-12
    flat = bayes.normal_normal(0, 1e6, 2, 5, 1.2)  # vague prior: credible ~ confidence
    assert abs(flat["credible95"][0] - flat["confidence95_z"][0]) < 1e-4


def test_forecast_fast_equals_plain_and_ar_recovers_phi():
    x = forecast.gen_series(5, 400, 100, 0.7, 5)
    assert forecast.ses_fit(x)["alpha"] == forecast.ses_fit_np(np.array(x))["alpha"]
    assert abs(forecast.ar1_fit(x)["phi"] - 0.7) < 0.1


def test_lp_front_vs_scipy_and_monotone():
    from scipy.optimize import linprog
    f = lp.front(lp.PROBLEM, 10)
    prev = -1
    for p in f["points"]:
        A, b = lp.with_rows(lp.PROBLEM, [lp.PROBLEM["emissions"]], [p["eps"]])
        res = linprog([-v for v in lp.PROBLEM["profit"]], A_ub=A, b_ub=b, bounds=[(0, u) for u in lp.PROBLEM["upper"]], method="highs")
        assert abs(-res.fun - p["profit"]) < 1e-6 and p["profit"] > prev
        prev = p["profit"]


def test_ishigami_indices_closed_form_vs_quadrature_and_mc():
    a, q = sens.analytic(), sens.quadrature(48)
    for k in ("S", "ST"):
        assert np.allclose(a[k], q[k], atol=1e-10)
    assert abs(a["S"][0] - 0.3139) < 5e-4 and abs(a["S"][1] - 0.4424) < 5e-4 and abs(a["ST"][2] - 0.2437) < 5e-4
    s = sens.saltelli(7, 16384)
    assert np.allclose(s["S"], a["S"], atol=0.04) and np.allclose(s["ST"], a["ST"], atol=0.04)


def test_causal_synthetic_recovers_truth():
    y, t, X = synthetic(11, 4000, 1.0)
    e = estimators(y, t, X, 25)
    assert e["naive"] > 2.0 and abs(e["ra_att"] - 1) < 0.2 and abs(e["ipw_att"] - 1) < 0.25
    import statsmodels.api as sm
    Xs = (X - X.mean(0)) / X.std(0)
    lg = sm.Logit(t, sm.add_constant(Xs)).fit(disp=0)
    assert np.allclose(lg.params, e["ps_beta"], atol=1e-3)


def test_credit_cost_matrix_and_threshold():
    p = np.array([0.1, 0.2, 0.6, 0.9]); y = np.array([0, 1, 0, 1])
    c = credit.cost_at(p, y, 0.5)
    assert (c["tp"], c["fp"], c["fn"], c["tn"]) == (1, 1, 1, 1) and c["cost"] == (5 + 1) / 4
    big = np.random.default_rng(0).uniform(size=20000); yy = (np.random.default_rng(1).uniform(size=20000) < big).astype(int)
    t, _ = credit.argmin_threshold(big, yy)
    assert abs(t - 1 / 6) < 0.03  # calibrated probabilities: optimum is 1/6


NAMES = [s.name.replace(".schema.json", "") for s in sorted(CONTRACTS.glob("*.schema.json"))]


@pytest.mark.parametrize("name", NAMES)
def test_artifact_matches_schema_and_budget(name):
    import gzip
    f = PUBLIC / f"{name}.json"
    assert not list(Draft202012Validator(json.loads((CONTRACTS / f"{name}.schema.json").read_text())).iter_errors(json.loads(f.read_text())))
    assert len(gzip.compress(f.read_bytes(), 9)) < 400 * 1024


def test_no_raw_rows_or_dashes_published():
    for f in list(PUBLIC.glob("*.json")) + list((ROOT / "docs").glob("*.md")) + list((ROOT / "analytics").glob("*.py")):
        t = f.read_text()
        assert "—" not in t and "―" not in t, f
    assert not any(p.suffix == ".dta" for p in ROOT.rglob("*") if ".venv" not in p.parts and "raw" not in p.parts)


def test_validation_artifact_has_no_failures(art):
    v = art("validation")
    assert v["failures_recorded"] == [] and all(c["passed"] for c in v["checks"])


def test_headline_numbers(art):
    n = art("m10_causal")["nsw"]
    assert abs(n["benchmark"]["estimate"] - 1794.34) < 0.01
    assert n["observational_estimators"]["naive"]["estimate"] < -10000
    o = art("m06_credit")["optimum"]
    assert o["cost_opt"] < o["cost_at_0_5"] and abs(o["t_theory"] - 1 / 6) < 1e-9


def test_build_is_byte_reproducible(art):
    before = {p.name: p.read_bytes() for p in PUBLIC.glob("m0[1-4]*.json")}
    from pipelines import build
    build.CHECKS.clear(); build.FAILURES.clear()
    from pipelines.common import write_artifact
    write_artifact("m02_sampling", build.m02()); write_artifact("m03_montecarlo", build.m03())
    assert {p.name: p.read_bytes() for p in PUBLIC.glob("m0[2-3]*.json")}["m02_sampling.json"] == before["m02_sampling.json"]
    assert (PUBLIC / "m03_montecarlo.json").read_bytes() == before["m03_montecarlo.json"]

import math

import numpy as np
from scipy import integrate, special, stats

from analytics import dists
from analytics.special import betainc, gammainc_p, lgamma


def test_special_vs_scipy():
    for x in [0.01, 0.3, 0.5, 1.0, 2.5, 7.7, 50.0, 300.5]:
        assert abs(lgamma(x) - special.gammaln(x)) <= 1e-13 * max(1, abs(special.gammaln(x)))
    for a, x in [(0.5, 0.2), (2.0, 1.0), (5.0, 9.0), (30.0, 25.0), (100.0, 120.0)]:
        assert abs(gammainc_p(a, x) - special.gammainc(a, x)) < 1e-13
    for a, b, x in [(0.5, 0.5, 0.3), (2, 5, 0.4), (30, 20, 0.6), (1, 1, 0.9)]:
        assert abs(betainc(a, b, x) - special.betainc(a, b, x)) < 1e-13


CASES = [
    ("normal", (1.5, 2.0), stats.norm(1.5, 2.0)),
    ("lognormal", (0.2, 0.6), stats.lognorm(0.6, scale=math.exp(0.2))),
    ("beta", (2.5, 4.0), stats.beta(2.5, 4.0)),
    ("beta", (0.6, 0.8), stats.beta(0.6, 0.8)),
    ("gamma", (3.0, 2.0), stats.gamma(3.0, scale=2.0)),
    ("gamma", (0.7, 1.5), stats.gamma(0.7, scale=1.5)),
]


def test_continuous_vs_scipy():
    ps = [1e-6, 0.001, 0.05, 0.25, 0.5, 0.75, 0.95, 0.999, 1 - 1e-6]
    for name, par, ref in CASES:
        pdf, cdf, ppf = getattr(dists, name)(*par)
        for p in ps:
            q = ppf(p)
            assert abs(q - ref.ppf(p)) <= 1e-8 * max(1, abs(ref.ppf(p))), (name, par, p)
            assert abs(cdf(q) - p) < 1e-9
            if ref.pdf(q) > 1e-12:
                assert abs(pdf(q) - ref.pdf(q)) <= 1e-9 * ref.pdf(q) + 1e-12
                assert abs(cdf(q) - ref.cdf(q)) < 1e-12


def test_poisson_vs_scipy():
    for lam in [0.4, 3.0, 12.5, 80.0]:
        pmf, cdf, ppf = dists.poisson(lam)
        ref = stats.poisson(lam)
        for k in range(0, int(lam * 3) + 5):
            assert abs(pmf(k) - ref.pmf(k)) < 1e-12
            assert abs(cdf(k) - ref.cdf(k)) < 1e-12
        for p in [0.01, 0.5, 0.9, 0.999]:
            assert ppf(p) == ref.ppf(p)


def test_normalization_pdf_integrates_to_one():
    for name, par, _ in CASES:
        pdf, _, _ = getattr(dists, name)(*par)
        lo, hi = {"normal": (-np.inf, np.inf), "lognormal": (0, np.inf), "gamma": (0, np.inf), "beta": (0, 1)}[name]
        val, err = integrate.quad(pdf, lo, hi, limit=400)
        assert abs(val - 1) < 1e-7, (name, par, val)
    for lam in [0.4, 12.5, 80.0]:
        pmf = dists.poisson(lam)[0]
        assert abs(sum(pmf(k) for k in range(0, 1000)) - 1) < 1e-12


def test_quantile_inverse_roundtrip():
    for name, par, _ in CASES:
        pdf, cdf, ppf = getattr(dists, name)(*par)
        for p in np.linspace(0.01, 0.99, 25):
            assert abs(cdf(ppf(float(p))) - p) < 1e-10

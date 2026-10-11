"""Conjugate Bayesian updating and the frequentist intervals shown beside them (labelled distinctly).

beta-binomial: prior Beta(a0, b0), data k successes in n trials -> posterior Beta(a0 + k, b0 + n - k).
  95% CREDIBLE interval (Bayesian, equal-tailed): posterior quantiles 0.025 and 0.975.
  95% CONFIDENCE interval (frequentist, Wilson score): (phat + z^2/2n +- z sqrt(phat(1-phat)/n + z^2/4n^2)) / (1 + z^2/n), z = 1.959963984540054.
normal-normal (known sigma): prior N(m0, s0^2), data mean ybar of n -> precision tau = 1/s0^2 + n/sigma^2, mean = (m0/s0^2 + n ybar/sigma^2)/tau.
  CREDIBLE: mean +- z / sqrt(tau). CONFIDENCE (z-interval): ybar +- z sigma/sqrt(n).
"""
from __future__ import annotations

import math

from analytics import dists
from analytics.mc import Z95
from analytics.rng import Xoshiro128ss


def beta_binomial(a0: float, b0: float, k: int, n: int) -> dict:
    a, b = a0 + k, b0 + n - k
    pdf, cdf, ppf = dists.beta(a, b)
    ph = k / n if n else 0.0
    z2 = Z95 * Z95
    if n:
        centre = (ph + z2 / (2 * n)) / (1 + z2 / n)
        half = Z95 * math.sqrt(ph * (1 - ph) / n + z2 / (4 * n * n)) / (1 + z2 / n)
        wil = [max(0.0, centre - half), min(1.0, centre + half)]
    else:
        wil = [0.0, 1.0]
    return {"prior": [a0, b0], "k": k, "n": n, "post": [a, b], "post_mean": a / (a + b), "post_sd": math.sqrt(a * b / ((a + b) ** 2 * (a + b + 1))),
            "credible95": [ppf(0.025), ppf(0.975)], "p_gt_half": 1.0 - cdf(0.5), "confidence95_wilson": wil, "mle": ph}


def normal_normal(m0: float, s0: float, sigma: float, n: int, ybar: float) -> dict:
    tau = 1.0 / s0**2 + n / sigma**2
    mean = (m0 / s0**2 + n * ybar / sigma**2) / tau
    sd = 1.0 / math.sqrt(tau)
    hw = Z95 * sigma / math.sqrt(n)
    return {"prior": [m0, s0], "sigma": sigma, "n": n, "ybar": ybar, "post_mean": mean, "post_sd": sd, "credible95": [mean - Z95 * sd, mean + Z95 * sd],
            "confidence95_z": [ybar - hw, ybar + hw]}


def sequential(seed: int, p_true: float, n: int) -> dict:
    """Flip k = (uniform() < p_true) n times with xoshiro; record the Beta(1,1) update path."""
    rng = Xoshiro128ss(seed)
    flips, rows, k = [], [], 0
    for i in range(1, n + 1):
        x = 1 if rng.uniform() < p_true else 0
        flips.append(x)
        k += x
        if i <= 10 or i % 5 == 0:
            r = beta_binomial(1.0, 1.0, k, i)
            rows.append({"n": i, "k": k, "mean": r["post_mean"], "cr_lo": r["credible95"][0], "cr_hi": r["credible95"][1], "ci_lo": r["confidence95_wilson"][0], "ci_hi": r["confidence95_wilson"][1]})
    return {"seed": seed, "p_true": p_true, "flips": flips, "path": rows}

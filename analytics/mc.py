"""Monte Carlo reference: seeded project-NPV environment (SYNTHETIC) and summary statistics.

Environment (units: USD millions; horizon 8 years, cash flows at year end):
  per trial draw order (xoshiro128**, analytics.rng): I = exp(ln 100 + 0.15 * normal());  R1 = 48 + 8 * normal();
  g = triangular(a=-0.02, mode=0.06, b=0.15) using uniform();  m = 0.35 + 0.05 * normal();  r = 0.07 + 0.05 * uniform()
  NPV = -I + sum_{t=1..8} R1 (1+g)^(t-1) m / (1+r)^t
Statistics: mean, sd (n-1), se = sd / sqrt(n), 95% CI of the mean = mean +- 1.959963984540054 se, P(loss) = share NPV < 0,
percentiles by linear interpolation between order statistics (type 7: h = (n-1) p).
"""
from __future__ import annotations

import math

from analytics.rng import Xoshiro128ss

Z95 = 1.959963984540054
ENV = {
    "years": 8,
    "investment": {"dist": "lognormal", "mu": math.log(100.0), "sigma": 0.15, "unit": "USD M"},
    "revenue_y1": {"dist": "normal", "mean": 48.0, "sd": 8.0, "unit": "USD M"},
    "growth": {"dist": "triangular", "a": -0.02, "mode": 0.06, "b": 0.15},
    "margin": {"dist": "normal", "mean": 0.35, "sd": 0.05},
    "discount_rate": {"dist": "uniform", "a": 0.07, "b": 0.12},
    "draw_order": ["investment (1 normal)", "revenue_y1 (1 normal)", "growth (1 uniform)", "margin (1 normal)", "discount_rate (1 uniform)"],
}


def tri_inv(u: float, a: float, c: float, b: float) -> float:
    fc = (c - a) / (b - a)
    if u < fc:
        return a + math.sqrt(u * (b - a) * (c - a))
    return b - math.sqrt((1.0 - u) * (b - a) * (b - c))


def npv_trial(rng: Xoshiro128ss) -> float:
    inv = math.exp(math.log(100.0) + 0.15 * rng.normal())
    r1 = 48.0 + 8.0 * rng.normal()
    g = tri_inv(rng.uniform(), -0.02, 0.06, 0.15)
    m = 0.35 + 0.05 * rng.normal()
    r = 0.07 + 0.05 * rng.uniform()
    pv = 0.0
    cf = r1 * m
    d = 1.0
    for _ in range(8):
        d *= 1.0 + r
        pv += cf / d
        cf *= 1.0 + g
    return -inv + pv


def run(seed: int, n: int) -> list[float]:
    rng = Xoshiro128ss(seed)
    return [npv_trial(rng) for _ in range(n)]


def percentile(sorted_x: list[float], p: float) -> float:
    h = (len(sorted_x) - 1) * p
    lo = math.floor(h)
    hi = min(lo + 1, len(sorted_x) - 1)
    return sorted_x[lo] + (h - lo) * (sorted_x[hi] - sorted_x[lo])


def summarize(x: list[float]) -> dict:
    n = len(x)
    mean = sum(x) / n
    sd = math.sqrt(sum((v - mean) ** 2 for v in x) / (n - 1))
    se = sd / math.sqrt(n)
    s = sorted(x)
    return {"n": n, "mean": mean, "sd": sd, "se": se, "ci95_lo": mean - Z95 * se, "ci95_hi": mean + Z95 * se,
            "p_loss": sum(1 for v in x if v < 0.0) / n, "p05": percentile(s, 0.05), "p50": percentile(s, 0.5), "p95": percentile(s, 0.95)}

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


PRESETS = {
    "build_now": {"label": "BUILD NOW", "investment_median": 100.0, "revenue_multiplier": 1.0, "delay_years": 0},
    "phased": {"label": "PHASED", "investment_median": 70.0, "revenue_multiplier": 0.75, "delay_years": 0},
    "delay_one_year": {"label": "DELAY ONE YEAR", "investment_median": 100.0, "revenue_multiplier": 1.0, "delay_years": 1},
}
HORIZON = 8  # calendar years shown for recovered[] / payback


def draw_inputs(rng: Xoshiro128ss) -> tuple[float, float, float, float, float]:
    """Common random numbers: the five raw draws of one future, in this fixed order, whatever the decision.
    (z_investment normal, z_revenue normal, u_growth uniform, z_margin normal, u_discount uniform)"""
    return rng.normal(), rng.normal(), rng.uniform(), rng.normal(), rng.uniform()


def evaluate(d: tuple, pre: dict) -> dict:
    """Decision transform of one future. recovered[t], t = 0..8 calendar years: PV(cash received through t) / PV(investment), both at today's value;
    cash flow of project year s arrives at calendar year s + delay. payback_year = first t >= 1 with recovered >= 1, linear within the year, else None."""
    zi, zr, ug, zm, ur = d
    inv = math.exp(math.log(pre["investment_median"]) + 0.15 * zi)
    r1 = pre["revenue_multiplier"] * (48.0 + 8.0 * zr)
    g = tri_inv(ug, -0.02, 0.06, 0.15)
    m = 0.35 + 0.05 * zm
    r = 0.07 + 0.05 * ur
    k = pre["delay_years"]
    pv_inv = inv / (1.0 + r) ** k
    cf, pv, cum = r1 * m, 0.0, [0.0]
    for s in range(1, 9):
        pv += cf / (1.0 + r) ** (s + k)
        cum.append(pv)
        cf *= 1.0 + g
    npv = pv - pv_inv
    rec = [0.0] * (HORIZON + 1)
    for t in range(k + 1, HORIZON + 1):
        rec[t] = cum[t - k] / pv_inv
    pay = None
    for t in range(1, HORIZON + 1):
        if rec[t] >= 1.0:
            pay = (t - 1) + (1.0 - rec[t - 1]) / (rec[t] - rec[t - 1])
            break
    return {"investment": inv, "npv": npv, "recovered": rec, "payback_year": pay}


def npv_trial(rng: Xoshiro128ss) -> float:
    return evaluate(draw_inputs(rng), PRESETS["build_now"])["npv"]


def run_detail(seed: int, n: int, pre: dict) -> list[dict]:
    rng = Xoshiro128ss(seed)
    return [evaluate(draw_inputs(rng), pre) for _ in range(n)]


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

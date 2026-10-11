"""Forecast interval reference: seeded AR(1) series, simple exponential smoothing (ETS A,N,N) and AR(1) by OLS, with analytic intervals.

Series: x_0 ~ N(mu, sigma^2/(1-phi^2)); x_t = mu + phi (x_{t-1} - mu) + sigma * normal()   (xoshiro128**, x_0 uses the first normal)
SES: l_0 = x_0; l_t = a x_t + (1-a) l_{t-1}; residual e_t = x_t - l_{t-1}, t = 1..n-1; a = argmin SSE over {0.01, 0.02, ..., 0.99} (first minimum);
  sigma2 = SSE/(n-1); forecast f_h = l_{n-1}; var_h = sigma2 (1 + (h-1) a^2).
AR(1): OLS of x_t on [1, x_{t-1}], t = 1..n-1. phi = Sxy/Sxx (centred), c = ybar - phi xbar, sigma2 = RSS/(n-3); mu = c/(1-phi);
  f_h = mu + phi^h (x_{n-1} - mu); var_h = sigma2 sum_{j<h} phi^(2j).
Interval at level L: f_h +- z sqrt(var_h), z = normal quantile at (1+L)/2.
"""
from __future__ import annotations

import math

import numpy as np

from analytics.dists import norm_ppf
from analytics.rng import Xoshiro128ss

ALPHAS = [i / 100 for i in range(1, 100)]


def gen_series(seed: int, n: int, mu: float, phi: float, sigma: float) -> list[float]:
    rng = Xoshiro128ss(seed)
    x = [mu + sigma / math.sqrt(1 - phi * phi) * rng.normal()]
    for _ in range(1, n):
        x.append(mu + phi * (x[-1] - mu) + sigma * rng.normal())
    return x


def ses_sse(x, a: float) -> tuple[float, float]:
    lev, sse = x[0], 0.0
    for t in range(1, len(x)):
        e = x[t] - lev
        sse += e * e
        lev = a * x[t] + (1 - a) * lev
    return sse, lev


def ses_fit(x) -> dict:
    best = None
    for a in ALPHAS:
        sse, lev = ses_sse(x, a)
        if best is None or sse < best[1]:
            best = (a, sse, lev)
    a, sse, lev = best
    return {"alpha": a, "sse": sse, "level": lev, "sigma2": sse / (len(x) - 1)}


def ses_fit_np(x: np.ndarray) -> dict:
    """Vectorized over the alpha grid; same arithmetic order per alpha as ses_fit (used by the coverage study; tested equal)."""
    al = np.array(ALPHAS)
    lev = np.full_like(al, x[0])
    sse = np.zeros_like(al)
    for t in range(1, len(x)):
        e = x[t] - lev
        sse += e * e
        lev = al * x[t] + (1 - al) * lev
    i = int(np.argmin(sse))
    return {"alpha": float(al[i]), "sse": float(sse[i]), "level": float(lev[i]), "sigma2": float(sse[i]) / (len(x) - 1)}


def ar1_fit(x) -> dict:
    n = len(x)
    y, z = x[1:], x[:-1]
    ym, zm = sum(y) / (n - 1), sum(z) / (n - 1)
    sxy = sum((a - zm) * (b - ym) for a, b in zip(z, y))
    sxx = sum((a - zm) ** 2 for a in z)
    phi = sxy / sxx
    c = ym - phi * zm
    rss = sum((b - c - phi * a) ** 2 for a, b in zip(z, y))
    return {"phi": phi, "c": c, "mu": c / (1 - phi), "sigma2": rss / (n - 3), "last": x[-1]}


def ses_forecast(fit: dict, h: int, level: float) -> tuple[float, float, float]:
    sd = math.sqrt(fit["sigma2"] * (1 + (h - 1) * fit["alpha"] ** 2))
    z = norm_ppf((1 + level) / 2)
    return fit["level"], fit["level"] - z * sd, fit["level"] + z * sd


def ar1_forecast(fit: dict, h: int, level: float) -> tuple[float, float, float]:
    f = fit["mu"] + fit["phi"] ** h * (fit["last"] - fit["mu"])
    v = fit["sigma2"] * sum(fit["phi"] ** (2 * j) for j in range(h))
    z = norm_ppf((1 + level) / 2)
    return f, f - z * math.sqrt(v), f + z * math.sqrt(v)

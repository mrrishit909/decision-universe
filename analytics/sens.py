"""Sensitivity reference: Ishigami (A=7, B=0.1), analytic and quadrature Sobol indices, Saltelli/Jansen estimators, OAT.

f(x) = sin x1 + A sin^2 x2 + B x3^4 sin x1, x_i ~ U[-pi, pi].
Saltelli sampling (xoshiro128**, row-major): for i in 0..N-1, for j in 0..5: u = uniform(); x = -pi + 2 pi u. A = columns 0..2, B = columns 3..5.
AB_k = A with column k taken from B. fA, fB, fABk = f over rows.
V = sample variance (ddof 1) of concat(fA, fB). S_k = mean(fB * (fABk - fA)) / V   (Saltelli 2010).  ST_k = 0.5 mean((fA - fABk)^2) / V   (Jansen 1999).
"""
from __future__ import annotations

import math

import numpy as np

from analytics.rng import Xoshiro128ss

A_, B_ = 7.0, 0.1
PI = math.pi


def ishigami(x1: float, x2: float, x3: float) -> float:
    return math.sin(x1) + A_ * math.sin(x2) ** 2 + B_ * x3**4 * math.sin(x1)


def analytic() -> dict:
    v1 = 0.5 * (1 + B_ * PI**4 / 5) ** 2
    v2 = A_**2 / 8
    v13 = B_**2 * PI**8 * (1 / 18 - 1 / 50)
    v = A_**2 / 8 + B_ * PI**4 / 5 + B_**2 * PI**8 / 18 + 0.5
    return {"V": v, "V1": v1, "V2": v2, "V3": 0.0, "V13": v13, "S": [v1 / v, v2 / v, 0.0], "ST": [(v1 + v13) / v, v2 / v, v13 / v]}


def quadrature(n: int = 64) -> dict:
    """Independent check: conditional variances by Gauss-Legendre on [-pi, pi]^3 (no closed form used)."""
    g, w = np.polynomial.legendre.leggauss(n)
    x, w = PI * g, PI * w / (2 * PI)  # weights sum to 1 (uniform density)
    X1, X2, X3 = np.meshgrid(x, x, x, indexing="ij")
    F = np.sin(X1) + A_ * np.sin(X2) ** 2 + B_ * X3**4 * np.sin(X1)
    W = w[:, None, None] * w[None, :, None] * w[None, None, :]
    f0 = (W * F).sum()
    V = (W * (F - f0) ** 2).sum()
    m1 = (F * w[None, :, None] * w[None, None, :]).sum((1, 2))
    m2 = (F * w[:, None, None] * w[None, None, :]).sum((0, 2))
    m3 = (F * w[:, None, None] * w[None, :, None]).sum((0, 1))
    V1, V2, V3 = [(w * (m - f0) ** 2).sum() for m in (m1, m2, m3)]
    # total index via complement: V_{~i} = variance of E[f | x_{-i}]
    def vt(axis):
        m = (F * w.reshape([-1 if a == axis else 1 for a in range(3)])).sum(axis)
        ww = np.multiply.outer(w, w)
        return (ww * (m - f0) ** 2).sum()
    VT = [V - vt(a) for a in range(3)]
    return {"f0": f0, "V": V, "S": [V1 / V, V2 / V, V3 / V], "ST": [t / V for t in VT]}


def saltelli(seed: int, N: int) -> dict:
    rng = Xoshiro128ss(seed)
    U = np.empty((N, 6))
    for i in range(N):
        for j in range(6):
            U[i, j] = rng.uniform()
    X = -PI + 2 * PI * U
    A, B = X[:, :3], X[:, 3:]
    f = lambda M: np.sin(M[:, 0]) + A_ * np.sin(M[:, 1]) ** 2 + B_ * M[:, 2] ** 4 * np.sin(M[:, 0])
    fA, fB = f(A), f(B)
    V = np.var(np.concatenate([fA, fB]), ddof=1)
    S, ST = [], []
    for k in range(3):
        ABk = A.copy(); ABk[:, k] = B[:, k]
        fk = f(ABk)
        S.append(float(np.mean(fB * (fk - fA)) / V))
        ST.append(float(0.5 * np.mean((fA - fk) ** 2) / V))
    return {"seed": seed, "N": N, "V": float(V), "S": S, "ST": ST, "evaluations": N * 5}


def oat(base: list[float], k: int = 21) -> dict:
    grid = [-PI + 2 * PI * i / (k - 1) for i in range(k)]
    sweeps = []
    for j in range(3):
        ys = []
        for g in grid:
            x = list(base); x[j] = g
            ys.append(ishigami(*x))
        sweeps.append({"input": f"x{j+1}", "y": ys, "range": max(ys) - min(ys)})
    return {"base": base, "grid": grid, "f_base": ishigami(*base), "sweeps": sweeps}

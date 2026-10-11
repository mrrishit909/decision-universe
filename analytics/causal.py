"""Causal estimators (module 10), all targeting the ATT. Estimates: naive, OLS coefficient, regression adjustment (RA), IPW.

naive: mean(y | t=1) - mean(y | t=0).
ols_coef: coefficient on t in OLS of y on [1, t, X] (normal equations).
ra_att: fit OLS of y on [1, X] using controls only; ATT = mean(y_treated) - mean(prediction for treated).
ipw_att: propensity e(x) = logistic(X) by Newton-Raphson (zero start, fixed 25 iterations for synthetic / 50 for NSW, ridge 1e-8 on non-intercept coefficients,
  covariates standardized with full-sample mean and sd (ddof 0)); e clipped to [0.01, 0.99]; controls weighted w = e/(1-e); ATT = mean(y_T) - sum(w y_C)/sum(w) (Hajek).
"""
from __future__ import annotations

import math

import numpy as np

from analytics.rng import Xoshiro128ss


def logistic_newton(X: np.ndarray, t: np.ndarray, iters: int, ridge: float = 1e-8) -> np.ndarray:
    Z = np.column_stack([np.ones(len(X)), X])
    beta = np.zeros(Z.shape[1])
    R = ridge * np.eye(Z.shape[1]); R[0, 0] = 0.0
    for _ in range(iters):
        p = 1 / (1 + np.exp(-Z @ beta))
        grad = Z.T @ (t - p) - R @ beta
        H = (Z * (p * (1 - p))[:, None]).T @ Z + R
        beta = beta + np.linalg.solve(H, grad)
    return beta


def ols(Z: np.ndarray, y: np.ndarray) -> np.ndarray:
    return np.linalg.solve(Z.T @ Z, Z.T @ y)


def pscore(X: np.ndarray, t: np.ndarray, iters: int) -> tuple[np.ndarray, np.ndarray]:
    mu, sd = X.mean(0), X.std(0)
    Xs = (X - mu) / sd
    beta = logistic_newton(Xs, t, iters)
    e = 1 / (1 + np.exp(-(beta[0] + Xs @ beta[1:])))
    return np.clip(e, 0.01, 0.99), beta


def estimators(y: np.ndarray, t: np.ndarray, X: np.ndarray, iters: int, X_ps: np.ndarray | None = None) -> dict:
    tm = t == 1
    naive = y[tm].mean() - y[~tm].mean()
    ones = np.ones(len(y))
    b = ols(np.column_stack([ones, t, X]), y)
    b0 = ols(np.column_stack([np.ones((~tm).sum()), X[~tm]]), y[~tm])
    ra = y[tm].mean() - (np.column_stack([np.ones(tm.sum()), X[tm]]) @ b0).mean()
    e, beta = pscore(X if X_ps is None else X_ps, t, iters)
    w = e[~tm] / (1 - e[~tm])
    ipw = y[tm].mean() - (w * y[~tm]).sum() / w.sum()
    ess = w.sum() ** 2 / (w**2).sum()
    return {"naive": float(naive), "ols_coef": float(b[1]), "ra_att": float(ra), "ipw_att": float(ipw), "ess_controls": float(ess), "ps_beta": beta.tolist(), "_e": e, "_w": w}


def synthetic(seed: int, n: int, gamma: float, tau: float = 1.0):
    """Draw order per unit: x1 = normal, x2 = normal, u = uniform (t = u < sigmoid(gamma (0.8 x1 + 0.6 x2))), eps = normal; y = tau t + 2 x1 + 1.5 x2 + eps."""
    rng = Xoshiro128ss(seed)
    X = np.empty((n, 2)); t = np.empty(n); y = np.empty(n)
    for i in range(n):
        x1, x2 = rng.normal(), rng.normal()
        p = 1 / (1 + math.exp(-gamma * (0.8 * x1 + 0.6 * x2)))
        t[i] = 1.0 if rng.uniform() < p else 0.0
        y[i] = tau * t[i] + 2 * x1 + 1.5 * x2 + rng.normal()
        X[i] = (x1, x2)
    return y, t, X


def smd(x: np.ndarray, tm: np.ndarray, w: np.ndarray | None = None) -> float:
    xt, xc = x[tm], x[~tm]
    if w is None:
        mc, vc = xc.mean(), xc.var(ddof=1)
    else:
        mc = (w * xc).sum() / w.sum(); vc = (w * (xc - mc) ** 2).sum() / w.sum()
    return float((xt.mean() - mc) / math.sqrt((xt.var(ddof=1) + vc) / 2))

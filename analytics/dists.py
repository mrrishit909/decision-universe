"""pdf / cdf / quantile for normal, lognormal, beta, gamma, poisson, built on analytics.special (JS-portable).

Quantile rule: normal = Acklam initial value + 2 Halley refinements; lognormal via normal; beta, gamma = bisection on the cdf
(bracket [0,1] for beta, [0, hi] with hi doubled from mean + 10 sd until cdf(hi) >= p for gamma; stop when mid equals an end or after 300 halvings);
poisson = smallest integer k with cdf(k) >= p.
"""
from __future__ import annotations

import math

from analytics.special import betainc, gammainc_p, gammainc_q, lbeta, lgamma

_A = (-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00)
_B = (-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01)
_C = (-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00)
_D = (7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00)
SQRT2PI = 2.5066282746310002


def norm_pdf(z: float) -> float:
    return math.exp(-0.5 * z * z) / SQRT2PI


def norm_cdf(z: float) -> float:
    q = gammainc_q(0.5, 0.5 * z * z)  # = erfc(|z| / sqrt 2)
    return 1.0 - 0.5 * q if z >= 0.0 else 0.5 * q


def norm_ppf(p: float) -> float:
    if p <= 0.0 or p >= 1.0:
        raise ValueError("p must be in (0, 1)")
    if p < 0.02425:
        q = math.sqrt(-2.0 * math.log(p))
        x = (((((_C[0] * q + _C[1]) * q + _C[2]) * q + _C[3]) * q + _C[4]) * q + _C[5]) / ((((_D[0] * q + _D[1]) * q + _D[2]) * q + _D[3]) * q + 1.0)
    elif p > 1.0 - 0.02425:
        q = math.sqrt(-2.0 * math.log(1.0 - p))
        x = -(((((_C[0] * q + _C[1]) * q + _C[2]) * q + _C[3]) * q + _C[4]) * q + _C[5]) / ((((_D[0] * q + _D[1]) * q + _D[2]) * q + _D[3]) * q + 1.0)
    else:
        q = p - 0.5
        r = q * q
        x = (((((_A[0] * r + _A[1]) * r + _A[2]) * r + _A[3]) * r + _A[4]) * r + _A[5]) * q / (((((_B[0] * r + _B[1]) * r + _B[2]) * r + _B[3]) * r + _B[4]) * r + 1.0)
    for _ in range(2):
        e = norm_cdf(x) - p
        u = e * SQRT2PI * math.exp(0.5 * x * x)
        x -= u / (1.0 + 0.5 * x * u)
    return x


def normal(mu: float, sigma: float):
    return (lambda x: norm_pdf((x - mu) / sigma) / sigma, lambda x: norm_cdf((x - mu) / sigma), lambda p: mu + sigma * norm_ppf(p))


def lognormal(mu: float, sigma: float):
    def pdf(x):
        return 0.0 if x <= 0 else norm_pdf((math.log(x) - mu) / sigma) / (x * sigma)

    def cdf(x):
        return 0.0 if x <= 0 else norm_cdf((math.log(x) - mu) / sigma)

    return pdf, cdf, lambda p: math.exp(mu + sigma * norm_ppf(p))


def _bisect(cdf, lo: float, hi: float, p: float) -> float:
    for _ in range(300):
        mid = 0.5 * (lo + hi)
        if mid <= lo or mid >= hi:
            break
        if cdf(mid) < p:
            lo = mid
        else:
            hi = mid
    return 0.5 * (lo + hi)


def beta(a: float, b: float):
    def pdf(x):
        if x <= 0.0 or x >= 1.0:
            return 0.0
        return math.exp((a - 1.0) * math.log(x) + (b - 1.0) * math.log(1.0 - x) - lbeta(a, b))

    def cdf(x):
        return betainc(a, b, x)

    return pdf, cdf, lambda p: _bisect(cdf, 0.0, 1.0, p)


def gamma(k: float, theta: float):
    def pdf(x):
        if x <= 0.0:
            return 0.0
        return math.exp((k - 1.0) * math.log(x) - x / theta - lgamma(k) - k * math.log(theta))

    def cdf(x):
        return gammainc_p(k, x / theta)

    def ppf(p):
        hi = k * theta + 10.0 * math.sqrt(k) * theta
        while cdf(hi) < p:
            hi *= 2.0
        return _bisect(cdf, 0.0, hi, p)

    return pdf, cdf, ppf


def poisson(lam: float):
    def pmf(k):
        return 0.0 if k < 0 else math.exp(-lam + k * math.log(lam) - lgamma(k + 1.0))

    def cdf(k):
        return 0.0 if k < 0 else gammainc_q(math.floor(k) + 1.0, lam)

    def ppf(p):
        k = 0
        while cdf(k) < p:
            k += 1
        return k

    return pmf, cdf, ppf

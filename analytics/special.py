"""Special functions using only exp, log, sqrt, abs (all available in JS): lgamma, regularized incomplete gamma and beta.

Specified so the TypeScript port is a line-for-line port. Accuracy about 1e-14 relative.
"""
from __future__ import annotations

import math

_LANCZOS = (0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
            12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7)
_HALF_LN_2PI = 0.9189385332046727  # 0.5 * ln(2 pi)
EPS = 1e-16
TINY = 1e-300


def lgamma(x: float) -> float:
    """ln Gamma(x) for x > 0 (Lanczos g=7, n=9). x < 0.5 uses lgamma(x) = lgamma(x+1) - ln x."""
    if x < 0.5:
        return lgamma(x + 1.0) - math.log(x)
    x -= 1.0
    a = _LANCZOS[0]
    t = x + 7.5
    for i in range(1, 9):
        a += _LANCZOS[i] / (x + i)
    return _HALF_LN_2PI + (x + 0.5) * math.log(t) - t + math.log(a)


def lbeta(a: float, b: float) -> float:
    return lgamma(a) + lgamma(b) - lgamma(a + b)


def gammainc_p(a: float, x: float) -> float:
    """Regularized lower incomplete gamma P(a, x)."""
    if x <= 0.0:
        return 0.0
    if x < a + 1.0:
        return _gser(a, x)
    return 1.0 - _gcf(a, x)


def gammainc_q(a: float, x: float) -> float:
    """Regularized upper incomplete gamma Q(a, x) = 1 - P(a, x)."""
    if x <= 0.0:
        return 1.0
    if x < a + 1.0:
        return 1.0 - _gser(a, x)
    return _gcf(a, x)


def _gser(a: float, x: float) -> float:
    term = 1.0 / a
    s = term
    ap = a
    for _ in range(100000):
        ap += 1.0
        term *= x / ap
        s += term
        if abs(term) < abs(s) * EPS:
            break
    return s * math.exp(-x + a * math.log(x) - lgamma(a))


def _gcf(a: float, x: float) -> float:
    b = x + 1.0 - a
    c = 1.0 / TINY
    d = 1.0 / b
    h = d
    for i in range(1, 100000):
        an = -i * (i - a)
        b += 2.0
        d = an * d + b
        if abs(d) < TINY:
            d = TINY
        c = b + an / c
        if abs(c) < TINY:
            c = TINY
        d = 1.0 / d
        de = d * c
        h *= de
        if abs(de - 1.0) < EPS:
            break
    return math.exp(-x + a * math.log(x) - lgamma(a)) * h


def betainc(a: float, b: float, x: float) -> float:
    """Regularized incomplete beta I_x(a, b) (continued fraction, modified Lentz)."""
    if x <= 0.0:
        return 0.0
    if x >= 1.0:
        return 1.0
    lead = math.exp(a * math.log(x) + b * math.log(1.0 - x) - lbeta(a, b))
    if x < (a + 1.0) / (a + b + 2.0):
        return lead * _betacf(a, b, x) / a
    return 1.0 - lead * _betacf(b, a, 1.0 - x) / b


def _betacf(a: float, b: float, x: float) -> float:
    qab, qap, qam = a + b, a + 1.0, a - 1.0
    c = 1.0
    d = 1.0 - qab * x / qap
    if abs(d) < TINY:
        d = TINY
    d = 1.0 / d
    h = d
    for m in range(1, 100000):
        m2 = 2 * m
        aa = m * (b - m) * x / ((qam + m2) * (a + m2))
        d = 1.0 + aa * d
        if abs(d) < TINY:
            d = TINY
        c = 1.0 + aa / c
        if abs(c) < TINY:
            c = TINY
        d = 1.0 / d
        h *= d * c
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))
        d = 1.0 + aa * d
        if abs(d) < TINY:
            d = TINY
        c = 1.0 + aa / c
        if abs(c) < TINY:
            c = TINY
        d = 1.0 / d
        de = d * c
        h *= de
        if abs(de - 1.0) < EPS:
            break
    return h

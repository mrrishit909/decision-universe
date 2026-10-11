"""Two-objective production-planning LP solved with HiGHS (highspy); Pareto front by the epsilon-constraint method.

max profit = c1 . x      min emissions = c2 . x      s.t.  A x <= b,  0 <= x <= u,  sum(x) >= q_min   (minimum total output contract)
Anchors (lexicographic, so both are nondominated): E_hi = emissions at the max-profit solution with emissions minimised second;
E_lo = emissions at the min-emission solution (profit maximised second). Epsilon grid: eps_k = E_lo + k/K (E_hi - E_lo), k = 0..K.
Each front point solves: max profit s.t. emissions <= eps_k.
"""
from __future__ import annotations

import numpy as np
import highspy

PROBLEM = {
    "products": ["Standard", "Premium", "Eco", "Luxury", "Bulk"],
    "profit": [40.0, 55.0, 30.0, 70.0, 45.0],
    "emissions": [8.0, 12.0, 4.0, 20.0, 9.0],
    "resources": ["labor_hours", "machine_hours", "material_units"],
    "A": [[2.0, 3.0, 1.0, 4.0, 2.5], [1.0, 2.0, 2.0, 3.0, 1.0], [3.0, 2.0, 1.0, 4.0, 2.0]],
    "b": [220.0, 160.0, 260.0],
    "upper": [50.0, 40.0, 60.0, 30.0, 45.0],
    "q_min": 60.0,
}


def solve(c: list[float], A: list[list[float]], b: list[float], upper: list[float], sense: int) -> tuple[float, list[float]]:
    """sense +1 = maximise c.x, -1 = minimise. Rows are A x <= b (finite rhs). Returns (objective, x)."""
    n = len(c)
    h = highspy.Highs()
    h.setOptionValue("output_flag", False)
    inf = highspy.kHighsInf
    for j in range(n):
        h.addVar(0.0, upper[j])
    h.changeColsCost(n, np.arange(n, dtype=np.int32), np.array(c, dtype=float))
    for row, rhs in zip(A, b):
        h.addRow(-inf, rhs, n, np.arange(n, dtype=np.int32), np.array(row, dtype=float))
    h.changeObjectiveSense(highspy.ObjSense.kMaximize if sense > 0 else highspy.ObjSense.kMinimize)
    h.run()
    if h.getModelStatus() != highspy.HighsModelStatus.kOptimal:
        raise RuntimeError(f"HiGHS status {h.getModelStatus()}")
    x = list(h.getSolution().col_value)
    return float(h.getInfo().objective_function_value), x


def with_rows(p: dict, extra_A=(), extra_b=()):
    A = [list(r) for r in p["A"]] + [[-1.0] * len(p["profit"])] + [list(r) for r in extra_A]
    b = list(p["b"]) + [-p["q_min"]] + list(extra_b)
    return A, b


def lexi(p: dict, first: str, extra_A=(), extra_b=()) -> dict:
    """first = 'profit' (max, then min emissions) or 'emissions' (min, then max profit)."""
    A, b = with_rows(p, extra_A, extra_b)
    pr, em = p["profit"], p["emissions"]
    if first == "profit":
        v1, _ = solve(pr, A, b, p["upper"], +1)
        A2, b2 = A + [[-v for v in pr]], b + [-v1 + 1e-9]  # profit >= v1 - 1e-9
        v2, x = solve(em, A2, b2, p["upper"], -1)
    else:
        v1, _ = solve(em, A, b, p["upper"], -1)
        A2, b2 = A + [list(em)], b + [v1 + 1e-9]
        v2, x = solve(pr, A2, b2, p["upper"], +1)
    xs = np.array(x)
    return {"profit": float(np.dot(pr, xs)), "emissions": float(np.dot(em, xs)), "x": x}


def front(p: dict, K: int, labor: float | None = None) -> dict:
    pp = dict(p, b=[labor if labor is not None else p["b"][0]] + list(p["b"][1:]))
    hi, lo = lexi(pp, "profit"), lexi(pp, "emissions")
    pts = []
    for k in range(K + 1):
        eps = lo["emissions"] + k / K * (hi["emissions"] - lo["emissions"])
        A, b = with_rows(pp, [pp["emissions"]], [eps])
        obj, x = solve(pp["profit"], A, b, pp["upper"], +1)
        xs = np.array(x)
        pts.append({"eps": eps, "profit": obj, "emissions": float(np.dot(pp["emissions"], xs)), "x": x})
    return {"labor": pp["b"][0], "anchor_max_profit": hi, "anchor_min_emissions": lo, "points": pts}


def _g(v: float) -> str:
    return f"{v:.10g}"  # JS: Number(v.toPrecision(10)).toString(); all values here are 0 or in [1e-4, 1e10)


def _terms(coefs: list[float]) -> str:
    out = [("- " if c < 0 else "+ ") + f"{_g(abs(c))} x{j}" for j, c in enumerate(coefs) if c != 0]
    s = " ".join(out)
    return s[2:] if s.startswith("+ ") else s


def lp_text(p: dict, labor: float, eps: float) -> str:
    """CPLEX LP text of: max profit s.t. resource rows (labor rhs = `labor`), minimum output, emissions <= eps, 0 <= x <= upper.
    Row order: r0 labor, r1 machine, r2 material, minout (-sum x <= -q_min), em (emissions <= eps). Variables x0..x4. Numbers %.10g. Lines end with LF."""
    b = [labor] + list(p["b"][1:])
    n = len(p["profit"])
    L = ["Maximize", " obj: " + _terms(p["profit"]), "Subject To"]
    for i, (row, rhs) in enumerate(zip(p["A"], b)):
        L.append(f" r{i}: {_terms(row)} <= {_g(rhs)}")
    L.append(f" minout: {_terms([-1.0] * n)} <= {_g(-p['q_min'])}")
    L.append(f" em: {_terms(p['emissions'])} <= {_g(eps)}")
    L.append("Bounds")
    L += [f" 0 <= x{j} <= {_g(u)}" for j, u in enumerate(p["upper"])]
    L.append("End")
    return "\n".join(L) + "\n"


def solve_text(text: str) -> tuple[str, float]:
    import os, tempfile
    with tempfile.NamedTemporaryFile("w", suffix=".lp", delete=False) as f:
        f.write(text)
    try:
        h = highspy.Highs()
        h.setOptionValue("output_flag", False)
        h.readModel(f.name)
        h.run()
        return h.modelStatusToString(h.getModelStatus()), float(h.getInfo().objective_function_value)
    finally:
        os.unlink(f.name)

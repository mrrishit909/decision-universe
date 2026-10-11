"""Minimal-change MODEL counterfactual search (module 9). Not a causal claim: it asks what input change flips THIS model's output.

Actionable features and candidate values (exhaustive grid, nested in this order):
  duration in {6,9,12,15,18,24,30,36,42,48,60,72} U {current};  amount multiplier in {0.4,...,1.0} (amount' = floor(amount*mult + 0.5));
  installment_rate in {1,2,3,4};  checking in {A11,A12,A13,A14};  savings in {A61..A65}.
Immutable: age, credit_history, employment, housing, existing_credits.
Cost = |d duration|/sd_duration + |d log amount|/sd_log_amount + |d installment|/sd_installment + [checking changed] + [savings changed]
  (sd = training-set standard deviation published in the model; each categorical change costs 1).
Feasible when p_bad <= target. Result = minimum cost; ties = first in enumeration order (strict improvement required, tolerance 1e-12).
"""
from __future__ import annotations

import math

from analytics.credit import CAT9, NUM9, p_bad9

DURATIONS = [6, 9, 12, 15, 18, 24, 30, 36, 42, 48, 60, 72]
MULTS = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
INSTALL = [1, 2, 3, 4]


def search(model: dict, row: dict, target: float) -> dict:
    sd = dict(zip(NUM9, model["sd"]))
    base_p = p_bad9(model, row)
    best = None
    durs = sorted(set(DURATIONS + [int(row["duration"])]))
    for d in durs:
        for mult in MULTS:
            amt = math.floor(row["amount"] * mult + 0.5)
            for inst in INSTALL:
                for chk in CAT9["checking"]:
                    for sav in CAT9["savings"]:
                        cand = dict(row, duration=d, amount=amt, installment_rate=inst, checking=chk, savings=sav)
                        p = p_bad9(model, cand)
                        if p > target:
                            continue
                        cost = (abs(d - row["duration"]) / sd["duration"] + abs(math.log(amt) - math.log(row["amount"])) / sd["log_amount"]
                                + abs(inst - row["installment_rate"]) / sd["installment_rate"] + (chk != row["checking"]) + (sav != row["savings"]))
                        if best is None or cost < best["cost"] - 1e-12:
                            best = {"cost": cost, "p_bad": p, "changes": {k: [row[k], cand[k]] for k in ("duration", "amount", "installment_rate", "checking", "savings") if cand[k] != row[k]}}
    return {"target": target, "base_p_bad": base_p, "found": best is not None, **({"cost": best["cost"], "p_bad_after": best["p_bad"], "changes": best["changes"], "n_changed": len(best["changes"])} if best else {})}

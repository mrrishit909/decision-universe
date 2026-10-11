"""JSON Schemas (draft 2020-12) for every published artifact, generated into data/contracts/*.schema.json.

    uv run python -m pipelines.contracts
"""
from __future__ import annotations

import json

from pipelines.common import CONTRACTS

TAG = {"type": "string", "pattern": "^(OBSERVED|DERIVED|PREDICTED|SIMULATED|SYNTHETIC)(/(OBSERVED|DERIVED|PREDICTED|SIMULATED|SYNTHETIC))*$"}
S, I, N, B = {"type": "string"}, {"type": "integer"}, {"type": "number"}, {"type": "boolean"}
NN = {"type": ["number", "null"]}
ANY = {}


def obj(props: dict, required: list[str] | None = None, extra: bool = False) -> dict:
    return {"type": "object", "properties": props, "required": list(props) if required is None else required, "additionalProperties": extra}


def arr(item: dict, lo: int | None = None, hi: int | None = None) -> dict:
    a: dict = {"type": "array", "items": item}
    if lo is not None:
        a["minItems"] = lo
    if hi is not None:
        a["maxItems"] = hi
    return a


def top(title: str, props: dict, required: list[str] | None = None) -> dict:
    p = {"schema_version": {"const": "v1"}, "generated_at": S, "tags": {"type": "object", "additionalProperties": TAG, "minProperties": 1}, **props}
    r = ["schema_version", "generated_at", "tags"] + (list(props) if required is None else required)
    return {"$schema": "https://json-schema.org/draft/2020-12/schema", "title": title, "type": "object", "properties": p, "required": r, "additionalProperties": False}


NUMS = arr(N)
TOL = obj({"abs": N, "rel": N, "note": S})  # comparison rule: |got - want| <= abs + rel * |want|
FREE = {"type": "object"}  # documented in DATA_CONTRACTS.md; keys asserted by tests, not by the schema


def schemas() -> dict[str, dict]:
    o: dict[str, dict] = {}
    o["meta"] = top("Meta", {
        "project": S, "tagline": S, "seed": I,
        "sources": arr(obj({"id": S, "name": S, "url": S, "retrieved_at_utc": S, "sha256": S, "md5": S, "bytes": I, "licence": S, "use": S, "tag": TAG})),
        "citations": arr(S, 1), "licence_note": S, "limitations": arr(S, 1),
        "modules": arr(obj({"id": S, "name": S, "artifact": S, "tag": TAG, "reference": S}), 10, 10),
        "artifacts": arr(S, 1), "artifact_bytes": FREE, "environment": FREE,
    })
    o["facts"] = top("Facts", {"facts": {"type": "object", "additionalProperties": obj({"value": ANY, "unit": S, "tag": TAG, "note": S}, ["value", "unit", "tag"])}})
    o["m01_distributions"] = top("Distributions", {
        "spec": FREE, "tolerance": TOL,
        "cases": arr(obj({"dist": S, "params": FREE, "x": NUMS, "pdf": NUMS, "cdf": NUMS, "p": NUMS, "quantile": NUMS, "discrete": B}), 5),
        "checks": FREE,
    })
    o["m02_sampling"] = top("Sampling", {
        "spec": FREE, "seed": I, "first_1000_u32": arr(I, 1000, 1000), "uniform_first": NUMS, "normal_first": NUMS,
        "seed_vectors": arr(obj({"seed": I, "first_16_u32": arr(I, 16, 16)}), 3), "tolerance": TOL, "moments": FREE,
    })
    o["m03_montecarlo"] = top("Monte Carlo", {
        "spec": FREE, "environment": FREE, "run": FREE, "histogram": FREE, "convergence": arr(FREE, 4),
        "vectors": arr(obj({"seed": I, "n": I, "mean": N, "sd": N, "se": N, "ci95_lo": N, "ci95_hi": N, "p_loss": N, "p05": N, "p50": N, "p95": N, "first_5": NUMS}), 3), "tolerance": TOL,
    })
    o["m04_bayes"] = top("Bayesian updating", {
        "spec": FREE, "beta_binomial": arr(FREE, 8), "normal_normal": arr(FREE, 6), "sequential": FREE, "coverage": FREE, "tolerance": TOL,
    })
    o["m05_forecast"] = top("Forecast intervals", {
        "spec": FREE, "series": FREE, "fits": FREE, "intervals": FREE, "coverage": FREE, "vectors": arr(FREE, 3), "tolerance": TOL,
    })
    o["m06_credit"] = top("Cost-sensitive thresholds", {
        "spec": FREE, "dataset": FREE, "model": FREE, "test": obj({"p_bad": NUMS, "y_bad": arr(I)}), "curve": FREE,
        "optimum": FREE, "repeated_splits": FREE, "reliability": FREE, "vectors": arr(FREE, 5), "tolerance": TOL,
    })
    o["m07_pareto"] = top("LP and Pareto", {
        "spec": FREE, "problem": FREE, "anchors": FREE, "front": arr(FREE, 5), "vectors": arr(FREE, 5), "tolerance": TOL,
    })
    o["m08_sensitivity"] = top("Sensitivity", {
        "spec": FREE, "analytic": FREE, "quadrature_check": FREE, "sobol": arr(FREE, 3), "oat": FREE, "vectors": arr(FREE, 2), "tolerance": TOL,
    })
    o["m09_counterfactual"] = top("Counterfactuals", {
        "spec": FREE, "model": FREE, "features": FREE, "applicants": arr(FREE, 6), "results": arr(FREE, 6), "tolerance": TOL,
    })
    o["m10_causal"] = top("Causal inference", {
        "spec": FREE, "dag": FREE, "assumptions": arr(S, 3), "nsw": FREE, "synthetic": FREE, "vectors": arr(FREE, 3), "tolerance": TOL,
    })
    o["validation"] = top("Validation", {"checks": arr(obj({"module": S, "name": S, "value": ANY, "bound": ANY, "passed": B})), "failures_recorded": arr(S)})
    return o


def main() -> None:
    CONTRACTS.mkdir(parents=True, exist_ok=True)
    for name, sch in schemas().items():
        (CONTRACTS / f"{name}.schema.json").write_text(json.dumps(sch, indent=1, sort_keys=True) + "\n")
    print(f"wrote {len(schemas())} schemas")


if __name__ == "__main__":
    main()

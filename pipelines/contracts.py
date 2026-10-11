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


SHA = {"type": "string", "pattern": "^[0-9a-f]{64}$"}
DECISION = obj({"id": S, "label": S, "overrides": FREE, "run": FREE, "payback_share_8y": N, "median_payback_year": NN, "paid_back_n": I, "vs_build_now": FREE, "vectors": arr(FREE, 6, 6)})
PATH = obj({"index": I, "investment": N, "npv": N, "payback_year": NN, "recovered": arr(N, 9, 9)})
FACT_IDS = ["mc_payback_share_8y", "mc_payback_share_8y_phased", "mc_payback_share_8y_delay_one_year", "mc_median_payback_year", "mc_median_payback_year_phased", "mc_median_payback_year_delay_one_year",
            "mc_se", "mc_n", "mc_mean_n100000", "validation_passed", "validation_total", "parity_vectors_total", "nsw_ipw_ess_controls"]
ESTIMATOR = obj({"name": S, "short": S, "assumptions": arr(I, 1), "note": S})


def schemas() -> dict[str, dict]:
    o: dict[str, dict] = {}
    o["meta"] = top("Meta", {
        "project": S, "tagline": S, "seed": I,
        "sources": arr(obj({"id": S, "name": S, "url": S, "retrieved_at_utc": S, "sha256": S, "md5": S, "bytes": I, "licence": S, "use": S, "tag": TAG})),
        "citations": arr(S, 1), "licence_note": S, "limitations": arr(S, 1),
        "modules": arr(obj({"id": S, "name": S, "artifact": S, "tag": TAG, "reference": S}), 10, 10),
        "artifacts": arr(S, 1), "artifact_bytes": FREE, "environment": FREE,
    })
    o["facts"] = top("Facts", {"facts": {"type": "object", "additionalProperties": obj({"value": ANY, "unit": S, "tag": TAG, "note": S}, ["value", "unit", "tag"]), "required": FACT_IDS}})
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
        "spec": FREE, "environment": obj({"decisions": obj({"presets": arr(DECISION, 3, 3), "crn_rule": S, "lab_ranges": FREE})}, ["decisions"], True),
        "paths": obj({"seed": I, "n_futures": I, "horizon_years": I, "draw_order": arr(S, 5, 5), "draws": arr(arr(N, 5, 5), 16, 16), "decisions": obj({"build_now": arr(PATH, 16, 16), "phased": arr(PATH, 16, 16), "delay_one_year": arr(PATH, 16, 16)})}),
        "run": FREE, "histogram": FREE, "convergence": arr(FREE, 4),
        "vectors": arr(obj({"seed": I, "n": I, "mean": N, "sd": N, "se": N, "ci95_lo": N, "ci95_hi": N, "p_loss": N, "p05": N, "p50": N, "p95": N, "first_5": NUMS}), 3), "tolerance": TOL,
    })
    o["m04_bayes"] = top("Bayesian updating", {
        "spec": FREE, "beta_binomial": arr(FREE, 8), "normal_normal": arr(FREE, 6), "sequential": FREE, "coverage": FREE, "tolerance": TOL,
    })
    o["m05_forecast"] = top("Forecast intervals", {
        "spec": FREE, "series": FREE, "fits": FREE, "intervals": obj({"kind": {"const": "prediction"}}, ["kind"], True), "coverage": FREE, "vectors": arr(FREE, 3), "tolerance": TOL,
    })
    o["m06_credit"] = top("Cost-sensitive thresholds", {
        "spec": FREE, "dataset": FREE, "model": FREE, "test": obj({"p_bad": NUMS, "y_bad": arr(I)}), "curve": FREE,
        "optimum": FREE, "repeated_splits": FREE, "reliability": FREE, "vectors": arr(FREE, 5), "tolerance": TOL,
    })
    o["m07_pareto"] = top("LP and Pareto", {
        "spec": FREE, "problem": FREE, "anchors": FREE, "front": arr(obj({"eps": N, "profit": N, "emissions": N, "x": NUMS, "status": {"enum": ["Optimal"]}, "lp_text_sha256": SHA}, extra=True), 5),
        "lp_text": obj({"format": S, "builder": S, "example_point": I, "example": S, "example_sha256": SHA}), "compromise_index": I, "vectors": arr(FREE, 4), "tolerance": TOL,
    })
    o["m08_sensitivity"] = top("Sensitivity", {
        "spec": FREE, "analytic": FREE, "quadrature_check": FREE, "sobol": arr(FREE, 3), "oat": FREE, "vectors": arr(FREE, 2), "tolerance": TOL,
    })
    o["m09_counterfactual"] = top("Counterfactuals", {
        "spec": FREE, "model": FREE, "features": obj({"display": obj({"features": FREE, "categories": FREE, "source": S})}, ["display"], True), "applicants": arr(FREE, 6), "results": arr(FREE, 6), "tolerance": TOL,
    })
    o["m10_causal"] = top("Causal inference", {
        "spec": FREE, "dag": FREE, "assumptions": arr(S, 3), "nsw": obj({"estimator_info": obj({"naive": ESTIMATOR, "ols_coef": ESTIMATOR, "ra_att": ESTIMATOR, "ipw_att": ESTIMATOR})}, ["estimator_info"], True), "synthetic": FREE, "vectors": arr(FREE, 3), "tolerance": TOL,
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

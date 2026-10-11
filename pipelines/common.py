"""Paths, canonical JSON, hashing, rounding shared by the pipeline and tests."""
from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
MANIFESTS = ROOT / "data" / "manifests"
CONTRACTS = ROOT / "data" / "contracts"
PUBLIC = ROOT / "site" / "public" / "data"

SEED = 20261011  # master seed; every module derives its seeds from this or a documented constant


def sha256_file(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def md5_file(p: Path) -> str:
    return hashlib.md5(p.read_bytes()).hexdigest()


def clean(o):
    """Recursively convert numpy scalars/arrays to plain Python and reject NaN/inf."""
    import numpy as np
    if isinstance(o, dict):
        return {str(k): clean(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [clean(v) for v in o]
    if isinstance(o, np.ndarray):
        return clean(o.tolist())
    if isinstance(o, np.generic):
        return clean(o.item())
    if isinstance(o, float) and not math.isfinite(o):
        raise ValueError("non-finite float in artifact")
    return o


def dumps(obj) -> str:
    """Canonical JSON: sorted keys, compact separators, no NaN."""
    return json.dumps(clean(obj), sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)


def r(x: float, d: int = 10) -> float:
    """Publish rounding: half-up to d decimals, floor(x*10^d+0.5)/10^d (the TS side mirrors this)."""
    return math.floor(x * 10**d + 0.5) / 10**d


def rl(xs, d: int = 10):
    return [r(float(x), d) for x in xs]


def write_artifact(name: str, payload: dict) -> Path:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    body = {"schema_version": "v1", "generated_at": "2026-10-11T00:00:00Z", **payload}  # fixed stamp keeps artifacts byte-reproducible
    p = PUBLIC / f"{name}.json"
    p.write_text(dumps(body))
    return p

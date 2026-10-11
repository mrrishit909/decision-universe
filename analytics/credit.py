"""German Credit loading, the calibrated cost-sensitive classifier (module 6) and the interpretable model (module 9).

Cost matrix (UCI, published): bad customer classified good costs 5; good classified bad costs 1.
Decision rule: reject (predict bad) when p_bad > t. Cost(t) = (5 * FN + 1 * FP) / n with FN = bad accepted, FP = good rejected.
Calibrated cost-optimal threshold when probabilities are calibrated: t* = c_fp / (c_fp + c_fn) = 1/6.
Personal status/sex (A9x) and foreign worker are NOT used as features by design.
"""
from __future__ import annotations

import math

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss, log_loss, roc_auc_score

from pipelines.common import RAW

COLS = ["checking", "duration", "credit_history", "purpose", "amount", "savings", "employment", "installment_rate", "personal_status",
        "other_debtors", "residence_since", "property", "age", "other_installment", "housing", "existing_credits", "job", "people_liable",
        "telephone", "foreign_worker", "class"]
NUM6 = ["duration", "log_amount", "installment_rate", "residence_since", "age", "existing_credits", "people_liable"]
CAT6 = ["checking", "credit_history", "purpose", "savings", "employment", "other_debtors", "property", "other_installment", "housing", "job", "telephone"]
NUM9 = ["duration", "log_amount", "installment_rate", "age", "existing_credits"]
CAT9 = {"checking": ["A11", "A12", "A13", "A14"], "savings": ["A61", "A62", "A63", "A64", "A65"], "credit_history": ["A30", "A31", "A32", "A33", "A34"],
        "employment": ["A71", "A72", "A73", "A74", "A75"], "housing": ["A151", "A152", "A153"]}
C_FN, C_FP = 5.0, 1.0  # bad accepted, good rejected


def load() -> pd.DataFrame:
    df = pd.read_csv(RAW / "german.data", sep=" ", header=None, names=COLS)
    df["y_bad"] = (df["class"] == 2).astype(int)
    df["log_amount"] = np.log(df["amount"])
    return df


def split(n: int, seed: int, y: np.ndarray, n_train=600, n_cal=150):
    """Stratified split into train/calibration/test (600/150/250): shuffle each class with RandomState(seed), deal proportionally."""
    rs = np.random.RandomState(seed)
    idx = {c: rs.permutation(np.where(y == c)[0]) for c in (0, 1)}
    parts = {"train": [], "cal": [], "test": []}
    for c in (0, 1):
        m = len(idx[c])
        a, b = round(m * n_train / n), round(m * (n_train + n_cal) / n)
        parts["train"] += list(idx[c][:a]); parts["cal"] += list(idx[c][a:b]); parts["test"] += list(idx[c][b:])
    return {k: np.sort(np.array(v)) for k, v in parts.items()}


def design6(df: pd.DataFrame, train_idx) -> tuple[np.ndarray, dict]:
    mu = df.loc[train_idx, NUM6].mean(); sd = df.loc[train_idx, NUM6].std(ddof=0)
    num = ((df[NUM6] - mu) / sd).to_numpy()
    cat = pd.get_dummies(df[CAT6].astype(str), dtype=float)
    return np.hstack([num, cat.to_numpy()]), {"names": NUM6 + list(cat.columns)}


def logit(p):
    p = np.clip(p, 1e-12, 1 - 1e-12)
    return np.log(p / (1 - p))


def fit_calibrated(df: pd.DataFrame, parts: dict, C: float = 0.1):
    X, info = design6(df, parts["train"])
    y = df["y_bad"].to_numpy()
    m = LogisticRegression(C=C, max_iter=2000).fit(X[parts["train"]], y[parts["train"]])
    raw = lambda ix: m.predict_proba(X[ix])[:, 1]
    platt = LogisticRegression(C=1e6, max_iter=1000).fit(logit(raw(parts["cal"])).reshape(-1, 1), y[parts["cal"]])
    cal = lambda ix: platt.predict_proba(logit(raw(ix)).reshape(-1, 1))[:, 1]
    return {"raw": raw, "cal": cal, "platt_a": float(platt.coef_[0, 0]), "platt_b": float(platt.intercept_[0]), "model": m, "info": info}


def cost_at(p: np.ndarray, y: np.ndarray, t: float, c_fn: float = C_FN, c_fp: float = C_FP) -> dict:
    rej = p > t
    fn = int(np.sum((~rej) & (y == 1))); fp = int(np.sum(rej & (y == 0)))
    tp = int(np.sum(rej & (y == 1))); tn = int(np.sum((~rej) & (y == 0)))
    return {"tp": tp, "fp": fp, "fn": fn, "tn": tn, "cost": (c_fn * fn + c_fp * fp) / len(y)}


THRESHOLDS = [i / 100 for i in range(101)]


def argmin_threshold(p, y, c_fn=C_FN, c_fp=C_FP) -> tuple[float, float]:
    best_t, best_c = None, None
    for t in THRESHOLDS:
        c = cost_at(p, y, t, c_fn, c_fp)["cost"]
        if best_c is None or c < best_c - 1e-12:
            best_t, best_c = t, c
    return best_t, best_c


def metrics(p, y) -> dict:
    return {"auc": float(roc_auc_score(y, p)), "brier": float(brier_score_loss(y, p)), "log_loss": float(log_loss(y, p))}


# ---- module 9: interpretable model -------------------------------------------------------------------
def fit_interpretable(df: pd.DataFrame, train_idx) -> dict:
    mu = df.loc[train_idx, NUM9].mean(); sd = df.loc[train_idx, NUM9].std(ddof=0)
    names = list(NUM9) + [f"{c}={lv}" for c, lvs in CAT9.items() for lv in lvs]

    def X(d):
        num = ((d[NUM9] - mu) / sd).to_numpy()
        oh = np.column_stack([(d[c] == lv).astype(float).to_numpy() for c, lvs in CAT9.items() for lv in lvs])
        return np.hstack([num, oh])

    y = df["y_bad"].to_numpy()
    m = LogisticRegression(C=0.5, max_iter=2000).fit(X(df.loc[train_idx]), y[train_idx])
    return {"names": names, "coef": m.coef_[0].tolist(), "intercept": float(m.intercept_[0]), "mean": mu.tolist(), "sd": sd.tolist(), "X": X, "model": m}


def p_bad9(model: dict, row: dict) -> float:
    z = model["intercept"]
    for i, f in enumerate(NUM9):
        v = math.log(row["amount"]) if f == "log_amount" else row[f]
        z += model["coef"][i] * (v - model["mean"][i]) / model["sd"][i]
    k = len(NUM9)
    for c, lvs in CAT9.items():
        for lv in lvs:
            if row[c] == lv:
                z += model["coef"][k]
            k += 1
    return 1.0 / (1.0 + math.exp(-z))

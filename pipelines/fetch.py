"""Download raw sources into data/raw (gitignored) and write data/manifests/raw_manifest.json (sha256, md5, bytes).

    uv run python -m pipelines.fetch
"""
from __future__ import annotations

import json
import zipfile
from datetime import datetime, timezone

import requests

from pipelines.common import MANIFESTS, RAW, md5_file, sha256_file

SOURCES = {
    "nsw_dw.dta": "https://users.nber.org/~rdehejia/data/nsw_dw.dta",
    "psid_controls.dta": "https://users.nber.org/~rdehejia/data/psid_controls.dta",
    "german_credit.zip": "https://archive.ics.uci.edu/static/public/144/statlog+german+credit+data.zip",
}
EXPECT_MD5 = {"nsw_dw.dta": "e3367ddd449e25cb4c54c04263978800"}


def main() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    MANIFESTS.mkdir(parents=True, exist_ok=True)
    out = {}
    for name, url in SOURCES.items():
        p = RAW / name
        if not p.exists():
            resp = requests.get(url, timeout=60)
            resp.raise_for_status()
            p.write_bytes(resp.content)
        m = md5_file(p)
        if name in EXPECT_MD5 and m != EXPECT_MD5[name]:
            raise SystemExit(f"md5 mismatch for {name}: {m}")
        out[name] = {"url": url, "bytes": p.stat().st_size, "sha256": sha256_file(p), "md5": m}
    with zipfile.ZipFile(RAW / "german_credit.zip") as z:
        z.extract("german.data", RAW)
    g = RAW / "german.data"
    out["german.data"] = {"url": SOURCES["german_credit.zip"] + "#german.data", "bytes": g.stat().st_size, "sha256": sha256_file(g), "md5": md5_file(g)}
    (MANIFESTS / "raw_manifest.json").write_text(json.dumps({"retrieved_at_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"), "files": out}, indent=1, sort_keys=True))
    print(json.dumps(out, indent=1))


if __name__ == "__main__":
    main()

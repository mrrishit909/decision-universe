# Architecture (data layer)

`pipelines.fetch` (raw to `data/raw`, hashes in `data/manifests`) -> `pipelines.contracts` (schemas) -> `pipelines.build` (calls `analytics/*`, writes `site/public/data/*.json` + `validation.json`, `meta.json`, `facts.json`) -> `pipelines.validate_artifacts`.
`analytics/` holds the Python reference implementations (JS-portable: only exp/log/sqrt/sin/cos in special functions and the PRNG). The browser (separate task) ports them to TypeScript in a worker and checks against each artifact's `vectors`.
Seeds: master 20261011 (`pipelines.common.SEED`); derived seeds are documented per artifact.

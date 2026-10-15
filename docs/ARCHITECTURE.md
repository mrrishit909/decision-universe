# Architecture (data layer)

`pipelines.fetch` (raw to `data/raw`, hashes in `data/manifests`) -> `pipelines.contracts` (schemas) -> `pipelines.build` (calls `analytics/*`, writes `site/public/data/*.json` + `validation.json`, `meta.json`, `facts.json`) -> `pipelines.validate_artifacts`.
`analytics/` holds the Python reference implementations (JS-portable: only exp/log/sqrt/sin/cos in special functions and the PRNG). The browser (separate task) ports them to TypeScript in a worker and checks against each artifact's `vectors`.
Seeds: master 20261011 (`pipelines.common.SEED`); derived seeds are documented per artifact.

## Frontend (`site/`)

- **Scroll shell** shared with the other Data Frontier sites: Lenis, one rAF loop (`motion/loop.ts`), pinned tracks with progress callbacks
  (`scroll/engine.ts`), blur nav. S00 is static HTML in `index.html` so the LCP headline paints before any JS.
- **Model layer** (`src/model`): TypeScript ports of the ten reference modules. The PRNG is xoshiro128** seeded by splitmix32 and is
  bit-exact against `m02`. `turn.ts` holds the thread geometry, `runpack.ts` the transferable form of one seeded run, `lab.ts` the ten
  runnable instruments with parity reporting.
- **Workers**: `compute.worker` (runs, u32 stream, bridges, Saltelli, LAB modules; created after first paint, with a labelled main-thread
  fallback) and `highs.worker` (HiGHS-wasm, created at S06 entry or a LAB solve, never before).
- **Rendering**: `app/TurnLayer.tsx` draws the Turn, the PAIR and the waterfall on one fixed Canvas2D using cached `Path2D` unit paths
  (one transform per draw, redraw only on change) plus a 1/4-resolution tinted blurred glow pass. Charts that are not threads (belief column,
  credit column, Pareto, Sobol, estimators, DAG, forecast) are inline SVG so they are accessible and testable. All text and controls are DOM.
- **State**: `app/turnView.ts` (one store: mode, camera, decisions, seed, n, pack, hovered); `state/compute.ts`, `state/highs.ts`.

### Deviations from MOTION_SYSTEM and VISUAL_DESIGN (decided during the build)

- Canvas2D instead of WebGL2 instanced lines: with 500 to 1,200 drawn threads the cached `Path2D` approach is cheap and keeps one code path
  for every tier. The tier cap is by viewport class (D 1,200, T 800, M 500), not by measured frame time.
- Charts are SVG rather than a second canvas overlay.
- The S04 forecast shows 40 seeded paths from the fitted AR(1) model (live, labelled) and the published interval hairlines; no per-path
  coverage is claimed from them.
- FALL clips a thread's recovered share at 180% of the investment (a handful of the most profitable futures run past the box edge).

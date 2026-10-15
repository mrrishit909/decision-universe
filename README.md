# Decision Universe

**Every Decision Creates a Different Future.** Project 10 of The Data Frontier: ten decision-science instruments (distributions, sampling,
Monte Carlo, Bayes, forecast intervals, cost-sensitive thresholds, LP and Pareto, sensitivity, counterfactuals, causal inference) with Python
reference implementations, published parity vectors, and a browser site that recomputes them live and checks itself against the reference.

**Live site:** https://mrrishit909.github.io/decision-universe/ (see `docs/DEPLOYMENT.md`).

## The site

One form carries it: **the Turn**. Every seeded simulated future of one investment decision is a thread that leaves a single point and winds
clockwise as cash comes back; one full turn is the money back. Change the decision and the *same* worlds re-wind (common random numbers).
Unroll the Turn and time falls as a waterfall. Everything else (credible vs confidence intervals, forecast intervals with counted coverage,
the cost of a mistake, a live HiGHS linear program, Sobol indices, model counterfactuals, an observational estimate beside the randomised
benchmark) is built from the same seeded futures or from real data, and says which.

Honesty tags (visible in the UI): OBSERVED (German Credit, NSW/PSID earnings), DERIVED, PREDICTED, SIMULATED, SYNTHETIC. Live recompute is
labelled `RUNNING IN YOUR BROWSER` with its seed; parity with the Python reference is shown only where a published vector exists.

## Run

```
# data and reference layer
uv sync && uv run python -m pipelines.run_all && uv run pytest -q

# site
cd site && npm ci && npm run typecheck && npm run lint && npm test      # 60 Vitest tests: PRNG bit-exact, ten module parity, Turn geometry
npm run build && node tests/serve.mjs                                  # production preview on :4401
npx playwright test --workers 1                                        # end-to-end, collisions, contrast, axe
```

Docs: `docs/PROBLEM.md`, `DATA_SOURCES.md`, `DATA_CONTRACTS.md`, `METHODOLOGY.md`, `ARCHITECTURE.md`, `VISUAL_DESIGN.md`, `MOTION_SYSTEM.md`,
`TESTING.md`, `LIMITATIONS.md`, `DEPLOYMENT.md`.

## Data and terms

- NSW / PSID earnings (Dehejia and Wahba): NBER, "distributed for attributable non-commercial use (CC by NC)". This non-monetized
  portfolio publishes **derived results only** (estimates, balance tables, aggregates), never the row-level data. Page:
  https://users.nber.org/~rdehejia/nswdata2.html. Papers: LaLonde (1986), Dehejia and Wahba (1999, 2002).
- Statlog German Credit: Hofmann (1994), UCI, https://doi.org/10.24432/C5NC77, CC BY 4.0.
- Solver: HiGHS (WebAssembly build highs-js 1.15.3). PRNG: xoshiro128** (Blackman and Vigna).
- Code licence: not yet chosen (open item for the owner).

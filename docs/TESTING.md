# Testing (data and reference layer)

Run: `uv run pytest -q` (35 tests) and `uv run python -m pipelines.validate_artifacts`.

- Distributions vs scipy (pdf, cdf, quantile, poisson), normalization by quadrature, quantile-cdf round trip.
- PRNG: hand-derived xoshiro vector; independent Node port reproduces the 1000-value artifact, extra seeds, uniforms and normals; KS test on normals.
- Monte Carlo: determinism; empirical coverage of the CI of the mean. Bayes: conjugate formulas vs scipy, vague-prior limit. Forecast: fast vs plain fit agreement.
- LP: HiGHS front vs scipy linprog, strictly monotone. Sensitivity: closed-form Ishigami indices vs 64^3 Gauss-Legendre quadrature (not copied from papers), Saltelli estimates within MC error.
- Credit: cost matrix arithmetic; with calibrated probabilities the argmin threshold is near 1/6. Causal: synthetic recovery; from-scratch Newton logit vs statsmodels.
- Artifacts: JSON Schema validation, 400 KB gzip budget, no U+2014/U+2015, no raw .dta, byte-reproducible rebuild, zero recorded validation failures (44 checks in `validation.json`).

Frontend parity tests (Vitest) are the next task and read the `vectors` in each artifact.

P10-DATA-002 additions: common random numbers and the delay identity (NPV / (1 + r), recovered share shifted one year), published path draws, the LP text SHA-256 rebuilt independently in Node (`tests/parity/lp_text_check.mjs`) and re-solved with HiGHS, plus label, display-name, estimator-info and facts checks.

## Frontend (site/)

- `npm test` (Vitest, 60): PRNG bit-exact for every published seed, distributions, Monte Carlo vectors and paths, Bayes, forecast, cost
  curve, Ishigami and Saltelli, counterfactual search, causal estimators, LP text byte-identical, HiGHS reproducing the 21-point front and the
  labour-hours variants, THE LAB parity (all ten match at the published seed; another seed reports no published vector), Turn geometry and
  the Unroll's polar and cartesian targets.
- `npx playwright test` against the production build: the Turn is the published environment (16 futures per decision, common draws), the
  unit line, the pair and ledgers, live u32 ticks, standard error per n, interval grammar (credible and confidence are separate marks), the
  prediction counter, cost at a threshold, a live HiGHS solve with parity and a forced solver failure with RETRY, estimator gaps beside the
  benchmark, THE LAB at two seeds, worker failure fallback, zero external requests and console errors, a blocked artifact with RETRY and
  recovery, copy rules (no dash characters, no AI or smart or intelligent), whole-document collision walks at six viewports, sideways
  scroll, pixel contrast, axe (motion and reduced motion), reduced motion.
- Visual evidence (screenshots at 1440x900, 768x1024, 390x844) is under `artifacts/evidence/` and was read by the orchestrator.

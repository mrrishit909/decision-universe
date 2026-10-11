# Testing (data and reference layer)

Run: `uv run pytest -q` (32 tests, about 11 s) and `uv run python -m pipelines.validate_artifacts`.

- Distributions vs scipy (pdf, cdf, quantile, poisson), normalization by quadrature, quantile-cdf round trip.
- PRNG: hand-derived xoshiro vector; independent Node port reproduces the 1000-value artifact, extra seeds, uniforms and normals; KS test on normals.
- Monte Carlo: determinism; empirical coverage of the CI of the mean. Bayes: conjugate formulas vs scipy, vague-prior limit. Forecast: fast vs plain fit agreement.
- LP: HiGHS front vs scipy linprog, strictly monotone. Sensitivity: closed-form Ishigami indices vs 64^3 Gauss-Legendre quadrature (not copied from papers), Saltelli estimates within MC error.
- Credit: cost matrix arithmetic; with calibrated probabilities the argmin threshold is near 1/6. Causal: synthetic recovery; from-scratch Newton logit vs statsmodels.
- Artifacts: JSON Schema validation, 400 KB gzip budget, no U+2014/U+2015, no raw .dta, byte-reproducible rebuild, zero recorded validation failures (44 checks in `validation.json`).

Frontend parity tests (Vitest) are the next task and read the `vectors` in each artifact.

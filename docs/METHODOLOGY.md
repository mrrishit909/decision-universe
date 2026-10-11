# Methodology (algorithms the browser port must implement)

Every algorithm is specified in the docstring of its Python reference file under `analytics/`; this page is the index plus the cross-module rules. Tolerance rule: `|got - want| <= abs + rel*|want|`, values in each artifact's `tolerance`.

| Module | Reference | Algorithm summary |
|---|---|---|
| 1 distributions | `analytics/special.py`, `dists.py` | Lanczos (g=7, n=9) lgamma; incomplete gamma by series (x < a+1) or Lentz continued fraction; incomplete beta by Lentz; normal cdf = 1/2 erfc via Q(1/2, z^2/2); normal quantile = Acklam + 2 Halley steps; beta and gamma quantiles by bisection on the cdf (300 halvings max); poisson quantile = smallest k with cdf(k) >= p. Uses only exp, log, sqrt. |
| 2 sampling | `analytics/rng.py` | xoshiro128** seeded by 4 x splitmix32; 53-bit uniform from two u32; Box-Muller normal with a one-value cache. First 1000 u32 for seed 20261011 published; verified by an independent Node port (`tests/parity/rng_check.mjs`). |
| 3 Monte Carlo | `analytics/mc.py` | Fixed draw order per trial, project NPV; mean, sd (n-1), se, normal-approximation 95% CI of the mean, P(loss), type-7 percentiles. |
| 4 Bayes | `analytics/bayes.py` | Beta-binomial and normal-normal (known sigma) conjugate updates. Credible interval = posterior quantiles. Confidence interval = Wilson score (proportion) or z-interval (mean). Always shown as distinct objects. |
| 5 forecast | `analytics/forecast.py` | SES with alpha grid search 0.01..0.99; AR(1) by OLS; analytic Gaussian intervals; coverage study by replication. |
| 6 credit | `analytics/credit.py` | Cost(t) = (5 FN + FP)/n with reject when p_bad > t. Model fit (sklearn) is precomputed; the browser recomputes curve and optimum from published test probabilities. |
| 7 LP/Pareto | `analytics/lp.py` | Epsilon-constraint on a continuous LP, HiGHS. Lexicographic anchors. |
| 8 sensitivity | `analytics/sens.py` | Ishigami A=7, B=0.1; Saltelli sampling with xoshiro; Saltelli 2010 first-order and Jansen total-order estimators; OAT sweeps. |
| 9 counterfactuals | `analytics/counterfactual.py` | Exhaustive minimal-cost grid search over actionable features against a published logistic model. |
| 10 causal | `analytics/causal.py` | Naive, OLS coefficient, regression adjustment (control-outcome imputation), Hajek IPW for the ATT; Newton logistic fit with fixed iterations and ridge 1e-8. |

## Model choices worth knowing
- German Credit: logistic regression, L2 C=0.1, 7 standardized numeric + one-hot categorical features; Platt scaling on a 150-row calibration split; 250-row test split; split seed 20261011. Personal status (sex) and foreign-worker are excluded.
- IPW clips propensities to [0.01, 0.99]. No other trimming.
- NSW covariates (same design for RA, OLS and propensity): age, age^2, education, black, hispanic, married, nodegree, re74, re75, plus zero-earnings indicators for 1974 and 1975 (`pipelines/build.py: design`).
- Bootstrap: 500 resamples, numpy PCG64 seed 20261011, percentile intervals.

## Numeric publishing rule
Numbers are rounded half-up to the stated decimals (10 for parity vectors) with `floor(x*10^d+0.5)/10^d`.

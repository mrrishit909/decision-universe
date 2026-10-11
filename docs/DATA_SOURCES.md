# Data sources

Verified 2026-10-11 (research note `~/data-frontier/research/P10-sources.md`). Raw files are fetched by `uv run python -m pipelines.fetch` into `data/raw/` (gitignored) with sha256 and md5 recorded in `data/manifests/raw_manifest.json`. Raw files are never committed.

## 1. NSW / Dehejia-Wahba (module 10, OBSERVED)
- Files: `nsw_dw.dta` (445 rows: 185 treated, 260 experimental controls; md5 `e3367ddd449e25cb4c54c04263978800`, checked at fetch) and `psid_controls.dta` (2,490 rows, the observational comparison group).
- Host: https://users.nber.org/~rdehejia/nswdata2.html . Please link to this page.
- **Terms (quoted):** "These data are distributed for attributable non-commercial use (CC by NC)."
- **Ruling applied:** this portfolio is non-monetized (no ads, no paid tier; same ruling as P02, ENGINEERING_DECISIONS #16). We use the data, publish **derived results only** (estimates, balance tables, aggregates; no row-level data) and never commit the raw files. Anyone reusing this site's derived numbers commercially should consult the NBER terms.
- Duplicates: 15 exact duplicate rows exist in the published file (real units). Kept.
- Storage note: `re78` etc. are stored as float32 in the Stata file; we read them as float64 of the float32 value.
- Citations (required by the host): LaLonde, R. (1986), "Evaluating the Econometric Evaluations of Training Programs", American Economic Review 76, 604-620. Dehejia, R. and Wahba, S. (1999), "Causal Effects in Non-Experimental Studies: Reevaluating the Evaluation of Training Programs", JASA 94(448), 1053-1062. Dehejia, R. and Wahba, S. (2002), "Propensity Score Matching Methods for Non-Experimental Causal Studies", Review of Economics and Statistics 84, 151-161.

## 2. UCI Statlog German Credit (modules 6 and 9, OBSERVED)
- https://archive.ics.uci.edu/dataset/144/statlog+german+credit+data , 1,000 rows, 20 attributes + class. Licence CC BY 4.0.
- Cost matrix (published with the dataset): classifying a bad customer as good costs 5; a good customer as bad costs 1.
- Citation: Hofmann, H. (1994). Statlog (German Credit Data) [Dataset]. UCI Machine Learning Repository. https://doi.org/10.24432/C5NC77.
- Only test-split probabilities and labels (250 rows, no features) and fitted model coefficients are published. Counterfactual demo applicants are 8 rows of the published dataset (CC BY 4.0), shown as feature values.

## 3. Ishigami function (module 8, formula)
- f(x) = sin(x1) + A sin^2(x2) + B x3^4 sin(x1), x ~ U[-pi, pi]^3, **A = 7, B = 0.1** (Crestaux et al. 2007; Marrel et al. 2009 convention). Sobol and Levitan (1999) use B = 0.05; not used here.
- Cite Ishigami, T. and Homma, T. (1990), IEEE ISUMA; Saltelli et al. (2008), Global Sensitivity Analysis: The Primer, Wiley; Surjanovic and Bingham, Virtual Library of Simulation Experiments, https://www.sfu.ca/~ssurjano/ishigami.html .
- Reference indices are **recomputed** in tests (closed form checked against 3-D Gauss-Legendre quadrature), not copied from papers.

## 4. Seeded SYNTHETIC environments (modules 1-5, 7, 8 demo, 10 synthetic)
Project-NPV Monte Carlo environment, AR(1) series, production-planning LP, synthetic confounded causal DGP. All generated from a documented seed by the PRNG specified in `docs/METHODOLOGY.md`. No external data.

## Tooling licences
numpy, scipy, pandas, statsmodels, scikit-learn (BSD), highspy (MIT), SALib (MIT; used only to cross-check Sobol estimators in tests, no code copied).

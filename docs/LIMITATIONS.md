# Limitations (recorded, not hidden)

- **Synthetic environments** (modules 1-5, 7, 8 demo, 10 synthetic) illustrate method only. The NPV, series, production plan and confounded DGP are invented and labelled SYNTHETIC.
- **NSW (module 10):** 445 rows from a restricted Dehejia-Wahba subset; the experimental benchmark has a wide interval (about 1,794 +- 1,300 USD). Observational estimators sit within the sampling noise of the benchmark in some cases (regression adjustment, IPW) while the naive comparison is off by about 17,000 USD. That agreement is NOT proof that adjustment works in general: IPW rests on 11.9 effective control observations (overlap is weak), results vary with specification (Dehejia and Wahba 1999 and Smith and Todd 2005 discuss this), and the OLS-coefficient gap (-1,727) is larger than the RA gap. External validity beyond the NSW volunteer population is not established.
- **Data terms:** NSW and PSID are CC by NC. This is a non-monetized portfolio; derived results only; the site must link the NBER page and cite the three papers. If the portfolio ever becomes commercial, module 10 NSW results must be removed or replaced by the synthetic environment.
- **German Credit (module 6):** 1,000 rows from the 1990s; the test split has 250 rows (75 bad), so the empirical optimal threshold (0.10 on the seeded split, median 0.16 over 30 splits, IQR 0.12-0.21) is noisy. The 1/6 rule assumes calibrated probabilities; the calibration split is 150 rows. Reliability bins show mild under-prediction in the middle bins. Sensitive attributes excluded, but age and other proxies remain; this is a method demo, not a lending model.
- **Counterfactuals (module 9):** model counterfactuals, not causal; "actionable" is an illustrative assumption; the search space is a coarse grid; cost weights are a modelling choice. A found counterfactual says nothing about whether the applicant's real risk would change.
- **Forecast intervals (module 5):** Gaussian intervals; AR(1) is the true model for the synthetic data (flatters AR); SES is deliberately misspecified, and its coverage drifts above nominal at long horizons (over-wide bands) while remaining near nominal at h=1.
- **Monte Carlo (module 3):** the CI is for the mean, not the outcome range. Normal approximation. Shown convergence uses prefixes of one stream.
- **Sobol (module 8):** estimator noise at N=256 is large; the table shows it. SALib is used only as a cross-check.
- **Precomputed vs live:** coverage studies, bootstraps, sklearn model fitting and NSW estimators are precomputed in Python and must be labelled precomputed on the site. Live in the browser: modules 1-5, 7, 8, 9 (search), 10 (synthetic), and the module 6 curve/optimum from published probabilities.
- **Not verified here:** the TypeScript ports (frontend task). Cross-language reproducibility is demonstrated only for the PRNG (Node check).

- **Browser layer:** the Turn draws 500 to 1,200 of the 20,000 futures (the ledger says `n_drawn OF n`; statistics use all of them).
  Threads assume cash arrives evenly within a year; the model pays at year end. The waterfall clips at 180% recovered.
- **HiGHS in the browser** is a 3.5 MB WebAssembly download created only at S06 or a LAB solve; if it cannot load, S06 shows the
  precomputed front and says so.
- **Parity** is claimed only where a published vector exists for the seed in use. At any other seed the site says so and shows no MATCH.
- **Visual QA** for this release was an orchestrator read of real screenshots, not a separate independent agent.

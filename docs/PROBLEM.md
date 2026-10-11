# Problem: Decision Universe

**Tagline:** Every Decision Creates a Different Future.

## The question
A decision is a bet on an uncertain future. Most people see one number (an expected value, a score, a forecast). Decision science says the useful object is the whole distribution of futures, how a cost matrix reshapes the right action, which inputs actually drive the outcome, and what a causal claim needs before it can be believed.

## What this product lets a visitor do
Ten independent, tested numerical modules run live in the browser (TypeScript, in a worker). Each has a Python reference implementation (this repo) and a published parity vector file, so the browser port is checked against the reference rather than trusted.

| # | Module | The decision question |
|---|---|---|
| 1 | Distributions | What shapes can uncertainty take, and do the numbers integrate to one? |
| 2 | Sampling | How are futures drawn, reproducibly, from a seed? |
| 3 | Monte Carlo | What does a project's NPV look like across thousands of futures, and how sure is the mean? |
| 4 | Conjugate Bayes | How does evidence move a belief, and how does a credible interval differ from a confidence interval? |
| 5 | Forecast intervals | How wide should the band be, and does it cover as often as it claims? |
| 6 | Cost-sensitive thresholds | When a wrong "approve" costs five times a wrong "reject", where should the cut-off be? |
| 7 | LP and Pareto | With two goals in conflict, which trade-offs are efficient? |
| 8 | Sensitivity | Which inputs drive the output, including through interactions? |
| 9 | Counterfactuals | What is the smallest change to an input that flips a model's decision? (model counterfactual, not causal) |
| 10 | Causal | Can an observational comparison recover an experimental benchmark? |

## Scope of this task (phases 01-13)
Problem, source verification, contracts, Python reference implementations, validation, versioned JSON artifacts and parity vectors, and real datasets. The frontend (TypeScript ports, scenes, motion) is a separate task.

## Honesty rules
- Seeded environments are SYNTHETIC and labelled. The only OBSERVED data: NSW/PSID earnings (module 10) and German Credit (modules 6 and 9).
- Nothing simulated is presented as live inference. Precomputed outputs say so. Browser recompute is labelled as such and must match the vectors.
- Model counterfactuals (module 9) are not causal statements. Credible intervals (Bayes) are never called confidence intervals.
- Failures and surprising results are recorded in `docs/LIMITATIONS.md`, not hidden.

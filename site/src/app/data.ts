 
import type { ArtifactSpec } from "../data/loader";

const spec = (file: string, key: string): ArtifactSpec<any> => ({ file, guard: (v: unknown): v is any => !!v && typeof v === "object" && key in (v as object) });
export const FACTS = spec("facts.json", "facts");
export const META = spec("meta.json", "seed");
export const VALIDATION = spec("validation.json", "checks");
export const M01 = spec("m01_distributions.json", "cases");
export const M02 = spec("m02_sampling.json", "first_1000_u32");
export const M03 = spec("m03_montecarlo.json", "convergence");
export const M04 = spec("m04_bayes.json", "sequential");
export const M05 = spec("m05_forecast.json", "series");
export const M06 = spec("m06_credit.json", "test");
export const M07 = spec("m07_pareto.json", "front");
export const M08 = spec("m08_sensitivity.json", "sobol");
export const M09 = spec("m09_counterfactual.json", "results");
export const M10 = spec("m10_causal.json", "nsw");
export const MODULE_SPECS = [M01, M02, M03, M04, M05, M06, M07, M08, M09, M10] as const;

const nf = (d: number) => new Intl.NumberFormat("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const cache = new Map<number, Intl.NumberFormat>();
export const fmt = (n: number, d = 0) => { let f = cache.get(d); if (!f) cache.set(d, (f = nf(d))); return f.format(n); };
export const signed = (n: number, d = 2) => `${n < 0 ? "-" : "+"}${fmt(Math.abs(n), d)}`;
export const pct = (x: number, d = 1) => `${fmt(x * 100, d)}%`;
export const fv = (facts: any, id: string): number => facts.facts[id].value;

/** HiGHS (WebAssembly) solve of the production LP text. Used by the module worker in the browser and by the parity test in node. */
export interface LpSolution { status: string; objective: number; x: number[] }
type HighsModule = { solve: (text: string) => { Status: string; ObjectiveValue: number; Columns: Record<string, { Primal: number }> } };
type Loader = (opts?: { locateFile?: (f: string) => string }) => Promise<HighsModule>;

let loader: Promise<HighsModule> | null = null;
export function loadHighs(l: Loader, locateFile?: (f: string) => string): Promise<HighsModule> {
  if (!loader) loader = l(locateFile ? { locateFile } : undefined);
  return loader;
}
export function solveText(h: HighsModule, text: string, n = 5): LpSolution {
  const r = h.solve(text);
  return { status: r.Status, objective: r.ObjectiveValue, x: Array.from({ length: n }, (_, j) => r.Columns[`x${j}`]?.Primal ?? 0) };
}

/** Two-objective production LP: CPLEX LP text builder (analytics/lp.py lp_text, byte-for-byte) and the epsilon-constraint helpers. */
export interface LpProblem { products: string[]; profit: number[]; emissions: number[]; resources: string[]; A: number[][]; b: number[]; upper: number[]; q_min: number }
const g = (v: number) => String(Number(v.toPrecision(10)));
function terms(coefs: number[]): string {
  const out = coefs.map((c, j) => (c === 0 ? null : `${c < 0 ? "- " : "+ "}${g(Math.abs(c))} x${j}`)).filter((s): s is string => s !== null);
  const s = out.join(" ");
  return s.startsWith("+ ") ? s.slice(2) : s;
}
export function lpText(p: LpProblem, labor: number, eps: number): string {
  const b = [labor, ...p.b.slice(1)];
  const n = p.profit.length;
  const L = ["Maximize", ` obj: ${terms(p.profit)}`, "Subject To"];
  p.A.forEach((row, i) => L.push(` r${i}: ${terms(row)} <= ${g(b[i]!)}`));
  L.push(` minout: ${terms(new Array<number>(n).fill(-1))} <= ${g(-p.q_min)}`);
  L.push(` em: ${terms(p.emissions)} <= ${g(eps)}`);
  L.push("Bounds");
  p.upper.forEach((u, j) => L.push(` 0 <= x${j} <= ${g(u)}`));
  L.push("End");
  return L.join("\n") + "\n";
}
/** the epsilon grid between the two lexicographic anchors */
export const epsGrid = (eLo: number, eHi: number, K: number) => Array.from({ length: K + 1 }, (_, k) => eLo + (k / K) * (eHi - eLo));

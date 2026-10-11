// Rebuilds the LP text in JS from m07.problem + front eps and checks the published SHA-256 (DR-4).
import { readFileSync } from "node:fs";
import crypto from "node:crypto";
const a = JSON.parse(readFileSync(new URL("../../site/public/data/m07_pareto.json", import.meta.url)));
const g = (v) => String(Number(v.toPrecision(10)));
const terms = (cs) => { const s = cs.map((c, j) => (c === 0 ? null : (c < 0 ? "- " : "+ ") + g(Math.abs(c)) + " x" + j)).filter(Boolean).join(" "); return s.startsWith("+ ") ? s.slice(2) : s; };
function lpText(p, labor, eps) {
  const b = [labor, ...p.b.slice(1)], n = p.profit.length;
  const L = ["Maximize", " obj: " + terms(p.profit), "Subject To"];
  p.A.forEach((row, i) => L.push(` r${i}: ${terms(row)} <= ${g(b[i])}`));
  L.push(` minout: ${terms(Array(n).fill(-1))} <= ${g(-p.q_min)}`);
  L.push(` em: ${terms(p.emissions)} <= ${g(eps)}`, "Bounds");
  p.upper.forEach((u, j) => L.push(` 0 <= x${j} <= ${g(u)}`));
  L.push("End"); return L.join("\n") + "\n";
}
const sha = (t) => crypto.createHash("sha256").update(t).digest("hex");
let bad = 0;
a.front.forEach((q) => { if (sha(lpText(a.problem, a.problem.b[0], q.eps)) !== q.lp_text_sha256) bad++; });
a.vectors.forEach((v) => v.eps_profit.forEach(([e], i) => { if (sha(lpText(a.problem, v.labor_hours, e)) !== v.eps_sha256[i]) bad++; }));
if (lpText(a.problem, a.problem.b[0], a.front[a.lp_text.example_point].eps) !== a.lp_text.example) bad++;
console.log(JSON.stringify({ mismatches: bad }));

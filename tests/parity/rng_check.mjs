// Independent JS port of the PRNG spec; prints JSON compared by tests/test_parity_node.py against site/public/data/m02_sampling.json
import { readFileSync } from "node:fs";
const art = JSON.parse(readFileSync(new URL("../../site/public/data/m02_sampling.json", import.meta.url)));
function seedState(seed) {
  let st = seed >>> 0; const s = [];
  for (let i = 0; i < 4; i++) {
    st = (st + 0x9e3779b9) >>> 0; let z = st;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
    s.push((z ^ (z >>> 16)) >>> 0);
  }
  return s;
}
class X { constructor(seed) { this.s = seedState(seed); this.c = null; }
  u32() { let [s0, s1, s2, s3] = this.s; const m = Math.imul(s1, 5); const res = Math.imul(((m << 7) | (m >>> 25)) >>> 0, 9) >>> 0;
    const t = (s1 << 9) >>> 0; s2 ^= s0; s3 ^= s1; s1 ^= s2; s0 ^= s3; s2 ^= t; s3 = ((s3 << 11) | (s3 >>> 21)) >>> 0;
    this.s = [s0 >>> 0, s1 >>> 0, s2 >>> 0, s3 >>> 0]; return res; }
  uniform() { const a = this.u32(), b = this.u32(); return ((a >>> 5) * 67108864 + (b >>> 6)) / 9007199254740992; }
  normal() { if (this.c !== null) { const z = this.c; this.c = null; return z; }
    const u1 = 1 - this.uniform(), u2 = this.uniform(), r = Math.sqrt(-2 * Math.log(u1)), a = 2 * Math.PI * u2; this.c = r * Math.sin(a); return r * Math.cos(a); } }
let bad = 0;
let g = new X(art.seed); const got = Array.from({ length: 1000 }, () => g.u32());
if (JSON.stringify(got) !== JSON.stringify(art.first_1000_u32)) bad++;
for (const v of art.seed_vectors) { g = new X(v.seed); if (JSON.stringify(Array.from({ length: 16 }, () => g.u32())) !== JSON.stringify(v.first_16_u32)) bad++; }
g = new X(art.seed); art.uniform_first.forEach((u) => { if (Math.abs(g.uniform() - u) > 1e-15) bad++; });
g = new X(art.seed); art.normal_first.forEach((z) => { if (Math.abs(g.normal() - z) > 1e-12 * Math.max(1, Math.abs(z))) bad++; });
console.log(JSON.stringify({ mismatches: bad }));

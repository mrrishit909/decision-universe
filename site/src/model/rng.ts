/** xoshiro128** seeded by splitmix32 (analytics/rng.py). u32 outputs are exact; uniforms are exact binary fractions. */
export function splitmix32Seq(seed: number, n = 4): number[] {
  let state = seed >>> 0;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    state = (state + 0x9e3779b9) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
    out.push((z ^ (z >>> 16)) >>> 0);
  }
  return out;
}

export class Xoshiro128ss {
  private s0: number; private s1: number; private s2: number; private s3: number;
  private cache: number | null = null;
  constructor(seed: number) {
    [this.s0, this.s1, this.s2, this.s3] = splitmix32Seq(seed) as [number, number, number, number];
  }
  nextU32(): number {
    const x = Math.imul(this.s1, 5) >>> 0;
    const result = Math.imul(((x << 7) | (x >>> 25)) >>> 0, 9) >>> 0;
    const t = (this.s1 << 9) >>> 0;
    this.s2 = (this.s2 ^ this.s0) >>> 0;
    this.s3 = (this.s3 ^ this.s1) >>> 0;
    this.s1 = (this.s1 ^ this.s2) >>> 0;
    this.s0 = (this.s0 ^ this.s3) >>> 0;
    this.s2 = (this.s2 ^ t) >>> 0;
    this.s3 = ((this.s3 << 11) | (this.s3 >>> 21)) >>> 0;
    return result;
  }
  uniform(): number {
    const a = this.nextU32(), b = this.nextU32();
    return ((a >>> 5) * 67108864 + (b >>> 6)) / 9007199254740992;
  }
  normal(): number {
    if (this.cache !== null) { const z = this.cache; this.cache = null; return z; }
    const u1 = 1 - this.uniform(), u2 = this.uniform();
    const rad = Math.sqrt(-2 * Math.log(u1)), ang = 2 * Math.PI * u2;
    this.cache = rad * Math.sin(ang);
    return rad * Math.cos(ang);
  }
}

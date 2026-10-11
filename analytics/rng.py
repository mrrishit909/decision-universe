"""Seeded PRNG spec the browser reproduces exactly.

Generator: xoshiro128** (Blackman and Vigna 2018), 4 x uint32 state.
Seeding: seed (uint32) -> splitmix32 four times -> s0..s3.
  splitmix32: state = (state + 0x9E3779B9) mod 2^32; z = state;
              z = ((z ^ (z >> 16)) * 0x85EBCA6B) mod 2^32; z = ((z ^ (z >> 13)) * 0xC2B2AE35) mod 2^32; return z ^ (z >> 16)
  JS: Math.imul for the multiplications, >>> 0 for unsigned results.
next_u32: result = rotl(s1 * 5, 7) * 9 (mod 2^32); t = s1 << 9; s2 ^= s0; s3 ^= s1; s1 ^= s2; s0 ^= s3; s2 ^= t; s3 = rotl(s3, 11).
uniform():  a = next_u32(), b = next_u32(); (floor(a / 2^5) * 2^26 + floor(b / 2^6)) / 2^53   -> [0, 1), 53 random bits.
normal():   Box-Muller with a one-value cache. If the cache is empty: u1 = 1 - uniform(); u2 = uniform(); R = sqrt(-2 ln u1);
            return R cos(2 pi u2) and cache R sin(2 pi u2). Otherwise return the cache and clear it.
"""
from __future__ import annotations

import math

M = 0xFFFFFFFF
TWO53 = 9007199254740992.0


def splitmix32_seq(seed: int, n: int = 4) -> list[int]:
    state = seed & M
    out = []
    for _ in range(n):
        state = (state + 0x9E3779B9) & M
        z = state
        z = ((z ^ (z >> 16)) * 0x85EBCA6B) & M
        z = ((z ^ (z >> 13)) * 0xC2B2AE35) & M
        out.append(z ^ (z >> 16))
    return out


class Xoshiro128ss:
    def __init__(self, seed: int):
        self.s = splitmix32_seq(seed)
        self._cache: float | None = None

    def next_u32(self) -> int:
        s0, s1, s2, s3 = self.s
        x = (s1 * 5) & M
        result = ((((x << 7) | (x >> 25)) & M) * 9) & M
        t = (s1 << 9) & M
        s2 ^= s0
        s3 ^= s1
        s1 ^= s2
        s0 ^= s3
        s2 ^= t
        s3 = ((s3 << 11) | (s3 >> 21)) & M
        self.s = [s0, s1, s2, s3]
        return result

    def uniform(self) -> float:
        a = self.next_u32()
        b = self.next_u32()
        return ((a >> 5) * 67108864 + (b >> 6)) / TWO53

    def normal(self) -> float:
        if self._cache is not None:
            z, self._cache = self._cache, None
            return z
        u1 = 1.0 - self.uniform()
        u2 = self.uniform()
        rad = math.sqrt(-2.0 * math.log(u1))
        ang = 2.0 * math.pi * u2
        self._cache = rad * math.sin(ang)
        return rad * math.cos(ang)

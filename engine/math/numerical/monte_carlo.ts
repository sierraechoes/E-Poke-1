/**
 * engine/math/numerical/monte_carlo.ts
 *
 * Monte Carlo engine with:
 *  - Halton / van der Corput low-discrepancy sequence (Sobol-class quasi-MC) for
 *    variance reduction; dim 1 is the van der Corput base-2 sequence,
 *  - a fast deterministic PRNG (mulberry32) + Box-Muller normals for the Monte
 *    Carlo ruin engine (Student-t via inverse-CDF),
 *  - antithetic GBM option pricing.
 */
import { normInv } from "../special";

/** mulberry32 — tiny, fast, deterministic 32-bit PRNG. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller normal pair generator from a uniform source. */
export function makeNormal(rng: () => number): () => number {
  let spare: number | null = null;
  return function () {
    if (spare !== null) {
      const s = spare;
      spare = null;
      return s;
    }
    let u = 0;
    let v = 0;
    let s = 0;
    do {
      u = rng() * 2 - 1;
      v = rng() * 2 - 1;
      s = u * u + v * v;
    } while (s >= 1 || s === 0);
    const mul = Math.sqrt((-2 * Math.log(s)) / s);
    spare = v * mul;
    return u * mul;
  };
}

// ---------------------------------------------------------------------------
// Halton low-discrepancy sequence (van der Corput in prime bases).
// dim 1 = base 2, dim 2 = base 3, dim 3 = base 5, ... Same QMC family as Sobol.
// ---------------------------------------------------------------------------
const PRIMES = [2, 3, 5, 7, 11, 13];

/** The i-th (1-indexed) van der Corput radical-inverse in base b. */
export function vanDerCorput(i: number, base: number): number {
  let f = 1;
  let r = 0;
  let n = i;
  while (n > 0) {
    f /= base;
    r += f * (n % base);
    n = Math.floor(n / base);
  }
  return r;
}

/** Generate `n` Halton points of dimension `dim`. Point index starts at 1. */
export function haltonPoints(n: number, dim: number): Float64Array[] {
  const d = Math.min(dim, PRIMES.length);
  const out: Float64Array[] = [];
  for (let i = 0; i < n; i++) out.push(new Float64Array(d));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) {
      out[i][j] = vanDerCorput(i + 1, PRIMES[j]);
    }
  }
  return out;
}

/** Halton quasi-normals via inverse-CDF transformation. */
export function haltonNormals(n: number, dim: number): Float64Array[] {
  const pts = haltonPoints(n, dim);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < pts[i].length; j++) {
      const u = Math.min(Math.max(pts[i][j], 1e-10), 1 - 1e-10);
      pts[i][j] = normInv(u);
    }
  }
  return pts;
}

/**
 * Monte Carlo European option price via antithetic GBM on a Halton quasi-normal
 * sequence (single step). Variance is far lower than pseudo-random MC.
 */
export function mcOptionPrice(
  S0: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  isCall: boolean,
  paths: number
): number {
  const z = haltonNormals(paths, 1);
  const drift = (r - 0.5 * sigma * sigma) * T;
  const diff = sigma * Math.sqrt(T);
  let sum = 0;
  for (let i = 0; i < paths; i++) {
    const zi = z[i][0];
    for (const sgn of [1, -1]) {
      const ST = S0 * Math.exp(drift + sgn * diff * zi);
      const payoff = isCall ? Math.max(ST - K, 0) : Math.max(K - ST, 0);
      sum += payoff;
    }
  }
  const disc = Math.exp(-r * T);
  return disc * (sum / (2 * paths));
}

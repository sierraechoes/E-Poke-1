/**
 * engine/math/stochastic/bachelier.ts
 *
 * Bachelier (normal) model — prices options in absolute (additive) terms, so it
 * is well-defined for zero and negative strikes, forwards, and rates. This is
 * the model of choice for interest-rate / bond futures and negative-rate regimes.
 *
 *   d = (F - K) / (σ √T)
 *   Call = e^{-rT} [ (F - K) N(d) + σ √T φ(d) ]
 *   Put  = e^{-rT} [ (K - F) N(-d) + σ √T φ(d) ]
 *
 * (Here σ is the *absolute* price volatility, not lognormal vol.)
 *
 * Greeks:
 *   Δ_call = e^{-rT} N(d)        Δ_put = -e^{-rT} N(-d)
 *   Γ      = e^{-rT} φ(d) / (σ √T)
 *   ν      = e^{-rT} √T φ(d)         (per 1.00 absolute vol)
 */
import { normCdf, normPdf } from "../special";
import type { OptionType, Greeks } from "./black76";

export interface BachelierInput {
  F: number;
  K: number;
  T: number;
  sigma: number; // absolute (normal) volatility, in price units
  r: number;
  type?: OptionType;
}

export function bachelierPrice(input: BachelierInput): number {
  const { F, K, T, sigma, r } = input;
  const type = input.type ?? "CALL";
  const disc = Math.exp(-r * T);
  if (T <= 0 || sigma <= 0) {
    const intrinsic = type === "CALL" ? Math.max(F - K, 0) : Math.max(K - F, 0);
    return disc * intrinsic;
  }
  const sigSqrtT = sigma * Math.sqrt(T);
  const d = (F - K) / sigSqrtT;
  const pdf = normPdf(d);
  if (type === "CALL") {
    return disc * ((F - K) * normCdf(d) + sigSqrtT * pdf);
  }
  return disc * ((K - F) * normCdf(-d) + sigSqrtT * pdf);
}

export function bachelierGreeks(input: BachelierInput): Greeks {
  const { F, K, T, sigma, r } = input;
  const type = input.type ?? "CALL";
  const disc = Math.exp(-r * T);
  if (T <= 0 || sigma <= 0) {
    return { price: bachelierPrice(input), delta: 0, gamma: 0, vega: 0, theta: 0, rho: 0 };
  }
  const sqrtT = Math.sqrt(T);
  const sigSqrtT = sigma * sqrtT;
  const d = (F - K) / sigSqrtT;
  const pdf = normPdf(d);
  const Nd = normCdf(d);
  const price =
    type === "CALL"
      ? disc * ((F - K) * Nd + sigSqrtT * pdf)
      : disc * ((K - F) * normCdf(-d) + sigSqrtT * pdf);
  const delta = type === "CALL" ? disc * Nd : -disc * normCdf(-d);
  const gamma = (disc * pdf) / sigSqrtT;
  const vega = disc * sqrtT * pdf;
  // Θ = -r·C ... derive via finite-difference friendly closed form:
  //   dC/dT = disc[ 0.5 σ/(√T) φ(d) + r·(...) ]; theta = -dC/dT (per year)
  const theta =
    -disc * ((sigma * pdf) / (2 * sqrtT)) +
    r * price;
  const rho = -T * price;
  return { price, delta, gamma, vega, theta, rho: type === "CALL" ? rho : rho };
}

/**
 * Implied normal (Bachelier) volatility via bisection. Robust across negative
 * forwards/strikes where lognormal implied vol is undefined.
 */
export function bachelierImpliedVol(
  price: number,
  F: number,
  K: number,
  T: number,
  r: number,
  type: OptionType = "CALL"
): number {
  let lo = 1e-8;
  let hi = 1e4;
  for (let i = 0; i < 200; i++) {
    const mid = 0.5 * (lo + hi);
    const p = bachelierPrice({ F, K, T, sigma: mid, r, type });
    if (p > price) hi = mid;
    else lo = mid;
    if (hi - lo < 1e-12 * mid || Math.abs(p - price) < 1e-12) break;
  }
  return 0.5 * (lo + hi);
}

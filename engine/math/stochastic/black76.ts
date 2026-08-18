/**
 * engine/math/stochastic/black76.ts
 *
 * Black-76 model for European futures options (Black's 1976 modification of
 * Black-Scholes, pricing off the forward/futures price F rather than spot).
 *
 *   d1 = [ ln(F/K) + (σ²/2) T ] / (σ √T)
 *   d2 = d1 - σ √T
 *   Call = e^{-rT} [ F N(d1) - K N(d2) ]
 *   Put  = e^{-rT} [ K N(-d2) - F N(-d1) ]
 *
 * With exact, closed-form Greeks:
 *   Δ_call = e^{-rT} N(d1)            Δ_put = -e^{-rT} N(-d1) = e^{-rT}(N(d1)-1)
 *   Γ      = e^{-rT} φ(d1) / (F σ √T)
 *   ν      = F e^{-rT} √T φ(d1)            (vega, per 1.00 vol)
 *   Θ_call = -F e^{-rT} φ(d1) σ / (2√T) + r·Call
 *   Θ_put  = -F e^{-rT} φ(d1) σ / (2√T) + r·Put
 *   ρ_call = -T · Call                     (Black-76: dC/dr = -T·C)
 *   vanna  = -e^{-rT} φ(d1) d2 / σ
 *   volga  = e^{-rT} φ(d1) d1 d2 / σ
 *
 * All math runs on the inputs supplied — no tabulated/faked values.
 */
import { normCdf, normPdf } from "../special";

export type OptionType = "CALL" | "PUT";

export interface Black76Input {
  /** Forward / futures price. */
  F: number;
  /** Strike. */
  K: number;
  /** Time to maturity in years (≥ 0). */
  T: number;
  /** Volatility σ (annualized, e.g. 0.20 for 20%). */
  sigma: number;
  /** Risk-free rate r (continuous compounding). */
  r: number;
  /** "CALL" | "PUT". */
  type?: OptionType;
}

export interface Greeks {
  price: number;
  delta: number;
  gamma: number;
  vega: number; // per 1.00 absolute change in σ
  theta: number; // per year (per day = theta/365)
  rho: number;
}

function d1d2(F: number, K: number, T: number, sigma: number): [number, number] {
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(F / K) + (0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  return [d1, d1 - sigma * sqrtT];
}

/** Black-76 d1, d2 (NaN-safe for degenerate inputs). */
export function black76D1D2(F: number, K: number, T: number, sigma: number) {
  return d1d2(F, K, T, sigma);
}

/** European futures option price under Black-76. */
export function black76Price(input: Black76Input): number {
  const { F, K, T, sigma, r } = input;
  const type = input.type ?? "CALL";
  const disc = Math.exp(-r * T);
  if (T <= 0 || sigma <= 0) {
    // Intrinsic value at expiry (futures-style: payoff = disc * max(...)).
    const intrinsic = type === "CALL" ? Math.max(F - K, 0) : Math.max(K - F, 0);
    return disc * intrinsic;
  }
  const [d1, d2] = d1d2(F, K, T, sigma);
  if (type === "CALL") {
    return disc * (F * normCdf(d1) - K * normCdf(d2));
  }
  return disc * (K * normCdf(-d2) - F * normCdf(-d1));
}

/** Full closed-form Greeks for Black-76. */
export function black76Greeks(input: Black76Input): Greeks {
  const { F, K, T, sigma, r } = input;
  const type = input.type ?? "CALL";
  const disc = Math.exp(-r * T);
  if (T <= 0 || sigma <= 0 || F <= 0) {
    const price = black76Price(input);
    return { price, delta: 0, gamma: 0, vega: 0, theta: 0, rho: 0 };
  }
  const sqrtT = Math.sqrt(T);
  const sigSqrtT = sigma * sqrtT;
  const d1 = (Math.log(F / K) + (0.5 * sigma * sigma) * T) / sigSqrtT;
  const d2 = d1 - sigSqrtT;
  const pdf = normPdf(d1);
  const Nd1 = normCdf(d1);
  const price =
    type === "CALL"
      ? disc * (F * Nd1 - K * normCdf(d2))
      : disc * (K * normCdf(-d2) - F * normCdf(-d1));

  const gamma = (disc * pdf) / (F * sigSqrtT);
  const vega = F * disc * sqrtT * pdf; // per 1.00 vol
  const thetaCommon = -(F * disc * pdf * sigma) / (2 * sqrtT);
  const theta = type === "CALL" ? thetaCommon + r * price : thetaCommon + r * price;
  const delta = type === "CALL" ? disc * Nd1 : disc * (Nd1 - 1);
  // Black-76 rho: dPrice/dr = -T·price  (carry on the discounting only).
  const rho = -T * price;
  return { price, delta, gamma, vega, theta, rho };
}

/** Implied Black-76 volatility via Brent root finding on the price. */
export function black76ImpliedVol(
  price: number,
  F: number,
  K: number,
  T: number,
  r: number,
  type: OptionType = "CALL"
): number {
  const lower = 1e-6;
  const upper = 5.0; // 500%
  // Brent's method on f(σ) = black76Price - price
  let a = lower;
  let b = upper;
  let fa = black76Price({ F, K, T, sigma: a, r, type }) - price;
  let fb = black76Price({ F, K, T, sigma: b, r, type }) - price;
  if (fa * fb > 0) return NaN; // price outside [intrinsic, ..]
  let c = a;
  let fc = fa;
  for (let i = 0; i < 100; i++) {
    if (Math.abs(fb) < 1e-12) return b;
    let s: number;
    if (fa !== fc && fb !== fc) {
      s = (a * fb * fc) / ((fa - fb) * (fa - fc)) + (b * fa * fc) / ((fb - fa) * (fb - fc)) + (c * fa * fb) / ((fc - fa) * (fc - fb));
    } else {
      s = b - (fb * (b - a)) / (fb - fa);
    }
    const m = 0.5 * (a + b);
    const cond1 = s < (3 * a + b) / 4 || s > b;
    const cond2 = i === 0 && (s > b || s < m);
    const cond3 = i !== 0 && Math.abs(b - c) < 1e-9;
    const cond4 = i === 0 && Math.abs(c - a) < 1e-9;
    if (cond1 || cond2 || cond3 || cond4) s = m;
    const fs = black76Price({ F, K, T, sigma: s, r, type }) - price;
    const tol = 1e-12;
    if (Math.abs(fs) < tol || Math.abs(b - a) < tol) return s;
    c = b;
    fc = fb;
    if (fa * fs < 0) {
      b = s;
      fb = fs;
    } else {
      a = s;
      fa = fs;
    }
    if (Math.abs(fa) < Math.abs(fb)) {
      [a, b] = [b, a];
      [fa, fb] = [fb, fa];
    }
  }
  return b;
}

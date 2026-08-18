/**
 * engine/math/stochastic/jump_diffusion.ts
 *
 * Merton (1976) jump-diffusion model:
 *
 *   dS_t = (r - λ k) S_t dt + σ S_t dW_t + (Y - 1) S_t dN_t,
 *
 * where N_t is Poisson(λ) and ln Y ~ N(μ_J, σ_J²), so
 *   k = E[Y] - 1 = exp(μ_J + σ_J²/2) - 1.
 *
 * European price (Merton's series):
 *
 *   C = Σ_{n=0}^∞  Poisson_pmf(n; λ'(T)) · C_BSM(S, K, r_n, σ_n, T),
 *
 * with λ' = λ(1+k),  r_n = r - λ k + n μ_J / T,
 *      σ_n² = σ² + n σ_J² / T.
 *
 * The series is summed until the Poisson tail mass is negligible.
 */
import type { OptionType } from "./black76";
import { normCdf } from "../special";

export interface MertonInput {
  S: number;
  K: number;
  T: number;
  r: number;
  sigma: number; // diffusive vol
  lambda: number; // jump intensity
  muJ: number; // mean of ln Y
  sigmaJ: number; // std of ln Y
  type?: OptionType;
}

/** Black-Scholes-Merton spot pricer (used by the Merton series & MC). */
export function bsmPrice(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  type: OptionType = "CALL"
): number {
  if (T <= 0) {
    return type === "CALL" ? Math.max(S - K, 0) : Math.max(K - S, 0);
  }
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  if (type === "CALL") {
    return S * normCdf(d1) - K * Math.exp(-r * T) * normCdf(d2);
  }
  return K * Math.exp(-r * T) * normCdf(-d2) - S * normCdf(-d1);
}

export function mertonJumpDiffusionPrice(input: MertonInput): number {
  const { S, K, T, r, sigma, lambda, muJ, sigmaJ } = input;
  const type = input.type ?? "CALL";
  const k = Math.exp(muJ + (sigmaJ * sigmaJ) / 2) - 1;
  const lambdaPrime = lambda * (1 + k);
  const lpt = lambdaPrime * T;

  let price = 0;
  let n = 0;
  let remainingMass = 1.0;
  let pmf = Math.exp(-lpt); // Poisson pmf at n = 0
  for (let iter = 0; iter < 500; iter++) {
    const sigmaN = Math.sqrt(sigma * sigma + (n * sigmaJ * sigmaJ) / T);
    // r_n reflects the risk-neutral drift conditional on n jumps, including the
    // +½σ_J² from the jump's lognormal variance (so put-call parity holds).
    const rN = r - lambda * k + (n * (muJ + 0.5 * sigmaJ * sigmaJ)) / T;
    price += pmf * bsmPrice(S, K, T, rN, sigmaN, type);
    remainingMass -= pmf;
    if (remainingMass < 1e-12 && n > 5) break;
    n += 1;
    pmf *= lpt / n; // pmf(n+1) = pmf(n) * λ'(T)/(n+1)
    if (pmf < 1e-16 && n > 20) break;
  }
  return price;
}

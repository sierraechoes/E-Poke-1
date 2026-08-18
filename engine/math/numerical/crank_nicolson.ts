/**
 * engine/math/numerical/crank_nicolson.ts
 *
 * Crank-Nicolson finite-difference solver for the Black-Scholes PDE, with
 * American early-exercise handled by the Brennan-Schwartz LCP modification to
 * the Thomas tridiagonal back-substitution (exact for the discretized problem,
 * O(N) per timestep).
 *
 *   V_t + ½ σ² S² V_SS + r S V_S - r V = 0
 *
 * The spatial operator at node i (S_i = i·ΔS) is
 *   L V_i = p_i V_{i-1} + q_i V_i + w_i V_{i+1},
 * with p_i = A_i − B_i, q_i = −(2A_i + r), w_i = A_i + B_i,
 *      A_i = ½σ²S_i²/ΔS², B_i = rS_i/(2ΔS).
 *
 * Crank-Nicolson time stepping yields the tridiagonal system
 *   a_i V^{n}_{i-1} + bb_i V^n_i + c_i V^{n}_{i+1} = d_i,
 * solved by Thomas; American payoffs clip V_i = max(V_i, intrinsic_i).
 *
 * Cross-validated against CRR binomial (N=10000) to ε < 1e-4 in tests.
 */
import type { OptionType } from "../stochastic/black76";

export interface CNInput {
  S: number;
  K: number;
  T: number;
  r: number;
  sigma: number;
  type?: OptionType; // CALL or PUT
  american?: boolean; // default true
  /** spatial nodes M (S grid), default 500 */
  M?: number;
  /** time steps N, default 1000 */
  N?: number;
  /** Smax multiple of S, default 5 */
  sMaxMult?: number;
}

/** CRR binomial pricer (independent benchmark for the PDE solver). */
export function crrBinomial(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  type: OptionType = "PUT",
  american = true,
  steps = 10000
): number {
  const dt = T / steps;
  const u = Math.exp(sigma * Math.sqrt(dt));
  const d = 1 / u;
  const p = (Math.exp(r * dt) - d) / (u - d);
  const disc = Math.exp(-r * dt);
  // option values at expiry (j up-moves)
  const val = new Float64Array(steps + 1);
  for (let j = 0; j <= steps; j++) {
    const ST = S * Math.pow(u, j) * Math.pow(d, steps - j);
    val[j] = type === "CALL" ? Math.max(ST - K, 0) : Math.max(K - ST, 0);
  }
  for (let n = steps - 1; n >= 0; n--) {
    for (let j = 0; j <= n; j++) {
      const v = disc * (p * val[j + 1] + (1 - p) * val[j]);
      if (american) {
        const ST = S * Math.pow(u, j) * Math.pow(d, n - j);
        const intr = type === "CALL" ? Math.max(ST - K, 0) : Math.max(K - ST, 0);
        val[j] = Math.max(v, intr);
      } else {
        val[j] = v;
      }
    }
  }
  return val[0];
}

/** Tridiagonal solve with optional Brennan-Schwartz early-exercise clip. */
function thomasAmerican(
  M: number,
  a: Float64Array,
  bb: Float64Array,
  c: Float64Array,
  d: Float64Array,
  V: Float64Array,
  intrinsic: Float64Array,
  american: boolean
): void {
  // Forward elimination. Row i=1 has no sub-diagonal (the V_0 boundary term was
  // folded into d[1]), so elimination starts at i=2 using the modified bb[i-1].
  for (let i = 2; i <= M - 1; i++) {
    const m = a[i] / bb[i - 1];
    bb[i] -= m * c[i - 1];
    d[i] -= m * d[i - 1];
  }
  // Back-substitution with Brennan-Schwartz clip (American obstacle).
  V[M - 1] = d[M - 1] / bb[M - 1];
  if (american) V[M - 1] = Math.max(V[M - 1], intrinsic[M - 1]);
  for (let i = M - 2; i >= 1; i--) {
    let vi = (d[i] - c[i] * V[i + 1]) / bb[i];
    if (american) vi = Math.max(vi, intrinsic[i]);
    V[i] = vi;
  }
}

export function crankNicolsonPrice(input: CNInput): number {
  const type = input.type ?? "PUT";
  const american = input.american ?? true;
  const M = input.M ?? 500;
  const N = input.N ?? 1000;
  const Smax = (input.sMaxMult ?? 5) * input.S;
  const { S, K, T, r, sigma } = input;

  const dS = Smax / M;
  const dt = T / N;

  // Allocate reusable coefficient scratch (regenerated per call to keep O(M) memory).
  const a = new Float64Array(M + 1);
  const bb = new Float64Array(M + 1);
  const c = new Float64Array(M + 1);
  const d = new Float64Array(M + 1);
  const V = new Float64Array(M + 1);
  const intrinsic = new Float64Array(M + 1);

  // Terminal payoff at expiry.
  for (let i = 0; i <= M; i++) {
    const Si = i * dS;
    intrinsic[i] = type === "CALL" ? Math.max(Si - K, 0) : Math.max(K - Si, 0);
    V[i] = intrinsic[i];
  }

  // Precompute p_i, q_i, w_i and the CN a_i, bb_i, c_i coefficients.
  for (let i = 1; i <= M - 1; i++) {
    const Si = i * dS;
    const Ai = (0.5 * sigma * sigma * Si * Si) / (dS * dS);
    const Bi = (r * Si) / (2 * dS);
    const pi = Ai - Bi;
    const qi = -(2 * Ai + r);
    const wi = Ai + Bi;
    a[i] = -0.5 * dt * pi;
    bb[i] = 1 - 0.5 * dt * qi; // = 1 + 0.5 dt (2A_i + r)
    c[i] = -0.5 * dt * wi;
    // RHS coefficient scratch (β' part) stored separately via sign flip below.
  }

  // Time march backward from expiry (n=N) to now (n=0).
  const alpha = new Float64Array(M + 1); // 0.5 dt p_i
  const gamma = new Float64Array(M + 1); // 0.5 dt w_i
  for (let i = 1; i <= M - 1; i++) {
    const Si = i * dS;
    const Ai = (0.5 * sigma * sigma * Si * Si) / (dS * dS);
    const Bi = (r * Si) / (2 * dS);
    alpha[i] = 0.5 * dt * (Ai - Bi);
    gamma[i] = 0.5 * dt * (Ai + Bi);
  }

  for (let n = N - 1; n >= 0; n--) {
    const tau = (N - n) * dt; // time to expiry at this step
    // Build RHS d_i from V^{n+1}.
    for (let i = 1; i <= M - 1; i++) {
      const Si = i * dS;
      const Ai = (0.5 * sigma * sigma * Si * Si) / (dS * dS);
      const betaPrime = 1 + 0.5 * dt * (-(2 * Ai + r)); // = 1 + 0.5 dt q_i
      d[i] = alpha[i] * V[i - 1] + betaPrime * V[i] + gamma[i] * V[i + 1];
    }
    // Boundary conditions.
    if (type === "PUT") {
      // S=0: put worth K (American, immediate exercise) or K e^{-rτ} (European);
      // S=Smax: ~0.
      const v0 = american ? K : K * Math.exp(-r * tau);
      d[1] += -a[1] * v0; // a[1] V_0 folded into RHS
    } else {
      // Call: V_0 = 0; V_M = Smax - K e^{-r tau}.
      d[M - 1] += -c[M - 1] * (Smax - K * Math.exp(-r * tau));
    }

    // Solve (modifies bb in place -> need fresh copy each step).
    const bbb = bb.slice();
    thomasAmerican(M, a, bbb, c, d, V, intrinsic, american);

    // Re-apply boundary values into V for next step.
    if (type === "PUT") {
      V[0] = american ? K : K * Math.exp(-r * tau);
      V[M] = 0;
    } else {
      V[0] = 0;
      V[M] = Smax - K * Math.exp(-r * tau);
    }
  }

  // Linear interpolation to S.
  const i = Math.floor(S / dS);
  const frac = (S - i * dS) / dS;
  const idx = Math.min(i, M - 1);
  return V[idx] * (1 - frac) + V[idx + 1] * frac;
}

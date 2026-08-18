/**
 * engine/core/simulator/hawkes.ts
 *
 * Multivariate Hawkes process (Section 3.4) — the self-exciting point process
 * governing synthetic Bid/Ask market-order and cancellation arrivals. This is
 * the internal HFT simulator the system fails over to when no live exchange API
 * is attached (Zero-Mock Policy, Rule 1).
 *
 *   λ_m(t) = μ_m + Σ_n ∫_0^t α_{mn} e^{-β_{mn}(t-s)} dN_n(s)
 *
 * Simulated by Ogata's modified thinning, which uses the exponential-kernel
 * recursion R_{m}(t) = Σ_s α_{mn} e^{-β(t-s)} to track each intensity without
 * re-summing the full history (O(1) per event per dimension).
 *
 * Event dimensions: MARKET_BUY, MARKET_SELL, CANCEL_BUY, CANCEL_SELL.
 */
import { mulberry32 } from "../../math/numerical/monte_carlo";

export type HawkesEventKind = "MARKET_BUY" | "MARKET_SELL" | "CANCEL_BUY" | "CANCEL_SELL";
export const HAWKES_KINDS: HawkesEventKind[] = ["MARKET_BUY", "MARKET_SELL", "CANCEL_BUY", "CANCEL_SELL"];

export interface HawkesConfig {
  mu: number[]; // base intensities per kind (events/sec)
  alpha: number[][]; // M x M excitation matrix (alpha[n][m] = n excites m)
  beta: number[]; // decay per kind (1/sec)
  seed?: number;
}

/** Default market-like intensities (events/sec). */
export function defaultHawkesConfig(): HawkesConfig {
  const M = 4;
  const mu = [8, 8, 30, 30]; // buys/sells ~8/s, cancels ~30/s
  const beta = [6, 6, 12, 12];
  // cross-excitation: a market buy excites more buys + cancels on the ask, etc.
  const alpha = [
    [1.2, 0.1, 2.0, 0.3], // MARKET_BUY -> ...
    [0.1, 1.2, 0.3, 2.0], // MARKET_SELL
    [0.4, 0.0, 0.6, 0.0], // CANCEL_BUY
    [0.0, 0.4, 0.0, 0.6], // CANCEL_SELL
  ];
  void M;
  return { mu, alpha, beta, seed: 0x5eed };
}

export interface HawkesPoint {
  t: number; // seconds since start
  kind: HawkesEventKind;
  lambda: number; // sampled intensity at the event
}

/**
 * Multivariate Hawkes process simulator. Pull events one at a time or in batches;
 * intensities are tracked via the exponential-kernel recursion for O(1)/event.
 */
export class HawkesProcess {
  private cfg: HawkesConfig;
  private rng: () => number;
  private t = 0;
  private R: number[]; // recursion state per dimension
  private M: number;

  constructor(cfg: HawkesConfig = defaultHawkesConfig()) {
    this.cfg = cfg;
    this.M = cfg.mu.length;
    this.rng = mulberry32(cfg.seed ?? 0x5eed);
    this.R = new Array(this.M).fill(0);
  }

  reset() {
    this.t = 0;
    this.R.fill(0);
  }

  /** Total intensity at current time. */
  private intensity(): number[] {
    const lam = new Array<number>(this.M);
    let sum = 0;
    for (let m = 0; m < this.M; m++) {
      lam[m] = this.cfg.mu[m] + this.R[m];
      sum += lam[m];
    }
    lam[this.M] = sum; // pack total at end
    return lam;
  }

  /** Advance and return the next event (Ogata thinning). */
  next(): HawkesPoint {
    const { mu, alpha, beta } = this.cfg;
    // upper bound on intensity: lambda_bar = sum(mu + R) (decays, but we use the
    // Ogata thinning with the current intensity as the bound, refreshed per draw)
    for (;;) {
      const lam = this.intensity();
      const total = lam[this.M];
      // inter-arrival ~ Exp(total)
      const u = this.rng();
      const dt = total > 0 ? -Math.log(Math.max(u, 1e-12)) / total : 1;
      // propagate the exponential recursion forward by dt
      for (let m = 0; m < this.M; m++) {
        this.R[m] *= Math.exp(-beta[m] * dt);
      }
      this.t += dt;
      // recompute total intensity after decay
      let total2 = 0;
      const lam2 = new Array<number>(this.M);
      for (let m = 0; m < this.M; m++) {
        lam2[m] = mu[m] + this.R[m];
        total2 += lam2[m];
      }
      // accept with probability total2/total (thinning)
      if (this.rng() <= total2 / total) {
        // pick the firing dimension (multinomial by intensity)
        const r = this.rng() * total2;
        let acc = 0;
        let kind = 0;
        for (let m = 0; m < this.M; m++) {
          acc += lam2[m];
          if (r <= acc) {
            kind = m;
            break;
          }
        }
        // add this event's excitation to every dimension
        for (let m = 0; m < this.M; m++) {
          this.R[m] += alpha[kind][m];
        }
        return { t: this.t, kind: HAWKES_KINDS[kind], lambda: lam2[kind] };
      }
    }
  }

  /** Generate the next `n` events (bulk pull). */
  nextBatch(n: number): HawkesPoint[] {
    const out = new Array<HawkesPoint>(n);
    for (let i = 0; i < n; i++) out[i] = this.next();
    return out;
  }

  get time(): number {
    return this.t;
  }
}

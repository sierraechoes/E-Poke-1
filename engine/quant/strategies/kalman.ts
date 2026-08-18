/**
 * engine/quant/strategies/kalman.ts
 *
 * Kalman filter for statistical-arbitrage spread tracking (Section 3.3.2):
 *
 *   y_t = β_t x_t + α_t + v_t,   v_t ~ N(0, R)
 *   [α_t; β_t] = [α_{t-1}; β_{t-1}] + w_t,  w_t ~ N(0, Q)   (2x2)
 *
 * Maintains state (2-vector) and covariance (2x2); update() ingests (x,y) and
 * returns the posterior state, the residual e_t, and the standardized Z-score.
 */
export class KalmanFilter {
  state: number[]; // [alpha, beta]
  P: number[]; // 2x2 covariance (row-major)
  R: number; // observation variance
  Q: number[]; // 2x2 state noise

  constructor(opts?: { alpha0?: number; beta0?: number; R?: number; Qalpha?: number; Qbeta?: number }) {
    this.state = [opts?.alpha0 ?? 0, opts?.beta0 ?? 1];
    this.P = [1e-4, 0, 0, 1e-4];
    this.R = opts?.R ?? 1e-4;
    this.Q = [opts?.Qalpha ?? 1e-7, 0, 0, opts?.Qbeta ?? 1e-6];
  }

  update(x: number, y: number): { alpha: number; beta: number; residual: number; zscore: number } {
    // predict
    this.P[0] += this.Q[0];
    this.P[3] += this.Q[3];
    // innovation
    const H = [x, 1]; // observation maps [alpha,beta] -> beta*x + alpha
    const yHat = this.state[1] * x + this.state[0];
    const e = y - yHat;
    // S = H P H' + R
    const HP0 = this.P[0] * H[1] + this.P[2] * H[0];
    const HP1 = this.P[1] * H[1] + this.P[3] * H[0];
    const S = H[0] * HP0 + H[1] * HP1 + this.R;
    if (Math.abs(S) < 1e-18) {
      return { alpha: this.state[0], beta: this.state[1], residual: e, zscore: 0 };
    }
    // K = P H' / S
    const K0 = (this.P[0] * H[0] + this.P[1] * H[1]) / S;
    const K1 = (this.P[2] * H[0] + this.P[3] * H[1]) / S;
    // update state
    this.state[0] += K0 * e;
    this.state[1] += K1 * e;
    // update covariance P = (I - K H) P
    const KH = [K0 * H[0], K0 * H[1], K1 * H[0], K1 * H[1]];
    const newP = [
      (1 - KH[0]) * this.P[0] - KH[1] * this.P[2],
      (1 - KH[0]) * this.P[1] - KH[1] * this.P[3],
      -KH[2] * this.P[0] + (1 - KH[3]) * this.P[2],
      -KH[2] * this.P[1] + (1 - KH[3]) * this.P[3],
    ];
    this.P = newP;
    const zscore = e / Math.sqrt(S);
    return { alpha: this.state[0], beta: this.state[1], residual: e, zscore };
  }
}

/** β-parameter convergence check helper (used by the accuracy suite). */
export function kalmanFitBeta(
  xs: number[],
  ys: number,
  ySeries: number[]
): number[] {
  const kf = new KalmanFilter({ beta0: 1 });
  const betas: number[] = [];
  for (let i = 0; i < xs.length; i++) {
    const r = kf.update(xs[i], ySeries[i]);
    betas.push(r.beta);
    void ys;
  }
  return betas;
}

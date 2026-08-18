/**
 * engine/quant/strategies/stat_arb.ts
 *
 * Statistical arbitrage with a dynamic Kalman filter (Section 3.3.2).
 *
 *   y_t = β_t x_t + α_t + v_t
 *   residual e_t = y_t - (α_t + β_t x_t)
 *
 * Trades Bollinger-band deviations of the residual: enter short the spread
 * when e_t/σ > +entryZ, long when < -entryZ; exit at |z| < exitZ.
 *
 * `runStatArb` walks the pair series once and emits a target-spread position
 * per step, suitable for the vectorized backtester.
 */
import { KalmanFilter } from "./kalman";

export interface StatArbResult {
  betas: number[];
  residuals: number[];
  zscores: number[];
  positions: number[]; // target spread position (units of y, hedged by -β x)
}

export interface StatArbConfig {
  x: number[];
  y: number[];
  entryZ?: number;
  exitZ?: number;
  /** rolling window for residual σ estimate */
  window?: number;
  R?: number;
  Qalpha?: number;
  Qbeta?: number;
}

export function runStatArb(cfg: StatArbConfig): StatArbResult {
  const { x, y } = cfg;
  const n = Math.min(x.length, y.length);
  const entryZ = cfg.entryZ ?? 2;
  const exitZ = cfg.exitZ ?? 0.5;
  const window = cfg.window ?? 60;
  const kf = new KalmanFilter({ R: cfg.R, Qalpha: cfg.Qalpha, Qbeta: cfg.Qbeta });
  const betas: number[] = [];
  const residuals: number[] = [];
  const zscores: number[] = [];
  const positions: number[] = [];
  const resWin: number[] = [];
  let pos = 0;
  for (let i = 0; i < n; i++) {
    const r = kf.update(x[i], y[i]);
    betas.push(r.beta);
    residuals.push(r.residual);
    resWin.push(r.residual);
    if (resWin.length > window) resWin.shift();
    const m = resWin.reduce((a, b) => a + b, 0) / resWin.length;
    const v = resWin.reduce((a, b) => a + (b - m) ** 2, 0) / resWin.length;
    const sd = Math.sqrt(v) || 1e-9;
    const z = (r.residual - m) / sd;
    zscores.push(z);
    // spread-trading rules
    if (pos === 0) {
      if (z > entryZ) pos = -1; // spread rich -> short y, long x
      else if (z < -entryZ) pos = 1; // spread cheap -> long y, short x
    } else {
      if (pos === -1 && z < -exitZ) pos = 0;
      else if (pos === 1 && z > exitZ) pos = 0;
    }
    positions.push(pos);
  }
  return { betas, residuals, zscores, positions };
}

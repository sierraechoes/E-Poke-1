/**
 * engine/quant/backtester/vectorized.ts
 *
 * Vectorized (array/SIMD-style) backtesting engine. Operates on typed arrays of
 * prices and a target-position signal; computes per-bar strategy returns in
 * tight loops amenable to JIT vectorization. Designed for fast multi-parameter
 * optimization (Section 3.3.1).
 *
 * Returns are arithmetic: r_t = position_{t-1} * (P_t/P_{t-1} - 1) - costs.
 */
export interface VectorBacktestResult {
  equity: Float64Array;
  returns: Float64Array;
  cumulativeReturn: number;
  trades: number;
}

export interface VectorBacktestConfig {
  prices: Float64Array | number[];
  /** target fractional position at each bar (signal), same length as prices. */
  positions: Float64Array | number[];
  /** cost per unit turnover (bps as fraction, e.g. 0.0002). */
  costBps?: number;
  /** slippage fraction applied to turnover. */
  slippage?: number;
  /** initial capital (for equity curve scaling). */
  capital?: number;
}

export function vectorizedBacktest(cfg: VectorBacktestConfig): VectorBacktestResult {
  const n = cfg.prices.length;
  const prices = cfg.prices instanceof Float64Array ? cfg.prices : Float64Array.from(cfg.prices);
  const sig = cfg.positions instanceof Float64Array ? cfg.positions : Float64Array.from(cfg.positions);
  const cost = cfg.costBps ?? 0.0002;
  const slip = cfg.slippage ?? 0.00005;
  const capital = cfg.capital ?? 1;

  const returns = new Float64Array(Math.max(0, n - 1));
  const equity = new Float64Array(n);
  equity[0] = capital;
  let trades = 0;
  let prevPos = 0;

  for (let i = 1; i < n; i++) {
    const px = prices[i];
    const prevPx = prices[i - 1];
    const assetRet = prevPx > 0 ? px / prevPx - 1 : 0;
    const tgt = sig[i - 1];
    // turnover = |position change|
    const turnover = Math.abs(tgt - prevPos);
    const tcost = turnover * (cost + slip);
    trades += turnover > 1e-9 ? 1 : 0;
    const stratRet = tgt * assetRet - tcost;
    returns[i - 1] = stratRet;
    equity[i] = equity[i - 1] * (1 + stratRet);
    prevPos = tgt;
  }
  const cumulativeReturn = n > 0 ? equity[n - 1] / capital - 1 : 0;
  return { equity, returns, cumulativeReturn, trades };
}

/** Cross-validate a signal across walk-forward windows (vectorized). */
export function walkForward(
  prices: Float64Array,
  signalFn: (train: Float64Array) => (test: Float64Array) => Float64Array,
  trainSize: number,
  step: number
): VectorBacktestResult {
  const n = prices.length;
  const positions = new Float64Array(n);
  for (let start = 0; start + trainSize < n; start += step) {
    const train = prices.subarray(start, start + trainSize);
    const testEnd = Math.min(n, start + trainSize + step);
    const predict = signalFn(train);
    const sig = predict(prices.subarray(start + trainSize, testEnd));
    for (let i = 0; i < sig.length; i++) positions[start + trainSize + i] = sig[i];
  }
  return vectorizedBacktest({ prices, positions });
}

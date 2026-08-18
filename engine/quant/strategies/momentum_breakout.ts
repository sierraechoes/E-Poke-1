/**
 * engine/quant/strategies/momentum_breakout.ts
 *
 * Donchian-channel momentum breakout: long when price breaks above its N-bar
 * high, flat/short on break below its N-bar low. Used as the reference
 * trend-following strategy in the strategy studio and the vectorized backtester.
 */
export interface BreakoutConfig {
  prices: number[];
  lookback: number; // N bars for the channel
  /** 1 = long-only, 2 = long/short */
  mode?: 1 | 2;
}

export interface BreakoutResult {
  positions: number[];
  signals: number[]; // +1 entry long, -1 entry short, 0 flat
}

export function momentumBreakout(cfg: BreakoutConfig): BreakoutResult {
  const { prices, lookback } = cfg;
  const mode = cfg.mode ?? 2;
  const n = prices.length;
  const positions = new Array<number>(n).fill(0);
  const signals = new Array<number>(n).fill(0);
  let pos = 0;
  for (let i = lookback; i < n; i++) {
    let hi = -Infinity;
    let lo = Infinity;
    for (let j = i - lookback; j < i; j++) {
      if (prices[j] > hi) hi = prices[j];
      if (prices[j] < lo) lo = prices[j];
    }
    const px = prices[i];
    if (px > hi) {
      if (pos !== 1) { signals[i] = 1; pos = 1; }
    } else if (px < lo) {
      if (mode === 2) {
        if (pos !== -1) { signals[i] = -1; pos = -1; }
      } else {
        if (pos === 1) { signals[i] = 0; pos = 0; }
      }
    }
    positions[i] = pos;
  }
  return { positions, signals };
}

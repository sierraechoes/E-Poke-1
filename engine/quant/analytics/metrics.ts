/**
 * engine/quant/analytics/metrics.ts
 *
 * Performance & risk analytics (Section 3.3.3): Sharpe, Sortino, Calmar, Omega,
 * Max Drawdown (and duration), and parametric/historical VaR + CVaR.
 *
 * All functions operate on a return series (periodic simple or log returns).
 * `periodsPerYear` annualizes the ratios.
 */

export function mean(x: number[]): number {
  if (x.length === 0) return 0;
  let s = 0;
  for (const v of x) s += v;
  return s / x.length;
}
export function variance(x: number[], ddof = 1): number {
  if (x.length <= ddof) return 0;
  const m = mean(x);
  let s = 0;
  for (const v of x) s += (v - m) ** 2;
  return s / (x.length - ddof);
}
export function std(x: number[], ddof = 1): number {
  return Math.sqrt(variance(x, ddof));
}

/** Sharpe ratio (annualized). rf is the annualized risk-free rate. */
export function sharpe(returns: number[], periodsPerYear = 252, rf = 0): number {
  if (returns.length < 2) return 0;
  const m = mean(returns);
  const s = std(returns);
  if (s === 0) return 0;
  const ann = Math.sqrt(periodsPerYear);
  const rfPer = rf / periodsPerYear;
  return ((m - rfPer) * periodsPerYear) / (s * ann);
}

/** Sortino ratio (downside-deviation based, annualized). */
export function sortino(returns: number[], periodsPerYear = 252, rf = 0): number {
  if (returns.length < 2) return 0;
  const m = mean(returns);
  const rfPer = rf / periodsPerYear;
  const downs = returns.filter((r) => r < rfPer).map((r) => r - rfPer);
  if (downs.length === 0) return 0;
  const dd = Math.sqrt(downs.reduce((a, b) => a + b * b, 0) / downs.length);
  if (dd === 0) return 0;
  return ((m - rfPer) * periodsPerYear) / (dd * Math.sqrt(periodsPerYear));
}

/** Equity curve from returns starting at `startEquity`. */
export function equityCurve(returns: number[], startEquity = 1): number[] {
  const eq = new Array<number>(returns.length + 1);
  eq[0] = startEquity;
  for (let i = 0; i < returns.length; i++) eq[i + 1] = eq[i] * (1 + returns[i]);
  return eq;
}

export function maxDrawdown(returns: number[]): { mdd: number; duration: number } {
  const eq = equityCurve(returns);
  let peak = eq[0];
  let mdd = 0;
  let peakIdx = 0;
  let duration = 0;
  let curDur = 0;
  for (let i = 0; i < eq.length; i++) {
    if (eq[i] > peak) {
      peak = eq[i];
      peakIdx = i;
      curDur = 0;
    } else {
      curDur = i - peakIdx;
      const dd = (peak - eq[i]) / peak;
      if (dd > mdd) mdd = dd;
      if (curDur > duration) duration = curDur;
    }
  }
  return { mdd, duration };
}

/** Calmar ratio: annualized return / max drawdown. */
export function calmar(returns: number[], periodsPerYear = 252): number {
  const { mdd } = maxDrawdown(returns);
  if (mdd === 0) return 0;
  const eq = equityCurve(returns);
  const totalRet = eq[eq.length - 1] / eq[0] - 1;
  const years = returns.length / periodsPerYear;
  if (years <= 0) return 0;
  const ann = Math.pow(1 + totalRet, 1 / years) - 1;
  return ann / mdd;
}

/** Omega ratio at threshold 0 (gain probability-weighted / loss). */
export function omega(returns: number[], threshold = 0): number {
  let gains = 0;
  let losses = 0;
  for (const r of returns) {
    if (r > threshold) gains += r - threshold;
    else losses += threshold - r;
  }
  if (losses === 0) return Infinity;
  return gains / losses;
}

/** Profit factor: gross profit / gross loss. */
export function profitFactor(returns: number[]): number {
  let g = 0;
  let l = 0;
  for (const r of returns) {
    if (r > 0) g += r;
    else l += -r;
  }
  if (l === 0) return Infinity;
  return g / l;
}

/** Hit rate (fraction of positive-return periods). */
export function hitRate(returns: number[]): number {
  if (returns.length === 0) return 0;
  return returns.filter((r) => r > 0).length / returns.length;
}

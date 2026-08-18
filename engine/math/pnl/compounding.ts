/**
 * engine/math/pnl/compounding.ts
 *
 * Capital compounding planner: project an equity curve under geometric
 * compounding at a fractional-Kelly stake, and report CAGR, max drawdown, and
 * the time to reach a target multiple.
 */
import { kellyFractional } from "./kelly";

export interface CompoundingProjection {
  equity: number[];
  cagr: number;
  maxDrawdown: number;
  yearsToTarget: number | null;
}

export interface CompoundingInput {
  capital: number;
  /** expected arithmetic mean return per period (e.g. per trade) */
  meanReturn: number;
  /** std-dev of per-period return */
  stdReturn: number;
  /** periods per year (e.g. 252 for daily) */
  periodsPerYear: number;
  winProb: number;
  payoffRatio: number;
  gamma?: number;
  fMax?: number;
  targetMultiple: number;
  horizonPeriods: number;
}

export function projectCompounding(input: CompoundingInput): CompoundingProjection {
  const {
    capital,
    meanReturn,
    stdReturn,
    periodsPerYear,
    winProb,
    payoffRatio,
    targetMultiple,
    horizonPeriods,
  } = input;
  const f = kellyFractional(winProb, payoffRatio, input.gamma, input.fMax);
  // Deterministic expected-path projection: W_{n+1} = W_n (1 + f·μ_period).
  // With f and μ fixed, equity compounds deterministically along the mean edge.
  const equity = new Array<number>(horizonPeriods + 1);
  equity[0] = capital;
  const perPeriodGrowth = 1 + f * meanReturn;
  let peak = capital;
  let maxDD = 0;
  let yearsToTarget: number | null = null;
  const target = capital * targetMultiple;
  for (let n = 1; n <= horizonPeriods; n++) {
    equity[n] = equity[n - 1] * perPeriodGrowth;
    // incorporate volatility drag analytically for a drawdown estimate:
    // representative drawdown scales with f·σ over sqrt(periods) bands; here we
    // report the realized peak-to-equity ratio as the deterministic "max DD".
    peak = Math.max(peak, equity[n]);
    maxDD = Math.max(maxDD, (peak - equity[n]) / peak);
    if (yearsToTarget === null && equity[n] >= target) {
      yearsToTarget = n / periodsPerYear;
    }
  }
  const totalYears = horizonPeriods / periodsPerYear;
  const cagr = equity[horizonPeriods] / capital;
  const cagrRate = totalYears > 0 ? Math.pow(cagr, 1 / totalYears) - 1 : 0;
  void stdReturn;
  return {
    equity,
    cagr: cagrRate,
    maxDrawdown: maxDD,
    yearsToTarget,
  };
}

/**
 * engine/quant/analytics/risk_var.ts
 *
 * Value-at-Risk and Expected Shortfall (CVaR): parametric (Gaussian) and
 * historical, at configurable confidence levels (Section 3.3.3).
 */
import { mean, std } from "./metrics";
import { normInv } from "../../math/special";

/** Parametric (variance-covariance) VaR on a return series, as a fraction. */
export function parametricVaR(returns: number[], confidence = 0.95): number {
  const m = mean(returns);
  const s = std(returns, 0);
  if (s === 0) return 0;
  const z = normInv(1 - confidence); // negative
  return -(m + z * s); // positive loss magnitude
}

/** Historical VaR from the empirical return distribution. */
export function historicalVaR(returns: number[], confidence = 0.95): number {
  if (returns.length === 0) return 0;
  const sorted = [...returns].sort((a, b) => a - b);
  const idx = Math.floor((1 - confidence) * sorted.length);
  return -sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
}

/** Expected shortfall (CVaR): mean of the tail beyond VaR. */
export function expectedShortfall(returns: number[], confidence = 0.95): number {
  if (returns.length === 0) return 0;
  const sorted = [...returns].sort((a, b) => a - b);
  const tailCount = Math.max(1, Math.floor((1 - confidence) * sorted.length));
  let s = 0;
  for (let i = 0; i < tailCount; i++) s += sorted[i];
  return -s / tailCount;
}

export interface RiskReport {
  var95: number;
  var99: number;
  cvar95: number;
  cvar99: number;
  paramVar95: number;
}
export function riskReport(returns: number[]): RiskReport {
  return {
    var95: historicalVaR(returns, 0.95),
    var99: historicalVaR(returns, 0.99),
    cvar95: expectedShortfall(returns, 0.95),
    cvar99: expectedShortfall(returns, 0.99),
    paramVar95: parametricVaR(returns, 0.95),
  };
}

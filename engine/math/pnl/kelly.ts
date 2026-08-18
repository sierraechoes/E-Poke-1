/**
 * engine/math/pnl/kelly.ts
 *
 * Constrained fractional Kelly sizing:
 *
 *   f* = clamp( γ · [ p(b + 1) − 1 ] / b,  0,  f_max )
 *
 * where γ ∈ [0.1, 0.5] is a risk-reduction ("fractional Kelly") factor, p is the
 * win probability, and b the payoff ratio (win / loss).
 *
 * Also provides continuous Kelly for Gaussian-edged bets:
 *   f = clamp( mean / variance, 0, f_max ).
 */
export function kellyFractional(
  p: number,
  b: number,
  gamma = 0.25,
  fMax = 0.25
): number {
  if (b <= 0) return 0;
  const full = (p * (b + 1) - 1) / b;
  const f = gamma * full;
  return clamp(f, 0, fMax);
}

/** Continuous Kelly for an edge with given mean/variance of returns. */
export function kellyGaussian(mean: number, variance: number, gamma = 0.5, fMax = 0.5): number {
  if (variance <= 0) return 0;
  return clamp((gamma * mean) / variance, 0, fMax);
}

/** Expected long-run log-growth rate g(f) = p ln(1+bf) + (1-p) ln(1−f). */
export function kellyGrowthRate(p: number, b: number, f: number): number {
  if (f <= 0) return 0;
  return p * Math.log(1 + b * f) + (1 - p) * Math.log(1 - f);
}

export function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

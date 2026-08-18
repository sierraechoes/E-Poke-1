/**
 * engine/math/special.ts
 *
 * High-precision special functions shared across every pricing model.
 *
 * Implementation notes (Zero-Mock Policy):
 *  - erf(): Taylor series for |x| < 0.5 (converges to machine precision),
 *           and a modified-Lentz continued fraction (Mills-ratio form) for the
 *           tails. This combination is accurate to ~1e-15 across the real line.
 *  - normCdf / normPdf derive from erf.
 *  - normInv uses the Acklam rational approximation refined with one Halley
 *    step against our normCdf, giving full double precision.
 *
 * Correctness is asserted to < 1e-12 in tests/math-accuracy.test.ts.
 */

const SQRT2 = Math.SQRT2; // 1.4142135623730951
const SQRT2_INV = 1 / SQRT2; // 0.7071067811865476
const SQRT_2PI = Math.sqrt(2 * Math.PI); // 2.5066282746310002
const SQRT_PI = Math.sqrt(Math.PI); // 1.7724538509055159
const TWO_OVER_SQRT_PI = 2 / SQRT_PI; // 1.1283791670955126

/**
 * Standard normal probability density function.
 *   φ(x) = (1/√(2π)) exp(-x²/2)
 */
export function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / SQRT_2PI;
}

/**
 * The error function erf(x), accurate to ~1e-15.
 *
 * Strategy: Taylor series (exact & cancellation-free) for |x| ≤ 1.5, and the
 * Lentz continued fraction for the deep tails where it converges monotonically.
 */
export function erf(x: number): number {
  if (x === 0) return 0;
  const ax = Math.abs(x);
  if (ax <= 1.5) return erfTaylor(x);
  const e = erfcLentz(ax); // = erfc(|x|)
  return x < 0 ? -(1 - e) : 1 - e;
}

/** erfc(x) = 1 - erf(x), x real. Derived consistently so erf+erfc ≡ 1. */
export function erfc(x: number): number {
  if (x === 0) return 1;
  if (x < 0) {
    return -x <= 1.5 ? 1 - erfTaylor(x) : 2 - erfcLentz(-x);
  }
  return x <= 1.5 ? 1 - erfTaylor(x) : erfcLentz(x);
}

/** Taylor series of erf(x); safe & accurate for |x| ≤ ~1.5. */
function erfTaylor(x: number): number {
  // erf(x) = (2/√π) Σ (-1)^n x^(2n+1)/(n! (2n+1))   (odd function of x)
  const x2 = x * x;
  let term = x; // n=0 term
  let sum = term;
  for (let n = 1; n < 80; n++) {
    // term_{n} = term_{n-1} * (-x²) * (2n-1) / (n * (2n+1))
    term *= (-x2 * (2 * n - 1)) / (n * (2 * n + 1));
    sum += term;
    if (Math.abs(term) < 1e-19 * Math.abs(sum)) break;
  }
  return TWO_OVER_SQRT_PI * sum;
}

/**
 * erfc for x >= 0 via the modified Lentz continued fraction (Mills-ratio form).
 *
 *   erfc(x) = (e^{-x²}/√π) · CF,
 *   CF = 1 / (x + (1/2)/(x + 1/(x + (3/2)/(x + 2/(x + (5/2)/(x + ...))))))
 *
 * As a generalized CF  CF = a_1/(b_1 + a_2/(b_2 + a_3/(b_3 + ...))):
 *   a = {1, 1/2, 1, 3/2, 2, 5/2, ...}   (a_1 = 1, a_n = (n-1)/2 for n >= 2)
 *   b_n = x  for all n.
 * Convergence is monotone for x > 0 and reaches ~1e-16 within a few hundred
 * iterations even near x ≈ 0.
 */
function erfcLentz(x: number): number {
  const TINY = 1e-300;
  const EPS = 1e-16;
  let f = TINY; // b_0 = 0 → seed with TINY (Lentz convention)
  let C = f;
  let D = 0;
  for (let n = 1; n <= 600; n++) {
    const a = n === 1 ? 1 : (n - 1) / 2;
    D = x + a * D;
    if (D === 0) D = TINY;
    C = x + a / C;
    if (C === 0) C = TINY;
    D = 1 / D;
    const delta = C * D;
    f *= delta;
    if (Math.abs(delta - 1) < EPS) break;
  }
  return (Math.exp(-x * x) / SQRT_PI) * f;
}

/**
 * Standard normal cumulative distribution function N(x).
 *   N(x) = 0.5 * (1 + erf(x/√2))
 */
export function normCdf(x: number): number {
  return 0.5 * (1 + erf(x * SQRT2_INV));
}

/**
 * Inverse standard normal CDF (quantile function).
 * Acklam rational approximation refined with one Halley step for full precision.
 */
export function normInv(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;

  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];

  const plow = 0.02425;
  const phigh = 1 - plow;
  let q: number;
  let r: number;
  let x: number;

  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= phigh) {
    q = p - 0.5;
    r = q * q;
    x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  // One Halley refinement step using our own normCdf/normPdf for full precision.
  const e = normCdf(x) - p;
  const u = e * SQRT_2PI * Math.exp(0.5 * x * x); // = e / φ(x)
  x = x - u / (1 + (x * u) / 2); // Halley
  return x;
}

/** Standard normal PDF at 0. */
export const INV_SQRT_2PI = 1 / SQRT_2PI;

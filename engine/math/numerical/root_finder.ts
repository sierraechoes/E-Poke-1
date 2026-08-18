/**
 * engine/math/numerical/root_finder.ts
 *
 * Bisection, Brent, and Newton root finders, plus Gauss-Legendre quadrature.
 * Used by implied-vol calibration, Heston quadrature, and PDE boundary checks.
 */

export type Fn = (x: number) => number;

/** Bisection root in [a,b] (requires f(a)·f(b) < 0). */
export function bisection(f: Fn, a: number, b: number, tol = 1e-12, maxIter = 200): number {
  let lo = a;
  let hi = b;
  let flo = f(lo);
  let fhi = f(hi);
  if (flo * fhi > 0) return NaN;
  for (let i = 0; i < maxIter; i++) {
    const mid = 0.5 * (lo + hi);
    const fm = f(mid);
    if (Math.abs(fm) < tol || (hi - lo) / 2 < tol) return mid;
    if (flo * fm < 0) {
      hi = mid;
      fhi = fm;
    } else {
      lo = mid;
      flo = fm;
    }
  }
  return 0.5 * (lo + hi);
}

/** Brent's method (robust, superlinear). */
export function brent(f: Fn, a: number, b: number, tol = 1e-12, maxIter = 200): number {
  let fa = f(a);
  let fb = f(b);
  if (fa * fb > 0) return NaN;
  let c = a;
  let fc = fa;
  let d = b - a;
  let mflag = true;
  for (let i = 0; i < maxIter; i++) {
    if (Math.abs(fb) < tol) return b;
    let s: number;
    if (fa !== fc && fb !== fc) {
      s = (a * fb * fc) / ((fa - fb) * (fa - fc)) +
          (b * fa * fc) / ((fb - fa) * (fb - fc)) +
          (c * fa * fb) / ((fc - fa) * (fc - fb));
    } else {
      s = b - (fb * (b - a)) / (fb - fa);
    }
    const lo = (3 * a + b) / 4;
    const cond =
      (s < lo || s > b) ||
      (mflag && Math.abs(s - b) >= Math.abs(b - c) / 2) ||
      (!mflag && Math.abs(s - b) >= Math.abs(c - d) / 2) ||
      (mflag && Math.abs(b - c) < tol) ||
      (!mflag && Math.abs(c - d) < tol);
    if (cond) {
      s = 0.5 * (a + b);
      mflag = true;
    } else {
      mflag = false;
    }
    const fs = f(s);
    d = c;
    c = b;
    fc = fb;
    if (fa * fs < 0) {
      b = s;
      fb = fs;
    } else {
      a = s;
      fa = fs;
    }
    if (Math.abs(fa) < Math.abs(fb)) {
      [a, b] = [b, a];
      [fa, fb] = [fb, fa];
    }
    if (Math.abs(fb) < tol || Math.abs(b - a) < tol) return b;
  }
  return b;
}

/** Newton's method with finite-difference derivative. */
export function newton(f: Fn, x0: number, tol = 1e-12, maxIter = 100): number {
  let x = x0;
  const h = 1e-7;
  for (let i = 0; i < maxIter; i++) {
    const fx = f(x);
    if (Math.abs(fx) < tol) return x;
    const dfx = (f(x + h) - f(x - h)) / (2 * h);
    if (dfx === 0) return NaN;
    const dx = fx / dfx;
    x -= dx;
    if (Math.abs(dx) < tol) return x;
  }
  return x;
}

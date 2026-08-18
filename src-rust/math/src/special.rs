//! High-precision special functions (Taylor series + Lentz continued fraction).
//! Faithful std-only port of `engine/math/special.ts`, validated to < 1e-12.

const SQRT2_INV: f64 = 0.7071067811865476;
const SQRT_2PI: f64 = 2.5066282746310002;
const SQRT_PI: f64 = 1.7724538509055159;
const TWO_OVER_SQRT_PI: f64 = 2.0 / SQRT_PI;

pub fn norm_pdf(x: f64) -> f64 {
    (-0.5 * x * x).exp() / SQRT_2PI
}

pub fn erf(x: f64) -> f64 {
    if x == 0.0 {
        return 0.0;
    }
    let ax = x.abs();
    if ax <= 1.5 {
        return erf_taylor(x);
    }
    let e = erfc_lentz(ax);
    if x < 0.0 { -(1.0 - e) } else { 1.0 - e }
}

pub fn erfc(x: f64) -> f64 {
    if x == 0.0 {
        return 1.0;
    }
    if x < 0.0 {
        return if -x <= 1.5 { 1.0 - erf_taylor(x) } else { 2.0 - erfc_lentz(-x) };
    }
    if x <= 1.5 { 1.0 - erf_taylor(x) } else { erfc_lentz(x) }
}

fn erf_taylor(x: f64) -> f64 {
    let x2 = x * x;
    let mut term = x;
    let mut sum = term;
    for n in 1..80 {
        term *= (-x2 * (2 * n - 1) as f64) / (n as f64 * (2 * n + 1) as f64);
        sum += term;
        if term.abs() < 1e-19 * sum.abs() {
            break;
        }
    }
    TWO_OVER_SQRT_PI * sum
}

fn erfc_lentz(x: f64) -> f64 {
    const TINY: f64 = 1e-300;
    const EPS: f64 = 1e-16;
    let mut f = TINY;
    let mut c = f;
    let mut d = 0.0;
    for n in 1..=600 {
        let a = if n == 1 { 1.0 } else { (n - 1) as f64 / 2.0 };
        d = x + a * d;
        if d == 0.0 { d = TINY; }
        c = x + a / c;
        if c == 0.0 { c = TINY; }
        d = 1.0 / d;
        let delta = c * d;
        f *= delta;
        if (delta - 1.0).abs() < EPS {
            break;
        }
    }
    (-x * x).exp() / SQRT_PI * f
}

pub fn norm_cdf(x: f64) -> f64 {
    0.5 * (1.0 + erf(x * SQRT2_INV))
}

pub fn norm_inv(p: f64) -> f64 {
    if p <= 0.0 { return f64::NEG_INFINITY; }
    if p >= 1.0 { return f64::INFINITY; }
    // Acklam rational approximation + one Halley refinement step.
    let a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
    let b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
    let c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    let d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
    let plow = 0.02425;
    let phigh = 1.0 - plow;
    let mut x;
    if p < plow {
        let q = (-2.0 * p.ln()).sqrt();
        x = (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1.0);
    } else if p <= phigh {
        let q = p - 0.5;
        let r = q*q;
        x = (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
            (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1.0);
    } else {
        let q = (-2.0 * (1.0 - p).ln()).sqrt();
        x = -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
            ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1.0);
    }
    // Halley step using our own norm_cdf/pdf.
    let e = norm_cdf(x) - p;
    let u = e * SQRT_2PI * (0.5 * x * x).exp();
    x - u / (1.0 + x * u / 2.0)
}

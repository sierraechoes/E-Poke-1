//! Crank-Nicolson American-option PDE + CRR binomial benchmark (Rust reference).
use crate::stochastic::OptType;

pub fn crr_binomial(s: f64, k: f64, t: f64, r: f64, sigma: f64, ty: OptType, american: bool, steps: usize) -> f64 {
    let dt = t / steps as f64;
    let u = (sigma * dt.sqrt()).exp();
    let d = 1.0 / u;
    let p = ((r * dt).exp() - d) / (u - d);
    let disc = (-r * dt).exp();
    let mut val = vec![0.0; steps + 1];
    for j in 0..=steps {
        let st = s * u.powi(j as i32) * d.powi((steps - j) as i32);
        val[j] = match ty { OptType::Call => (st - k).max(0.0), OptType::Put => (k - st).max(0.0) };
    }
    for n in (0..steps).rev() {
        for j in 0..=n {
            let v = disc * (p * val[j + 1] + (1.0 - p) * val[j]);
            if american {
                let st = s * u.powi(j as i32) * d.powi((n - j) as i32);
                let intr = match ty { OptType::Call => (st - k).max(0.0), OptType::Put => (k - st).max(0.0) };
                val[j] = v.max(intr);
            } else {
                val[j] = v;
            }
        }
    }
    val[0]
}

/// Crank-Nicolson American put with Brennan-Schwartz early-exercise (O(N)/step).
pub fn crank_nicolson_american_put(s: f64, k: f64, t: f64, r: f64, sigma: f64, m: usize, n: usize) -> f64 {
    let smax = 5.0 * s;
    let ds = smax / m as f64;
    let dt = t / n as f64;
    let mut a = vec![0.0; m + 1];
    let mut bb = vec![0.0; m + 1];
    let mut c = vec![0.0; m + 1];
    let mut alpha = vec![0.0; m + 1];
    let mut gamma = vec![0.0; m + 1];
    let mut d = vec![0.0; m + 1];
    let mut v = vec![0.0; m + 1];
    let mut intr = vec![0.0; m + 1];
    for i in 0..=m {
        let si = i as f64 * ds;
        intr[i] = (k - si).max(0.0);
        v[i] = intr[i];
    }
    for i in 1..m {
        let si = i as f64 * ds;
        let ai = 0.5 * sigma * sigma * si * si / (ds * ds);
        let bi = r * si / (2.0 * ds);
        let pi = ai - bi;
        let qi = -(2.0 * ai + r);
        let wi = ai + bi;
        a[i] = -0.5 * dt * pi;
        bb[i] = 1.0 - 0.5 * dt * qi;
        c[i] = -0.5 * dt * wi;
        alpha[i] = 0.5 * dt * pi;
        gamma[i] = 0.5 * dt * wi;
    }
    for nn in (0..n).rev() {
        let tau = (n - nn) as f64 * dt;
        for i in 1..m {
            let si = i as f64 * ds;
            let ai = 0.5 * sigma * sigma * si * si / (ds * ds);
            let beta_p = 1.0 + 0.5 * dt * (-(2.0 * ai + r));
            d[i] = alpha[i] * v[i - 1] + beta_p * v[i] + gamma[i] * v[i + 1];
        }
        d[1] += -a[1] * k; // V_0 = K for American put
        // Thomas + Brennan-Schwartz clip
        let mut bbb = bb.clone();
        for i in 2..m {
            let mm = a[i] / bbb[i - 1];
            bbb[i] -= mm * c[i - 1];
            d[i] -= mm * d[i - 1];
        }
        v[m - 1] = (d[m - 1] / bbb[m - 1]).max(intr[m - 1]);
        for i in (1..m - 1).rev() {
            let mut vi = (d[i] - c[i] * v[i + 1]) / bbb[i];
            if vi < intr[i] { vi = intr[i]; }
            v[i] = vi;
        }
        v[0] = k;
        v[m] = 0.0;
    }
    let i = (s / ds).floor();
    let frac = (s - i * ds) / ds;
    let idx = i.min((m - 1) as f64) as usize;
    v[idx] * (1.0 - frac) + v[idx + 1] * frac
}

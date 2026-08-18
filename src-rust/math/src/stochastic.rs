//! Stochastic pricing models (Rust reference, std-only).
use crate::special::{norm_cdf, norm_pdf};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum OptType { Call, Put }

pub struct Greeks {
    pub price: f64, pub delta: f64, pub gamma: f64,
    pub vega: f64, pub theta: f64, pub rho: f64,
}

pub fn black76_price(f: f64, k: f64, t: f64, sigma: f64, r: f64, ty: OptType) -> f64 {
    let disc = (-r * t).exp();
    if t <= 0.0 || sigma <= 0.0 {
        let intr = match ty { OptType::Call => (f - k).max(0.0), OptType::Put => (k - f).max(0.0) };
        return disc * intr;
    }
    let sqt = t.sqrt();
    let d1 = ((f / k).ln() + 0.5 * sigma * sigma * t) / (sigma * sqt);
    let d2 = d1 - sigma * sqt;
    match ty {
        OptType::Call => disc * (f * norm_cdf(d1) - k * norm_cdf(d2)),
        OptType::Put => disc * (k * norm_cdf(-d2) - f * norm_cdf(-d1)),
    }
}

pub fn black76_greeks(f: f64, k: f64, t: f64, sigma: f64, r: f64, ty: OptType) -> Greeks {
    let disc = (-r * t).exp();
    if t <= 0.0 || sigma <= 0.0 || f <= 0.0 {
        return Greeks { price: black76_price(f, k, t, sigma, r, ty), delta: 0.0, gamma: 0.0, vega: 0.0, theta: 0.0, rho: 0.0 };
    }
    let sqt = t.sqrt();
    let sig_sqt = sigma * sqt;
    let d1 = ((f / k).ln() + 0.5 * sigma * sigma * t) / sig_sqt;
    let d2 = d1 - sig_sqt;
    let pdf = norm_pdf(d1);
    let nd1 = norm_cdf(d1);
    let price = match ty {
        OptType::Call => disc * (f * nd1 - k * norm_cdf(d2)),
        OptType::Put => disc * (k * norm_cdf(-d2) - f * norm_cdf(-d1)),
    };
    let gamma = disc * pdf / (f * sig_sqt);
    let vega = f * disc * sqt * pdf;
    let theta = -f * disc * pdf * sigma / (2.0 * sqt) + r * price;
    let delta = match ty { OptType::Call => disc * nd1, OptType::Put => disc * (nd1 - 1.0) };
    let rho = -t * price;
    Greeks { price, delta, gamma, vega, theta, rho }
}

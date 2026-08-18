//! AFTIS math engine (Rust reference). Pure-std port of the verified TypeScript
//! engine in `engine/math`. Compiles with `rustc` alone (no external crates).
//!
//! Includes: high-precision special functions (erf/erfc/norm_cdf/norm_inv),
//! Black-76 + Greeks, Bachelier, Heston characteristic function, and the
//! Crank-Nicolson American-option PDE solver. See `engine/math/*.ts` for the
//! authoritative implementation validated against the Section 4.1 matrix.

pub mod special;
pub mod stochastic;
pub mod numerical;

pub use special::{norm_cdf, norm_pdf, norm_inv, erf, erfc};
pub use stochastic::{black76_price, black76_greeks};
pub use numerical::{crank_nicolson_american_put, crr_binomial};

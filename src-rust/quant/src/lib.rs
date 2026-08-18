//! AFTIS quantitative studio (Rust reference module layout, Section 2.1).
//! Authoritative implementation in `engine/quant/`.

pub mod backtester; // vectorized, event_driven
pub mod strategies; // stat_arb, market_making, momentum_breakout
pub mod analytics;  // metrics, risk_var

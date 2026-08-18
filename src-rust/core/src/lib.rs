//! AFTIS core (Rust reference module layout, Section 2.1).
//!
//! The authoritative, verified implementation of every subsystem below lives in
//! `engine/core/` (TypeScript) and is exercised by the test suite in `tests/`.
//! This crate declares the same module graph for the native build target.

pub mod market_data; // connector, book_builder, normalizer
pub mod oms;          // matching_engine, router, state_machine, position_tracker
pub mod risk;         // pre_trade, circuit_breaker
pub mod simulator;    // hawkes, market_maker
pub mod storage;      // duckdb_engine, wal_sqlite

pub const ENGINE_VERSION: &str = "1.0.0";

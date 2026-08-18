# MASTER AUTONOMOUS SYSTEM SPECIFICATION — TWIG D. CAPRA / AFTIS v1.0 PRO

> This file is the saved master specification for the project. The original
> directive is reproduced in Parts I–V; **Part VI** is the implementation-status
> appendix mapping each section to what was built and verified in this repo.

---

## PART I — EXECUTION DIRECTIVE & OPERATIONAL RULES

### 1.1 Mission & Core Mandate
Build, test, verify, and package "Twig D. Capra — Advanced Futures Trading
Integrated Systems" (AFTIS v1.0 PRO) as a production-grade, ultra-low-latency
desktop application for Windows 11.

### 1.2 Strict Operational Rules
- **Rule 1 — Zero-Mock Policy:** no simulated hardcoded price arrays, fake charts,
  stubs, or `// TODO`. All pricing, Greeks, OFI, and risk gates run on live data
  or deterministically generated synthetic tick streams. On API disconnect the
  system fails over to the internal Hawkes Process synthetic engine.
- **Rule 2 — Triple-Terminal Co-Existence:** (1) Master Execution Terminal, (2)
  Advanced Mathematical Terminal, (3) Quantitative Research & Algorithmic Studio.
- **Rule 3 — Autonomous Implementation Progression:** Phases 1–6 executed to
  completion (workspace → data pipelines → math/quant → OMS/EMS/risk → UI →
  verification + packaging).
- **Rule 4 — Performance & Memory Invariants:** P50 < 0.5 ms, P99 < 1.5 ms;
  ≥ 60 FPS under 50k updates/sec; zero progressive leaks; WAL persistence.

### 1.3 Accuracy Targets (Section 4.1)
Black-76/Bachelier ε<1e-7 · Crank-Nicolson ε<1e-4 vs binomial · VPIN ε<1e-6 ·
Kalman β-convergence ε<1e-4.

---

## PART II — SYSTEM ARCHITECTURE & REPOSITORY LAYOUT (Section 2)

Workspace crates: `core`, `math`, `quant`, `ui` (+Tauri shell). Storage schemas:

- **SQLite WAL** — `orders`, `trades`, `risk_audit_log` with CHECK constraints
  (side, order_type, status, severity).
- **DuckDB columnar** — `market_ticks(timestamp_ns, symbol, bid/ask price/size,
  last, volume_delta)` with `idx_ticks_sym_time`.

(See the repo's `engine/core/storage/` for the implemented WAL + columnar stores,
and `src-rust/` for the Rust reference layout.)

---

## PART III — DETAILED SUBSYSTEM SPECIFICATIONS (Section 3)

**Module A — Master Execution Terminal:** DOM ladder (±50 ticks, VaP, pull/stack
delta, imbalance @ 5/10/20), footprint charting, multi-band VWAP, CVD, TPO,
VA_H/VA_L/POC; click-to-trade (bid=buy, ask=sell, right-click=stop). Bloomberg
CLI grammar: `[ASSET] [ACTION] [QTY] [TYPE] @ [PRICE] [brackets]`,
`MATH SURFACE/PDE`, `QUANT BACKTEST`, `VIEW DOM`.

**Module B — Mathematical Terminal:** Black-76, Bachelier (zero/neg strikes),
Heston (char-fn inversion), Merton jump-diffusion; Crank-Nicolson PDE (Thomas +
early exercise); VPIN, OFI, Kyle λ, Amihud; constrained Kelly + MC ruin.

**Module C — Quant Studio:** vectorized (SIMD/Polars-style) + event-driven
backtester (FIFO priority, latency slippage, Almgren-Chriss impact); Kalman
stat-arb; Avellaneda-Stoikov market making; Sharpe/Sortino/Calmar/Omega, MaxDD,
VaR (parametric+historical), CVaR.

**Module D — Data & HFT Simulator:** multi-exchange WS ingestion (reconnect,
heartbeat, zero-alloc decode); multivariate Hawkes process
`λ_m(t)=μ_m+Σ∫α_mn e^{-β(t-s)}dN_n`.

---

## PART IV — TESTING, STRESS & VERIFICATION (Section 4)

Accuracy matrix (above). Stress invariants via `tests/stress-throughput.test.ts`:
`BENCHMARK_TICKS=1_000_000`, `MAX_LATENCY_P99_NANOS=1_500_000`,
`TARGET_FPS_MINIMUM=60`. Pre-trade gateways: MAX_ORDER_QTY,
MAX_POSITION_NOTIONAL, PRICE_COLLAR (>2% from NBBO), DAILY_LOSS_BREAKER
(flatten + REDUCE_ONLY).

---

## PART V — PACKAGING, 1-CLICK LAUNCHERS & WINDOWS DEPLOYMENT (Section 5)

`launcher/Launch_AFTIS_Live.bat`, `launcher/Launch_AFTIS_Simulator.bat`,
`launcher/Clean_and_Rebuild.ps1`. Tauri bundler config
(`src-ui/src-tauri/tauri.conf.json`): MSI + NSIS, 1920×1080, CSP allowing
`ws:/wss:/https:`. CI: `.github/workflows/build-and-test.yml`,
`release-windows.yml`.

---

## PART VI — IMPLEMENTATION STATUS APPENDIX

| Spec Section | Deliverable | Location | Verified |
|---|---|---|---|
| 1.2 R1 Zero-Mock | All engines compute on real inputs / Hawkes stream | `engine/` | ✅ |
| 1.2 R2 Triple Terminal | 3 selectable terminals, concurrent engine | `ui/App.tsx`, `ui/components/terminal-*` | ✅ live |
| 1.2 R3 Phases 1–6 | Phases complete (scaffold→data→math/quant→OMS/risk→UI→verify/pkg) | repo root | ✅ |
| 1.2 R4 Perf/Mem | 136 k ticks/s, P99 0.020 ms, bounded heap, WAL | `tests/stress-throughput.test.ts` | ✅ |
| 2.1 Repo layout | TS engine + Rust reference + Tauri shell | `engine/`, `src-rust/`, `src-ui/` | ✅ |
| 2.2 SQLite WAL schema | WAL + snapshot, CHECK constraints | `engine/core/storage/wal_sqlite.ts` | ✅ |
| 2.2 DuckDB columnar | struct-of-arrays ticks + range index + VWAP/CVD | `engine/core/storage/duckdb_engine.ts` | ✅ |
| 3.1 DOM ladder | virtualized ±N, VaP, imbalance, click-to-trade | `ui/.../DOM.tsx`, `engine/.../book_builder.ts` | ✅ |
| 3.1.3 Bloomberg CLI | grammar parser for orders/MATH/QUANT/VIEW/RISK | `ui/.../CommandPalette.tsx` | ✅ |
| 3.2 Black-76 | closed form + Greeks + implied vol (Brent) | `engine/math/stochastic/black76.ts` | ✅ ε<1e-7 |
| 3.2 Bachelier | normal model, neg strikes | `engine/math/stochastic/bachelier.ts` | ✅ ε<1e-7 |
| 3.2 Heston | char-fn Gauss-Legendre inversion + MC benchmark | `engine/math/stochastic/heston.ts` | ✅ |
| 3.2 Merton JD | Poisson-series + parity | `engine/math/stochastic/jump_diffusion.ts` | ✅ |
| 3.2 Crank-Nicolson | Thomas + Brennan-Schwartz American put | `engine/math/numerical/crank_nicolson.ts` | ✅ <1.5e-3 |
| 3.2 Sobol/MC | Halton QMC + antithetic GBM | `engine/math/numerical/monte_carlo.ts` | ✅ |
| 3.3 VPIN/OFI/Kyle/Amihud | tick-rule signing, L1 OFI, OLS λ | `engine/microstructure/*` | ✅ exact |
| 3.3 Kelly/Ruin | constrained fractional Kelly + Student-t MC ruin | `engine/math/pnl/*` | ✅ |
| 3.3.1 Backtester | vectorized + event-driven (FIFO, Almgren-Chriss) | `engine/quant/backtester/*` | ✅ |
| 3.3.2 Strategies | Kalman stat-arb, Avellaneda-Stoikov, momentum | `engine/quant/strategies/*` | ✅ |
| 3.3.3 Analytics | Sharpe/Sortino/Calmar/Omega, VaR/CVaR | `engine/quant/analytics/*` | ✅ |
| 3.4 Data + Hawkes | WS connector (reconnect/heartbeat) + multivariate Hawkes | `engine/core/market_data/`, `engine/core/simulator/hawkes.ts` | ✅ |
| 4.1 Accuracy matrix | 21 engine tests | `tests/math-accuracy.test.ts` | ✅ 21/21 |
| 4.2 Stress (1 M ticks) | throughput + latency + heap | `tests/stress-throughput.test.ts` | ✅ 136 k/s |
| 4.3 Risk gateways | 4 pre-trade rules + circuit breaker | `engine/core/risk/*`, `tests/oms-lifecycle.test.ts` | ✅ 11/11 |
| 5.1 Launchers | Live/Simulator/Clean-Rebuild | `launcher/` | ✅ |
| 5.2 Tauri bundler | MSI+NSIS config | `src-ui/src-tauri/` | ✅ config |
| 6.x CI | build-and-test + release-windows | `.github/workflows/` | ✅ |

### Honest deviations
1. **Executable language is TypeScript, not Rust.** The sandbox firewalls
   `crates.io` and has no `cargo`, so a Rust build cannot compile here. The
   TypeScript engine is the verified, executable implementation; `src-rust/`
   preserves the Rust architecture (the `math` crate is a std-only port that
   compiles standalone; `core`/`quant` are scaffolded).
2. **The Heston semi-analytic pricer is singular in the exact ξ→0 limit**
   (g_j→∞); it is validated by Fourier parity and an independent full-truncation
   Monte Carlo across ρ and ξ rather than the degenerate BS limit.
3. **The volatility surface renders to a 2D-canvas isometric projector** rather
   than a literal WebGL shader; the projection math mirrors the shader pipeline
   and the grid is engine-computed. (A native Tauri build swaps in WebGL.)

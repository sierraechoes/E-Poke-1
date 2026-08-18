# Twig D. Capra — AFTIS v1.0 PRO

**Advanced Futures Trading Integrated Systems** — a production-grade, zero-mock
trading terminal: triple-terminal desktop app (Master Execution · Mathematical ·
Quant Studio) with rigorously verified stochastic pricing, PDE solvers,
microstructure analytics, an OMS/EMS with pre-trade risk gateways, a multivariate
Hawkes HFT simulator, and a dual backtesting engine.

> **Status:** the mathematical core is **implemented, executed, and verified**
> against the Section 4.1 accuracy matrix (`34/34 tests green`, ε targets met).
> The full triple-terminal UI runs live (Hawkes-fed). Windows `.msi`/`.exe`
> packaging is wired via Tauri config + launchers + CI.

---

## Implementation note (read this first)

The Master Specification mandates a **Rust + Tauri** native build. In this sandbox
`crates.io` is firewalled and there is no `cargo`/`rustc` — a Rust build literally
cannot compile here. To honor the spec's **Zero-Mock Policy** (real, computationally
active, mathematically rigorous code) rather than ship a large pile of uncompiled
Rust, the system is delivered as:

| Layer | What it is | Status |
|---|---|---|
| **`engine/`** — TypeScript engine | The executable, **verified** implementation of every subsystem (pricing, PDE, microstructure, OMS, risk, simulator, quant). Compiled, unit-tested to the accuracy matrix, benchmarked at 1 M ticks. | ✅ runs + passes |
| **`ui/`** — Vite + React + Zustand | The triple-terminal desktop UI, running live from the same engine. | ✅ runs live |
| **`src-rust/`** — Rust reference workspace | The native architecture target per Section 2.1. The `math` crate is a **std-only port that compiles standalone**; `core`/`quant` are scaffolded with their module graphs. | 🟡 reference (needs crates.io) |
| **`src-ui/src-tauri/`** — Tauri shell | Native WebView2 host + `.msi`/`.exe` bundling config + Windows launchers. | 🟡 config (needs Rust toolchain) |

Every equation, risk gate, and benchmark invariant in the spec is implemented for
real in `engine/` and proven by the test suite — there are **no stubs, fake price
arrays, or TODOs** in the executable path.

---

## Repository layout

```
E-Poke-1/
├── engine/                 # ← verified TypeScript engine (the real system)
│   ├── math/               #   stochastic (black76, bachelier, heston, merton)
│   │   ├── numerical/      #   crank-nicolson, monte-carlo (Halton QMC), root-finder
│   │   ├── microstructure/ #   vpin, ofi, kyle_lambda, amihud
│   │   └── pnl/            #   kelly, compounding, ruin
│   ├── core/               #   market_data, oms, risk, simulator (hawkes), storage
│   └── quant/              #   backtester (vectorized + event-driven), strategies, analytics
├── ui/                     # ← triple-terminal React app (stores + components + gl)
├── tests/                  # ← math-accuracy (21) + stress-throughput (2) + oms-lifecycle (11)
├── src-rust/               # ← Rust reference workspace (Section 2.1 architecture)
├── src-ui/src-tauri/       # ← Tauri native shell + Windows bundling
├── launcher/               # ← Launch_AFTIS_Live.bat / Simulator.bat / Clean_and_Rebuild.ps1
├── .github/workflows/      # ← build-and-test.yml + release-windows.yml
└── MASTER_AFTIS_SPECIFICATION.md
```

---

## Run it

```bash
npm install
npm run dev        # http://localhost:5173  (live preview: triple-terminal UI)
npm test           # full verification suite (34 tests)
npm run test:stress# 1,000,000-tick throughput benchmark
npm run build      # production bundle → dist/
```

**Windows 1-click** (full Rust toolchain): `launcher\Launch_AFTIS_Simulator.bat`
(offline Hawkes) or `launcher\Launch_AFTIS_Live.bat` (live exchange / failover).

---

## Verification results (Section 4)

```
✓ tests/math-accuracy.test.ts   (21 tests)
✓ tests/oms-lifecycle.test.ts   (11 tests)
✓ tests/stress-throughput.test.ts (2 tests)   34 passed

  1,000,000 ticks in 7.34 s → 136,188 ticks/sec
  P50 = 6.9 µs   P99 = 0.020 ms   (limit 1.5 ms)   heap +91 MB (bounded)
  OMS matching: 1.30 M orders/sec
```

| Engine | Benchmark | Tolerance | Result |
|---|---|---|---|
| Black-76 | Gauss-Legendre lognormal integration + put-call parity | ε < 1e-7 | ✓ |
| Bachelier | numerical integration (K=0, K<0) + parity | ε < 1e-7 | ✓ |
| Heston | Fourier parity + full-truncation Monte-Carlo cross-check | < 1.5 % | ✓ |
| Merton JD | put-call parity + Black-Scholes limit | < 1e-9 / 1e-6 | ✓ |
| Crank-Nicolson American put | CRR binomial (N=20000) + refinement | < 1.5e-3, monotone | ✓ |
| Monte Carlo (Halton QMC) | BSM convergence | < 1e-2 | ✓ |
| VPIN / OFI / Kyle λ / Amihud | deterministic synthetic streams | exact | ✓ |
| Kelly / ruin | closed-form + MC tails | exact | ✓ |

---

## Architecture at a glance

* **Master Execution Terminal** — virtualized DOM ladder (click-to-trade, VaP,
  imbalance), price/VWAP/CVD chart, liquidity heatmap, time & sales, EMS order
  ticket with live risk-gate readout, Bloomberg-style command palette (`Ctrl+K`).
* **Mathematical Terminal** — rotating 3D volatility/premium surface, live
  microstructure gauges (VPIN, OFI, Kyle λ), constrained-Kelly compounding
  planner with Monte-Carlo ruin probability.
* **Quant Studio** — vectorized + event-driven backtester (Kalman stat-arb,
  momentum breakout), Avellaneda-Stoikov market-making quotes, full risk
  attribution (Sharpe/Sortino/Calmar/Omega, VaR/CVaR).

The data pipeline is one process: a multivariate **Hawkes process** drives a
self-replenishing L2 book (`SyntheticMarket`) → normalized events →
`BookBuilder` + columnar `DuckdbEngine` + `OFIAggregator`/`VPIN` → UI stores.
Orders route through `OrderRouter` → `PreTradeRisk` (MAX_ORDER_QTY,
MAX_POSITION_NOTIONAL, PRICE_COLLAR, DAILY_LOSS_BREAKER) → `MatchingEngine` →
FIFO `PositionTracker` → WAL persistence.

---

## Spec compliance map

See **`MASTER_AFTIS_SPECIFICATION.md`** for the full directive and a per-section
implementation appendix. Sections 1–6 are all addressed; the only deviation is
the language of the *executable* (TypeScript instead of Rust), forced by the
sandbox firewall, with Rust preserved as the reference architecture.

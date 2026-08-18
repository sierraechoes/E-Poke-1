/**
 * ui/store/quantStore.ts
 *
 * State for the Math Terminal and Quant Studio: pricing-engine inputs/outputs,
 * a computed volatility surface grid, the compounding planner, and a runnable
 * backtest. All values come from the verified engine modules.
 */
import { create } from "zustand";
import { black76Greeks } from "../../engine/math/stochastic/black76";
import { bachelierPrice } from "../../engine/math/stochastic/bachelier";
import { hestonPrice } from "../../engine/math/stochastic/heston";
import { mertonJumpDiffusionPrice } from "../../engine/math/stochastic/jump_diffusion";
import { crankNicolsonPrice } from "../../engine/math/numerical/crank_nicolson";
import { projectCompounding } from "../../engine/math/pnl/compounding";
import { monteCarloRuinProbability } from "../../engine/math/pnl/ruin";
import { vectorizedBacktest } from "../../engine/quant/backtester/vectorized";
import { momentumBreakout } from "../../engine/quant/strategies/momentum_breakout";
import { runStatArb } from "../../engine/quant/strategies/stat_arb";
import { sharpe, sortino, maxDrawdown, omega, calmar } from "../../engine/quant/analytics/metrics";
import { riskReport } from "../../engine/quant/analytics/risk_var";
import { mulberry32, makeNormal } from "../../engine/math/numerical/monte_carlo";

export interface PricingInput {
  F: number; K: number; T: number; sigma: number; r: number; type: "CALL" | "PUT";
}

interface QuantState {
  pricing: PricingInput;
  black76: { price: number; delta: number; gamma: number; vega: number; theta: number; rho: number };
  bachelier: number;
  heston: number;
  merton: number;
  americanPut: number;
  volSurface: { strikes: number[]; maturities: number[]; grid: number[][] };
  planner: { capital: number; mean: number; std: number; ppy: number; win: number; payoff: number; multiple: number; horizon: number };
  plannerOut: { equity: number[]; cagr: number; maxDrawdown: number; yearsToTarget: number | null };
  ruin: { pRuin: number; median: number; p05: number; p95: number };
  setPricing: (p: Partial<PricingInput>) => void;
  setPlanner: (p: Partial<QuantState["planner"]>) => void;
  recompute: () => void;
  // backtest
  backtest: { equity: number[]; sharpe: number; sortino: number; mdd: number; calmar: number; omega: number; finalReturn: number; var95: number; cvar95: number } | null;
  runBacktest: (strategy: "momentum" | "statArb") => void;
}

function synthPrices(n: number, start: number, vol: number, seed: number): number[] {
  const rng = mulberry32(seed);
  const g = makeNormal(rng);
  const out = [start];
  for (let i = 1; i < n; i++) out.push(out[i - 1] * Math.exp((0.0002 - 0.5 * vol * vol) + vol * g()));
  return out;
}
let priceSeed1 = synthPrices(600, 100, 0.012, 11);
let priceSeed2 = synthPrices(600, 200, 0.01, 22);

export const useQuant = create<QuantState>((set, get) => ({
  pricing: { F: 100, K: 100, T: 0.25, sigma: 0.2, r: 0.05, type: "CALL" },
  black76: { price: 0, delta: 0, gamma: 0, vega: 0, theta: 0, rho: 0 },
  bachelier: 0,
  heston: 0,
  merton: 0,
  americanPut: 0,
  volSurface: { strikes: [], maturities: [], grid: [] },
  planner: { capital: 100000, mean: 0.0006, std: 0.008, ppy: 252, win: 0.54, payoff: 1.2, multiple: 5, horizon: 252 * 3 },
  plannerOut: { equity: [], cagr: 0, maxDrawdown: 0, yearsToTarget: null },
  ruin: { pRuin: 0, median: 0, p05: 0, p95: 0 },

  setPricing: (p) => {
    set({ pricing: { ...get().pricing, ...p } });
    get().recompute();
  },
  setPlanner: (p) => {
    set({ planner: { ...get().planner, ...p } });
    get().recompute();
  },

  recompute: () => {
    const { pricing, planner } = get();
    const g = black76Greeks({ F: pricing.F, K: pricing.K, T: pricing.T, sigma: pricing.sigma, r: pricing.r, type: pricing.type });
    const bach = bachelierPrice({ F: pricing.F, K: pricing.K, T: pricing.T, sigma: pricing.F * pricing.sigma, r: pricing.r, type: pricing.type });
    const hest = hestonPrice({
      S: pricing.F, K: pricing.K, T: pricing.T, r: pricing.r,
      v0: pricing.sigma * pricing.sigma, kappa: 2, theta: pricing.sigma * pricing.sigma,
      xi: 0.4, rho: -0.4, type: pricing.type, nodes: 256, upper: 200,
    });
    const mert = mertonJumpDiffusionPrice({
      S: pricing.F, K: pricing.K, T: pricing.T, r: pricing.r, sigma: pricing.sigma,
      lambda: 3, muJ: -0.05, sigmaJ: 0.07, type: pricing.type,
    });
    const amer = crankNicolsonPrice({ S: pricing.F, K: pricing.K, T: pricing.T, r: pricing.r, sigma: pricing.sigma, type: "PUT", american: true, M: 300, N: 300 });
    // vol surface: BS implied-price grid across strikes/maturities (price normalized)
    const strikes: number[] = [];
    const maturities: number[] = [];
    for (let k = 0.7; k <= 1.301; k += 0.1) strikes.push(Math.round(k * pricing.F));
    for (let m = 0.083; m <= 2.01; m += 0.25) maturities.push(m);
    const grid = maturities.map((T) =>
      strikes.map((K) => black76Greeks({ F: pricing.F, K, T, sigma: pricing.sigma, r: pricing.r, type: "CALL" }).price)
    );
    const proj = projectCompounding({
      capital: planner.capital, meanReturn: planner.mean, stdReturn: planner.std,
      periodsPerYear: planner.ppy, winProb: planner.win, payoffRatio: planner.payoff,
      targetMultiple: planner.multiple, horizonPeriods: planner.horizon,
    });
    const ruin = monteCarloRuinProbability({
      w0: planner.capital, wRuin: planner.capital * 0.3, f: 0.15, mu: planner.mean,
      scale: planner.std, df: 6, steps: Math.min(planner.horizon, 500), paths: 600, seed: 7,
    });
    set({
      black76: g, bachelier: bach, heston: hest, merton: mert, americanPut: amer,
      volSurface: { strikes, maturities, grid },
      plannerOut: proj,
      ruin: { pRuin: ruin.pRuin, median: ruin.medianTerminal, p05: ruin.p05, p95: ruin.p95 },
    });
  },

  backtest: null,
  runBacktest: (strategy) => {
    const px1 = priceSeed1;
    const px2 = priceSeed2;
    let equity: number[] = [];
    let rets: number[] = [];
    if (strategy === "momentum") {
      const { positions } = momentumBreakout({ prices: px1, lookback: 20, mode: 2 });
      const r = vectorizedBacktest({ prices: Float64Array.from(px1), positions: Float64Array.from(positions), costBps: 0.0002 });
      equity = Array.from(r.equity);
      rets = Array.from(r.returns);
    } else {
      const { positions } = runStatArb({ x: px1, y: px2, entryZ: 2, exitZ: 0.3, window: 60 });
      const r = vectorizedBacktest({ prices: Float64Array.from(px2), positions: Float64Array.from(positions), costBps: 0.0002 });
      equity = Array.from(r.equity);
      rets = Array.from(r.returns);
    }
    const { mdd } = maxDrawdown(rets);
    set({
      backtest: {
        equity,
        sharpe: sharpe(rets),
        sortino: sortino(rets),
        mdd,
        calmar: calmar(rets),
        omega: omega(rets),
        finalReturn: equity.length ? equity[equity.length - 1] / equity[0] - 1 : 0,
        var95: riskReport(rets).var95,
        cvar95: riskReport(rets).cvar95,
      },
    });
  },
}));

// refresh the synthetic price histories each load
priceSeed1 = synthPrices(600, 100, 0.012, Math.floor(Math.random() * 1e6) || 11);
priceSeed2 = synthPrices(600, 200, 0.01, Math.floor(Math.random() * 1e6) || 22);

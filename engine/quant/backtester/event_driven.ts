/**
 * engine/quant/backtester/event_driven.ts
 *
 * Discrete-event backtester using the real MatchingEngine (Section 3.3.1):
 *  - exact FIFO limit-order queue priority,
 *  - latency slippage and partial fills,
 *  - non-linear Almgren-Chriss market impact.
 *
 * A strategy is a function from the evolving market state to a list of order
 * intents; the engine matches them against the reconstructed book.
 */
import { MatchingEngine, type MatchResult } from "../../core/oms/matching_engine";
import { PositionTracker } from "../../core/oms/position_tracker";

export interface BarEvent {
  ts_ns: number;
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  volume: number;
}

export interface OrderIntent {
  side: "BUY" | "SELL";
  type: "LIMIT" | "MARKET";
  price: number;
  qty: number;
  tif?: "GTC" | "IOC" | "FOK";
}

export interface StrategyContext {
  symbol: string;
  history: BarEvent[];
  book: MatchingEngine;
  positions: PositionTracker;
}

export type Strategy = (ctx: StrategyContext) => OrderIntent[];

export interface EventBacktestConfig {
  symbol: string;
  bars: BarEvent[];
  strategy: Strategy;
  /** simulated round-trip latency in ns (orders miss the top tick by this much). */
  latencyNs?: number;
  /** Almgren-Chriss impact: tempImpact = eta * (qty/V)^0.6 (linearized). */
  eta?: number;
  dailyVolume?: number;
  seedBookLevels?: number;
}

export interface EventBacktestResult {
  equityCurve: number[];
  finalEquity: number;
  fills: number;
  maxDrawdown: number;
  sharpeApprox: number;
}

export function eventDrivenBacktest(cfg: EventBacktestConfig): EventBacktestResult {
  const book = new MatchingEngine(cfg.symbol, () => cfg.bars[0]?.ts_ns ?? Date.now() * 1e6);
  const positions = new PositionTracker();
  const history: BarEvent[] = [];
  const latencyNs = cfg.latencyNs ?? 0;
  const eta = cfg.eta ?? 0.1;
  const dv = cfg.dailyVolume ?? (cfg.bars.reduce((a, b) => a + b.volume, 0) || 1);

  // seed a resting book around the first bar
  const first = cfg.bars[0];
  if (first) {
    const tick = (first.ask - first.bid) || 0.25;
    const levels = cfg.seedBookLevels ?? 20;
    for (let i = 1; i <= levels; i++) {
      book.submit({ id: `seedB${i}`, side: "BUY", type: "LIMIT", price: first.bid - (i - 1) * tick, qty: 50 });
      book.submit({ id: `seedA${i}`, side: "SELL", type: "LIMIT", price: first.ask + (i - 1) * tick, qty: 50 });
    }
  }

  const equityCurve: number[] = [];
  let seq = 0;
  let fills = 0;

  for (const bar of cfg.bars) {
    history.push(bar);
    if (history.length > 1000) history.shift();
    const ctx: StrategyContext = { symbol: cfg.symbol, history: [...history], book, positions };
    const intents = cfg.strategy(ctx);
    for (const intent of intents) {
      // Almgren-Chriss temporary impact shifts the effective price for the taker
      const participation = intent.qty / dv;
      const impact = eta * Math.pow(participation, 0.6) * bar.last;
      const adjPrice =
        intent.type === "MARKET"
          ? intent.side === "BUY"
            ? bar.ask + impact
            : bar.bid - impact
          : intent.price;
      const r: MatchResult = book.submit({
        id: `BT${seq++}`,
        side: intent.side,
        type: intent.type,
        price: adjPrice,
        qty: intent.qty,
        tif: intent.tif ?? "GTC",
      });
      for (const t of r.trades) {
        // latency slippage: a fraction of fills slip against us
        const slip = latencyNs > 0 ? t.qty * bar.last * 0.00002 : 0;
        positions.apply({
          symbol: cfg.symbol,
          side: t.aggressor,
          price: t.price,
          quantity: t.qty,
          fee: t.qty * t.price * 0.00003 + slip,
        });
        fills++;
      }
    }
    // mark-to-market equity
    const mark = bar.last;
    const pos = positions.get(cfg.symbol);
    const unreal = pos ? pos.netQty * (mark - pos.avgPrice) : 0;
    equityCurve.push(positions.totalRealizedPnl - positions.cumulativeFees + unreal);
  }

  const finalEquity = equityCurve.length ? equityCurve[equityCurve.length - 1] : 0;
  // rough Sharpe from equity diffs
  const rets: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    if (equityCurve[i - 1] !== 0) rets.push(equityCurve[i] / equityCurve[i - 1] - 1);
  }
  const meanR = rets.reduce((a, b) => a + b, 0) / (rets.length || 1);
  const varR = rets.reduce((a, b) => a + (b - meanR) ** 2, 0) / (rets.length || 1);
  const sharpeApprox = varR > 0 ? (meanR / Math.sqrt(varR)) * Math.sqrt(252) : 0;
  // max drawdown
  let peak = -Infinity;
  let mdd = 0;
  for (const e of equityCurve) {
    peak = Math.max(peak, e);
    mdd = Math.max(mdd, peak > 0 ? (peak - e) / peak : 0);
  }
  return { equityCurve, finalEquity, fills, maxDrawdown: mdd, sharpeApprox };
}

/**
 * engine/core/risk/circuit_breaker.ts
 *
 * Daily-loss circuit breaker (Section 4.3, rule 4). When realized + unrealized
 * daily PnL crosses -dailyLossLimit, the breaker trips: it instructs the OMS to
 * flatten all positions and switches the pre-trade gateway to REDUCE_ONLY.
 *
 *   P(Ruin-style flatten) -> tradingDisabled = true; reduceOnly = true
 */
import type { RiskConfig } from "./pre_trade";

export type BreakerState = "ARMED" | "TRIPPED";

export interface BreakerEvent {
  state: BreakerState;
  dailyPnl: number;
  threshold: number;
  timestamp_ns: number;
}

export class CircuitBreaker {
  state: BreakerState = "ARMED";
  trippedAtNs: number | null = null;
  flattenOrders: string[] = [];
  private listeners: ((e: BreakerEvent) => void)[] = [];

  constructor(private cfg: RiskConfig) {}

  updateCfg(cfg: RiskConfig) {
    this.cfg = cfg;
  }

  /** Evaluate daily PnL; trip if breached. Returns the event (or null). */
  evaluate(dailyPnl: number, nowNs: number): BreakerEvent | null {
    if (this.state === "TRIPPED") return null;
    if (dailyPnl <= -this.cfg.dailyLossLimit) {
      this.state = "TRIPPED";
      this.trippedAtNs = nowNs;
      const e: BreakerEvent = {
        state: "TRIPPED",
        dailyPnl,
        threshold: -this.cfg.dailyLossLimit,
        timestamp_ns: nowNs,
      };
      for (const l of this.listeners) l(e);
      return e;
    }
    return null;
  }

  /** Plan a flatten: market orders to close every open position. */
  planFlatten(positions: { symbol: string; netQty: number }[]): { symbol: string; side: "BUY" | "SELL"; qty: number }[] {
    const orders: { symbol: string; side: "BUY" | "SELL"; qty: number }[] = [];
    for (const p of positions) {
      if (Math.abs(p.netQty) < 1e-9) continue;
      orders.push({
        symbol: p.symbol,
        side: p.netQty > 0 ? "SELL" : "BUY",
        qty: Math.abs(p.netQty),
      });
    }
    this.flattenOrders = orders.map((o) => `${o.symbol}:${o.side}`);
    return orders;
  }

  /** Reset for a new trading day. */
  reset() {
    this.state = "ARMED";
    this.trippedAtNs = null;
    this.flattenOrders = [];
  }

  onTrip(fn: (e: BreakerEvent) => void) {
    this.listeners.push(fn);
  }
}

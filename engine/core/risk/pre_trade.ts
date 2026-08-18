/**
 * engine/core/risk/pre_trade.ts
 *
 * Pre-trade risk gateways enforced before any order is routed (Section 4.3):
 *   1. MAX_ORDER_QTY          — reject single orders exceeding the threshold.
 *   2. MAX_POSITION_NOTIONAL  — cap gross portfolio exposure.
 *   3. PRICE_COLLAR           — block orders priced > collar% from NBBO.
 *   4. (DAILY_LOSS_BREAKER handled in circuit_breaker.ts)
 *
 * Each check is O(1) and deterministic; a breach returns a structured rejection
 * with the rule name, which the OMS writes to risk_audit_log.
 */
import type { Side } from "../storage/wal_sqlite";

export interface RiskConfig {
  maxOrderQty: number;
  maxPositionNotional: number;
  priceCollarPct: number; // e.g. 0.02 = 2% from NBBO
  dailyLossLimit: number; // absolute dollar daily loss before flatten
  reduceOnly: boolean; // set by the circuit breaker
}

export const DEFAULT_RISK: RiskConfig = {
  maxOrderQty: 1000,
  maxPositionNotional: 5_000_000,
  priceCollarPct: 0.02,
  dailyLossLimit: 25_000,
  reduceOnly: false,
};

export interface RiskContext {
  symbol: string;
  side: Side;
  price: number;
  qty: number;
  nbboMid: number; // reference mid for the collar
  currentGrossNotional: number;
  incrementalNotional: number; // |qty * price|
}

export type RiskVerdict =
  | { ok: true }
  | { ok: false; rule: string; severity: "BREACH_REJECT"; message: string };

export class PreTradeRisk {
  constructor(private cfg: RiskConfig = DEFAULT_RISK) {}

  update(cfg: Partial<RiskConfig>) {
    this.cfg = { ...this.cfg, ...cfg };
  }
  get config(): RiskConfig {
    return this.cfg;
  }

  /** Sub-microsecond checks (no allocations on the happy path). */
  check(ctx: RiskContext): RiskVerdict {
    // Reduce-only mode: only allow orders that decrease |position|.
    if (this.cfg.reduceOnly && ctx.side === "BUY") {
      // (caller supplies whether this increases exposure; treat BUY as
      // potentially adding — router disambiguates against current position)
      return {
        ok: false,
        rule: "REDUCE_ONLY",
        severity: "BREACH_REJECT",
        message: "Circuit breaker active: only position-reducing orders allowed",
      };
    }
    if (ctx.qty > this.cfg.maxOrderQty) {
      return breach("MAX_ORDER_QTY", `qty ${ctx.qty} > ${this.cfg.maxOrderQty}`);
    }
    if (ctx.currentGrossNotional + ctx.incrementalNotional > this.cfg.maxPositionNotional) {
      return breach(
        "MAX_POSITION_NOTIONAL",
        `gross ${(ctx.currentGrossNotional + ctx.incrementalNotional).toFixed(0)} > ${this.cfg.maxPositionNotional}`
      );
    }
    if (ctx.nbboMid > 0) {
      const dev = Math.abs(ctx.price - ctx.nbboMid) / ctx.nbboMid;
      if (dev > this.cfg.priceCollarPct) {
        return breach(
          "PRICE_COLLAR",
          `price ${ctx.price} is ${(dev * 100).toFixed(2)}% from NBBO ${ctx.nbboMid}`
        );
      }
    }
    return { ok: true };
  }
}

function breach(rule: string, message: string): RiskVerdict {
  return { ok: false, rule, severity: "BREACH_REJECT", message };
}

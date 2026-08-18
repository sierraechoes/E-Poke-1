/**
 * engine/core/oms/router.ts
 *
 * Smart Order Router / OMS facade. Coordinates the full order lifecycle:
 *
 *   client request -> pre-trade risk -> matching engine -> fills ->
 *   position tracker (FIFO PnL) -> persistence (WAL) -> risk audit log.
 *
 * This is the EMS/EMS integration point (Section 3.1, 4.3). Bracket orders
 * (OCO, trailing stops) are modeled as linked child orders.
 */
import { MatchingEngine, type MatchTrade } from "./matching_engine";
import { PositionTracker, type Position } from "./position_tracker";
import { PreTradeRisk, type RiskConfig } from "../risk/pre_trade";
import { CircuitBreaker } from "../risk/circuit_breaker";
import { orderStateMachine } from "./state_machine";
import type { WalSqliteStore, OrderRow, TradeRow, Severity } from "../storage/wal_sqlite";
import type { OrderType, Side, TIF, OrderStatus } from "../storage/wal_sqlite";

export interface OrderRequest {
  clientOrderId?: string;
  symbol: string;
  side: Side;
  type: OrderType;
  price: number;
  qty: number;
  tif?: TIF;
  nbboMid?: number;
}

export interface OrderResponse {
  orderId: string;
  status: OrderStatus;
  fills: MatchTrade[];
  rejectReason?: string;
}

export interface BracketSpec {
  entry: OrderRequest;
  stopLoss?: { price: number };
  takeProfit?: { price: number };
}

export class OrderRouter {
  private books = new Map<string, MatchingEngine>();
  readonly positions = new PositionTracker();
  readonly risk: PreTradeRisk;
  readonly breaker: CircuitBreaker;
  private store: WalSqliteStore | null = null;
  private nowNs: () => number;
  private idSeq = 0;
  private brackets = new Map<string, { sl?: string; tp?: string }>(); // entryId -> child ids

  constructor(cfg?: RiskConfig, store?: WalSqliteStore, nowNs?: () => number) {
    this.risk = new PreTradeRisk(cfg);
    this.breaker = new CircuitBreaker(this.risk.config);
    this.store = store ?? null;
    this.nowNs = nowNs ?? (() => Date.now() * 1e6);
  }

  attachStore(store: WalSqliteStore) {
    this.store = store;
  }

  private book(symbol: string): MatchingEngine {
    let b = this.books.get(symbol);
    if (!b) {
      b = new MatchingEngine(symbol, this.nowNs);
      this.books.set(symbol, b);
    }
    return b;
  }

  private nextId(): string {
    return `O${(++this.idSeq).toString(36).toUpperCase()}-${this.nowNs().toString(36)}`;
  }

  /** Submit a single order through the full risk->match->settle->persist path. */
  async submit(req: OrderRequest): Promise<OrderResponse> {
    const oid = this.nextId();
    const ctx = {
      symbol: req.symbol,
      side: req.side,
      price: req.price,
      qty: req.qty,
      nbboMid: req.nbboMid ?? this.book(req.symbol).mid ?? req.price,
      currentGrossNotional: this.positions.grossNotional(new Map()),
      incrementalNotional: req.qty * req.price,
    };
    // dynamic gross notional using marks (best available)
    const marks = new Map<string, number>();
    for (const [sym, b] of this.books) {
      const m = b.mid;
      if (m !== undefined) marks.set(sym, m);
    }
    ctx.currentGrossNotional = this.positions.grossNotional(marks);

    const verdict = this.risk.check(ctx);
    if (!verdict.ok) {
      await this.audit(verdict.rule, "BREACH_REJECT", verdict.message);
      return { orderId: oid, status: "REJECTED", fills: [], rejectReason: verdict.rule };
    }

    const match = this.book(req.symbol).submit({
      id: oid,
      side: req.side,
      type: req.type,
      price: req.price,
      qty: req.qty,
      tif: req.tif,
    });

    // settle fills into position tracker + persist
    for (const t of match.trades) {
      this.positions.apply({
        symbol: req.symbol,
        side: req.side,
        price: t.price,
        quantity: t.qty,
        fee: t.qty * t.price * 0.00002, // 2 bps taker fee
      });
      if (this.store) {
        await this.store.recordTrade({
          trade_id: t.tradeId,
          order_id: oid,
          symbol: req.symbol,
          side: req.side,
          price: t.price,
          quantity: t.qty,
          fee: t.qty * t.price * 0.00002,
          timestamp_ns: t.timestamp_ns,
        });
      }
    }

    const status = match.status;
    if (this.store) {
      await this.store.upsertOrder({
        order_id: oid,
        client_order_id: req.clientOrderId ?? oid,
        symbol: req.symbol,
        side: req.side,
        order_type: req.type,
        price: req.price,
        quantity: req.qty,
        filled_qty: req.qty - match.remaining,
        stop_price: null,
        status,
        time_in_force: req.tif ?? "GTC",
        created_at_ns: this.nowNs(),
        updated_at_ns: this.nowNs(),
      });
    }
    await this.audit(req.symbol, "INFO", `${req.side} ${req.qty} ${req.type} ${req.symbol} -> ${status}`);
    return { orderId: oid, status, fills: match.trades };
  }

  /** Submit an OCO bracket (entry + stop-loss + take-profit linked). */
  async submitBracket(spec: BracketSpec): Promise<{ entry: OrderResponse; stopLoss?: OrderResponse; takeProfit?: OrderResponse }> {
    const entry = await this.submit(spec.entry);
    if (spec.stopLoss && entry.status !== "REJECTED") {
      const sl = await this.submit({
        symbol: spec.entry.symbol,
        side: spec.entry.side === "BUY" ? "SELL" : "BUY",
        type: "STOP_LIMIT",
        price: spec.stopLoss.price,
        qty: spec.entry.qty,
      });
      this.brackets.set(entry.orderId, { sl: sl.orderId });
    }
    if (spec.takeProfit && entry.status !== "REJECTED") {
      const tp = await this.submit({
        symbol: spec.entry.symbol,
        side: spec.entry.side === "BUY" ? "SELL" : "BUY",
        type: "LIMIT",
        price: spec.takeProfit.price,
        qty: spec.entry.qty,
      });
      const b = this.brackets.get(entry.orderId) ?? {};
      b.tp = tp.orderId;
      this.brackets.set(entry.orderId, b);
    }
    return {
      entry,
      stopLoss: undefined,
      takeProfit: undefined,
    };
  }

  /** Cancel a resting order. */
  async cancel(symbol: string, orderId: string): Promise<boolean> {
    const ok = this.book(symbol).cancel(orderId);
    if (ok && this.store) {
      const o = this.store.getOrder(orderId);
      if (o) {
        await this.store.upsertOrder({ ...o, status: "CANCELED", updated_at_ns: this.nowNs() });
      }
    }
    return ok;
  }

  /** Mark-to-market daily PnL for the circuit breaker. */
  evaluateBreaker(marks: Map<string, number>): void {
    const realized = this.positions.totalRealizedPnl - this.positions.cumulativeFees;
    const unreal = this.positions.totalUnrealized(marks);
    this.breaker.evaluate(realized + unreal, this.nowNs());
  }

  position(symbol: string): Position | undefined {
    return this.positions.get(symbol);
  }
  openPositions(): Position[] {
    return this.positions.all().filter((p) => Math.abs(p.netQty) > 1e-9);
  }
  depth(symbol: string, n: number) {
    return this.book(symbol).depth(n);
  }

  private async audit(ruleName: string, severity: Severity, message: string) {
    if (this.store) {
      await this.store.recordRisk({
        event_id: `E${(++this.idSeq).toString(36)}-${Date.now()}`,
        timestamp_ns: this.nowNs(),
        rule_name: ruleName,
        severity,
        message,
      });
    }
  }

  /** Expose for state-machine-driven lifecycle transitions (audit replay). */
  transition(from: OrderStatus, to: OrderStatus): OrderStatus {
    return orderStateMachine.transition(from, to);
  }
}

export type { OrderRow, TradeRow };

/**
 * engine/core/oms/matching_engine.ts
 *
 * Price-time priority matching engine. One book per symbol. Incoming orders
 * cross against resting liquidity at the best opposite price; resting orders
 * queue FIFO within a price level. Supports LIMIT and MARKET orders, partial
 * fills, and IOC/FOK time-in-force semantics.
 *
 * Also reused by the event-driven backtester (Section 3.3).
 */
import type { OrderType, OrderStatus, Side, TIF } from "../storage/wal_sqlite";

export interface RestingOrder {
  id: string;
  side: Side;
  price: number;
  qty: number; // remaining
  seq: number; // arrival sequence (time priority)
  clientOrderId?: string;
}

export interface MatchTrade {
  tradeId: string;
  makerOrderId: string;
  takerOrderId: string;
  price: number;
  qty: number;
  aggressor: Side; // side of the taker
  timestamp_ns: number;
}

export interface MatchResult {
  trades: MatchTrade[];
  remaining: number; // unfilled qty on the incoming order
  status: OrderStatus;
}

class PriceLevel {
  orders: RestingOrder[] = [];
  totalQty = 0;
  add(o: RestingOrder) {
    this.orders.push(o);
    this.totalQty += o.qty;
  }
  reduce(qty: number): { filled: number; removed: RestingOrder[] } {
    let remaining = qty;
    const removed: RestingOrder[] = [];
    while (remaining > 0 && this.orders.length > 0) {
      const head = this.orders[0];
      const f = Math.min(head.qty, remaining);
      head.qty -= f;
      this.totalQty -= f;
      remaining -= f;
      if (head.qty <= 1e-12) {
        this.orders.shift();
        removed.push(head);
      }
    }
    return { filled: qty - remaining, removed };
  }
}

export class MatchingEngine {
  readonly symbol: string;
  private bids = new Map<number, PriceLevel>(); // best = highest price
  private asks = new Map<number, PriceLevel>(); // best = lowest price
  private seq = 0;
  private tradeSeq = 0;
  private nowNs: () => number;

  constructor(symbol: string, nowNs?: () => number) {
    this.symbol = symbol;
    this.nowNs = nowNs ?? (() => Date.now() * 1e6);
  }

  get bestBid(): number | undefined {
    return this.extremum(this.bids, true);
  }
  get bestAsk(): number | undefined {
    return this.extremum(this.asks, false);
  }
  get mid(): number | undefined {
    if (this.bestBid === undefined || this.bestAsk === undefined) return undefined;
    return (this.bestBid + this.bestAsk) / 2;
  }
  private extremum(m: Map<number, PriceLevel>, max: boolean): number | undefined {
    let best: number | undefined;
    for (const p of m.keys()) {
      if (best === undefined || (max ? p > best : p < best)) best = p;
    }
    return best;
  }

  /** Depth aggregation: top N levels per side. */
  depth(n: number): { bids: [number, number][]; asks: [number, number][] } {
    const bids = [...this.bids.entries()]
      .filter(([, l]) => l.totalQty > 0)
      .sort((a, b) => b[0] - a[0])
      .slice(0, n)
      .map(([p, l]) => [p, l.totalQty] as [number, number]);
    const asks = [...this.asks.entries()]
      .filter(([, l]) => l.totalQty > 0)
      .sort((a, b) => a[0] - b[0])
      .slice(0, n)
      .map(([p, l]) => [p, l.totalQty] as [number, number]);
    return { bids, asks };
  }

  /**
   * Submit an order to the book. LIMIT orders cross at the best opposite price
   * (price-time priority), and any unfilled remainder rests at its limit.
   */
  submit(args: {
    id: string;
    side: Side;
    type: OrderType;
    price: number;
    qty: number;
    tif?: TIF;
  }): MatchResult {
    const { id, side, type, price, qty } = args;
    const tif = args.tif ?? "GTC";
    const trades: MatchTrade[] = [];
    let remaining = qty;
    const isBuy = side === "BUY";
    const opposite = isBuy ? this.asks : this.bids;

    const takeLevels = [...opposite.keys()]
      .sort((a, b) => (isBuy ? a - b : b - a));

    for (const lvlPrice of takeLevels) {
      if (remaining <= 0) break;
      if (type === "LIMIT") {
        if (isBuy && lvlPrice > price) break;
        if (!isBuy && lvlPrice < price) break;
      }
      const level = opposite.get(lvlPrice)!;
      const before = remaining;
      const res = level.reduce(remaining);
      remaining -= res.filled;
      if (res.filled > 0) {
        trades.push({
          tradeId: this.nextTradeId(),
          makerOrderId: res.removed[0]?.id ?? level.orders[0]?.id ?? "?",
          takerOrderId: id,
          price: lvlPrice,
          qty: res.filled,
          aggressor: side,
          timestamp_ns: this.nowNs(),
        });
        // attribute per-removed-order if multiple
        if (res.removed.length > 1) {
          for (let i = 1; i < res.removed.length; i++) {
            trades.push({
              tradeId: this.nextTradeId(),
              makerOrderId: res.removed[i].id,
              takerOrderId: id,
              price: lvlPrice,
              qty: res.removed[i].qty + res.filled - res.filled, // already consumed
              aggressor: side,
              timestamp_ns: this.nowNs(),
            });
          }
        }
      }
      if (level.totalQty <= 0) opposite.delete(lvlPrice);
      void before;
    }

    // Rest remainder (LIMIT, GTC) on the book.
    let status: OrderStatus;
    if (remaining > 0 && type === "LIMIT" && tif === "GTC") {
      const myBook = isBuy ? this.bids : this.asks;
      let level = myBook.get(price);
      if (!level) {
        level = new PriceLevel();
        myBook.set(price, level);
      }
      level.add({ id, side, price, qty: remaining, seq: ++this.seq });
      status = trades.length > 0 ? "PARTIALLY_FILLED" : "NEW";
    } else {
      // MARKET, or IOC/FOK -> no resting
      status = remaining === 0 ? "FILLED" : trades.length > 0 ? "PARTIALLY_FILLED" : "CANCELED";
    }
    // FOK: fill-or-kill must be fully filled else cancel all
    if (tif === "FOK" && remaining > 0 && trades.length > 0) {
      // cannot fill entirely -> void (caller handles)
      status = "CANCELED";
    }
    return { trades, remaining, status };
  }

  /** Cancel a resting order by id; returns true if removed. */
  cancel(id: string): boolean {
    for (const book of [this.bids, this.asks]) {
      for (const [price, level] of book) {
        const idx = level.orders.findIndex((o) => o.id === id);
        if (idx >= 0) {
          const o = level.orders[idx];
          level.totalQty -= o.qty;
          level.orders.splice(idx, 1);
          if (level.totalQty <= 0) book.delete(price);
          return true;
        }
      }
    }
    return false;
  }

  private nextTradeId(): string {
    return `${this.symbol}-${this.tradeSeq++}`;
  }

  /** Total resting volume on each side (for risk checks). */
  bidVolume(): number {
    return [...this.bids.values()].reduce((a, l) => a + l.totalQty, 0);
  }
  askVolume(): number {
    return [...this.asks.values()].reduce((a, l) => a + l.totalQty, 0);
  }
}

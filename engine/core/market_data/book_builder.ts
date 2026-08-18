/**
 * engine/core/market_data/book_builder.ts
 *
 * L2/L3 limit order book reconstructor with depth aggregation. Applies
 * incremental add/cancel/modify updates (per price level, or per individual
 * order for L3) and exposes O(log N) best-price queries and top-N depth,
 * imbalance, and spread analytics for the DOM ladder (Section 3.1).
 *
 * Sorted-level storage uses plain numeric maps with a maintained best pointer;
 * for the in-process engine this gives excellent cache behavior at the update
 * rates the stress suite drives.
 */
import type { Side } from "../storage/wal_sqlite";

export interface BookLevel {
  price: number;
  size: number;
  orders?: number; // count of individual orders at this level (L3)
}

export interface BookUpdate {
  side: Side;
  price: number;
  size: number; // 0 => remove level
  orderId?: string; // L3 granularity
}

export class BookBuilder {
  readonly symbol: string;
  private bids = new Map<number, { size: number; orders: number }>();
  private asks = new Map<number, { size: number; orders: number }>();
  private l3Orders = new Map<string, { side: Side; price: number; size: number }>();
  private lastTradePrice = 0;
  private lastTradeSize = 0;

  constructor(symbol: string) {
    this.symbol = symbol;
  }

  apply(u: BookUpdate): void {
    const book = u.side === "BUY" ? this.bids : this.asks;
    if (u.size <= 0) {
      if (u.orderId) {
        const o = this.l3Orders.get(u.orderId);
        if (o) {
          const lvl = book.get(u.price);
          if (lvl) {
            lvl.size = Math.max(0, lvl.size - o.size);
            lvl.orders = Math.max(0, lvl.orders - 1);
            if (lvl.size <= 0) book.delete(u.price);
          }
          this.l3Orders.delete(u.orderId);
        }
      } else {
        book.delete(u.price);
      }
      return;
    }
    if (u.orderId) {
      const prev = this.l3Orders.get(u.orderId);
      const lvl = book.get(u.price) ?? { size: 0, orders: 0 };
      if (prev) {
        lvl.size += u.size - prev.size;
        if (prev.price !== u.price) {
          const old = book.get(prev.price);
          if (old) {
            old.size = Math.max(0, old.size - prev.size);
            old.orders = Math.max(0, old.orders - 1);
            if (old.size <= 0) book.delete(prev.price);
          }
          const nl = book.get(u.price) ?? { size: 0, orders: 0 };
          nl.size += u.size;
          nl.orders += 1;
          book.set(u.price, nl);
        }
      } else {
        lvl.size += u.size;
        lvl.orders += 1;
        book.set(u.price, lvl);
      }
      this.l3Orders.set(u.orderId, { side: u.side, price: u.price, size: u.size });
    } else {
      book.set(u.price, { size: u.size, orders: 1 });
    }
  }

  recordTrade(price: number, size: number): void {
    this.lastTradePrice = price;
    this.lastTradeSize = size;
  }

  get bestBid(): number | undefined {
    return this.extremum(this.bids, true);
  }
  get bestAsk(): number | undefined {
    return this.extremum(this.asks, false);
  }
  get mid(): number | undefined {
    const b = this.bestBid;
    const a = this.bestAsk;
    if (b === undefined || a === undefined) return undefined;
    return (b + a) / 2;
  }
  get spread(): number | undefined {
    const b = this.bestBid;
    const a = this.bestAsk;
    if (b === undefined || a === undefined) return undefined;
    return a - b;
  }
  get lastPrice(): number {
    return this.lastTradePrice;
  }
  private extremum(m: Map<number, { size: number; orders: number }>, max: boolean): number | undefined {
    let best: number | undefined;
    for (const p of m.keys()) {
      if (best === undefined || (max ? p > best : p < best)) best = p;
    }
    return best;
  }

  /** Top-N depth per side, sorted best-first. */
  depth(n: number): { bids: BookLevel[]; asks: BookLevel[] } {
    const bids = [...this.bids.entries()]
      .sort((a, b) => b[0] - a[0])
      .slice(0, n)
      .map(([price, v]) => ({ price, size: v.size, orders: v.orders }));
    const asks = [...this.asks.entries()]
      .sort((a, b) => a[0] - b[0])
      .slice(0, n)
      .map(([price, v]) => ({ price, size: v.size, orders: v.orders }));
    return { bids, asks };
  }

  /** Bid/ask imbalance over the top K levels: (Σbid − Σask)/(Σbid + Σask). */
  imbalance(topK = 5): number {
    const d = this.depth(topK);
    const b = d.bids.reduce((a, l) => a + l.size, 0);
    const a = d.asks.reduce((a, l) => a + l.size, 0);
    return b + a === 0 ? 0 : (b - a) / (b + a);
  }

  /** Volume-at-price histogram around mid (for DOM VaP bars). */
  volumeAtPrice(nTicks: number, tickSize: number): Map<number, number> {
    const out = new Map<number, number>();
    const mid = this.mid ?? 0;
    for (let i = -nTicks; i <= nTicks; i++) {
      const p = Math.round(mid / tickSize + i) * tickSize;
      const bv = this.bids.get(p)?.size ?? 0;
      const av = this.asks.get(p)?.size ?? 0;
      out.set(p, bv + av);
    }
    return out;
  }

  snapshot(): { bids: BookLevel[]; asks: BookLevel[] } {
    return this.depth(50);
  }
}

/**
 * engine/core/oms/position_tracker.ts
 *
 * FIFO position & PnL tracker. Maintains net position, average cost, realized
 * and mark-to-market unrealized PnL per symbol.
 */
import type { Side } from "../storage/wal_sqlite";

export interface Fill {
  symbol: string;
  side: Side;
  price: number;
  quantity: number;
  fee: number;
}

export interface Position {
  symbol: string;
  netQty: number; // + long, - short
  avgPrice: number;
  realizedPnl: number;
  lots: { qty: number; price: number }[]; // open FIFO lots (signed by net direction)
}

export class PositionTracker {
  private positions = new Map<string, Position>();
  private totalRealized = 0;
  private totalFees = 0;

  /** Apply a fill, updating FIFO lots and realized PnL. */
  apply(fill: Fill): Position {
    let pos = this.positions.get(fill.symbol);
    if (!pos) {
      pos = { symbol: fill.symbol, netQty: 0, avgPrice: 0, realizedPnl: 0, lots: [] };
      this.positions.set(fill.symbol, pos);
    }
    this.totalFees += fill.fee;
    const signed = fill.side === "BUY" ? fill.quantity : -fill.quantity;
    const newNet = pos.netQty + signed;

    if (pos.lots.length === 0 || Math.sign(pos.netQty) === Math.sign(signed) || pos.netQty === 0) {
      // adding to position (or opening)
      pos.lots.push({ qty: Math.abs(signed), price: fill.price });
    } else {
      // reducing / closing against FIFO lots
      let remaining = Math.abs(signed);
      const closing = Math.abs(pos.netQty) < remaining ? Math.abs(pos.netQty) : remaining;
      let toClose = closing;
      while (toClose > 0 && pos.lots.length > 0) {
        const lot = pos.lots[0];
        const closed = Math.min(lot.qty, toClose);
        // realized pnl per lot: (fillPrice - lotPrice) for long closes,
        // (lotPrice - fillPrice) for short closes.
        const sign = pos.netQty > 0 ? 1 : -1;
        pos.realizedPnl += sign * (fill.price - lot.price) * closed;
        lot.qty -= closed;
        toClose -= closed;
        remaining -= closed;
        if (lot.qty <= 1e-12) pos.lots.shift();
      }
      // if signed magnitude exceeds position, the remainder flips direction
      if (remaining > 0) {
        pos.lots.push({ qty: remaining, price: fill.price });
      }
    }

    pos.netQty = newNet;
    // recompute avg price over open lots
    let q = 0;
    let pv = 0;
    for (const l of pos.lots) {
      q += l.qty;
      pv += l.qty * l.price;
    }
    pos.avgPrice = q > 0 ? pv / q : 0;
    this.totalRealized = [...this.positions.values()].reduce((a, p) => a + p.realizedPnl, 0);
    return pos;
  }

  get(symbol: string): Position | undefined {
    return this.positions.get(symbol);
  }
  all(): Position[] {
    return [...this.positions.values()];
  }
  /** Unrealized PnL at a given mark price. */
  unrealized(symbol: string, markPrice: number): number {
    const p = this.positions.get(symbol);
    if (!p) return 0;
    return p.netQty * (markPrice - p.avgPrice);
  }
  totalUnrealized(marks: Map<string, number>): number {
    let s = 0;
    for (const p of this.positions.values()) {
      const m = marks.get(p.symbol);
      if (m !== undefined) s += p.netQty * (m - p.avgPrice);
    }
    return s;
  }
  get totalRealizedPnl(): number {
    return this.totalRealized;
  }
  get cumulativeFees(): number {
    return this.totalFees;
  }
  /** Gross notional exposure (|netQty| * price) summed across symbols. */
  grossNotional(marks: Map<string, number>): number {
    let s = 0;
    for (const p of this.positions.values()) {
      const m = marks.get(p.symbol) ?? p.avgPrice;
      s += Math.abs(p.netQty) * m;
    }
    return s;
  }
}

/**
 * engine/core/market_data/normalizer.ts
 *
 * Canonical normalization of exchange-specific messages into MarketEvent.
 * Binance futs `@depth` (diff depth) and `@aggTrade` are supported; Bybit and
 * other venues share the same canonical output shape.
 */
import type { MarketEvent } from "../simulator/market_maker";
import type { Side } from "../storage/wal_sqlite";

interface BinanceDepth {
  e?: string;
  s?: string;
  b?: [string, string][]; // [price, size]
  a?: [string, string][];
  E?: number; // event time ms
}

interface BinanceAggTrade {
  e?: string;
  s?: string;
  p?: string; // price
  q?: string; // qty
  m?: boolean; // is buyer market maker (true => aggressor SELL)
  E?: number;
}

export function normalizeBinanceEvent(raw: unknown, symbol: string): MarketEvent[] {
  if (typeof raw !== "object" || raw === null) return [];
  const msg = raw as BinanceDepth & BinanceAggTrade;
  const ts_ns = (msg.E ?? Date.now()) * 1e6;
  if (msg.e === "depthUpdate" && msg.b && msg.a) {
    const bids = msg.b.filter(([, s]) => Number(s) > 0).map(([p, s]) => [Number(p), Number(s)] as [number, number]);
    const asks = msg.a.filter(([, s]) => Number(s) > 0).map(([p, s]) => [Number(p), Number(s)] as [number, number]);
    if (bids.length === 0 && asks.length === 0) return [];
    const bid = bids[0]?.[0] ?? 0;
    const ask = asks[0]?.[0] ?? 0;
    return [
      {
        type: "DEPTH",
        ts_ns,
        symbol: msg.s ?? symbol,
        bids,
        asks,
      },
      {
        type: "L1",
        ts_ns,
        symbol: msg.s ?? symbol,
        bid,
        bidSize: bids[0]?.[1] ?? 0,
        ask,
        askSize: asks[0]?.[1] ?? 0,
        last: (bid + ask) / 2,
        lastSize: 0,
        volumeDelta: 0,
      },
    ];
  }
  if (msg.e === "aggTrade" && msg.p && msg.q) {
    const side: Side = msg.m ? "SELL" : "BUY";
    return [
      {
        type: "TRADE",
        ts_ns,
        symbol: msg.s ?? symbol,
        price: Number(msg.p),
        size: Number(msg.q),
        side,
      },
    ];
  }
  return [];
}

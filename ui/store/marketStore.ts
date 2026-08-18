/**
 * ui/store/marketStore.ts
 *
 * Live market state bound to the engine's MarketConnector. Drives the DOM
 * ladder, chart, time & sales, and microstructure gauges from the same
 * Hawkes-fed SyntheticMarket / live-WS stream the back end uses.
 */
import { create } from "zustand";
import { MarketConnector } from "../../engine/core/market_data/connector";
import { BookBuilder } from "../../engine/core/market_data/book_builder";
import { OFIAggregator } from "../../engine/microstructure/ofi";
import { vpinFromTrades } from "../../engine/microstructure/vpin";
import type { MarketEvent } from "../../engine/core/simulator/market_maker";

export interface DepthLevel {
  price: number;
  size: number;
}
export interface TradeTick {
  ts_ns: number;
  price: number;
  size: number;
  side: "BUY" | "SELL";
}
export interface ChartPoint {
  t: number;
  price: number;
  cvd: number;
}

interface MarketState {
  symbol: string;
  running: boolean;
  mode: "LIVE" | "SIMULATION";
  mid: number;
  bestBid: number;
  bestAsk: number;
  spread: number;
  imbalance: number;
  vpin: number;
  ofi: number;
  bids: DepthLevel[];
  asks: DepthLevel[];
  trades: TradeTick[];
  chart: ChartPoint[];
  cvd: number;
  tickCount: number;
  connector: MarketConnector | null;
  start: (symbol?: string, rate?: number) => void;
  stop: () => void;
}

const book = new BookBuilder("ES.FUT");
const ofiAgg = new OFIAggregator(2000);
let unsub: (() => void) | null = null;
let cvd = 0;
const tradeWindow: TradeTick[] = [];

export const useMarket = create<MarketState>((set, get) => ({
  symbol: "ES.FUT",
  running: false,
  mode: "SIMULATION",
  mid: 5055.25,
  bestBid: 5055,
  bestAsk: 5055.5,
  spread: 0.5,
  imbalance: 0,
  vpin: 0,
  ofi: 0,
  bids: [],
  asks: [],
  trades: [],
  chart: [],
  cvd: 0,
  tickCount: 0,
  connector: null,

  start: (symbol = "ES.FUT", rate = 1) => {
    if (get().running) return;
    const conn = new MarketConnector({
      mode: "SIMULATION",
      symbol,
      simRate: rate,
      simulation: { symbol, eventsPerSec: rate },
    });
    unsub = conn.subscribe((e: MarketEvent) => onEvent(e, set, get));
    void conn.start();
    set({ connector: conn, running: true, symbol });
  },
  stop: () => {
    unsub?.();
    get().connector?.stop();
    set({ running: false, connector: null });
  },
}));

function onEvent(
  e: MarketEvent,
  set: (p: Partial<MarketState>) => void,
  get: () => MarketState
) {
  if (e.type === "DEPTH") {
    for (const [p, s] of e.bids) book.apply({ side: "BUY", price: p, size: s });
    for (const [p, s] of e.asks) book.apply({ side: "SELL", price: p, size: s });
    pushUpdate(set, get);
  } else if (e.type === "TRADE") {
    book.recordTrade(e.price, e.size);
    const t: TradeTick = { ts_ns: e.ts_ns, price: e.price, size: e.size, side: e.side };
    cvd += e.side === "BUY" ? e.size : -e.size;
    tradeWindow.push(t);
    if (tradeWindow.length > 500) tradeWindow.shift();
    pushUpdate(set, get);
  } else if (e.type === "L1") {
    // OFI on L1 transitions
    ofiAgg.update({ bidPrice: e.bid, bidSize: e.bidSize || 1, askPrice: e.ask, askSize: e.askSize || 1 });
    pushUpdate(set, get);
  }
}

function pushUpdate(set: (p: Partial<MarketState>) => void, get: () => MarketState) {
  const d = book.depth(20);
  const vpin = vpinFromTrades(tradeWindow.map((t) => ({ price: t.price, size: t.size })), 100, 20);
  const last = book.lastPrice || book.mid || get().mid;
  const chart = get().chart;
  const next = chart.length > 220 ? chart.slice(-220) : chart.slice();
  next.push({ t: Date.now(), price: last, cvd });
  set({
    mid: book.mid ?? get().mid,
    bestBid: book.bestBid ?? get().bestBid,
    bestAsk: book.bestAsk ?? get().bestAsk,
    spread: book.spread ?? get().spread,
    imbalance: book.imbalance(5),
    vpin,
    ofi: ofiAgg.cum,
    bids: d.bids,
    asks: d.asks,
    trades: tradeWindow.slice(-60),
    chart: next,
    cvd,
    tickCount: get().tickCount + 1,
  });
}

/**
 * engine/core/simulator/market_maker.ts
 *
 * Synthetic HFT market generator. Combines the multivariate Hawkes process with
 * a random-walk reference price and a self-replenishing L2 book to produce a
 * realistic stream of normalized market events (L1, TRADE, DEPTH). This is the
 * offline HFT simulator (Section 5.1 Launch_AFTIS_Simulator) and the live-API
 * failover data source (Zero-Mock Policy, Rule 1).
 *
 * No hardcoded price arrays: every tick is produced by the stochastic process.
 */
import { HawkesProcess, defaultHawkesConfig, type HawkesEventKind } from "./hawkes";
import { BookBuilder, type BookUpdate } from "../market_data/book_builder";
import { mulberry32, makeNormal } from "../../math/numerical/monte_carlo";
import type { Side } from "../storage/wal_sqlite";

export type MarketEvent =
  | { type: "L1"; ts_ns: number; symbol: string; bid: number; bidSize: number; ask: number; askSize: number; last: number; lastSize: number; volumeDelta: number }
  | { type: "TRADE"; ts_ns: number; symbol: string; price: number; size: number; side: Side }
  | { type: "DEPTH"; ts_ns: number; symbol: string; bids: [number, number][]; asks: [number, number][] };

export interface SyntheticMarketConfig {
  symbol: string;
  startPrice: number;
  tickSize: number;
  volPerSec: number; // volatility per sqrt(sec) of the reference mid
  levels: number; // resting levels per side
  baseLevelSize: number;
  eventsPerSec: number; // target Hawkes rate multiplier
  seed?: number;
  startNs?: number;
}

export const DEFAULT_MARKET: SyntheticMarketConfig = {
  symbol: "ES.FUT",
  startPrice: 5055.25,
  tickSize: 0.25,
  volPerSec: 0.6,
  levels: 20,
  baseLevelSize: 50,
  eventsPerSec: 1,
  seed: 0x5eed,
};

/**
 * Synthetic market. `step(dtSeconds)` advances the process and returns the
 * events generated in that interval; `emitOne()` returns a single canonical
 * event (used by the UI's animation frame loop).
 */
export class SyntheticMarket {
  readonly cfg: SyntheticMarketConfig;
  private hawkes: HawkesProcess;
  private book: BookBuilder;
  private rng: () => number;
  private gauss: () => number;
  private mid: number;
  private tSec = 0;
  private pending: HawkesEventKind[] = [];
  private startNs: number;
  private cumVolDelta = 0;

  constructor(cfg: Partial<SyntheticMarketConfig> = {}) {
    this.cfg = { ...DEFAULT_MARKET, ...cfg };
    const hcfg = defaultHawkesConfig();
    hcfg.seed = this.cfg.seed;
    // scale base intensities by eventsPerSec
    hcfg.mu = hcfg.mu.map((m) => m * this.cfg.eventsPerSec);
    this.hawkes = new HawkesProcess(hcfg);
    this.book = new BookBuilder(this.cfg.symbol);
    this.rng = mulberry32((this.cfg.seed ?? 1) + 1);
    this.gauss = makeNormal(this.rng);
    this.mid = this.cfg.startPrice;
    this.startNs = this.cfg.startNs ?? Date.now() * 1e6;
    this.seedBook();
  }

  private seedBook() {
    const { tickSize, levels, baseLevelSize } = this.cfg;
    for (let i = 1; i <= levels; i++) {
      this.book.apply({ side: "BUY", price: this.round(this.mid - i * tickSize), size: baseLevelSize * (1 + (i % 3)) });
      this.book.apply({ side: "SELL", price: this.round(this.mid + i * tickSize), size: baseLevelSize * (1 + (i % 4)) });
    }
  }
  private round(p: number): number {
    return Math.round(p / this.cfg.tickSize) * this.cfg.tickSize;
  }

  get symbol(): string {
    return this.cfg.symbol;
  }
  get currentMid(): number {
    return this.mid;
  }
  get bestBid(): number | undefined {
    return this.book.bestBid;
  }
  get bestAsk(): number | undefined {
    return this.book.bestAsk;
  }
  bookSnapshot() {
    return this.book.snapshot();
  }

  /** Advance the simulation by `dtSec`, returning all emitted events. */
  step(dtSec: number): MarketEvent[] {
    const out: MarketEvent[] = [];
    const tEnd = this.tSec + dtSec;
    while (this.tSec < tEnd) {
      const ev = this.hawkes.next();
      if (ev.t > tEnd) {
        // event beyond this step: we still advance internal time but stop
        this.tSec = ev.t;
        break;
      }
      // diffuse the reference mid between the previous event and this one
      this.diffuse(ev.t - this.tSec);
      this.tSec = ev.t;
      out.push(this.processEvent(ev.kind));
    }
    this.diffuse(tEnd - this.tSec);
    this.tSec = tEnd;
    return out;
  }

  private diffuse(dt: number) {
    if (dt <= 0) return;
    // mean-reverting random walk for the reference mid
    const drift = (this.cfg.startPrice - this.mid) * 0.02 * dt;
    this.mid += drift + this.cfg.volPerSec * Math.sqrt(dt) * this.gauss();
  }

  private ts(): number {
    return this.startNs + Math.floor(this.tSec * 1e9);
  }

  private processEvent(kind: HawkesEventKind): MarketEvent {
    const ts = this.ts();
    const { tickSize } = this.cfg;
    switch (kind) {
      case "MARKET_BUY":
      case "MARKET_SELL": {
        const buy = kind === "MARKET_BUY";
        const side: Side = buy ? "BUY" : "SELL";
        // trade size: heavy-tailed
        const size = Math.max(1, Math.round(this.rng() * this.rng() * 40 + 1));
        const levels = this.book.depth(10);
        const ladder = buy ? levels.asks : levels.bids;
        if (ladder.length === 0) {
          this.replenish();
          break;
        }
        // walk the ladder
        let remaining = size;
        let lastPx = ladder[0].price;
        let executed = 0;
        for (const lvl of ladder) {
          if (remaining <= 0) break;
          const take = Math.min(remaining, lvl.size);
          const u: BookUpdate = { side: buy ? "SELL" : "BUY", price: lvl.price, size: Math.max(0, lvl.size - take) };
          this.book.apply(u);
          remaining -= take;
          executed += take;
          lastPx = lvl.price;
        }
        this.book.recordTrade(lastPx, executed);
        this.cumVolDelta += buy ? executed : -executed;
        // mid drifts slightly toward the trade
        this.mid = buy ? Math.max(this.mid, lastPx - tickSize / 2) : Math.min(this.mid, lastPx + tickSize / 2);
        this.replenish();
        return { type: "TRADE", ts_ns: ts, symbol: this.cfg.symbol, price: lastPx, size: executed, side };
      }
      case "CANCEL_BUY":
      case "CANCEL_SELL": {
        const buy = kind === "CANCEL_BUY";
        const d = this.book.depth(this.cfg.levels);
        const ladder = buy ? d.bids : d.asks;
        if (ladder.length === 0) break;
        const idx = Math.floor(this.rng() * ladder.length);
        const lvl = ladder[idx];
        const reduce = Math.min(lvl.size, Math.max(1, Math.round(lvl.size * this.rng())));
        this.book.apply({ side: buy ? "BUY" : "SELL", price: lvl.price, size: Math.max(0, lvl.size - reduce) });
        this.replenish();
        return this.l1(ts);
      }
    }
    return this.l1(ts);
  }

  /** Re-quote empty levels near the mid (market-maker replenishment). */
  private replenish() {
    const { tickSize, levels, baseLevelSize } = this.cfg;
    const d = this.book.depth(levels);
    const bidSet = new Set(d.bids.map((b) => b.price));
    const askSet = new Set(d.asks.map((a) => a.price));
    for (let i = 1; i <= levels; i++) {
      const bp = this.round(this.mid - i * tickSize);
      const ap = this.round(this.mid + i * tickSize);
      if (!bidSet.has(bp)) this.book.apply({ side: "BUY", price: bp, size: baseLevelSize * (1 + (i % 3)) });
      if (!askSet.has(ap)) this.book.apply({ side: "SELL", price: ap, size: baseLevelSize * (1 + (i % 4)) });
    }
  }

  private l1(ts: number): MarketEvent {
    return {
      type: "L1",
      ts_ns: ts,
      symbol: this.cfg.symbol,
      bid: this.book.bestBid ?? this.mid,
      bidSize: 0,
      ask: this.book.bestAsk ?? this.mid,
      askSize: 0,
      last: this.book.lastPrice || this.mid,
      lastSize: 0,
      volumeDelta: this.cumVolDelta,
    };
  }

  /** Build a DEPTH snapshot event at the current book state. */
  depthEvent(): MarketEvent {
    const d = this.book.depth(20);
    return {
      type: "DEPTH",
      ts_ns: this.ts(),
      symbol: this.cfg.symbol,
      bids: d.bids.map((l) => [l.price, l.size]),
      asks: d.asks.map((l) => [l.price, l.size]),
    };
  }
}

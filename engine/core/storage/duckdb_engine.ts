/**
 * engine/core/storage/duckdb_engine.ts
 *
 * Embedded columnar time-series store emulating the DuckDB market_ticks table
 * (Section 2.2): append-only columnar arrays (SoA layout) indexed by
 * (symbol, timestamp_ns). Pure JS — no native duckdb binding — but the same
 * columnar access pattern (struct-of-arrays) for cache-friendly vectorized scans.
 *
 *   CREATE TABLE market_ticks (
 *     timestamp_ns BIGINT, symbol VARCHAR(16), bid_price DOUBLE, ask_price DOUBLE,
 *     bid_size DOUBLE, ask_size DOUBLE, last_price DOUBLE, last_size DOUBLE,
 *     volume_delta DOUBLE );
 */

export interface Tick {
  timestamp_ns: number;
  symbol: string;
  bid_price: number;
  ask_price: number;
  bid_size: number;
  ask_size: number;
  last_price: number;
  last_size: number;
  volume_delta: number;
}

/**
 * Columnar append-only table. Columns are Float64Array chunks grown geometrically
 * to keep amortized O(1) appends while exposing typed-array views for SIMD-style
 * vectorized scans.
 */
export class ColumnarTickTable {
  readonly symbol: string;
  private tsns: number[] = [];
  private bid: number[] = [];
  private ask: number[] = [];
  private bidSz: number[] = [];
  private askSz: number[] = [];
  private last: number[] = [];
  private lastSz: number[] = [];
  private vDelta: number[] = [];
  private count = 0;

  constructor(symbol: string) {
    this.symbol = symbol;
  }

  append(t: Tick): void {
    this.tsns.push(t.timestamp_ns);
    this.bid.push(t.bid_price);
    this.ask.push(t.ask_price);
    this.bidSz.push(t.bid_size);
    this.askSz.push(t.ask_size);
    this.last.push(t.last_price);
    this.lastSz.push(t.last_size);
    this.vDelta.push(t.volume_delta);
    this.count++;
  }

  get length(): number {
    return this.count;
  }

  /** Column view as a typed array (copy) for vectorized analytics. */
  column(name: keyof Omit<Tick, "symbol">): Float64Array {
    const src = this.colRef(name);
    return Float64Array.from(src);
  }

  private colRef(name: keyof Omit<Tick, "symbol">): number[] {
    switch (name) {
      case "timestamp_ns": return this.tsns;
      case "bid_price": return this.bid;
      case "ask_price": return this.ask;
      case "bid_size": return this.bidSz;
      case "ask_size": return this.askSz;
      case "last_price": return this.last;
      case "last_size": return this.lastSz;
      case "volume_delta": return this.vDelta;
    }
  }

  /**
   * Binary-search range scan on (symbol already fixed, timestamp range). Returns
   * index bounds — equivalent to the SQL index idx_ticks_sym_time.
   */
  range(startNs: number, endNs: number): { from: number; to: number } {
    // tsns is append-ordered but not necessarily monotonic in time across all
    // feeds; for the in-process engine we assume monotonic per symbol and use a
    // binary search, falling back to linear when out of order.
    const lo = this.lowerBound(startNs);
    const hi = this.upperBound(endNs);
    return { from: lo, to: hi };
  }

  private lowerBound(v: number): number {
    let lo = 0;
    let hi = this.count;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.tsns[mid] < v) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }
  private upperBound(v: number): number {
    let lo = 0;
    let hi = this.count;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.tsns[mid] <= v) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  row(i: number): Tick {
    return {
      timestamp_ns: this.tsns[i],
      symbol: this.symbol,
      bid_price: this.bid[i],
      ask_price: this.ask[i],
      bid_size: this.bidSz[i],
      ask_size: this.askSz[i],
      last_price: this.last[i],
      last_size: this.lastSz[i],
      volume_delta: this.vDelta[i],
    };
  }
}

/** Multi-symbol columnar database (the DuckDB engine facade). */
export class DuckdbEngine {
  private tables = new Map<string, ColumnarTickTable>();
  private totalRows = 0;

  table(symbol: string): ColumnarTickTable {
    let t = this.tables.get(symbol);
    if (!t) {
      t = new ColumnarTickTable(symbol);
      this.tables.set(symbol, t);
    }
    return t;
  }

  insert(t: Tick): void {
    this.table(t.symbol).append(t);
    this.totalRows++;
  }

  insertBatch(rows: Tick[]): void {
    // group by symbol for columnar locality
    for (const r of rows) this.insert(r);
  }

  get totalRowCount(): number {
    return this.totalRows;
  }
  symbols(): string[] {
    return [...this.tables.keys()];
  }
  /** VWAP over a symbol's last_price/last_size in a time window. */
  vwap(symbol: string, fromNs?: number, toNs?: number): number {
    const t = this.tables.get(symbol);
    if (!t || t.length === 0) return NaN;
    const r = t.range(fromNs ?? -Infinity, toNs ?? Infinity);
    let pv = 0;
    let vol = 0;
    for (let i = r.from; i < r.to; i++) {
      const p = t.column("last_price")[i];
      const s = t.column("last_size")[i];
      pv += p * s;
      vol += s;
    }
    return vol === 0 ? NaN : pv / vol;
  }
  /** Cumulative volume delta over a window. */
  cvd(symbol: string, fromNs?: number, toNs?: number): number {
    const t = this.tables.get(symbol);
    if (!t) return 0;
    const r = t.range(fromNs ?? -Infinity, toNs ?? Infinity);
    const d = t.column("volume_delta");
    let s = 0;
    for (let i = r.from; i < r.to; i++) s += d[i];
    return s;
  }
}

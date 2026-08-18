/**
 * engine/microstructure/ofi.ts
 *
 * Order Flow Imbalance (Cont, Kukanov & Stoikov 2014):
 *
 *   OFI_n = 1{P^b_n ≥ P^b_{n-1}} q^b_n − 1{P^b_n ≤ P^b_{n-1}} q^b_{n-1}
 *           − 1{P^a_n ≤ P^a_{n-1}} q^a_n + 1{P^a_n ≥ P^a_{n-1}} q^a_{n-1}
 *
 * Implemented as an incremental L1 book update processor: each update returns
 * the signed OFI contribution at that event.
 */

export interface L1Update {
  bidPrice: number;
  bidSize: number;
  askPrice: number;
  askSize: number;
}

export class OFIAggregator {
  private prev: L1Update | null = null;
  /** cumulative OFI over all processed events */
  cum = 0;
  /** history of per-event OFI increments (bounded buffer) */
  readonly history: number[] = [];
  private maxHistory: number;

  constructor(maxHistory = 100_000) {
    this.maxHistory = maxHistory;
  }

  /** Process one L1 update; returns the OFI increment. */
  update(u: L1Update): number {
    if (!this.prev) {
      this.prev = u;
      return 0;
    }
    const p = this.prev;
    let e = 0;
    // Bid side
    if (u.bidPrice > p.bidPrice) e += u.bidSize;
    else if (u.bidPrice === p.bidPrice) e += u.bidSize - p.bidSize;
    else e -= p.bidSize; // u.bidPrice < p.bidPrice
    // Ask side
    if (u.askPrice > p.askPrice) e += p.askSize;
    else if (u.askPrice === p.askPrice) e += p.askSize - u.askSize; // == -(u - p)
    else e -= u.askSize; // u.askPrice < p.askPrice
    this.prev = u;
    this.cum += e;
    this.history.push(e);
    if (this.history.length > this.maxHistory) this.history.shift();
    return e;
  }

  reset(): void {
    this.prev = null;
    this.cum = 0;
    this.history.length = 0;
  }
}

/** Batch OFI over a sequence of L1 updates. */
export function ofiBatch(updates: L1Update[]): number[] {
  const agg = new OFIAggregator(updates.length);
  const out: number[] = [];
  for (const u of updates) out.push(agg.update(u));
  return out;
}

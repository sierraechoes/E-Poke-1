/**
 * engine/microstructure/vpin.ts
 *
 * Volume-Synchronized Probability of Informed Trading (Easley, López de Prado,
 * O'Hara 2012):
 *
 *   VPIN = ( Σ_{τ=1}^N | V_τ^B − V_τ^S | ) / ( N · V )
 *
 * Trades are bucketed into equal-volume buckets of size V (the "volume clock").
 * Trade direction is assigned by the Lee–Ready tick test (deterministic given a
 * sequence of trade prices), so the entire calculation is reproducible.
 */

export interface Trade {
  price: number;
  size: number;
}

/** Sign a trade stream by the tick rule (up-tick = buy, down-tick = sell). */
export function signTradesTick(trades: Trade[]): { buy: number; sell: number; price: number }[] {
  const out: { buy: number; sell: number; price: number }[] = [];
  let prev = trades.length ? trades[0].price : 0;
  let dir = 1;
  for (let i = 0; i < trades.length; i++) {
    const t = trades[i];
    if (t.price > prev) dir = 1;
    else if (t.price < prev) dir = -1;
    prev = t.price;
    out.push({ buy: dir > 0 ? t.size : 0, sell: dir < 0 ? t.size : 0, price: t.price });
  }
  return out;
}

/**
 * VPIN from a trade stream and bucket volume V. Returns the rolling VPIN over
 * the last N volume buckets.
 */
export function vpinFromTrades(trades: Trade[], bucketVolume: number, N: number): number {
  const signed = signTradesTick(trades);
  const buckets: { b: number; s: number }[] = [];
  let curB = 0;
  let curS = 0;
  let curVol = 0;
  for (const t of signed) {
    curB += t.buy;
    curS += t.sell;
    curVol += t.buy + t.sell;
    if (curVol >= bucketVolume) {
      buckets.push({ b: curB, s: curS });
      curB = 0;
      curS = 0;
      curVol = 0;
    }
  }
  const last = buckets.slice(-N);
  if (last.length === 0) return 0;
  let num = 0;
  for (const bk of last) num += Math.abs(bk.b - bk.s);
  return num / (last.length * bucketVolume);
}

/** VPIN directly from pre-bucketed signed volumes (deterministic test path). */
export function vpinFromBuckets(
  buckets: { buy: number; sell: number }[],
  bucketVolume: number
): number {
  if (buckets.length === 0) return 0;
  let num = 0;
  for (const b of buckets) num += Math.abs(b.buy - b.sell);
  return num / (buckets.length * bucketVolume);
}

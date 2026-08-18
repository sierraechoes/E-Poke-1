/**
 * engine/quant/strategies/market_making.ts
 *
 * Avellaneda-Stoikov (2008) high-frequency market making (Section 3.3.2).
 *
 *   R(s, q, t) = s - q γ σ² (T - t)
 *   δ^b + δ^a = γ σ² (T - t) + (2/γ) ln(1 + γ/κ)
 *
 * The reservation price R shifts away from mid as inventory |q| grows; the
 * optimal symmetric spread around R balances adverse-selection (γ) against
 * order-arrival rate (κ). Quotes: bid = R - δ^b/2, ask = R + δ^a/2.
 */
export interface AvellanedaStoikovParams {
  gamma: number; // risk aversion
  sigma: number; // per-step vol (price units)
  T: number; // horizon (in steps)
  t: number; // current step index (>=0, <=T)
  kappa: number; // arrival intensity parameter
  q: number; // current inventory (contracts)
  s: number; // current mid
  /** optional max inventory to cap quoting */
  qMax?: number;
}

export interface MMQuotes {
  reservation: number;
  spread: number;
  bid: number;
  ask: number;
}

export function avellanedaStoikov(p: AvellanedaStoikovParams): MMQuotes {
  const tau = Math.max(p.T - p.t, 1e-9);
  const reservation = p.s - p.q * p.gamma * p.sigma * p.sigma * tau;
  const spread = p.gamma * p.sigma * p.sigma * tau + (2 / p.gamma) * Math.log(1 + p.gamma / p.kappa);
  const half = spread / 2;
  // cap: stop adding to inventory beyond qMax
  const qMax = p.qMax ?? Infinity;
  const bid = p.q >= qMax ? reservation - 1e9 : reservation - half;
  const ask = p.q <= -qMax ? reservation + 1e9 : reservation + half;
  return { reservation, spread, bid, ask };
}

/**
 * Simulate the Avellaneda-Stoikov policy over a price path with a simple
 * execution model (quotes fill when the price touches them). Returns the
 * equity curve and final inventory.
 */
export function simulateAvellanedaStoikov(
  prices: number[],
  opts: { gamma?: number; sigma?: number; kappa?: number; T?: number; feeBps?: number } = {}
): { equity: number[]; inventory: number[]; finalPnl: number; finalInv: number } {
  const gamma = opts.gamma ?? 0.1;
  const sigma = opts.sigma ?? stdStep(prices);
  const kappa = opts.kappa ?? 1.5;
  const T = opts.T ?? prices.length;
  const fee = (opts.feeBps ?? 0.5) * 1e-4;
  let cash = 0;
  let inv = 0;
  const equity: number[] = [];
  const inventory: number[] = [];
  for (let t = 0; t < prices.length; t++) {
    const q = avellanedaStoikov({ gamma, sigma, T, t, kappa, q: inv, s: prices[t], qMax: 50 });
    // fills: bid filled if next price <= our bid; ask filled if >= our ask
    const next = prices[t + 1] ?? prices[t];
    if (next <= q.bid && inv < 50) {
      inv += 1;
      cash -= q.bid + fee * q.bid;
    }
    if (next >= q.ask && inv > -50) {
      inv -= 1;
      cash += q.ask - fee * q.ask;
    }
    equity.push(cash + inv * prices[t]);
    inventory.push(inv);
  }
  const finalPnl = cash + inv * prices[prices.length - 1];
  return { equity, inventory, finalPnl, finalInv: inv };
}

function stdStep(prices: number[]): number {
  const diffs: number[] = [];
  for (let i = 1; i < prices.length; i++) diffs.push(prices[i] - prices[i - 1]);
  const m = diffs.reduce((a, b) => a + b, 0) / (diffs.length || 1);
  const v = diffs.reduce((a, b) => a + (b - m) ** 2, 0) / (diffs.length || 1);
  return Math.sqrt(v) || 1;
}

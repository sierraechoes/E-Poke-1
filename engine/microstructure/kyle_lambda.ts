/**
 * engine/microstructure/kyle_lambda.ts
 *
 * Kyle's lambda — the price-impact coefficient regressing price changes on order
 * flow imbalance:
 *
 *   ΔP_t = λ · OFI_t + ε_t
 *
 * Estimated by ordinary least squares (closed-form). Returns λ and an R².
 */

export function kyleLambda(priceChanges: number[], ofi: number[]): {
  lambda: number;
  intercept: number;
  r2: number;
} {
  const n = Math.min(priceChanges.length, ofi.length);
  if (n < 2) return { lambda: 0, intercept: 0, r2: 0 };
  let sx = 0;
  let sy = 0;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sx += ofi[i];
    sy += priceChanges[i];
    sxy += ofi[i] * priceChanges[i];
    sxx += ofi[i] * ofi[i];
    syy += priceChanges[i] * priceChanges[i];
  }
  const denom = n * sxx - sx * sx;
  if (Math.abs(denom) < 1e-18) return { lambda: 0, intercept: 0, r2: 0 };
  const lambda = (n * sxy - sx * sy) / denom;
  const intercept = (sy - lambda * sx) / n;
  const ssTot = n * syy - sy * sy;
  const ssRes = ssTot === 0 ? 1e-18 : ssTot;
  // R² via fitted values
  let sse = 0;
  for (let i = 0; i < n; i++) {
    const fit = intercept + lambda * ofi[i];
    sse += (priceChanges[i] - fit) ** 2;
  }
  const r2 = ssTot > 1e-18 ? 1 - sse / ssTot : 0;
  void ssRes;
  return { lambda, intercept, r2 };
}

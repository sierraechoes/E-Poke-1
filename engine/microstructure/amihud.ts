/**
 * engine/microstructure/amihud.ts
 *
 * Amihud (2002) illiquidity:
 *
 *   ILLIQ = (1/D) Σ_{t=1}^D | r_t | / DVOL_t
 *
 * where r_t is the return on day t and DVOL_t the dollar volume. Higher values
 * indicate less liquid (higher-impact) assets.
 */

export interface AmihudBar {
  price: number;
  dollarVolume: number;
}

export function amihudIlliquidity(bars: AmihudBar[]): number {
  if (bars.length < 2) return 0;
  let sum = 0;
  let count = 0;
  for (let i = 1; i < bars.length; i++) {
    const prev = bars[i - 1].price;
    const p = bars[i].price;
    if (prev <= 0 || bars[i].dollarVolume <= 0) continue;
    const r = (p - prev) / prev;
    sum += Math.abs(r) / bars[i].dollarVolume;
    count++;
  }
  return count === 0 ? 0 : sum / count;
}

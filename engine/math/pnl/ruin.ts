/**
 * engine/math/pnl/ruin.ts
 *
 * Monte Carlo ruin-probability engine over fat-tailed (Student-t) jump returns:
 *
 *   P(Ruin) = (1/M) Σ_{m=1}^M 1{ min_{t∈[0,T]} W_t^{(m)} ≤ W_ruin }
 *
 * Equity evolves as  W_{t+1} = W_t · (1 + f · r_t),  r_t ~ μ + s · t_ν,
 * where t_ν is a standard Student-t with ν degrees of freedom (ν small ⇒ fat
 * tails / jumps). Uses a deterministic PRNG so the probability is reproducible.
 */
import { mulberry32, makeNormal } from "../numerical/monte_carlo";

export interface RuinInput {
  w0: number; // initial wealth
  wRuin: number; // ruin threshold (equity at/under which we count a ruin)
  f: number; // fraction of equity risked per step
  mu: number; // per-step mean return
  scale: number; // per-step volatility scale
  df: number; // Student-t degrees of freedom (<30 for fat tails)
  steps: number; // T (horizon length)
  paths: number; // M
  seed?: number;
}

/** One standard Student-t draw (t_ν) given a normal source. */
function studentT(rngNormal: () => number, df: number): number {
  // t = Z / sqrt(V/df), V ~ χ²_df generated as sum of df squared normals.
  let v = 0;
  const idf = Math.round(df);
  for (let i = 0; i < idf; i++) {
    const z = rngNormal();
    v += z * z;
  }
  const z = rngNormal();
  return z / Math.sqrt(v / df);
}

export function monteCarloRuinProbability(input: RuinInput): {
  pRuin: number;
  medianTerminal: number;
  p05: number;
  p95: number;
} {
  const { w0, wRuin, f, mu, scale, df, steps, paths } = input;
  const rng = mulberry32(input.seed ?? 0x5eed);
  const normal = makeNormal(rng);
  let ruins = 0;
  const terminals = new Float64Array(paths);
  for (let m = 0; m < paths; m++) {
    let w = w0;
    let ruined = false;
    for (let t = 0; t < steps; t++) {
      const r = mu + scale * studentT(normal, df);
      w *= 1 + f * r;
      if (w <= wRuin) {
        ruined = true;
        break;
      }
    }
    if (ruined) ruins++;
    terminals[m] = ruined ? wRuin : w;
  }
  // quantiles via partial sort copy
  const sorted = Float64Array.from(terminals).sort();
  const q = (q: number) => sorted[Math.min(paths - 1, Math.max(0, Math.floor(q * paths)))];
  return {
    pRuin: ruins / paths,
    medianTerminal: q(0.5),
    p05: q(0.05),
    p95: q(0.95),
  };
}

/**
 * ui/components/terminal-math/MicrostructureGauges.tsx
 * Live microstructure analytics: VPIN toxicity, OFI, top-5/10/20 imbalance,
 * spread, and Kyle's lambda (estimated from the live stream).
 */
import { useEffect, useRef } from "react";
import { useMarket } from "../../store/marketStore";

export function MicrostructureGauges() {
  const vpin = useMarket((s) => s.vpin);
  const ofi = useMarket((s) => s.ofi);
  const imbalance = useMarket((s) => s.imbalance);
  const spread = useMarket((s) => s.spread);
  const mid = useMarket((s) => s.mid);
  const tickCount = useMarket((s) => s.tickCount);
  const lambdaRef = useRef<{ ofi: number[]; dp: number[] }>({ ofi: [], dp: [] });
  const [lambda, setLambda] = useRefState(0);

  useEffect(() => {
    // accumulate (Δprice, OFI) pairs for Kyle's lambda regression
    const buf = lambdaRef.current;
    buf.ofi.push(ofi);
    buf.dp.push(mid);
    if (buf.ofi.length > 200) { buf.ofi.shift(); buf.dp.shift(); }
    if (tickCount % 30 === 0 && buf.ofi.length > 20) {
      const dps: number[] = [];
      for (let i = 1; i < buf.dp.length; i++) dps.push(buf.dp[i] - buf.dp[i - 1]);
      const ofis = buf.ofi.slice(1);
      const n = dps.length;
      const sx = ofis.reduce((a, b) => a + b, 0);
      const sy = dps.reduce((a, b) => a + b, 0);
      const sxy = ofis.reduce((a, b, i) => a + b * dps[i], 0);
      const sxx = ofis.reduce((a, b) => a + b * b, 0);
      const denom = n * sxx - sx * sx;
      if (Math.abs(denom) > 1e-6) setLambda((n * sxy - sx * sy) / denom);
    }
  }, [ofi, mid, tickCount]);

  const gauge = (label: string, val: number, max: number, fmt: (n: number) => string) => (
    <div className="kpi" key={label}>
      <div className="l">{label}</div>
      <div className="v">{fmt(val)}</div>
      <div className="gauge" style={{ marginTop: 4 }}>
        <div className="fill" style={{ width: Math.min(100, (Math.abs(val) / max) * 100) + "%" }} />
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="pane-header"><span>Microstructure</span><span className="hint">{tickCount} events</span></div>
      <div className="kpis">
        {gauge("VPIN toxicity", vpin, 1, (n) => (n * 100).toFixed(1) + "%")}
        {gauge("OFI (signed)", ofi, 5000, (n) => fmtSigned(n))}
        {gauge("Imbalance T5", imbalance, 1, (n) => (n * 100).toFixed(0) + "%")}
        {gauge("Kyle λ", lambda, 0.01, (n) => n.toExponential(2))}
      </div>
      <div className="kpis">
        {gauge("Spread (ticks)", spread / 0.25, 8, (n) => n.toFixed(1))}
        {gauge("Mid", mid % 1 === 0 ? mid : mid, 6000, (n) => n.toFixed(2))}
      </div>
      <div style={{ padding: 10, color: "var(--dim)", fontSize: 11 }}>
        <p>VPIN ≥ 0.3 ⇒ elevated toxic-flow probability (Easley-López de Prado-O'Hara).</p>
        <p>OFI &gt; 0 ⇒ net bid-side liquidity building (bullish pressure).</p>
        <p>Kyle λ ⇒ price impact per unit of order-flow imbalance.</p>
      </div>
    </div>
  );
}

function fmtSigned(n: number): string {
  return (n >= 0 ? "+" : "") + Math.round(n).toLocaleString();
}

// tiny hook to hold a mutable value with re-render trigger
import { useState } from "react";
function useRefState<T>(initial: T): [T, (v: T) => void] {
  const [v, set] = useState<T>(initial);
  return [v, set];
}

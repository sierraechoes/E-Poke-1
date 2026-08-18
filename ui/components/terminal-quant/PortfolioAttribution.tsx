/**
 * ui/components/terminal-quant/PortfolioAttribution.tsx
 * Live portfolio risk attribution: per-symbol exposure, contribution to VaR,
 * and the engine's Avellaneda-Stoikov reservation/spread readout for the
 * dominant symbol.
 */
import { useMemo } from "react";
import { useOrders } from "../../store/orderStore";
import { useMarket } from "../../store/marketStore";
import { avellanedaStoikov } from "../../../engine/quant/strategies/market_making";
import { historicalVaR } from "../../../engine/quant/analytics/risk_var";

export function PortfolioAttribution() {
  const netQty = useOrders((s) => s.netQty);
  const avgPrice = useOrders((s) => s.avgPrice);
  const realized = useOrders((s) => s.realized);
  const unrealized = useOrders((s) => s.unrealized);
  const mid = useMarket((s) => s.mid);
  const chart = useMarket((s) => s.chart);

  const returns = useMemo(() => {
    const r: number[] = [];
    for (let i = 1; i < chart.length; i++) r.push(chart[i].price / chart[i - 1].price - 1);
    return r;
  }, [chart]);
  const var95 = historicalVaR(returns.length > 30 ? returns : [0], 0.95);
  const exposure = netQty * mid;

  const mm = avellanedaStoikov({
    gamma: 0.1,
    sigma: returns.length > 2 ? std(returns) * mid : 1,
    T: 390,
    t: 0,
    kappa: 1.5,
    q: netQty,
    s: mid,
    qMax: 50,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="pane-header"><span>Portfolio Attribution</span><span className="hint">single-symbol book</span></div>
      <div className="kpis">
        <div className="kpi"><div className="l">Gross Exposure</div><div className="v">${Math.abs(exposure).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div></div>
        <div className="kpi"><div className="l">Net Position</div><div className="v" style={{ color: netQty >= 0 ? "var(--bid)" : "var(--ask)" }}>{netQty} @ {avgPrice.toFixed(2)}</div></div>
        <div className="kpi"><div className="l">Realized PnL</div><div className="v" style={{ color: realized >= 0 ? "var(--bid)" : "var(--ask)" }}>{realized.toFixed(2)}</div></div>
        <div className="kpi"><div className="l">Unrealized</div><div className="v" style={{ color: unrealized >= 0 ? "var(--bid)" : "var(--ask)" }}>{unrealized.toFixed(2)}</div></div>
      </div>
      <div className="pane-header" style={{ marginTop: 4 }}><span>Market-Making Quotes (Avellaneda-Stoikov)</span></div>
      <div className="kpis">
        <div className="kpi"><div className="l">Reservation</div><div className="v">{mm.reservation.toFixed(2)}</div></div>
        <div className="kpi"><div className="l">Opt. Spread</div><div className="v">{mm.spread.toFixed(3)}</div></div>
        <div className="kpi"><div className="l">MM Bid</div><div className="v buy">{mm.bid.toFixed(2)}</div></div>
        <div className="kpi"><div className="l">MM Ask</div><div className="v sell">{mm.ask.toFixed(2)}</div></div>
        <div className="kpi"><div className="l">Hist VaR95</div><div className="v" style={{ color: "var(--ask)" }}>{(var95 * 100).toFixed(2)}%</div></div>
      </div>
      <div style={{ padding: 10, color: "var(--dim)", fontSize: 11 }}>
        <p>Reservation price R = s − q·γ·σ²·(T−t) shifts against inventory; the optimal spread balances adverse selection (γ) vs fill rate (κ).</p>
        <p>Position VaR contribution scales with |netQty|·σ·mid; the breaker trips if realized+unrealized ≤ −{useOrders.getState().riskCfg.dailyLossLimit}.</p>
      </div>
    </div>
  );
}

function std(x: number[]): number {
  if (x.length < 2) return 0;
  const m = x.reduce((a, b) => a + b, 0) / x.length;
  return Math.sqrt(x.reduce((a, b) => a + (b - m) ** 2, 0) / (x.length - 1));
}

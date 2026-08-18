/**
 * ui/components/terminal-core/OrderEntry.tsx
 * Order ticket + blotter + live positions & PnL, bound to orderStore (engine
 * OrderRouter / PositionTracker / risk gateways).
 */
import { useEffect, useState } from "react";
import { useOrders } from "../../store/orderStore";
import { useMarket } from "../../store/marketStore";

export function OrderEntry() {
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [type, setType] = useState<"LIMIT" | "MARKET">("LIMIT");
  const [price, setPrice] = useState(useMarket.getState().mid);
  const [qty, setQty] = useState(1);
  const mid = useMarket((s) => s.mid);
  const orders = useOrders((s) => s.orders);
  const fills = useOrders((s) => s.fills);
  const netQty = useOrders((s) => s.netQty);
  const avgPrice = useOrders((s) => s.avgPrice);
  const realized = useOrders((s) => s.realized);
  const unrealized = useOrders((s) => s.unrealized);
  const breaker = useOrders((s) => s.breakerTripped);
  const riskCfg = useOrders((s) => s.riskCfg);

  useEffect(() => {
    setPrice(mid);
  }, [mid]);

  const submit = () => useOrders.getState().submit({ side, type, price, qty, mid });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="pane-header">
        <span>Order Entry · EMS</span>
        {breaker && <span style={{ color: "var(--ask)" }}>● CIRCUIT BREAKER · REDUCE ONLY</span>}
      </div>
      <div style={{ padding: 8 }}>
        <div className="grid2">
          <button className={side === "BUY" ? "bid-btn" : ""} onClick={() => setSide("BUY")}>BUY</button>
          <button className={side === "SELL" ? "ask-btn" : ""} onClick={() => setSide("SELL")}>SELL</button>
        </div>
        <div className="row">
          <label>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as "LIMIT" | "MARKET")} style={{ flex: 1 }}>
            <option>LIMIT</option>
            <option>MARKET</option>
          </select>
        </div>
        <div className="row">
          <label>Price</label>
          <input type="number" step="0.25" value={price} disabled={type === "MARKET"} onChange={(e) => setPrice(Number(e.target.value))} style={{ flex: 1 }} />
        </div>
        <div className="row">
          <label>Qty</label>
          <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} style={{ flex: 1 }} />
        </div>
        <button className={side === "BUY" ? "bid-btn" : "ask-btn"} style={{ width: "100%", padding: "6px", fontWeight: 700 }} onClick={submit}>
          {side} {qty} {type}
        </button>
        <div className="hint" style={{ marginTop: 4 }}>
          Gates: MAX_QTY {riskCfg.maxOrderQty} · COLLAR {(riskCfg.priceCollarPct * 100).toFixed(1)}% · MAX_NOTNL {(riskCfg.maxPositionNotional / 1e3).toFixed(0)}k · LOSS_BRK {riskCfg.dailyLossLimit}
        </div>
      </div>
      <div className="kpis" style={{ gridAutoColumns: "1fr 1fr", padding: "0 8px 6px" }}>
        <div className="kpi"><div className="l">Net Pos</div><div className="v">{netQty} @ {avgPrice.toFixed(2)}</div></div>
        <div className="kpi"><div className="l">PnL (R / U)</div><div className="v" style={{ color: realized + unrealized >= 0 ? "var(--bid)" : "var(--ask)" }}>{realized.toFixed(2)} / {unrealized.toFixed(2)}</div></div>
      </div>
      <div className="pane-header"><span>Working Orders</span><span className="hint">{orders.filter((o) => o.status === "NEW" || o.status === "PARTIALLY_FILLED").length} live</span></div>
      <div style={{ maxHeight: 120, overflow: "auto" }}>
        <table className="t">
          <thead><tr><th>Side</th><th>Type</th><th>Px</th><th>Qty</th><th>Fill</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {orders.slice(0, 30).map((o) => (
              <tr key={o.id}>
                <td className={o.side === "BUY" ? "buy" : "sell"}>{o.side}</td>
                <td className="muted">{o.type}</td>
                <td>{o.price.toFixed(2)}</td>
                <td>{o.qty}</td>
                <td>{o.filled}</td>
                <td className={o.status === "REJECTED" ? "sell" : o.status === "FILLED" ? "buy" : "muted"}>{o.status}</td>
                <td>{(o.status === "NEW" || o.status === "PARTIALLY_FILLED") && <button onClick={() => useOrders.getState().cancel(o.id)}>×</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pane-header"><span>Fills</span></div>
      <div className="pane-body" style={{ minHeight: 0 }}>
        <table className="t">
          <thead><tr><th>Time</th><th>Side</th><th>Px</th><th>Qty</th></tr></thead>
          <tbody>
            {fills.slice(0, 40).map((f) => (
              <tr key={f.id}>
                <td className="muted">{new Date(f.ts).toLocaleTimeString([], { hour12: false })}</td>
                <td className={f.side === "BUY" ? "buy" : "sell"}>{f.side}</td>
                <td>{f.price.toFixed(2)}</td>
                <td>{f.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

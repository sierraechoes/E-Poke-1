/**
 * ui/components/terminal-core/TimeAndSales.tsx
 * Live time & sales (the tape) + the order book liquidity heatmap.
 */
import { useEffect, useRef } from "react";
import { useMarket } from "../../store/marketStore";
import { HeatmapRenderer } from "../../gl/HeatmapShader";

export function TimeAndSales() {
  const trades = useMarket((s) => s.trades);
  const bids = useMarket((s) => s.bids);
  const asks = useMarket((s) => s.asks);
  const mid = useMarket((s) => s.mid);
  const heatRef = useRef<HTMLCanvasElement>(null);
  const heatRefRenderer = useRef<HeatmapRenderer | null>(null);

  useEffect(() => {
    if (heatRef.current && !heatRefRenderer.current) {
      heatRefRenderer.current = new HeatmapRenderer(heatRef.current);
    }
  }, []);

  useEffect(() => {
    const r = heatRefRenderer.current;
    if (!r) return;
    const cells = [...bids.map((b) => ({ price: b.price, size: b.size })), ...asks.map((a) => ({ price: a.price, size: a.size }))];
    r.push(cells, mid);
  }, [bids, asks, mid]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="pane-header">
        <span>Liquidity Heatmap</span>
        <span className="hint">size intensity over time</span>
      </div>
      <div style={{ height: 110, padding: 2 }}>
        <canvas ref={heatRef} style={{ width: "100%", height: "100%", imageRendering: "pixelated" }} />
      </div>
      <div className="pane-header" style={{ borderTop: "1px solid var(--line)" }}>
        <span>Time &amp; Sales</span>
        <span className="hint">{trades.length} prints</span>
      </div>
      <div className="pane-body" style={{ minHeight: 0 }}>
        <table className="t">
          <thead>
            <tr>
              <th>Time</th>
              <th>Price</th>
              <th style={{ textAlign: "right" }}>Size</th>
              <th>Side</th>
            </tr>
          </thead>
          <tbody>
            {trades.slice(0, 60).map((t, i) => (
              <tr key={i}>
                <td className="muted">{new Date(t.ts_ns / 1e6).toLocaleTimeString([], { hour12: false })}</td>
                <td className={t.side === "BUY" ? "buy" : "sell"}>{t.price.toFixed(2)}</td>
                <td style={{ textAlign: "right" }}>{t.size}</td>
                <td className={t.side === "BUY" ? "buy" : "sell"}>{t.side === "BUY" ? "↑" : "↓"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * ui/components/terminal-quant/BacktestDashboard.tsx
 * Vectorized + event-driven backtest UI (Section 3.3.1). Runs the engine
 * strategies over synthetic price histories and reports full analytics.
 */
import { useEffect, useRef } from "react";
import { useQuant } from "../../store/quantStore";

export function BacktestDashboard() {
  const q = useQuant();
  const bt = q.backtest;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!bt || bt.equity.length < 2) return;
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth;
    const H = cv.clientHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    const ctx = cv.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#05070a";
    ctx.fillRect(0, 0, W, H);
    const eq = bt.equity;
    const mn = Math.min(...eq);
    const mx = Math.max(...eq);
    const x = (i: number) => (i / (eq.length - 1)) * W;
    const y = (v: number) => H - ((v - mn) / (mx - mn || 1)) * (H - 12) - 6;
    // baseline
    ctx.strokeStyle = "#1b2430";
    ctx.beginPath();
    ctx.moveTo(0, y(eq[0]));
    ctx.lineTo(W, y(eq[0]));
    ctx.stroke();
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    eq.forEach((v, i) => (i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v))));
    ctx.stroke();
    ctx.fillStyle = "#6b7785";
    ctx.font = "10px monospace";
    ctx.fillText(mx.toFixed(3), 4, 12);
    ctx.fillText(mn.toFixed(3), 4, H - 2);
  }, [bt]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="pane-header"><span>Vectorized Backtest</span><span className="hint">600 bars · 2bps cost</span></div>
      <div style={{ padding: 8, display: "flex", gap: 6 }}>
        <button className="primary" onClick={() => q.runBacktest("momentum")}>Run Momentum Breakout</button>
        <button className="primary" onClick={() => q.runBacktest("statArb")}>Run Kalman Stat-Arb</button>
      </div>
      <div style={{ height: 170, padding: 4 }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
      </div>
      {bt && (
        <div className="kpis">
          <div className="kpi"><div className="l">Total Return</div><div className="v" style={{ color: bt.finalReturn >= 0 ? "var(--bid)" : "var(--ask)" }}>{(bt.finalReturn * 100).toFixed(2)}%</div></div>
          <div className="kpi"><div className="l">Sharpe</div><div className="v">{bt.sharpe.toFixed(2)}</div></div>
          <div className="kpi"><div className="l">Sortino</div><div className="v">{bt.sortino.toFixed(2)}</div></div>
          <div className="kpi"><div className="l">Calmar</div><div className="v">{bt.calmar.toFixed(2)}</div></div>
          <div className="kpi"><div className="l">Omega</div><div className="v">{bt.omega.toFixed(2)}</div></div>
          <div className="kpi"><div className="l">Max DD</div><div className="v">{(bt.mdd * 100).toFixed(1)}%</div></div>
          <div className="kpi"><div className="l">VaR 95</div><div className="v" style={{ color: "var(--ask)" }}>{(bt.var95 * 100).toFixed(2)}%</div></div>
          <div className="kpi"><div className="l">CVaR 95</div><div className="v" style={{ color: "var(--ask)" }}>{(bt.cvar95 * 100).toFixed(2)}%</div></div>
        </div>
      )}
    </div>
  );
}

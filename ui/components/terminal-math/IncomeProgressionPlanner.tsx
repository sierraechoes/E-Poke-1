/**
 * ui/components/terminal-math/IncomeProgressionPlanner.tsx
 * Constrained fractional-Kelly compounding planner + Monte-Carlo ruin
 * probability (Section 3.2.4). Equity curve rendered from the engine projection.
 */
import { useEffect, useRef } from "react";
import { useQuant } from "../../store/quantStore";
import { kellyFractional } from "../../../engine/math/pnl/kelly";

export function IncomeProgressionPlanner() {
  const q = useQuant();
  const p = q.planner;
  const out = q.plannerOut;
  const ruin = q.ruin;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const f = kellyFractional(p.win, p.payoff, 0.25, 0.25);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || out.equity.length < 2) return;
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth;
    const H = cv.clientHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    const ctx = cv.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#05070a";
    ctx.fillRect(0, 0, W, H);
    const eq = out.equity;
    const mn = Math.min(...eq);
    const mx = Math.max(...eq);
    const x = (i: number) => (i / (eq.length - 1)) * W;
    const y = (v: number) => H - ((v - mn) / (mx - mn || 1)) * (H - 10) - 5;
    ctx.strokeStyle = "#16c784";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    eq.forEach((v, i) => (i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v))));
    ctx.stroke();
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fillStyle = "rgba(22,199,132,0.1)";
    ctx.fill();
    ctx.fillStyle = "#6b7785";
    ctx.font = "10px monospace";
    ctx.fillText(`$${mn.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 4, H - 2);
    ctx.fillText(`$${mx.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 4, 12);
  }, [out]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="pane-header"><span>Compounding &amp; Ruin Planner</span><span className="hint">fractional Kelly γ=0.25</span></div>
      <div style={{ padding: 8 }}>
        <div className="grid2">
          <div className="row"><label>Capital</label><input type="number" value={p.capital} onChange={(e) => q.setPlanner({ capital: Number(e.target.value) })} /></div>
          <div className="row"><label>μ/bar</label><input type="number" step="0.0001" value={p.mean} onChange={(e) => q.setPlanner({ mean: Number(e.target.value) })} /></div>
          <div className="row"><label>σ/bar</label><input type="number" step="0.0005" value={p.std} onChange={(e) => q.setPlanner({ std: Number(e.target.value) })} /></div>
          <div className="row"><label>Win p</label><input type="number" step="0.01" value={p.win} onChange={(e) => q.setPlanner({ win: Number(e.target.value) })} /></div>
          <div className="row"><label>Payoff b</label><input type="number" step="0.1" value={p.payoff} onChange={(e) => q.setPlanner({ payoff: Number(e.target.value) })} /></div>
          <div className="row"><label>Target ×</label><input type="number" value={p.multiple} onChange={(e) => q.setPlanner({ multiple: Number(e.target.value) })} /></div>
        </div>
      </div>
      <div style={{ height: 130, padding: 4 }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
      </div>
      <div className="kpis">
        <div className="kpi"><div className="l">Kelly stake f*</div><div className="v">{(f * 100).toFixed(2)}%</div></div>
        <div className="kpi"><div className="l">CAGR</div><div className="v">{(out.cagr * 100).toFixed(1)}%</div></div>
        <div className="kpi"><div className="l">Max DD</div><div className="v">{(out.maxDrawdown * 100).toFixed(1)}%</div></div>
        <div className="kpi"><div className="l">Yrs to target</div><div className="v">{out.yearsToTarget === null ? "—" : out.yearsToTarget.toFixed(1)}</div></div>
        <div className="kpi"><div className="l">P(Ruin)</div><div className="v" style={{ color: ruin.pRuin > 0.05 ? "var(--ask)" : "var(--bid)" }}>{(ruin.pRuin * 100).toFixed(1)}%</div><div className="hint">P05 ${(ruin.p05).toFixed(0)} · P95 ${(ruin.p95).toFixed(0)}</div></div>
      </div>
    </div>
  );
}

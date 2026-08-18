/**
 * ui/components/terminal-core/Chart.tsx
 *
 * Real-time price + CVD chart with VWAP band overlay. Canvas-rendered from the
 * marketStore chart ring buffer (60 FPS driven by the SyntheticMarket).
 */
import { useEffect, useRef } from "react";
import { useMarket } from "../../store/marketStore";

export function Chart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chart = useMarket((s) => s.chart);
  const symbol = useMarket((s) => s.symbol);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth;
    const H = cv.clientHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    const ctx = cv.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#05070a";
    ctx.fillRect(0, 0, W, H);
    if (chart.length < 2) return;

    const prices = chart.map((p) => p.price);
    let mn = Math.min(...prices);
    let mx = Math.max(...prices);
    const pad = (mx - mn) * 0.15 || 1;
    mn -= pad;
    mx += pad;
    const x = (i: number) => (i / (chart.length - 1)) * W;
    const y = (p: number) => H - ((p - mn) / (mx - mn)) * H;

    // VWAP band
    let cumPV = 0;
    let cumV = 0;
    const vwap: number[] = [];
    for (let i = 0; i < chart.length; i++) {
      const v = 1 + Math.abs(chart[i].cvd - (chart[i - 1]?.cvd ?? 0));
      cumPV += chart[i].price * v;
      cumV += v;
      vwap.push(cumPV / cumV);
    }
    ctx.strokeStyle = "rgba(245,166,35,0.8)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    vwap.forEach((p, i) => (i ? ctx.lineTo(x(i), y(p)) : ctx.moveTo(x(i), y(p))));
    ctx.stroke();

    // price line
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    chart.forEach((p, i) => (i ? ctx.lineTo(x(i), y(p.price)) : ctx.moveTo(x(i), y(p.price))));
    ctx.stroke();
    // fill
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fillStyle = "rgba(59,130,246,0.07)";
    ctx.fill();

    // CVD sub-panel
    const cvdH = 40;
    const cvds = chart.map((p) => p.cvd);
    const cmn = Math.min(...cvds);
    const cmx = Math.max(...cvds);
    const cr = cmx - cmn || 1;
    ctx.fillStyle = "rgba(5,7,10,0.7)";
    ctx.fillRect(0, H - cvdH, W, cvdH);
    ctx.strokeStyle = "rgba(22,199,132,0.7)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    cvds.forEach((c, i) => {
      const yy = H - cvdH + cvdH / 2 - ((c - cmn) / cr - 0.5) * cvdH;
      i ? ctx.lineTo(x(i), yy) : ctx.moveTo(x(i), yy);
    });
    ctx.stroke();

    // labels
    ctx.fillStyle = "#6b7785";
    ctx.font = "10px monospace";
    ctx.fillText(symbol, 6, 12);
    ctx.fillText(mx.toFixed(2), W - 50, 12);
    ctx.fillText(mn.toFixed(2), W - 50, H - cvdH - 2);
    ctx.fillStyle = "#f0b90b";
    ctx.fillText("VWAP", W - 90, 24);
    ctx.fillStyle = "#16c784";
    ctx.fillText("CVD", 6, H - cvdH - 2);
  }, [chart, symbol]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="pane-header">
        <span>Price · VWAP · CVD</span>
        <span className="hint">{chart.length} pts · 1s bars</span>
      </div>
      <div style={{ flex: 1, minHeight: 0, padding: 2 }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}

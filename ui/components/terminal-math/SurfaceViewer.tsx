/**
 * ui/components/terminal-math/SurfaceViewer.tsx
 *
 * 3D volatility/premium surface + the pricing-engine readouts (Black-76,
 * Bachelier, Heston, Merton, American-put PDE) with live input controls.
 */
import { useEffect, useRef } from "react";
import { useQuant } from "../../store/quantStore";
import { Surface3DRenderer } from "../../gl/Surface3DShader";

export function SurfaceViewer() {
  const q = useQuant();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Surface3DRenderer | null>(null);
  const grid = q.volSurface.grid;
  const strikes = q.volSurface.strikes;
  const maturities = q.volSurface.maturities;

  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      canvasRef.current.width = canvasRef.current.clientWidth;
      canvasRef.current.height = canvasRef.current.clientHeight;
      rendererRef.current = new Surface3DRenderer(canvasRef.current);
    }
  }, []);
  useEffect(() => {
    const r = rendererRef.current;
    if (r && grid.length) r.render(grid, strikes, maturities, "Call premium");
  }, [grid, strikes, maturities]);

  useEffect(() => {
    const id = setInterval(() => rendererRef.current?.rotate(0.01), 60);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="pane-header"><span>Volatility / Premium Surface</span><span className="hint">drag not implemented · auto-rotate</span></div>
      <div style={{ height: 220, padding: 4 }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
      </div>
      <div style={{ padding: 8 }}>
        <div className="grid2">
          <div className="row"><label>Forward F</label><input type="number" step="0.5" value={q.pricing.F} onChange={(e) => q.setPricing({ F: Number(e.target.value) })} /></div>
          <div className="row"><label>Strike K</label><input type="number" step="0.5" value={q.pricing.K} onChange={(e) => q.setPricing({ K: Number(e.target.value) })} /></div>
          <div className="row"><label>T (yrs)</label><input type="number" step="0.05" value={q.pricing.T} onChange={(e) => q.setPricing({ T: Number(e.target.value) })} /></div>
          <div className="row"><label>Vol σ</label><input type="number" step="0.01" value={q.pricing.sigma} onChange={(e) => q.setPricing({ sigma: Number(e.target.value) })} /></div>
          <div className="row"><label>Rate r</label><input type="number" step="0.005" value={q.pricing.r} onChange={(e) => q.setPricing({ r: Number(e.target.value) })} /></div>
          <div className="row"><label>Type</label><select value={q.pricing.type} onChange={(e) => q.setPricing({ type: e.target.value as "CALL" | "PUT" })}><option>CALL</option><option>PUT</option></select></div>
        </div>
      </div>
      <div className="kpis">
        <div className="kpi"><div className="l">Black-76</div><div className="v">{q.black76.price.toFixed(4)}</div><div className="hint">Δ{q.black76.delta.toFixed(3)} Γ{q.black76.gamma.toFixed(4)} ν{q.black76.vega.toFixed(3)}</div></div>
        <div className="kpi"><div className="l">Bachelier</div><div className="v">{q.bachelier.toFixed(4)}</div><div className="hint">normal model</div></div>
        <div className="kpi"><div className="l">Heston SV</div><div className="v">{q.heston.toFixed(4)}</div><div className="hint">ξ0.4 ρ-0.4</div></div>
        <div className="kpi"><div className="l">Merton JD</div><div className="v">{q.merton.toFixed(4)}</div><div className="hint">λ3 jumps</div></div>
        <div className="kpi"><div className="l">Amer Put PDE</div><div className="v">{q.americanPut.toFixed(4)}</div><div className="hint">C-N Brennan-Schwartz</div></div>
      </div>
    </div>
  );
}

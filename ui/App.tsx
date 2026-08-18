/**
 * ui/App.tsx
 *
 * Triple-terminal desktop shell (Section 1.2 Rule 2):
 *   1. Master Execution Terminal (DOM + Chart + T&S + Order Entry)
 *   2. Advanced Mathematical Terminal (Surface + Microstructure + Planner)
 *   3. Quantitative Research & Algorithmic Studio (Backtest + Attribution)
 *
 * A persistent top bar shows live market stats; Ctrl+K opens the Bloomberg CLI.
 */
import { useEffect, useState } from "react";
import { useMarket } from "./store/marketStore";
import { useOrders } from "./store/orderStore";
import { useQuant } from "./store/quantStore";
import { CommandPalette } from "./components/shared/CommandPalette";
import { DOM } from "./components/terminal-core/DOM";
import { Chart } from "./components/terminal-core/Chart";
import { TimeAndSales } from "./components/terminal-core/TimeAndSales";
import { OrderEntry } from "./components/terminal-core/OrderEntry";
import { SurfaceViewer } from "./components/terminal-math/SurfaceViewer";
import { MicrostructureGauges } from "./components/terminal-math/MicrostructureGauges";
import { IncomeProgressionPlanner } from "./components/terminal-math/IncomeProgressionPlanner";
import { BacktestDashboard } from "./components/terminal-quant/BacktestDashboard";
import { PortfolioAttribution } from "./components/terminal-quant/PortfolioAttribution";

type Terminal = "EXEC" | "MATH" | "QUANT";

export default function App() {
  const [term, setTerm] = useState<Terminal>("EXEC");
  const start = useMarket((s) => s.start);
  const stop = useMarket((s) => s.stop);
  const symbol = useMarket((s) => s.symbol);
  const mid = useMarket((s) => s.mid);
  const spread = useMarket((s) => s.spread);
  const imbalance = useMarket((s) => s.imbalance);
  const vpin = useMarket((s) => s.vpin);
  const tickCount = useMarket((s) => s.tickCount);
  const onTick = useOrders((s) => s.onTick);
  const bestBid = useMarket((s) => s.bestBid);
  const bestAsk = useMarket((s) => s.bestAsk);

  // boot the market engine + seed the math terminal once
  useEffect(() => {
    start("ES.FUT", 1);
    useQuant.getState().recompute();
    useQuant.getState().runBacktest("momentum");
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // route live ticks into the order book for resting-order fills + MTM
  useEffect(() => {
    onTick(bestBid, bestAsk, mid);
  }, [bestBid, bestAsk, mid, onTick]);

  return (
    <div className="app">
      <TopBar
        symbol={symbol}
        mid={mid}
        spread={spread}
        imbalance={imbalance}
        vpin={vpin}
        tps={tickCount}
        term={term}
        setTerm={setTerm}
      />
      <div className="tabs">
        <div className={"tab" + (term === "EXEC" ? " active" : "")} onClick={() => setTerm("EXEC")}>Master Execution</div>
        <div className={"tab" + (term === "MATH" ? " active" : "")} onClick={() => setTerm("MATH")}>Mathematical Terminal</div>
        <div className={"tab" + (term === "QUANT" ? " active" : "")} onClick={() => setTerm("QUANT")}>Quant Studio</div>
        <div style={{ flex: 1 }} />
        <div className="hint" style={{ alignSelf: "center" }}>Ctrl+K command palette</div>
      </div>

      {term === "EXEC" && (
        <div className="content">
          <div className="pane" style={{ flex: "0 0 320px" }}><DOM levels={22} /></div>
          <div className="pane pane-col">
            <div style={{ flex: 1, minHeight: 0 }}><Chart /></div>
            <div style={{ flex: "0 0 320px", borderTop: "1px solid var(--line)" }}><TimeAndSales /></div>
          </div>
          <div className="pane" style={{ flex: "0 0 340px" }}><OrderEntry /></div>
        </div>
      )}
      {term === "MATH" && (
        <div className="content">
          <div className="pane pane-col">
            <div style={{ flex: 1, minHeight: 0 }}><SurfaceViewer /></div>
          </div>
          <div className="pane pane-col" style={{ flex: "0 0 340px" }}>
            <div style={{ flex: "0 0 auto" }}><MicrostructureGauges /></div>
            <div style={{ flex: 1, minHeight: 0, borderTop: "1px solid var(--line)" }}><IncomeProgressionPlanner /></div>
          </div>
        </div>
      )}
      {term === "QUANT" && (
        <div className="content">
          <div className="pane"><BacktestDashboard /></div>
          <div className="pane" style={{ flex: "0 0 420px" }}><PortfolioAttribution /></div>
        </div>
      )}
      <CommandPalette />
    </div>
  );
}

function TopBar(props: {
  symbol: string; mid: number; spread: number; imbalance: number; vpin: number; tps: number;
  term: string; setTerm: (t: Terminal) => void;
}) {
  return (
    <div className="topbar">
      <span className="brand">TWIG D. CAPRA · AFTIS</span>
      <span className="sym">{props.symbol}</span>
      <span className="stat">MID <b>{props.mid.toFixed(2)}</b></span>
      <span className="stat">SPR <b>{props.spread.toFixed(2)}</b></span>
      <span className="stat">IMB <b style={{ color: props.imbalance >= 0 ? "var(--bid)" : "var(--ask)" }}>{(props.imbalance * 100).toFixed(0)}%</b></span>
      <span className="stat">VPIN <b style={{ color: props.vpin > 0.3 ? "var(--ask)" : "var(--txt)" }}>{(props.vpin * 100).toFixed(1)}%</b></span>
      <span className="stat">EVT <b>{props.tps.toLocaleString()}</b></span>
      <span className="spacer" />
      <span className="mode">{props.symbol === "SIMULATION" ? "SIM" : "SIM · HAWKES"}</span>
    </div>
  );
}

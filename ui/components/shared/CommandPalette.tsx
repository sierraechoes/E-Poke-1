/**
 * ui/components/shared/CommandPalette.tsx
 *
 * Bloomberg-style global command palette (Section 3.1.3). `Ctrl+K` or `~` opens
 * a non-blocking top bar. Parses the AFTIS command grammar:
 *
 *   <ASSET> <ACTION> <QTY> <TYPE> @ <PRICE> [brackets]
 *   MATH SURFACE --asset X --model Y --slice Z
 *   QUANT BACKTEST --strat stat_arb --lookback 90D
 *   VIEW DOM --symbol CL.FUT
 */
import { useEffect, useRef, useState } from "react";
import { useOrders } from "../../store/orderStore";
import { useMarket } from "../../store/marketStore";
import { useQuant } from "../../store/quantStore";

const HELP = `AFTIS Command Grammar
  ES.FUT BUY 5 LMT @ 5055.25              place limit buy
  ES.FUT SELL 2 MKT                        market sell
  ES.FUT BUY 1 LMT @ 5055 SL=5048 TP=5060  bracket (OCO)
  MATH SURFACE --model heston              rebuild vol surface
  MATH PDE --strike 5100 --steps 500       American put PDE
  QUANT BACKTEST --strat momentum          run vectorized backtest
  QUANT BACKTEST --strat statArb           Kalman stat-arb
  RISK MAXQTY 500                          set MAX_ORDER_QTY
  VIEW DOM --symbol NQ.FUT                 switch symbol`;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");
  const [out, setOut] = useState<string[]>([HELP]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key.toLowerCase() === "k") || e.key === "~") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
  }, [open]);

  const exec = (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;
    const log = (s: string) => setOut((o) => [`> ${cmd}`, s, "", ...o].slice(0, 40));
    const up = cmd.toUpperCase();

    if (up.startsWith("RISK MAXQTY")) {
      const q = Number(cmd.split(/\s+/)[2]);
      useOrders.getState().updateRisk({ maxOrderQty: q });
      log(`✓ MAX_ORDER_QTY = ${q}`);
      return;
    }
    if (up.startsWith("QUANT BACKTEST")) {
      const strat = /stat/i.test(cmd) ? "statArb" : "momentum";
      useQuant.getState().runBacktest(strat);
      log(`✓ ran ${strat} backtest — see Quant Studio`);
      return;
    }
    if (up.startsWith("MATH SURFACE")) {
      useQuant.getState().recompute();
      log("✓ rebuilt pricing/vol surface — see Math Terminal");
      return;
    }
    if (up.startsWith("MATH PDE")) {
      const k = Number((cmd.match(/--strike\s+(\S+)/) || [])[1] || 100);
      useQuant.getState().setPricing({ K: k });
      log(`✓ American-put PDE @ K=${k} — see Math Terminal`);
      return;
    }
    if (up.startsWith("VIEW DOM")) {
      const m = cmd.match(/--symbol\s+(\S+)/i);
      const sym = m ? m[1].toUpperCase() : "ES.FUT";
      useMarket.getState().stop();
      useMarket.getState().start(sym, 1);
      log(`✓ switched view to ${sym}`);
      return;
    }
    // order grammar: ASSET ACTION QTY TYPE @ PRICE [brackets]
    const om = cmd.match(/^(\S+)\s+(BUY|SELL)\s+(\d+)\s+(LMT|MKT|LIMIT|MARKET)(?:\s*@\s*(\S+))?(.*)?$/i);
    if (om) {
      const [, , sideS, qtyS, typeS, priceS, bracket] = om;
      const side = sideS.toUpperCase() as "BUY" | "SELL";
      const qty = Number(qtyS);
      const type = /MKT|MARKET/i.test(typeS) ? "MARKET" : "LIMIT";
      const mid = useMarket.getState().mid;
      const price = priceS ? Number(priceS) : mid;
      useOrders.getState().submit({ side, type: type as "LIMIT" | "MARKET", price, qty, mid });
      const bl = bracket?.match(/SL=(\S+)/i);
      const tp = bracket?.match(/TP=(\S+)/i);
      log(
        `✓ ${side} ${qty} ${type} ${price}${bl ? " SL=" + bl[1] : ""}${tp ? " TP=" + tp[1] : ""} — see Order Blotter`
      );
      return;
    }
    log("✗ unrecognized command — type HELP");
  };

  if (!open) return null;
  return (
    <div className="palette-overlay" onClick={() => setOpen(false)}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={val}
          placeholder="AFTIS ›  e.g.  ES.FUT BUY 5 LMT @ 5055.25   |   QUANT BACKTEST --strat momentum"
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (val.trim().toUpperCase() === "HELP") setOut([HELP]);
              else exec(val);
              setVal("");
            }
          }}
        />
        <div className="out">
          {out.map((line, i) => (
            <div key={i} style={{ whiteSpace: "pre-wrap" }}>
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

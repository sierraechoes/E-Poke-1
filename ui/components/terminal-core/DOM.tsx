/**
 * ui/components/terminal-core/DOM.tsx
 *
 * Virtualized Depth-of-Market ladder (Section 3.1.1). Renders ±N ticks around
 * mid with Volume-at-Price bars, bid/ask sizes, and click-to-trade:
 *   left-click Bid column  -> Limit Buy
 *   left-click Ask column  -> Limit Sell
 *   right-click            -> Stop-Limit (OCO bracket)
 */
import { useMemo } from "react";
import { useMarket } from "../../store/marketStore";
import { useOrders } from "../../store/orderStore";

export function DOM({ levels = 24 }: { levels?: number }) {
  const bids = useMarket((s) => s.bids);
  const asks = useMarket((s) => s.asks);
  const mid = useMarket((s) => s.mid);
  const tickSize = 0.25;

  const bidMap = useMemo(() => new Map(bids.map((b) => [b.price, b.size])), [bids]);
  const askMap = useMemo(() => new Map(asks.map((a) => [a.price, a.size])), [asks]);
  const maxSize = useMemo(() => {
    let m = 1;
    for (const b of bids) m = Math.max(m, b.size);
    for (const a of asks) m = Math.max(m, a.size);
    return m;
  }, [bids, asks]);

  const baseMid = Math.round(mid / tickSize) * tickSize;
  const rows: { price: number; bid: number; ask: number }[] = [];
  for (let i = levels; i >= 1; i--) rows.push({ price: baseMid + i * tickSize, bid: 0, ask: 0 });
  rows.push({ price: baseMid, bid: 0, ask: 0 });
  for (let i = 1; i <= levels; i++) rows.push({ price: baseMid - i * tickSize, bid: 0, ask: 0 });
  for (const r of rows) {
    r.bid = bidMap.get(r.price) ?? 0;
    r.ask = askMap.get(r.price) ?? 0;
  }

  const onTrade = (side: "BUY" | "SELL", price: number) => {
    useOrders.getState().submit({ side, type: "LIMIT", price, qty: 1, mid });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="pane-header">
        <span>Depth of Market · {useMarket.getState().symbol}</span>
        <span className="hint">click bid=buy · click ask=sell · right-click=stop</span>
      </div>
      <div className="pane-body dom" onContextMenu={(e) => e.preventDefault()}>
        <div className="dom-row" style={{ color: "var(--dim)", fontSize: 10, position: "sticky", top: 0, background: "var(--panel)", zIndex: 2 }}>
          <span>VA ask%</span>
          <span style={{ textAlign: "right" }}>ASK</span>
          <span style={{ textAlign: "center" }}>PRICE</span>
          <span style={{ textAlign: "left" }}>BID</span>
          <span style={{ textAlign: "right" }}>VA bid%</span>
        </div>
        {rows.map((r) => {
          const isMid = Math.abs(r.price - baseMid) < 1e-6;
          const isAsk = r.ask > 0;
          const isBid = r.bid > 0;
          const bidPct = (r.bid / maxSize) * 100;
          const askPct = (r.ask / maxSize) * 100;
          return (
            <div
              key={r.price}
              className={"dom-row" + (isMid ? " mid" : "")}
              onContextMenu={() => onTrade(r.bid > 0 ? "SELL" : "BUY", r.price)}
            >
              <div style={{ position: "relative", height: 14 }}>
                {isAsk && <div className="vap ask" style={{ width: askPct + "%", marginLeft: "auto" }} />}
              </div>
              <span className="ask" onClick={() => isAsk && onTrade("SELL", r.price)}>{isAsk ? fmt(r.ask) : ""}</span>
              <span className="px">{r.price.toFixed(2)}</span>
              <span className="bid" onClick={() => isBid && onTrade("BUY", r.price)}>{isBid ? fmt(r.bid) : ""}</span>
              <div style={{ position: "relative", height: 14 }}>
                {isBid && <div className="vap bid" style={{ width: bidPct + "%" }} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function fmt(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1) + "k" : n.toFixed(0);
}

/**
 * ui/store/orderStore.ts
 *
 * Paper-trading order blotter bound to the engine. Uses PreTradeRisk (Section
 * 4.3 gateways) for validation and PositionTracker for FIFO PnL. Resting LIMIT
 * orders are checked against the live bid/ask on every market tick.
 */
import { create } from "zustand";
import { PositionTracker } from "../../engine/core/oms/position_tracker";
import { PreTradeRisk, DEFAULT_RISK } from "../../engine/core/risk/pre_trade";
import { orderStateMachine } from "../../engine/core/oms/state_machine";
import type { Side, OrderType, OrderStatus } from "../../engine/core/storage/wal_sqlite";

export interface BlotterOrder {
  id: string;
  side: Side;
  type: OrderType;
  price: number;
  qty: number;
  filled: number;
  status: OrderStatus;
  createdAt: number;
  rejectReason?: string;
}
export interface BlotterFill {
  id: string;
  orderId: string;
  side: Side;
  price: number;
  qty: number;
  ts: number;
}

interface OrderState {
  symbol: string;
  orders: BlotterOrder[];
  fills: BlotterFill[];
  netQty: number;
  avgPrice: number;
  realized: number;
  unrealized: number;
  riskCfg: typeof DEFAULT_RISK;
  breakerTripped: boolean;
  submit: (args: { side: Side; type: OrderType; price: number; qty: number; mid: number }) => void;
  cancel: (id: string) => void;
  onTick: (bid: number, ask: number, mid: number) => void;
  updateRisk: (p: Partial<typeof DEFAULT_RISK>) => void;
  reset: () => void;
}

const tracker = new PositionTracker();
const risk = new PreTradeRisk({ ...DEFAULT_RISK });
let seq = 0;
let breakerTripped = false;

export const useOrders = create<OrderState>((set, get) => ({
  symbol: "ES.FUT",
  orders: [],
  fills: [],
  netQty: 0,
  avgPrice: 0,
  realized: 0,
  unrealized: 0,
  riskCfg: { ...DEFAULT_RISK },
  breakerTripped: false,

  submit: ({ side, type, price, qty, mid }) => {
    const incremental = qty * price;
    const verdict = risk.check({
      symbol: get().symbol,
      side,
      price,
      qty,
      nbboMid: mid,
      currentGrossNotional: tracker.grossNotional(new Map([[get().symbol, mid]])),
      incrementalNotional: incremental,
    });
    if (!verdict.ok) {
      const id = `O${++seq}`;
      set({
        orders: [
          { id, side, type, price, qty, filled: 0, status: "REJECTED" as OrderStatus, createdAt: Date.now(), rejectReason: verdict.rule },
          ...get().orders,
        ].slice(0, 200),
      });
      return;
    }
    const id = `O${++seq}`;
    const order: BlotterOrder = { id, side, type, price, qty, filled: 0, status: "NEW", createdAt: Date.now() };

    if (type === "MARKET") {
      // fill immediately at the opposite top-of-book price
      const fillPrice = side === "BUY" ? price + 0.25 : price - 0.25;
      executeFill(order, fillPrice, qty, set, get);
    } else {
      // resting limit -> add to book
      set({ orders: [order, ...get().orders].slice(0, 200) });
    }
  },

  cancel: (id) => {
    const orders = get().orders.map((o) =>
      o.id === id && (o.status === "NEW" || o.status === "PARTIALLY_FILLED")
        ? { ...o, status: "CANCELED" as OrderStatus }
        : o
    );
    set({ orders });
  },

  onTick: (bid, ask, mid) => {
    // check resting limit orders for fills
    const orders = get().orders;
    let changed = false;
    for (const o of orders) {
      if (o.status !== "NEW" && o.status !== "PARTIALLY_FILLED") continue;
      if (o.type !== "LIMIT") continue;
      const remaining = o.qty - o.filled;
      if (remaining <= 0) continue;
      let fillPrice = 0;
      if (o.side === "BUY" && o.price >= ask) fillPrice = ask;
      else if (o.side === "SELL" && o.price <= bid) fillPrice = bid;
      if (fillPrice > 0) {
        executeFill(o, fillPrice, remaining, set, get);
        changed = true;
      }
    }
    // mark-to-market
    const pos = tracker.get(get().symbol);
    const unreal = pos ? pos.netQty * (mid - pos.avgPrice) : 0;
    if (changed || Math.abs(unreal - get().unrealized) > 1e-6) {
      set({ unrealized: unreal });
      evaluateBreaker(set, get, mid);
    }
  },

  updateRisk: (p) => {
    const cfg = { ...get().riskCfg, ...p };
    risk.update(cfg);
    set({ riskCfg: cfg });
  },

  reset: () => {
    seq = 0;
    breakerTripped = false;
    set({ orders: [], fills: [], netQty: 0, avgPrice: 0, realized: 0, unrealized: 0, breakerTripped: false });
  },
}));

function executeFill(
  order: BlotterOrder,
  price: number,
  qty: number,
  set: (p: Partial<OrderState>) => void,
  get: () => OrderState
) {
  tracker.apply({
    symbol: get().symbol,
    side: order.side,
    price,
    quantity: qty,
    fee: qty * price * 0.00002,
  });
  const fill: BlotterFill = { id: `F${++seq}`, orderId: order.id, side: order.side, price, qty, ts: Date.now() };
  order.filled += qty;
  order.status = orderStateMachine.transition(order.status, order.filled >= order.qty ? "FILLED" : "PARTIALLY_FILLED");
  const pos = tracker.get(get().symbol)!;
  set({
    fills: [fill, ...get().fills].slice(0, 200),
    orders: [...get().orders.map((o) => (o.id === order.id ? { ...order } : o))],
    netQty: pos.netQty,
    avgPrice: pos.avgPrice,
    realized: pos.realizedPnl,
  });
}

function evaluateBreaker(set: (p: Partial<OrderState>) => void, get: () => OrderState, mid: number) {
  if (breakerTripped) return;
  const realized = tracker.totalRealizedPnl - tracker.cumulativeFees;
  const unreal = tracker.totalUnrealized(new Map([[get().symbol, mid]]));
  const daily = realized + unreal;
  if (daily <= -get().riskCfg.dailyLossLimit) {
    breakerTripped = true;
    risk.update({ ...get().riskCfg, reduceOnly: true });
    set({ breakerTripped: true, riskCfg: { ...get().riskCfg, reduceOnly: true } });
  }
}

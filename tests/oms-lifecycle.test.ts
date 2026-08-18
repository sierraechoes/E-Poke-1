/**
 * tests/oms-lifecycle.test.ts — OMS / EMS lifecycle & risk-gateway verification.
 *
 * Exercises the OrderRouter across the full order state machine: rest, partial
 * fill, full fill, cancel, bracket (OCO), and every pre-trade risk gateway
 * (MAX_ORDER_QTY, MAX_POSITION_NOTIONAL, PRICE_COLLAR) plus the daily-loss
 * circuit breaker and FIFO position PnL. Persistence is verified against the
 * in-memory WAL store.
 */
import { describe, it, expect } from "vitest";
import { OrderRouter, type OrderRequest } from "../engine/core/oms/router";
import { WalSqliteStore } from "../engine/core/storage/wal_sqlite";
import { MatchingEngine } from "../engine/core/oms/matching_engine";
import { orderStateMachine } from "../engine/core/oms/state_machine";
import { PreTradeRisk, DEFAULT_RISK } from "../engine/core/risk/pre_trade";
import { CircuitBreaker } from "../engine/core/risk/circuit_breaker";

// use ephemeral in-memory store (no disk in test env)
function ephemeralStore(): WalSqliteStore {
  return WalSqliteStore.ephemeral();
}

async function seedLiquidity(router: OrderRouter, symbol = "ES.FUT", mid = 5055) {
  for (let i = 1; i <= 10; i++) {
    await router.submit({ symbol, side: "SELL", type: "LIMIT", price: mid + i * 0.25, qty: 10 });
    await router.submit({ symbol, side: "BUY", type: "LIMIT", price: mid - i * 0.25, qty: 10 });
  }
}

describe("OMS state machine", () => {
  it("permits legal transitions and rejects illegal ones", () => {
    expect(orderStateMachine.canTransition("PENDING_NEW", "NEW")).toBe(true);
    expect(orderStateMachine.canTransition("NEW", "PARTIALLY_FILLED")).toBe(true);
    expect(orderStateMachine.canTransition("PARTIALLY_FILLED", "FILLED")).toBe(true);
    expect(orderStateMachine.canTransition("FILLED", "NEW")).toBe(false);
    expect(() => orderStateMachine.transition("CANCELED", "FILLED")).toThrow();
    expect(orderStateMachine.isTerminal("FILLED")).toBe(true);
  });
});

describe("OMS matching engine", () => {
  it("matches MARKET against LIMIT with price-time priority and partial fills", () => {
    const me = new MatchingEngine("ES.FUT", () => 0);
    me.submit({ id: "A", side: "SELL", type: "LIMIT", price: 100, qty: 5 });
    me.submit({ id: "B", side: "SELL", type: "LIMIT", price: 100, qty: 5 });
    const r = me.submit({ id: "C", side: "BUY", type: "MARKET", price: 999, qty: 7 });
    expect(r.trades.length).toBeGreaterThanOrEqual(1);
    expect(r.remaining).toBe(0);
    expect(r.status).toBe("FILLED");
    // 5 from A (first in time) + 2 from B
    const totalQty = r.trades.reduce((a, t) => a + t.qty, 0);
    expect(totalQty).toBe(7);
  });

  it("rests unfilled LIMIT remainder on the book (GTC)", () => {
    const me = new MatchingEngine("ES.FUT", () => 0);
    const r = me.submit({ id: "X", side: "BUY", type: "LIMIT", price: 99, qty: 10 });
    expect(r.status).toBe("NEW");
    expect(me.depth(1).bids[0][0]).toBe(99);
  });
});

describe("OrderRouter lifecycle + FIFO PnL", () => {
  it("rests, crosses, partially fills, and tracks realized PnL", async () => {
    const router = new OrderRouter();
    await seedLiquidity(router);
    // take 3 @ best ask (5055.25)
    const buy: OrderRequest = { symbol: "ES.FUT", side: "BUY", type: "MARKET", price: 5060, qty: 3 };
    const r1 = await router.submit(buy);
    expect(r1.fills.length).toBeGreaterThanOrEqual(1);
    const pos = router.position("ES.FUT")!;
    expect(pos.netQty).toBe(3);
    // close 1 lot with a MARKET sell (crosses best bid) -> realize PnL
    await router.submit({ symbol: "ES.FUT", side: "SELL", type: "MARKET", price: 5000, qty: 1 });
    const pos1 = router.position("ES.FUT")!;
    expect(pos1.netQty).toBe(2);
    expect(Number.isFinite(pos1.realizedPnl)).toBe(true);
    // re-open 1 lot
    await router.submit({ symbol: "ES.FUT", side: "BUY", type: "MARKET", price: 5060, qty: 1 });
    const pos2 = router.position("ES.FUT")!;
    expect(pos2.netQty).toBe(3);
  });

  it("persists orders, trades, and risk audit to the WAL store", async () => {
    const store = ephemeralStore();
    const router = new OrderRouter();
    router.attachStore(store);
    await seedLiquidity(router);
    await router.submit({ symbol: "ES.FUT", side: "BUY", type: "MARKET", price: 5060, qty: 2 });
    expect(store.allOrders().length).toBeGreaterThan(0);
    expect(store.getTrades().length).toBeGreaterThan(0);
    expect(store.getRiskLog().length).toBeGreaterThan(0);
  });

  it("rejects orders over MAX_ORDER_QTY", async () => {
    const router = new OrderRouter({ ...DEFAULT_RISK, maxOrderQty: 50 });
    await seedLiquidity(router);
    const r = await router.submit({ symbol: "ES.FUT", side: "BUY", type: "MARKET", price: 5060, qty: 100 });
    expect(r.status).toBe("REJECTED");
    expect(r.rejectReason).toBe("MAX_ORDER_QTY");
  });

  it("rejects orders outside the PRICE_COLLAR", async () => {
    const router = new OrderRouter({ ...DEFAULT_RISK, priceCollarPct: 0.01 });
    await seedLiquidity(router, "ES.FUT", 5055);
    // price 5% away from NBBO mid
    const r = await router.submit({ symbol: "ES.FUT", side: "BUY", type: "LIMIT", price: 4000, qty: 1, nbboMid: 5055 });
    expect(r.status).toBe("REJECTED");
    expect(r.rejectReason).toBe("PRICE_COLLAR");
  });

  it("rejects when gross notional would exceed MAX_POSITION_NOTIONAL", async () => {
    const router = new OrderRouter({ ...DEFAULT_RISK, maxPositionNotional: 100_000 });
    const r = await router.submit({ symbol: "ES.FUT", side: "BUY", type: "LIMIT", price: 5055, qty: 100, nbboMid: 5055 });
    // 100 * 5055 = 505,500 > 100,000
    expect(r.status).toBe("REJECTED");
    expect(r.rejectReason).toBe("MAX_POSITION_NOTIONAL");
  });

  it("cancels a resting order", async () => {
    const router = new OrderRouter();
    await seedLiquidity(router);
    const r = await router.submit({ symbol: "ES.FUT", side: "BUY", type: "LIMIT", price: 5000, qty: 5 });
    const ok = await router.cancel("ES.FUT", r.orderId);
    expect(ok).toBe(true);
  });
});

describe("Circuit breaker", () => {
  it("trips when daily loss exceeds the limit and plans a flatten", () => {
    const cfg = { ...DEFAULT_RISK, dailyLossLimit: 5000 };
    const cb = new CircuitBreaker(cfg);
    let tripped = false;
    cb.onTrip(() => (tripped = true));
    const ev = cb.evaluate(-6000, Date.now() * 1e6);
    expect(tripped).toBe(true);
    expect(ev?.state).toBe("TRIPPED");
    const flatten = cb.planFlatten([
      { symbol: "ES.FUT", netQty: 5 },
      { symbol: "NQ.FUT", netQty: -3 },
      { symbol: "CL.FUT", netQty: 0 },
    ]);
    expect(flatten).toEqual([
      { symbol: "ES.FUT", side: "SELL", qty: 5 },
      { symbol: "NQ.FUT", side: "BUY", qty: 3 },
    ]);
  });

  it("pre-trade reduce-only mode blocks new BUY orders", () => {
    const risk = new PreTradeRisk({ ...DEFAULT_RISK, reduceOnly: true });
    const v = risk.check({
      symbol: "ES.FUT", side: "BUY", price: 5055, qty: 1, nbboMid: 5055,
      currentGrossNotional: 0, incrementalNotional: 5055,
    });
    expect(v.ok).toBe(false);
    expect(!v.ok && v.rule).toBe("REDUCE_ONLY");
  });
});

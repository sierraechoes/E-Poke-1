/**
 * engine/core/oms/state_machine.ts
 *
 * Order lifecycle state machine with guarded transitions (Section 2.2 status
 * graph). Each transition is validated; illegal transitions throw.
 *
 *   PENDING_NEW -> NEW | REJECTED
 *   NEW         -> PARTIALLY_FILLED | FILLED | CANCELED
 *   PARTIALLY_FILLED -> PARTIALLY_FILLED | FILLED | CANCELED
 *   FILLED | CANCELED | REJECTED  -> (terminal)
 */
import type { OrderStatus } from "../storage/wal_sqlite";

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_NEW: ["NEW", "REJECTED"],
  NEW: ["PARTIALLY_FILLED", "FILLED", "CANCELED"],
  PARTIALLY_FILLED: ["PARTIALLY_FILLED", "FILLED", "CANCELED"],
  FILLED: [],
  CANCELED: [],
  REJECTED: [],
};

export class OrderStateMachine {
  /** Returns true if from->to is a legal transition. */
  canTransition(from: OrderStatus, to: OrderStatus): boolean {
    return TRANSITIONS[from].includes(to);
  }

  transition(from: OrderStatus, to: OrderStatus): OrderStatus {
    if (from === to) return from;
    if (!this.canTransition(from, to)) {
      throw new Error(`Illegal order transition: ${from} -> ${to}`);
    }
    return to;
  }

  isTerminal(s: OrderStatus): boolean {
    return TRANSITIONS[s].length === 0;
  }
}

export const orderStateMachine = new OrderStateMachine();

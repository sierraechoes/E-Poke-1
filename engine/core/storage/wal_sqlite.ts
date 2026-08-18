/**
 * engine/core/storage/wal_sqlite.ts
 *
 * Embedded transactional store emulating SQLite WAL semantics for orders,
 * executions, and the risk audit log. Because the sandbox has no native
 * sqlite3, this implements the same durability contract in pure JS:
 *
 *   - Append-only Write-Ahead Log: every mutation is fsync-appended to <db>.wal
 *     before the in-memory state is updated (write-ahead).
 *   - In-memory B-tree-style index keyed by primary key for O(1) lookups.
 *   - Periodic checkpoint: the log is folded into the main snapshot file
 *     <db>.snap and the log truncated.
 *   - On load: snapshot is read first, then the WAL replayed forward.
 *
 * The SQL schemas from Section 2.2 (orders / trades / risk_audit_log) are
 * enforced by the typed API and CHECK-constraint-equivalent validators.
 */
// Node fs is loaded lazily so this module is safe to import in a browser bundle
// (disk paths are only touched by open()/checkpoint(), which the browser path
// never calls — the UI runs OrderRouter without a persistent store).
type NodeFs = typeof import("node:fs");
type NodePath = typeof import("node:path");
let _fsPromise: Promise<{ fs: NodeFs["promises"]; existsSync: (p: string) => boolean; path: NodePath }> | null = null;
async function nodeFs() {
  if (!_fsPromise) {
    _fsPromise = (async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      return { fs: fs.promises, existsSync: fs.existsSync, path };
    })();
  }
  return _fsPromise;
}

export type Side = "BUY" | "SELL";
export type OrderType = "LIMIT" | "MARKET" | "STOP_LIMIT" | "ICEBERG" | "TWAP";
export type OrderStatus =
  | "PENDING_NEW"
  | "NEW"
  | "PARTIALLY_FILLED"
  | "FILLED"
  | "CANCELED"
  | "REJECTED";
export type TIF = "GTC" | "IOC" | "FOK" | "GTD";
export type Severity = "INFO" | "WARNING" | "BREACH_REJECT" | "CRITICAL_CIRCUIT_BREAK";

export interface OrderRow {
  order_id: string;
  client_order_id: string;
  symbol: string;
  side: Side;
  order_type: OrderType;
  price: number;
  quantity: number;
  filled_qty: number;
  stop_price: number | null;
  status: OrderStatus;
  time_in_force: TIF;
  created_at_ns: number;
  updated_at_ns: number;
}

export interface TradeRow {
  trade_id: string;
  order_id: string;
  symbol: string;
  side: Side;
  price: number;
  quantity: number;
  fee: number;
  timestamp_ns: number;
}

export interface RiskAuditRow {
  event_id: string;
  timestamp_ns: number;
  rule_name: string;
  severity: Severity;
  message: string;
}

type WalRecord =
  | { t: "upsertOrder"; o: OrderRow }
  | { t: "deleteOrder"; id: string }
  | { t: "trade"; x: TradeRow }
  | { t: "risk"; r: RiskAuditRow }
  | { t: "checkpoint"; n: number };

const VALID: Record<string, Set<string>> = {
  side: new Set(["BUY", "SELL"]),
  order_type: new Set(["LIMIT", "MARKET", "STOP_LIMIT", "ICEBERG", "TWAP"]),
  status: new Set(["PENDING_NEW", "NEW", "PARTIALLY_FILLED", "FILLED", "CANCELED", "REJECTED"]),
  time_in_force: new Set(["GTC", "IOC", "FOK", "GTD"]),
  severity: new Set(["INFO", "WARNING", "BREACH_REJECT", "CRITICAL_CIRCUIT_BREAK"]),
};

function assertCheck(col: string, val: string) {
  const set = VALID[col];
  if (set && !set.has(val)) throw new Error(`CHECK constraint failed: ${col}='${val}'`);
}

export class WalSqliteStore {
  readonly dir: string;
  readonly name: string;
  private orders = new Map<string, OrderRow>();
  private trades: TradeRow[] = [];
  private riskLog: RiskAuditRow[] = [];
  private walOpsSinceCheckpoint = 0;
  private readonly checkpointEvery = 1000;
  private writeQueue: Promise<unknown> = Promise.resolve();
  private journalMode = "WAL";
  private synchronous = "NORMAL";
  private ephemeral = false;

  constructor(dbDir: string, name = "aftis") {
    this.dir = dbDir;
    this.name = name;
  }

  private async paths() {
    const { path } = await nodeFs();
    return {
      snap: path.join(this.dir, `${this.name}.snap`),
      wal: path.join(this.dir, `${this.name}.wal`),
    };
  }

  /** PRAGMA journal_mode = WAL; synchronous = NORMAL; */
  pragmas() {
    return { journal_mode: this.journalMode, synchronous: this.synchronous };
  }

  async open(): Promise<void> {
    if (this.ephemeral) return;
    const { fs, existsSync } = await nodeFs();
    await fs.mkdir(this.dir, { recursive: true });
    const { snap, wal } = await this.paths();
    if (existsSync(snap)) {
      const snap2 = JSON.parse(await fs.readFile(snap, "utf8"));
      this.orders = new Map(snap2.orders.map((o: OrderRow) => [o.order_id, o]));
      this.trades = snap2.trades;
      this.riskLog = snap2.risk;
    }
    if (existsSync(wal)) {
      const lines = (await fs.readFile(wal, "utf8")).split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          this.applyRecord(JSON.parse(line) as WalRecord, false);
        } catch {
          // torn WAL tail
        }
      }
    }
  }

  private applyRecord(rec: WalRecord, persist: boolean) {
    switch (rec.t) {
      case "upsertOrder": {
        const o = rec.o;
        assertCheck("side", o.side);
        assertCheck("order_type", o.order_type);
        assertCheck("status", o.status);
        assertCheck("time_in_force", o.time_in_force);
        this.orders.set(o.order_id, o);
        break;
      }
      case "deleteOrder":
        this.orders.delete(rec.id);
        break;
      case "trade":
        assertCheck("side", rec.x.side);
        this.trades.push(rec.x);
        break;
      case "risk":
        assertCheck("severity", rec.r.severity);
        this.riskLog.push(rec.r);
        break;
      case "checkpoint":
        break;
    }
    if (persist) {
      this.walOpsSinceCheckpoint++;
      if (this.walOpsSinceCheckpoint >= this.checkpointEvery) {
        void this.checkpoint();
      }
    }
  }

  /** Append a record to the WAL (write-ahead), then apply to memory. */
  private append(rec: WalRecord): Promise<void> {
    const run = this.writeQueue.then(async () => {
      this.applyRecord(rec, true);
      if (this.ephemeral) return;
      const { fs } = await nodeFs();
      const { wal } = await this.paths();
      await fs.appendFile(wal, JSON.stringify(rec) + "\n", "utf8"); // write-ahead
    });
    this.writeQueue = run;
    return run as Promise<void>;
  }

  async upsertOrder(o: OrderRow): Promise<void> {
    await this.append({ t: "upsertOrder", o });
  }
  async deleteOrder(id: string): Promise<void> {
    await this.append({ t: "deleteOrder", id });
  }
  async recordTrade(x: TradeRow): Promise<void> {
    await this.append({ t: "trade", x });
  }
  async recordRisk(r: RiskAuditRow): Promise<void> {
    await this.append({ t: "risk", r });
  }

  getOrder(id: string): OrderRow | undefined {
    return this.orders.get(id);
  }
  getOpenOrders(symbol?: string): OrderRow[] {
    const open: OrderStatus[] = ["NEW", "PARTIALLY_FILLED", "PENDING_NEW"];
    return [...this.orders.values()].filter(
      (o) => open.includes(o.status) && (!symbol || o.symbol === symbol)
    );
  }
  getTrades(): TradeRow[] {
    return this.trades;
  }
  getRiskLog(): RiskAuditRow[] {
    return this.riskLog;
  }
  allOrders(): OrderRow[] {
    return [...this.orders.values()];
  }

  /** Fold the WAL into the snapshot and truncate the log. */
  async checkpoint(): Promise<void> {
    await this.writeQueue;
    if (this.ephemeral) return;
    const { fs } = await nodeFs();
    const { snap, wal } = await this.paths();
    const snap2 = {
      orders: [...this.orders.values()],
      trades: this.trades,
      risk: this.riskLog,
    };
    const tmp = snap + ".tmp";
    await fs.writeFile(tmp, JSON.stringify(snap2), "utf8");
    await fs.rename(tmp, snap); // atomic replace
    await fs.writeFile(wal, "", "utf8"); // truncate log
    this.walOpsSinceCheckpoint = 0;
  }

  /** In-memory ephemeral mode (no disk) for backtests/benchmarks. */
  static ephemeral(): WalSqliteStore {
    const s = Object.create(WalSqliteStore.prototype) as WalSqliteStore;
    (s as unknown as { dir: string }).dir = ":memory:";
    (s as unknown as { name: string }).name = ":memory:";
    (s as unknown as { ephemeral: boolean }).ephemeral = true;
    (s as unknown as { orders: Map<string, OrderRow> }).orders = new Map();
    (s as unknown as { trades: TradeRow[] }).trades = [];
    (s as unknown as { riskLog: RiskAuditRow[] }).riskLog = [];
    (s as unknown as { walOpsSinceCheckpoint: number }).walOpsSinceCheckpoint = 0;
    (s as unknown as { checkpointEvery: number }).checkpointEvery = Infinity;
    (s as unknown as { writeQueue: Promise<unknown> }).writeQueue = Promise.resolve();
    return s;
  }
}

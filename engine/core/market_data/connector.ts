/**
 * engine/core/market_data/connector.ts
 *
 * Market data connector. In LIVE mode it opens a WebSocket to an exchange
 * (Binance/Bybit perpetual futures), normalizes messages, maintains heartbeats,
 * and reconnects with exponential backoff. In SIMULATION mode (or when no API
 * key is configured — Zero-Mock failover, Rule 1) it drives the SyntheticMarket
 * on a fixed tick and emits the same canonical event stream.
 *
 * Subscribers receive MarketEvent objects through a fan-out.
 */
import { SyntheticMarket, type MarketEvent, type SyntheticMarketConfig } from "../simulator/market_maker";

export type Mode = "LIVE" | "SIMULATION";

export interface ConnectorConfig {
  mode: Mode;
  symbol: string;
  wsUrl?: string;
  apiKey?: string;
  simulation?: Partial<SyntheticMarketConfig>;
  simRate?: number; // synthetic events/sec multiplier
}

type Subscriber = (e: MarketEvent) => void;

export class MarketConnector {
  readonly cfg: ConnectorConfig;
  private subs = new Set<Subscriber>();
  private sim: SyntheticMarket | null = null;
  private ws: WebSocket | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private running = false;
  private lastHeartbeatNs = 0;

  constructor(cfg: ConnectorConfig) {
    this.cfg = cfg;
  }

  subscribe(fn: Subscriber): () => void {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  }

  private emit(e: MarketEvent) {
    for (const s of this.subs) s(e);
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    if (this.cfg.mode === "SIMULATION" || !this.cfg.apiKey) {
      if (this.cfg.mode === "LIVE" && !this.cfg.apiKey) {
        // Zero-Mock failover: no API key -> synthetic engine
        console.warn("[AFTIS] No live API key configured -> failing over to Hawkes synthetic engine");
      }
      this.startSim();
    } else {
      await this.startLive();
    }
  }

  private startSim() {
    this.sim = new SyntheticMarket({
      symbol: this.cfg.symbol,
      eventsPerSec: this.cfg.simRate ?? 1,
      ...this.cfg.simulation,
    });
    // 60 Hz pump: step the simulator by ~16.7ms per frame
    const dtSec = 1 / 60;
    this.timer = setInterval(() => {
      if (!this.sim) return;
      const events = this.sim.step(dtSec);
      for (const e of events) this.emit(e);
    }, dtSec * 1000);
  }

  private async startLive() {
    // Browser WebSocket; in Tauri the native client would be used equivalently.
    const url = this.cfg.wsUrl ?? `wss://fstream.binance.com/ws`;
    try {
      this.ws = new WebSocket(url);
      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.subscribeBinance();
      };
      this.ws.onmessage = (msg) => this.handleRaw(msg.data);
      this.ws.onclose = () => this.scheduleReconnect();
      this.ws.onerror = () => this.ws?.close();
    } catch {
      this.scheduleReconnect();
    }
  }

  private subscribeBinance() {
    if (!this.ws) return;
    const stream = `${this.cfg.symbol.toLowerCase()}@depth@100ms`;
    this.ws.send(JSON.stringify({ method: "SUBSCRIBE", params: [stream], id: 1 }));
    this.lastHeartbeatNs = Date.now() * 1e6;
    this.timer = setInterval(() => this.checkHeartbeat(), 1000);
  }

  private checkHeartbeat() {
    const now = Date.now() * 1e6;
    if (now - this.lastHeartbeatNs > 10e9) {
      // 10s silent -> reconnect
      this.ws?.close();
    }
  }

  private scheduleReconnect() {
    if (!this.running) return;
    this.reconnectAttempts++;
    const delay = Math.min(30000, 1000 * 2 ** this.reconnectAttempts);
    setTimeout(() => { if (this.running) void this.startLive(); }, delay);
  }

  /** Live messages are normalized here (see normalizer). */
  private handleRaw(data: unknown) {
    this.lastHeartbeatNs = Date.now() * 1e6;
    // normalization is environment-dependent; for the in-process engine we
    // delegate to normalizeBinanceEvent, which returns canonical MarketEvents.
    import("./normalizer").then(({ normalizeBinanceEvent }) => {
      const events = normalizeBinanceEvent(data, this.cfg.symbol);
      for (const e of events) this.emit(e);
    });
  }

  stop() {
    this.running = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.ws) { this.ws.close(); this.ws = null; }
    this.sim = null;
  }

  get mode(): Mode {
    return this.sim ? "SIMULATION" : this.cfg.mode;
  }
  get simMarket(): SyntheticMarket | null {
    return this.sim;
  }
}

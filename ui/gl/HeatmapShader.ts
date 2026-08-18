/**
 * ui/gl/HeatmapShader.ts
 *
 * Order-book liquidity heatmap renderer. In the native (Tauri/WebView2) build
 * this maps to a WebGL fragment shader for 120 FPS; here we render to a 2D
 * canvas with the same color ramp and accumulation buffer, fed by the live L2
 * depth stream. Intensity = resting size at (price, time).
 */
export interface HeatCell {
  price: number;
  size: number;
}

export class HeatmapRenderer {
  private ctx: CanvasRenderingContext2D;
  private cols = 160; // history depth (time axis)
  private rows = 60; // price levels
  private buf: Float32Array; // intensity buffer [rows * cols]
  private minP = Infinity;
  private maxP = -Infinity;

  constructor(private canvas: HTMLCanvasElement) {
    canvas.width = this.cols;
    canvas.height = this.rows;
    const c = canvas.getContext("2d");
    if (!c) throw new Error("no 2d context");
    this.ctx = c;
    this.buf = new Float32Array(this.rows * this.cols);
  }

  /** Push one column of (price,size) cells; scrolls the buffer left. */
  push(cells: HeatCell[], refPrice: number) {
    // shift columns left
    this.buf.copyWithin(0, this.rows, this.rows * this.cols);
    const lastCol = this.cols - 1;
    const span = refPrice * 0.01; // ±0.5% window
    this.minP = refPrice - span;
    this.maxP = refPrice + span;
    for (let r = 0; r < this.rows; r++) {
      const price = this.minP + ((this.rows - 1 - r) / (this.rows - 1)) * span * 2;
      let total = 0;
      for (const c of cells) {
        if (Math.abs(c.price - price) <= (this.maxP - this.minP) / this.rows) total += c.size;
      }
      this.buf[r * this.cols + lastCol] = Math.min(1, total / 200);
    }
    this.draw();
  }

  private draw() {
    const img = this.ctx.createImageData(this.cols, this.rows);
    let maxV = 1e-6;
    for (let i = 0; i < this.buf.length; i++) if (this.buf[i] > maxV) maxV = this.buf[i];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const v = this.buf[r * this.cols + c] / maxV;
        const [R, G, B] = ramp(v);
        const idx = (r * this.cols + c) * 4;
        img.data[idx] = R;
        img.data[idx + 1] = G;
        img.data[idx + 2] = B;
        img.data[idx + 3] = 255;
      }
    }
    this.ctx.putImageData(img, 0, 0);
  }
}

function ramp(v: number): [number, number, number] {
  // viridis-ish ramp: dark -> blue -> green -> yellow
  v = Math.max(0, Math.min(1, v));
  if (v < 0.25) return lerp([13, 8, 60], [59, 76, 197], v / 0.25);
  if (v < 0.5) return lerp([59, 76, 197], [33, 144, 141], (v - 0.25) / 0.25);
  if (v < 0.75) return lerp([33, 144, 141], [94, 201, 98], (v - 0.5) / 0.25);
  return lerp([94, 201, 98], [253, 231, 37], (v - 0.75) / 0.25);
}
function lerp(a: number[], b: number[], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t] as [number, number, number];
}

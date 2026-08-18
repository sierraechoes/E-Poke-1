/**
 * ui/gl/Surface3DShader.ts
 *
 * 3D volatility/pricing surface renderer. Plots the engine-computed grid
 * (strikes × maturities) as a rotating wireframe+facet surface on a 2D canvas
 * with a simple isometric projection. In the native build this is a WebGL
 * vertex+fragment shader; the projection math here mirrors that pipeline.
 */
export class Surface3DRenderer {
  private ctx: CanvasRenderingContext2D;
  private yaw = 0.6;

  constructor(private canvas: HTMLCanvasElement) {
    const c = canvas.getContext("2d");
    if (!c) throw new Error("no 2d context");
    this.ctx = c;
  }

  rotate(d: number) {
    this.yaw += d;
  }

  /** Render a surface grid[x][y] with axis ranges xLabels, yLabels. */
  render(grid: number[][], xLabels: number[], yLabels: number[], valueLabel = "Premium") {
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;
    ctx.fillStyle = "#05070a";
    ctx.fillRect(0, 0, W, H);
    if (grid.length === 0 || grid[0].length === 0) return;

    const ny = grid.length;
    const nx = grid[0].length;
    let zMin = Infinity;
    let zMax = -Infinity;
    for (let i = 0; i < ny; i++) for (let j = 0; j < nx; j++) {
      zMin = Math.min(zMin, grid[i][j]);
      zMax = Math.max(zMax, grid[i][j]);
    }
    const zRange = zMax - zMin || 1;
    const cx = W / 2;
    const cy = H / 2 + 60;
    const sx = (W * 0.32) / Math.max(1, nx - 1);
    const sy = (H * 0.22) / Math.max(1, ny - 1);
    const sz = H * 0.28;
    const yaw = this.yaw;

    const project = (j: number, i: number, z: number) => {
      // isometric-ish rotation around vertical axis
      const x = (j - (nx - 1) / 2) * sx;
      const y = (i - (ny - 1) / 2) * sy;
      const xr = x * Math.cos(yaw) - y * Math.sin(yaw);
      const yr = x * Math.sin(yaw) + y * Math.cos(yaw);
      const px = cx + xr;
      const py = cy + yr * 0.5 - ((z - zMin) / zRange) * sz;
      return [px, py] as const;
    };

    // facets, back-to-front (painter's algorithm by i+j)
    const facets: { i: number; j: number; depth: number }[] = [];
    for (let i = 0; i < ny - 1; i++)
      for (let j = 0; j < nx - 1; j++)
        facets.push({ i, j, depth: (i + j) * Math.sin(yaw) - (i - j) * Math.cos(yaw) });
    facets.sort((a, b) => a.depth - b.depth);

    for (const f of facets) {
      const { i, j } = f;
      const z00 = grid[i][j];
      const z10 = grid[i][j + 1];
      const z11 = grid[i + 1][j + 1];
      const z01 = grid[i + 1][j];
      const zavg = (z00 + z10 + z11 + z01) / 4;
      const [p00] = project(j, i, z00);
      const [p10] = project(j + 1, i, z10);
      const a = project(j, i, z00);
      const b = project(j + 1, i, z10);
      const c = project(j + 1, i + 1, z11);
      const d = project(j, i + 1, z01);
      ctx.beginPath();
      ctx.moveTo(a[1], a[1]); // placeholder, overwritten below
      ctx.moveTo(b[0] * 0 + a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.lineTo(c[0], c[1]);
      ctx.lineTo(d[0], d[1]);
      ctx.closePath();
      const t = (zavg - zMin) / zRange;
      ctx.fillStyle = facetColor(t);
      ctx.fill();
      ctx.strokeStyle = "rgba(5,7,10,0.5)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
      void p00; void p10;
    }

    // axes labels
    ctx.fillStyle = "#6b7785";
    ctx.font = "10px monospace";
    ctx.fillText(`${valueLabel}  [${zMin.toFixed(2)} .. ${zMax.toFixed(2)}]`, 8, 14);
    ctx.fillText(`strikes ${xLabels[0].toFixed(1)}..${xLabels[xLabels.length - 1].toFixed(1)}  x  maturity ${yLabels[0].toFixed(2)}y..${yLabels[yLabels.length - 1].toFixed(2)}y`, 8, H - 8);
  }
}

function facetColor(t: number): string {
  t = Math.max(0, Math.min(1, t));
  const r = Math.round(20 + 60 * t);
  const g = Math.round(80 + 140 * t);
  const b = Math.round(200 - 80 * t);
  return `rgb(${r},${g},${b})`;
}

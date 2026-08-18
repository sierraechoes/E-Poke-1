import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// AFTIS desktop frontend. In a full Tauri toolchain environment this is served by
// `tauri dev` (devUrl http://localhost:5173) and bundled into the .msi/.exe. In
// this sandbox it runs standalone as the live preview.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@engine": fileURLToPath(new URL("./engine", import.meta.url)),
      "@ui": fileURLToPath(new URL("./ui", import.meta.url)),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    // Allow the platform's proxied preview hosts (*.e2b.app) to load the app.
    allowedHosts: [".e2b.app", ".localhost", "localhost"],
    hmr: { clientPort: 5173 },
  },
  build: {
    target: "esnext",
    outDir: "dist",
    sourcemap: true,
  },
});

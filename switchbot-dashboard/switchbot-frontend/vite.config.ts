import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Backend (FastAPI) serves the built SPA from the same origin, so the app uses
// relative "/api" URLs. During local development the Vite dev server proxies
// those requests to the backend running on port 8000.
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
  },
});

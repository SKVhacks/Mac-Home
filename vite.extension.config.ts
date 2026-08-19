import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Builds the standalone Chrome extension new-tab page into extension/dist.
export default defineConfig({
  root: path.resolve(import.meta.dirname, "extension"),
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "extension/dist"),
    emptyOutDir: true,
    rollupOptions: { input: path.resolve(import.meta.dirname, "extension/newtab.html") },
  },
});

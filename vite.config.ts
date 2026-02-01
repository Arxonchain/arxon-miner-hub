import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Prevent duplicate React copies which can break hooks at runtime.
    dedupe: ["react", "react-dom"],
  },

  // ────────────────────────────────────────────────
  // This block was added to silence the large chunk warning in Vercel build logs
  build: {
    chunkSizeWarningLimit: 2000,  // 2000 KB = 2 MB limit (you can increase if needed)
  },
  // ────────────────────────────────────────────────
}));
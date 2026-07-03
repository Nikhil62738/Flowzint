import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          charts: ["recharts"],
          pdf: ["jspdf", "@react-pdf/renderer"],
          motion: ["framer-motion"]
        }
      }
    }
  },
  server: {
    port: 3000
  },
  preview: {
    port: 3000
  }
});

import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  envPrefix: ["VITE_", "SUPABASE_", "NEXT_PUBLIC_"],
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@supabase")) return "supabase";
            if (id.includes("@sentry")) return "sentry";
            if (id.includes("leaflet") || id.includes("react-leaflet") || id.includes("leaflet.markercluster")) return "leaflet";
            if (id.includes("react-hook-form") || id.includes("zod") || id.includes("@hookform")) return "forms";
            if (id.includes("recharts") || id.includes("d3")) return "charts";
          }
        },
      },
    },
  },
})

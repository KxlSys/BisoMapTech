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
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js"],
          sentry: ["@sentry/react"],
          forms: ["react-hook-form", "@hookform/resolvers", "zod"],
          ui: ["radix-ui", "class-variance-authority", "clsx", "tailwind-merge"],
          leaflet: ["leaflet", "react-leaflet"],
        },
      },
    },
  },
})

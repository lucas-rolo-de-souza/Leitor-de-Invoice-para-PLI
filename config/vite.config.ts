import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  // API Key loading logic removed for Security (BYOK model)
  // The client now manages keys via SettingsContext

  return {
    base: "/pli/",
    server: {
      port: 3000,
      host: "0.0.0.0",
      allowedHosts: [
        "comex-suit-app-hub.duckdns.org",
        "localhost",
        "192.168.70.195",
      ],
      proxy: {
        "/api/bcb": {
          target: "https://olinda.bcb.gov.br",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/bcb/, ""),
          secure: false,
        },
        "/api": {
          target: "http://localhost:8000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    css: {
      postcss: "./config/postcss.config.js",
    },
    plugins: [react()],
    define: {
      // "process.env.API_KEY": JSON.stringify(apiKey), // REMOVED FOR SECURITY (BYOK)
      // "process.env.GEMINI_API_KEY": JSON.stringify(apiKey), // REMOVED FOR SECURITY (BYOK)
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "../src"),
      },
    },
  };
});

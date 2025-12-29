import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  // Try to load API key from apikey.json
  let apiKey = env.GEMINI_API_KEY;
  try {
    const apiKeyPath = path.resolve(__dirname, "apikey.json");
    if (fs.existsSync(apiKeyPath)) {
      const keyData = JSON.parse(fs.readFileSync(apiKeyPath, "utf-8"));
      if (keyData.apiKey) {
        apiKey = keyData.apiKey;
        console.log("Loaded API Key from apikey.json");
      }
    }
  } catch (error) {
    console.warn("Could not load apikey.json:", error);
  }

  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [react()],
    define: {
      "process.env.API_KEY": JSON.stringify(apiKey),
      "process.env.GEMINI_API_KEY": JSON.stringify(apiKey),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

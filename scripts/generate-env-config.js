const fs = require("node:fs");
const path = require("node:path");

const PUBLIC_DIR = path.join(__dirname, "../public");
const OUTPUT_FILE = path.join(PUBLIC_DIR, "env-config.js");

// 1. Find NCM File
console.log("Scanning for NCM files in public directory...");
try {
  const files = fs.readdirSync(PUBLIC_DIR);
  // Match Tabela_NCM_Vigente_*.json
  const ncmFiles = files.filter((f) =>
    f.match(/^Tabela_NCM_Vigente_.*\.json$/),
  );

  // Sort descending to find "latest" (by name/date)
  ncmFiles.sort().reverse();

  const latestNcm = ncmFiles.length > 0 ? ncmFiles[0] : "ncm.json"; // Fallback
  console.log(`Found NCM file: ${latestNcm}`);

  // 2. Read .env for local dev vars if needed (optional, but good for parity)
  // For now, we just mock the structure needed for NCM.
  // In a real setup, we might parse .env here too.

  const envConfig = {
    NCM_FILENAME: latestNcm,
    // Add other vars here if we want to parity env.sh completely for dev
  };

  if (process.env.VITE_SUPABASE_URL) {
    envConfig.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  }
  if (process.env.VITE_SUPABASE_ANON_KEY) {
    envConfig.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  }

  // 3. Write env-config.js
  const content = `window._env_ = ${JSON.stringify(envConfig, null, 2)};`;
  fs.writeFileSync(OUTPUT_FILE, content);
  console.log(`Generated ${OUTPUT_FILE}`);
} catch (err) {
  console.error("Error generating env-config.js:", err);
  process.exit(1);
}

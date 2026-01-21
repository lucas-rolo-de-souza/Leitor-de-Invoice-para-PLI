import fs from "fs";
import path from "path";
import https from "https";
import AdmZip from "adm-zip";
import { parse } from "csv-parse/sync";
import { ISO_3166_COUNTRIES as ISO_3166 } from "../src/utils/iso-3166";

// Sources
const UNECE_ZIP_URL = "https://service.unece.org/trade/locode/loc241csv.zip"; // Official UN/LOCODE 2024-1
const AIRPORTS_CSV_URL =
  "https://davidmegginson.github.io/ourairports-data/airports.csv";

const OUTPUT_FILE = path.resolve(__dirname, "../public/data/locations.json");
const TEMP_DIR = path.resolve(__dirname, "temp_data");

// Ensure temp dir exists
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

// Types
interface LogisticsLocation {
  code: string;
  name: string;
  city?: string;
  type: "port" | "airport" | "other";
  country: string; // ISO Alpha-3
}

// Helper to fetch URL content (Buffer for Zip, String for CSV)
const fetchBuffer = (url: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    console.log(`Fetching ${url}...`);
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          if (res.statusCode === 301 || res.statusCode === 302) {
            if (res.headers.location) {
              fetchBuffer(res.headers.location).then(resolve).catch(reject);
              return;
            }
          }
          reject(new Error(`Failed to fetch ${url}: Status ${res.statusCode}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", (err) => reject(err));
      })
      .on("error", (err) => reject(err));
  });
};

const fetchString = (url: string): Promise<string> => {
  return fetchBuffer(url).then((buf) => buf.toString());
};

const processPorts = async (): Promise<LogisticsLocation[]> => {
  try {
    const zipBuffer = await fetchBuffer(UNECE_ZIP_URL);
    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();

    // UNECE csv files usually named like '2024-1 CodeListPart1.csv' or just 'CodeListPart1.csv'
    // We look for files containing "CodeListPart" and ending in ".csv"
    const csvEntries = zipEntries.filter(
      (entry) =>
        entry.entryName.toLowerCase().includes("codelistpart") &&
        entry.entryName.toLowerCase().endsWith(".csv"),
    );

    const locations: LogisticsLocation[] = [];

    console.log(`Found ${csvEntries.length} CSV parts in Zip.`);

    for (const entry of csvEntries) {
      console.log(`Processing ${entry.entryName}...`);
      const csvContent = entry.getData().toString("latin1"); // UNECE often uses Latin1 or UTF-8. Let's try Latin1 first as safe bet for old systems, or UTF8 checking. Actually node-csv handles encoding usually?
      // Let's assume UTF-8 but if weird chars appear, check encoding.
      // Note: entry.getData().toString() defaults to utf8.

      // Remove Byte Order Mark if present
      const cleanContent = csvContent.replace(/^\uFEFF/, "");

      const records = parse(cleanContent, {
        columns: false, // UNECE mostly doesn't have headers in the raw CSVs? Or does it?
        // Actually, recent UNECE CSVs might not have headers or might have them.
        // Let's inspect rows.
        // Use 'relax_column_count: true'
        trim: true,
        skip_empty_lines: true,
      });

      // Loop rows
      for (const row of records) {
        // Columns (approx based on standard UN/LOCODE):
        // 0: Change
        // 1: Country (Alpha-2)
        // 2: Location (3 char)
        // 3: Name
        // 4: NameWoDiacritics
        // 5: SubDiv
        // 6: Function (1--45---)
        // ...

        // Detect Header line: "Ch" "Country" ...
        if (row[1] === "Country" && row[2] === "Location") continue;

        const countryCode2 = row[1];
        const locationCode = row[2];
        const name = row[3]; // or row[4] for no diacritics
        const nameWoDiacritics = row[4];
        const functionCode = row[6];
        const subDiv = row[5];

        if (!countryCode2 || !locationCode || !functionCode) continue;

        // Filter for PORT (Function '1')
        // Function column is like "1--45---" or "1-------"
        if (!functionCode.includes("1")) continue;

        // Construct valid ISO Alpha-3
        const iso = ISO_3166.find((c) => c.alpha2 === countryCode2);
        const countryAlpha3 = iso ? iso.alpha3 : "UNK";

        const fullCode = `${countryCode2} ${locationCode}`;

        locations.push({
          code: fullCode,
          name: nameWoDiacritics || name,
          city: subDiv, // This is technically state/province code, but often useful. Or just leave undefined if we want City Name (which is Name).
          // Actually `Name` is usually the City/Port name in UN/LOCODE.
          type: "port",
          country: countryAlpha3,
        });
      }
    }

    console.log(`Parsed ${locations.length} ports from UNECE.`);
    return locations;
  } catch (err) {
    console.error("Error processing ports:", err);
    return [];
  }
};

interface AirportRow {
  type: string;
  name: string;
  iata_code: string;
  iso_country: string;
  municipality: string;
}

const processAirports = async (): Promise<LogisticsLocation[]> => {
  try {
    const csvData = await fetchString(AIRPORTS_CSV_URL);
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
    }) as AirportRow[];

    const locations: LogisticsLocation[] = [];
    for (const row of records) {
      if (row.type === "closed") continue;
      if (row.type !== "large_airport" && row.type !== "medium_airport")
        continue;

      const iata = row.iata_code;
      if (!iata || iata === "") continue;

      const iso = ISO_3166.find((c) => c.alpha2 === row.iso_country);
      const countryAlpha3 = iso ? iso.alpha3 : "UNK";

      locations.push({
        code: iata,
        name: row.name,
        city: row.municipality,
        type: "airport",
        country: countryAlpha3,
      });
    }
    console.log(`Parsed ${locations.length} airports.`);
    return locations;
  } catch (err) {
    console.error("Error processing airports:", err);
    return [];
  }
};

const main = async () => {
  console.log(
    "Starting Logistics Data Update (Official UNECE + OurAirports)...",
  );

  // Clear temp
  // ...

  const [ports, airports] = await Promise.all([
    processPorts(),
    processAirports(),
  ]);

  const allLocations = [...ports, ...airports];

  // Sort by name for easier usage? Or leave as is.
  // Deduplicate?
  // Some airports might be in UN/LOCODE as ports too.
  // E.g. "US NYC" (New York) is a Port. "JFK" is an Airport.
  // They have different codes. It's fine to keep both.

  if (allLocations.length === 0) {
    console.error("No locations found! Check sources.");
    process.exit(1);
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allLocations)); // Save compact or formatted?
  console.log(`Saved ${allLocations.length} locations to ${OUTPUT_FILE}`);

  // Cleanup temp? (Using buffer so no temp files strictly needed except zip extraction if stream)
  // We used Buffer for Zip, so no temp files on disk.
};

main();

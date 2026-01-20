import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { InvoiceSchema } from "../domain/schemas";
import { InvoiceData, FilePart, initialInvoiceData } from "../types";
import { logger } from "./loggerService";
import { usageService } from "./usageService";

/**
 * Robust JSON parser designed to handle LLM output "hallucinations" and formatting errors.
 *
 * Strategy:
 * 1. **Strip Markdown**: Removes ```json fences.
 * 2. **Aggressive Trimming**: Finds the first '{' or '[' and last '}' or ']'.
 * 3. **Token Balancing**: If parsing fails, it counts braces and strings to reconstruct
 *    valid JSON structure (e.g., closing missing braces).
 * 4. **Truncation Fallback**: If balancing fails, it aggressively cuts back to the
 *    last known valid closing position to salvage partial data.
 */
const safeJsonParse = (text: string): unknown => {
  // 1. Strip Markdown Code Blocks & aggressively find JSON start/end
  let clean = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*$/g, "")
    .trim();

  // If text starts with non-JSON character, try to find the first '[' or '{'
  const firstBracket = clean.search(/[{[]/);
  if (firstBracket > 0) {
    clean = clean.substring(firstBracket);
  }

  // Find the last closing bracket
  const lastBracket = Math.max(clean.lastIndexOf("}"), clean.lastIndexOf("]"));
  if (lastBracket > -1 && lastBracket < clean.length - 1) {
    clean = clean.substring(0, lastBracket + 1);
  }

  clean = clean.trim();

  // 2. Try Standard Parse
  try {
    return JSON.parse(clean);
  } catch (e) {
    logger.warn("JSON Parse failed, attempting aggressive repair...", {
      error: e,
    });
  }

  // 3. State-Machine Token Balancer
  // This reconstructs the JSON by tracking open brackets and strings
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
    } else if (!inString) {
      if (char === "{") {
        stack.push("}");
      } else if (char === "[") {
        stack.push("]");
      } else if (char === "}" || char === "]") {
        // If we hit a closing bracket that matches the top of stack, pop it
        if (stack.length > 0 && stack[stack.length - 1] === char) {
          stack.pop();
        }
      }
    }
  }

  let repaired = clean;

  // Close open string
  if (inString) {
    repaired += '"';
  }

  // Handle trailing comma or colon (incomplete property)
  // We trim whitespace from end to check the last meaningful character
  repaired = repaired.trimEnd();

  if (repaired.endsWith(",")) {
    repaired = repaired.slice(0, -1);
  } else if (repaired.endsWith(":")) {
    repaired += "null"; // Complete the property with null
  }

  // Close remaining brackets in reverse order
  while (stack.length > 0) {
    repaired += stack.pop();
  }

  // Try parsing the repaired string
  try {
    const res = JSON.parse(repaired);
    logger.info("JSON repaired successfully via Token Balancer.");
    return res;
  } catch (e) {
    logger.warn("Token Balancer failed, attempting Truncation Fallback...", {
      error: e,
    });
  }

  // 4. Truncation Fallback
  // If balancing failed (e.g. truncated keyword like "fal" instead of "false"),
  // we cut back to the last known valid closing bracket (} or ]) and try to close from there.
  // This effectively discards the incomplete last item/property.

  const candidates: string[] = [];
  // Scan backwards for potential cut points
  for (let i = clean.length - 1; i >= 0; i--) {
    const char = clean[i];
    if (char === "}" || char === "]") {
      candidates.push(clean.substring(0, i + 1));
      if (candidates.length >= 5) break; // Try last 5 closing points
    }
  }

  const closers = ["", "}", "]", "]}", "}}", "]}}"];

  for (const candidate of candidates) {
    for (const closer of closers) {
      try {
        const attempt = candidate + closer;
        const res = JSON.parse(attempt);
        logger.info(
          `JSON repaired via Truncation at index ${candidate.length} with closer '${closer}'.`,
        );
        return res;
      } catch {
        // Ignore parse errors, try next closer
      }
    }
  }

  // Final failure
  throw new Error(`JSON Repair Failed. Length: ${clean.length}.`);
};

/**
 * New System Prompt - Customized for Customs Broker (Despachante Aduaneiro) Workflow.
 */

// --- Retry Logic Helpers ---

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry<T>(
  operation: () => Promise<T>,
  onProgress?: (msg: string) => void,
  attempt = 1,
  maxRetries = 5,
): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    // Check for 429 (Rate Limit) or 503 (Overloaded)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status = (error as any)?.status;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = (error as any)?.message || "";

    const isRateLimit =
      status === 429 ||
      msg.includes("429") ||
      msg.includes("RESOURCE_EXHAUSTED");

    const isOverloaded =
      status === 503 ||
      msg.includes("503") ||
      msg.includes("overloaded") ||
      msg.includes("UNAVAILABLE");

    if ((isRateLimit || isOverloaded) && attempt <= maxRetries) {
      // Exponential backoff: 2s, 4s, 8s, 16s, 32s...
      let delay = 2000 * Math.pow(2, attempt - 1);

      // Simple regex to find "retry in X.XXs" or similar if provided by API message
      const match = msg.match(/retry in\s+(\d+(\.\d+)?)s/i);
      if (match) {
        delay = parseFloat(match[1]) * 1000;
      }

      const waitSeconds = Math.ceil(delay / 1000);
      const reason = isOverloaded
        ? "Servidor ocupado (503)"
        : "Limite de cota (429)";

      const logMsg = `${reason}. Retrying in ${delay}ms`;
      logger.warn(logMsg, {
        attempt,
        maxRetries,
        error: msg,
      });

      // Log to Tracer
      extractionTracer.logEvent(
        "API_CONNECT",
        `⚠️ Retry ${attempt}/${maxRetries}: ${reason}`,
        { error: msg, delayMs: delay },
      );

      // Countdown Loop for better UI feedback
      for (let i = waitSeconds; i > 0; i--) {
        onProgress?.(
          `⚠️ ${reason}. Aguardando ${i}s para tentar novamente (Tentativa ${attempt}/${maxRetries})...`,
        );
        await sleep(1000);
      }

      return withRetry(operation, onProgress, attempt + 1, maxRetries);
    }

    // Log non-retriable or final failure
    extractionTracer.logEvent(
      "ERROR",
      "API Request Failed (Final/Non-Retriable)",
      { error: msg, status },
    );
    throw error;
  }
}

/**
 * Orchestrates the AI Extraction Workflow using the "Flash-Chunking" strategy.
 *
 * Process:
 * 1. **Parallel Execution**: Dispatches two concurrent prompts:
 *    - `metadataPrompt`: Extracts Header, Entities, Logistics (Fast, structured).
 *    - `lineItemsPrompt`: Extracts Table Data in a Minified JSON Array format (High volume).
 * 2. **Rate Limiting**: Implements a buffer sleep to respect Gemini's Requests Per Second (RPS) limits.
 * 3. **Merging**: Combines the Metadata object with the parsed Line Items array.
 * 4. **Post-Processing**: Normalizes numbers, weights, and dates.
 *
 * @param fileParts - Array of base64 file data.
 * @param onProgress - Callback for UI updates.
 * @param modelId - The Gemini model version to use.
 */
import { extractionTracer } from "./extractionTracer";

/**
 * Orchestrates the AI Extraction Workflow using the "Flash-Chunking" strategy.
 *
 * Process:
 * 1. **Parallel Execution**: Dispatches two concurrent prompts:
 *    - `metadataPrompt`: Extracts Header, Entities, Logistics (Fast, structured).
 *    - `lineItemsPrompt`: Extracts Table Data in a Minified JSON Array format (High volume).
 * 2. **Rate Limiting**: Implements a buffer sleep to respect Gemini's Requests Per Second (RPS) limits.
 * 3. **Merging**: Combines the Metadata object with the parsed Line Items array.
 * 4. **Post-Processing**: Normalizes numbers, weights, and dates.
 *
 * @param fileParts - Array of base64 file data.
 * @param onProgress - Callback for UI updates.
 * @param modelId - The Gemini model version to use.
 */
export async function extractInvoiceData(
  fileParts: FilePart[],
  apiKey: string,
  onProgress?: (msg: string) => void,
  modelId: string = "gemini-2.5-flash",
): Promise<InvoiceData> {
  // Start Tracing
  const totalSize = fileParts.reduce((acc, part) => acc + part.data.length, 0); // Approx size (base64 is larger than binary)
  extractionTracer.start(fileParts.length, totalSize);

  try {
    // 1. Prepare Prompts
    extractionTracer.logEvent(
      "PRE_PROCESSING",
      "Preparing prompts and payloads...",
    );
    const metadataPrompt = getMetadataPrompt();
    const lineItemsPrompt = getLineItemsPrompt();

    // Initialize AI Client
    const ai = new GoogleGenAI({ apiKey });

    // Helper for generation with Retry Logic
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generate = async (prompt: string, taskName: string, schema?: any) => {
      // Configuration for Gemini 2.5 (New SDK Style)
      const config = {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0,
      };

      // Map FileParts to SDK InlineData format
      const mediaParts = fileParts.map((part) => ({
        inlineData: { mimeType: part.mimeType, data: part.data },
      }));

      // Inner execution function
      const execute = async () => {
        const start = Date.now();
        extractionTracer.logEvent(
          "API_CONNECT",
          `Sending ${taskName} request to Gemini (${modelId})...`,
        );

        const result = await ai.models.generateContent({
          model: modelId,
          contents: [
            {
              role: "user",
              parts: [
                ...mediaParts,
                {
                  text: `[SYSTEM: ATTACHED FILES CONTEXT]\n${fileParts
                    .map((f, i) => `${i + 1}. ${f.filename || "Unknown File"}`)
                    .join("\n")}\n\n${prompt}`,
                },
              ],
            },
          ],
          config: config,
        });

        const duration = Date.now() - start;
        const inputTokens = result.usageMetadata?.promptTokenCount || 0;
        const outputTokens = result.usageMetadata?.candidatesTokenCount || 0;

        extractionTracer.logEvent(
          taskName === "Metadata" ? "METADATA_RESPONSE" : "LINE_ITEMS_RESPONSE",
          `Received ${taskName} response`,
          { textSnippet: result.text?.substring(0, 200) + "..." }, // Log snippet
          {
            latency: duration,
            tokens: {
              input: inputTokens,
              output: outputTokens,
              total: inputTokens + outputTokens,
            },
          },
        );

        return result;
      };

      return withRetry(execute, onProgress);
    };

    const startTime = Date.now();

    // Task A: Metadata
    onProgress?.(
      `🚀 Solicitando extração de Cabeçalho e Metadados (${modelId})...`,
    );
    extractionTracer.logEvent(
      "METADATA_REQUEST",
      "Starting Metadata Extraction Loop",
    );

    let metadataResult;
    try {
      metadataResult = await generate(metadataPrompt, "Metadata");
    } catch (e) {
      console.error("Metadata extraction failed", e);
      extractionTracer.fail("Metadata extraction failed", e);
      throw e;
    }

    // Rate Limit Buffer
    extractionTracer.logEvent(
      "API_CONNECT",
      "Rate limit buffer: Pausing for 3s...",
    );
    await sleep(3000);

    // Task B: Line Items
    onProgress?.(`📦 Extraindo e analisando Linhas de Itens (${modelId})...`);
    extractionTracer.logEvent(
      "LINE_ITEMS_REQUEST",
      "Starting Line Items Extraction Loop",
    );

    let lineItemsResult;
    try {
      lineItemsResult = await generate(lineItemsPrompt, "LineItems");
    } catch (e) {
      console.error("Line items extraction failed", e);
      extractionTracer.fail("Line items extraction failed", e);
      throw e;
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // 3. Log Usage (Accurate - derived from API Usage Metadata)
    const totalInputTokens =
      (metadataResult.usageMetadata?.promptTokenCount || 0) +
      (lineItemsResult.usageMetadata?.promptTokenCount || 0);
    const totalOutputTokens =
      (metadataResult.usageMetadata?.candidatesTokenCount || 0) +
      (lineItemsResult.usageMetadata?.candidatesTokenCount || 0);

    usageService.logTransaction(
      modelId,
      totalInputTokens,
      totalOutputTokens,
      duration,
    );

    // 4. Parse & Merge
    onProgress?.("🔧 Processando, limpando e unificando dados...");
    extractionTracer.logEvent("PARSING", "Parsing and unifying data...");

    const metadata = safeJsonParse(metadataResult.text || "{}");

    // Parse Minified Line Items
    const rawItemsData = safeJsonParse(lineItemsResult.text || "[]");
    let lineItemsObj: unknown[] = [];

    // Check if we received the expected Array-of-Arrays format
    if (Array.isArray(rawItemsData)) {
      // Check if it's the new Minified format (Array of Arrays)
      if (rawItemsData.length > 0 && Array.isArray(rawItemsData[0])) {
        // Map Minified Arrays back to Objects
        // Column Order: [Description, PartNumber, Quantity, UnitMeasure, UnitPrice, Total, NetWeight]
        lineItemsObj = rawItemsData.map((row: unknown[]) => {
          // Safety check for row length (fallback if AI hallucinates cols)
          return {
            description: row[0]?.toString() || "Item Desconhecido",
            partNumber: typeof row[1] === "string" ? row[1] : null,
            quantity:
              typeof row[2] === "number"
                ? row[2]
                : parseFloat(String(row[2])) || 0,
            unitMeasure: typeof row[3] === "string" ? row[3] : "UN",
            unitPrice:
              typeof row[4] === "number"
                ? row[4]
                : parseFloat(String(row[4])) || 0,
            total:
              typeof row[5] === "number"
                ? row[5]
                : parseFloat(String(row[5])) || 0,
            netWeight:
              typeof row[6] === "number"
                ? row[6]
                : parseFloat(String(row[6])) || 0,
            // Default fields
            productCode: null,
            ncm: row[8]?.toString() || null, // Capture NCM from column 8
            taxClassificationDetail: null,
            unitNetWeight: 0, // Calculated later
            manufacturerCode: null,
            manufacturerRef: typeof row[7] === "string" ? row[7] : null,
          };
        });
        logger.info(
          `Parsed ${lineItemsObj.length} items from Minified Array format.`,
        );
      } else {
        // Fallback: It might be the old object format (if model ignored instructions, rare but possible)
        // OR it handles the wrapper object case { "lineItems": [...] }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!Array.isArray(rawItemsData) && (rawItemsData as any).lineItems) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          lineItemsObj = (rawItemsData as any).lineItems;
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          lineItemsObj = rawItemsData as any[]; // Assume it's array of objects
        }
      }
    }

    // Merge: Metadata takes precedence for headers, ItemsData provides the list
    const combinedData: InvoiceData = {
      ...initialInvoiceData, // Defaults
      ...(metadata as object), // Overwrite with metadata
      lineItems: Array.isArray(lineItemsObj)
        ? (lineItemsObj as InvoiceData["lineItems"])
        : [],
    };

    // 5. Post-Processing (Normalization)
    // Existing logic to normalize numbers, dates, weights...
    const finalResult = postProcessInvoiceData(combinedData);

    // 6. Validation (Soft Force)
    extractionTracer.logEvent("VALIDATION", "Running schema validation...");
    const validation = InvoiceSchema.safeParse(finalResult);
    if (validation.success) {
      logger.info("✅ Zod Validation Passed: Data is strictly compliant.");
      extractionTracer.logEvent("VALIDATION", "Validation Passed");
    } else {
      logger.warn("⚠️ Zod Validation Failed: Data structure has mismatches.", {
        errors: validation.error.format(),
      });
      extractionTracer.logEvent(
        "VALIDATION",
        "Validation Warnings (Soft Fail)",
        {
          errors: validation.error.format(),
        },
      );
      // We do NOT throw here yet, to avoid breaking the UI for minor mismatches.
    }

    extractionTracer.complete();
    return finalResult;
  } catch (error) {
    // Catch-all to ensure trace fails
    if (error instanceof Error) {
      extractionTracer.fail(error.message, error);
    } else {
      extractionTracer.fail("Unknown error occurred");
    }
    throw error;
  }
}

// --- Prompt Generators (Split) ---

function getMetadataPrompt(): string {
  // Create a subset schema effectively by picking fields from InvoiceSchema
  // Note: For simplicity in this step, we use the FULL InvoiceSchema but instruct the AI to ignore lineItems.
  // In a stricter implementation, we would define a specific MetadataSchema.

  // Use Zod 4 native JSON Schema generation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jsonSchema = (z as any).toJSONSchema(InvoiceSchema);

  // We manually override the description for lineItems in the prompt text or rely on the schema
  // But strictly speaking, the prompt text instructions take precedence for "what" to extract.

  return `
  You are an expert Customs Data Analyst (Despachante Aduaneiro) AI.
  
  YOUR TASK: Extract the global metadata from the provided Commercial Invoice.
  
  SCOPE:
  - **Header**: Invoice Number, Issue Date, Purchase Order (PO) references, and total page count.
  - **Entities**: Comprehensive details for Exporter (Seller), Importer (Buyer), Consignee, and Manufacturer. Include full legal names, physical addresses, and Tax Identification Numbers (VAT, CNPJ, EIN, etc.).
  - **Geographic Context**:
    - **Country of Origin**: The nation where the goods were produced/manufactured. Use ISO 3166-1 alpha-3 codes.
    - **Country of Acquisition**: The nation where the seller is legally established. Use ISO 3166-1 alpha-3 codes.
    - **Country of Provenance**: The nation from which the goods were physically dispatched. Use ISO 3166-1 alpha-3 codes.
  - **Logistics & Ports**:
    - **Port of Loading**: The specific point where goods are loaded for export, can be an Airport or Port.
    - **Port of Discharge**: The final destination point where goods are unloaded, can be an Airport or Port.
    - **Transshipment**: Any intermediate locations or hubs where cargo is transferred, can be an Airport or Port.
    - **Incoterm**: The 3-letter commercial term and its associated named place from the latest version of the Incoterm rules.
    - **Weights**: Total Net Weight, Total Gross Weight.
    - **Volumes**: Total Package count, can be nested and/or multiple.
    - **Volume Type**: The type of volume measurement used (e.g., cubic meters, cubic feet, pallets, boxes, etc.).
    - **Volume Dimensions**: The dimensions of the volume (e.g., length, width, height).
  - **Financials**: Currency (ISO code), Total Invoice Value, Payment Terms, and a breakdown of non-item costs (Freight, Insurance, Packing, and Miscellaneous Charges).

  EXCLUSION:
  - **DO NOT EXTRACT LINE ITEMS.** The "lineItems" array must be empty []. This is handled by a separate process.

  FIELD GUIDELINES:
  You are a specialized Invoice Data Extractor.
  OBJECTIVE: Extract ONLY the Header, Entities, Logistics, and Financials.
  
  CRITICAL INSTRUCTION: **IGNORE THE LINE ITEMS TABLE.** Do not extract the list of products. Return "lineItems": [] in your JSON.

  [PACKING LIST INSTRUCTION]
  If a "Packing List" or "Lista de Empaque" is attached:
  1. PRIORITIZE it for extracting **Total Net Weight**, **Total Gross Weight**, **Total Volumes** (Count), and **Volume Type**.
  2. Packing Lists are often the source of truth for logistics data. use them!
  
  OUTPUT SCHEMA (JSON ONLY):
  ${JSON.stringify(jsonSchema, null, 2)}
  `;
}

function getLineItemsPrompt(): string {
  return `
  You are a specialized Invoice Data Extractor.
  OBJECTIVE: Extract the LINE ITEMS table using a MINIFIED JSON ARRAY format to save tokens.
  
  CRITICAL INSTRUCTION: Return a SINGLE JSON Array of Arrays (Matrix).
  Each inner array represents ONE row from the table.
  
  [COLUMN ORDER - STRICTLY FOLLOW THIS INDEX]:
  0. **Description**: (String) Full description of goods.
  1. **Buyer Part Number**: (String or null) The Importer/Buyer's Item Code, Main SKU, Product ID, Product Code, Product Reference, etc.
  2. **Quantity**: (Number) Pure number.
  3. **Unit**: (String) PCS, KG, SET, etc.
  4. **Unit Price**: (Number) 
  5. **Total Value**: (Number)
  6. **Net Weight**: (Number) Total Net Weight for the line (Check Packing List if needed).
  7. **Manufacturer Part Number**: (String or null) The Manufacturer/Seller's Part Number (Referência do Fabricante).
  8. **NCM**: (String or null) The NCM (Nomenclatura Comum do Mercosul) or, if no NCM is found, the HS Code.

  [ANTI-HALLUCINATION RULE FOR NCM]:
  - ONLY extract the NCM/HS Code if it is EXPLICITLY written in the document for that specific line item.
  - DO NOT attempt to classify, guess, or search for the NCM based on the description.
  - If not explicitly found in the text, return \`null\`.
  
  [EXAMPLE OUTPUT]:
  [
    ["iPhone 15 Pro Max 256GB", "BUYER-SKU-001", 50, "PCS", 1199.00, 59950.00, 12.5, "A2894", "8517.13.00"],
    ["Samsung Galaxy S24 Ultra", "BUYER-SKU-002", 30, "PCS", 1299.00, 38970.00, 8.2, "SM-S928", null]
  ]
  
  RULES:
  1. DO NOT use keys (like "description": ...). ONLY VALUES.
  2. Use \`null\` for missing string values. Use \`0\` for missing numbers.
  3. Extract ALL rows.
  4. **PACKING LIST**: Cross-reference Packing List for Net Weights if valid.
  5. **NO MARKDOWN**: Do not use \`\`\`json or backticks. Return RAW JSON only.

  OUTPUT FORMAT: JSON Array of Arrays ONLY.
  `;
}

/**
 * Shared Post-Processing to normalize data types and calculated fields.
 * Refactored from the original extractInvoiceData logic.
 */
function postProcessInvoiceData(data: Partial<InvoiceData>): InvoiceData {
  // Ensure safe defaults
  const result: InvoiceData = { ...initialInvoiceData, ...data };

  // 1. Dates
  // ... (Existing date normalization if not already handled by JSON parse)

  // 2. Line Items Normalization
  if (result.lineItems && Array.isArray(result.lineItems)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result.lineItems = result.lineItems.map((item: any) => {
      const qty = parseFloat(item.quantity) || 0;
      let netWeight = parseFloat(item.netWeight) || 0;
      let unitNetWeight = parseFloat(item.unitNetWeight) || 0;

      // Weight Logic: Prioritize Total, derive Unit if missing
      if (netWeight > 0 && qty > 0) {
        unitNetWeight = parseFloat((netWeight / qty).toFixed(6));
      } else if (unitNetWeight > 0 && qty > 0) {
        netWeight = parseFloat((unitNetWeight * qty).toFixed(4));
      }

      return {
        ...item,
        quantity: qty,
        unitPrice: parseFloat(item.unitPrice) || 0,
        total: parseFloat(item.total) || 0,
        netWeight,
        unitNetWeight,
        weightUnit: "KG",
        // Enforce nulls just in case
        productCode: null,
        // NCM is now authorized to be populated from extraction
        taxClassificationDetail: null,
      };
    });
  }

  return result;
}

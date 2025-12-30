import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { InvoiceSchema, LineItemSchema } from "../domain/schemas";
import { InvoiceData, FilePart, initialInvoiceData } from "../types";
import { logger } from "./loggerService";
import { usageService } from "./usageService";

/**
 * Helper to recursively clean data.
 */
const cleanData = (obj: any): any => {
  if (obj === null || obj === undefined) return null;

  if (Array.isArray(obj)) {
    return obj.map((item) => cleanData(item));
  }

  if (typeof obj === "object") {
    const cleaned: any = {};
    for (const key in obj) {
      cleaned[key] = cleanData(obj[key]);
    }
    return cleaned;
  }

  if (typeof obj === "string") {
    const lower = obj.trim().toLowerCase();
    if (
      lower === "null" ||
      lower === "n/a" ||
      lower === "undefined" ||
      lower === "none" ||
      lower === "não consta"
    ) {
      return null;
    }
    return obj;
  }

  return obj;
};

/**
 * Robust JSON parser that handles Markdown fences and aggressive truncation.
 */
const safeJsonParse = (text: string): any => {
  // 1. Strip Markdown Code Blocks
  const clean = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*$/g, "")
    .trim();

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
  let stack: string[] = [];
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
          `JSON repaired via Truncation at index ${candidate.length} with closer '${closer}'.`
        );
        return res;
      } catch (ignore) {}
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
  maxRetries = 3
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // Check for 429 or Resource Exhausted
    const isRateLimit =
      error?.status === 429 ||
      error?.message?.includes("429") ||
      error?.message?.includes("RESOURCE_EXHAUSTED");

    if (isRateLimit && attempt <= maxRetries) {
      // Try to parse "retry in X seconds" from message, or use exponential backoff
      // Default backoff: 2s, 4s, 8s...
      let delay = 2000 * Math.pow(2, attempt - 1);

      // Simple regex to find "retry in X.XXs" or similar if provided by API message
      const match = error?.message?.match(/retry in\s+(\d+(\.\d+)?)s/i);
      if (match) {
        delay = parseFloat(match[1]) * 1000;
      }

      const waitSeconds = Math.ceil(delay / 1000);
      onProgress?.(
        `⚠️ Limite de cota (429). Aguardando ${waitSeconds}s para tentar novamente (Tentativa ${attempt}/${maxRetries})...`
      );

      logger.warn(`Rate Limit hit. Retrying in ${delay}ms`, {
        attempt,
        maxRetries,
      });
      await sleep(delay);

      return withRetry(operation, onProgress, attempt + 1, maxRetries);
    }
    throw error;
  }
}

/**
 * Orchestrates the Chunked Extraction Strategy.
 * 1. Parallel calls for Metadata (fast, low output) and Line Items (high output).
 * 2. Merges results into a single InvoiceData object.
 */
export async function extractInvoiceData(
  fileParts: FilePart[],
  onProgress?: (msg: string) => void,
  modelId: string = "gemini-2.5-flash-lite"
): Promise<InvoiceData> {
  // 1. Prepare Prompts
  const metadataPrompt = getMetadataPrompt();
  const lineItemsPrompt = getLineItemsPrompt();

  // Initialize AI Client
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Helper for generation with Retry Logic
  const generate = async (prompt: string, schema?: any) => {
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
      return await ai.models.generateContent({
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
    };

    return withRetry(execute, onProgress);
  };

  const startTime = Date.now();

  // Task A: Metadata
  onProgress?.("Extraindo Cabeçalho e Metadados...");
  let metadataResult;
  try {
    metadataResult = await generate(metadataPrompt);
  } catch (e) {
    console.error("Metadata extraction failed", e);
    throw e;
  }

  // Rate Limit Buffer: Sleep 1s to ensure we don't hit the 2 Requests/Second burst limit
  await sleep(1000);

  // Task B: Line Items
  onProgress?.("Extraindo Itens e Produtos...");
  let lineItemsResult;
  try {
    lineItemsResult = await generate(lineItemsPrompt);
  } catch (e) {
    console.error("Line items extraction failed", e);
    throw e;
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  // 3. Log Usage (Approximate - we sum tokens)
  // Note: usageService.logTransaction is fire-and-forget or we await it if we want strict logging
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
    duration
  );

  // 4. Parse & Merge
  onProgress?.("Processando e mesclando resultados...");

  const metadata = safeJsonParse(metadataResult.text || "{}");
  const itemsData = safeJsonParse(lineItemsResult.text || "{}");

  // Merge: Metadata takes precedence for headers, ItemsData provides the list
  const combinedData: InvoiceData = {
    ...initialInvoiceData, // Defaults
    ...metadata, // Overwrite with metadata
    lineItems: Array.isArray(itemsData.lineItems) ? itemsData.lineItems : [], // Explicitly take items
  };

  // 5. Post-Processing (Normalization)
  // Existing logic to normalize numbers, dates, weights...
  const finalResult = postProcessInvoiceData(combinedData);

  // 6. Validation (Soft Force)
  const validation = InvoiceSchema.safeParse(finalResult);
  if (validation.success) {
    logger.info("✅ Zod Validation Passed: Data is strictly compliant.");
  } else {
    logger.warn("⚠️ Zod Validation Failed: Data structure has mismatches.", {
      errors: validation.error.format(),
    });
    // We do NOT throw here yet, to avoid breaking the UI for minor mismatches.
    // In the future, we can return 'validation.data' if we want to enforce strictness.
  }

  return finalResult;
}

// --- Prompt Generators (Split) ---

function getMetadataPrompt(): string {
  // Create a subset schema effectively by picking fields from InvoiceSchema
  // Note: For simplicity in this step, we use the FULL InvoiceSchema but instruct the AI to ignore lineItems.
  // In a stricter implementation, we would define a specific MetadataSchema.

  // Use Zod 4 native JSON Schema generation
  // @ts-ignore - Assuming z.toJSONSchema is available in v4 but might miss types in some envs
  const jsonSchema = z.toJSONSchema(InvoiceSchema);

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
    - **Port of Loading**: The specific point where goods are loaded for export.
    - **Port of Discharge**: The final destination point where goods are unloaded.
    - **Transshipment**: Any intermediate locations or hubs where cargo is transferred.
    - **Incoterm**: The 3-letter commercial term and its associated named place.
    - **Weights/Volumes**: Total Net Weight, Total Gross Weight, and Total Package count.
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
  // Use Zod 4 native JSON Schema generation
  // @ts-ignore
  const lineItemJsonSchema = z.toJSONSchema(LineItemSchema);

  return `
  You are a specialized Invoice Data Extractor.
  OBJECTIVE: Extract ONLY the LINE ITEMS table from the invoice.
  
  CRITICAL INSTRUCTION: **IGNORE Headers, Footer, Entities, and Totals.** Focus PURELY on extracting the table rows.
  
  RULES:
  1. Extract ALL rows. Do not skip any.
  2. For "productCode", "ncm", and "productDetail", ALWAYS return null (Manual Input forced).
  3. "netWeight" is the TOTAL NET WEIGHT for the line.
  4. **PACKING LIST CROSS-REFERENCE**: Check attached Packing List (if any) to find the "Unit Net Weight" or "Total Net Weight" for each item if missing from the Invoice.
  
  OUTPUT SCHEMA (JSON ONLY):
  {
    "lineItems": [
       ${JSON.stringify(lineItemJsonSchema, null, 2)}
    ]
  }
  `;
}

/**
 * Shared Post-Processing to normalize data types and calculated fields.
 * Refactored from the original extractInvoiceData logic.
 */
function postProcessInvoiceData(data: any): InvoiceData {
  // Ensure safe defaults
  const result: InvoiceData = { ...initialInvoiceData, ...data };

  // 1. Dates
  // ... (Existing date normalization if not already handled by JSON parse)

  // 2. Line Items Normalization
  if (result.lineItems && Array.isArray(result.lineItems)) {
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
        // Enforce nulls just in case
        productCode: null,
        ncm: null,
        productDetail: null,
      };
    });
  }

  return result;
}

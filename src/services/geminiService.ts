import { GoogleGenAI, Type } from "@google/genai";
import { InvoiceData, FilePart } from "../types";
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
const getModelSpecificPrompt = (modelId: string): string => {
  return `
    ROLE: You are an expert Customs Broker Assistant (Assistente de Despachante Aduaneiro).
    CONTEXT: The user is a Customs Broker preparing a Brazilian Import Declaration (DI/DUIMP) using the 'PLI' industry standard.
    
    GOAL: Extract precise data from the Commercial Invoice/Packing List to perfectly match the PLI Schema, NEVER inferring missing technical details.

    OUTPUT FORMAT: JSON ONLY. Do not include markdown formatting or explanations.

    ### CRITICAL: ZERO HALLUCINATION POLICY
    1. **NO GUESSING**: If a value is not explicitly written in the document, return \`null\`.
    2. **NO CLASSIFICATION**: **NEVER** guess the NCM (HS Code) based on the description. If the NCM code is not printed on the document, you MUST return \`null\`.
    3. **NO MATH**: Do not calculate totals unless the field is explicitly asking for a sum of extracted values, but prefer extraction.

    ### CRITICAL: PART NUMBER & CODE MAPPING RULES (PLI MODEL)
    You must strictly differentiate between the Buyer's Code and the Seller's Code. DO NOT SWAP THEM.

    1.  **partNumber (Buyer/Customer Part No)**:
        *   **Definition**: The identifier used by the BUYER (Customer).
        *   **Look for**: "Customer Part No", "Buyer Part No", "Our Code", "SKU", "Item Code".
        *   *If the document only has one general 'Part Number', put it here.*

    2.  **manufacturerRef (Seller/Manufacturer Part No)**:
        *   **Definition**: The identifier used by the SELLER (Manufacturer/Vendor).
        *   **Look for**: "Seller Part No", "Vendor Part No", "Model No", "Ref", "Cat No", "Mfr Part No".

    3.  **productCode (Cod Produto)**:
        *   **Definition**: Internal product classification code.
        *   *Only fill this if there is a 3rd distinct code separate from the two above. Otherwise leave null.*

    4.  **NCM (HS Code)**:
        *   **Definition**: Customs Classification. STRICTLY NUMERIC (e.g. 8542.31.00).
        *   *NEVER put alphanumeric part numbers in the NCM field.*

    ### CRITICAL: COUNTRY CODES (ISO 3166-1 ALPHA-3)
    All country fields (Origin, Acquisition, Provenance) MUST be converted to the **3-letter ISO code**.
    *   China -> **CHN**
    *   United States -> **USA**
    *   Brazil -> **BRA**
    *   Germany -> **DEU**
    *   *Do not return full names like 'China' or 'United States'. Return 'CHN' or 'USA'.*

    ### EXTRACTION RULES:
    
    1. **MANDATORY ENTITIES**:
       - **EXPORTER**: Extract the Issuer's Name and Address.
       - **IMPORTER**: Extract the Buyer's Name/Address. If "Bill To" and "Consignee" differ, prioritize "Bill To".
    
    2. **LOGISTICS & WEIGHTS**:
       - **Total Gross Weight (Peso Bruto)**: Look for "Total Gross Weight" or "G.W.".
       - **Total Net Weight (Peso Líquido)**: Look for "Total Net Weight" or "N.W.".
       - **UNIT**: Detect if weights are in **KG** or **LB**.
       - **Countries**:
         - *Origin*: "Made in" / "Country of Origin".
         - *Provenance*: Port of Loading / Shipped From.
         - *Acquisition*: Country of the Seller.
    
    3. **LINE ITEMS (STRICT LINE-BY-LINE EXTRACTION)**:
       *   **SEQUENTIAL PROCESSING**: Read the item table row by row, from top to bottom.
       *   **VISUAL MAPPING**: Every visual row in the table that represents a product must result in ONE item in the JSON array.
       *   **IGNORE PAGE HEADERS**: If the table spans multiple pages, do **NOT** extract the repeated header rows on the 2nd/3rd page as items.
       *   **NO GROUPING**: If the invoice lists "Widget A" on Line 1 and "Widget A" again on Line 5, extract TWO separate items. Do not merge them.
       *   **NO SPLITTING**: If Line 1 says "Qty: 10", extract ONE item with quantity 10. Do NOT create 10 items.
       *   **DESCRIPTION WRAPPING**: If a description text wraps to the next line visually *without* a new Quantity/Price, append it to the description of the current item. Do not create a new item for wrapped text.
       
       For every valid item row, extract:
       *   **PART NUMBER**: Buyer's SKU/Part Number.
       *   **DESCRIPTION**: Full commercial description.
       *   **NCM (HS Code)**: The numeric customs code. MUST be explicitly present.
       *   **QTY**: The billed quantity (ignore package counts like 'boxes' or 'pallets' here).
       *   **UNIT**: e.g., PCS, UN, M.
       *   **UNIT PRICE**: Value per unit.
       *   **TOTAL**: Total line value.
       *   **UNIT NET WEIGHT**: Net weight per unit (if listed), usually found on the packing list.
       *   **NET WEIGHT**: Total Net weight for the line (if listed).

    4. **FINANCIALS**:
       - **Currency**: ISO Code (USD, EUR).
       - **Incoterm**: 3-Letter Code (EXW, FOB, CIF).
  `;
};

/**
 * Extracts structured invoice data from one or multiple files using Gemini.
 */
export const extractInvoiceData = async (
  files: FilePart[],
  modelId: string
): Promise<InvoiceData> => {
  const startTime = Date.now();

  // Initialize Gemini API client inside the function to avoid top-level process.env access issues
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Updated Response Schema - Extended for PLI Model (All Fields)
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      // --- Identifiers ---
      invoiceNumber: {
        type: Type.STRING,
        description: "Commercial Invoice Number (Fatura Comercial).",
      },
      packingListNumber: {
        type: Type.STRING,
        description: "Packing List Number.",
      },
      date: { type: Type.STRING, description: "Issue Date (YYYY-MM-DD)." },
      dueDate: {
        type: Type.STRING,
        description: "Payment Due Date (YYYY-MM-DD).",
      },

      // --- Entities ---
      exporterName: {
        type: Type.STRING,
        description: "Exporter/Seller/Issuer Name.",
      },
      exporterAddress: { type: Type.STRING, description: "Exporter Address." },
      importerName: {
        type: Type.STRING,
        description:
          "Importer/Buyer Name. The 'Bill To' entity responsible for the DI.",
      },
      importerAddress: {
        type: Type.STRING,
        description: "Importer/Buyer Address.",
      },

      // --- Trade & Logistics ---
      incoterm: {
        type: Type.STRING,
        description:
          "3-letter Incoterm Code (e.g., FCA, EXW, FOB). Null if not found.",
      },
      paymentTerms: {
        type: Type.STRING,
        description: "Payment Condition (e.g., Net 30, T/T).",
      },
      countryOfOrigin: {
        type: Type.STRING,
        description:
          "Country of Origin (Made in). MUST BE ISO 3166-1 ALPHA-3 CODE (e.g. CHN, USA, DEU).",
      },
      countryOfAcquisition: {
        type: Type.STRING,
        description:
          "Country of Acquisition (Sold by). MUST BE ISO 3166-1 ALPHA-3 CODE (e.g. CHN, USA).",
      },
      countryOfProvenance: {
        type: Type.STRING,
        description:
          "Country of Provenance (Shipped From). MUST BE ISO 3166-1 ALPHA-3 CODE (e.g. HKG, TWN).",
      },
      totalNetWeight: {
        type: Type.NUMBER,
        description: "Total Net Weight (N.W.).",
      },
      totalGrossWeight: {
        type: Type.NUMBER,
        description:
          "Total Gross Weight (G.W.). Look for 'Total Gross', 'G.W.'.",
      },
      weightUnit: {
        type: Type.STRING,
        enum: ["KG", "LB"],
        description:
          "Weight Unit. Return 'KG' for Kilograms or 'LB' for Pounds.",
      },
      totalVolumes: {
        type: Type.NUMBER,
        description: "Total Quantity of Packages/Volumes.",
      },
      volumeType: {
        type: Type.STRING,
        description: "Type of Volume (e.g., Pallets, Cartons).",
      },

      // --- Financials ---
      currency: {
        type: Type.STRING,
        description: "Currency Code (USD, EUR, BRL).",
      },
      subtotal: {
        type: Type.NUMBER,
        description: "Subtotal Value (do not calculate).",
      },
      freight: {
        type: Type.NUMBER,
        description: "International Freight Cost.",
      },
      insurance: { type: Type.NUMBER, description: "Insurance Cost." },
      tax: { type: Type.NUMBER, description: "Tax/Duty Amount." },
      otherCharges: { type: Type.NUMBER, description: "Other Charges." },
      grandTotal: {
        type: Type.NUMBER,
        description: "Grand Total / Final Amount (do not calculate).",
      },

      // --- Line Items ---
      lineItems: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            partNumber: {
              type: Type.STRING,
              description:
                "PART_NUMBER. The Buyer's/Customer's Part Number or SKU. (PLI Col A).",
            },
            productCode: {
              type: Type.STRING,
              description:
                "CODIGO_PRODUTO. Secondary internal code. Use only if distinct from Part Number. (PLI Col C).",
            },
            manufacturerRef: {
              type: Type.STRING,
              description:
                "REFERENCIA_FABRICANTE. The Seller's/Manufacturer's Part Number/Model. (PLI Col L).",
            },

            productDetail: {
              type: Type.STRING,
              description: "Detail, suffix, or 'Ex' tarifario code.",
            },
            description: {
              type: Type.STRING,
              description: "DESCRIPTION. Full commercial description.",
            },
            quantity: {
              type: Type.NUMBER,
              description: "QTY. The billed quantity.",
            },
            unitMeasure: {
              type: Type.STRING,
              description: "Unit of Measure e.g. PCS, UN, M, KG.",
            },
            unitPrice: {
              type: Type.NUMBER,
              description: "UNIT PRICE. Price per single unit.",
            },
            total: { type: Type.NUMBER, description: "Total Line Price." },
            unitNetWeight: {
              type: Type.NUMBER,
              description: "Unit Net Weight (if available).",
            },
            netWeight: {
              type: Type.NUMBER,
              description:
                "ITEM NET WEIGHT. The Total Net Weight for this line item.",
            },
            ncm: {
              type: Type.STRING,
              description:
                "HS Code / NCM (e.g. 8471.30.12). MUST BE NUMERIC (dots allowed). Do NOT put Part Numbers here. If missing, return null.",
            },
            manufacturerCode: {
              type: Type.STRING,
              description: "Manufacturer specific code if available.",
            },
            material: {
              type: Type.STRING,
              description: "Material composition (e.g. Steel, Plastic).",
            },
            manufacturerCountry: {
              type: Type.STRING,
              description:
                "Country of Manufacturer. Use ISO 3166-1 ALPHA-3 Code.",
            },

            // Regulatory (Ato Legal)
            legalAct1Type: {
              type: Type.STRING,
              description: "Regulatory Act Type (Ato Legal).",
            },
            legalAct1Issuer: {
              type: Type.STRING,
              description: "Issuer of Regulatory Act.",
            },
            legalAct1Number: { type: Type.STRING, description: "Act Number." },
            legalAct1Year: { type: Type.STRING, description: "Act Year." },
            legalAct1Ex: {
              type: Type.STRING,
              description: "'Ex' code of the Act.",
            },
            legalAct1Rate: {
              type: Type.NUMBER,
              description: "Ad Valorem Rate (%).",
            },

            // Attributes
            complementaryNote: {
              type: Type.STRING,
              description: "Complementary Note (Nota Complementar).",
            },

            attr1Level: {
              type: Type.STRING,
              description: "Attribute 1 Level.",
            },
            attr1Name: { type: Type.STRING, description: "Attribute 1 Name." },
            attr1Value: {
              type: Type.STRING,
              description: "Attribute 1 Value.",
            },

            attr2Level: {
              type: Type.STRING,
              description: "Attribute 2 Level.",
            },
            attr2Name: { type: Type.STRING, description: "Attribute 2 Name." },
            attr2Value: {
              type: Type.STRING,
              description: "Attribute 2 Value.",
            },
          },
          required: ["description"],
        },
      },
    },
    required: ["lineItems"],
    // IMPORTANT: Enforce ordering to ensure Headers come first, and Line Items (which can be truncated) come last.
    propertyOrdering: [
      "invoiceNumber",
      "packingListNumber",
      "date",
      "dueDate",
      "exporterName",
      "exporterAddress",
      "importerName",
      "importerAddress",
      "incoterm",
      "paymentTerms",
      "countryOfOrigin",
      "countryOfAcquisition",
      "countryOfProvenance",
      "totalNetWeight",
      "totalGrossWeight",
      "weightUnit",
      "totalVolumes",
      "volumeType",
      "currency",
      "subtotal",
      "freight",
      "insurance",
      "tax",
      "otherCharges",
      "grandTotal",
      "lineItems",
    ],
  };

  try {
    const promptParts = files.map((file) => {
      if (file.mimeType === "text/csv") {
        const decodedText = new TextDecoder().decode(
          Uint8Array.from(atob(file.data), (c) => c.charCodeAt(0))
        );
        return {
          text: `[STRUCTURED DATA (CSV/EXCEL)]:\n${decodedText}\n[END DATA]\n`,
        };
      } else {
        return {
          inlineData: {
            mimeType: file.mimeType,
            data: file.data,
          },
        };
      }
    });

    const config: any = {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0, // Zero temperature for maximum determinism
    };

    // Optimization for Gemini 2.5
    if (modelId.includes("gemini-2.5")) {
      config.thinkingConfig = { thinkingBudget: 0 };
    }

    const systemPrompt = getModelSpecificPrompt(modelId);

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          ...promptParts,
          {
            text: systemPrompt,
          },
        ],
      },
      config: config,
    });

    const text = response.text;

    // Metrics
    const endTime = Date.now();
    const latency = endTime - startTime;
    const inputTokens = response.usageMetadata?.promptTokenCount || 0;
    const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;

    usageService.logTransaction(modelId, inputTokens, outputTokens, latency);

    if (!text) throw new Error("No data returned from Gemini");

    // Use Robust Parser
    const rawData = safeJsonParse(text);
    const cleaned = cleanData(rawData);

    // Basic array safety
    if (!cleaned.lineItems || !Array.isArray(cleaned.lineItems)) {
      cleaned.lineItems = [];
    }

    // Default unit to KG if not found
    if (!cleaned.weightUnit) {
      cleaned.weightUnit = "KG";
    }

    const result = cleaned as InvoiceData;

    // Fix for TS error: convert string|number|null to number|null safely
    const parseCurrency = (val: string | number | null): number | null => {
      if (val === null || val === undefined || val === "") return null;
      if (typeof val === "number") return val;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    };

    result.originalSubtotal = parseCurrency(result.subtotal);
    result.originalGrandTotal = parseCurrency(result.grandTotal);

    // Post-Process: Ensure Line Item Totals & Weights are consistent
    if (result.lineItems && Array.isArray(result.lineItems)) {
      result.lineItems = result.lineItems.map((item) => {
        const qty =
          typeof item.quantity === "number"
            ? item.quantity
            : parseFloat(item.quantity || "0");

        const unitNetWeight =
          typeof item.unitNetWeight === "number"
            ? item.unitNetWeight
            : parseFloat(item.unitNetWeight || "0");

        // 1. Calculate Total Price if missing or update it?
        // Ideally we trust the extraction, but for weights we want strict calculation as requested.

        // 2. Strict Net Weight Calculation (Bi-directional)
        // Priority: Trust the extracted Total Net Weight if available.
        // If Total is missing but Unit is present, calculate Total.

        let finalNetWeight = item.netWeight;
        let finalUnitWeight = unitNetWeight;

        // If we have a Total Weight, use it to derive Unit Weight (more common in invoices to have accurate line totals)
        if (
          !isNaN(parseFloat(String(item.netWeight))) &&
          parseFloat(String(item.netWeight)) > 0
        ) {
          finalNetWeight = parseFloat(String(item.netWeight));
          if (qty > 0) {
            finalUnitWeight = parseFloat((finalNetWeight / qty).toFixed(6));
          }
        }
        // Fallback: If Total is missing, but we have Unit, calculate Total
        else if (unitNetWeight > 0 && qty > 0) {
          finalNetWeight = parseFloat((qty * unitNetWeight).toFixed(4));
        }

        item.netWeight = finalNetWeight;
        item.unitNetWeight = finalUnitWeight;

        return item;
      });
    }

    return result;
  } catch (error) {
    logger.error("Gemini Extraction Error:", error);
    throw error;
  }
};

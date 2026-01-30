import { InvoiceData, FilePart } from "../types";
import { logger } from "./loggerService";
import { extractionTracer } from "./extractionTracer";

/**
 * Frontend API client for the backend extraction service.
 * Sends files to the Python backend for AI processing.
 */
export async function extractInvoiceData(
  fileParts: FilePart[],
  apiKey: string,
  onProgress?: (msg: string) => void,
  modelId: string = "gemini-2.5-flash",
): Promise<InvoiceData> {
  if (fileParts.length === 0) {
    throw new Error("No files provided");
  }

  const filePart = fileParts[0];

  // Calculate total size for tracer
  const totalSize = fileParts.reduce((acc, fp) => {
    // Base64 is ~4/3 of the original size
    return acc + Math.ceil((fp.data.length * 3) / 4);
  }, 0);

  // Start extraction tracer
  extractionTracer.start(fileParts.length, totalSize);

  onProgress?.("🚀 Enviando arquivo para processamento no servidor...");
  extractionTracer.logEvent("PRE_PROCESSING", "Preparing file for upload", {
    filename: filePart.filename,
    mimeType: filePart.mimeType,
  });

  // Create Form Data
  const formData = new FormData();

  // Convert base64 to Blob
  const byteCharacters = atob(filePart.data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: filePart.mimeType });

  formData.append("file", blob, filePart.filename || "invoice.pdf");
  formData.append("api_key", apiKey);
  formData.append("model_id", modelId);

  extractionTracer.logEvent("API_CONNECT", "Connecting to extraction API", {
    model: modelId,
  });

  try {
    const startTime = Date.now();

    const response = await fetch("/api/extract", {
      method: "POST",
      body: formData,
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      extractionTracer.logEvent(
        "ERROR",
        `Server responded with ${response.status}`,
        { status: response.status },
        { latency },
      );

      const errorText = await response.text();
      let errorMsg = `Server Error: ${response.status}`;
      try {
        const errJson = JSON.parse(errorText);
        if (errJson.detail) errorMsg = errJson.detail;
      } catch {
        /* ignore */
      }

      // Check if partial data exists (for timeout scenarios)
      if (response.status === 504) {
        extractionTracer.fail(
          `Timeout do servidor (${response.status}). O processamento demorou mais que o esperado.`,
          { status: response.status, errorText },
        );
      } else {
        extractionTracer.fail(errorMsg, { status: response.status, errorText });
      }

      throw new Error(errorMsg);
    }

    extractionTracer.logEvent(
      "METADATA_RESPONSE",
      "Response received from server",
      { status: response.status },
      { latency },
    );

    onProgress?.("✅ Resposta recebida! Processando dados...");

    extractionTracer.logEvent("PARSING", "Parsing response JSON");
    const data = await response.json();

    // Ensure lineItems is an array
    if (!Array.isArray(data.lineItems)) {
      data.lineItems = [];
    }

    // DEBUG: Log received line items to inspect weight values
    console.debug("[GeminiService] Received lineItems:", data.lineItems);
    if (data.lineItems.length > 0) {
      console.debug("[GeminiService] Sample Item Weights:", {
        netWeight: data.lineItems[0].netWeight,
        unitNetWeight: data.lineItems[0].unitNetWeight,
        weightUnit: data.lineItems[0].weightUnit,
      });
    }

    // Cache the extracted data in tracer for recovery
    extractionTracer.savePartialData("metadata", {
      invoiceNumber: data.invoiceNumber,
      invoiceDate: data.invoiceDate,
      exporter: data.exporter,
      importer: data.importer,
      currency: data.currency,
      totalValue: data.totalValue,
      incoterm: data.incoterm,
      countryOfOrigin: data.countryOfOrigin,
      // ... other metadata fields
    });

    if (data.lineItems?.length > 0) {
      extractionTracer.savePartialData("lineItems", data.lineItems);
    }

    extractionTracer.logEvent("VALIDATION", "Validating extracted data", {
      hasMetadata: !!data.invoiceNumber,
      lineItemCount: data.lineItems?.length || 0,
    });

    logger.info("Extraction successful via Backend API");
    extractionTracer.complete();

    return data as InvoiceData;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Don't double-fail if already failed (e.g., from response handling)
    if (extractionTracer.getCurrentState()?.status === "RUNNING") {
      extractionTracer.fail(errorMessage, { error });
    }

    logger.error("Backend Extraction Failed", error);
    throw error;
  }
}

import { InvoiceData, FilePart, initialInvoiceData } from "../types";
import { logger } from "./loggerService";
import { InvoiceSchema } from "../domain/schemas";

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
  onProgress?.("🚀 Enviando arquivo para processamento no servidor...");

  if (fileParts.length === 0) {
    throw new Error("No files provided");
  }

  const filePart = fileParts[0];

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

  try {
    const response = await fetch("/api/extract", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `Server Error: ${response.status}`;
      try {
        const errJson = JSON.parse(errorText);
        if (errJson.detail) errorMsg = errJson.detail;
      } catch (e) {
        /* ignore */
      }

      throw new Error(errorMsg);
    }

    onProgress?.("✅ Resposta recebida! Processando dados...");
    const data = await response.json();

    // Ensure lineItems is an array
    if (!Array.isArray(data.lineItems)) {
      data.lineItems = [];
    }

    logger.info("Extraction successful via Backend API");

    return data as InvoiceData;
  } catch (error: any) {
    logger.error("Backend Extraction Failed", error);
    throw error;
  }
}

// Version: 1.05.00.23
import { FilePart } from "../types";
import * as XLSX from "xlsx";

/**
 * Helper to process Spreadsheet files (XLSX, XLS, CSV).
 * Converts all sheets to a single CSV string to be fed as text to the AI.
 */
const processSpreadsheet = async (file: File): Promise<FilePart> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        let fullTextContent = "";

        // Iterate over all sheets to ensure we capture Invoice and Packing List tabs
        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const csvContent = XLSX.utils.sheet_to_csv(sheet);
          if (csvContent && csvContent.trim().length > 0) {
            fullTextContent += `\n--- SHEET: ${sheetName} ---\n${csvContent}`;
          }
        });

        // Encode the text content to Base64 so it matches the FilePart interface
        // We use btoa with a workaround for UTF-8 characters
        const base64Data = btoa(
          new TextEncoder()
            .encode(fullTextContent)
            .reduce((data, byte) => data + String.fromCharCode(byte), "")
        );

        resolve({
          mimeType: "text/csv", // We normalize all spreadsheet data to CSV text
          data: base64Data,
          filename: file.name,
        });
      } catch (err) {
        reject(new Error(`Falha ao processar planilha: ${file.name}`));
      }
    };

    reader.onerror = () =>
      reject(new Error(`Erro ao ler arquivo ${file.name}`));
  });
};

/**
 * Reads a File object and converts it to a base64 string for Gemini API.
 * Handles Images/PDFs via DataURL and Spreadsheets via XLSX parsing.
 */
export const readFileToBase64 = async (file: File): Promise<FilePart> => {
  // Check for Spreadsheet types
  const isSpreadsheet =
    file.name.endsWith(".xlsx") ||
    file.name.endsWith(".xls") ||
    file.name.endsWith(".csv") ||
    file.type.includes("spreadsheet") ||
    file.type.includes("csv");

  if (isSpreadsheet) {
    return processSpreadsheet(file);
  }

  // Standard Image/PDF handling
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
      const base64String = reader.result as string;
      // Strip the Data URL prefix (e.g., "data:image/png;base64,")
      const base64Data = base64String.split(",")[1];
      resolve({
        mimeType: file.type,
        data: base64Data,
        filename: file.name,
      });
    };

    reader.onerror = () =>
      reject(new Error(`Falha ao ler arquivo ${file.name}`));
  });
};

/**
 * Processes multiple files in parallel.
 */
export const processFilesToBase64 = async (
  files: File[],
  onProgress?: (msg: string) => void
): Promise<FilePart[]> => {
  onProgress?.(`📂 Preparando ${files.length} arquivo(s)...`);
  // Map files to promises and execute them
  const promises = files.map(async (file, index) => {
    onProgress?.(`📂 Lendo arquivo ${index + 1}/${files.length}: ${file.name}`);
    return await readFileToBase64(file);
  });

  return Promise.all(promises);
};

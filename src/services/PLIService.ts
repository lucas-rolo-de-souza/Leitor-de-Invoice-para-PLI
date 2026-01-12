import * as XLSX from "xlsx";
import { InvoiceData } from "../types";
import { validatePliData } from "./PLIValidator";

/**
 * Downloads a text string as a .txt file (UTF-8 BOM included for Windows compatibility).
 */
const downloadTextReport = (content: string, filename: string) => {
  // Add Byte Order Mark for Windows Notepad compatibility
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + content], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generates and downloads the PLI XLS file.
 * We use a low-level SheetJS construction to strictly enforce Cell Types (Text vs Number).
 */
const generateAndDownloadXls = (data: InvoiceData) => {
  const sheetName = "MODELO PLI";

  // Headers
  const headers = [
    "PART_NUMBER",
    "ESPECIFICAÇÃO_TECNICA",
    "CODIGO_PRODUTO",
    "CODIGO_NCM",
    "DETALHE_PRODUTO",
    "UNIDADE",
    "PESO_LIQUIDO",
    "QUANTIDADE",
    "VALOR_UNITARIO",
    "CODIGO_FABRICANTE",
    "MATERIA_PRIMA",
    "REFERENCIA_FABRICANTE",
    "CODIGO_PAIS_FABRICANTE_DESCONHECIDO",
    "Ato Legal",
    "Orgão Emissor",
    "Número",
    "Ano",
    "Ex",
    "Alíquota Ad Valorem (%)",
    "Ato Legal",
    "Orgão Emissor",
    "Número",
    "Ano",
    "Ex",
    "Alíquota Ad Valorem (%)",
    "Nota Complementar",
    "NIVEL",
    "ATRIBUTO",
    "ESPECIFICAÇÃO",
    "NIVEL",
    "ATRIBUTO",
    "ESPECIFICAÇÃO",
    "NIVEL",
    "ATRIBUTO",
    "ESPECIFICAÇÃO",
  ];

  // Helper to create cell object
  // t: 's' (string), 'n' (number)
  // z: format string (e.g. '@' for text)
  const cell = (v: any, type: "s" | "n" = "s") => {
    if (v === null || v === undefined) return { t: "s", v: "" }; // Default to empty string cell

    if (type === "n") {
      // Check if it's a valid number
      const num = Number(v.toString().replace(",", "."));
      if (isNaN(num)) return { t: "s", v: String(v) }; // Fallback to string if strictly not a number
      return { t: "n", v: num };
    }

    return { t: "s", v: String(v), z: "@" }; // Force Text format
  };

  const rows: any[][] = [
    headers.map((h) => ({ t: "s", v: h, z: "@" })), // Header Row
  ];

  const items = data.lineItems || [];

  items.forEach((item) => {
    const rowData = [
      cell(item.partNumber), // PART_NUMBER (Buyer/Customer Part Number)
      cell(item.description), // ESPECIFICAÇÃO_TECNICA
      cell(item.productCode, "s"), // CODIGO_PRODUTO
      cell(item.ncm ? item.ncm.replace(/\./g, "") : "", "s"), // CODIGO_NCM
      cell(item.productDetail, "s"), // DETALHE_PRODUTO
      cell(item.unitMeasure, "s"), // UNIDADE
      cell(item.netWeight, "n"), // PESO_LIQUIDO
      cell(item.quantity, "n"), // QUANTIDADE
      cell(item.unitPrice, "n"), // VALOR_UNITARIO
      cell(item.manufacturerCode, "s"), // CODIGO_FABRICANTE
      cell(item.material), // MATERIA_PRIMA
      cell(item.manufacturerRef), // REFERENCIA_FABRICANTE (Seller/Exporter Part Number)
      cell(""), // CODIGO_PAIS_FABRICANTE_DESCONHECIDO (Cleared)

      // Ato Legal 1
      cell(item.legalAct1Type),
      cell(item.legalAct1Issuer),
      cell(item.legalAct1Number),
      cell(item.legalAct1Year),
      cell(item.legalAct1Ex),
      cell(""), // Alíquota 1 cleared

      // Ato Legal 2
      cell(item.legalAct2Type),
      cell(item.legalAct2Issuer),
      cell(item.legalAct2Number),
      cell(item.legalAct2Year),
      cell(item.legalAct2Ex),
      cell(""), // Alíquota 2 cleared

      // Attributes
      cell(item.complementaryNote),
      cell(item.attr1Level),
      cell(item.attr1Name),
      cell(item.attr1Value),
      cell(item.attr2Level),
      cell(item.attr2Name),
      cell(item.attr2Value),
      cell(item.attr3Level),
      cell(item.attr3Name),
      cell(item.attr3Value),
    ];
    rows.push(rowData);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Export as XLS (BIFF8)
  XLSX.writeFile(wb, `IMPORTACAO_MODELO_INDUSTRIA_PLI.xls`, {
    bookType: "xls",
  });
};

/**
 * Main Handler for PLI Export.
 * Orchestrates Validation -> Error Report OR XLS Generation.
 */
export const handlePLIExport = (data: InvoiceData) => {
  // 1. Run Validation
  const errorReport = validatePliData(data);

  if (errorReport) {
    // Generate Timestamp: YYYYMMDD_HHmm
    const now = new Date();
    const YYYY = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, "0");
    const DD = String(now.getDate()).padStart(2, "0");
    const HH = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");

    const timestamp = `${YYYY}${MM}${DD}_${HH}${mm}`;
    const filename = `relatorio_erros_${timestamp}.txt`;

    // 2a. If errors, download Text File
    downloadTextReport(errorReport, filename);
  }

  // 2b. Always download XLS regardless of errors
  generateAndDownloadXls(data);
};

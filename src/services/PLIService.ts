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
 * Uses ExcelJS for workbook construction with cell type enforcement.
 */
/**
 * Generates and downloads the PLI XLS file (BIFF8 format).
 * Uses SheetJS (xlsx) for legacy .xls compatibility.
 */
const generateAndDownloadXls = async (data: InvoiceData) => {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

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

  const items = data.lineItems || [];
  const rows = items.map((item) => [
    { v: item.partNumber ?? "", t: "s" },
    { v: item.description ?? "", t: "s" },
    { v: item.productCode ?? "", t: "s" },
    { v: item.ncm ? item.ncm.replace(/\./g, "") : "", t: "n" },
    { v: item.taxClassificationDetail ?? "", t: "n" },
    { v: item.unitMeasure ?? "", t: "s" },
    Number(item.netWeight) || 0,
    Number(item.quantity) || 0,
    Number(item.unitPrice) || 0,
    { v: item.manufacturerCode ?? "", t: "n" },
    { v: item.material ?? "", t: "n" },
    { v: item.manufacturerRef ?? "", t: "n" },
    "", // CODIGO_PAIS_FABRICANTE_DESCONHECIDO
    { v: item.legalAct1Type ?? "", t: "n" },
    { v: item.legalAct1Issuer ?? "", t: "n" },
    { v: item.legalAct1Number ?? "", t: "n" },
    { v: item.legalAct1Year ?? "", t: "n" },
    { v: item.legalAct1Ex ?? "", t: "n" },
    { v: "", t: "s" }, // Alíquota Ad Valorem (%)
    { v: item.legalAct2Type ?? "", t: "n" },
    { v: item.legalAct2Issuer ?? "", t: "n" },
    { v: item.legalAct2Number ?? "", t: "n" },
    { v: item.legalAct2Year ?? "", t: "n" },
    { v: item.legalAct2Ex ?? "", t: "n" },
    { v: "", t: "s" }, // Alíquota Ad Valorem (%)
    { v: item.complementaryNote ?? "", t: "n" },
    { v: item.attr1Level ?? "", t: "n" },
    { v: item.attr1Name ?? "", t: "n" },
    { v: item.attr1Value ?? "", t: "n" },
    { v: item.attr2Level ?? "", t: "n" },
    { v: item.attr2Name ?? "", t: "n" },
    { v: item.attr2Value ?? "", t: "n" },
    { v: item.attr3Level ?? "", t: "n" },
    { v: item.attr3Name ?? "", t: "n" },
    { v: item.attr3Value ?? "", t: "n" },
  ]);

  // Combine headers and data
  const wsData = [headers, ...rows];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Append worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "MODELO PLI");

  // Generate and download file
  // bookType: 'xls' ensures BIFF8 format
  XLSX.writeFile(wb, "IMPORTACAO_MODELO_INDUSTRIA_PLI.xls", {
    bookType: "xls",
  });
};

/**
 * Main Handler for PLI Export.
 * Orchestrates Validation -> Error Report OR XLS Generation.
 */
export const handlePLIExport = async (data: InvoiceData) => {
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
  await generateAndDownloadXls(data);
};

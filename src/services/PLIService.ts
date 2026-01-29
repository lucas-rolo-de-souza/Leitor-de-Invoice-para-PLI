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
const generateAndDownloadXls = async (data: InvoiceData) => {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("MODELO PLI");

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

  worksheet.addRow(headers);

  const items = data.lineItems || [];

  items.forEach((item) => {
    const rowData = [
      item.partNumber ?? "",
      item.description ?? "",
      item.productCode ?? "",
      item.ncm ? item.ncm.replace(/\./g, "") : "",
      item.taxClassificationDetail ?? "",
      item.unitMeasure ?? "",
      Number(item.netWeight) || 0,
      Number(item.quantity) || 0,
      Number(item.unitPrice) || 0,
      item.manufacturerCode ?? "",
      item.material ?? "",
      item.manufacturerRef ?? "",
      "",
      item.legalAct1Type ?? "",
      item.legalAct1Issuer ?? "",
      item.legalAct1Number ?? "",
      item.legalAct1Year ?? "",
      item.legalAct1Ex ?? "",
      "",
      item.legalAct2Type ?? "",
      item.legalAct2Issuer ?? "",
      item.legalAct2Number ?? "",
      item.legalAct2Year ?? "",
      item.legalAct2Ex ?? "",
      "",
      item.complementaryNote ?? "",
      item.attr1Level ?? "",
      item.attr1Name ?? "",
      item.attr1Value ?? "",
      item.attr2Level ?? "",
      item.attr2Name ?? "",
      item.attr2Value ?? "",
      item.attr3Level ?? "",
      item.attr3Name ?? "",
      item.attr3Value ?? "",
    ];
    worksheet.addRow(rowData);
  });

  // Download file in browser
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `IMPORTACAO_MODELO_INDUSTRIA_PLI.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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

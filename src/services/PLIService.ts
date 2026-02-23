import { InvoiceData } from "../types";
import { validatePliData } from "../domain/validation/pliValidator";

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
 * Generates and downloads the PLI XLS file by populating the official template.
 * Fetches IMPORTACAO_MODELO_INDUSTRIA.xls, injects data starting at row 3,
 * and downloads as a new file preserving all original formatting and merges.
 */
const generateAndDownloadXls = async (data: InvoiceData) => {
  const XLSX = await import("xlsx");

  // 1. Fetch the template from public/
  const response = await fetch(
    `${import.meta.env.BASE_URL}IMPORTACAO_MODELO_INDUSTRIA.xls`,
  );
  if (!response.ok) throw new Error("Failed to load PLI template file");
  const templateBuffer = await response.arrayBuffer();

  // 2. Read the template workbook (cellStyles preserves formatting)
  const wb = XLSX.read(templateBuffer, { type: "array", cellStyles: true });
  const ws = wb.Sheets[wb.SheetNames[0]];

  // 3. Build data rows from InvoiceData
  const items = data.lineItems || [];

  items.forEach((item, idx) => {
    const rowIdx = idx + 2; // Template has 2 header rows (0, 1), data starts at row 2

    // Column mapping: write each value into the correct cell
    const rowData: [number, unknown][] = [
      [0, item.partNumber ?? ""], // A PART_NUMBER
      [1, item.description ?? ""], // B ESPECIFICAÇÃO_TECNICA
      [2, item.productCode ?? ""], // C CODIGO_PRODUTO
      [3, item.ncm ? item.ncm.replace(/\./g, "") : ""], // D CODIGO_NCM
      [4, item.taxClassificationDetail ?? ""], // E DETALHE_PRODUTO
      [5, item.unitMeasure ?? ""], // F UNIDADE
      [6, Number(item.netWeight) || 0], // G PESO_LIQUIDO
      [7, Number(item.quantity) || 0], // H QUANTIDADE
      [8, Number(item.unitPrice) || 0], // I VALOR_UNITARIO
      [9, item.manufacturerCode ?? ""], // J CODIGO_FABRICANTE
      [10, item.material ?? ""], // K MATERIA_PRIMA
      [11, item.manufacturerRef ?? ""], // L REFERENCIA_FABRICANTE
      [12, ""], // M CODIGO_PAIS_FABRICANTE_DESCONHECIDO
      [13, item.legalAct1Type ? Number(item.legalAct1Type) : ""], // N Ato Legal (II)
      [14, item.legalAct1Issuer ? Number(item.legalAct1Issuer) : ""], // O Orgão Emissor (II)
      [15, item.legalAct1Number ? Number(item.legalAct1Number) : ""], // P Número (II)
      [16, item.legalAct1Year ? Number(item.legalAct1Year) : ""], // Q Ano (II)
      [17, item.legalAct1Ex ? Number(item.legalAct1Ex) : ""], // R Ex (II)
      [18, item.legalAct1Rate ? Number(item.legalAct1Rate) : ""], // S Alíquota Ad Valorem % (II)
      [19, item.legalAct2Type ? Number(item.legalAct2Type) : ""], // T Ato Legal (IPI)
      [20, item.legalAct2Issuer ? Number(item.legalAct2Issuer) : ""], // U Orgão Emissor (IPI)
      [21, item.legalAct2Number ? Number(item.legalAct2Number) : ""], // V Número (IPI)
      [22, item.legalAct2Year ? Number(item.legalAct2Year) : ""], // W Ano (IPI)
      [23, item.legalAct2Ex ? Number(item.legalAct2Ex) : ""], // X Ex (IPI)
      [24, item.legalAct2Rate ? Number(item.legalAct2Rate) : ""], // Y Alíquota Ad Valorem % (IPI)
      [25, item.complementaryNote ?? ""], // Z Nota Complementar
      [26, item.attr1Level ? Number(item.attr1Level) : ""], // AA NVE 1 NIVEL
      [27, item.attr1Name ? Number(item.attr1Name) : ""], // AB NVE 1 ATRIBUTO
      [28, item.attr1Value ? Number(item.attr1Value) : ""], // AC NVE 1 ESPECIFICAÇÃO
      [29, item.attr2Level ? Number(item.attr2Level) : ""], // AD NVE 2 NIVEL
      [30, item.attr2Name ? Number(item.attr2Name) : ""], // AE NVE 2 ATRIBUTO
      [31, item.attr2Value ? Number(item.attr2Value) : ""], // AF NVE 2 ESPECIFICAÇÃO
      [32, item.attr3Level ? Number(item.attr3Level) : ""], // AG NVE 3 NIVEL
      [33, item.attr3Name ? Number(item.attr3Name) : ""], // AH NVE 3 ATRIBUTO
      [34, item.attr3Value ? Number(item.attr3Value) : ""], // AI NVE 3 ESPECIFICAÇÃO
    ];

    rowData.forEach(([colIdx, value]) => {
      const cellRef = XLSX.utils.encode_cell({
        r: rowIdx,
        c: colIdx as number,
      });
      if (value === "" || value === null || value === undefined) {
        // Leave cell empty to inherit template column format
        return;
      }
      if (typeof value === "number") {
        ws[cellRef] = { v: value, t: "n" };
      } else {
        ws[cellRef] = { v: String(value), t: "s" };
      }
    });
  });

  // 4. Update sheet range to include all data rows
  if (items.length > 0) {
    const lastRow = items.length + 1; // 0-indexed: header rows 0,1 + data
    ws["!ref"] = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: lastRow, c: 34 },
    });
  }

  // 5. Generate filename: PLI_{invoice-number}_{YYYY-MM-DD}
  let dateObj = new Date();
  if (data.date) {
    const parsedDate = new Date(data.date);
    if (!isNaN(parsedDate.getTime())) {
      dateObj = parsedDate;
    }
  }

  const YYYY = dateObj.getFullYear();
  const MM = String(dateObj.getMonth() + 1).padStart(2, "0");
  const DD = String(dateObj.getDate()).padStart(2, "0");
  const dateStr = `${YYYY}-${MM}-${DD}`;

  const invNumber = data.invoiceNumber?.trim() || "SEM_NUMERO";
  const filename = `PLI_${invNumber}_${dateStr}.xls`;

  // 6. Write and download
  XLSX.writeFile(wb, filename, { bookType: "xls" });
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

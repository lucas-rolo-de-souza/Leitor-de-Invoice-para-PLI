import { InvoiceData, LineItem } from "../types";
import { generateValidationErrors } from "../utils/validators";
import {
  INCOTERMS_LIST,
  CURRENCIES_LIST,
  COUNTRIES_LIST,
} from "../utils/validationConstants";

/**
 * Helper to calculate subtotal locally
 */
const calculateSubtotal = (items: LineItem[] | undefined): number => {
  return (items || []).reduce(
    (sum, item) => sum + (Number(item.total) || 0),
    0,
  );
};

/**
 * Helper to sanitize filenames (remove slashes, etc)
 */
const sanitizeFilename = (name: string): string => {
  return name.replace(/[\\/:*?"<>|]/g, "_");
};

import { convertWeight } from "../utils/converters";

/**
 * Helper to display weight in both units (KG and LB)
 */
const formatDualWeight = (value: number | string | null, unit: string) => {
  const val = Number(value || 0);
  const currentUnit = unit.toUpperCase();
  const convertedVal = convertWeight(val, currentUnit);

  if (currentUnit === "KG") {
    // KG / LB
    return `${val.toFixed(3)} KG  /  ${convertedVal.toFixed(3)} LB`;
  } else {
    // LB / KG
    return `${convertedVal.toFixed(3)} KG  /  ${val.toFixed(3)} LB`;
  }
};

/**
 * Exports the InvoiceData to a standard Excel (.xlsx) file.
 *
 * Structure:
 * 1. **Data Sheet**: Key/Value pairs for Header, Entities, and Financials.
 * 2. **Items Sheet**: Tabular data for Line Items (rows).
 * 3. **Errors Sheet**: (Conditional) Generated ONLY if validation fails, listing specific fields to fix.
 *
 * Logic:
 * - Recalculates Subtotal locally to ensure consistency with Items.
 * - Prioritizes `TotalNetWeight` > `UnitNetWeight` logic for accuracy.
 */
export const exportToExcel = async (data: InvoiceData) => {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();

  // Validation Check before Export
  const errors = generateValidationErrors(data, {
    incoterms: INCOTERMS_LIST,
    currencies: CURRENCIES_LIST,
    countries: COUNTRIES_LIST,
  });
  if (errors.length > 0) {
    const wsErrors = workbook.addWorksheet("RELATÓRIO DE ERROS");
    wsErrors.addRow(["CAMPO", "ERRO"]);
    errors.forEach((err) => wsErrors.addRow([err.field, err.message]));
  }

  const localSubtotal = calculateSubtotal(data.lineItems);

  // Create Header Info Sheet
  const wsHeader = workbook.addWorksheet("Dados Gerais");
  const headerData = [
    ["CAMPO", "VALOR"],
    ["Fatura Comercial", data.invoiceNumber],
    ["Packing List", data.packingListNumber],
    ["Data Emissão", data.date],
    ["Data Vencimento", data.dueDate],
    ["Exportador", data.exporterName],
    ["Endereço Exportador", data.exporterAddress],
    ["Importador", data.importerName],
    ["Endereço Importador", data.importerAddress],
    ["Incoterm", data.incoterm],
    ["Condição Pagamento", data.paymentTerms],
    ["Moeda", data.currency],
    ["País Origem", data.countryOfOrigin],
    ["País Aquisição", data.countryOfAcquisition],
    ["País Procedência", data.countryOfProvenance],
    [
      `Peso Líquido Total (${data.weightUnit || "KG"})`,
      Number(data.totalNetWeight || 0),
    ],
    [
      `Peso Bruto Total (${data.weightUnit || "KG"})`,
      Number(data.totalGrossWeight || 0),
    ],
    ["Volumes", Number(data.totalVolumes || 0)],
    ["Tipo Volume", data.volumeType],
    ["Dimensões", data.volumeDimensions],
    ["Porto de Embarque", data.portOfLoading],
    ["Porto de Descarga", data.portOfDischarge],
    ["Transbordo", data.transshipment],
    ["Subtotal", localSubtotal],
    ["Frete", Number(data.freight || 0)],
    ["Seguro", Number(data.insurance || 0)],
    ["Total Geral", Number(data.grandTotal || 0)],
  ];
  headerData.forEach((row) => wsHeader.addRow(row));

  // Create Standard Items Sheet
  const wsItems = workbook.addWorksheet("Itens");
  wsItems.addRow([
    "Part Number",
    "Descrição",
    "NCM",
    "Código Produto",
    "Quantidade",
    "Unidade",
    "Preço Unit.",
    "Total",
    "Peso Líq. Unit.",
    "Peso Líq. Total",
  ]);

  (data.lineItems || []).forEach((item) => {
    const qty = Number(item.quantity || 0);
    let totalNet = Number(item.netWeight || 0);
    let unitNet = Number(item.unitNetWeight || 0);

    if (totalNet !== 0) {
      if (qty > 0) unitNet = totalNet / qty;
    } else {
      totalNet = unitNet * qty;
    }

    wsItems.addRow([
      item.partNumber,
      item.description,
      item.ncm,
      item.productCode,
      qty,
      item.unitMeasure || "UN",
      Number(item.unitPrice || 0),
      Number(item.total || 0),
      unitNet,
      totalNet,
    ]);
  });

  // Download file in browser
  const safeInvoiceNumber = sanitizeFilename(data.invoiceNumber || "Draft");
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `Invoice_${safeInvoiceNumber}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exports the InvoiceData to a clean, printable PDF document using jsPDF.
 *
 * Features:
 * - **Validation Report**: If the invoice has errors (e.g., missing NCM), the FIRST page will be
 *   a red-highlighted "Compliance Report" listing all issues.
 * - **Layout**: Follows standard Commercial Invoice layout (Header -> Entities -> Table -> Footer).
 * - **Auto-Table**: Handles pagination for long lists of items automatically.
 */
export const exportToPDF = async (data: InvoiceData) => {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF();

  // Validation Check
  const errors = generateValidationErrors(data, {
    incoterms: INCOTERMS_LIST,
    currencies: CURRENCIES_LIST,
    countries: COUNTRIES_LIST,
  });

  if (errors.length > 0) {
    doc.setFontSize(16);
    doc.setTextColor(220, 38, 38);
    doc.text("Relatório de Pendências (Art. 557)", 14, 20);

    const errorRows = errors.map((e) => [e.field, e.message]);
    autoTable(doc, {
      head: [["Campo", "Erro"]],
      body: errorRows,
      startY: 30,
      theme: "grid",
      headStyles: { fillColor: [220, 38, 38] },
    });
    doc.addPage();
  }

  doc.setTextColor(0, 0, 0);

  // Header
  doc.setFontSize(18);
  doc.text("Fatura Comercial / Packing List", 14, 20);

  doc.setFontSize(10);
  doc.text(`Fatura: ${data.invoiceNumber || "-"}`, 14, 30);
  doc.text(`Data Emissão: ${data.date || "-"}`, 14, 35);
  doc.text(`Data Vencimento: ${data.dueDate || "-"}`, 100, 35);

  doc.text(`Incoterm: ${data.incoterm || "-"}`, 14, 40);
  doc.text(`Pagamento: ${data.paymentTerms || "-"}`, 100, 40);

  // Entities
  doc.setFontSize(12);
  doc.text("Exportador", 14, 50);
  doc.setFontSize(10);
  doc.text(doc.splitTextToSize(data.exporterName || "-", 80), 14, 55);

  doc.setFontSize(12);
  doc.text("Importador", 110, 50);
  doc.setFontSize(10);
  doc.text(doc.splitTextToSize(data.importerName || "-", 80), 110, 55);

  // Items Table
  // Added Unit Net Weight and Total Net Weight
  const tableColumn = [
    "PN",
    "Descrição",
    "NCM",
    "Qtd",
    "Unit.",
    "PL Unit.",
    "PL Total",
    "Total",
  ];
  const tableRows: unknown[] = [];

  (data.lineItems || []).forEach((item) => {
    const qty = Number(item.quantity || 0);
    // Priority: Trust Total Net Weight
    let totalNet = Number(item.netWeight || 0);
    let unitNet = Number(item.unitNetWeight || 0);

    if (totalNet !== 0) {
      if (qty > 0) unitNet = totalNet / qty;
    } else {
      totalNet = unitNet * qty;
    }

    const itemData = [
      item.partNumber || "",
      item.description || "",
      item.ncm || "",
      qty,
      Number(item.unitPrice || 0).toFixed(2),
      unitNet.toFixed(3),
      totalNet.toFixed(3),
      Number(item.total || 0).toFixed(2),
    ];
    tableRows.push(itemData);
  });

  autoTable(doc, {
    head: [tableColumn],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: tableRows as any[],
    startY: 80,
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: "auto" }, // Desc
      2: { cellWidth: 15 }, // NCM
      3: { cellWidth: 12 }, // Qtd
      4: { cellWidth: 15 }, // Unit
      5: { cellWidth: 15 }, // PL Unit
      6: { cellWidth: 15 }, // PL Total
      7: { cellWidth: 20 }, // Total
    },
  });

  // Footer / Totals
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastTable = (doc as any).lastAutoTable;
  const finalY = lastTable ? lastTable.finalY + 10 : 90;

  // Helper to display weight in both units (KG and LB)

  const currentUnit = data.weightUnit || "KG";

  doc.setFontSize(10);
  doc.text(
    `Volumes: ${Number(data.totalVolumes || 0)} (${data.volumeType || "-"})`,
    14,
    finalY,
  );
  doc.text(
    `Peso Líquido Total: ${formatDualWeight(data.totalNetWeight, currentUnit)}`,
    14,
    finalY + 5,
  );
  doc.text(
    `Peso Bruto Total: ${formatDualWeight(data.totalGrossWeight, currentUnit)}`,
    14,
    finalY + 10,
  );
  doc.text(
    `Total Geral: ${data.currency} ${Number(data.grandTotal || 0).toFixed(2)}`,
    14,
    finalY + 15,
  );

  const safeInvoiceNumber = sanitizeFilename(data.invoiceNumber || "Draft");
  doc.save(`Invoice_${safeInvoiceNumber}.pdf`);
};

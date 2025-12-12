
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvoiceData } from '../types';
import { generateValidationErrors } from '../utils/validators';
import { INCOTERMS_LIST, CURRENCIES_LIST, COUNTRIES_LIST } from '../utils/validationConstants';

/**
 * Helper to calculate subtotal locally
 */
const calculateSubtotal = (items: any[] | undefined): number => {
    return (items || []).reduce((sum, item) => sum + (Number(item.total) || 0), 0);
};

/**
 * Exports the InvoiceData to a standard Excel (.xlsx) file with:
 * 1. General Data
 * 2. Itens (Standard)
 * 3. Errors (if any)
 */
export const exportToExcel = (data: InvoiceData) => {
  const wb = XLSX.utils.book_new();
  
  // Validation Check before Export
  const errors = generateValidationErrors(data, { incoterms: INCOTERMS_LIST, currencies: CURRENCIES_LIST, countries: COUNTRIES_LIST });
  if (errors.length > 0) {
    const errorData = [['CAMPO', 'ERRO']];
    errors.forEach(err => errorData.push([err.field, err.message]));
    const wsErrors = XLSX.utils.aoa_to_sheet(errorData);
    XLSX.utils.book_append_sheet(wb, wsErrors, "RELATÓRIO DE ERROS");
  }
  
  const localSubtotal = calculateSubtotal(data.lineItems);

  // Create Header Info Sheet
  const headerData = [
    ['CAMPO', 'VALOR'],
    ['Fatura Comercial', data.invoiceNumber],
    ['Packing List', data.packingListNumber],
    ['Data Emissão', data.date],
    ['Data Vencimento', data.dueDate],
    ['Exportador', data.exporterName],
    ['Endereço Exportador', data.exporterAddress],
    ['Importador', data.importerName],
    ['Endereço Importador', data.importerAddress],
    ['Incoterm', data.incoterm],
    ['Condição Pagamento', data.paymentTerms],
    ['Moeda', data.currency],
    ['País Origem', data.countryOfOrigin],
    ['País Aquisição', data.countryOfAcquisition],
    ['País Procedência', data.countryOfProvenance],
    [`Peso Líquido Total (${data.weightUnit || 'KG'})`, Number(data.totalNetWeight || 0)],
    [`Peso Bruto Total (${data.weightUnit || 'KG'})`, Number(data.totalGrossWeight || 0)],
    ['Volumes', Number(data.totalVolumes || 0)],
    ['Tipo Volume', data.volumeType],
    ['Subtotal', localSubtotal], // Use local calculation
    ['Frete', Number(data.freight || 0)],
    ['Seguro', Number(data.insurance || 0)],
    ['Total Geral', Number(data.grandTotal || 0)]
  ];
  
  const wsHeader = XLSX.utils.aoa_to_sheet(headerData);
  XLSX.utils.book_append_sheet(wb, wsHeader, "Dados Gerais");

  // Create Standard Items Sheet
  const itemsData = (data.lineItems || []).map(item => ({
    'Part Number': item.partNumber,
    'Descrição': item.description,
    'NCM': item.ncm,
    'Código Produto': item.productCode,
    'Quantidade': Number(item.quantity || 0),
    'Unidade': item.unitMeasure || 'UN',
    'Preço Unit.': Number(item.unitPrice || 0),
    'Total': Number(item.total || 0),
    'Peso Líq. Unit.': Number(item.unitNetWeight || 0),
    'Peso Líq. Total': Number(item.netWeight || 0)
  }));

  const wsItems = XLSX.utils.json_to_sheet(itemsData);
  XLSX.utils.book_append_sheet(wb, wsItems, "Itens");

  XLSX.writeFile(wb, `Invoice_${data.invoiceNumber || 'Draft'}.xlsx`);
};

/**
 * Exports the InvoiceData to a PDF document using jsPDF.
 */
export const exportToPDF = (data: InvoiceData) => {
  const doc = new jsPDF();
  
  // Validation Check
  const errors = generateValidationErrors(data, { incoterms: INCOTERMS_LIST, currencies: CURRENCIES_LIST, countries: COUNTRIES_LIST });

  if (errors.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(220, 38, 38);
      doc.text("Relatório de Pendências (Art. 557)", 14, 20);
      
      const errorRows = errors.map(e => [e.field, e.message]);
      autoTable(doc, {
          head: [['Campo', 'Erro']],
          body: errorRows,
          startY: 30,
          theme: 'grid',
          headStyles: { fillColor: [220, 38, 38] }
      });
      doc.addPage();
  }

  doc.setTextColor(0, 0, 0);
  
  // Header
  doc.setFontSize(18);
  doc.text("Fatura Comercial / Packing List", 14, 20);
  
  doc.setFontSize(10);
  doc.text(`Fatura: ${data.invoiceNumber || '-'}`, 14, 30);
  doc.text(`Data: ${data.date || '-'}`, 14, 35);
  doc.text(`Incoterm: ${data.incoterm || '-'}`, 14, 40);

  // Entities
  doc.setFontSize(12);
  doc.text("Exportador", 14, 50);
  doc.setFontSize(10);
  doc.text(doc.splitTextToSize(data.exporterName || '-', 80), 14, 55);
  
  doc.setFontSize(12);
  doc.text("Importador", 110, 50);
  doc.setFontSize(10);
  doc.text(doc.splitTextToSize(data.importerName || '-', 80), 110, 55);

  // Items Table
  const tableColumn = ["PN", "Descrição", "NCM", "Qtd", "Unit.", "Total"];
  const tableRows: any[] = [];

  (data.lineItems || []).forEach(item => {
    const itemData = [
      item.partNumber || '',
      item.description || '',
      item.ncm || '',
      Number(item.quantity || 0),
      Number(item.unitPrice || 0).toFixed(2),
      Number(item.total || 0).toFixed(2),
    ];
    tableRows.push(itemData);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 80,
    styles: { fontSize: 8 },
  });

  // Footer / Totals
  // @ts-ignore
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 90;
  
  // Helper to display weight in both units (KG and LB)
  const formatDualWeight = (value: number | string | null, unit: string) => {
      const val = Number(value || 0);
      const isKg = unit === 'KG';
      
      const valKg = isKg ? val : val * 0.45359237;
      const valLb = isKg ? val * 2.20462262 : val; // Fixed: If unit is LB, valLb equals val.
      
      return `${valKg.toFixed(3)} KG  /  ${valLb.toFixed(3)} LB`;
  };

  const currentUnit = data.weightUnit || 'KG';
  
  doc.setFontSize(10);
  doc.text(`Peso Líquido Total: ${formatDualWeight(data.totalNetWeight, currentUnit)}`, 14, finalY);
  doc.text(`Peso Bruto Total: ${formatDualWeight(data.totalGrossWeight, currentUnit)}`, 14, finalY + 5);
  doc.text(`Total Geral: ${data.currency} ${Number(data.grandTotal || 0).toFixed(2)}`, 14, finalY + 10);

  doc.save(`Invoice_${data.invoiceNumber || 'Draft'}.pdf`);
};

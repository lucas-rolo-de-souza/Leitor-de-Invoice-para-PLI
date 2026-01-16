// Version: 1.08.00.02
/**
 * Type definitions for Invoice and Packing List data structures.
 * Numeric fields now accept string | null to handle intermediate UI states (e.g. "10.") without cursor jumping.
 */

/**
 * Represents a file part to be sent to Gemini.
 */
/**
 * Represents a file part to be sent to Gemini.
 */
export type FilePart = {
  mimeType: string;
  data: string; // base64 string
  filename?: string;
};

export type OnProgressCallback = (message: string) => void;

/**
 * LineItem Type
 *
 * Represents a single product or merchandise line within the Invoice.
 *
 * Key Fields:
 * - `ncm`: Nomenclature Commum du Mercosur (8 digits). Critical for Customs.
 * - `partNumber`: The buyer's SKU/Part Number.
 * - `manufacturerCode`: The code used by the manufacturer (required by PLI).
 * - `unitNetWeight` & `netWeight`: Vital for logistics validation.
 */
export type LineItem = {
  description: string;
  partNumber: string | null; // SKU / Buyer Part Number
  productCode: string | null;
  /**
   * "Detalhe da Classificação Fiscal" (NCM Description).
   * Not present in Invoice. Must be manually input.
   */
  taxClassificationDetail: string | null;

  quantity: number | string | null;
  unitMeasure: string | null;

  unitPrice: number | string | null;
  total: number | string | null;

  unitNetWeight: number | string | null;
  /**
   * PRIMARY WEIGHT FIELD FOR PLI.
   * Represents the Total Net Weight of the line item.
   * If extracted, this value takes precedence over unitNetWeight.
   */
  /**
   * PRIMARY WEIGHT FIELD FOR PLI.
   * Represents the Total Net Weight of the line item.
   * If extracted, this value takes precedence over unitNetWeight.
   */
  netWeight: number | string | null;

  /**
   * Unit of Measure for the weight (KG, LB, etc).
   * Defaults to 'KG' if not specified.
   */
  weightUnit: string | null;

  /**
   * NCM Code (Nomenclatura Comum do Mercosul).
   * Not present in Invoice. Manual Input.
   */
  ncm: string | null;

  /**
   * Internal Manufacturer Code (Código do Fabricante).
   * Manual Input.
   */
  manufacturerCode: string | null;
  /**
   * Raw Material description (Matéria Prima).
   * Manual Input.
   */
  material: string | null;
  manufacturerRef: string | null;
  manufacturerCountry: string | null;

  legalAct1Type: string | null;
  legalAct1Issuer: string | null;
  legalAct1Number: string | null;
  legalAct1Year: string | null;
  legalAct1Ex: string | null;
  legalAct1Rate: number | string | null;

  legalAct2Type: string | null;
  legalAct2Issuer: string | null;
  legalAct2Number: string | null;
  legalAct2Year: string | null;
  legalAct2Ex: string | null;
  legalAct2Rate: number | string | null;

  complementaryNote: string | null;

  attr1Level: string | null;
  attr1Name: string | null;
  attr1Value: string | null;

  attr2Level: string | null;
  attr2Name: string | null;
  attr2Value: string | null;

  attr3Level: string | null;
  attr3Name: string | null;
  attr3Value: string | null;
};

/**
 * InvoiceData Type
 *
 * The Root Aggregate for the entire invoice application state.
 *
 * Structure:
 * - **Header**: Invoice Number, Dates, PL Number.
 * - **Entities**: Exporter (Seller) and Importer (Buyer).
 * - **Logistics**: Weights, Volumes, Country of Origin.
 * - **Financials**: Totals, Currency, Incoterm, Payment Terms.
 * - **Items**: Array of `LineItem` containing the detailed merchandise.
 */
export type InvoiceData = {
  // Header
  invoiceNumber: string | null;
  packingListNumber: string | null;
  date: string | null;
  dueDate: string | null;

  exporterName: string | null;
  exporterAddress: string | null;
  importerName: string | null;
  importerAddress: string | null;

  incoterm: string | null;
  paymentTerms: string | null;
  countryOfOrigin: string | null;
  countryOfAcquisition: string | null;
  countryOfProvenance: string | null;

  totalNetWeight: number | string | null;
  totalGrossWeight: number | string | null;
  weightUnit: "KG" | "LB" | null;
  totalVolumes: number | string | null;
  volumeType: string | null;
  volumeDimensions: string | null;
  transshipment: string | null;
  portOfLoading: string | null;
  portOfDischarge: string | null;

  currency: string;
  subtotal: number | string | null;
  freight: number | string | null;
  insurance: number | string | null;
  tax: number | string | null;
  otherCharges: number | string | null;
  grandTotal: number | string | null;

  originalSubtotal?: number | null;
  originalGrandTotal?: number | null;

  lineItems: LineItem[];
};

export const initialInvoiceData: InvoiceData = {
  invoiceNumber: "",
  packingListNumber: "",
  date: "",
  dueDate: "",

  exporterName: "",
  exporterAddress: "",
  importerName: "",
  importerAddress: "",

  incoterm: "",
  paymentTerms: "",
  countryOfOrigin: "",
  countryOfAcquisition: "",
  countryOfProvenance: "",

  totalNetWeight: "",
  totalGrossWeight: "",
  weightUnit: "KG",
  totalVolumes: "",
  volumeType: "",
  volumeDimensions: "",
  transshipment: "",
  portOfLoading: "",
  portOfDischarge: "",

  currency: "USD",
  subtotal: "",
  freight: "",
  insurance: "",
  tax: "",
  otherCharges: "",
  grandTotal: "",

  lineItems: [],
};

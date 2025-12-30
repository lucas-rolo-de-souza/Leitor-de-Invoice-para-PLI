// Version: 1.08.00.02
/**
 * Type definitions for Invoice and Packing List data structures.
 * Numeric fields now accept string | null to handle intermediate UI states (e.g. "10.") without cursor jumping.
 */

/**
 * Represents a file part to be sent to Gemini.
 */
export interface FilePart {
  mimeType: string;
  data: string; // base64 string
}

export interface LineItem {
  description: string;
  partNumber: string | null;
  productCode: string | null;
  productDetail: string | null;

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
  netWeight: number | string | null;

  ncm: string | null;

  manufacturerCode: string | null;
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
}

export interface InvoiceData {
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
}

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

  currency: "USD",
  subtotal: "",
  freight: "",
  insurance: "",
  tax: "",
  otherCharges: "",
  grandTotal: "",

  lineItems: [],
};

import { z } from "zod";

// --- Value Objects ---

export const WeightUnitSchema = z.enum(["KG", "LB"]).default("KG");
export const VolumeTypeSchema = z
  .string()
  .nullable()
  .describe("Type of Volume (Pallets, Boxes, Cartons)");
export const CurrencySchema = z.enum(["USD", "EUR", "BRL"]).default("USD");

// --- Line Items ---

export const LineItemSchema = z.object({
  description: z.string().describe("Full commercial description"),
  partNumber: z.string().nullable().describe("Buyer's Part Number / SKU"),
  productCode: z
    .literal(null)
    .default(null)
    .describe("Product Code (Internal) - Forced NULL"),
  ncm: z.literal(null).default(null).describe("NCM Code - Forced NULL"),
  taxClassificationDetail: z
    .literal(null)
    .default(null)
    .describe("Detalhe da Classificação Fiscal (NCM) - Forced NULL"),

  quantity: z.number().nullable().describe("Billed quantity"),
  unitMeasure: z.string().nullable().describe("Unit of Measure (UN, PCS, etc)"),

  unitPrice: z.number().nullable().describe("Unit Price"),
  total: z.number().nullable().describe("Total Line Price"),

  unitNetWeight: z.number().nullable().describe("Unit Net Weight"),
  netWeight: z.number().nullable().describe("Total Net Weight"),
  weightUnit: z.string().nullable().describe("Weight Unit (KG, LB)"),

  manufacturer: z.string().nullable().describe("Manufacturer Name"),
});

// --- Main Invoice Schema ---
// Modeled to match the existing flat structure of generic InvoiceData in types.ts
// but with stricter validation rules where applicable.

export const InvoiceSchema = z.object({
  // Identifiers
  invoiceNumber: z.string().nullable(),
  packingListNumber: z.string().nullable(),
  date: z.string().nullable().describe("YYYY-MM-DD"),
  dueDate: z.string().nullable().describe("YYYY-MM-DD"),

  // Entities (Flat)
  exporterName: z.string().nullable(),
  exporterAddress: z.string().nullable(),
  exporterCountry: z.string().nullable().describe("ISO 3166-1 Alpha-3 Code"),

  importerName: z.string().nullable(),
  importerAddress: z.string().nullable(),
  importerTaxId: z.string().nullable(),
  importerCountry: z.string().nullable().describe("ISO 3166-1 Alpha-3 Code"),

  // Logistics (Flat)
  mode: z.enum(["AIR", "SEA", "ROAD"]).nullable(),
  portOfLoading: z.string().nullable().describe("Port/Airport of loading"),
  portOfDischarge: z.string().nullable().describe("Port/Airport of discharge"),
  vesselName: z.string().nullable(),
  mawb: z.string().nullable(),
  hawb: z.string().nullable(),
  transshipment: z
    .string()
    .nullable()
    .describe("Port/Airport of transshipment"),
  volumeDimensions: z
    .string()
    .nullable()
    .describe("Dimensions of volumes (LxWxH)"),

  totalGrossWeight: z.number().nullable(),
  totalNetWeight: z.number().nullable(),
  weightUnit: WeightUnitSchema.nullable(),
  totalVolumes: z.number().nullable(),
  volumeType: VolumeTypeSchema,

  paymentTerms: z.string().nullable(),
  incoterm: z.string().nullable(),

  // Financials (Flat)
  currency: CurrencySchema,
  subtotal: z.number().nullable(),
  freight: z.number().nullable(),
  insurance: z.number().nullable(),
  tax: z.number().nullable(),
  otherCharges: z.number().nullable(),
  grandTotal: z.number().nullable(),

  // Additional Fields from implicit types.ts requirements
  countryOfOrigin: z.string().nullable().describe("ISO Code"),
  countryOfAcquisition: z.string().nullable().describe("ISO Code"),
  countryOfProvenance: z.string().nullable().describe("ISO Code"),

  // Array
  lineItems: z.array(LineItemSchema).default([]),
});

export type Invoice = z.infer<typeof InvoiceSchema>;
export type LineItem = z.infer<typeof LineItemSchema>;

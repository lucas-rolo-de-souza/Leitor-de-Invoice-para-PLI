import { InvoiceData } from "../types";

export const mockInvoiceData: InvoiceData = {
  invoiceNumber: "INV-2024-001",
  packingListNumber: "PL-2024-001",
  date: "2024-03-15",
  dueDate: "2024-04-15",

  exporterName: "Tech Components LTD",
  exporterAddress: "123 Silicon Valley, CA, USA",
  importerName: "Brazil Imports S.A.",
  importerAddress: "Av. Paulista 1000, Sao Paulo, SP, Brazil",

  incoterm: "EXW",
  paymentTerms: "Net 30",
  countryOfOrigin: "CHN",
  countryOfAcquisition: "JPN",
  countryOfProvenance: "USA",

  totalNetWeight: 500.5,
  totalGrossWeight: 550.0,
  weightUnit: "KG",
  totalVolumes: 10,
  volumeType: "BOXES",
  volumeDimensions: "50x50x50 cm",
  transshipment: "Miami",
  portOfLoading: "Shanghai",
  portOfDischarge: "Santos",

  currency: "USD",
  subtotal: 33500.0,
  freight: 150.0,
  insurance: 50.0,
  tax: 0,
  otherCharges: 25.0,
  grandTotal: 33725.0,

  lineItems: [
    {
      description: "High Performance Processor",
      partNumber: "CPU-X99",
      productCode: "85423190",
      taxClassificationDetail: null, // Manual Input
      ncm: null, // Manual Input
      quantity: 100,
      unitMeasure: "UN",
      unitPrice: 250.0,
      total: 25000.0,
      unitNetWeight: 0.1,
      netWeight: 10.0,

      manufacturerCode: null, // Manual Input
      material: null, // Manual Input
      manufacturerRef: "REF-001",
      manufacturerCountry: "USA",

      legalAct1Type: null,
      legalAct1Issuer: null,
      legalAct1Number: null,
      legalAct1Year: null,
      legalAct1Ex: null,
      legalAct1Rate: null,

      legalAct2Type: null,
      legalAct2Issuer: null,
      legalAct2Number: null,
      legalAct2Year: null,
      legalAct2Ex: null,
      legalAct2Rate: null,

      complementaryNote: null,
      attr1Level: null,
      attr1Name: null,
      attr1Value: null,
      attr2Level: null,
      attr2Name: null,
      attr2Value: null,
      attr3Level: null,
      attr3Name: null,
      attr3Value: null,
    },
    {
      description: "Memory Module 32GB",
      partNumber: "MEM-32G",
      productCode: "84733042",
      taxClassificationDetail: "", // Manual Input (Empty String test)
      ncm: "", // Manual Input
      quantity: 100,
      unitMeasure: "UN",
      unitPrice: 85.0,
      total: 8500.0,
      unitNetWeight: 0.05,
      netWeight: 5.0,

      manufacturerCode: "", // Manual Input (Empty String test)
      material: null,
      manufacturerRef: "REF-002",
      manufacturerCountry: "CN",

      legalAct1Type: null,
      legalAct1Issuer: null,
      legalAct1Number: null,
      legalAct1Year: null,
      legalAct1Ex: null,
      legalAct1Rate: null,

      legalAct2Type: null,
      legalAct2Issuer: null,
      legalAct2Number: null,
      legalAct2Year: null,
      legalAct2Ex: null,
      legalAct2Rate: null,

      complementaryNote: null,
      attr1Level: null,
      attr1Name: null,
      attr1Value: null,
      attr2Level: null,
      attr2Name: null,
      attr2Value: null,
      attr3Level: null,
      attr3Name: null,
      attr3Value: null,
    },
  ],
};

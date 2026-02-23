import { ReferenceItem } from "../utils/validationConstants";

export const PAYMENT_TERMS_LIST: ReferenceItem[] = [
  { code: "Imediato", name: "Immediate / Cash" },
  { code: "Antecipado", name: "Advance Payment" },
  { code: "Net 7", name: "Net 7 Days" },
  { code: "Net 10", name: "Net 10 Days" },
  { code: "Net 15", name: "Net 15 Days" },
  { code: "Net 30", name: "Net 30 Days" },
  { code: "Net 45", name: "Net 45 Days" },
  { code: "Net 60", name: "Net 60 Days" },
  { code: "Net 90", name: "Net 90 Days" },
  { code: "EOM", name: "End of Month" },
  { code: "COD", name: "Cash on Delivery" },
  { code: "LC", name: "Letter of Credit" },
  { code: "T/T", name: "Telegraphic Transfer" },
  { code: "50/50", name: "50% Advance / 50% Shipment" },
];

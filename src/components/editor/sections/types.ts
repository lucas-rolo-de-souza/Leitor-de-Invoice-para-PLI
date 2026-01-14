import { InvoiceData } from "../../../types";

export type CalculatedTotals = {
  subtotal: number;
  grandTotal: number;
  totalQuantity: number;
  totalNetWeight: number;
};

export type SectionProps = {
  data: InvoiceData;
  handleChange: (
    field: keyof InvoiceData,
    value: string | number | null
  ) => void;
  errors: Record<string, string | null>;
  isReadOnly: boolean;
  calculatedTotals?: CalculatedTotals;
};

import React from "react";
import { ValidatedInput } from "../../ui/FormElements";
import { Autocomplete } from "../../ui/Autocomplete";
import { SectionProps } from "./types";
import { Calculator } from "lucide-react";
import {
  CURRENCIES_LIST,
  PAYMENT_TERMS_LIST,
} from "../../../utils/validationConstants";

export const FinancialSummary: React.FC<SectionProps> = ({
  data,
  handleChange,
  errors,
  isReadOnly,
  calculatedTotals,
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-6 border-b border-dashed border-outline-variant/30 pb-2">
        <div className="p-1.5 rounded-full bg-primary-container/30 text-primary">
          <Calculator className="w-3.5 h-3.5" />
        </div>
        <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest">
          Valores Totais
        </h4>
      </div>

      <div className="space-y-4 mb-6">
        <Autocomplete
          label="Condição Pagamento *"
          id="paymentTerms"
          options={PAYMENT_TERMS_LIST}
          value={data.paymentTerms || ""}
          onChange={(val) => handleChange("paymentTerms", val)}
          error={errors.paymentTerms}
          isReadOnly={isReadOnly}
          placeholder="Net 30..."
        />
        <Autocomplete
          label="Moeda *"
          id="currency"
          options={CURRENCIES_LIST}
          value={data.currency || ""}
          onChange={(val) => handleChange("currency", val)}
          error={errors.currency}
          isReadOnly={isReadOnly}
          placeholder="USD..."
        />
      </div>

      <div className="bg-surface-container rounded-m3-md p-4 space-y-3 border border-outline-variant/30">
        <div className="flex justify-between items-center text-xs">
          <label className="text-on-surface-variant font-bold">
            Subtotal (Calculado)
          </label>
          <div className="w-32">
            <ValidatedInput
              minimal
              type="number"
              step="any"
              // Always use the calculated total from line items
              value={calculatedTotals?.subtotal.toFixed(2) || "0.00"}
              onChange={() => {}} // Read-only
              isReadOnly={true} // Visual style
              readOnly={true} // Functional attribute
              placeholder="0.00"
              className="text-right bg-surface-container-high text-on-surface font-medium cursor-default border-transparent"
            />
          </div>
        </div>

        <div className="flex justify-between items-center text-xs">
          <label className="text-on-surface-variant">Frete (+)</label>
          <div className="w-32">
            <ValidatedInput
              minimal
              type="number"
              step="any"
              value={data.freight || ""}
              onChange={(e) => handleChange("freight", e.target.value)}
              isReadOnly={isReadOnly}
              placeholder="0.00"
              className="text-right bg-surface border-outline-variant focus:border-primary text-on-surface"
            />
          </div>
        </div>

        <div className="flex justify-between items-center text-xs">
          <label className="text-on-surface-variant">Seguro (+)</label>
          <div className="w-32">
            <ValidatedInput
              minimal
              type="number"
              step="any"
              value={data.insurance || ""}
              onChange={(e) => handleChange("insurance", e.target.value)}
              isReadOnly={isReadOnly}
              placeholder="0.00"
              className="text-right bg-surface border-outline-variant focus:border-primary text-on-surface"
            />
          </div>
        </div>

        <div className="flex justify-between items-center text-xs">
          <label className="text-on-surface-variant">Outros (+)</label>
          <div className="w-32">
            <ValidatedInput
              minimal
              type="number"
              step="any"
              value={data.otherCharges || ""}
              onChange={(e) => handleChange("otherCharges", e.target.value)}
              isReadOnly={isReadOnly}
              placeholder="0.00"
              className="text-right bg-surface border-outline-variant focus:border-primary text-on-surface"
            />
          </div>
        </div>

        <div className="border-t border-outline-variant/30 my-2 pt-3 flex justify-between items-center">
          <label className="text-sm font-bold text-on-surface">
            Total Geral
          </label>
          <div className="w-36">
            <ValidatedInput
              type="number"
              step="any"
              value={data.grandTotal || ""}
              onChange={(e) => handleChange("grandTotal", e.target.value)}
              error={errors.grandTotal}
              isReadOnly={isReadOnly}
              placeholder="0.00"
              className="text-right font-mono font-bold text-lg text-primary bg-transparent border-none focus:ring-0 px-0 h-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

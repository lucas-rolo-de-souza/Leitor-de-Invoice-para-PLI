import React from "react";
import { ValidatedInput } from "../../ui/FormElements";
import { Autocomplete } from "../../ui/Autocomplete";
import { SectionProps } from "./types";
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
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
        Valores Totais
      </h4>

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

      <div className="bg-slate-50/50 rounded-lg p-4 space-y-3 border border-slate-100">
        <div className="flex justify-between items-center text-xs">
          <label className="text-slate-500 font-bold">
            Subtotal (Calculado)
          </label>
          <div className="w-28">
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
              className="text-right bg-slate-50 text-slate-600 font-medium cursor-default"
            />
          </div>
        </div>

        <div className="flex justify-between items-center text-xs">
          <label className="text-slate-500">Frete (+)</label>
          <div className="w-28">
            <ValidatedInput
              minimal
              type="number"
              step="any"
              value={data.freight || ""}
              onChange={(e) => handleChange("freight", e.target.value)}
              isReadOnly={isReadOnly}
              placeholder="0.00"
              className="text-right bg-white"
            />
          </div>
        </div>

        <div className="flex justify-between items-center text-xs">
          <label className="text-slate-500">Seguro (+)</label>
          <div className="w-28">
            <ValidatedInput
              minimal
              type="number"
              step="any"
              value={data.insurance || ""}
              onChange={(e) => handleChange("insurance", e.target.value)}
              isReadOnly={isReadOnly}
              placeholder="0.00"
              className="text-right bg-white"
            />
          </div>
        </div>

        <div className="flex justify-between items-center text-xs">
          <label className="text-slate-500">Outros (+)</label>
          <div className="w-28">
            <ValidatedInput
              minimal
              type="number"
              step="any"
              value={data.otherCharges || ""}
              onChange={(e) => handleChange("otherCharges", e.target.value)}
              isReadOnly={isReadOnly}
              placeholder="0.00"
              className="text-right bg-white"
            />
          </div>
        </div>

        <div className="border-t border-slate-200 my-2 pt-3 flex justify-between items-center">
          <label className="text-sm font-bold text-slate-800">
            Total Geral
          </label>
          <div className="w-32">
            <ValidatedInput
              type="number"
              step="any"
              value={data.grandTotal || ""}
              onChange={(e) => handleChange("grandTotal", e.target.value)}
              error={errors.grandTotal}
              isReadOnly={isReadOnly}
              placeholder="0.00"
              className="text-right font-mono font-bold text-lg text-brand-700 bg-transparent border-none focus:ring-0 px-0 h-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

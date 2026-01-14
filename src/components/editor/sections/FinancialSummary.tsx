import React from "react";
import { ValidatedInput } from "../../ui/FormElements";
import { Autocomplete } from "../../ui/Autocomplete";
import { SectionProps } from "./types";
import { Calculator } from "lucide-react";
import {
  CURRENCIES_LIST,
  PAYMENT_TERMS_LIST,
} from "../../../utils/validationConstants";
import { SectionHeader } from "../../ui/SectionHeader";
import { useTranslation } from "../../../hooks/useTranslation";

export const FinancialSummary: React.FC<SectionProps> = ({
  data,
  handleChange,
  errors,
  isReadOnly,
  calculatedTotals,
}) => {
  const t = useTranslation();

  return (
    <div className="w-full">
      <SectionHeader
        title={t.editor.financials.title}
        icon={<Calculator className="w-3.5 h-3.5" />}
      />

      <div className="space-y-4 mb-6">
        <Autocomplete
          label={t.editor.financials.paymentTerms + " *"}
          id="paymentTerms"
          options={PAYMENT_TERMS_LIST}
          value={data.paymentTerms || ""}
          onChange={(val) => handleChange("paymentTerms", val)}
          error={errors.paymentTerms}
          isReadOnly={isReadOnly}
          placeholder="Net 30..."
        />
        <Autocomplete
          label={t.editor.financials.currency + " *"}
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
            {t.editor.financials.subtotal}
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
          <label className="text-on-surface-variant">
            {t.editor.financials.freight}
          </label>
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
          <label className="text-on-surface-variant">
            {t.editor.financials.insurance}
          </label>
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
          <label className="text-on-surface-variant">
            {t.editor.financials.others}
          </label>
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
            {t.editor.financials.grandTotal}
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

import React from "react";
import { ErrorTooltip } from "../../ui/FormElements";
import { convertWeight } from "../../../utils/converters";
import { useTranslation } from "../../../hooks/useTranslation";

type WeightInputCardProps = {
  label: string;
  value: number | string | null;
  unit: string;
  onChangeValue: (val: string) => void;
  onChangeUnit: (val: string) => void;
  error?: string | null;
  isReadOnly?: boolean;
};

export const WeightInputCard: React.FC<WeightInputCardProps> = ({
  label,
  value,
  unit,
  onChangeValue,
  onChangeUnit,
  error,
  isReadOnly,
}) => {
  const t = useTranslation();
  const currentUnit = unit || "KG";

  const preventNegativeInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "-" || e.key === "Minus") {
      e.preventDefault();
    }
  };

  return (
    <div className="space-y-1 relative group">
      <label className="text-[10px] uppercase text-on-surface-variant font-bold ml-1">
        {label}
      </label>
      {/* Weight Card */}
      <div
        className={`rounded-m3-md border overflow-visible text-on-surface transition-all duration-200 ${
          isReadOnly
            ? "bg-surface-container-highest/30 border-transparent cursor-default"
            : `bg-surface-container-high ${
                error
                  ? "border-error focus-within:ring-1 focus-within:ring-error"
                  : "border-outline-variant/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
              }`
        }`}
      >
        <div className="flex items-center px-1">
          <div className="flex-1 relative">
            <input
              type="number"
              step="any"
              min={0}
              onKeyDown={preventNegativeInput}
              value={value || ""}
              onChange={(e) => onChangeValue(e.target.value)}
              disabled={isReadOnly}
              placeholder="0.00"
              className="w-full bg-transparent border-none outline-none focus:ring-0 px-3 py-3 text-lg font-bold text-on-surface placeholder:text-on-surface-variant/30"
            />
            {error && !isReadOnly && <ErrorTooltip message={error} />}
          </div>
          <div className="border-l border-outline-variant/50">
            <select
              disabled={isReadOnly}
              title={t.editor.logistics.weightUnit}
              aria-label={t.editor.logistics.weightUnit}
              value={currentUnit}
              onChange={(e) => onChangeUnit(e.target.value)}
              className={`h-full px-3 py-2 bg-transparent text-sm font-bold text-on-surface-variant focus:bg-surface-container-highest transition-all outline-none cursor-pointer hover:text-primary ${
                isReadOnly ? "pointer-events-none" : ""
              }`}
            >
              <option value="KG" className="bg-surface text-on-surface">
                KG
              </option>
              <option value="LB" className="bg-surface text-on-surface">
                LB
              </option>
              <option value="G" className="bg-surface text-on-surface">
                G
              </option>
              <option value="OZ" className="bg-surface text-on-surface">
                OZ
              </option>
            </select>
          </div>
        </div>

        {/* Converted Value Info Bar */}
        <div className="bg-surface-container-highest/30 border-t border-outline-variant/50 px-3 py-1.5 flex justify-between items-center">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant/70 tracking-wider">
            {["KG", "LB"].includes(currentUnit)
              ? currentUnit === "KG"
                ? t.editor.logistics.inPounds
                : t.editor.logistics.inKilos
              : currentUnit === "G"
              ? "EM ONÇAS (OZ)"
              : "EM GRAMAS (G)"}
          </span>
          <span className="text-xs font-mono font-medium text-on-surface-variant">
            {value ? convertWeight(value, currentUnit).toFixed(3) : "---"}
            <span className="ml-1 text-[10px] opacity-70">
              {currentUnit === "KG"
                ? "LB"
                : currentUnit === "LB"
                ? "KG"
                : currentUnit === "G"
                ? "OZ"
                : "G"}
            </span>
          </span>
        </div>
      </div>
      {error && !isReadOnly && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 animate-fadeIn">
          <div className="bg-error text-on-error text-xs font-medium px-2 py-1.5 rounded-md shadow-lg flex items-center gap-1.5 border border-error-container">
            <span className="bg-on-error/20 p-0.5 rounded-full">!</span>
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

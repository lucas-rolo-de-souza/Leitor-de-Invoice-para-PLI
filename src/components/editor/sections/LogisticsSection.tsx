import React from "react";
import { Truck, Globe } from "lucide-react";
import { ValidatedInput } from "../../ui/FormElements";
import { Autocomplete } from "../../ui/Autocomplete";
import { SectionProps } from "./types";
import {
  INCOTERMS_LIST,
  COUNTRIES_LIST,
  VOLUME_TYPES_LIST,
} from "../../../utils/validationConstants";
import { convertWeight } from "../../../utils/converters";
import { useTranslation } from "../../../hooks/useTranslation";

export const LogisticsSection: React.FC<SectionProps> = ({
  data,
  handleChange,
  errors,
  isReadOnly,
}) => {
  const t = useTranslation();

  return (
    <section>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Logistics */}
        <div>
          <div className="flex items-center gap-2 mb-6 border-b border-dashed border-outline-variant/30 pb-2">
            <div className="p-1.5 rounded-full bg-primary-container/30 text-primary">
              <Truck className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest">
              {t.editor.logistics.sectionTitle}
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-slate-400 font-bold ml-1">
                {t.editor.logistics.netWeight}
              </label>
              {/* Net Weight Card */}
              <div className="bg-surface-container-high rounded-m3-md border border-outline-variant/50 overflow-hidden text-on-surface">
                <div className="flex items-center px-1">
                  <div className="flex-1">
                    <ValidatedInput
                      id="totalNetWeight"
                      type="number"
                      step="any"
                      value={data.totalNetWeight || ""}
                      onChange={(e) =>
                        handleChange("totalNetWeight", e.target.value)
                      }
                      error={errors.totalNetWeight}
                      isReadOnly={isReadOnly}
                      placeholder="0.00"
                      className="bg-transparent border-none focus:ring-0 px-3 py-2 text-lg font-bold text-on-surface placeholder:text-on-surface-variant/30"
                    />
                  </div>
                  <div className="border-l border-outline-variant/50">
                    <select
                      disabled={isReadOnly}
                      title={t.editor.logistics.weightUnit}
                      aria-label={t.editor.logistics.weightUnit}
                      value={data.weightUnit || "KG"}
                      onChange={(e) =>
                        handleChange("weightUnit", e.target.value)
                      }
                      className={`h-full px-3 py-2 bg-transparent text-sm font-bold text-on-surface-variant focus:bg-surface-container-highest transition-all outline-none cursor-pointer hover:text-primary ${
                        isReadOnly ? "pointer-events-none" : ""
                      }`}
                    >
                      <option value="KG">KG</option>
                      <option value="LB">LB</option>
                    </select>
                  </div>
                </div>

                {/* Converted Value Info Bar */}
                <div className="bg-surface-container-highest/30 border-t border-outline-variant/50 px-3 py-1.5 flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant/70 tracking-wider">
                    {(data.weightUnit || "KG") === "KG"
                      ? t.editor.logistics.inPounds
                      : t.editor.logistics.inKilos}
                  </span>
                  <span className="text-xs font-mono font-medium text-on-surface-variant">
                    {data.totalNetWeight
                      ? convertWeight(
                          data.totalNetWeight,
                          data.weightUnit || "KG"
                        ).toFixed(3)
                      : "---"}
                    <span className="ml-1 text-[10px] opacity-70">
                      {(data.weightUnit || "KG") === "KG" ? "LB" : "KG"}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase text-slate-400 font-bold ml-1">
                {t.editor.logistics.grossWeight}
              </label>
              {/* Gross Weight Card */}
              <div className="bg-surface-container-high rounded-m3-md border border-outline-variant/50 overflow-hidden text-on-surface">
                <div className="flex items-center px-1">
                  <div className="flex-1">
                    <ValidatedInput
                      id="totalGrossWeight"
                      type="number"
                      step="any"
                      value={data.totalGrossWeight || ""}
                      onChange={(e) =>
                        handleChange("totalGrossWeight", e.target.value)
                      }
                      error={errors.totalGrossWeight}
                      isReadOnly={isReadOnly}
                      placeholder="0.00"
                      className="bg-transparent border-none focus:ring-0 px-3 py-2 text-lg font-bold text-on-surface placeholder:text-on-surface-variant/30"
                    />
                  </div>
                  <div className="border-l border-outline-variant/50">
                    <div className="px-3 py-2 text-sm font-bold text-on-surface-variant select-none">
                      {data.weightUnit || "KG"}
                    </div>
                  </div>
                </div>

                {/* Converted Value Info Bar */}
                <div className="bg-surface-container-highest/30 border-t border-outline-variant/50 px-3 py-1.5 flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant/70 tracking-wider">
                    {(data.weightUnit || "KG") === "KG"
                      ? t.editor.logistics.inPounds
                      : t.editor.logistics.inKilos}
                  </span>
                  <span className="text-xs font-mono font-medium text-on-surface-variant">
                    {data.totalGrossWeight
                      ? convertWeight(
                          data.totalGrossWeight,
                          data.weightUnit || "KG"
                        ).toFixed(3)
                      : "---"}
                    <span className="ml-1 text-[10px] opacity-70">
                      {(data.weightUnit || "KG") === "KG" ? "LB" : "KG"}
                    </span>
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Autocomplete
                label={t.editor.logistics.volumeType}
                id="volumeType"
                options={VOLUME_TYPES_LIST}
                value={data.volumeType || ""}
                onChange={(val) => handleChange("volumeType", val)}
                error={errors.volumeType}
                isReadOnly={isReadOnly}
                placeholder={t.editor.logistics.volumeTypePlaceholder}
              />
            </div>
            <div className="space-y-1">
              <ValidatedInput
                label={t.editor.logistics.dimensions}
                id="volumeDimensions"
                value={data.volumeDimensions || ""}
                onChange={(e) =>
                  handleChange("volumeDimensions", e.target.value)
                }
                isReadOnly={isReadOnly}
                placeholder={t.editor.logistics.dimensionsPlaceholder}
              />
            </div>
            <div className="space-y-1">
              <ValidatedInput
                label={t.editor.logistics.totalVolumes}
                id="totalVolumes"
                type="number"
                step="any"
                value={data.totalVolumes || ""}
                onChange={(e) => handleChange("totalVolumes", e.target.value)}
                error={errors.totalVolumes}
                isReadOnly={isReadOnly}
                placeholder="0"
              />
            </div>

            <div className="col-span-2 mt-4 pt-4 border-t border-dashed border-outline-variant/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-full bg-primary-container/30 text-primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <h5 className="text-[11px] uppercase text-primary font-bold tracking-widest">
                  {t.editor.logistics.placesRoute}
                </h5>
              </div>

              <div className="grid grid-cols-1 gap-3 pl-1">
                <div className="grid grid-cols-2 gap-3">
                  <Autocomplete
                    label={t.editor.logistics.loadingPort}
                    id="portOfLoading"
                    options={[]} // Add relevant default ports if available
                    value={data.portOfLoading || ""}
                    onChange={(val) => handleChange("portOfLoading", val)}
                    isReadOnly={isReadOnly}
                    placeholder="Ex: Shanghai"
                  />
                  <Autocomplete
                    label={t.editor.logistics.dischargePort}
                    id="portOfDischarge"
                    options={[]} // Add relevant default ports if available
                    value={data.portOfDischarge || ""}
                    onChange={(val) => handleChange("portOfDischarge", val)}
                    isReadOnly={isReadOnly}
                    placeholder="Ex: Santos"
                  />
                </div>
                <Autocomplete
                  label={t.editor.logistics.transshipment}
                  id="transshipment"
                  options={[
                    { code: "Miami", name: "Miami" },
                    { code: "Campinas", name: "Campinas (VCP)" },
                    { code: "Guarulhos", name: "Guarulhos (GRU)" },
                    { code: "Santos", name: "Santos (SSZ)" },
                    { code: "New York", name: "New York (JFK/EWR)" },
                  ]}
                  value={data.transshipment || ""}
                  onChange={(val) => handleChange("transshipment", val)}
                  isReadOnly={isReadOnly}
                  placeholder={t.editor.logistics.transshipmentPlaceholder}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Trade Terms */}
        <div>
          <div className="flex items-center gap-2 mb-6 border-b border-dashed border-outline-variant/30 pb-2">
            <div className="p-1.5 rounded-full bg-primary-container/30 text-primary">
              <Globe className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest">
              {t.editor.logistics.tradeTerms}
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <div className="col-span-2">
              <Autocomplete
                label={t.editor.logistics.incoterm}
                id="incoterm"
                options={INCOTERMS_LIST}
                value={data.incoterm || ""}
                onChange={(val) => handleChange("incoterm", val)}
                error={errors.incoterm}
                isReadOnly={isReadOnly}
                placeholder={t.editor.logistics.incotermPlaceholder}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Autocomplete
                label={t.editor.logistics.origin}
                id="countryOfOrigin"
                options={COUNTRIES_LIST}
                value={data.countryOfOrigin || ""}
                onChange={(val) => handleChange("countryOfOrigin", val)}
                error={errors.countryOfOrigin}
                isReadOnly={isReadOnly}
                placeholder={t.editor.logistics.originPlaceholder}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Autocomplete
                label={t.editor.logistics.acquisition}
                id="countryOfAcquisition"
                options={COUNTRIES_LIST}
                value={data.countryOfAcquisition || ""}
                onChange={(val) => handleChange("countryOfAcquisition", val)}
                error={errors.countryOfAcquisition}
                isReadOnly={isReadOnly}
                placeholder={t.editor.logistics.acquisitionPlaceholder}
              />
            </div>
            <div className="col-span-2">
              <Autocomplete
                label={t.editor.logistics.provenance}
                id="countryOfProvenance"
                options={COUNTRIES_LIST}
                value={data.countryOfProvenance || ""}
                onChange={(val) => handleChange("countryOfProvenance", val)}
                error={errors.countryOfProvenance}
                isReadOnly={isReadOnly}
                placeholder={t.editor.logistics.provenancePlaceholder}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

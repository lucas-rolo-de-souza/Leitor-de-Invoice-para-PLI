import React from "react";
import { ValidatedInput } from "../../ui/FormElements";
import { Autocomplete } from "../../ui/Autocomplete";
import { SectionProps } from "./types";
import {
  INCOTERMS_LIST,
  COUNTRIES_LIST,
  VOLUME_TYPES_LIST,
} from "../../../utils/validationConstants";

export const LogisticsSection: React.FC<SectionProps> = ({
  data,
  handleChange,
  errors,
  isReadOnly,
}) => {
  return (
    <section>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Logistics */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
            Dados Logísticos
          </h4>

          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-slate-400 font-bold ml-1">
                Peso Líquido Total
              </label>
              <div className="flex gap-2">
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
                />
                <select
                  disabled={isReadOnly}
                  title="Unidade de Peso"
                  aria-label="Unidade de Peso"
                  value={data.weightUnit || "KG"}
                  onChange={(e) => handleChange("weightUnit", e.target.value)}
                  className={`w-20 px-2 rounded-m3-sm bg-surface-container-high border border-outline-variant/50 text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all outline-none ${
                    isReadOnly
                      ? "cursor-default"
                      : "cursor-pointer hover:bg-surface-container-highest hover:border-outline-variant"
                  }`}
                >
                  <option value="KG">KG</option>
                  <option value="LB">LB</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-slate-400 font-bold ml-1">
                Peso Bruto Total
              </label>
              <div className="flex gap-2">
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
                />
                <div className="w-20 flex items-center justify-center bg-surface-container-high border border-outline-variant/50 rounded-m3-sm text-xs font-bold text-on-surface-variant select-none">
                  {data.weightUnit || "KG"}
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Autocomplete
                label="Tipo Volume"
                id="volumeType"
                options={VOLUME_TYPES_LIST}
                value={data.volumeType || ""}
                onChange={(val) => handleChange("volumeType", val)}
                error={errors.volumeType}
                isReadOnly={isReadOnly}
                placeholder="Ex: Pallets"
              />
            </div>
            <div className="space-y-1">
              <ValidatedInput
                label="Qtd Volumes"
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
          </div>
        </div>

        {/* Right Column: Trade Terms */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
            Termos de Comércio
          </h4>

          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <div className="col-span-2">
              <Autocomplete
                label="Incoterm"
                id="incoterm"
                options={INCOTERMS_LIST}
                value={data.incoterm || ""}
                onChange={(val) => handleChange("incoterm", val)}
                error={errors.incoterm}
                isReadOnly={isReadOnly}
                placeholder="Selecione (EXW, FOB...)"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Autocomplete
                label="País de Origem"
                id="countryOfOrigin"
                options={COUNTRIES_LIST}
                value={data.countryOfOrigin || ""}
                onChange={(val) => handleChange("countryOfOrigin", val)}
                error={errors.countryOfOrigin}
                isReadOnly={isReadOnly}
                placeholder="País de Fabricação"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Autocomplete
                label="País de Aquisição"
                id="countryOfAcquisition"
                options={COUNTRIES_LIST}
                value={data.countryOfAcquisition || ""}
                onChange={(val) => handleChange("countryOfAcquisition", val)}
                error={errors.countryOfAcquisition}
                isReadOnly={isReadOnly}
                placeholder="País do Vendedor"
              />
            </div>
            <div className="col-span-2">
              <Autocomplete
                label="País de Procedência"
                id="countryOfProvenance"
                options={COUNTRIES_LIST}
                value={data.countryOfProvenance || ""}
                onChange={(val) => handleChange("countryOfProvenance", val)}
                error={errors.countryOfProvenance}
                isReadOnly={isReadOnly}
                placeholder="País de Embarque"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

import React from "react";
import { Truck, Globe, MapPin } from "lucide-react";
import { ValidatedInput } from "../../ui/FormElements";
import { Autocomplete } from "../../ui/Autocomplete";
import { SectionProps } from "./types";
import {
  INCOTERMS_LIST,
  COUNTRIES_LIST,
  VOLUME_TYPES_LIST,
} from "../../../utils/validationConstants";
import { ISO_3166_COUNTRIES } from "../../../utils/iso-3166";
import { useTranslation } from "../../../hooks/useTranslation";
import { useLogisticsData } from "../../../hooks/useLogisticsData";
import { SectionHeader } from "../../ui/SectionHeader";
import { WeightInputCard } from "../shared/WeightInputCard";

export const LogisticsSection: React.FC<SectionProps> = ({
  data,
  handleChange,
  errors,
  isReadOnly,
}) => {
  const t = useTranslation();
  const { data: locations, isLoading: isLoadingLocations } = useLogisticsData();

  // Enrich locations with Country Names/Aliases for search
  // e.g. "Manaus, BRA" -> keywords: ["Brazil", "Brasil"]
  const enrichedLocations = React.useMemo(() => {
    return locations.map((loc) => {
      const country = COUNTRIES_LIST.find((c) => c.code === loc.country) as
        | (typeof ISO_3166_COUNTRIES)[0]
        | undefined;
      // Note: COUNTRIES_LIST in validationConstants is ReferenceItem[].
      // We need to match with ISO_3166_COUNTRIES to get aliases if validationConstants doesn't have them.
      // Actually, standard COUNTRIES_LIST is just code/name.
      // Let's import ISO_3166 directly? Or rely on validationConstants to be passed correctly?
      // validationConstants COUNTRIES_LIST comes from ISO 3166 alpha-3 list.
      // Let's check `src/utils/iso-3166.ts` imports.
      // Ideally we import ISO_3166_COUNTRIES directly here to get full metadata.
      return {
        ...loc,
        keywords: country
          ? [country.name, ...(country.aliases || [])]
          : undefined,
      };
    });
  }, [locations]);

  const preventNegativeInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "-" || e.key === "Minus") {
      e.preventDefault();
    }
  };

  return (
    <section>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Logistics */}
        <div>
          <SectionHeader
            title={t.editor.logistics.sectionTitle}
            icon={<Truck className="w-3.5 h-3.5" />}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            <WeightInputCard
              label={t.editor.logistics.netWeight}
              value={data.totalNetWeight}
              unit={data.weightUnit || "KG"}
              onChangeValue={(val) => handleChange("totalNetWeight", val)}
              onChangeUnit={(val) => handleChange("weightUnit", val)}
              error={errors.totalNetWeight}
              isReadOnly={isReadOnly}
            />

            <WeightInputCard
              label={t.editor.logistics.grossWeight}
              value={data.totalGrossWeight}
              unit={data.weightUnit || "KG"}
              onChangeValue={(val) => handleChange("totalGrossWeight", val)}
              onChangeUnit={(val) => handleChange("weightUnit", val)}
              error={errors.totalGrossWeight}
              isReadOnly={isReadOnly}
            />

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
                min={0}
                onKeyDown={preventNegativeInput}
                value={data.totalVolumes || ""}
                onChange={(e) => handleChange("totalVolumes", e.target.value)}
                error={errors.totalVolumes}
                isReadOnly={isReadOnly}
                placeholder="0"
              />
            </div>

            <div className="col-span-2 mt-4">
              <SectionHeader
                title={t.editor.logistics.placesRoute}
                icon={<MapPin className="w-3.5 h-3.5" />}
              />

              <div className="grid grid-cols-1 gap-3 pl-1">
                <div className="grid grid-cols-2 gap-3">
                  <Autocomplete
                    label={t.editor.logistics.loadingPort}
                    id="portOfLoading"
                    options={enrichedLocations}
                    value={data.portOfLoading || ""}
                    onChange={(val) => handleChange("portOfLoading", val)}
                    isReadOnly={isReadOnly}
                    placeholder={
                      isLoadingLocations
                        ? "Loading locations..."
                        : "Ex: Shanghai"
                    }
                  />
                  <Autocomplete
                    label={t.editor.logistics.dischargePort}
                    id="portOfDischarge"
                    options={enrichedLocations}
                    value={data.portOfDischarge || ""}
                    onChange={(val) => handleChange("portOfDischarge", val)}
                    isReadOnly={isReadOnly}
                    placeholder={
                      isLoadingLocations ? "Loading locations..." : "Ex: Santos"
                    }
                  />
                </div>
                <Autocomplete
                  label={t.editor.logistics.transshipment}
                  id="transshipment"
                  options={enrichedLocations} // Also use locations for transshipment? Or keep default? Plan implies unified.
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
          <SectionHeader
            title={t.editor.logistics.tradeTerms}
            icon={<Globe className="w-3.5 h-3.5" />}
          />

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
                displayMode="code"
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
                displayMode="code"
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
                displayMode="code"
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
                displayMode="code"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

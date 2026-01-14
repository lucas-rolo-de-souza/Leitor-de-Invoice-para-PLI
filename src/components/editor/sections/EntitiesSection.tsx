import React from "react";
import { ArrowRight, MapPin, Building2 } from "lucide-react";
import { ValidatedInput, ValidatedTextArea } from "../../ui/FormElements";
import { SectionProps } from "./types";

export const EntitiesSection: React.FC<SectionProps> = ({
  data,
  handleChange,
  errors,
  isReadOnly,
}) => {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-12 relative">
      {/* Visual connector for desktop */}
      <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-surface-container-highest p-2 rounded-full border border-outline-variant/50 text-on-surface-variant shadow-sm">
        <ArrowRight className="w-4 h-4" />
      </div>

      {/* Exporter */}
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-6 border-b border-dashed border-outline-variant/30 pb-2">
          <div className="p-1.5 rounded-full bg-primary-container/30 text-primary">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest">
            Exportador (Seller)
          </h4>
        </div>

        <div className="space-y-4 flex-1">
          <ValidatedInput
            id="exporterName"
            value={data.exporterName || ""}
            onChange={(e) => handleChange("exporterName", e.target.value)}
            error={errors.exporterName}
            isReadOnly={isReadOnly}
            placeholder="Nome da Empresa Exportadora"
            className="font-bold"
          />
          <div className="relative">
            <ValidatedTextArea
              id="exporterAddress"
              value={data.exporterAddress || ""}
              onChange={(e) => handleChange("exporterAddress", e.target.value)}
              error={errors.exporterAddress}
              isReadOnly={isReadOnly}
              placeholder="Endereço completo..."
              className="pl-9 bg-slate-50/50"
            />
            <MapPin className="w-4 h-4 text-slate-300 absolute left-3 top-3" />
          </div>
        </div>
      </div>

      {/* Importer */}
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-6 border-b border-dashed border-outline-variant/30 pb-2">
          <div className="p-1.5 rounded-full bg-primary-container/30 text-primary">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest">
            Importador (Buyer)
          </h4>
        </div>

        <div className="space-y-4 flex-1">
          <ValidatedInput
            id="importerName"
            value={data.importerName || ""}
            onChange={(e) => handleChange("importerName", e.target.value)}
            error={errors.importerName}
            isReadOnly={isReadOnly}
            placeholder="Nome da Empresa Importadora"
            className="font-bold"
          />
          <div className="relative">
            <ValidatedTextArea
              id="importerAddress"
              value={data.importerAddress || ""}
              onChange={(e) => handleChange("importerAddress", e.target.value)}
              error={errors.importerAddress}
              isReadOnly={isReadOnly}
              placeholder="Endereço completo..."
              className="pl-9 bg-slate-50/50"
            />
            <MapPin className="w-4 h-4 text-slate-300 absolute left-3 top-3" />
          </div>
        </div>
      </div>
    </section>
  );
};

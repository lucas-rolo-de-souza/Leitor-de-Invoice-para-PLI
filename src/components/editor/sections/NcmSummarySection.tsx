import React, { useState } from "react";
import {
  Layers,
  Package,
  ChevronRight,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { InvoiceData } from "../../../types";
import { isValidNCM } from "../../../utils/validators";
import { ncmService } from "../../../services/ncmService";

type NcmSummaryProps = {
  data: InvoiceData;
};

export const NcmSummarySection: React.FC<NcmSummaryProps> = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Extract Unique and VALID NCMs
  const uniqueNcms: string[] = Array.from(
    new Set(
      (data.lineItems || [])
        .map((item) => item.ncm)
        .filter(
          (ncm): ncm is string => typeof ncm === "string" && isValidNCM(ncm)
        )
    )
  );

  if (uniqueNcms.length === 0) return null;

  return (
    <section className="bg-surface-container rounded-m3-xl shadow-sm border border-outline-variant/30 overflow-hidden w-full transition-all duration-200">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-surface-container-high/80 px-5 py-4 border-b border-outline-variant/30 flex items-center gap-2.5 cursor-pointer hover:bg-surface-container-highest transition-colors select-none group"
      >
        <div className="bg-surface-container p-1.5 rounded-md border border-outline-variant/30 shadow-sm group-hover:border-primary/50 transition-colors">
          <Layers className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-sm font-bold text-on-surface uppercase tracking-wide flex-1">
          Classificação Fiscal (NCMs)
        </h3>

        <div className="flex items-center gap-3">
          <span className="text-xs bg-primary-container text-primary px-2 py-0.5 rounded-full font-bold">
            {uniqueNcms.length} Códigos Únicos
          </span>
          <div className="text-on-surface-variant group-hover:text-on-surface transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-in slide-in-from-top-2 fade-in duration-200">
          {uniqueNcms.map((ncmCode, idx) => {
            const hierarchy = ncmService.getHierarchy(ncmCode);
            // Handle 9999.99.99 format manually if needed, or rely on service clean logic
            const clean = ncmCode.replace(/\D/g, "");
            const formattedCode = `${clean.slice(0, 4)}.${clean.slice(
              4,
              6
            )}.${clean.slice(6, 8)}`;

            return (
              <div
                key={idx}
                className="border border-outline-variant/30 rounded-lg p-4 bg-surface-container-low/30 hover:bg-surface-container-high hover:shadow-md transition-all"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div className="bg-primary-container text-on-primary-container font-mono font-bold text-lg px-3 py-1 rounded border border-primary/20">
                      {formattedCode}
                    </div>
                    <div className="bg-surface-container-highest p-1.5 rounded-full">
                      <Package className="w-4 h-4 text-on-surface-variant" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {hierarchy.length > 0 ? (
                      hierarchy.map((item, hIdx) => (
                        <div
                          key={hIdx}
                          className="flex items-start gap-2 text-sm"
                        >
                          <ChevronRight
                            className={`w-3.5 h-3.5 text-on-surface-variant/50 mt-1 shrink-0 ${
                              hIdx === hierarchy.length - 1
                                ? "text-primary"
                                : ""
                            }`}
                          />
                          <div className="leading-tight">
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase mr-1">
                              {item.level}:
                            </span>
                            <span
                              className={`text-on-surface text-xs ${
                                hIdx === hierarchy.length - 1 ? "font-bold" : ""
                              }`}
                            >
                              {item.description}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="text-sm font-medium">
                          Descrição não encontrada.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

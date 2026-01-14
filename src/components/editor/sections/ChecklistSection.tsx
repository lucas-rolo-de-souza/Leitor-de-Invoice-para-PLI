import React from "react";
import { ScrollText, Check, X, AlertTriangle, ArrowRight } from "lucide-react";

export type ChecklistItem = {
  id: string;
  title: string;
  status: string;
  msg: string;
  expected: string;
  details: string;
};

type ChecklistSectionProps = {
  checklist: ChecklistItem[];
};

export const ChecklistSection: React.FC<ChecklistSectionProps> = ({
  checklist,
}) => {
  const handleScrollToField = (id: string) => {
    // Map checklist IDs to DOM element IDs
    const fieldMap: Record<string, string> = {
      exporter: "exporterName",
      importer: "importerName",
      spec: "items-section", // Wrapper div in InvoiceEditor
      ncm: "items-section",
      volumes: "totalVolumes",
      gross_weight: "totalGrossWeight",
      net_weight: "totalNetWeight",
      origin: "countryOfOrigin",
      acquis: "countryOfAcquisition",
      prov: "countryOfProvenance",
      currency: "currency",
      totals: "grandTotal",
      payment: "paymentTerms",
      incoterm: "incoterm",
    };

    const targetId = fieldMap[id];
    if (targetId) {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        // Try to focus if it's an input
        if (
          element.tagName === "INPUT" ||
          element.tagName === "TEXTAREA" ||
          element.tagName === "SELECT"
        ) {
          element.focus();
        }
        // Highlight animation
        element.classList.add("ring-2", "ring-brand-500", "ring-offset-2");
        setTimeout(
          () =>
            element.classList.remove(
              "ring-2",
              "ring-brand-500",
              "ring-offset-2"
            ),
          2000
        );
      }
    }
  };

  return (
    <section className="bg-surface-container rounded-m3-xl border border-outline-variant/30 overflow-hidden">
      <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant/30 flex items-center gap-3">
        <div className="p-2 bg-secondary-container text-on-secondary-container rounded-m3-sm">
          <ScrollText className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wide">
            Relatório de Conformidade
          </h3>
          <p className="text-[10px] text-on-surface-variant font-medium">
            Validação Art. 557 Regulamento Aduaneiro
          </p>
        </div>
      </div>

      <div className="divide-y divide-outline-variant/30">
        {checklist.map((item) => (
          <div
            key={item.id}
            className="p-4 sm:px-6 flex flex-col sm:flex-row gap-4 hover:bg-surface-container-high transition-colors group"
          >
            {/* Status Icon */}
            <div
              className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center border shrink-0 ${
                item.status === "ok"
                  ? "bg-green-100 border-green-200 text-green-700"
                  : item.status === "missing"
                  ? "bg-error-container border-error/50 text-on-error-container"
                  : "bg-error-container border-error/50 text-error"
              }`}
            >
              {item.status === "ok" ? (
                <Check className="w-4 h-4" />
              ) : item.status === "missing" ? (
                <X className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <div>
                  <h4
                    className={`text-sm font-bold ${
                      item.status === "ok"
                        ? "text-on-surface"
                        : "text-on-surface"
                    }`}
                  >
                    {item.title}
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {item.msg}
                  </p>
                </div>

                {item.status !== "ok" && (
                  <button
                    onClick={() => handleScrollToField(item.id)}
                    className="self-start sm:self-center text-[10px] font-bold px-3 py-1.5 rounded-m3-full flex items-center gap-1.5 border transition-all bg-surface border-outline-variant text-primary hover:border-primary hover:bg-surface-container-highest hover:shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    Corrigir <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Diagnostic Details */}
              {item.status !== "ok" && (
                <div className="mt-3 bg-surface-container border border-outline-variant/30 rounded-m3-sm p-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-on-surface-variant mb-1">
                      Esperado
                    </span>
                    <span className="text-xs text-on-surface font-medium">
                      {item.expected}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-on-surface-variant mb-1">
                      Status Atual
                    </span>
                    <span className="text-xs text-on-surface font-mono bg-surface-container-high px-1.5 py-0.5 rounded border border-outline-variant/30 inline-block">
                      {item.details}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

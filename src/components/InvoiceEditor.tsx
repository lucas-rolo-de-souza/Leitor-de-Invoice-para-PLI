import React from "react";
import { InvoiceData } from "../types";
import { useInvoiceForm } from "../hooks/useInvoiceForm";
import { useCompliance } from "../hooks/useCompliance";
import {
  HeaderSection,
  EntitiesSection,
  LogisticsSection,
  ItemsTable,
  FinancialSummary,
  NcmSummarySection,
  ChecklistSection,
} from "./editor/sections";
import { Check, AlertCircle } from "lucide-react";

interface InvoiceEditorProps {
  data: InvoiceData;
  onChange: (data: InvoiceData) => void;
  isReadOnly?: boolean;
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({
  data: externalData,
  onChange,
  isReadOnly = false,
}) => {
  // Now using "Controlled Mode": Passing externalData and onChange directly to the hook
  const {
    data,
    handleChange,
    handleLineItemChange,
    handleNCMChange,
    addLineItem,
    duplicateLineItem,
    removeLineItem,
    calculatedTotals,
  } = useInvoiceForm(externalData, onChange, isReadOnly);

  const { fieldErrors, checklist, compliancePercentage } = useCompliance(data);

  // Read-Only Banner
  if (isReadOnly) {
    return (
      <div className="relative">
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-6 flex items-center justify-center gap-2 text-purple-700 font-bold text-sm shadow-sm">
          <Sparkles className="w-4 h-4" />
          <span>
            Visualizando extração original da Inteligência Artificial (Modo
            Leitura)
          </span>
        </div>
        {/* Render same content but disabled */}
        <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-y-auto max-h-[85vh] opacity-90 grayscale-[0.3]">
          <div className="p-8 space-y-10">
            <HeaderSection
              data={data}
              handleChange={handleChange}
              errors={{}}
              isReadOnly={true}
            />
            <div className="h-px bg-slate-100 w-full" />
            <EntitiesSection
              data={data}
              handleChange={handleChange}
              errors={{}}
              isReadOnly={true}
            />
            <div className="h-px bg-slate-100 w-full" />
            <LogisticsSection
              data={data}
              handleChange={handleChange}
              errors={{}}
              isReadOnly={true}
            />
            <div className="h-px bg-slate-100 w-full" />
            <ItemsTable
              data={data}
              onLineItemChange={handleLineItemChange}
              onNCMChange={handleNCMChange}
              onAdd={addLineItem}
              onDuplicate={duplicateLineItem}
              onRemove={removeLineItem}
              isReadOnly={true}
              calculatedTotals={calculatedTotals}
            />
            <div className="h-px bg-slate-100 w-full" />
            <div className="flex justify-end">
              <FinancialSummary
                data={data}
                handleChange={handleChange}
                errors={{}}
                isReadOnly={true}
                calculatedTotals={calculatedTotals}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Compliance Status Bar (Floating & Glass) */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/50 p-2 pl-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-[80px] z-30 transition-all mx-2 sm:mx-0">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div
            className={`flex items-center gap-2 px-3 py-1 bg-white rounded-full border ${
              compliancePercentage === 100
                ? "border-green-200 text-green-700"
                : "border-amber-200 text-amber-700"
            } w-full sm:w-auto`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                compliancePercentage === 100 ? "bg-green-500" : "bg-amber-500"
              }`}
            ></div>
            <span className="text-xs font-bold">
              {compliancePercentage}% Conforme
            </span>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto max-w-full pb-1 sm:pb-0 px-2 sm:px-0">
          {checklist.map(
            (item) =>
              item.status !== "ok" && (
                <div
                  key={item.id}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold whitespace-nowrap cursor-help hover:bg-red-100 transition-colors"
                  title={item.msg}
                >
                  <AlertCircle className="w-3 h-3" />
                  {item.title}
                </div>
              )
          )}
          {compliancePercentage === 100 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-100 text-green-700 text-[10px] font-bold">
              <Check className="w-3 h-3" /> Documento Pronto
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Document Paper */}
      <div className="bg-white rounded-none sm:rounded-3xl shadow-none sm:shadow-sm sm:border sm:border-slate-200/60 overflow-hidden relative">
        <div className="p-4 sm:p-10 space-y-12">
          {/* Header */}
          <div id="header-section" className="animate-fade-in relative">
            <div className="absolute -left-10 top-0 bottom-0 w-1 bg-brand-500 rounded-r-full opacity-0 sm:opacity-100"></div>
            <HeaderSection
              data={data}
              handleChange={handleChange}
              errors={fieldErrors}
              isReadOnly={isReadOnly}
            />
          </div>

          <div className="h-px bg-slate-100 w-full" />

          {/* Entities */}
          <div id="entities-section" className="animate-fade-in delay-100">
            <EntitiesSection
              data={data}
              handleChange={handleChange}
              errors={fieldErrors}
              isReadOnly={isReadOnly}
            />
          </div>

          <div className="h-px bg-slate-100 w-full" />

          {/* Logistics */}
          <div id="logistics-section" className="animate-fade-in delay-200">
            <LogisticsSection
              data={data}
              handleChange={handleChange}
              errors={fieldErrors}
              isReadOnly={isReadOnly}
            />
          </div>

          <div className="h-px bg-slate-100 w-full" />

          {/* Items */}
          <div id="items-section" className="animate-fade-in delay-300">
            <ItemsTable
              data={data}
              onLineItemChange={handleLineItemChange}
              onNCMChange={handleNCMChange}
              onAdd={addLineItem}
              onDuplicate={duplicateLineItem}
              onRemove={removeLineItem}
              isReadOnly={isReadOnly}
              calculatedTotals={calculatedTotals}
            />
          </div>

          {/* NCM Summary (Collapsible) */}
          <NcmSummarySection data={data} />

          <div className="h-px bg-slate-100 w-full" />

          {/* Footer / Totals */}
          <div
            className="flex flex-col md:flex-row justify-between items-end gap-8 animate-fade-in delay-500"
            id="financial-section"
          >
            <div className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
              <p className="font-medium text-slate-500 mb-1">
                Declaração de Conformidade
              </p>
              <p>Declaramos que esta fatura é verdadeira e correta.</p>
              <p className="mt-1">
                Documento processado via AI. Verifique conformidade com Art.
                557.
              </p>
            </div>
            <div className="w-full md:w-auto bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
              <FinancialSummary
                data={data}
                handleChange={handleChange}
                errors={fieldErrors}
                isReadOnly={isReadOnly}
                calculatedTotals={calculatedTotals}
              />
            </div>
          </div>

          <div className="h-px bg-slate-100 w-full" />

          {/* Validation Report Checklist */}
          <ChecklistSection checklist={checklist} />
        </div>
      </div>
    </div>
  );
};

// Simple icon for read-only view
const Sparkles = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M9 3v4" />
    <path d="M3 5h4" />
    <path d="M3 9h4" />
  </svg>
);

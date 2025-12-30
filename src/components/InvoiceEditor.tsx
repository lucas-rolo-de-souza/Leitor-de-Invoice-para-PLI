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
      {/* 1. Compliance Status Bar (Sticky) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-[72px] z-30 transition-all">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 w-full sm:w-auto">
            <div
              className={`w-2 h-2 rounded-full ${
                compliancePercentage === 100 ? "bg-green-500" : "bg-amber-500"
              }`}
            ></div>
            <span className="text-xs font-bold text-slate-700">
              {compliancePercentage}% Conforme
            </span>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto max-w-full pb-1 sm:pb-0">
          {checklist.map(
            (item) =>
              item.status !== "ok" && (
                <div
                  key={item.id}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-100 text-red-700 text-[10px] font-bold whitespace-nowrap cursor-help"
                  title={item.msg}
                >
                  <AlertCircle className="w-3 h-3" />
                  {item.title}
                </div>
              )
          )}
          {compliancePercentage === 100 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-100 text-green-700 text-[10px] font-bold">
              <Check className="w-3 h-3" /> Documento Pronto para Registro
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Document Paper */}
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden min-h-[800px] relative">
        {/* Decorative Top Border */}
        <div className="h-1 w-full bg-gradient-to-r from-slate-200 via-slate-400 to-slate-200"></div>

        <div className="p-6 sm:p-12 space-y-10">
          {/* Header */}
          <div id="header-section">
            <HeaderSection
              data={data}
              handleChange={handleChange}
              errors={fieldErrors}
              isReadOnly={isReadOnly}
            />
          </div>

          <div className="h-px bg-slate-100 w-full" />

          {/* Entities */}
          <div id="entities-section">
            <EntitiesSection
              data={data}
              handleChange={handleChange}
              errors={fieldErrors}
              isReadOnly={isReadOnly}
            />
          </div>

          <div className="h-px bg-slate-100 w-full" />

          {/* Logistics */}
          <div id="logistics-section">
            <LogisticsSection
              data={data}
              handleChange={handleChange}
              errors={fieldErrors}
              isReadOnly={isReadOnly}
            />
          </div>

          <div className="h-px bg-slate-100 w-full" />

          {/* Items */}
          <div id="items-section">
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
            className="flex flex-col md:flex-row justify-between items-end gap-8"
            id="financial-section"
          >
            <div className="text-[10px] text-slate-400 max-w-xs">
              <p>Declaramos que esta fatura é verdadeira e correta.</p>
              <p className="mt-1">
                Documento processado via AI. Verifique conformidade com Art.
                557.
              </p>
            </div>
            <div className="w-full md:w-auto">
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

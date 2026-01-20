import React, { useRef } from "react";
import { Calendar, FileText } from "lucide-react";
import { ValidatedInput } from "../../ui/FormElements";
import { SectionProps } from "./types";
import { useTranslation } from "../../../hooks/useTranslation";

export const HeaderSection: React.FC<SectionProps> = ({
  data,
  handleChange,
  errors,
  isReadOnly,
}) => {
  const t = useTranslation();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const dueDateInputRef = useRef<HTMLInputElement>(null);

  // Helper to programmatically open date picker on icon click
  const openDatePicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    if (!isReadOnly && ref.current && "showPicker" in ref.current) {
      try {
        (
          ref.current as HTMLInputElement & { showPicker: () => void }
        ).showPicker();
      } catch {
        // Fallback: Focus triggers picker on mobile, but not always on desktop
        ref.current.focus();
      }
    }
  };

  return (
    <section>
      <div className="flex items-center gap-2 mb-6 border-b border-dashed border-outline-variant/30 pb-2">
        <div className="p-1.5 rounded-full bg-primary-container/30 text-primary">
          <FileText className="w-3.5 h-3.5" />
        </div>
        <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest">
          {t.editor.header.sectionTitle}
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
        <ValidatedInput
          label={t.editor.header.invoiceNumber}
          id="invoiceNumber"
          value={data.invoiceNumber || ""}
          onChange={(e) => handleChange("invoiceNumber", e.target.value)}
          error={errors.invoiceNumber}
          isReadOnly={isReadOnly}
          placeholder="INV-0000"
          className="font-bold text-lg"
        />
        <ValidatedInput
          label={t.editor.header.packingList}
          id="packingListNumber"
          value={data.packingListNumber || ""}
          onChange={(e) => handleChange("packingListNumber", e.target.value)}
          error={errors.packingListNumber}
          isReadOnly={isReadOnly}
          placeholder="PL-0000"
        />

        <div className="relative group">
          <ValidatedInput
            label={t.editor.header.issueDate}
            id="date"
            ref={dateInputRef}
            type="date"
            value={data.date || ""}
            onChange={(e) => handleChange("date", e.target.value)}
            error={errors.date}
            isReadOnly={isReadOnly}
            className="pr-10"
          />
          <div
            onClick={() => openDatePicker(dateInputRef)}
            className={`absolute right-3 top-[34px] text-slate-400 transition-colors ${
              !isReadOnly
                ? "cursor-pointer hover:text-brand-500"
                : "pointer-events-none"
            }`}
          >
            <Calendar className="w-4 h-4" />
          </div>
        </div>

        <div className="relative group">
          <ValidatedInput
            label={t.editor.header.dueDate}
            id="dueDate"
            ref={dueDateInputRef}
            type="date"
            value={data.dueDate || ""}
            onChange={(e) => handleChange("dueDate", e.target.value)}
            error={errors.dueDate}
            isReadOnly={isReadOnly}
            className="pr-10"
          />
          <div
            onClick={() => openDatePicker(dueDateInputRef)}
            className={`absolute right-3 top-[34px] text-slate-400 transition-colors ${
              !isReadOnly
                ? "cursor-pointer hover:text-brand-500"
                : "pointer-events-none"
            }`}
          >
            <Calendar className="w-4 h-4" />
          </div>
        </div>
      </div>
    </section>
  );
};

import { useState } from "react";
import { InvoiceData } from "../types";
import { exportDocument } from "../services/exportService";
import { invoiceService } from "../services/invoiceService";
import { suggestionService } from "../services/suggestionService";
import { logger } from "../services/loggerService";

interface UseInvoiceActionsProps {
  data: InvoiceData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
  setImportModalMode: (mode: "import" | "overwrite") => void;
  setShowImportModal: (show: boolean) => void;
}

export const useInvoiceActions = ({
  data,
  user,
  t,
  setImportModalMode,
  setShowImportModal,
}: UseInvoiceActionsProps) => {
  const [isSaving, setIsSaving] = useState(false);

  const learn = () => {
    if (data.lineItems?.length) suggestionService.learnBatch(data.lineItems);
  };

  const handleExportExcel = () => {
    learn();
    exportDocument(data, "excel");
  };

  const handleExportPLIButton = () => {
    learn();
    exportDocument(data, "pli");
  };

  const handleExportPDF = () => {
    learn();
    exportDocument(data, "pdf");
  };

  const handleSaveToCloud = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await invoiceService.saveInvoice(data);
      alert(t.app?.actions?.saveSuccess || "Invoice saved to cloud!");
    } catch (err: unknown) {
      if ((err as { code?: string }).code === "LIMIT_REACHED") {
        setImportModalMode("overwrite");
        setTimeout(() => setShowImportModal(true), 0);
      } else {
        logger.error("Save failed", err);
        alert(t.app?.actions?.saveError || "Failed to save invoice.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOverwriteInvoice = async (invoice: any) => {
    setIsSaving(true);
    try {
      await invoiceService.updateInvoice(invoice.id, data);
      alert(t.app?.actions?.saveSuccess || "Invoice updated successfully!");
      setShowImportModal(false);
      setImportModalMode("import");
    } catch (err) {
      logger.error("Overwrite failed", err);
      alert(t.app?.actions?.saveError || "Failed to update invoice.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    handleExportExcel,
    handleExportPLIButton,
    handleExportPDF,
    handleSaveToCloud,
    handleOverwriteInvoice,
  };
};

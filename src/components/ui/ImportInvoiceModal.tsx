import React, { useEffect, useState } from "react";
import {
  X,
  CloudDownload,
  FileText,
  Trash2,
  RefreshCw,
  CheckSquare,
  Square,
  AlertTriangle,
  ArrowRight,
  Archive,
} from "lucide-react";
import { invoiceService } from "../../services/invoiceService";
import { InvoiceData, SavedInvoice } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import { logger } from "../../services/loggerService";

interface ImportInvoiceModalProps {
  onClose: () => void;
  onSelect: (data: InvoiceData) => void;
  onOverwrite?: (invoice: SavedInvoice) => void;
  mode?: "import" | "overwrite";
}

export const ImportInvoiceModal: React.FC<ImportInvoiceModalProps> = ({
  onClose,
  onSelect,
  onOverwrite,
  mode = "import",
}) => {
  const t = useTranslation();
  const [invoices, setInvoices] = useState<SavedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getRecentInvoices();
      setInvoices(data);
    } catch (error) {
      logger.error("Failed to fetch invoices", { error });
      alert(t.app.actions?.loadError || "Error loading invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.size} invoices?`,
      )
    )
      return;

    setIsDeleting(true);
    try {
      for (const id of selectedIds) {
        await invoiceService.deleteInvoice(id);
      }
      setSelectedIds(new Set());
      await fetchInvoices();
    } catch (error) {
      logger.error("Batch delete failed", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAll = async () => {
    if (
      !window.confirm(
        t.modals?.import?.actions?.confirmClearAll ||
          "Are you sure you want to delete ALL invoices? This cannot be undone.",
      )
    )
      return;

    setIsDeleting(true);
    try {
      await invoiceService.deleteAllInvoices();
      setInvoices([]);
      setSelectedIds(new Set());
    } catch (error) {
      logger.error("Clear all failed", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSingleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !window.confirm(
        t.modals?.import?.actions?.confirmDelete ||
          "Are you sure you want to delete this invoice?",
      )
    )
      return;

    try {
      await invoiceService.deleteInvoice(id);
      await fetchInvoices();
    } catch (error) {
      logger.error("Delete failed", error);
    }
  };

  const handleAction = (invoice: SavedInvoice) => {
    if (mode === "overwrite" && onOverwrite) {
      if (
        window.confirm(
          t.app.actions?.confirmOverwrite ||
            "Are you sure you want to overwrite this invoice? This action cannot be undone.",
        )
      ) {
        onOverwrite(invoice);
      }
    } else {
      onSelect(invoice.data);
      onClose();
    }
  };

  const isOverwrite = mode === "overwrite";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface rounded-m3-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-slide-up border border-outline-variant">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container">
          <h3 className="font-serif font-bold text-xl text-on-surface flex items-center gap-3">
            {isOverwrite ? (
              <AlertTriangle className="w-6 h-6 text-error" />
            ) : (
              <CloudDownload className="w-6 h-6 text-primary" />
            )}
            {isOverwrite
              ? t.app.actions?.saveError?.includes("Limit")
                ? "Storage Limit Reached"
                : "Overwrite Invoice"
              : t.modals?.import?.title || "Import from Cloud"}
          </h3>
          <div className="flex gap-2">
            {invoices.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={isDeleting}
                className="px-3 py-1.5 text-sm font-medium text-error hover:bg-error/10 rounded-m3-md transition-colors flex items-center gap-1.5"
              >
                <Archive className="w-4 h-4" />
                {t.modals?.import?.actions?.clearAll || "Clear All"}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-m3-full hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {isOverwrite && (
            <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-m3-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-error mb-1">Storage Full</h4>
                <p className="text-sm text-on-surface-variant">
                  You have reached the maximum limit of 3 invoices. Please
                  select an existing invoice to overwrite, or delete some
                  invoices to free up space.
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
              <RefreshCw className="w-8 h-8 animate-spin mb-3 text-primary" />
              <p>{t.modals?.import?.loading || "Loading..."}</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t.modals?.import?.empty || "No saved invoices found."}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Batch Actions Bar */}
              {selectedIds.size > 0 && (
                <div className="flex items-center justify-between bg-primary/10 px-4 py-2 rounded-m3-lg mb-4 animate-fade-in border border-primary/20">
                  <span className="text-sm font-medium text-primary">
                    {selectedIds.size} selected
                  </span>
                  <button
                    onClick={handleBatchDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-3 py-1.5 bg-error text-on-error rounded-m3-md hover:shadow-md transition-all text-sm font-bold"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t.modals?.import?.actions?.deleteSelected || "Delete"}
                  </button>
                </div>
              )}

              {/* List */}
              <ul className="space-y-2">
                {invoices.map((invoice) => {
                  const isSelected = selectedIds.has(invoice.id);
                  return (
                    <li
                      key={invoice.id}
                      className={`group flex items-center justify-between p-4 rounded-m3-lg border transition-all cursor-pointer ${
                        isOverwrite
                          ? "border-error/30 hover:border-error bg-error/5 hover:bg-error/10"
                          : isSelected
                            ? "border-primary bg-primary/5"
                            : "border-outline-variant hover:border-primary hover:bg-surface-container-high"
                      }`}
                      onClick={() => handleAction(invoice)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelect(invoice.id);
                          }}
                          className="p-1 hover:bg-on-surface/10 rounded cursor-pointer text-on-surface-variant hover:text-primary transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-primary" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </div>

                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isOverwrite
                              ? "bg-error/20 text-error"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors">
                            {invoice.data.invoiceNumber ||
                              t.app.status?.docNoNumber ||
                              "Untitled Invoice"}
                          </h4>
                          <p className="text-xs text-on-surface-variant flex items-center gap-2">
                            <span>
                              {new Date(invoice.created_at).toLocaleString()}
                            </span>
                            {isOverwrite && (
                              <span className="text-error font-bold text-[10px] uppercase border border-error/30 px-1.5 py-0.5 rounded">
                                Will be replaced
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pl-4 border-l border-outline-variant/50 ml-4">
                        {isOverwrite ? (
                          <span className="flex items-center gap-1 text-sm font-bold text-error">
                            Overwrite
                            <RefreshCw className="w-4 h-4" />
                          </span>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => handleSingleDelete(invoice.id, e)}
                              className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <span className="flex items-center gap-1 text-sm font-bold text-primary px-3 py-1.5 bg-primary/10 rounded-full group-hover:bg-primary group-hover:text-on-primary transition-colors">
                              Import
                              <ArrowRight className="w-4 h-4" />
                            </span>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Version: 1.05.00.21
import React, { useCallback } from "react";
import { Upload, FileText, Image as ImageIcon, Table } from "lucide-react";

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void;
  isLoading: boolean;
  progressMessage?: string;
}

/**
 * FileUpload Component
 *
 * Provides a drag-and-drop zone and click-to-upload interface.
 * Supports multiple file selection for batch processing (e.g. Invoice + Packing List).
 * Now supports Excel and CSV formats.
 */
export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelect,
  isLoading,
  progressMessage,
}) => {
  /**
   * Handles files dropped into the zone.
   * Prevents default browser behavior (opening file) and calls handler.
   */
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (isLoading) return; // Block interaction during processing

      const files = Array.from(e.dataTransfer.files);
      if (files && files.length > 0) {
        onFilesSelect(files);
      }
    },
    [onFilesSelect, isLoading]
  );

  /**
   * Handles files selected via the native file input dialog.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLoading) return;
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      onFilesSelect(files);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`
        relative group rounded-xl p-10 sm:p-24 text-center transition-all duration-300
        flex flex-col items-center justify-center h-full min-h-[500px]
        ${
          isLoading
            ? "bg-white/80 opacity-60 cursor-not-allowed border-2 border-slate-100"
            : "bg-white hover:bg-slate-50 cursor-pointer shadow-xl shadow-slate-200/40 border-2 border-transparent hover:border-brand-200"
        }
      `}
    >
      {/* Invisible file input covering the entire area */}
      <input
        type="file"
        onChange={handleChange}
        accept="image/*,application/pdf,.csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        multiple
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
        disabled={isLoading}
        aria-label="Upload de arquivos"
        title="Upload de arquivos"
      />

      {isLoading ? (
        <div className="flex flex-col items-center animate-fade-in w-full max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-brand-600 mb-6"></div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">
            Processando...
          </h3>
          {/* Progress Logs */}
          <div className="w-full bg-slate-900 rounded-lg p-3 shadow-inner">
            <p className="font-mono text-xs text-brand-400 animate-pulse truncate text-center">
              {progressMessage || "Iniciando..."}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center z-10 pointer-events-none">
          <div className="mb-8 p-6 bg-brand-50 rounded-full animate-bounce-slow">
            <Upload className="w-16 h-16 text-brand-600" />
          </div>

          <button className="bg-brand-600 text-white text-2xl font-bold py-5 px-10 rounded-xl shadow-lg shadow-brand-600/30 hover:bg-brand-700 hover:scale-105 transition-all duration-300 pointer-events-none mb-6">
            Selecionar Arquivos
          </button>

          <p className="text-slate-400 text-lg font-medium">
            ou arraste e solte aqui
          </p>

          <div className="mt-12 flex gap-4 opacity-50">
            <FileText className="w-8 h-8 text-slate-300" />
            <ImageIcon className="w-8 h-8 text-slate-300" />
            <Table className="w-8 h-8 text-slate-300" />
          </div>
        </div>
      )}
    </div>
  );
};

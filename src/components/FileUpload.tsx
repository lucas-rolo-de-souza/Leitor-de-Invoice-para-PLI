// Version: 1.05.00.21
import React, { useCallback } from 'react';
import { Upload, FileText, Image as ImageIcon, Files, Table } from 'lucide-react';

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void;
  isLoading: boolean;
}

/**
 * FileUpload Component
 * 
 * Provides a drag-and-drop zone and click-to-upload interface.
 * Supports multiple file selection for batch processing (e.g. Invoice + Packing List).
 * Now supports Excel and CSV formats.
 */
export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelect, isLoading }) => {
  
  /**
   * Handles files dropped into the zone.
   * Prevents default browser behavior (opening file) and calls handler.
   */
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isLoading) return; // Block interaction during processing
    
    const files = Array.from(e.dataTransfer.files);
    if (files && files.length > 0) {
      onFilesSelect(files);
    }
  }, [onFilesSelect, isLoading]);

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
        relative group border-2 border-dashed rounded-2xl p-6 sm:p-16 text-center transition-all duration-300 ease-in-out
        flex flex-col items-center justify-center h-full min-h-[350px] sm:min-h-[450px]
        ${isLoading 
          ? 'border-slate-200 bg-slate-50/50 opacity-60 cursor-not-allowed' 
          : 'border-brand-200 bg-white hover:border-brand-400 hover:bg-brand-50/30 hover:shadow-xl hover:shadow-brand-100/50 cursor-pointer'
        }
      `}
    >
      {/* Invisible file input covering the entire area */}
      <input
        type="file"
        onChange={handleChange}
        accept="image/*,application/pdf,.csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        multiple
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
        disabled={isLoading}
      />
      
      {/* Visual Icon */}
      <div className={`
        p-6 rounded-full shadow-lg mb-6 relative transition-transform duration-300
        ${isLoading ? 'bg-slate-100' : 'bg-white group-hover:scale-110 group-hover:shadow-xl'}
      `}>
        {isLoading ? (
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
        ) : (
          <>
             <div className="bg-brand-50 p-3 rounded-full">
               <Upload className="w-8 h-8 text-brand-600" />
             </div>
             <div className="absolute -right-1 -bottom-1 bg-brand-600 rounded-full p-1.5 border-4 border-white shadow-sm">
                <Files className="w-3 h-3 text-white" />
             </div>
          </>
        )}
      </div>

      <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3 tracking-tight">
        {isLoading ? 'Analisando Documentos...' : 'Upload de Documentos'}
      </h3>
      
      <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed text-sm sm:text-base">
        Arraste PDF, Imagem, Excel ou CSV aqui.<br/>
        <span className="text-xs sm:text-sm font-medium text-brand-600 bg-brand-50 px-3 py-1 rounded-full mt-2 inline-block">
          Suporte a múltiplos arquivos simultâneos
        </span>
      </p>

      <div className="flex flex-wrap justify-center gap-3 sm:gap-6 text-sm text-slate-400 font-medium">
        <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
          <FileText className="w-4 h-4 text-red-400" /> PDF
        </span>
        <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
          <ImageIcon className="w-4 h-4 text-blue-400" /> Imagem
        </span>
        <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
          <Table className="w-4 h-4 text-green-500" /> Excel/CSV
        </span>
      </div>
    </div>
  );
};
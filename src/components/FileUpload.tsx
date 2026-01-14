import React, { useCallback } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { useDropzone } from "react-dropzone";
import { FileText, Image as ImageIcon, Table, UploadCloud } from "lucide-react";

type FileUploadProps = {
  onFilesSelect: (files: File[]) => void;
  isLoading: boolean;
  progressMessage: string;
};

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelect,
  isLoading,
  progressMessage,
}) => {
  const t = useTranslation();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesSelect(acceptedFiles);
    },
    [onFilesSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isLoading,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`relative w-full max-w-2xl mx-auto min-h-[400px] flex flex-col items-center justify-center p-12 text-center rounded-[2.5rem] border-2 transition-all duration-300 cursor-pointer overflow-hidden group ${
        isDragActive
          ? "border-primary bg-primary/5 scale-[1.02] shadow-2xl shadow-primary/20"
          : "border-outline-variant/30 bg-surface-container-low hover:border-primary/50 hover:bg-surface-container"
      }`}
    >
      <input
        {...getInputProps()}
        aria-label={t.upload.dropzone.button}
        title={t.upload.dropzone.button}
      />

      {isLoading ? (
        <div className="flex flex-col items-center animate-fade-in w-full max-w-md">
          <div className="w-20 h-20 mb-8 relative">
            <div className="absolute inset-0 rounded-full border-4 border-surface-container-highest"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <UploadCloud className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-on-surface mb-2">
            {t.app.processing || "Processando..."}
          </h3>
          <div className="w-full bg-surface-container-highest rounded-full h-2 mb-4 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary animate-progress-indeterminate"></div>
          </div>
          <p className="font-mono text-xs text-primary animate-pulse truncate text-center">
            {progressMessage || t.app.starting || "Iniciando..."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center z-10 pointer-events-none">
          <div
            className={`w-24 h-24 mb-8 rounded-3xl flex items-center justify-center transition-all duration-500 ${
              isDragActive
                ? "bg-primary text-on-primary rotate-6 scale-110 shadow-xl"
                : "bg-surface-container-highest text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary group-hover:-translate-y-2"
            }`}
          >
            <UploadCloud className="w-10 h-10" />
          </div>

          <button className="bg-primary text-on-primary text-2xl font-bold py-5 px-10 rounded-m3-full shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-105 transition-all duration-300 pointer-events-none mb-6">
            {t.upload.dropzone.button}
          </button>

          <p className="text-on-surface-variant text-lg font-medium">
            {isDragActive ? t.upload.dropzone.success : t.upload.dropzone.main}
          </p>
          <p className="text-on-surface-variant/60 text-sm mt-2">
            {t.upload.dropzone.sub}
          </p>

          <div className="mt-12 flex gap-4 opacity-50 text-outline">
            <FileText className="w-8 h-8" />
            <ImageIcon className="w-8 h-8" />
            <Table className="w-8 h-8" />
          </div>
        </div>
      )}
    </div>
  );
};

import { useState } from "react";
import { InvoiceData, initialInvoiceData } from "../types";
import { processFilesToBase64 } from "../services/fileService";
import { extractInvoiceData } from "../services/geminiService";
import { formatNcmString } from "../domain/validation/ncmValidator";
import { logger } from "../services/loggerService";
import { mockInvoiceData } from "../mocks/mockInvoice";

interface UseInvoiceProcessorProps {
  apiKey: string;
  isConfigured: boolean;
  setShowSettings: (show: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}

export const useInvoiceProcessor = ({
  apiKey,
  isConfigured,
  setShowSettings,
  t,
}: UseInvoiceProcessorProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedModel, setSelectedModel] =
    useState<string>("gemini-2.5-flash");
  const [isLoading, setIsLoading] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [refreshUsage, setRefreshUsage] = useState(0);

  const [data, setData] = useState<InvoiceData>(initialInvoiceData);
  const [originalData, setOriginalData] =
    useState<InvoiceData>(initialInvoiceData);

  const sanitizeInvoiceData = (dataToSanitize: InvoiceData): InvoiceData => {
    if (!dataToSanitize.lineItems) return dataToSanitize;
    const sanitizedItems = dataToSanitize.lineItems.map((item) => ({
      ...item,
      ncm: item.ncm ? formatNcmString(item.ncm) : item.ncm,
    }));
    return { ...dataToSanitize, lineItems: sanitizedItems };
  };

  const handleFilesSelect = async (selectedFiles: File[]) => {
    if (!isConfigured) {
      setShowSettings(true);
      return;
    }
    setFiles(selectedFiles);
    setIsLoading(true);
    setError(null);
    setProgressMessage(t.app?.starting || "Iniciando...");

    try {
      const fileParts = await processFilesToBase64(selectedFiles, (msg) =>
        setProgressMessage(msg),
      );

      const modelToUse = selectedModel || "gemini-2.5-flash";

      const extractedData = await extractInvoiceData(
        fileParts,
        apiKey,
        (msg) => setProgressMessage(msg),
        modelToUse,
      );

      const sanitized = sanitizeInvoiceData(extractedData);
      setOriginalData(sanitized);
      setData(sanitized);
      setHasProcessed(true);
      setRefreshUsage((prev) => prev + 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.app?.error || "Erro";
      setError(msg);
      logger.error("Processing failed", { error: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportInvoice = (importedData: InvoiceData) => {
    const validData = { ...initialInvoiceData, ...importedData };
    const sanitizedData = sanitizeInvoiceData(validData);
    setOriginalData(sanitizedData);
    setData(sanitizedData);
    setHasProcessed(true);
    setRefreshUsage((prev) => prev + 1);
  };

  const handleReset = () => {
    if (
      window.confirm(
        t.app?.actions?.reset || "Tem certeza que deseja recomeçar?",
      )
    ) {
      const cleanData = JSON.parse(JSON.stringify(initialInvoiceData));
      setData(cleanData);
      setOriginalData(cleanData);
      setFiles([]);
      setError(null);
      setHasProcessed(false);
    }
  };

  const handleDevBypass = () => {
    setOriginalData(mockInvoiceData);
    setData(mockInvoiceData);
    setHasProcessed(true);
    setRefreshUsage((prev) => prev + 1);
  };

  const handleCreateBlank = () => {
    setOriginalData(initialInvoiceData);
    setData(initialInvoiceData);
    setHasProcessed(true);
    setRefreshUsage((prev) => prev + 1);
  };

  const handleLoadPartialData = (partialData: {
    metadata?: Record<string, unknown>;
    lineItems?: Record<string, unknown>[];
  }) => {
    const mergedData: InvoiceData = {
      ...initialInvoiceData,
      ...(partialData.metadata || {}),
      lineItems: (partialData.lineItems || []) as InvoiceData["lineItems"],
    };

    const sanitized = sanitizeInvoiceData(mergedData);
    setOriginalData(sanitized);
    setData(sanitized);
    setHasProcessed(true);
    setError(null);
    setRefreshUsage((prev) => prev + 1);

    logger.info("Loaded partial extraction data", {
      hasMetadata: !!partialData.metadata,
      lineItemCount: partialData.lineItems?.length || 0,
    });
  };

  return {
    files,
    selectedModel,
    setSelectedModel,
    isLoading,
    hasProcessed,
    error,
    progressMessage,
    refreshUsage,
    data,
    setData,
    originalData,
    handleFilesSelect,
    handleImportInvoice,
    handleReset,
    handleDevBypass,
    handleCreateBlank,
    handleLoadPartialData,
    setHasProcessed,
  };
};

import React, { useState, useMemo, useEffect } from "react";
import { FileUpload } from "./components/FileUpload";
import { InvoiceEditor } from "./components/InvoiceEditor";
import { VersionBar } from "./components/ui/VersionBar";
import { extractInvoiceData } from "./services/geminiService";
import { processFilesToBase64 } from "./services/fileService";
import { exportToExcel, exportToPDF } from "./services/exportService";
import { handlePLIExport } from "./services/PLIService";
import { generateValidationErrors } from "./utils/validators";
import { InvoiceData, initialInvoiceData } from "./types";
import {
  INCOTERMS_LIST,
  CURRENCIES_LIST,
  COUNTRIES_LIST,
} from "./utils/validationConstants";
import { ncmService } from "./services/ncmService";
import { suggestionService } from "./services/suggestionService";
import { logger } from "./services/loggerService";
import { UsageWidget } from "./components/ui/UsageWidget";
import { LegalModal } from "./components/ui/LegalModal";
import {
  FileText,
  Download,
  RotateCcw,
  AlertTriangle,
  Cpu,
  Sparkles,
  Scale,
  FileSpreadsheet,
  GitCommit,
  FileJson,
  X,
  History,
} from "lucide-react";
import { APP_VERSION, CHANGE_LOG } from "./version";

const App: React.FC = () => {
  // --- File & Processing State ---
  const [files, setFiles] = useState<File[]>([]);
  const [selectedModel, setSelectedModel] =
    useState<string>("gemini-2.5-flash");
  const [isLoading, setIsLoading] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshUsage, setRefreshUsage] = useState(0);

  // --- Data State (Simplified) ---
  const [data, setData] = useState<InvoiceData>(initialInvoiceData); // Current Editing State
  const [originalData, setOriginalData] =
    useState<InvoiceData>(initialInvoiceData); // AI Result (Immutable)

  // --- View Control ---
  const [showOriginal, setShowOriginal] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showLegal, setShowLegal] = useState(false);

  // --- Initialization ---
  useEffect(() => {
    logger.info(`App Initialized. Version: ${APP_VERSION}`);
    const initServices = async () => {
      try {
        await ncmService.init();
      } catch (e) {
        logger.error("Failed to initialize Services", e);
      }
    };
    initServices();
  }, []);

  const handleFilesSelect = async (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setIsLoading(true);
    setError(null);

    try {
      const fileParts = await processFilesToBase64(selectedFiles);
      const extractedData = await extractInvoiceData(
        fileParts,
        (msg) => logger.info(msg),
        selectedModel
      );

      setOriginalData(extractedData);
      setData(extractedData);
      setHasProcessed(true);
      setRefreshUsage((prev) => prev + 1);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erro desconhecido ao processar arquivos.";
      setError(msg);
      logger.error("Processing failed", { error: msg });
    } finally {
      setIsLoading(false);
    }
  };

  // Learning triggers
  const learn = () => {
    if (data.lineItems?.length) suggestionService.learnBatch(data.lineItems);
  };

  const handleExportExcel = () => {
    learn();
    exportToExcel(data);
  };
  // Using the new service for PLI
  const handleExportPLIButton = () => {
    learn();
    handlePLIExport(data);
  };
  const handleExportPDF = () => {
    learn();
    exportToPDF(data);
  };

  const handleReset = () => {
    if (
      window.confirm("Voltar para o início? Dados não salvos serão perdidos.")
    ) {
      const cleanData = JSON.parse(JSON.stringify(initialInvoiceData));
      setData(cleanData);
      setOriginalData(cleanData);
      setFiles([]);
      setError(null);
      setHasProcessed(false);
      setShowOriginal(false);
    }
  };

  // Active Data Logic
  const activeData = showOriginal ? originalData : data;
  const validationErrors = useMemo(
    () =>
      generateValidationErrors(activeData, {
        incoterms: INCOTERMS_LIST,
        currencies: CURRENCIES_LIST,
        countries: COUNTRIES_LIST,
      }),
    [activeData]
  );
  const isValid = validationErrors.length === 0;

  // --- Landing Screen ---
  if (!hasProcessed) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 p-2 rounded-lg">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                Leitor de Faturas AI
              </h1>
              <span className="text-[10px] font-mono text-slate-400">
                v{APP_VERSION}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-purple-500 ml-2" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 cursor-pointer pr-8"
              aria-label="Selecionar modelo de IA"
              title="Selecionar modelo de IA"
            >
              <option value="gemini-2.5-flash-lite">
                Gemini 2.5 Flash Lite
              </option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
            </select>
          </div>
        </header>

        <main className="flex-1 max-w-4xl w-full mx-auto p-8 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          {error && (
            <div className="w-full mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}
          <div className="w-full transform transition-all hover:scale-[1.01] duration-300">
            <FileUpload
              onFilesSelect={handleFilesSelect}
              isLoading={isLoading}
            />
          </div>
        </main>

        <footer className="bg-white border-t border-slate-200 py-3 px-6 flex justify-between items-center text-[10px] text-slate-400">
          <span>&copy; 2025 Invoice AI by Lucas Rolo de Souza</span>
          <UsageWidget refreshTrigger={refreshUsage} />
        </footer>
      </div>
    );
  }

  // --- Editor View ---
  return (
    <div className="min-h-screen bg-slate-100/50 flex flex-col font-sans text-slate-900">
      {/* Unified Toolbar Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex justify-between items-center sticky top-0 z-[40]">
        {/* Left Side: Back & Title (Promoted z-index to stay above centered elements) */}
        <div className="flex items-center gap-4 relative z-10">
          <button
            type="button"
            onClick={handleReset}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            title="Voltar para Upload"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-slate-200"></div>

          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              {activeData.invoiceNumber || "Documento Sem Número"}
              {!isValid && (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              )}
            </h1>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <FileText className="w-3 h-3" /> {files.length} arquivo(s)
              processado(s)
            </span>
          </div>
        </div>

        {/* Center: Version Control */}
        {/* pointer-events-none ensures this container doesn't block clicks on elements underneath (like title or back button on small screens) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="pointer-events-auto">
            {" "}
            {/* Re-enable clicks specifically for the buttons */}
            <VersionBar
              showOriginal={showOriginal}
              onToggle={setShowOriginal}
            />
          </div>
        </div>

        {/* Right: Actions (Promoted z-index) */}
        <div className="flex items-center gap-2 relative z-10">
          <div className="hidden md:flex items-center gap-2 mr-2">
            <button
              type="button"
              onClick={handleExportPDF}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
              title="PDF"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
              title="Excel (Tabela Completa)"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleExportPLIButton}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
            title="Gerar PLI Final (XLS + Validação)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />{" "}
            <span className="hidden sm:inline">Exportar PLI</span>
          </button>
        </div>
      </header>

      {/* Main Document Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-8 pb-24">
        <InvoiceEditor
          data={activeData}
          onChange={(newData) => !showOriginal && setData(newData)}
          isReadOnly={showOriginal}
        />
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 w-full bg-white border-t border-slate-200 px-6 py-2 z-[50] flex justify-between items-center text-[10px] text-slate-400">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowChangelog(true)}
            className="hover:text-slate-600 flex items-center gap-1"
          >
            <GitCommit className="w-3 h-3" /> v{APP_VERSION}
          </button>
          <button
            type="button"
            onClick={() => logger.downloadLogs()}
            className="hover:text-slate-600 flex items-center gap-1"
          >
            <FileJson className="w-3 h-3" /> Logs
          </button>
          <button
            type="button"
            onClick={() => setShowLegal(true)}
            className="hover:text-slate-600 flex items-center gap-1"
          >
            <Scale className="w-3 h-3" /> Legal
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                ncmService.getStatus().isReady ? "bg-green-500" : "bg-amber-400"
              }`}
            ></div>
            <span>NCM DB</span>
          </div>
          <div className="h-3 w-px bg-slate-200"></div>
          <UsageWidget refreshTrigger={refreshUsage} />
        </div>
      </footer>

      {/* Modals */}
      {showLegal && <LegalModal onClose={() => setShowLegal(false)} />}
      {showChangelog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4" /> Changelog
              </h3>
              <button
                type="button"
                onClick={() => setShowChangelog(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Fechar Changelog"
                title="Fechar Changelog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
              {CHANGE_LOG.map((log, i) => (
                <div
                  key={i}
                  className="pl-4 border-l-2 border-slate-100 relative"
                >
                  <div
                    className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${
                      i === 0 ? "bg-slate-900" : "bg-slate-300"
                    }`}
                  ></div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">
                    v{log.version}{" "}
                    <span className="text-slate-400 font-normal text-xs ml-2">
                      {log.date}
                    </span>
                  </h4>
                  <ul className="space-y-1">
                    {log.changes.map((c, idx) => (
                      <li key={idx} className="text-xs text-slate-600">
                        • {c}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

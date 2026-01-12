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
import { ThemeToggle } from "./components/ThemeToggle";
import { UsageWidget } from "./components/ui/UsageWidget";
import { LegalModal } from "./components/ui/LegalModal";
import { LogViewer } from "./components/ui/LogViewer";
import {
  FileText,
  Download,
  RotateCcw,
  AlertTriangle,
  Scale,
  FileSpreadsheet,
  GitCommit,
  FileJson,
  X,
  History,
} from "lucide-react";
import { APP_VERSION, CHANGE_LOG } from "./version";
import { mockInvoiceData } from "./mocks/mockInvoice";
import { Code2 } from "lucide-react";

const App: React.FC = () => {
  // --- File & Processing State ---
  const [files, setFiles] = useState<File[]>([]);
  const [selectedModel, setSelectedModel] =
    useState<string>("gemini-2.5-flash");
  const [isLoading, setIsLoading] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [refreshUsage, setRefreshUsage] = useState(0);

  // --- Data State (Simplified) ---
  const [data, setData] = useState<InvoiceData>(initialInvoiceData); // Current Editing State
  const [originalData, setOriginalData] =
    useState<InvoiceData>(initialInvoiceData); // AI Result (Immutable)

  // --- View Control ---
  const [showOriginal, setShowOriginal] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

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
    setProgressMessage("Iniciando...");

    try {
      const fileParts = await processFilesToBase64(selectedFiles, (msg) =>
        setProgressMessage(msg)
      );

      const extractedData = await extractInvoiceData(
        fileParts,
        (msg) => setProgressMessage(msg),
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

  const handleDevBypass = () => {
    setOriginalData(mockInvoiceData);
    setData(mockInvoiceData);
    setHasProcessed(true);
    setRefreshUsage((prev) => prev + 1);
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

  // --- Landing Screen (Aether Design) ---
  if (!hasProcessed) {
    return (
      <div className="min-h-screen bg-page flex flex-col font-sans text-text-primary selection:bg-brand-100 selection:text-brand-900 dark:selection:bg-brand-900 dark:selection:text-brand-100">
        {/* Glass Header */}
        {/* Solid Header (iLovePDF Style) */}
        <header className="fixed top-0 w-full z-50 bg-surface shadow-md px-8 py-4 flex justify-between items-center border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold tracking-tighter text-brand-600 flex items-center gap-2">
              <span className="bg-brand-600 text-white p-1 rounded">AI</span>
              Invoice
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-text-tertiary hidden sm:block">
              Extração Inteligente para PLI
            </span>
            <div className="h-6 w-px bg-border hidden sm:block"></div>

            <ThemeToggle />

            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-page border-none text-sm font-bold text-text-secondary rounded-lg cursor-pointer hover:bg-surface-highlight transition-colors py-2 pl-3 pr-8"
              aria-label="Selecionar modelo de IA"
            >
              <option value="gemini-2.5-flash-lite">Flash Lite 2.5</option>
              <option value="gemini-2.5-flash">Flash 2.5</option>
              <option value="gemini-2.0-flash">Flash 2.0</option>
            </select>
          </div>
        </header>

        {/* Main Content - Centered & Animated */}
        {/* Main Content - Centered & Solid */}
        <main className="flex-1 w-full max-w-5xl mx-auto p-6 flex flex-col items-center justify-center pt-32 animate-fade-in">
          <div className="flex flex-col items-center mb-12 text-center space-y-4 animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-black text-text-primary tracking-tight">
              Extração de Faturas & PLI
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl font-medium">
              Transforme seus documentos em dados estruturados instantaneamente.
            </p>
          </div>

          {error && (
            <div className="w-full max-w-2xl mb-8 bg-red-100 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-r shadow-sm flex items-center gap-3 animate-slide-up">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <span className="font-semibold text-lg">{error}</span>
            </div>
          )}

          <div className="w-full max-w-4xl transform transition-all duration-500 animate-slide-up [animation-delay:100ms]">
            <FileUpload
              onFilesSelect={handleFilesSelect}
              isLoading={isLoading}
              progressMessage={progressMessage}
            />
          </div>
        </main>

        <footer className="py-6 text-center text-[11px] text-text-tertiary border-t border-border bg-surface/30 backdrop-blur-sm">
          <div className="flex justify-center items-center gap-4 mb-2">
            <span>&copy; 2025 Invoice AI</span>
            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
            <UsageWidget refreshTrigger={refreshUsage} />

            <div className="mx-4 h-4 w-px bg-border/50"></div>

            <button
              onClick={handleDevBypass}
              className="flex items-center gap-1 text-xs text-text-tertiary hover:text-brand-600 transition-colors"
              title="Dev Mode: Bypass API"
            >
              <Code2 className="w-3 h-3" />
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // --- Editor View (Aether Design) ---
  return (
    <div className="min-h-screen bg-page flex flex-col font-sans text-text-primary selection:bg-brand-100 selection:text-brand-900">
      {/* Glass Sticky Header */}
      <header className="sticky top-0 z-[40] bg-surface/80 backdrop-blur-xl border-b border-border/60 shadow-sm transition-all">
        <div className="px-6 py-3 flex justify-between items-center max-w-screen-2xl mx-auto w-full">
          {/* Left: Nav & Context */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="relative z-50 p-2.5 rounded-xl bg-surface border border-border/50 text-text-tertiary hover:text-brand-600 hover:border-brand-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
              title="Voltar para Upload"
            >
              <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            </button>

            <div className="h-8 w-px bg-border/80 mx-1"></div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  {activeData.invoiceNumber || "Documento Sem Número"}
                </h1>
                {!isValid && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-[10px] font-bold text-amber-600 border border-amber-100">
                    <AlertTriangle className="w-3 h-3" /> Atenção
                  </span>
                )}
              </div>
              <span className="text-[11px] text-text-secondary font-medium flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-brand-400" />
                {files.length}{" "}
                {files.length === 1
                  ? "arquivo processado"
                  : "arquivos processados"}
              </span>
            </div>
          </div>

          {/* Center: Version Control (Floating Pill) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
            <div className="pointer-events-auto shadow-sm hover:shadow-md transition-shadow duration-300 rounded-full">
              <VersionBar
                showOriginal={showOriginal}
                onToggle={setShowOriginal}
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center bg-surface-highlight/50 p-1 rounded-xl border border-border/50 mr-2">
              <button
                type="button"
                onClick={handleExportPDF}
                className="p-2 hover:bg-surface rounded-lg text-text-secondary hover:text-red-500 hover:shadow-sm transition-all"
                title="Exportar PDF"
              >
                <FileText className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-border mx-1"></div>
              <button
                type="button"
                onClick={handleExportExcel}
                className="p-2 hover:bg-surface rounded-lg text-text-secondary hover:text-green-600 hover:shadow-sm transition-all"
                title="Exportar Excel"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportPLIButton}
              className="group flex items-center gap-2 bg-slate-900 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-slate-900/10 hover:shadow-brand-500/20 transition-all active:scale-95 duration-300"
            >
              <FileSpreadsheet className="w-4 h-4 group-hover:animate-bounce" />
              <span className="hidden sm:inline">Exportar PLI</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 w-full max-w-[90rem] mx-auto p-4 sm:p-6 lg:p-8 pb-32 animate-fade-in">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden min-h-[80vh]">
          <InvoiceEditor
            data={activeData}
            onChange={(newData) => !showOriginal && setData(newData)}
            isReadOnly={showOriginal}
          />
        </div>
      </main>

      {/* Functional Footer */}
      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[50]">
        <div className="flex items-center gap-1 bg-surface/90 backdrop-blur-md border border-border/60 shadow-xl shadow-slate-200/20 px-4 py-2 rounded-full text-xs font-medium text-text-secondary hover:scale-105 transition-transform duration-300 cursor-default">
          <button
            onClick={() => setShowChangelog(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-50 rounded-full transition-colors"
          >
            <GitCommit className="w-3.5 h-3.5 text-text-tertiary" />
            <span>v{APP_VERSION}</span>
          </button>

          <div className="w-px h-4 bg-slate-200"></div>

          <button
            onClick={() => setShowLogs(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-50 rounded-full transition-colors"
          >
            <FileJson className="w-3.5 h-3.5 text-text-tertiary" />
            <span>Logs</span>
          </button>

          <div className="w-px h-4 bg-slate-200"></div>

          <button
            onClick={() => setShowLegal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-50 rounded-full transition-colors"
          >
            <Scale className="w-3.5 h-3.5 text-text-tertiary" />
            <span>Legal</span>
          </button>

          <div className="w-px h-4 bg-slate-200"></div>

          <div className="flex items-center gap-2 px-3">
            <div
              className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)] ${
                ncmService.getStatus().isReady
                  ? "bg-green-500 shadow-green-500/50"
                  : "bg-amber-400"
              }`}
            ></div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary">
              DB
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showLegal && <LegalModal onClose={() => setShowLegal(false)} />}
      {showLogs && <LogViewer onClose={() => setShowLogs(false)} />}
      {showChangelog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden animate-slide-up">
            <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-surface-highlight/50">
              <h3 className="font-bold text-text-primary flex items-center gap-2">
                <History className="w-5 h-5 text-brand-500" /> Histórico de
                Versões
              </h3>
              <button
                type="button"
                onClick={() => setShowChangelog(false)}
                className="p-1 rounded-lg hover:bg-border/50 text-text-tertiary hover:text-text-secondary transition-colors"
                aria-label="Fechar histórico de versões"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
              {CHANGE_LOG.map((log, i) => (
                <div key={i} className="relative pl-6 border-l border-border">
                  <div
                    className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                      i === 0 ? "bg-brand-500" : "bg-border"
                    }`}
                  ></div>
                  <div className="mb-2">
                    <span className="text-sm font-bold text-text-primary">
                      v{log.version}
                    </span>
                    <span className="ml-2 text-xs text-text-tertiary bg-surface-highlight px-2 py-0.5 rounded-full">
                      {log.date}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {log.changes.map((c, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-text-secondary leading-relaxed flex items-start gap-2"
                      >
                        <span className="text-text-tertiary mt-1.5">•</span> {c}
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

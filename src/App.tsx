import React, { useState, useMemo, useEffect } from "react";
import { FileUpload } from "./components/FileUpload";
import { LoginScreen } from "./components/auth/LoginScreen";
import { useAuth } from "./contexts/AuthContext";
import { InvoiceEditor } from "./components/InvoiceEditor";
import { VersionBar } from "./components/ui/VersionBar";
import { extractInvoiceData } from "./services/geminiService";
import { processFilesToBase64 } from "./services/fileService";
import { exportToExcel, exportToPDF } from "./services/exportService";
import { handlePLIExport } from "./services/PLIService";
import { generateValidationErrors } from "./utils/validators";
import { InvoiceData, initialInvoiceData, SavedInvoice } from "./types";
import {
  INCOTERMS_LIST,
  CURRENCIES_LIST,
  COUNTRIES_LIST,
} from "./utils/validationConstants";
import { ncmService } from "./services/ncmService";
import { suggestionService } from "./services/suggestionService";
import { logger } from "./services/loggerService";
import { invoiceService } from "./services/invoiceService";
import { ThemeToggle } from "./components/ThemeToggle";
import { UsageWidget } from "./components/ui/UsageWidget";
import { LegalModal } from "./components/ui/LegalModal";
import { LogViewer } from "./components/ui/LogViewer";
import { LanguageSelector } from "./components/ui/LanguageSelector";
import { useLanguage } from "./contexts/TranslationContext";
import { useTranslation } from "./hooks/useTranslation";
import { ImportInvoiceModal } from "./components/ui/ImportInvoiceModal";
import { ExtractionDebugger } from "./components/debug/ExtractionDebugger";
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
  LogOut,
  Cloud,
  CloudDownload,
  Activity,
} from "lucide-react";
import { APP_VERSION, CHANGE_LOG } from "./version";
import { mockInvoiceData } from "./mocks/mockInvoice";
import { Code2, Settings } from "lucide-react";
import { useSettings } from "./contexts/SettingsContext";
import { SettingsModal } from "./components/ui/SettingsModal";

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
  const [isSaving, setIsSaving] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);

  // --- Data State (Simplified) ---
  const [data, setData] = useState<InvoiceData>(initialInvoiceData); // Current Editing State
  const [originalData, setOriginalData] =
    useState<InvoiceData>(initialInvoiceData); // AI Result (Immutable)

  // --- View Control ---
  const [showOriginal, setShowOriginal] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const { language, setLanguage } = useLanguage();
  const t = useTranslation();
  const { apiKey, isConfigured } = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importModalMode, setImportModalMode] = useState<
    "import" | "overwrite"
  >("import");

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
    if (!isConfigured) {
      setShowSettings(true);
      return;
    }
    setFiles(selectedFiles);
    setIsLoading(true);
    setError(null);
    setProgressMessage(t.app.starting);

    try {
      const fileParts = await processFilesToBase64(selectedFiles, (msg) =>
        setProgressMessage(msg),
      );

      // Use the selected model from state, default to 2.5 flash if undefined
      const modelToUse = selectedModel || "gemini-2.5-flash";

      const extractedData = await extractInvoiceData(
        fileParts,
        apiKey,
        (msg) => setProgressMessage(msg),
        modelToUse,
      );

      setOriginalData(extractedData);
      setData(extractedData);
      setHasProcessed(true);
      setRefreshUsage((prev) => prev + 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.app.error;
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

  const handleImportInvoice = (importedData: InvoiceData) => {
    // Ensure we have valid data structure before setting state
    const validData = { ...initialInvoiceData, ...importedData };
    setOriginalData(validData);
    setData(validData);
    setHasProcessed(true);
    setRefreshUsage((prev) => prev + 1);
    setShowImportModal(false);
  };

  const handleSaveToCloud = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await invoiceService.saveInvoice(data);
      alert(t.app.actions?.saveSuccess || "Invoice saved to cloud!");
    } catch (err: unknown) {
      if ((err as { code?: string }).code === "LIMIT_REACHED") {
        setImportModalMode("overwrite");
        // Use timeout to ensure state update propagates before showing modal
        setTimeout(() => setShowImportModal(true), 0);
      } else {
        logger.error("Save failed", err);
        alert(t.app.actions?.saveError || "Failed to save invoice.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleOverwriteInvoice = async (invoice: SavedInvoice) => {
    setIsSaving(true);
    try {
      await invoiceService.updateInvoice(invoice.id, data);
      alert(t.app.actions?.saveSuccess || "Invoice updated successfully!");
      setShowImportModal(false);
      setImportModalMode("import");
    } catch (err) {
      logger.error("Overwrite failed", err);
      alert(t.app.actions?.saveError || "Failed to update invoice.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm(t.app.actions.reset)) {
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
    [activeData],
  );

  const isValid = validationErrors.length === 0;

  // --- Auth Protection ---
  const { user, signOut, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  // --- Landing Screen (Premium Enterprise Design) ---
  if (!hasProcessed) {
    return (
      <div className="min-h-screen bg-surface flex flex-col font-sans text-on-surface selection:bg-primary/20 selection:text-primary">
        {/* Premium Header */}
        <header className="fixed top-0 w-full z-50 border-b border-outline-variant/10 bg-surface/80 backdrop-blur-md supports-[backdrop-filter]:bg-surface/50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-1.5 rounded-lg">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
              </div>
              <span className="text-lg font-bold tracking-tight text-on-surface">
                PLI<span className="text-primary">.ai</span>
              </span>
            </div>

            <div className="flex items-center gap-6">
              {/* Moved to footer */}

              <div className="flex items-center gap-3">
                <div className="relative group">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    title={t.app.actions.selectModel}
                    aria-label={t.app.actions.selectModel}
                    className="appearance-none bg-surface-container-low border border-outline-variant/30 text-xs font-medium text-on-surface rounded-lg cursor-pointer hover:border-primary/30 transition-all py-2 pl-3 pr-8 focus:ring-2 focus:ring-primary/10 outline-none shadow-sm"
                  >
                    <option value="gemini-2.5-flash">
                      Gemini 2.5 Flash (Recommended)
                    </option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                    <svg
                      width="8"
                      height="5"
                      viewBox="0 0 8 5"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 1L4 4L7 1"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                {user && (
                  <button
                    onClick={() => {
                      setImportModalMode("import");
                      setShowImportModal(true);
                    }}
                    className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container"
                    title={t.modals?.import?.title || "Import from Cloud"}
                  >
                    <CloudDownload className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => setShowSettings(true)}
                  className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container"
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <ThemeToggle />
                <button
                  onClick={signOut}
                  className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
                  title={t.app.actions.signOut || "Sair"}
                >
                  {t.app.actions.signOut || "Sair"}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Enterprise Hero */}
        <main className="flex-1 w-full flex flex-col justify-center items-center relative overflow-hidden pt-32 pb-20">
          {/* Subtle Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear_gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

          <div className="w-full max-w-2xl mx-auto px-6 flex flex-col items-center z-10">
            <div className="flex flex-col items-center text-center space-y-8 mb-12 animate-fade-in-up">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-bold text-on-surface tracking-tight leading-tight">
                  {t.app.headline}
                </h2>
                <p className="text-lg text-on-surface-variant/80 max-w-xl mx-auto leading-relaxed">
                  {t.app.description}
                </p>
              </div>
            </div>

            {error && (
              <div className="w-full mb-8 bg-error-container/10 border border-error/20 text-on-error-container px-4 py-3 rounded-lg shadow-sm flex items-center gap-3 animate-fade-in">
                <AlertTriangle className="w-5 h-5 text-error" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <div className="w-full transform transition-all duration-500 animate-fade-in-up [animation-delay:100ms]">
              <div className="bg-surface border border-outline-variant/30 rounded-2xl shadow-xl shadow-black/5 overflow-hidden ring-1 ring-white/20 dark:ring-white/5">
                <div className="p-1 bg-surface-container-low/50">
                  <FileUpload
                    onFilesSelect={handleFilesSelect}
                    isLoading={isLoading}
                    progressMessage={progressMessage}
                  />
                </div>
                <div className="bg-surface-container-lowest px-6 py-3 border-t border-outline-variant/10 text-center">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
                    <Scale className="w-3 h-3" />
                    {t.app.complianceBadge}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="py-6 border-t border-outline-variant/10 bg-surface-container-lowest/50">
          <div className="max-w-7xl mx-auto px-6 h-full flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-on-surface-variant">
            <div className="flex items-center gap-4">
              <span className="font-semibold">&copy; 2025 PLI.ai</span>
              <span className="hidden md:inline text-outline-variant">|</span>

              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                {t.app.status.operational}
              </span>
              <span className="hidden md:inline text-outline-variant">|</span>
              <LanguageSelector
                currentLang={language}
                onLanguageChange={setLanguage}
                placement="top"
              />
              <span className="text-outline-variant">|</span>
              <span>v{APP_VERSION}</span>

              <span className="hidden md:inline text-outline-variant">|</span>
              <UsageWidget refreshTrigger={refreshUsage} />
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={() => setShowDebugger(true)}
                className="hover:text-primary transition-colors flex items-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5" /> Debug
              </button>
              <button
                onClick={handleDevBypass}
                className="hover:text-primary transition-colors flex items-center gap-1.5"
              >
                <Code2 className="w-3.5 h-3.5" /> {t.app.actions.devConsole}
              </button>
              <a href="#" className="hover:text-primary transition-colors">
                {t.app.footer.docs}
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                {t.app.footer.support}
              </a>
            </div>
          </div>
        </footer>

        {/* Modals for Landing Screen */}
        {showDebugger && (
          <ExtractionDebugger onClose={() => setShowDebugger(false)} />
        )}
        {(!isConfigured || showSettings) && (
          <SettingsModal
            onClose={() => setShowSettings(false)}
            canClose={isConfigured}
          />
        )}
        {showImportModal && (
          <ImportInvoiceModal
            onClose={() => {
              setShowImportModal(false);
              setImportModalMode("import");
            }}
            onSelect={handleImportInvoice}
            onOverwrite={handleOverwriteInvoice}
            mode={importModalMode}
          />
        )}
        {showLegal && <LegalModal onClose={() => setShowLegal(false)} />}
        {showLogs && <LogViewer onClose={() => setShowLogs(false)} />}
        {showChangelog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface rounded-m3-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-slide-up border border-outline-variant">
              <div className="px-8 py-6 border-b border-outline-variant flex justify-between items-center bg-surface-container">
                <h3 className="font-serif font-bold text-xl text-on-surface flex items-center gap-3">
                  <History className="w-6 h-6 text-primary" />{" "}
                  {t.app.history.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowChangelog(false)}
                  className="p-2 rounded-m3-full hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors"
                  title={t.app.history.close}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 overflow-y-auto custom-scrollbar space-y-10 bg-surface">
                {CHANGE_LOG.map((log, i) => (
                  <div
                    key={i}
                    className="relative pl-8 border-l-2 border-outline-variant"
                  >
                    <div
                      className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full ring-4 ring-surface ${
                        i === 0 ? "bg-primary" : "bg-outline"
                      }`}
                    ></div>
                    <div className="mb-3">
                      <span className="text-lg font-serif font-bold text-on-surface block">
                        v{log.version}
                      </span>
                      <span className="inline-block mt-1 text-xs font-bold text-on-surface-variant bg-surface-container-high px-3 py-1 rounded-m3-full uppercase tracking-wide">
                        {log.date}
                      </span>
                    </div>
                    <ul className="space-y-3">
                      {log.changes.map((c, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-on-surface-variant leading-relaxed flex items-start gap-3"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-2 shrink-0"></span>
                          {c}
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
  }

  // --- Editor View (Aether Design) ---
  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans text-on-surface selection:bg-primary selection:text-on-primary">
      {/* Aura Sticky Header */}
      <header className="sticky top-4 z-[40] px-4 transition-all">
        <div className="bg-surface-container/90 backdrop-blur-xl border border-outline-variant/50 shadow-sm rounded-m3-full px-6 py-3 flex justify-between items-center max-w-screen-2xl mx-auto w-full">
          {/* Left: Nav & Context */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="p-3 rounded-m3-full bg-surface-container-highest text-primary hover:bg-primary hover:text-on-primary hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
              title={t.app.actions.backToUpload}
            >
              <RotateCcw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" />
            </button>

            <div className="h-8 w-px bg-outline-variant mx-2"></div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-serif font-black text-on-surface flex items-center gap-2">
                  {activeData.invoiceNumber || t.app.status.docNoNumber}
                </h1>
                {!isValid && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-m3-full bg-error-container text-[10px] font-bold text-on-error-container border border-error/10 uppercase tracking-wide">
                    <AlertTriangle className="w-3 h-3" />{" "}
                    {t.app.status.attention}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-on-surface-variant font-medium flex items-center gap-1.5 bg-surface-container-highest px-2 py-0.5 rounded-m3-sm w-fit mt-1">
                <FileText className="w-3 h-3 text-primary" />
                {files.length}{" "}
                {files.length === 1 ? t.app.status.file : t.app.status.files}
              </span>
            </div>
          </div>

          {/* Center: Version Control (Floating Pill) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:block">
            <div className="shadow-none hover:shadow-sm transition-shadow duration-300 rounded-m3-full bg-surface-container-high p-1 border border-outline-variant">
              <VersionBar
                showOriginal={showOriginal}
                onToggle={setShowOriginal}
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block flex items-center gap-2">
              <button
                onClick={signOut}
                className="ml-2 p-2 hover:bg-surface-bright rounded-m3-full text-on-surface-variant hover:text-error transition-colors"
                title={t.app.actions.signOut || "Sair"}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
            <div className="hidden md:flex items-center bg-surface-container-highest p-1.5 rounded-m3-full border border-outline-variant/30">
              <button
                type="button"
                onClick={handleSaveToCloud}
                disabled={isSaving || !hasProcessed}
                className="p-2.5 hover:bg-surface-bright rounded-m3-full text-on-surface-variant hover:text-primary hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save to Cloud"
              >
                <Cloud
                  className={`w-4 h-4 ${isSaving ? "animate-pulse" : ""}`}
                />
              </button>
              <div className="w-px h-4 bg-outline-variant mx-1"></div>
              <button
                type="button"
                onClick={handleExportPDF}
                className="p-2.5 hover:bg-surface-bright rounded-m3-full text-on-surface-variant hover:text-error hover:shadow-sm transition-all"
                title={t.app.actions.exportPDF}
                aria-label={t.app.actions.exportPDF}
              >
                <FileText className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-outline-variant mx-1"></div>
              <button
                type="button"
                onClick={handleExportExcel}
                className="p-2.5 hover:bg-surface-bright rounded-m3-full text-on-surface-variant hover:text-primary hover:shadow-sm transition-all"
                title={t.app.actions.exportExcel}
                aria-label={t.app.actions.exportExcel}
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportPLIButton}
              className="group flex items-center gap-2 bg-primary hover:bg-primary/90 text-on-primary px-6 py-3 rounded-m3-full text-xs font-bold shadow-none active:scale-95 transition-all duration-300"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">
                {t.app.actions.exportPLI}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 w-full max-w-[95rem] mx-auto p-4 sm:p-6 pb-32 animate-fade-in mt-4">
        <div className="bg-surface-container-low rounded-[2rem] shadow-none border border-outline-variant/50 overflow-hidden min-h-[80vh]">
          <InvoiceEditor
            data={activeData}
            onChange={(newData) => !showOriginal && setData(newData)}
            isReadOnly={showOriginal}
          />
        </div>
      </main>

      {/* Functional Footer - Floating Pill */}
      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[50]">
        <div className="flex items-center gap-1 bg-surface-container-highest/90 backdrop-blur-md border border-outline-variant shadow-md px-5 py-2.5 rounded-m3-full text-xs font-medium text-on-surface hover:scale-105 transition-transform duration-300 cursor-default">
          <ThemeToggle />
          <div className="w-px h-4 bg-on-surface/20"></div>
          <LanguageSelector
            currentLang={language}
            onLanguageChange={setLanguage}
            placement="top"
          />
          <div className="w-px h-4 bg-on-surface/20"></div>
          <button
            onClick={() => setShowLegal(true)}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-on-surface/10 rounded-m3-full transition-colors"
          >
            <Scale className="w-3.5 h-3.5 text-outline" />
            <span>{t.app.footer.legal}</span>
          </button>
          <div className="w-px h-4 bg-on-surface/20"></div>
          <UsageWidget refreshTrigger={refreshUsage} fullSize={true} />
          <div className="w-px h-4 bg-on-surface/20"></div>
          <button
            onClick={() => setShowLogs(true)}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-on-surface/10 rounded-m3-full transition-colors"
          >
            <FileJson className="w-3.5 h-3.5 text-outline" />
            <span>{t.app.footer.logs}</span>
          </button>
          <div className="w-px h-4 bg-on-surface/20"></div>
          <button
            onClick={() => setShowDebugger(true)}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-on-surface/10 rounded-m3-full transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-blue-500" />
            <span>Debug</span>
          </button>
          <div className="w-px h-4 bg-on-surface/20"></div>
          <div className="flex items-center gap-2 px-4">
            <div
              className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)] ${
                ncmService.getStatus().isReady ? "bg-green-400" : "bg-amber-400"
              }`}
            ></div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              {t.app.status.dbReady}
            </span>
          </div>
          <div className="w-px h-4 bg-on-surface/20"></div>
          <button
            onClick={() => setShowChangelog(true)}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-on-surface/10 rounded-m3-full transition-colors"
          >
            <GitCommit className="w-3.5 h-3.5 text-primary" />
            <span>v{APP_VERSION}</span>
          </button>
        </div>
      </footer>

      {/* Modals */}
      {showDebugger && (
        <ExtractionDebugger onClose={() => setShowDebugger(false)} />
      )}
      {(!isConfigured || showSettings) && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          canClose={isConfigured}
        />
      )}
      {showImportModal && (
        <ImportInvoiceModal
          onClose={() => {
            setShowImportModal(false);
            setImportModalMode("import");
          }}
          onSelect={handleImportInvoice}
          onOverwrite={handleOverwriteInvoice}
          mode={importModalMode}
        />
      )}
      {showLegal && <LegalModal onClose={() => setShowLegal(false)} />}
      {showLogs && <LogViewer onClose={() => setShowLogs(false)} />}
      {showChangelog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-m3-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-slide-up border border-outline-variant">
            <div className="px-8 py-6 border-b border-outline-variant flex justify-between items-center bg-surface-container">
              <h3 className="font-serif font-bold text-xl text-on-surface flex items-center gap-3">
                <History className="w-6 h-6 text-primary" />{" "}
                {t.app.history.title}
              </h3>
              <button
                type="button"
                onClick={() => setShowChangelog(false)}
                className="p-2 rounded-m3-full hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors"
                title={t.app.history.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar space-y-10 bg-surface">
              {CHANGE_LOG.map((log, i) => (
                <div
                  key={i}
                  className="relative pl-8 border-l-2 border-outline-variant"
                >
                  <div
                    className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full ring-4 ring-surface ${
                      i === 0 ? "bg-primary" : "bg-outline"
                    }`}
                  ></div>
                  <div className="mb-3">
                    <span className="text-lg font-serif font-bold text-on-surface block">
                      v{log.version}
                    </span>
                    <span className="inline-block mt-1 text-xs font-bold text-on-surface-variant bg-surface-container-high px-3 py-1 rounded-m3-full uppercase tracking-wide">
                      {log.date}
                    </span>
                  </div>
                  <ul className="space-y-3">
                    {log.changes.map((c, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-on-surface-variant leading-relaxed flex items-start gap-3"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-2 shrink-0"></span>
                        {c}
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

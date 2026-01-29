import React, { useState, useEffect } from "react";
import {
  Wrench,
  Activity,
  Trash2,
  X,
  Code2,
  Database,
  RefreshCw,
  FileText,
  Zap,
} from "lucide-react";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { useTranslation } from "../../hooks/useTranslation";
import { APP_VERSION } from "../../version";
import { UsageDashboard } from "../ui/UsageDashboard";

interface DeveloperMenuProps {
  files?: File[];
  data?: any; // Generic to avoid strict type deps for now, or import InvoiceData
  user?: any;
  showDebugger?: boolean;
  setShowDebugger?: (show: boolean) => void;
  showLogs?: boolean;
  setShowLogs?: (show: boolean) => void;
  onLoadMockData?: () => void;
  onCreateBlank?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  initialTab?: "general" | "state" | "debug" | "usage";
}

export const DeveloperMenu: React.FC<DeveloperMenuProps> = ({
  files = [],
  data,
  user,
  showDebugger,
  setShowDebugger,
  showLogs,
  setShowLogs,
  onLoadMockData,
  onCreateBlank,
  isOpen: externalIsOpen,
  onClose,
  initialTab = "general",
}) => {
  const t = useTranslation();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "general" | "state" | "debug" | "usage"
  >(initialTab);

  // Sync internal state with external prop if provided
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setInternalIsOpen(externalIsOpen);
    }
  }, [externalIsOpen]);

  // Sync active tab if initialTab changes (e.g. triggered by footer)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, externalIsOpen]);

  const handleClose = () => {
    setInternalIsOpen(false);
    if (onClose) onClose();
  };

  const handleOpen = () => {
    if (onClose) {
      // If controlled, we rely on parent to update isOpen
      // But usually we just have onClose. If we have isOpen prop we assume controlled open.
      // But for the floating button, it self-opens.
      // If externalIsOpen is provided, we can't self-open unless we have onOpen prop,
      // but here strictly speaking we can just use internal state OR external.
      // Let's assume if externalIsOpen is defined, it overrides.
      // But wait, the floating button is *inside* this component.
      // If I click it, I need to call a callback if controlled, or set local state.
      // Let's simplify: DeveloperMenu is always present.
      // If `isOpen` is passed, we respect it. But we also need to trigger it.
      // Let's rely on internal state mostly, but allow external "force open".
      setInternalIsOpen(true);
    } else {
      setInternalIsOpen(true);
    }
  };

  const { isOnline, latency, checkLatency } = useNetworkStatus();

  const handleRestoreDefaults = () => {
    if (window.confirm(t.app.devMenu.dangerZone.confirmRestore)) {
      localStorage.clear();
      window.location.reload();
    }
  };

  if (!internalIsOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-4 right-4 z-[9999] p-3 bg-surface-container-high border border-outline-variant rounded-full shadow-lg hover:shadow-xl hover:bg-surface-container-highest transition-all group"
        title={t.app.devMenu.title}
      >
        <Wrench className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
      </button>
    );
  }

  const isWide = activeTab === "usage" || activeTab === "state";

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`bg-surface-container-high rounded-2xl shadow-2xl border border-outline-variant overflow-hidden animate-scale-in flex flex-col transition-all duration-300 ${
          isWide ? "w-full max-w-5xl h-[85vh]" : "w-full max-w-lg max-h-[80vh]"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-on-surface">
              {t.app.devMenu.title}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-surface-container-highest rounded-full transition-colors"
            title={t.app.devMenu.close}
          >
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-outline-variant bg-surface-container-low">
          {[
            {
              id: "general",
              label: t.app.devMenu.tabs.general,
              icon: Activity,
            },
            { id: "debug", label: t.app.devMenu.tabs.debug, icon: Code2 },
            { id: "state", label: t.app.devMenu.tabs.state, icon: Database },
            { id: "usage", label: t.app.devMenu.tabs.usage, icon: Zap },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar bg-surface flex-1">
          {activeTab === "general" && (
            <div className="space-y-6">
              {/* Network Status Card */}
              <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/50">
                <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />{" "}
                  {t.app.devMenu.network.title}
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isOnline
                          ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                          : "bg-red-500"
                      }`}
                    ></div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-on-surface">
                        {isOnline
                          ? t.app.devMenu.network.online
                          : t.app.devMenu.network.offline}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        {t.app.devMenu.network.latency}:{" "}
                        {latency !== null
                          ? `${latency}ms`
                          : t.app.devMenu.network.checking}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => checkLatency()}
                    className="p-2 hover:bg-surface-container-highest rounded-full text-on-surface-variant transition-colors"
                    title={t.app.devMenu.network.refresh}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-error-container/10 border border-error/20 rounded-xl p-4">
                <h3 className="text-sm font-bold text-error mb-1 flex items-center gap-2">
                  {t.app.devMenu.dangerZone.title}
                </h3>
                <p className="text-xs text-on-surface-variant mb-4">
                  {t.app.devMenu.dangerZone.description}
                </p>
                <button
                  onClick={handleRestoreDefaults}
                  className="w-full flex items-center justify-center gap-2 bg-error hover:bg-error/90 text-on-error py-2.5 rounded-lg text-sm font-bold transition-all active:scale-[0.98]"
                >
                  <Trash2 className="w-4 h-4" />
                  {t.app.devMenu.dangerZone.restore}
                </button>
                {onLoadMockData && (
                  <button
                    onClick={() => {
                      onLoadMockData();
                      handleClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-surface-container-highest hover:bg-surface-container-highest/80 text-primary py-2.5 rounded-lg text-sm font-bold transition-all active:scale-[0.98] mt-2 border border-primary/20"
                  >
                    <Code2 className="w-4 h-4" />
                    {t.app.devMenu.dangerZone.loadMock}
                  </button>
                )}
                {onCreateBlank && (
                  <button
                    onClick={() => {
                      onCreateBlank();
                      handleClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-surface-container-highest hover:bg-surface-container-highest/80 text-primary py-2.5 rounded-lg text-sm font-bold transition-all active:scale-[0.98] mt-2 border border-primary/20"
                  >
                    <FileText className="w-4 h-4" />
                    {t.app.actions.createBlank}
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === "debug" && (
            <div className="space-y-4">
              <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/50">
                <h3 className="text-sm font-bold text-on-surface mb-3">
                  {t.app.devMenu.debug.tools}
                </h3>
                <div className="space-y-2">
                  {setShowDebugger && (
                    <div className="flex items-center justify-between p-2 hover:bg-surface-container-highest/50 rounded-lg transition-colors">
                      <span className="text-sm text-on-surface-variant">
                        {t.app.devMenu.debug.extractionDebugger}
                      </span>
                      <button
                        onClick={() => setShowDebugger(!showDebugger)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${showDebugger ? "bg-primary" : "bg-surface-container-highest"}`}
                        title={t.app.devMenu.debug.toggleDebugger}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showDebugger ? "translate-x-6" : "translate-x-1"}`}
                        />
                      </button>
                    </div>
                  )}
                  {setShowLogs && (
                    <div className="flex items-center justify-between p-2 hover:bg-surface-container-highest/50 rounded-lg transition-colors">
                      <span className="text-sm text-on-surface-variant">
                        {t.app.devMenu.debug.systemLogs}
                      </span>
                      <button
                        onClick={() => setShowLogs(!showLogs)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${showLogs ? "bg-primary" : "bg-surface-container-highest"}`}
                        title={t.app.devMenu.debug.toggleLogs}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showLogs ? "translate-x-6" : "translate-x-1"}`}
                        />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "state" && (
            <div className="space-y-4">
              <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/50">
                <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" />{" "}
                  {t.app.devMenu.state.title}
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm py-1 border-b border-outline-variant/30">
                    <span className="text-on-surface-variant">
                      {t.app.devMenu.state.userAuth}
                    </span>
                    <span
                      className={`font-mono font-bold ${user ? "text-green-500" : "text-amber-500"}`}
                    >
                      {user ? t.app.devMenu.state.yes : t.app.devMenu.state.no}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm py-1 border-b border-outline-variant/30">
                    <span className="text-on-surface-variant">
                      {t.app.devMenu.state.filesLoaded}
                    </span>
                    <span className="font-mono font-bold text-on-surface">
                      {files.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm py-1 border-b border-outline-variant/30">
                    <span className="text-on-surface-variant">
                      {t.app.devMenu.state.dataPresent}
                    </span>
                    <span
                      className={`font-mono font-bold ${data && data.lineItems ? "text-green-500" : "text-on-surface-variant"}`}
                    >
                      {data && data.lineItems
                        ? t.app.devMenu.state.yes
                        : t.app.devMenu.state.no}
                    </span>
                  </div>
                  {data && data.lineItems && (
                    <div className="flex justify-between text-sm py-1 border-b border-outline-variant/30">
                      <span className="text-on-surface-variant">
                        {t.app.devMenu.state.lineItems}
                      </span>
                      <span className="font-mono font-bold text-on-surface">
                        {data.lineItems.length}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    {t.app.devMenu.state.rawData}
                  </h4>
                  <pre className="bg-surface-container-high p-3 rounded-lg text-[10px] text-on-surface font-mono overflow-auto max-h-40 custom-scrollbar">
                    {JSON.stringify(
                      {
                        files: files.map((f) => f.name),
                        user: user?.email,
                        dataSummary: data
                          ? t.app.devMenu.state.invoiceData
                          : "null",
                      },
                      null,
                      2,
                    )}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === "usage" && <UsageDashboard />}
        </div>

        {/* Footer */}
        <div className="p-3 bg-surface-container-low border-t border-outline-variant/50 text-center">
          <span className="text-[10px] text-on-surface-variant font-mono">
            {t.app.devMenu.footer} • v{APP_VERSION}
          </span>
        </div>
      </div>
    </div>
  );
};

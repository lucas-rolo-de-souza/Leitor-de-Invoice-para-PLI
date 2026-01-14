import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  usageService,
  SessionStats,
  UsageLog,
} from "../../services/usageService";
import {
  Activity,
  X,
  DollarSign,
  Clock,
  Zap,
  Server,
  History,
  Fingerprint,
  Trash2,
  Search,
} from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";

type UsageWidgetProps = {
  refreshTrigger: number; // Increment to force refresh
  fullSize?: boolean; // If true, opens as a large/fullscreen modal
};

/**
 * UsageWidget Component
 *
 * Displays AI consumption metrics (Cost, Tokens, Latency) for the current session.
 *
 * Features:
 * - **Footer Button**: Shows real-time estimated cost and token usage.
 * - **Modal**: Detailed view with historical logs and filtering.
 * - **React Portal**: Uses `createPortal` to render the modal at the document body level,
 *   bypassing parent stacking contexts (like the footer's fixed position) to allow
 *   true full-screen display without clipping.
 */
export const UsageWidget: React.FC<UsageWidgetProps> = ({
  refreshTrigger,
  fullSize = false,
}) => {
  const t = useTranslation();
  // We default to "Current Session" stats
  const [stats, setStats] = useState<SessionStats>(
    usageService.getCurrentSessionStats()
  );
  const [lifetimeStats, setLifetimeStats] = useState<SessionStats>(
    usageService.getLifetimeStats()
  );

  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"current" | "all">("current");
  const [searchTerm, setSearchTerm] = useState("");
  const [logs, setLogs] = useState<UsageLog[]>([]);

  // Fetch stats and logs
  useEffect(() => {
    setStats(usageService.getCurrentSessionStats());
    setLifetimeStats(usageService.getLifetimeStats());
    setLogs(usageService.getLogs(viewMode));
  }, [refreshTrigger, isOpen, viewMode]);

  const handleClearHistory = () => {
    if (confirm("Tem certeza que deseja apagar todo o histórico de uso?")) {
      usageService.clear();
      setStats(usageService.getCurrentSessionStats());
      setLifetimeStats(usageService.getLifetimeStats());
      setLogs([]);
    }
  };

  const filteredLogs = useMemo(() => {
    if (!searchTerm) return logs;
    const lower = searchTerm.toLowerCase();
    return logs.filter(
      (l) =>
        l.model.toLowerCase().includes(lower) ||
        l.sessionId.toLowerCase().includes(lower)
    );
  }, [logs, searchTerm]);

  if (!stats) return null;

  // Footer Display (Always Current Session)
  const currentCost = stats.totalCost;
  const currentBrl = stats.totalCostInBrl;
  const formattedCurrentBrl = currentBrl.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  // Modal Display (Depends on View Mode)
  const activeStats = viewMode === "current" ? stats : lifetimeStats;
  const activeCost = activeStats.totalCost;
  const activeBrl = activeStats.totalCostInBrl;
  const formattedActiveBrl = activeBrl.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 4,
  });

  return (
    <>
      {/* Footer Trigger Button - Shows Current Session Totals */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 text-[10px] font-medium text-on-surface-variant hover:text-primary transition-colors px-3 py-1 rounded-full hover:bg-primary-container group border border-transparent hover:border-primary/20"
        title={`${t.app.usage.currentSession}: ${stats.sessionId}\n${t.app.usage.stats.estimated}: ${formattedCurrentBrl}`}
      >
        <div className="bg-surface-container group-hover:bg-surface p-1 rounded-full transition-colors">
          <Activity className="w-3 h-3" />
        </div>
        <span className="font-mono">${currentCost.toFixed(4)}</span>
        <span className="opacity-30 mx-3">|</span>
        <span className="ml-0.5">
          {(stats.totalInputTokens + stats.totalOutputTokens).toLocaleString()}{" "}
          tokens
        </span>
      </button>

      {/* 
        Modal - Rendered via Portal
        
        Why Portal?
        The UsageWidget is often embedded inside the Footer or other containers with 
        `fixed` or `sticky` positioning and `overflow: hidden`. This creates a new 
        Stacking Context that clamps the modal's size to the parent.
        
        By portaling to `document.body`, we break out of this context, allowing the 
        modal to use `w-full h-full` relative to the viewport, ensuring a true 
        full-screen experience.
      */}
      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
              className={`bg-surface-container-high rounded-m3-xl shadow-2xl flex flex-col border border-outline-variant ring-4 ring-black/5 dark:ring-white/5 overflow-hidden transition-all duration-300 ${
                fullSize ? "w-full h-full" : "w-full max-w-4xl max-h-[90vh]"
              }`}
            >
              {/* Header */}
              <div className="bg-surface-container-high px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary-container text-on-primary-container rounded-xl shadow-sm ring-1 ring-black/5">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface flex items-center gap-2 text-lg">
                      {t.app.usage.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant font-medium">
                      {t.app.usage.subtitle}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-surface-container-highest rounded-full transition-colors text-on-surface-variant hover:text-on-surface"
                    title={t.app.usage.close}
                    aria-label={t.app.usage.close}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Control Bar */}
              <div className="bg-surface-container px-6 py-3 border-b border-outline-variant/30 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                {/* View Toggle */}
                {/* View Toggle */}
                <div className="flex bg-surface-container-highest/60 p-1 rounded-lg w-full sm:w-auto">
                  <button
                    onClick={() => setViewMode("current")}
                    className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all shadow-sm ${
                      viewMode === "current"
                        ? "bg-primary-container text-on-primary-container shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/50 shadow-none"
                    }`}
                  >
                    {t.app.usage.currentSession}
                  </button>
                  <button
                    onClick={() => setViewMode("all")}
                    className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all shadow-sm ${
                      viewMode === "all"
                        ? "bg-primary-container text-on-primary-container shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/50 shadow-none"
                    }`}
                  >
                    {t.app.usage.allHistory}
                  </button>
                </div>

                {/* Search & Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={t.app.usage.filter}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-outline-variant/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface placeholder-on-surface-variant/50"
                    />
                  </div>
                  {viewMode === "all" && (
                    <button
                      onClick={handleClearHistory}
                      className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-colors"
                      title={t.app.usage.clear}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-surface-container-low/50">
                {/* Session ID Banner (Only Current) */}
                {viewMode === "current" && (
                  <div className="bg-primary-container/30 px-6 py-2 border-b border-primary/20 flex items-center justify-center sm:justify-start gap-2 text-[10px] text-primary font-mono shrink-0">
                    <Fingerprint className="w-3 h-3" />
                    <span className="opacity-70">SESSION ID:</span>
                    <span className="font-bold">
                      {usageService.getSessionId()}
                    </span>
                  </div>
                )}

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-outline-variant/30">
                  <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 shadow-sm relative overflow-hidden group hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-2 text-on-surface-variant text-[10px] font-bold uppercase mb-2 tracking-wider">
                      <DollarSign className="w-3.5 h-3.5" />{" "}
                      {t.app.usage.stats.cost}{" "}
                      {viewMode === "all"
                        ? t.app.usage.stats.total
                        : t.app.usage.stats.session}
                    </div>
                    <div className="text-2xl font-bold text-on-surface tracking-tight">
                      ${activeCost.toFixed(5)}
                    </div>

                    {/* BRL Display */}
                    <div className="mt-2 pt-2 border-t border-outline-variant/10 flex items-center justify-between">
                      <div className="text-xs font-bold text-green-600">
                        {formattedActiveBrl}
                      </div>
                      <span className="text-[9px] font-medium text-on-surface-variant bg-surface-container-highest px-1.5 py-0.5 rounded">
                        Real (R$)
                      </span>
                    </div>
                  </div>
                  <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-2 text-on-surface-variant text-[10px] font-bold uppercase mb-2 tracking-wider">
                      <Zap className="w-3.5 h-3.5" /> {t.app.usage.stats.tokens}
                    </div>
                    <div className="text-2xl font-bold text-on-surface">
                      {(
                        activeStats.totalInputTokens +
                        activeStats.totalOutputTokens
                      ).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-outline-variant/10 text-[10px] font-mono text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>{" "}
                        In: {activeStats.totalInputTokens.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>{" "}
                        Out: {activeStats.totalOutputTokens.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-2 text-on-surface-variant text-[10px] font-bold uppercase mb-2 tracking-wider">
                      <Clock className="w-3.5 h-3.5" />{" "}
                      {t.app.usage.stats.latency}
                    </div>
                    <div className="text-2xl font-bold text-on-surface">
                      {(activeStats.averageLatency / 1000).toFixed(2)}s
                    </div>
                    <div className="mt-2 pt-2 border-t border-outline-variant/10 text-[10px] text-on-surface-variant">
                      {t.app.usage.stats.latencyDesc}
                    </div>
                  </div>
                  <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-2 text-on-surface-variant text-[10px] font-bold uppercase mb-2 tracking-wider">
                      <Server className="w-3.5 h-3.5" />{" "}
                      {t.app.usage.stats.requests}
                    </div>
                    <div className="text-2xl font-bold text-on-surface">
                      {activeStats.totalRequests}
                    </div>
                    <div className="mt-2 pt-2 border-t border-outline-variant/10 text-[10px] text-on-surface-variant">
                      {t.app.usage.stats.requestsDesc}
                    </div>
                  </div>
                </div>

                {/* Logs List */}
                <div className="p-0">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-surface-container text-on-surface-variant font-semibold border-b border-outline-variant/30 sticky top-0 z-10 text-[10px] uppercase tracking-wider shadow-sm">
                      <tr>
                        <th className="px-6 py-3 bg-surface-container">
                          {t.app.usage.table.date}
                        </th>
                        <th className="px-6 py-3 bg-surface-container">
                          {t.app.usage.table.model}
                        </th>
                        <th className="px-6 py-3 text-right bg-surface-container">
                          {t.app.usage.table.tokens}
                        </th>
                        <th className="px-6 py-3 text-right bg-surface-container">
                          {t.app.usage.table.time}
                        </th>
                        <th className="px-6 py-3 text-right bg-surface-container">
                          {t.app.usage.table.ptax}
                        </th>
                        <th className="px-6 py-3 text-right bg-surface-container">
                          {t.app.usage.table.cost}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10 bg-surface">
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-12 text-center text-on-surface-variant italic"
                          >
                            {searchTerm
                              ? t.app.usage.noResults
                              : t.app.usage.noLogs}
                          </td>
                        </tr>
                      ) : (
                        filteredLogs.map((log) => (
                          <tr
                            key={log.id}
                            className="hover:bg-surface-container transition-colors group"
                          >
                            <td className="px-6 py-3 text-on-surface-variant whitespace-nowrap flex flex-col">
                              <span className="font-medium text-on-surface text-xs">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                              {viewMode === "all" && (
                                <span className="text-[10px] text-on-surface-variant/70">
                                  {new Date(log.timestamp).toLocaleDateString()}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-3 font-medium text-on-surface">
                              <span className="bg-surface-container group-hover:bg-surface text-on-surface-variant px-2 py-0.5 rounded text-[10px] font-bold border border-outline-variant/30 uppercase tracking-wide">
                                {log.model
                                  .replace("gemini-", "")
                                  .replace("-latest", "")
                                  .replace("-preview", "")}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-right text-on-surface-variant font-mono text-xs">
                              <div className="flex items-center justify-end gap-3">
                                <span title="Input" className="text-blue-500">
                                  {log.inputTokens}
                                </span>
                                <span className="text-outline-variant/50">
                                  /
                                </span>
                                <span
                                  title="Output"
                                  className="text-purple-500"
                                >
                                  {log.outputTokens}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-3 text-right text-on-surface-variant text-xs font-mono">
                              {(log.latencyMs / 1000).toFixed(2)}s
                            </td>
                            <td className="px-6 py-3 text-right text-on-surface-variant/70 text-xs font-mono">
                              {log.ptax ? `R$${log.ptax.toFixed(4)}` : "-"}
                            </td>
                            <td className="px-6 py-3 text-right font-bold text-on-surface font-mono text-xs">
                              <div>${log.cost.toFixed(5)}</div>
                              {log.costInBrl ? (
                                <div className="text-[10px] text-green-500">
                                  R${log.costInBrl.toFixed(4)}
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Persistent Storage Notice */}
              <div className="bg-surface-container-high p-2 border-t border-outline-variant/30 text-center text-[10px] text-on-surface-variant/50 shrink-0">
                <span className="flex items-center justify-center gap-1">
                  <History className="w-3 h-3" /> {t.app.usage.localStorage}
                </span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

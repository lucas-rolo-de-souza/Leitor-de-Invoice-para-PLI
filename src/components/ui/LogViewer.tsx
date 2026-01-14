import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  Terminal,
  AlertCircle,
  Info,
  AlertTriangle,
  Bug,
  Trash2,
} from "lucide-react";
import { logger, LogEntry } from "../../services/loggerService";

type LogViewerProps = {
  onClose: () => void;
};

/**
 * LogViewer Component
 *
 * A visual interface for the `loggerService`. Displays system logs in a modal
 * with filtering, detailed payload inspection, and export capabilities.
 *
 * Features:
 * - **Filtering**: Filter logs by level (INFO, WARN, ERROR, DEBUG).
 * - **Safe Clear**: "Click twice" safety mechanism to prevent accidental history deletion.
 * - **Export**: Download full log history as JSON.
 * - **Inspection**: Expandable `<details>` view for complex JSON data payloads.
 */
export const LogViewer: React.FC<LogViewerProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setLogs([...logger.getLogs()].reverse()); // Show newest first (safe copy)
  }, []);

  // Reset confirmation state after 3 seconds
  useEffect(() => {
    if (confirmClear) {
      const timer = setTimeout(() => setConfirmClear(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmClear]);

  const filteredLogs = logs.filter((log) => {
    if (filter === "ALL") return true;
    return log.level === filter;
  });

  const handleClear = () => {
    if (confirmClear) {
      logger.clear();
      setLogs([]);
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "ERROR":
        return "text-red-600 bg-red-50 border-red-200";
      case "WARN":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "INFO":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "DEBUG":
        return "text-slate-600 bg-slate-50 border-slate-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "ERROR":
        return <AlertCircle className="w-4 h-4" />;
      case "WARN":
        return <AlertTriangle className="w-4 h-4" />;
      case "INFO":
        return <Info className="w-4 h-4" />;
      case "DEBUG":
        return <Bug className="w-4 h-4" />;
      default:
        return <Terminal className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-high rounded-m3-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-border animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface-container-high">
          <div className="flex items-center gap-3">
            <div className="bg-surface-container-highest p-2 rounded-lg">
              <Terminal className="w-5 h-5 text-on-surface" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-text-primary">
                System Logs
              </h3>
              <p className="text-xs text-text-tertiary">
                Viewing {filteredLogs.length} entries
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors shadow-sm ${
                confirmClear
                  ? "bg-red-600 border-red-600 text-white hover:bg-red-700"
                  : "bg-surface-container border-outline-variant text-on-surface hover:bg-error-container hover:text-error hover:border-error"
              }`}
              title={confirmClear ? "Click again to confirm" : "Clear all logs"}
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">
                {confirmClear ? "Confirm?" : "Clear"}
              </span>
            </button>
            <button
              onClick={() => logger.downloadLogs()}
              className="flex items-center gap-2 px-4 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm font-medium text-on-surface hover:bg-surface-container-highest hover:text-primary transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export JSON</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 text-text-tertiary hover:text-text-primary transition-colors"
              title="Close"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-surface-container-high/50 flex gap-2 overflow-x-auto">
          {["ALL", "ERROR", "WARN", "INFO", "DEBUG"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                filter === f
                  ? "bg-primary text-on-primary shadow-md"
                  : "bg-surface-container border border-outline-variant text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Log List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-surface-container-low font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-text-tertiary opacity-50">
              <Terminal className="w-12 h-12 mb-4" />
              <p>No logs found for this filter</p>
            </div>
          ) : (
            filteredLogs.map((log, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border flex flex-col sm:flex-row gap-3 items-start sm:items-center ${getLevelColor(
                  log.level
                )}`}
              >
                <div className="flex items-center gap-2 min-w-[140px]">
                  {getLevelIcon(log.level)}
                  <span className="font-bold">{log.level}</span>
                  <span className="text-[10px] opacity-70">
                    {log.formattedTimestamp.split(" ")[1]}
                  </span>
                </div>
                <div className="flex-1 break-all">
                  <span className="font-medium mr-2">{log.message}</span>
                  {log.data && (
                    <details className="mt-2 text-[11px] bg-surface/50 p-2 rounded cursor-pointer border border-outline-variant/20">
                      <summary className="font-bold opacity-70 hover:opacity-100 select-none">
                        View Data Payload
                      </summary>
                      <pre className="mt-2 overflow-x-auto p-2">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

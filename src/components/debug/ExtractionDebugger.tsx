import React, { useEffect, useState } from "react";
import {
  X,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  Cpu,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import {
  extractionTracer,
  ExtractionState,
  TraceStep,
} from "../../services/extractionTracer";

interface ExtractionDebuggerProps {
  onClose: () => void;
}

export const ExtractionDebugger: React.FC<ExtractionDebuggerProps> = ({
  onClose,
}) => {
  const [state, setState] = useState<ExtractionState | null>(
    extractionTracer.getCurrentState(),
  );
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"timeline" | "metrics">(
    "timeline",
  );

  useEffect(() => {
    const unsub = extractionTracer.subscribe((newState) => {
      setState(newState);
    });
    return unsub;
  }, []);

  if (!state) {
    return null;
  }

  const getStepStatus = (step: TraceStep, currentStep: TraceStep) => {
    const stepsOrder: TraceStep[] = [
      "INIT",
      "PRE_PROCESSING",
      "API_CONNECT",
      "METADATA_REQUEST",
      "METADATA_RESPONSE",
      "LINE_ITEMS_REQUEST",
      "LINE_ITEMS_RESPONSE",
      "PARSING",
      "VALIDATION",
      "COMPLETE",
    ];

    const currentIndex = stepsOrder.indexOf(currentStep);
    const stepIndex = stepsOrder.indexOf(step);

    if (state.status === "FAILURE" && stepIndex === currentIndex)
      return "error";
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "active":
        return <Activity className="w-5 h-5 text-blue-500 animate-pulse" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return (
          <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                state.status === "FAILURE"
                  ? "bg-red-100 text-red-600"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Extraction Debugger
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                ID: {state.id.split("-")[0]}... • Time:{" "}
                {(Date.now() - state.startTime) / 1000}s
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("timeline")}
                title="View process timeline"
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all text-slate-700 dark:text-slate-100 ${
                  activeTab === "timeline"
                    ? "bg-white dark:bg-slate-600 shadow-sm"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setActiveTab("metrics")}
                title="View extraction metrics"
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all text-slate-700 dark:text-slate-100 ${
                  activeTab === "metrics"
                    ? "bg-white dark:bg-slate-600 shadow-sm"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                Metrics
              </button>
            </div>
            <button
              onClick={onClose}
              title="Close debugger"
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-row">
          {/* Left Sidebar: Steps */}
          <div className="w-1/4 min-w-[250px] border-r border-slate-200 dark:border-slate-700 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 p-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Process Steps
            </h4>
            {[
              { id: "INIT", label: "Initialization" },
              { id: "PRE_PROCESSING", label: "Pre-Processing" },
              { id: "API_CONNECT", label: "API Connection" },
              { id: "METADATA_REQUEST", label: "Metadata Request" },
              { id: "METADATA_RESPONSE", label: "Metadata Response" },
              { id: "LINE_ITEMS_REQUEST", label: "Line Items Request" },
              { id: "LINE_ITEMS_RESPONSE", label: "Line Items Response" },
              { id: "PARSING", label: "Data Parsing" },
              { id: "VALIDATION", label: "Validation" },
              { id: "COMPLETE", label: "Completion" },
            ].map((s) => {
              const status = getStepStatus(
                s.id as TraceStep,
                state.currentStep,
              );
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    status === "active"
                      ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                      : ""
                  } ${status === "pending" ? "opacity-40" : "opacity-100"}`}
                >
                  {getStepIcon(status)}
                  <span className="text-sm font-medium dark:text-slate-200">
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 p-0">
            {activeTab === "metrics" ? (
              <div className="p-8 grid grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-4">
                    <Cpu className="w-6 h-6 text-purple-500" />
                    <h3 className="text-lg font-bold dark:text-slate-100">
                      Token Usage
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">
                        Input Tokens:
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {state.metrics.totalInputTokens}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">
                        Output Tokens:
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {state.metrics.totalOutputTokens}
                      </span>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>
                    <div className="flex justify-between text-lg">
                      <span className="font-bold dark:text-slate-100">
                        Total:
                      </span>
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                        {state.metrics.totalInputTokens +
                          state.metrics.totalOutputTokens}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="w-6 h-6 text-blue-500" />
                    <h3 className="text-lg font-bold dark:text-slate-100">
                      Performance
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">
                        Duration:
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {(state.metrics.totalDuration / 1000).toFixed(2)}s
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">
                        Payload Size:
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {state.payloadSizeMb} MB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">
                        Files Processed:
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {state.fileCount}
                      </span>
                    </div>
                  </div>
                </div>
                {state.error && (
                  <div className="col-span-2 bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-3 mb-4">
                      <AlertCircle className="w-6 h-6 text-red-500" />
                      <h3 className="text-lg font-bold text-red-600 dark:text-red-400">
                        Failure Details
                      </h3>
                    </div>
                    <p className="font-mono text-sm text-red-800 dark:text-red-200 whitespace-pre-wrap">
                      {state.error}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">
                  Timeline Events
                </h4>
                {state.events
                  .slice()
                  .reverse()
                  .map((event) => (
                    <div
                      key={event.id}
                      className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden transition-all hover:shadow-md"
                    >
                      <div
                        className="p-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between cursor-pointer"
                        onClick={() =>
                          setExpandedEventId(
                            expandedEventId === event.id ? null : event.id,
                          )
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              event.step === "ERROR"
                                ? "bg-red-500"
                                : "bg-blue-500"
                            }`}
                          />
                          <span className="font-mono text-xs text-slate-400">
                            {event.timestamp.split("T")[1].replace("Z", "")}
                          </span>
                          <span className="font-bold text-sm text-slate-700 dark:text-slate-100">
                            {event.message}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          {event.tokens && (
                            <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-md font-mono">
                              {event.tokens.total} toks
                            </span>
                          )}
                          {event.latency && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md font-mono">
                              {event.latency}ms
                            </span>
                          )}
                          {expandedEventId === event.id ? (
                            <ChevronDown className="w-4 h-4 text-slate-100" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-100" />
                          )}
                        </div>
                      </div>
                      {expandedEventId === event.id && (
                        <div className="p-4 bg-slate-100 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-700 font-mono text-xs overflow-x-auto">
                          {event.data ? (
                            <pre className="text-slate-600 dark:text-slate-400">
                              {JSON.stringify(event.data, null, 2)}
                            </pre>
                          ) : (
                            <span className="text-slate-400 italic">
                              No additional data recorded for this event.
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

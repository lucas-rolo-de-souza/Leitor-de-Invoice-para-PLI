import { logger } from "./loggerService";

export type TraceStep =
  | "INIT"
  | "PRE_PROCESSING"
  | "API_CONNECT"
  | "METADATA_REQUEST"
  | "METADATA_RESPONSE"
  | "LINE_ITEMS_REQUEST"
  | "LINE_ITEMS_RESPONSE"
  | "PARSING"
  | "VALIDATION"
  | "COMPLETE"
  | "ERROR";

export type TraceEvent = {
  id: string;
  timestamp: string;
  step: TraceStep;
  message: string;
  data?: unknown;
  latency?: number;
  tokens?: {
    input: number;
    output: number;
    total: number;
  };
};

export type ExtractionState = {
  id: string;
  startTime: number;
  endTime?: number;
  status: "IDLE" | "RUNNING" | "SUCCESS" | "FAILURE";
  currentStep: TraceStep;
  events: TraceEvent[];
  error?: string;
  metrics: {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCost: number;
    totalDuration: number;
  };
  payloadSizeMb: number;
  fileCount: number;
};

class ExtractionTracerService {
  private currentState: ExtractionState | null = null;
  private subscribers: ((state: ExtractionState) => void)[] = [];

  constructor() {
    this.reset();
  }

  /**
   * Starts a new tracing session
   */
  start(fileCount: number, totalSizeBytes: number) {
    this.currentState = {
      id: crypto.randomUUID(),
      startTime: Date.now(),
      status: "RUNNING",
      currentStep: "INIT",
      events: [],
      metrics: {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCost: 0,
        totalDuration: 0,
      },
      payloadSizeMb: parseFloat((totalSizeBytes / (1024 * 1024)).toFixed(2)),
      fileCount,
    };
    this.logEvent("INIT", "Extraction session started", {
      files: fileCount,
      sizeMb: this.currentState.payloadSizeMb,
    });
    this.notify();
  }

  /**
   * Logs a specific event in the timeline
   */
  logEvent(
    step: TraceStep,
    message: string,
    data?: unknown,
    metrics?: { latency?: number; tokens?: TraceEvent["tokens"] },
  ) {
    if (!this.currentState) return;

    this.currentState.currentStep = step;

    const event: TraceEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      step,
      message,
      data,
      latency: metrics?.latency,
      tokens: metrics?.tokens,
    };

    // Update aggregate metrics if provided
    if (metrics?.tokens) {
      this.currentState.metrics.totalInputTokens += metrics.tokens.input;
      this.currentState.metrics.totalOutputTokens += metrics.tokens.output;
    }

    this.currentState.events.push(event);

    // Also log to the main system logger for persistence
    logger.info(`[Tracer][${step}] ${message}`, data);

    this.notify();
  }

  fail(error: string, technicalDetails?: unknown) {
    if (!this.currentState) return;
    this.currentState.status = "FAILURE";
    this.currentState.error = error;
    this.currentState.endTime = Date.now();
    this.logEvent("ERROR", error, technicalDetails);
    logger.error(`[Tracer] Extraction Failed: ${error}`, technicalDetails);
    this.notify();
  }

  complete() {
    if (!this.currentState) return;
    this.currentState.status = "SUCCESS";
    this.currentState.endTime = Date.now();
    this.currentState.metrics.totalDuration =
      this.currentState.endTime - this.currentState.startTime;
    this.logEvent("COMPLETE", "Extraction completed successfully");
    this.notify();
  }

  getCurrentState() {
    return this.currentState;
  }

  reset() {
    this.currentState = null;
    this.notify();
  }

  subscribe(callback: (state: ExtractionState) => void) {
    this.subscribers.push(callback);
    if (this.currentState) callback(this.currentState);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== callback);
    };
  }

  private notify() {
    if (this.currentState) {
      const state = { ...this.currentState }; // Copy
      this.subscribers.forEach((cb) => cb(state));
    }
  }
}

export const extractionTracer = new ExtractionTracerService();

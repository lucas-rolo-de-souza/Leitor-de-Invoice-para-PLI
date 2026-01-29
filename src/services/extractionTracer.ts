import { logger } from "./loggerService";
import { generateUUID } from "../utils/uuidUtils";

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
  elapsedMs?: number; // Time since extraction start
  deltaMsFromPrevious?: number; // Time since previous event
  tokens?: {
    input: number;
    output: number;
    total: number;
  };
};

export type PartialExtractionData = {
  metadata?: Record<string, unknown>;
  lineItems?: Record<string, unknown>[];
  extractedAt?: number;
};

export type ExtractionState = {
  id: string;
  startTime: number;
  endTime?: number;
  status: "IDLE" | "RUNNING" | "SUCCESS" | "FAILURE" | "PARTIAL";
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
  timeoutConfig: {
    serverTimeoutMs: number; // Expected server timeout (nginx)
    apiTimeoutMs: number; // Expected API timeout
  };
};

const STORAGE_KEY = "pli_extraction_history";
const DEFAULT_TIMEOUT_CONFIG = {
  serverTimeoutMs: 300000, // 5 minutes (nginx config)
  apiTimeoutMs: 120000, // 2 minutes per API call
};

class ExtractionTracerService {
  private currentState: ExtractionState | null = null;
  private lastState: ExtractionState | null = null;
  private partialData: PartialExtractionData = {};
  private subscribers: ((state: ExtractionState | null) => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Load last extraction state from sessionStorage
   */
  private loadFromStorage() {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.lastState = parsed.lastState || null;
        this.partialData = parsed.partialData || {};
      }
    } catch (e) {
      logger.warn("Failed to load extraction history from storage", e);
    }
  }

  /**
   * Save extraction state to sessionStorage
   */
  private saveToStorage() {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          lastState: this.lastState,
          partialData: this.partialData,
        }),
      );
    } catch (e) {
      logger.warn("Failed to save extraction history to storage", e);
    }
  }

  /**
   * Starts a new tracing session
   */
  start(fileCount: number, totalSizeBytes: number) {
    // Clear partial data from any previous extraction
    this.partialData = {};

    this.currentState = {
      id: generateUUID(),
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
      timeoutConfig: { ...DEFAULT_TIMEOUT_CONFIG },
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

    const now = Date.now();
    const elapsedMs = now - this.currentState.startTime;

    // Calculate delta from previous event
    const prevEvent =
      this.currentState.events[this.currentState.events.length - 1];
    const deltaMsFromPrevious = prevEvent
      ? now - new Date(prevEvent.timestamp).getTime()
      : 0;

    this.currentState.currentStep = step;

    const event: TraceEvent = {
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      step,
      message,
      data,
      latency: metrics?.latency,
      tokens: metrics?.tokens,
      elapsedMs,
      deltaMsFromPrevious,
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

  /**
   * Store partial extraction data (metadata or line items)
   */
  savePartialData(
    type: "metadata" | "lineItems",
    data: Record<string, unknown> | Record<string, unknown>[],
  ) {
    if (type === "metadata") {
      this.partialData.metadata = data as Record<string, unknown>;
    } else {
      this.partialData.lineItems = data as Record<string, unknown>[];
    }
    this.partialData.extractedAt = Date.now();
    this.saveToStorage();
    logger.info(`[Tracer] Cached partial ${type} data`);
  }

  /**
   * Get any cached partial extraction data
   */
  getPartialData(): PartialExtractionData {
    return { ...this.partialData };
  }

  /**
   * Check if partial data is available
   */
  hasPartialData(): boolean {
    return !!(this.partialData.metadata || this.partialData.lineItems?.length);
  }

  /**
   * Clear partial data cache
   */
  clearPartialData() {
    this.partialData = {};
    this.saveToStorage();
  }

  /**
   * Mark extraction as failed
   */
  fail(error: string, technicalDetails?: unknown) {
    if (!this.currentState) return;
    this.currentState.status = this.hasPartialData() ? "PARTIAL" : "FAILURE";
    this.currentState.error = error;
    this.currentState.endTime = Date.now();
    this.currentState.metrics.totalDuration =
      this.currentState.endTime - this.currentState.startTime;
    this.logEvent("ERROR", error, technicalDetails);
    logger.error(`[Tracer] Extraction Failed: ${error}`, technicalDetails);

    // Save as last state
    this.lastState = { ...this.currentState };
    this.saveToStorage();

    this.notify();
  }

  /**
   * Mark extraction as complete
   */
  complete() {
    if (!this.currentState) return;
    this.currentState.status = "SUCCESS";
    this.currentState.endTime = Date.now();
    this.currentState.metrics.totalDuration =
      this.currentState.endTime - this.currentState.startTime;
    this.logEvent("COMPLETE", "Extraction completed successfully");

    // Save as last state and clear partial data
    this.lastState = { ...this.currentState };
    this.partialData = {};
    this.saveToStorage();

    this.notify();
  }

  /**
   * Get current elapsed time in milliseconds
   */
  getElapsedTime(): number {
    if (!this.currentState) return 0;
    if (this.currentState.endTime) {
      return this.currentState.endTime - this.currentState.startTime;
    }
    return Date.now() - this.currentState.startTime;
  }

  /**
   * Get remaining time before timeout (if running)
   */
  getRemainingTimeout(): number {
    if (!this.currentState || this.currentState.status !== "RUNNING") return 0;
    const elapsed = this.getElapsedTime();
    const timeout = this.currentState.timeoutConfig.serverTimeoutMs;
    return Math.max(0, timeout - elapsed);
  }

  /**
   * Check if extraction is currently running
   */
  isRunning(): boolean {
    return this.currentState?.status === "RUNNING";
  }

  /**
   * Get current state (active extraction)
   */
  getCurrentState() {
    return this.currentState;
  }

  /**
   * Get last completed/failed extraction state (for history view)
   */
  getLastState() {
    return this.lastState;
  }

  /**
   * Get the state to display (current if running, otherwise last)
   */
  getDisplayState(): ExtractionState | null {
    return this.currentState || this.lastState;
  }

  /**
   * Reset current extraction state (does not clear history)
   */
  reset() {
    if (this.currentState) {
      this.lastState = { ...this.currentState };
      this.saveToStorage();
    }
    this.currentState = null;
    this.notify();
  }

  /**
   * Clear all history
   */
  clearHistory() {
    this.currentState = null;
    this.lastState = null;
    this.partialData = {};
    sessionStorage.removeItem(STORAGE_KEY);
    this.notify();
  }

  subscribe(callback: (state: ExtractionState | null) => void) {
    this.subscribers.push(callback);
    // Always call with display state (current or last)
    callback(this.getDisplayState());
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== callback);
    };
  }

  private notify() {
    const state = this.getDisplayState();
    this.subscribers.forEach((cb) => cb(state));
  }
}

export const extractionTracer = new ExtractionTracerService();

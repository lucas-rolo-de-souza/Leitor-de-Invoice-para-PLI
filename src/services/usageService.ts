// Version: 1.06.00.01
import { logger } from "./loggerService";

export type UsageLog = {
  id: string;
  sessionId: string; // The "Auto-Key" for the session
  timestamp: string; // Changed to string for serialization stability
  model: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  ptax?: number | null; // Historical PTAX at moment of request
  costInBrl?: number; // Historical Cost in BRL
};

export type SessionStats = {
  sessionId: string;
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  totalCostInBrl: number;
  averageLatency: number;
};

// Pricing Types
type PricingTier = {
  maxInputTokens: number; // e.g. 128000. If Infinity, applies to all > previous tier
  inputRate: number; // $ per 1 Million tokens
  outputRate: number; // $ per 1 Million tokens
};

type ModelPricing = {
  tiers: PricingTier[];
};

// Pricing Configuration (2026 Updated Values)
// Sources: Google Vertex AI / Gemini Developer API Pricing as of Jan 2026.
const PRICING_REGISTRY: Record<string, ModelPricing> = {
  // Gemini 2.5 Flash
  // Optimized for speed and cost-efficiency.
  // Standard Tier: <= 128k context
  // Long Context Tier: > 128k context (Estimated 2x multiplier standard)
  "gemini-2.5-flash": {
    tiers: [
      { maxInputTokens: 128_000, inputRate: 0.3, outputRate: 2.5 },
      { maxInputTokens: Infinity, inputRate: 0.6, outputRate: 5.0 },
    ],
  },

  // Gemini 2.5 Flash-Lite
  // Extremely low cost for high volume tasks.
  "gemini-2.5-flash-lite": {
    tiers: [
      { maxInputTokens: 128_000, inputRate: 0.1, outputRate: 0.4 },
      { maxInputTokens: Infinity, inputRate: 0.2, outputRate: 0.8 },
    ],
  },

  // Gemini 2.0 Series (Baseline)
  "gemini-2.0-flash": {
    tiers: [{ maxInputTokens: Infinity, inputRate: 0.1, outputRate: 0.4 }],
  },

  // High Reasoning Models (Thinking Mode)
  "gemini-2.0-flash-thinking-exp": {
    tiers: [{ maxInputTokens: Infinity, inputRate: 0.3, outputRate: 3.0 }],
  },

  // Gemini 1.5 Series (Legacy Reference)
  "gemini-1.5-flash": {
    tiers: [
      { maxInputTokens: 128_000, inputRate: 0.075, outputRate: 0.3 },
      { maxInputTokens: Infinity, inputRate: 0.15, outputRate: 0.6 },
    ],
  },
  "gemini-1.5-pro": {
    tiers: [
      { maxInputTokens: 128_000, inputRate: 3.5, outputRate: 10.5 },
      { maxInputTokens: Infinity, inputRate: 7.0, outputRate: 21.0 },
    ],
  },
};

// Default Fallback
const DEFAULT_PRICING: ModelPricing = {
  tiers: [{ maxInputTokens: Infinity, inputRate: 0.1, outputRate: 0.4 }],
};

const STORAGE_KEY = "invoice_ai_usage_history_v1";

class UsageService {
  private currentSessionId: string;
  private logs: UsageLog[] = [];

  constructor() {
    this.currentSessionId = this.generateId();
    this.loadHistory();
    logger.info(`[UsageService] Session started: ${this.currentSessionId}`);
  }

  /**
   * Helper to generate UUIDs safely in any environment
   */
  private generateId(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for insecure contexts (http) or older browsers
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * Loads logs from LocalStorage
   */
  private loadHistory() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      logger.error("Failed to load usage history", e);
      this.logs = [];
    }
  }

  /**
   * Saves logs to LocalStorage
   */
  private saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
    } catch (e) {
      logger.error("Failed to save usage history", e);
    }
  }

  /**
   * Calculates the cost of a request based on the model and token usage.
   * Handles tiered pricing (e.g., higher cost for > 128k context).
   */
  public calculateCost(
    modelId: string,
    inputTokens: number,
    outputTokens: number,
  ): number {
    const pricing = PRICING_REGISTRY[modelId] || DEFAULT_PRICING;

    // Find the applicable tier based on Input Tokens (Context Size)
    // Pricing tiers are usually based on the Total Input Context.
    const tier =
      pricing.tiers.find((t) => inputTokens <= t.maxInputTokens) ||
      pricing.tiers[pricing.tiers.length - 1];

    const inputCost = (inputTokens / 1_000_000) * tier.inputRate;
    const outputCost = (outputTokens / 1_000_000) * tier.outputRate;

    return inputCost + outputCost;
  }

  /**
   * Logs a transaction, calculates estimated cost, and persists to storage.
   *
   * Side Effects:
   * - Fetches current PTAX (Dollar Rate) async for BRL conversion.
   * - Saves to LocalStorage immediately.
   */
  public async logTransaction(
    modelId: string,
    inputTokens: number,
    outputTokens: number,
    latencyMs: number,
  ) {
    const totalCost = this.calculateCost(modelId, inputTokens, outputTokens);

    // Fetch PTAX (Async)
    let ptax: number | null = null;
    let costInBrl = 0;
    try {
      const { currencyService } = await import("./currencyService");
      ptax = await currencyService.getUSDtoBRLRate();
      if (ptax) {
        costInBrl = totalCost * ptax;
      }
    } catch (e) {
      logger.warn("[Usage] Failed to fetch PTAX for log", e);
    }

    const entry: UsageLog = {
      id: this.generateId(),
      sessionId: this.currentSessionId,
      timestamp: new Date().toISOString(),
      model: modelId,
      latencyMs,
      inputTokens,
      outputTokens,
      cost: totalCost,
      ptax,
      costInBrl,
    };

    this.logs.push(entry);
    this.saveHistory();

    // Safely log to main logger
    try {
      const brlLog = costInBrl > 0 ? ` | R$${costInBrl.toFixed(4)}` : "";
      logger.info(
        `[Usage] ${modelId} | ${latencyMs}ms | In: ${inputTokens} | Out: ${outputTokens} | $${totalCost.toFixed(
          6,
        )}${brlLog}`,
      );
    } catch {
      console.log(`[Usage] ${modelId} | $${totalCost.toFixed(6)}`);
    }
  }

  /**
   * Helper to calculate stats from a subset of logs
   */
  private calculateStats(
    logsToProcess: UsageLog[],
    sessionIdLabel: string,
  ): SessionStats {
    if (logsToProcess.length === 0) {
      return {
        sessionId: sessionIdLabel,
        totalRequests: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCost: 0,
        totalCostInBrl: 0,
        averageLatency: 0,
      };
    }

    const totalRequests = logsToProcess.length;
    const totalInputTokens = logsToProcess.reduce(
      (acc, log) => acc + log.inputTokens,
      0,
    );
    const totalOutputTokens = logsToProcess.reduce(
      (acc, log) => acc + log.outputTokens,
      0,
    );
    const totalCost = logsToProcess.reduce((acc, log) => acc + log.cost, 0);
    const totalCostInBrl = logsToProcess.reduce(
      (acc, log) => acc + (log.costInBrl || 0),
      0,
    );
    const totalLatency = logsToProcess.reduce(
      (acc, log) => acc + log.latencyMs,
      0,
    );

    return {
      sessionId: sessionIdLabel,
      totalRequests,
      totalInputTokens,
      totalOutputTokens,
      totalCost,
      totalCostInBrl,
      averageLatency: totalLatency / totalRequests,
    };
  }

  /**
   * Returns stats for the CURRENT active session.
   */
  public getCurrentSessionStats(): SessionStats {
    const sessionLogs = this.logs.filter(
      (l) => l.sessionId === this.currentSessionId,
    );
    return this.calculateStats(sessionLogs, this.currentSessionId);
  }

  /**
   * Returns aggregated stats for ALL time (Lifetime).
   */
  public getLifetimeStats(): SessionStats {
    return this.calculateStats(this.logs, "LIFETIME");
  }

  /**
   * Returns logs.
   * @param mode 'current' for current session only, 'all' for everything
   */
  public getLogs(mode: "current" | "all" = "current"): UsageLog[] {
    const targetLogs =
      mode === "current"
        ? this.logs.filter((l) => l.sessionId === this.currentSessionId)
        : this.logs;

    // Sort Newest first
    return [...targetLogs].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  public getSessionId(): string {
    return this.currentSessionId;
  }

  public clear() {
    this.logs = [];
    this.saveHistory();
  }
}

export const usageService = new UsageService();

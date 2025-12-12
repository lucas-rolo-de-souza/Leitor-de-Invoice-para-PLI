// Version: 1.05.00.11
import { logger } from './loggerService';

export interface UsageLog {
  id: string;
  sessionId: string; // The "Auto-Key" for the session
  timestamp: string; // Changed to string for serialization stability
  model: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export interface SessionStats {
  sessionId: string;
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  averageLatency: number;
}

// Pricing Configuration (Estimated per 1 Million Tokens in USD)
const PRICING_MAP: Record<string, { input: number; output: number }> = {
  // Gemini 2.5 Series (Stable IDs)
  'gemini-2.5-flash': { input: 0.075, output: 0.30 },
  'gemini-2.5-flash-lite': { input: 0.0375, output: 0.15 },
  
  // Gemini 2.0 Series (Stable IDs)
  'gemini-2.0-flash': { input: 0.10, output: 0.40 }, 
  'gemini-2.0-flash-lite': { input: 0.05, output: 0.20 },

  // Gemma Series
  'gemma-3': { input: 0.05, output: 0.20 }, // Estimated
  'gemma-3n': { input: 0.03, output: 0.12 }, // Estimated

  // Gemini 1.5 Series (Legacy Support)
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  'gemini-1.5-pro': { input: 0.30, output: 1.20 },

  // Fallback / Aliases
  'gemini-flash-latest': { input: 0.075, output: 0.30 },
  'gemini-flash-lite-latest': { input: 0.0375, output: 0.15 },
  'default': { input: 0.075, output: 0.30 }
};

const STORAGE_KEY = 'invoice_ai_usage_history_v1';

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
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for insecure contexts (http) or older browsers
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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
      logger.error('Failed to load usage history', e);
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
      logger.error('Failed to save usage history', e);
    }
  }

  /**
   * Logs a transaction, calculates cost, and stores it.
   */
  public logTransaction(modelId: string, inputTokens: number, outputTokens: number, latencyMs: number) {
    const pricing = PRICING_MAP[modelId] || PRICING_MAP['default'];
    
    // Calculate Cost: (Tokens / 1,000,000) * Price_Per_Million
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    const totalCost = inputCost + outputCost;

    const entry: UsageLog = {
      id: this.generateId(),
      sessionId: this.currentSessionId,
      timestamp: new Date().toISOString(),
      model: modelId,
      latencyMs,
      inputTokens,
      outputTokens,
      cost: totalCost
    };

    this.logs.push(entry);
    this.saveHistory();
    
    // Safely log to main logger
    try {
        logger.info(`[Usage] ${modelId} | ${latencyMs}ms | In: ${inputTokens} | Out: ${outputTokens} | $${totalCost.toFixed(6)}`);
    } catch (e) {
        console.log(`[Usage] ${modelId} | $${totalCost.toFixed(6)}`);
    }
  }

  /**
   * Helper to calculate stats from a subset of logs
   */
  private calculateStats(logsToProcess: UsageLog[], sessionIdLabel: string): SessionStats {
    if (logsToProcess.length === 0) {
      return {
        sessionId: sessionIdLabel,
        totalRequests: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCost: 0,
        averageLatency: 0
      };
    }

    const totalRequests = logsToProcess.length;
    const totalInputTokens = logsToProcess.reduce((acc, log) => acc + log.inputTokens, 0);
    const totalOutputTokens = logsToProcess.reduce((acc, log) => acc + log.outputTokens, 0);
    const totalCost = logsToProcess.reduce((acc, log) => acc + log.cost, 0);
    const totalLatency = logsToProcess.reduce((acc, log) => acc + log.latencyMs, 0);

    return {
      sessionId: sessionIdLabel,
      totalRequests,
      totalInputTokens,
      totalOutputTokens,
      totalCost,
      averageLatency: totalLatency / totalRequests
    };
  }

  /**
   * Returns stats for the CURRENT active session.
   */
  public getCurrentSessionStats(): SessionStats {
    const sessionLogs = this.logs.filter(l => l.sessionId === this.currentSessionId);
    return this.calculateStats(sessionLogs, this.currentSessionId);
  }

  /**
   * Returns aggregated stats for ALL time (Lifetime).
   */
  public getLifetimeStats(): SessionStats {
    return this.calculateStats(this.logs, 'LIFETIME');
  }

  /**
   * Returns logs.
   * @param mode 'current' for current session only, 'all' for everything
   */
  public getLogs(mode: 'current' | 'all' = 'current'): UsageLog[] {
    const targetLogs = mode === 'current' 
      ? this.logs.filter(l => l.sessionId === this.currentSessionId) 
      : this.logs;
      
    // Sort Newest first
    return [...targetLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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
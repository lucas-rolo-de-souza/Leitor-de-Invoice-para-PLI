// Version: 1.01.00.00
/**
 * Logger Service
 * Centralized logging for the application.
 * Stores logs in memory and allows exporting to JSON for debugging.
 */

export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export type LogEntry = {
  timestamp: string; // ISO String (Machine readable / Sorting)
  formattedTimestamp: string; // Local String (Human readable: DD/MM/YYYY HH:MM:SS)
  level: LogLevel;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
};

const STORAGE_KEY = "app_logs";
const RETENTION_DAYS = 7;

class LoggerService {
  private logs: LogEntry[] = [];
  private maxLogs = 2000; // Increased limit for persisted history

  constructor() {
    this.loadLogs();
    this.cleanupOldLogs();
  }

  /**
   * Loads logs from LocalStorage
   */
  private loadLogs() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load logs from storage", e);
      this.logs = [];
    }
  }

  /**
   * Saves logs to LocalStorage
   */
  private saveLogs() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
    } catch (e) {
      console.error("Failed to save logs to storage (quota exceeded?)", e);
    }
  }

  /**
   * Removes logs older than RETENTION_DAYS
   */
  private cleanupOldLogs() {
    const now = new Date();
    const cutoff = new Date(
      now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );

    const originalCount = this.logs.length;
    this.logs = this.logs.filter((log) => new Date(log.timestamp) > cutoff);

    if (this.logs.length < originalCount) {
      this.saveLogs();
      this.info(
        `System`,
        `Logs cleaned up. Removed ${
          originalCount - this.logs.length
        } expired entries.`,
      );
    }
  }

  /**
   * Adds a new log entry.
   * Also outputs to the browser console for immediate dev feedback.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private add(level: LogLevel, message: string, data?: any) {
    const now = new Date();

    const entry: LogEntry = {
      timestamp: now.toISOString(),
      formattedTimestamp: now.toLocaleString("pt-BR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        fractionalSecondDigits: 3,
      }),
      level,
      message,
      data: data ? this.sanitize(data) : undefined,
    };

    this.logs.push(entry);

    // Rotate logs if exceeding max size
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Persist
    this.saveLogs();

    // Console output mirror with visible time
    const timeString = now.toLocaleTimeString("pt-BR", {
      fractionalSecondDigits: 3,
    });
    const consoleMsg = `[${timeString}] ${message}`;
    const consoleArgs = [consoleMsg];

    if (data) consoleArgs.push(data);

    switch (level) {
      case "ERROR":
        console.error(...consoleArgs);
        break;
      case "WARN":
        console.warn(...consoleArgs);
        break;
      case "DEBUG":
        console.debug(...consoleArgs);
        break;
      default:
        console.log(...consoleArgs);
    }
  }

  /**
   * Helper to safely sanitize data for storage (handles circular refs & Errors).
   */
  /**
   * Helper to safe-sanitize data for storage (handles circular refs & PII redaction).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sanitize(data: any): any {
    try {
      if (data instanceof Error) {
        return {
          name: data.name,
          message: this.redactPII(data.message), // Redact error messages too
          stack: data.stack,
          cause: (data as Error & { cause?: unknown }).cause,
        };
      }
      // Deep clone and redact
      const json = JSON.stringify(data, this.getCircularReplacer());
      return this.redactLogObject(JSON.parse(json));
    } catch (e) {
      return "[Unable to serialize data]";
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private redactLogObject(obj: any): any {
    if (!obj) return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.redactLogObject(item));
    }

    if (typeof obj === "object") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clean: any = {};
      for (const key in obj) {
        const lowerKey = key.toLowerCase();
        // Redact Sensitive Keys
        if (
          lowerKey.includes("password") ||
          lowerKey.includes("token") ||
          lowerKey.includes("key") ||
          lowerKey.includes("secret") ||
          lowerKey.includes("auth") ||
          lowerKey.includes("cookie") ||
          lowerKey.includes("cpf") ||
          lowerKey.includes("cnpj")
        ) {
          clean[key] = "[REDACTED]";
        } else {
          clean[key] = this.redactLogObject(obj[key]);
        }
      }
      return clean;
    }

    if (typeof obj === "string") {
      return this.redactPII(obj);
    }

    return obj;
  }

  private redactPII(text: string): string {
    if (!text) return text;
    // Basic PII Redaction Regex
    // CPF (11 digits, loose match)
    let clean = text.replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[CPF]");
    // CNPJ (14 digits, loose match)
    clean = clean.replace(
      /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g,
      "[CNPJ]",
    );
    // Email
    clean = clean.replace(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      "[EMAIL]",
    );

    // Truncate huge strings
    if (clean.length > 500) {
      return clean.substring(0, 500) + "...[TRUNCATED]";
    }
    return clean;
  }

  private getCircularReplacer() {
    const seen = new WeakSet();
    return (key: string, value: any) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular]";
        }
        seen.add(value);
      }
      return value;
    };
  }

  // --- Public API ---

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public info(message: string, data?: any) {
    this.add("INFO", message, data);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public warn(message: string, data?: any) {
    this.add("WARN", message, data);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public error(message: string, data?: any) {
    this.add("ERROR", message, data);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public debug(message: string, data?: any) {
    this.add("DEBUG", message, data);
  }

  public getLogs() {
    return this.logs;
  }

  public clear() {
    this.logs = [];
    this.saveLogs();
  }

  /**
   * Triggers a download of the current logs as a JSON file.
   */
  public downloadLogs() {
    try {
      const logContent = JSON.stringify(
        {
          appVersion: "1.05.00.01", // Should match version.ts ideally
          exportedAt: new Date().toLocaleString("pt-BR"),
          userAgent: navigator.userAgent,
          logs: this.logs,
        },
        null,
        2,
      );

      const blob = new Blob([logContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `faturas_ai_logs_${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to download logs", e);
    }
  }
}

export const logger = new LoggerService();

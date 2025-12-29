// Version: 1.01.00.00
/**
 * Logger Service
 * Centralized logging for the application.
 * Stores logs in memory and allows exporting to JSON for debugging.
 */

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface LogEntry {
  timestamp: string;         // ISO String (Machine readable / Sorting)
  formattedTimestamp: string;// Local String (Human readable: DD/MM/YYYY HH:MM:SS)
  level: LogLevel;
  message: string;
  data?: any;
}

class LoggerService {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  /**
   * Adds a new log entry.
   * Also outputs to the browser console for immediate dev feedback.
   */
  private add(level: LogLevel, message: string, data?: any) {
    const now = new Date();
    
    const entry: LogEntry = {
      timestamp: now.toISOString(),
      formattedTimestamp: now.toLocaleString('pt-BR'),
      level,
      message,
      data: data ? this.sanitize(data) : undefined
    };
    
    this.logs.push(entry);
    
    // Rotate logs if exceeding max size
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    // Console output mirror with visible time
    const timeString = now.toLocaleTimeString('pt-BR');
    const consoleMsg = `[${timeString}] ${message}`;
    const consoleArgs = [consoleMsg];
    
    if (data) consoleArgs.push(data);
    
    switch(level) {
        case 'ERROR': console.error(...consoleArgs); break;
        case 'WARN': console.warn(...consoleArgs); break;
        case 'DEBUG': console.debug(...consoleArgs); break;
        default: console.log(...consoleArgs);
    }
  }

  /**
   * Helper to safely sanitize data for storage (handles circular refs).
   */
  private sanitize(data: any): any {
    try {
      return JSON.parse(JSON.stringify(data, this.getCircularReplacer()));
    } catch (e) {
      return '[Unable to serialize data]';
    }
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

  public info(message: string, data?: any) { this.add('INFO', message, data); }
  public warn(message: string, data?: any) { this.add('WARN', message, data); }
  public error(message: string, data?: any) { this.add('ERROR', message, data); }
  public debug(message: string, data?: any) { this.add('DEBUG', message, data); }

  public getLogs() { return this.logs; }

  public clear() { this.logs = []; }

  /**
   * Triggers a download of the current logs as a JSON file.
   */
  public downloadLogs() {
    try {
        const logContent = JSON.stringify(
            {
                appVersion: '1.05.00.01', // Should match version.ts ideally
                exportedAt: new Date().toLocaleString('pt-BR'),
                userAgent: navigator.userAgent,
                logs: this.logs
            }, 
            null, 
            2
        );
        
        const blob = new Blob([logContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `faturas_ai_logs_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
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
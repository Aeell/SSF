export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[];
  private maxLogs: number;
  private isEnabled: boolean;
  private errorTracker: any; // ErrorTracker type

  private constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.isEnabled = true;
    this.errorTracker = null; // Will be initialized when needed
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setErrorTracker(tracker: any): void {
    this.errorTracker = tracker;
  }

  public debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  public info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  public warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  public error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
    if (this.errorTracker) {
      this.errorTracker.trackCustomError('logging', message, context);
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const consoleMessage = `[${level}] ${message}`;
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(consoleMessage, context);
          break;
        case LogLevel.INFO:
          console.info(consoleMessage, context);
          break;
        case LogLevel.WARN:
          console.warn(consoleMessage, context);
          break;
        case LogLevel.ERROR:
          console.error(consoleMessage, context);
          break;
      }
    }

    // Send to server if configured
    this.sendToServer(entry);
  }

  private async sendToServer(entry: LogEntry): Promise<void> {
    try {
      const response = await fetch('/api/logging', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        console.warn('Failed to send log to server:', response.statusText);
      }
    } catch (e) {
      console.warn('Failed to send log to server:', e);
    }
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public enable(): void {
    this.isEnabled = true;
  }

  public disable(): void {
    this.isEnabled = false;
  }

  public generateReport(): string {
    const report: string[] = [];
    report.push('Logging Report');
    report.push('=============');
    report.push(`Total Logs: ${this.logs.length}`);
    report.push('\nLogs by Level:');

    const logsByLevel = this.logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<LogLevel, number>);

    Object.entries(logsByLevel).forEach(([level, count]) => {
      report.push(`${level}: ${count}`);
    });

    report.push('\nRecent Logs:');
    this.logs.slice(-10).forEach(log => {
      report.push(`\n[${new Date(log.timestamp).toISOString()}] ${log.level}`);
      report.push(`Message: ${log.message}`);
      if (log.context) {
        report.push('Context:', JSON.stringify(log.context, null, 2));
      }
    });

    return report.join('\n');
  }

  public exportLogs(): LogEntry[] {
    return [...this.logs];
  }
} 
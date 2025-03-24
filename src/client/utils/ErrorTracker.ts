export interface ErrorEvent {
  timestamp: number;
  type: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
}

export class ErrorTracker {
  private static instance: ErrorTracker;
  private errors: ErrorEvent[];
  private maxErrors: number;
  private isTracking: boolean;

  private constructor() {
    this.errors = [];
    this.maxErrors = 1000;
    this.isTracking = true;
    this.setupErrorHandlers();
  }

  public static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  private setupErrorHandlers(): void {
    window.onerror = (message, source, lineno, colno, error) => {
      this.trackError({
        timestamp: Date.now(),
        type: 'runtime',
        message: String(message),
        stack: error?.stack,
        context: {
          source,
          lineno,
          colno,
        },
      });
    };

    window.onunhandledrejection = (event) => {
      this.trackError({
        timestamp: Date.now(),
        type: 'promise',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        context: {
          promise: event.promise,
        },
      });
    };
  }

  public trackError(error: ErrorEvent): void {
    if (!this.isTracking) return;

    this.errors.push(error);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error tracked:', error);
    }

    // Send error to server if configured
    this.sendErrorToServer(error);
  }

  public trackCustomError(type: string, message: string, context?: Record<string, any>): void {
    this.trackError({
      timestamp: Date.now(),
      type,
      message,
      context,
    });
  }

  private async sendErrorToServer(error: ErrorEvent): Promise<void> {
    try {
      const response = await fetch('/api/error-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error),
      });

      if (!response.ok) {
        console.warn('Failed to send error to server:', response.statusText);
      }
    } catch (e) {
      console.warn('Failed to send error to server:', e);
    }
  }

  public getErrors(): ErrorEvent[] {
    return [...this.errors];
  }

  public getErrorCount(): number {
    return this.errors.length;
  }

  public getErrorsByType(type: string): ErrorEvent[] {
    return this.errors.filter(error => error.type === type);
  }

  public clearErrors(): void {
    this.errors = [];
  }

  public startTracking(): void {
    this.isTracking = true;
  }

  public stopTracking(): void {
    this.isTracking = false;
  }

  public generateReport(): string {
    const report: string[] = [];
    report.push('Error Tracking Report');
    report.push('====================');
    report.push(`Total Errors: ${this.errors.length}`);
    report.push('\nErrors by Type:');

    const errorsByType = this.errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(errorsByType).forEach(([type, count]) => {
      report.push(`${type}: ${count}`);
    });

    report.push('\nRecent Errors:');
    this.errors.slice(-5).forEach(error => {
      report.push(`\n[${new Date(error.timestamp).toISOString()}] ${error.type}`);
      report.push(`Message: ${error.message}`);
      if (error.stack) {
        report.push(`Stack: ${error.stack}`);
      }
      if (error.context) {
        report.push('Context:', JSON.stringify(error.context, null, 2));
      }
    });

    return report.join('\n');
  }

  public exportErrors(): ErrorEvent[] {
    return [...this.errors];
  }
} 
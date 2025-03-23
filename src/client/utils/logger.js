// Enhanced browser-compatible logger with persistence and performance monitoring
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};
class Logger {
  constructor() {
    this.level = LOG_LEVELS.DEBUG;
    this.history = [];
    this.maxHistory = 1000;
    this.errorCallbacks = new Set();
    this.performanceTimers = new Map();
    this.setupGlobalErrorHandlers();
  }
  setLevel(level) {
    this.level = LOG_LEVELS[level] || LOG_LEVELS.DEBUG;
  }
  formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };
    this.history.push(logEntry);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    return `[${timestamp}] [${level}] ${message} ${data ? JSON.stringify(data, this.jsonReplacer) : ''}`;
  }
  jsonReplacer(key, value) {
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack,
        cause: value.cause
      };
    }
    if (value instanceof THREE.Vector3 || value instanceof CANNON.Vec3) {
      return `Vector3(${value.x}, ${value.y}, ${value.z})`;
    }
    if (value instanceof THREE.Quaternion || value instanceof CANNON.Quaternion) {
      return `Quaternion(${value.x}, ${value.y}, ${value.z}, ${value.w})`;
    }
    return value;
  }
  setupGlobalErrorHandlers() {
    window.onerror = (message, source, lineno, colno, error) => {
      this.error('Uncaught error', error, { source, lineno, colno });
    };
    window.onunhandledrejection = (event) => {
      this.error('Unhandled promise rejection', event.reason);
    };
  }
  onError(callback) {
    this.errorCallbacks.add(callback);
  }
  debug(message, data) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      const formattedMessage = this.formatMessage('DEBUG', message, data);
      console.debug(formattedMessage);
    }
  }
  info(message, data) {
    if (this.level <= LOG_LEVELS.INFO) {
      const formattedMessage = this.formatMessage('INFO', message, data);
      console.info(formattedMessage);
    }
  }
  warn(message, data) {
    if (this.level <= LOG_LEVELS.WARN) {
      const formattedMessage = this.formatMessage('WARN', message, data);
      console.warn(formattedMessage);
    }
  }
  error(message, error, context = {}) {
    if (this.level <= LOG_LEVELS.ERROR) {
      const formattedMessage = this.formatMessage('ERROR', message, { error, ...context });
      console.error(formattedMessage);
      this.errorCallbacks.forEach(callback => callback(error, context));
    }
  }
  getHistory(level) {
    return this.history.filter(entry => !level || entry.level === level);
  }
  clearHistory() {
    this.history = [];
  }
  startPerformanceTimer(label) {
    this.performanceTimers.set(label, performance.now());
  }
  endPerformanceTimer(label) {
    const startTime = this.performanceTimers.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.debug(`Performance [${label}]`, { duration: `${duration.toFixed(2)}ms` });
      this.performanceTimers.delete(label);
    }
  }
  logMemoryUsage() {
    if (performance.memory) {
      const memory = performance.memory;
      this.debug('Memory usage', {
        usedJSHeapSize: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        totalJSHeapSize: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        jsHeapSizeLimit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
      });
    }
  }
}
export const logger = new Logger(); 
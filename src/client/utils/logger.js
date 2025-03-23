// Enhanced browser-compatible logger with persistence
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
  onError(callback) {
    this.errorCallbacks.add(callback);
  }
  debug(message, data) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      );
    }
  }
  info(message, data) {
    if (this.level <= LOG_LEVELS.INFO) {
      );
    }
  }
  warn(message, data) {
    if (this.level <= LOG_LEVELS.WARN) {
      );
    }
  }
  error(message, error, context = {}) {
    if (this.level <= LOG_LEVELS.ERROR) {
      const errorData = {
        error: error instanceof Error ? error : new Error(error),
        context
      };
      );
      this.errorCallbacks.forEach(callback => callback(message, errorData));
    }
  }
  getHistory(level) {
    return level 
      ? this.history.filter(entry => entry.level === level)
      : this.history;
  }
  clearHistory() {
    this.history = [];
  }
  // Performance monitoring
  startPerformanceTimer(label) {
    if (!window.performance) return;
    performance.mark(`${label}-start`);
  }
  endPerformanceTimer(label) {
    if (!window.performance) return;
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    const measurement = performance.getEntriesByName(label).pop();
    this.debug(`Performance [${label}]`, { duration: measurement.duration });
    return measurement.duration;
  }
}
const logger = new Logger();
// Add global error handling
window.addEventListener('error', (event) => {
  logger.error('Uncaught error', event.error, {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', event.reason, {
    promise: event.promise
  });
});
export default logger; 
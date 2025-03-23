// Enhanced browser-compatible logger with persistence
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

class Logger {
  constructor(options = {}) {
    this.level = options.level || LOG_LEVELS.INFO;
    this.prefix = options.prefix || '';
    this.logs = [];
    this.maxLogs = options.maxLogs || 1000;

    // Initialize storage
    try {
      this.loadLogsFromStorage();
    } catch (e) {
      console.error('Failed to load logs from storage:', e);
    }
  }

  loadLogsFromStorage() {
    try {
      const savedLogs = localStorage.getItem('game_logs');
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
      }
    } catch (e) {
      console.error('Failed to load logs from storage:', e);
    }
  }

  saveLogsToStorage() {
    try {
      localStorage.setItem('game_logs', JSON.stringify(this.logs.slice(-this.maxLogs)));
    } catch (e) {
      console.error('Failed to save logs to storage:', e);
    }
  }

  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    return `[${timestamp}] [${level.toUpperCase()}] ${this.prefix}${message} ${formattedArgs}`.trim();
  }

  log(level, message, ...args) {
    const formattedMessage = this.formatMessage(level, message, ...args);
    this.logs.push({ timestamp: Date.now(), level, message: formattedMessage });
    this.saveLogsToStorage();
    return formattedMessage;
  }

  error(message, ...args) {
    const formattedMessage = this.log(LOG_LEVELS.ERROR, message, ...args);
    console.error(formattedMessage);
  }

  warn(message, ...args) {
    const formattedMessage = this.log(LOG_LEVELS.WARN, message, ...args);
    console.warn(formattedMessage);
  }

  info(message, ...args) {
    const formattedMessage = this.log(LOG_LEVELS.INFO, message, ...args);
    console.info(formattedMessage);
  }

  debug(message, ...args) {
    const formattedMessage = this.log(LOG_LEVELS.DEBUG, message, ...args);
    console.debug(formattedMessage);
  }

  getLogs() {
    return this.logs;
  }

  exportLogs() {
    const blob = new Blob([JSON.stringify(this.logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game_logs_${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  clearLogs() {
    this.logs = [];
    this.saveLogsToStorage();
  }
}

// Create default logger instance
const logger = new Logger({
  prefix: '[Game] ',
  maxLogs: 1000
});

// Export both the logger instance and the class
export { Logger };
export default logger; 
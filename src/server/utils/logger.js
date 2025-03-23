import winston from "winston";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "../../../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}
// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);
// Create logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: logFormat,
  transports: [
    // Write all logs error (and below) to error.log
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ],
});
// Add console transport in development
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  );
}
// Performance monitoring
const performance = {
  timers: new Map(),
  metrics: new Map(),
  history: new Map(),
  startTimer(name) {
    this.timers.set(name, process.hrtime());
  },
  endTimer(name) {
    const startTime = this.timers.get(name);
    if (startTime) {
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds
      this.timers.delete(name);
      
      // Update metrics
      if (!this.metrics.has(name)) {
        this.metrics.set(name, {
          count: 0,
          totalDuration: 0,
          minDuration: Infinity,
          maxDuration: 0
        });
      }
      
      const metric = this.metrics.get(name);
      metric.count++;
      metric.totalDuration += duration;
      metric.minDuration = Math.min(metric.minDuration, duration);
      metric.maxDuration = Math.max(metric.maxDuration, duration);
      
      // Add to history
      if (!this.history.has(name)) {
        this.history.set(name, []);
      }
      this.history.get(name).push({
        timestamp: Date.now(),
        duration
      });
      
      // Keep only last 100 measurements
      if (this.history.get(name).length > 100) {
        this.history.get(name).shift();
      }
      
      logger.debug(`Performance [${name}]`, { duration: `${duration.toFixed(2)}ms` });
      return duration;
    }
    return null;
  },
  getMetrics() {
    const result = {};
    for (const [name, metric] of this.metrics) {
      result[name] = {
        count: metric.count,
        averageDuration: metric.totalDuration / metric.count,
        minDuration: metric.minDuration,
        maxDuration: metric.maxDuration,
        recentHistory: this.history.get(name)
      };
    }
    return result;
  },
  clearMetrics() {
    this.timers.clear();
    this.metrics.clear();
    this.history.clear();
  }
};
// Memory monitoring
const memory = {
  getUsage() {
    const usage = process.memoryUsage();
    return {
      heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
      external: `${(usage.external / 1024 / 1024).toFixed(2)}MB`,
      rss: `${(usage.rss / 1024 / 1024).toFixed(2)}MB`
    };
  }
};
// Export enhanced logger
export { logger, performance, memory };

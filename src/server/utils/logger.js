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
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
    }),
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
  startTimer(name) {
    this.timers.set(name, process.hrtime());
  },
  endTimer(name) {
    const start = this.timers.get(name);
    if (!start) return 0;
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1e6; // Convert to milliseconds
    // Store metric
    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        count: 0,
        total: 0,
        min: duration,
        max: duration,
        last: duration,
      });
    }
    const metric = this.metrics.get(name);
    metric.count++;
    metric.total += duration;
    metric.min = Math.min(metric.min, duration);
    metric.max = Math.max(metric.max, duration);
    metric.last = duration;
    this.timers.delete(name);
    return duration;
  },
  getMetrics() {
    const result = {};
    for (const [name, metric] of this.metrics) {
      result[name] = {
        ...metric,
        average: metric.total / metric.count,
      };
    }
    return result;
  },
  clearMetrics() {
    this.metrics.clear();
    this.timers.clear();
  },
};
export { logger, performance };

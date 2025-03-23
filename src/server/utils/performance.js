import { logger } from "./logger.js";
import { EventEmitter } from "events";

class PerformanceMonitor extends EventEmitter {
    constructor() {
        super();
        this.metrics = new Map();
        this.timers = new Map();
        this.history = new Map();
        this.thresholds = new Map();
        this.alerts = new Set();
        this.analysisWindow = 1000; // 1 second window for analysis
        this.maxHistorySize = 1000;
        this.autoCleanupInterval = 3600000; // 1 hour
        this.setupAutoCleanup();
    }

    setupAutoCleanup() {
        setInterval(() => {
            this.cleanupOldData();
        }, this.autoCleanupInterval);
    }

    startTimer(name, metadata = {}) {
        const timer = {
            startTime: process.hrtime(),
            metadata,
            startMemory: process.memoryUsage()
        };
        this.timers.set(name, timer);
    }

    endTimer(name) {
        const timer = this.timers.get(name);
        if (!timer) return null;

        const [seconds, nanoseconds] = process.hrtime(timer.startTime);
        const duration = seconds * 1000 + nanoseconds / 1000000;
        const endMemory = process.memoryUsage();
        
        const memoryDiff = {
            heapUsed: endMemory.heapUsed - timer.startMemory.heapUsed,
            heapTotal: endMemory.heapTotal - timer.startMemory.heapTotal,
            external: endMemory.external - timer.startMemory.external,
            rss: endMemory.rss - timer.startMemory.rss
        };

        this.updateMetrics(name, duration, memoryDiff, timer.metadata);
        this.checkThresholds(name, duration);
        this.timers.delete(name);

        return {
            duration,
            memoryDiff,
            metadata: timer.metadata
        };
    }

    updateMetrics(name, duration, memoryDiff, metadata) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, {
                count: 0,
                totalDuration: 0,
                minDuration: Infinity,
                maxDuration: 0,
                avgDuration: 0,
                memoryUsage: {
                    heapUsed: 0,
                    heapTotal: 0,
                    external: 0,
                    rss: 0
                },
                metadata: new Map()
            });
        }

        const metric = this.metrics.get(name);
        metric.count++;
        metric.totalDuration += duration;
        metric.minDuration = Math.min(metric.minDuration, duration);
        metric.maxDuration = Math.max(metric.maxDuration, duration);
        metric.avgDuration = metric.totalDuration / metric.count;

        // Update memory metrics
        Object.keys(memoryDiff).forEach(key => {
            metric.memoryUsage[key] += memoryDiff[key];
        });

        // Update metadata statistics
        Object.entries(metadata).forEach(([key, value]) => {
            if (!metric.metadata.has(key)) {
                metric.metadata.set(key, new Map());
            }
            const valueMap = metric.metadata.get(key);
            valueMap.set(value, (valueMap.get(value) || 0) + 1);
        });

        // Add to history
        if (!this.history.has(name)) {
            this.history.set(name, []);
        }
        this.history.get(name).push({
            timestamp: Date.now(),
            duration,
            memoryDiff,
            metadata
        });

        // Maintain history size
        if (this.history.get(name).length > this.maxHistorySize) {
            this.history.get(name).shift();
        }

        this.emit('metricUpdate', { name, metric });
    }

    setThreshold(name, threshold, callback) {
        this.thresholds.set(name, { threshold, callback });
    }

    checkThresholds(name, duration) {
        const threshold = this.thresholds.get(name);
        if (threshold && duration > threshold.threshold) {
            threshold.callback(name, duration, threshold.threshold);
            this.emit('thresholdExceeded', { name, duration, threshold: threshold.threshold });
        }
    }

    getMetrics(name = null) {
        if (name) {
            return this.metrics.get(name);
        }
        return Object.fromEntries(this.metrics);
    }

    getHistory(name = null) {
        if (name) {
            return this.history.get(name);
        }
        return Object.fromEntries(this.history);
    }

    analyzePerformance(name) {
        const history = this.history.get(name);
        if (!history || history.length === 0) return null;

        const recentHistory = history.slice(-this.analysisWindow);
        const durations = recentHistory.map(h => h.duration);
        
        return {
            avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
            p95Duration: this.calculatePercentile(durations, 95),
            p99Duration: this.calculatePercentile(durations, 99),
            maxDuration: Math.max(...durations),
            minDuration: Math.min(...durations),
            stdDev: this.calculateStandardDeviation(durations),
            trend: this.calculateTrend(durations),
            memoryTrend: this.calculateMemoryTrend(recentHistory)
        };
    }

    calculatePercentile(values, percentile) {
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index];
    }

    calculateStandardDeviation(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squareDiffs = values.map(value => {
            const diff = value - mean;
            return diff * diff;
        });
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
        return Math.sqrt(avgSquareDiff);
    }

    calculateTrend(values) {
        if (values.length < 2) return 0;
        const x = Array.from({ length: values.length }, (_, i) => i);
        const y = values;
        
        const n = values.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        return slope;
    }

    calculateMemoryTrend(history) {
        const memoryValues = history.map(h => h.memoryDiff);
        return {
            heapUsed: this.calculateTrend(memoryValues.map(m => m.heapUsed)),
            heapTotal: this.calculateTrend(memoryValues.map(m => m.heapTotal)),
            external: this.calculateTrend(memoryValues.map(m => m.external)),
            rss: this.calculateTrend(memoryValues.map(m => m.rss))
        };
    }

    cleanupOldData() {
        const now = Date.now();
        for (const [name, history] of this.history) {
            this.history.set(
                name,
                history.filter(h => now - h.timestamp < 24 * 60 * 60 * 1000) // Keep last 24 hours
            );
        }
    }

    clear() {
        this.metrics.clear();
        this.timers.clear();
        this.history.clear();
        this.thresholds.clear();
        this.alerts.clear();
    }
}

export const performanceMonitor = new PerformanceMonitor(); 
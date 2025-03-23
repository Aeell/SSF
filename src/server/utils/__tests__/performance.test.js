import { performanceMonitor } from "../performance.js";
import { jest } from "@jest/globals";

describe("PerformanceMonitor", () => {
    beforeEach(() => {
        performanceMonitor.clear();
    });

    describe("Timer Operations", () => {
        it("should track timer duration accurately", () => {
            performanceMonitor.startTimer("test");
            // Simulate work
            for (let i = 0; i < 1000000; i++) {}
            const result = performanceMonitor.endTimer("test");

            expect(result).toBeDefined();
            expect(result.duration).toBeGreaterThan(0);
            expect(result.memoryDiff).toBeDefined();
        });

        it("should handle metadata in timers", () => {
            const metadata = { userId: "123", action: "test" };
            performanceMonitor.startTimer("test", metadata);
            const result = performanceMonitor.endTimer("test");

            expect(result.metadata).toEqual(metadata);
        });

        it("should handle non-existent timer gracefully", () => {
            const result = performanceMonitor.endTimer("nonexistent");
            expect(result).toBeNull();
        });
    });

    describe("Metrics Collection", () => {
        it("should collect and update metrics correctly", () => {
            for (let i = 0; i < 3; i++) {
                performanceMonitor.startTimer("test");
                // Simulate varying work
                for (let j = 0; j < i * 1000000; j++) {}
                performanceMonitor.endTimer("test");
            }

            const metrics = performanceMonitor.getMetrics("test");
            expect(metrics.count).toBe(3);
            expect(metrics.avgDuration).toBeGreaterThan(0);
            expect(metrics.minDuration).toBeLessThan(metrics.maxDuration);
        });

        it("should track memory usage metrics", () => {
            performanceMonitor.startTimer("test");
            // Allocate some memory
            const arr = new Array(1000000).fill(1);
            const result = performanceMonitor.endTimer("test");

            expect(result.memoryDiff.heapUsed).toBeGreaterThan(0);
            expect(result.memoryDiff.heapTotal).toBeGreaterThan(0);
        });
    });

    describe("History Management", () => {
        it("should maintain history within size limits", () => {
            const maxSize = performanceMonitor.maxHistorySize;
            for (let i = 0; i < maxSize + 10; i++) {
                performanceMonitor.startTimer("test");
                performanceMonitor.endTimer("test");
            }

            const history = performanceMonitor.getHistory("test");
            expect(history.length).toBeLessThanOrEqual(maxSize);
        });

        it("should store complete history entries", () => {
            const metadata = { test: "data" };
            performanceMonitor.startTimer("test", metadata);
            const result = performanceMonitor.endTimer("test");

            const history = performanceMonitor.getHistory("test");
            expect(history[0]).toMatchObject({
                timestamp: expect.any(Number),
                duration: expect.any(Number),
                memoryDiff: expect.any(Object),
                metadata: expect.any(Object)
            });
        });
    });

    describe("Performance Analysis", () => {
        it("should calculate performance statistics", () => {
            // Generate some test data
            for (let i = 0; i < 100; i++) {
                performanceMonitor.startTimer("test");
                // Simulate varying work
                for (let j = 0; j < i * 10000; j++) {}
                performanceMonitor.endTimer("test");
            }

            const analysis = performanceMonitor.analyzePerformance("test");
            expect(analysis).toMatchObject({
                avgDuration: expect.any(Number),
                p95Duration: expect.any(Number),
                p99Duration: expect.any(Number),
                maxDuration: expect.any(Number),
                minDuration: expect.any(Number),
                stdDev: expect.any(Number),
                trend: expect.any(Number),
                memoryTrend: expect.any(Object)
            });
        });

        it("should calculate trends correctly", () => {
            // Generate increasing durations
            for (let i = 0; i < 10; i++) {
                performanceMonitor.startTimer("test");
                // Simulate increasing work
                for (let j = 0; j < i * 1000000; j++) {}
                performanceMonitor.endTimer("test");
            }

            const analysis = performanceMonitor.analyzePerformance("test");
            expect(analysis.trend).toBeGreaterThan(0); // Should show increasing trend
        });
    });

    describe("Threshold Monitoring", () => {
        it("should trigger threshold callbacks", () => {
            const callback = jest.fn();
            performanceMonitor.setThreshold("test", 100, callback);

            performanceMonitor.startTimer("test");
            // Simulate work exceeding threshold
            for (let i = 0; i < 10000000; i++) {}
            performanceMonitor.endTimer("test");

            expect(callback).toHaveBeenCalled();
        });

        it("should emit threshold events", () => {
            const eventHandler = jest.fn();
            performanceMonitor.on("thresholdExceeded", eventHandler);
            performanceMonitor.setThreshold("test", 100, () => {});

            performanceMonitor.startTimer("test");
            // Simulate work exceeding threshold
            for (let i = 0; i < 10000000; i++) {}
            performanceMonitor.endTimer("test");

            expect(eventHandler).toHaveBeenCalled();
        });
    });

    describe("Auto Cleanup", () => {
        it("should clean up old data", () => {
            // Add some old data
            const oldTimestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
            performanceMonitor.history.set("test", [{
                timestamp: oldTimestamp,
                duration: 100,
                memoryDiff: {},
                metadata: {}
            }]);

            performanceMonitor.cleanupOldData();
            const history = performanceMonitor.getHistory("test");
            expect(history.length).toBe(0);
        });
    });

    describe("Event Emission", () => {
        it("should emit metric update events", () => {
            const eventHandler = jest.fn();
            performanceMonitor.on("metricUpdate", eventHandler);

            performanceMonitor.startTimer("test");
            performanceMonitor.endTimer("test");

            expect(eventHandler).toHaveBeenCalled();
        });
    });
}); 
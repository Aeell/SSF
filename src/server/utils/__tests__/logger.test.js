import { logger, performance, memory } from "../logger.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logsDir = path.join(__dirname, "../../../../logs");

describe("Logger", () => {
    beforeAll(() => {
        // Ensure logs directory exists
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir);
        }
    });

    afterEach(() => {
        // Clear performance metrics after each test
        performance.clearMetrics();
    });

    describe("Performance Monitoring", () => {
        it("should track performance metrics correctly", () => {
            performance.startTimer("test");
            // Simulate some work
            for (let i = 0; i < 1000000; i++) {}
            const duration = performance.endTimer("test");

            expect(duration).toBeGreaterThan(0);
            const metrics = performance.getMetrics();
            expect(metrics.test).toBeDefined();
            expect(metrics.test.count).toBe(1);
            expect(metrics.test.averageDuration).toBeGreaterThan(0);
            expect(metrics.test.minDuration).toBeGreaterThan(0);
            expect(metrics.test.maxDuration).toBeGreaterThan(0);
            expect(metrics.test.recentHistory).toHaveLength(1);
        });

        it("should maintain history of performance measurements", () => {
            for (let i = 0; i < 5; i++) {
                performance.startTimer("test");
                // Simulate varying work
                for (let j = 0; j < i * 1000000; j++) {}
                performance.endTimer("test");
            }

            const metrics = performance.getMetrics();
            expect(metrics.test.recentHistory).toHaveLength(5);
            expect(metrics.test.recentHistory[0].timestamp).toBeLessThan(
                metrics.test.recentHistory[4].timestamp
            );
        });

        it("should handle non-existent timer gracefully", () => {
            const duration = performance.endTimer("nonexistent");
            expect(duration).toBeNull();
        });
    });

    describe("Memory Monitoring", () => {
        it("should return memory usage statistics", () => {
            const usage = memory.getUsage();
            expect(usage).toHaveProperty("heapUsed");
            expect(usage).toHaveProperty("heapTotal");
            expect(usage).toHaveProperty("external");
            expect(usage).toHaveProperty("rss");
            
            // Check that values are in MB and are numbers
            Object.values(usage).forEach(value => {
                expect(value).toMatch(/^\d+\.\d+MB$/);
            });
        });
    });

    describe("Logging", () => {
        it("should write logs to files", () => {
            const testMessage = "Test log message";
            logger.info(testMessage);

            // Wait for file system to catch up
            return new Promise(resolve => setTimeout(resolve, 100)).then(() => {
                const combinedLog = fs.readFileSync(
                    path.join(logsDir, "combined.log"),
                    "utf8"
                );
                expect(combinedLog).toContain(testMessage);
            });
        });

        it("should write error logs to error file", () => {
            const testError = new Error("Test error");
            logger.error("Test error message", { error: testError });

            // Wait for file system to catch up
            return new Promise(resolve => setTimeout(resolve, 100)).then(() => {
                const errorLog = fs.readFileSync(
                    path.join(logsDir, "error.log"),
                    "utf8"
                );
                expect(errorLog).toContain("Test error message");
                expect(errorLog).toContain(testError.stack);
            });
        });
    });
}); 
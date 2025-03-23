import request from "supertest";
import express from "express";
import performanceDashboard from "../performance-dashboard.js";
import { performanceMonitor } from "../performance.js";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("Performance Dashboard", () => {
    let app;

    beforeAll(() => {
        app = express();
        app.use(performanceDashboard);
    });

    beforeEach(() => {
        performanceMonitor.clear();
    });

    describe("API Endpoints", () => {
        it("should return metrics", async () => {
            // Add some test data
            performanceMonitor.startTimer("test");
            performanceMonitor.endTimer("test");

            const response = await request(app).get("/api/metrics");
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("test");
            expect(response.body.test).toHaveProperty("count", 1);
        });

        it("should return history for a specific metric", async () => {
            // Add some test data
            performanceMonitor.startTimer("test");
            performanceMonitor.endTimer("test");

            const response = await request(app).get("/api/history/test");
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(1);
        });

        it("should return performance analysis", async () => {
            // Add some test data
            for (let i = 0; i < 10; i++) {
                performanceMonitor.startTimer("test");
                performanceMonitor.endTimer("test");
            }

            const response = await request(app).get("/api/analysis/test");
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("avgDuration");
            expect(response.body).toHaveProperty("p95Duration");
            expect(response.body).toHaveProperty("trend");
        });
    });

    describe("Dashboard UI", () => {
        it("should serve the dashboard HTML", async () => {
            const response = await request(app).get("/");
            expect(response.status).toBe(200);
            expect(response.text).toContain("Performance Dashboard");
            expect(response.text).toContain("Chart.js");
        });

        it("should include all required UI components", async () => {
            const response = await request(app).get("/");
            expect(response.text).toContain("System Overview");
            expect(response.text).toContain("Performance Trends");
            expect(response.text).toContain("Memory Usage");
            expect(response.text).toContain("Alerts");
        });

        it("should include required JavaScript functions", async () => {
            const response = await request(app).get("/");
            expect(response.text).toContain("fetchMetrics");
            expect(response.text).toContain("fetchHistory");
            expect(response.text).toContain("fetchAnalysis");
            expect(response.text).toContain("updateDashboard");
        });
    });

    describe("Static File Serving", () => {
        it("should serve static files from public directory", async () => {
            const response = await request(app).get("/test.txt");
            expect(response.status).toBe(404); // Should return 404 for non-existent files
        });
    });

    describe("Error Handling", () => {
        it("should handle non-existent metric names gracefully", async () => {
            const response = await request(app).get("/api/history/nonexistent");
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });

        it("should handle analysis of non-existent metrics", async () => {
            const response = await request(app).get("/api/analysis/nonexistent");
            expect(response.status).toBe(200);
            expect(response.body).toBeNull();
        });
    });

    describe("Data Visualization", () => {
        it("should include chart.js configuration", async () => {
            const response = await request(app).get("/");
            expect(response.text).toContain("new Chart(ctx, {");
            expect(response.text).toContain("type: 'line'");
            expect(response.text).toContain("responsive: true");
        });

        it("should include alert thresholds", async () => {
            const response = await request(app).get("/");
            expect(response.text).toContain("analysis.trend > 0.1");
            expect(response.text).toContain("analysis.p95Duration > 1000");
        });
    });
}); 
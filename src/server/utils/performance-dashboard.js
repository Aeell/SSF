import express from "express";
import { performanceMonitor } from "./performance.js";
import { logger } from "./logger.js";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Serve static files
router.use(express.static(path.join(__dirname, "../../../public")));

// API endpoints
router.get("/api/metrics", (req, res) => {
    const metrics = performanceMonitor.getMetrics();
    res.json(metrics);
});

router.get("/api/history/:name", (req, res) => {
    const history = performanceMonitor.getHistory(req.params.name);
    res.json(history);
});

router.get("/api/analysis/:name", (req, res) => {
    const analysis = performanceMonitor.analyzePerformance(req.params.name);
    res.json(analysis);
});

// Dashboard HTML
router.get("/", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Performance Dashboard</title>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: #f5f5f5;
                }
                .dashboard {
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .card {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .chart-container {
                    position: relative;
                    height: 300px;
                    margin-bottom: 20px;
                }
                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-bottom: 20px;
                }
                .metric-card {
                    background: white;
                    padding: 15px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .metric-value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #2196F3;
                }
                .metric-label {
                    color: #666;
                    font-size: 14px;
                }
                .alert {
                    background: #ffebee;
                    color: #c62828;
                    padding: 10px;
                    border-radius: 4px;
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
            <div class="dashboard">
                <h1>Performance Dashboard</h1>
                
                <div class="card">
                    <h2>System Overview</h2>
                    <div class="metrics-grid" id="systemMetrics"></div>
                </div>

                <div class="card">
                    <h2>Performance Trends</h2>
                    <div class="chart-container">
                        <canvas id="performanceChart"></canvas>
                    </div>
                </div>

                <div class="card">
                    <h2>Memory Usage</h2>
                    <div class="chart-container">
                        <canvas id="memoryChart"></canvas>
                    </div>
                </div>

                <div class="card">
                    <h2>Alerts</h2>
                    <div id="alerts"></div>
                </div>
            </div>

            <script>
                let performanceChart, memoryChart;

                async function fetchMetrics() {
                    const response = await fetch('/api/metrics');
                    return await response.json();
                }

                async function fetchHistory(name) {
                    const response = await fetch(\`/api/history/\${name}\`);
                    return await response.json();
                }

                async function fetchAnalysis(name) {
                    const response = await fetch(\`/api/analysis/\${name}\`);
                    return await response.json();
                }

                function updateSystemMetrics(metrics) {
                    const container = document.getElementById('systemMetrics');
                    container.innerHTML = '';

                    Object.entries(metrics).forEach(([name, metric]) => {
                        const card = document.createElement('div');
                        card.className = 'metric-card';
                        card.innerHTML = \`
                            <div class="metric-value">\${metric.avgDuration.toFixed(2)}ms</div>
                            <div class="metric-label">\${name}</div>
                            <div>Count: \${metric.count}</div>
                            <div>Min: \${metric.minDuration.toFixed(2)}ms</div>
                            <div>Max: \${metric.maxDuration.toFixed(2)}ms</div>
                        \`;
                        container.appendChild(card);
                    });
                }

                function updatePerformanceChart(history) {
                    const ctx = document.getElementById('performanceChart').getContext('2d');
                    
                    if (performanceChart) {
                        performanceChart.destroy();
                    }

                    const timestamps = history.map(h => new Date(h.timestamp).toLocaleTimeString());
                    const durations = history.map(h => h.duration);

                    performanceChart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: timestamps,
                            datasets: [{
                                label: 'Duration (ms)',
                                data: durations,
                                borderColor: '#2196F3',
                                tension: 0.1
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    beginAtZero: true
                                }
                            }
                        }
                    });
                }

                function updateMemoryChart(history) {
                    const ctx = document.getElementById('memoryChart').getContext('2d');
                    
                    if (memoryChart) {
                        memoryChart.destroy();
                    }

                    const timestamps = history.map(h => new Date(h.timestamp).toLocaleTimeString());
                    const heapUsed = history.map(h => h.memoryDiff.heapUsed / 1024 / 1024);
                    const heapTotal = history.map(h => h.memoryDiff.heapTotal / 1024 / 1024);

                    memoryChart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: timestamps,
                            datasets: [
                                {
                                    label: 'Heap Used (MB)',
                                    data: heapUsed,
                                    borderColor: '#4CAF50',
                                    tension: 0.1
                                },
                                {
                                    label: 'Heap Total (MB)',
                                    data: heapTotal,
                                    borderColor: '#FFC107',
                                    tension: 0.1
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    beginAtZero: true
                                }
                            }
                        }
                    });
                }

                function updateAlerts(analysis) {
                    const container = document.getElementById('alerts');
                    container.innerHTML = '';

                    if (analysis.trend > 0.1) {
                        const alert = document.createElement('div');
                        alert.className = 'alert';
                        alert.textContent = 'Warning: Performance degradation detected';
                        container.appendChild(alert);
                    }

                    if (analysis.p95Duration > 1000) {
                        const alert = document.createElement('div');
                        alert.className = 'alert';
                        alert.textContent = 'Warning: High latency detected (p95 > 1000ms)';
                        container.appendChild(alert);
                    }
                }

                async function updateDashboard() {
                    try {
                        const metrics = await fetchMetrics();
                        const history = await fetchHistory('test');
                        const analysis = await fetchAnalysis('test');

                        updateSystemMetrics(metrics);
                        updatePerformanceChart(history);
                        updateMemoryChart(history);
                        updateAlerts(analysis);
                    } catch (error) {
                        console.error('Error updating dashboard:', error);
                    }
                }

                // Update dashboard every 5 seconds
                setInterval(updateDashboard, 5000);
                updateDashboard();
            </script>
        </body>
        </html>
    `);
});

export default router; 
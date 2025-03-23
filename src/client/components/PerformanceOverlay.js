import { logger } from "../utils/logger.js";
export class PerformanceOverlay {
  constructor(game) {
    if (!game) {
      throw new Error("Game instance is required for PerformanceOverlay");
    }
    this.game = game;
    this.element = document.createElement("div");
    this.element.className = "performance-overlay";
    document.body.appendChild(this.element);
    this.debugPanel = document.createElement("div");
    this.debugPanel.className = "debug-panel";
    document.body.appendChild(this.debugPanel);
    this.updateInterval = setInterval(() => this.update(), 1000);
    this.logUpdateInterval = setInterval(() => this.updateDebugLogs(), 2000);
  }
  formatNumber(value, decimals = 1) {
    if (typeof value !== "number" || isNaN(value)) {
      return "0";
    }
    return value.toFixed(decimals);
  }
  update() {
    try {
      const metrics = this.game.getPerformanceMetrics() || {};
      const {
        fps = 0,
        frameTime = 0,
        physicsTime = 0,
        networkLatency = 0,
      } = metrics;
      let className = "performance-overlay";
      if (fps < 30) {
        className += " error";
        logger.warn("Low FPS detected:", { fps });
      } else if (fps < 50) {
        className += " warning";
        logger.info("FPS dropping:", { fps });
      }
      this.element.className = className;
      this.element.innerHTML = `
                FPS: ${this.formatNumber(fps)}<br>
                Frame Time: ${this.formatNumber(frameTime)}ms<br>
                Physics Time: ${this.formatNumber(physicsTime)}ms<br>
                Network Latency: ${this.formatNumber(networkLatency, 0)}ms
            `;
    } catch (error) {
      logger.error("Failed to update performance overlay:", {
        error: error.message,
        stack: error.stack,
      });
    }
  }
  updateDebugLogs() {
    try {
      const logs = Array.isArray(logger.getRecentLogs)
        ? logger.getRecentLogs(10)
        : [];
      this.debugPanel.innerHTML =
        "<pre>" +
        logs
          .map(
            (log) =>
              `[${log.timestamp || new Date().toISOString()}] ${log.level || "INFO"}: ${log.message || ""}`,
          )
          .join("\n") +
        "</pre>";
    } catch (error) {
      logger.error("Failed to update debug logs:", {
        error: error.message,
        stack: error.stack,
      });
      this.debugPanel.innerHTML = "<pre>Error loading logs</pre>";
    }
  }
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.logUpdateInterval) {
      clearInterval(this.logUpdateInterval);
    }
    if (this.element && this.element.parentNode) {
      this.element.remove();
    }
    if (this.debugPanel && this.debugPanel.parentNode) {
      this.debugPanel.remove();
    }
  }
}

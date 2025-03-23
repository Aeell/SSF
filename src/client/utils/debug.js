import logger from "./logger.js";
export class Debug {
  constructor(game) {
    this.game = game;
    this.enabled = false;
    this.showPhysics = false;
    this.showColliders = false;
    this.showGrid = false;
    this.showFPS = true;
    this.showPlayerInfo = false;
    this.showBallInfo = false;
    this.showAIInfo = false;
    this.showNetworkInfo = false;
    this.showPerformanceMetrics = false;
    this.metrics = {
      fps: 0,
      physicsTime: 0,
      renderTime: 0,
      networkLatency: 0,
      memoryUsage: 0,
      drawCalls: 0,
      triangles: 0,
    };
    this.setupUI();
  }
  setupUI() {
    // Create debug panel
    const panel = document.createElement("div");
    panel.id = "debug-panel";
    panel.innerHTML = `
      <div class="debug-header">
        <h3>Debug Panel</h3>
        <button id="toggle-debug">Toggle Debug</button>
      </div>
      <div class="debug-content">
        <div class="debug-section">
          <h4>Visualization</h4>
          <label><input type="checkbox" id="show-physics"> Show Physics</label>
          <label><input type="checkbox" id="show-colliders"> Show Colliders</label>
          <label><input type="checkbox" id="show-grid"> Show Grid</label>
        </div>
        <div class="debug-section">
          <h4>Information</h4>
          <label><input type="checkbox" id="show-fps"> Show FPS</label>
          <label><input type="checkbox" id="show-player-info"> Show Player Info</label>
          <label><input type="checkbox" id="show-ball-info"> Show Ball Info</label>
          <label><input type="checkbox" id="show-ai-info"> Show AI Info</label>
          <label><input type="checkbox" id="show-network-info"> Show Network Info</label>
        </div>
        <div class="debug-section">
          <h4>Performance</h4>
          <label><input type="checkbox" id="show-performance"> Show Performance Metrics</label>
        </div>
        <div class="debug-section">
          <h4>Controls</h4>
          <button id="reset-ball">Reset Ball</button>
          <button id="reset-players">Reset Players</button>
          <button id="toggle-ai">Toggle AI</button>
        </div>
      </div>
    `;
    document.body.appendChild(panel);
    // Add event listeners
    document
      .getElementById("toggle-debug")
      .addEventListener("click", () => this.toggleDebug());
    document
      .getElementById("show-physics")
      .addEventListener("change", (e) => (this.showPhysics = e.target.checked));
    document
      .getElementById("show-colliders")
      .addEventListener(
        "change",
        (e) => (this.showColliders = e.target.checked),
      );
    document
      .getElementById("show-grid")
      .addEventListener("change", (e) => (this.showGrid = e.target.checked));
    document
      .getElementById("show-fps")
      .addEventListener("change", (e) => (this.showFPS = e.target.checked));
    document
      .getElementById("show-player-info")
      .addEventListener(
        "change",
        (e) => (this.showPlayerInfo = e.target.checked),
      );
    document
      .getElementById("show-ball-info")
      .addEventListener(
        "change",
        (e) => (this.showBallInfo = e.target.checked),
      );
    document
      .getElementById("show-ai-info")
      .addEventListener("change", (e) => (this.showAIInfo = e.target.checked));
    document
      .getElementById("show-network-info")
      .addEventListener(
        "change",
        (e) => (this.showNetworkInfo = e.target.checked),
      );
    document
      .getElementById("show-performance")
      .addEventListener(
        "change",
        (e) => (this.showPerformanceMetrics = e.target.checked),
      );
    document
      .getElementById("reset-ball")
      .addEventListener("click", () => this.game.ball.reset());
    document
      .getElementById("reset-players")
      .addEventListener("click", () => this.resetPlayers());
    document
      .getElementById("toggle-ai")
      .addEventListener("click", () => this.toggleAI());
  }
  toggleDebug() {
    this.enabled = !this.enabled;
    document.getElementById("debug-panel").style.display = this.enabled
      ? "block"
      : "none";
    logger.info(`[Debug] Debug mode ${this.enabled ? "enabled" : "disabled"}`);
  }
  resetPlayers() {
    this.game.players.forEach((player) => player.reset());
    this.game.aiPlayers.forEach((ai) => ai.reset());
    logger.info("[Debug] All players reset");
  }
  toggleAI() {
    this.game.aiPlayers.forEach((ai) => (ai.enabled = !ai.enabled));
    logger.info(
      `[Debug] AI ${this.game.aiPlayers.values().next().value.enabled ? "enabled" : "disabled"}`,
    );
  }
  updateMetrics() {
    if (!this.enabled) return;
    // Update FPS
    this.metrics.fps = this.game.fps;
    // Update physics time
    this.metrics.physicsTime = this.game.physicsWorld.profiler.getAverageTime();
    // Update render info
    const info = this.game.renderer.info;
    this.metrics.drawCalls = info.render.calls;
    this.metrics.triangles = info.render.triangles;
    // Update network latency if in multiplayer
    if (this.game.gameMode === "multiplayer") {
      this.metrics.networkLatency = this.game.room.connection.latency;
    }
    // Update memory usage
    this.metrics.memoryUsage = performance.memory
      ? performance.memory.usedJSHeapSize / 1024 / 1024
      : 0;
    // Update debug info display
    this.updateDebugInfo();
  }
  updateDebugInfo() {
    const info = document.getElementById("debug-info");
    if (!info) return;
    let html = "";
    if (this.showFPS) {
      html += `<div>FPS: ${this.metrics.fps.toFixed(2)}</div>`;
    }
    if (this.showPlayerInfo) {
      html += this.getPlayerInfo();
    }
    if (this.showBallInfo) {
      html += this.getBallInfo();
    }
    if (this.showAIInfo) {
      html += this.getAIInfo();
    }
    if (this.showNetworkInfo && this.game.gameMode === "multiplayer") {
      html += this.getNetworkInfo();
    }
    if (this.showPerformanceMetrics) {
      html += this.getPerformanceMetrics();
    }
    info.innerHTML = html;
  }
  getPlayerInfo() {
    const player = this.game.localPlayer;
    if (!player) return "";
    const pos = player.getPosition();
    const vel = player.body.velocity;
    return `
      <div class="debug-section">
        <h4>Player Info</h4>
        <div>Position: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})</div>
        <div>Velocity: (${vel.x.toFixed(2)}, ${vel.y.toFixed(2)}, ${vel.z.toFixed(2)})</div>
        <div>On Ground: ${player.isOnGround}</div>
      </div>
    `;
  }
  getBallInfo() {
    const ball = this.game.ball;
    if (!ball) return "";
    const pos = ball.getPosition();
    const vel = ball.body.velocity;
    return `
      <div class="debug-section">
        <h4>Ball Info</h4>
        <div>Position: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})</div>
        <div>Velocity: (${vel.x.toFixed(2)}, ${vel.y.toFixed(2)}, ${vel.z.toFixed(2)})</div>
        <div>Angular Velocity: (${ball.body.angularVelocity.x.toFixed(2)}, ${ball.body.angularVelocity.y.toFixed(2)}, ${ball.body.angularVelocity.z.toFixed(2)})</div>
      </div>
    `;
  }
  getAIInfo() {
    let html = '<div class="debug-section"><h4>AI Info</h4>';
    this.game.aiPlayers.forEach((ai, id) => {
      const pos = ai.getPosition();
      html += `
        <div class="ai-player">
          <div>AI ${id}</div>
          <div>State: ${ai.state}</div>
          <div>Position: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})</div>
        </div>
      `;
    });
    html += "</div>";
    return html;
  }
  getNetworkInfo() {
    return `
      <div class="debug-section">
        <h4>Network Info</h4>
        <div>Latency: ${this.metrics.networkLatency.toFixed(2)}ms</div>
        <div>Connected Players: ${this.game.players.size}</div>
        <div>Room ID: ${this.game.room.id}</div>
      </div>
    `;
  }
  getPerformanceMetrics() {
    return `
      <div class="debug-section">
        <h4>Performance Metrics</h4>
        <div>Physics Time: ${this.metrics.physicsTime.toFixed(2)}ms</div>
        <div>Draw Calls: ${this.metrics.drawCalls}</div>
        <div>Triangles: ${this.metrics.triangles}</div>
        <div>Memory Usage: ${this.metrics.memoryUsage.toFixed(2)}MB</div>
      </div>
    `;
  }
  cleanup() {
    const panel = document.getElementById("debug-panel");
    if (panel) {
      panel.remove();
    }
  }
}

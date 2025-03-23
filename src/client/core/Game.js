import * as THREE from "three";
import * as CANNON from "cannon-es";
import { Field } from "@/entities/Field.js";
import { Ball } from "@/entities/Ball.js";
import { Player } from "@/entities/Player.js";
import { AIPlayer } from "@/entities/AIPlayer.js";
import { EventBus } from "@/core/EventBus.js";
import { Debug } from "@/utils/debug.js";
import logger from "@/utils/logger.js";
export class Game {
  constructor({ assets, room, gameMode = "multiplayer" }) {
    this.assets = assets;
    this.room = room;
    this.gameMode = gameMode;
    this.eventBus = new EventBus();
    this.players = new Map();
    this.aiPlayers = new Map();
    // Scene setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document
      .getElementById("game-container")
      .appendChild(this.renderer.domElement);
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 50, 50);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
    // Initial camera position
    this.camera.position.set(0, 20, 30);
    this.camera.lookAt(0, 0, 0);
    // Physics
    this.physicsWorld = new CANNON.World();
    this.physicsWorld.gravity.set(0, -9.82, 0);
    // Materials
    this.groundMaterial = new CANNON.Material("ground");
    this.ballMaterial = new CANNON.Material("ball");
    this.playerMaterial = new CANNON.Material("player");
    this.physicsWorld.addContactMaterial(
      new CANNON.ContactMaterial(this.groundMaterial, this.ballMaterial, {
        friction: 0.3,
        restitution: 0.7,
      }),
    );
    this.physicsWorld.addContactMaterial(
      new CANNON.ContactMaterial(this.groundMaterial, this.playerMaterial, {
        friction: 0.5,
        restitution: 0.3,
      }),
    );
    this.physicsWorld.addContactMaterial(
      new CANNON.ContactMaterial(this.ballMaterial, this.playerMaterial, {
        friction: 0.3,
        restitution: 0.8,
      }),
    );
    // Entities
    this.field = new Field(
      this.scene,
      this.physicsWorld,
      this.groundMaterial,
      this.assets,
    );
    this.ball = new Ball(
      this.scene,
      this.physicsWorld,
      this.ballMaterial,
      this.assets,
    );
    // Create local player
    this.localPlayer = new Player(
      this.scene,
      this.physicsWorld,
      this.playerMaterial,
      this.assets,
      this.room.sessionId,
      true,
    );
    this.players.set(this.room.sessionId, this.localPlayer);
    // Setup AI if in single player mode
    if (this.gameMode === "singleplayer") {
      this.setupAI();
    }
    // Networking
    if (this.gameMode === "multiplayer") {
      this.setupNetworking();
    }
    // Game state
    this.score = { home: 0, away: 0 };
    this.lastGoalTime = 0;
    this.goalCooldown = 2000; // 2 seconds cooldown between goals
    this.gameStarted = false;
    this.countdown = 3;
    // Game loop
    this.lastTime = performance.now();
    this.fixedTimeStep = 1 / 60;
    this.maxSubSteps = 3;
    this.fps = 0;
    this.frameCount = 0;
    this.lastFpsTime = performance.now();
    // Initialize debug system
    this.debug = new Debug(this);
    // Create debug info container
    const debugInfo = document.createElement("div");
    debugInfo.id = "debug-info";
    document.body.appendChild(debugInfo);
    // Create performance overlay
    const performanceOverlay = document.createElement("div");
    performanceOverlay.id = "performance-overlay";
    document.body.appendChild(performanceOverlay);
    // Create physics debug container
    const physicsDebug = document.createElement("div");
    physicsDebug.className = "physics-debug";
    document.getElementById("game-container").appendChild(physicsDebug);
    // Add performance monitoring thresholds
    this.performanceThresholds = {
      fps: 30,
      physicsTime: 16, // ms
      memoryUsage: 500, // MB
      networkLatency: 100, // ms
    };
    // Add performance metrics
    this.metrics = {
      fps: 0,
      physicsTime: 0,
      renderTime: 0,
      networkLatency: 0,
      memoryUsage: 0,
      drawCalls: 0,
      triangles: 0,
    };
    // Add error handling
    this.errorCount = 0;
    this.maxErrors = 5;
    this.errorTimeout = 5000; // 5 seconds
    // Add state management
    this.gameState = {
      isPaused: false,
      isGameOver: false,
      lastSaveTime: 0,
      autoSaveInterval: 60000, // 1 minute
    };
    // Add performance warnings
    this.checkPerformance();
    // Start animation loop
    this.animate();
    // Handle window resize
    window.addEventListener("resize", () => this.onWindowResize());
    logger.info("[Game] Initialized successfully");
  }
  setupAI() {
    // Create AI players
    const aiCount = 3; // Number of AI players per team
    for (let i = 0; i < aiCount; i++) {
      // Home team AI
      const homeAI = new AIPlayer(
        this.scene,
        this.physicsWorld,
        this.playerMaterial,
        this.assets,
        `home-ai-${i}`,
      );
      homeAI.setBall(this.ball);
      homeAI.setGoalPosition(24, 0); // Right goal
      this.aiPlayers.set(`home-ai-${i}`, homeAI);
      // Away team AI
      const awayAI = new AIPlayer(
        this.scene,
        this.physicsWorld,
        this.playerMaterial,
        this.assets,
        `away-ai-${i}`,
      );
      awayAI.setBall(this.ball);
      awayAI.setGoalPosition(-24, 0); // Left goal
      this.aiPlayers.set(`away-ai-${i}`, awayAI);
    }
    logger.info("[Game] AI players initialized");
  }
  startGame() {
    if (this.gameStarted) return;
    this.gameStarted = true;
    this.countdown = 3;
    this.eventBus.emit("gameStart", { countdown: this.countdown });
    logger.info("[Game] Starting game countdown");
  }
  updateCountdown() {
    if (!this.gameStarted) return;
    const now = performance.now();
    if (now - this.lastGoalTime >= 1000) {
      this.countdown--;
      this.lastGoalTime = now;
      this.eventBus.emit("countdown", { count: this.countdown });
      if (this.countdown <= 0) {
        this.gameStarted = true;
        this.eventBus.emit("gameStart", { countdown: 0 });
        logger.info("[Game] Game started");
      }
    }
  }
  setupNetworking() {
    // Handle player joins
    this.room.state.players.onAdd((player, key) => {
      if (key !== this.room.sessionId) {
        const newPlayer = new Player(
          this.scene,
          this.physicsWorld,
          this.playerMaterial,
          this.assets,
          key,
          false,
        );
        this.players.set(key, newPlayer);
        logger.info(`[Game] Player ${key} joined`);
      }
    });
    // Handle player leaves
    this.room.state.players.onRemove((player, key) => {
      const playerToRemove = this.players.get(key);
      if (playerToRemove) {
        playerToRemove.cleanup();
        this.players.delete(key);
        logger.info(`[Game] Player ${key} left`);
      }
    });
    // Handle state updates
    this.room.onStateChange((state) => {
      // Update ball position
      this.ball.body.position.copy(state.ball.position);
      this.ball.body.quaternion.copy(state.ball.quaternion);
      // Update remote players
      state.players.forEach((playerState, key) => {
        if (key !== this.room.sessionId) {
          const player = this.players.get(key);
          if (player) {
            player.setPosition(playerState.position);
          }
        }
      });
      // Update score
      if (state.score) {
        this.score = state.score;
        this.eventBus.emit("scoreUpdate", this.score);
      }
    });
    // Handle kick messages
    this.room.onMessage("kick", (message) => {
      const { playerId, force } = message;
      if (playerId !== this.room.sessionId) {
        this.ball.applyImpulse(force);
      }
    });
  }
  checkForGoal() {
    const now = performance.now();
    if (now - this.lastGoalTime < this.goalCooldown) return;
    const ballPos = this.ball.getPosition();
    const goalDepth = 2;
    const goalWidth = 7;
    const goalHeight = 3;
    // Check left goal (home team)
    if (
      ballPos.x < -24 &&
      Math.abs(ballPos.z) < goalWidth / 2 &&
      ballPos.y < goalHeight
    ) {
      this.score.away++;
      this.handleGoal("away");
    }
    // Check right goal (away team)
    else if (
      ballPos.x > 24 &&
      Math.abs(ballPos.z) < goalWidth / 2 &&
      ballPos.y < goalHeight
    ) {
      this.score.home++;
      this.handleGoal("home");
    }
  }
  handleGoal(scoringTeam) {
    this.lastGoalTime = performance.now();
    this.ball.reset();
    if (this.gameMode === "multiplayer") {
      this.room.send("goal", { team: scoringTeam, score: this.score });
    }
    this.eventBus.emit("goal", { team: scoringTeam, score: this.score });
    logger.info(`[Game] Goal scored by ${scoringTeam} team!`);
  }
  updateCamera() {
    if (this.localPlayer) {
      const playerPos = this.localPlayer.getPosition();
      const ballPos = this.ball.getPosition();
      // Calculate camera target position (between player and ball)
      const targetX = (playerPos.x + ballPos.x) / 2;
      const targetZ = (playerPos.z + ballPos.z) / 2;
      // Smoothly move camera
      this.camera.position.lerp(
        new THREE.Vector3(targetX, 20, targetZ + 30),
        0.05,
      );
      this.camera.lookAt(targetX, 0, targetZ);
    }
  }
  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.gameState.isPaused) return;
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    try {
      // Update physics
      const physicsStart = performance.now();
      this.physicsWorld.step(this.fixedTimeStep, deltaTime, this.maxSubSteps);
      this.metrics.physicsTime = performance.now() - physicsStart;
      // Update entities
      this.field.update();
      this.ball.update();
      this.players.forEach((player) => player.update(deltaTime));
      this.aiPlayers.forEach((ai) => ai.update(deltaTime));
      // Update game state
      this.updateCountdown();
      this.checkForGoal();
      this.updateCamera();
      this.autoSave();
      // Update debug metrics
      this.debug.updateMetrics();
      // Sync with server in multiplayer mode
      if (this.gameMode === "multiplayer" && this.localPlayer) {
        this.room.send("updatePlayer", {
          position: this.localPlayer.getPosition(),
        });
        this.room.send("updateBall", {
          position: this.ball.getPosition(),
          quaternion: this.ball.body.quaternion,
        });
      }
      // Update FPS counter
      this.frameCount++;
      const elapsed = (currentTime - this.lastFpsTime) / 1000;
      if (elapsed >= 1) {
        this.metrics.fps = this.frameCount / elapsed;
        this.frameCount = 0;
        this.lastFpsTime = currentTime;
        logger.debug("[Game] FPS:", { fps: this.metrics.fps.toFixed(2) });
      }
      // Check performance
      this.checkPerformance();
      // Render scene
      const renderStart = performance.now();
      this.renderer.render(this.scene, this.camera);
      this.metrics.renderTime = performance.now() - renderStart;
      // Update render metrics
      const info = this.renderer.info;
      this.metrics.drawCalls = info.render.calls;
      this.metrics.triangles = info.render.triangles;
      // Render physics debug if enabled
      if (this.debug.showPhysics) {
        this.renderPhysicsDebug();
      }
    } catch (error) {
      this.handleError(error, "animate");
    }
  }
  renderPhysicsDebug() {
    const physicsDebug = document.querySelector(".physics-debug");
    if (!physicsDebug) return;
    // Clear previous debug visualization
    physicsDebug.innerHTML = "";
    // Create SVG for physics visualization
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    physicsDebug.appendChild(svg);
    // Project 3D coordinates to 2D screen space
    const project = (vector) => {
      const projected = vector.clone().project(this.camera);
      return {
        x: ((projected.x + 1) * window.innerWidth) / 2,
        y: ((-projected.y + 1) * window.innerHeight) / 2,
      };
    };
    // Draw colliders if enabled
    if (this.debug.showColliders) {
      // Draw ball collider
      const ballPos = this.ball.getPosition();
      const ballScreen = project(ballPos);
      const ballRadius = this.ball.radius * 20; // Scale for visualization
      const ballCircle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      ballCircle.setAttribute("cx", ballScreen.x);
      ballCircle.setAttribute("cy", ballScreen.y);
      ballCircle.setAttribute("r", ballRadius);
      ballCircle.setAttribute("class", "collider");
      svg.appendChild(ballCircle);
      // Draw player colliders
      this.players.forEach((player) => {
        const playerPos = player.getPosition();
        const playerScreen = project(playerPos);
        const playerRadius = player.radius * 20;
        const playerCircle = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle",
        );
        playerCircle.setAttribute("cx", playerScreen.x);
        playerCircle.setAttribute("cy", playerScreen.y);
        playerCircle.setAttribute("r", playerRadius);
        playerCircle.setAttribute("class", "collider");
        svg.appendChild(playerCircle);
      });
    }
    // Draw grid if enabled
    if (this.debug.showGrid) {
      const gridSize = 50;
      const gridStep = 5;
      for (let x = -gridSize; x <= gridSize; x += gridStep) {
        for (let z = -gridSize; z <= gridSize; z += gridStep) {
          const point = project(new THREE.Vector3(x, 0, z));
          const dot = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle",
          );
          dot.setAttribute("cx", point.x);
          dot.setAttribute("cy", point.y);
          dot.setAttribute("r", 1);
          dot.setAttribute("class", "grid");
          svg.appendChild(dot);
        }
      }
    }
  }
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  cleanup() {
    try {
      // Cleanup all players
      this.players.forEach((player) => player.cleanup());
      this.players.clear();
      this.aiPlayers.forEach((ai) => ai.cleanup());
      this.aiPlayers.clear();
      // Cleanup other entities
      this.field.cleanup();
      this.ball.cleanup();
      // Leave room and cleanup renderer
      if (this.gameMode === "multiplayer") {
        this.room.leave();
      }
      this.renderer.dispose();
      this.scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      window.removeEventListener("resize", () => this.onWindowResize());
      // Cleanup debug elements
      const debugInfo = document.getElementById("debug-info");
      if (debugInfo) debugInfo.remove();
      const performanceOverlay = document.getElementById("performance-overlay");
      if (performanceOverlay) performanceOverlay.remove();
      const physicsDebug = document.querySelector(".physics-debug");
      if (physicsDebug) physicsDebug.remove();
      this.debug.cleanup();
      // Save final game state
      this.saveGameState();
      logger.info("[Game] Cleanup complete");
    } catch (error) {
      this.handleError(error, "cleanup");
    }
  }
  checkPerformance() {
    const warnings = [];
    if (this.metrics.fps < this.performanceThresholds.fps) {
      warnings.push(`Low FPS: ${this.metrics.fps.toFixed(2)}`);
    }
    if (this.metrics.physicsTime > this.performanceThresholds.physicsTime) {
      warnings.push(
        `High physics time: ${this.metrics.physicsTime.toFixed(2)}ms`,
      );
    }
    if (this.metrics.memoryUsage > this.performanceThresholds.memoryUsage) {
      warnings.push(
        `High memory usage: ${this.metrics.memoryUsage.toFixed(2)}MB`,
      );
    }
    if (
      this.metrics.networkLatency > this.performanceThresholds.networkLatency
    ) {
      warnings.push(
        `High network latency: ${this.metrics.networkLatency.toFixed(2)}ms`,
      );
    }
    if (warnings.length > 0) {
      logger.warn("[Performance] Issues detected:", warnings);
      this.eventBus.emit("performanceWarning", { warnings });
    }
  }
  handleError(error, context) {
    this.errorCount++;
    logger.error(`[Game] Error in ${context}:`, error);
    this.eventBus.emit("error", { context, error });
    // Show error UI
    const errorMessage = document.createElement("div");
    errorMessage.className = "error-message";
    errorMessage.textContent = `Error in ${context}: ${error.message}`;
    document.body.appendChild(errorMessage);
    // Remove error message after timeout
    setTimeout(() => {
      errorMessage.remove();
      this.errorCount--;
    }, this.errorTimeout);
    // Handle critical errors
    if (this.errorCount >= this.maxErrors) {
      this.handleCriticalError();
    }
  }
  handleCriticalError() {
    logger.error("[Game] Critical error threshold reached");
    this.eventBus.emit("criticalError");
    // Show critical error UI
    const criticalError = document.createElement("div");
    criticalError.className = "critical-error";
    criticalError.innerHTML = `
      <h3>Critical Error</h3>
      <p>Too many errors detected. The game will attempt to recover.</p>
      <button onclick="window.location.reload()">Reload Game</button>
    `;
    document.body.appendChild(criticalError);
  }
  saveGameState() {
    try {
      const state = {
        score: this.score,
        ballPosition: this.ball.getPosition(),
        playerPositions: Array.from(this.players.entries()).map(
          ([id, player]) => ({
            id,
            position: player.getPosition(),
          }),
        ),
        timestamp: Date.now(),
      };
      localStorage.setItem("gameState", JSON.stringify(state));
      this.gameState.lastSaveTime = Date.now();
      logger.info("[Game] State saved successfully");
    } catch (error) {
      this.handleError(error, "saveGameState");
    }
  }
  loadGameState() {
    try {
      const state = localStorage.getItem("gameState");
      if (state) {
        const parsed = JSON.parse(state);
        this.score = parsed.score;
        this.ball.setPosition(parsed.ballPosition);
        parsed.playerPositions.forEach(({ id, position }) => {
          const player = this.players.get(id);
          if (player) player.setPosition(position);
        });
        logger.info("[Game] State loaded successfully");
      }
    } catch (error) {
      this.handleError(error, "loadGameState");
    }
  }
  autoSave() {
    if (
      Date.now() - this.gameState.lastSaveTime >=
      this.gameState.autoSaveInterval
    ) {
      this.saveGameState();
    }
  }
  pauseGame() {
    if (this.gameState.isPaused) return;
    this.gameState.isPaused = true;
    this.eventBus.emit("gamePaused");
    logger.info("[Game] Game paused");
  }
  resumeGame() {
    if (!this.gameState.isPaused) return;
    this.gameState.isPaused = false;
    this.eventBus.emit("gameResumed");
    logger.info("[Game] Game resumed");
  }
  endGame() {
    if (this.gameState.isGameOver) return;
    this.gameState.isGameOver = true;
    this.saveGameState();
    this.eventBus.emit("gameOver", { score: this.score });
    logger.info("[Game] Game ended");
  }
}

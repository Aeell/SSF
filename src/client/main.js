import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Game } from "@/core/Game.js";
import { assetManifest } from "@/assets/assetManifest.js";
import { Client } from "colyseus.js";
import logger from "@/utils/logger.js";
class App {
  constructor() {
    this.assets = new Map();
    this.game = null;
    this.client = null;
    this.room = null;
    this.gameMode = null;
    this.setupUI();
  }
  setupUI() {
    // Create game mode selection
    const modeSelection = document.createElement("div");
    modeSelection.className = "mode-selection";
    modeSelection.innerHTML = `
      <h2>Select Game Mode</h2>
      <button id="single-player">Single Player</button>
      <button id="multiplayer">Multiplayer</button>
    `;
    document.body.appendChild(modeSelection);
    // Create game state indicator
    const gameState = document.createElement("div");
    gameState.className = "game-state";
    gameState.id = "game-state";
    document.body.appendChild(gameState);
    // Create auto-save indicator
    const autoSave = document.createElement("div");
    autoSave.className = "auto-save";
    autoSave.textContent = "Auto-saving...";
    document.body.appendChild(autoSave);
    // Add event listeners
    document
      .getElementById("single-player")
      .addEventListener("click", () => this.startGame("singleplayer"));
    document
      .getElementById("multiplayer")
      .addEventListener("click", () => this.startGame("multiplayer"));
    // Handle keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (this.game) {
        switch (e.key) {
          case "Escape":
            if (this.game.gameState.isPaused) {
              this.game.resumeGame();
            } else {
              this.game.pauseGame();
            }
            break;
          case "F5":
            e.preventDefault();
            this.game.saveGameState();
            break;
          case "F9":
            e.preventDefault();
            this.game.loadGameState();
            break;
        }
      }
    });
  }
  async loadAssets() {
    const loadingManager = new THREE.LoadingManager();
    const gltfLoader = new GLTFLoader(loadingManager);
    // Setup loading manager
    loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
      logger.info("[Loading] Started loading assets");
    };
    loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const progress = ((itemsLoaded / itemsTotal) * 100).toFixed(2);
      logger.info(`[Loading] Loading progress: ${progress}%`);
    };
    loadingManager.onLoad = () => {
      logger.info("[Loading] All assets loaded successfully");
    };
    loadingManager.onError = (url) => {
      logger.error("[Loading] Error loading asset:", url);
      this.handleError(new Error(`Failed to load asset: ${url}`), "loadAssets");
    };
    try {
      // Load models
      for (const [key, path] of Object.entries(assetManifest.models)) {
        const gltf = await gltfLoader.loadAsync(path);
        this.assets.set(key, gltf.scene);
        logger.info(`[Loading] Loaded model: ${key}`);
      }
      // Load textures
      for (const [key, path] of Object.entries(assetManifest.textures)) {
        const texture = await new THREE.TextureLoader(loadingManager).loadAsync(
          path,
        );
        this.assets.set(key, texture);
        logger.info(`[Loading] Loaded texture: ${key}`);
      }
    } catch (error) {
      this.handleError(error, "loadAssets");
      throw error;
    }
  }
  async startGame(mode) {
    try {
      this.gameMode = mode;
      document.querySelector(".mode-selection").style.display = "none";
      // Initialize game
      if (mode === "multiplayer") {
        this.client = new Client("ws://localhost:2567");
        this.room = await this.client.joinOrCreate("football_room");
        logger.info("[Game] Connected to server");
      }
      this.game = new Game({
        assets: this.assets,
        room: this.room,
        gameMode: mode,
      });
      // Setup event listeners
      this.setupEventListeners();
      // Start game
      this.game.startGame();
      logger.info(`[Game] Started in ${mode} mode`);
    } catch (error) {
      this.handleError(error, "startGame");
    }
  }
  setupEventListeners() {
    if (!this.game) return;
    // Game state events
    this.game.eventBus.on("gamePaused", () => {
      const gameState = document.getElementById("game-state");
      gameState.textContent = "PAUSED";
      gameState.className = "game-state paused";
    });
    this.game.eventBus.on("gameResumed", () => {
      const gameState = document.getElementById("game-state");
      gameState.textContent = "PLAYING";
      gameState.className = "game-state";
    });
    this.game.eventBus.on("gameOver", ({ score }) => {
      const gameState = document.getElementById("game-state");
      gameState.textContent = `GAME OVER - ${score.home} : ${score.away}`;
      gameState.className = "game-state game-over";
    });
    // Performance warnings
    this.game.eventBus.on("performanceWarning", ({ warnings }) => {
      const warning = document.createElement("div");
      warning.className = "performance-warning";
      warning.textContent = warnings.join(", ");
      document.body.appendChild(warning);
      setTimeout(() => warning.remove(), 5000);
    });
    // Error handling
    this.game.eventBus.on("error", ({ context, error }) => {
      this.handleError(error, context);
    });
    this.game.eventBus.on("criticalError", () => {
      this.handleCriticalError();
    });
    // Auto-save indicator
    this.game.eventBus.on("gameStateSaved", () => {
      const autoSave = document.querySelector(".auto-save");
      autoSave.classList.add("visible");
      setTimeout(() => autoSave.classList.remove("visible"), 2000);
    });
  }
  handleError(error, context) {
    logger.error(`[App] Error in ${context}:`, error);
    // Show error message
    const errorMessage = document.createElement("div");
    errorMessage.className = "error-message";
    errorMessage.textContent = `Error in ${context}: ${error.message}`;
    document.body.appendChild(errorMessage);
    setTimeout(() => errorMessage.remove(), 5000);
  }
  handleCriticalError() {
    logger.error("[App] Critical error detected");
    // Show critical error UI
    const criticalError = document.createElement("div");
    criticalError.className = "critical-error";
    criticalError.innerHTML = `
      <h3>Critical Error</h3>
      <p>A critical error has occurred. The game will attempt to recover.</p>
      <button onclick="window.location.reload()">Reload Game</button>
    `;
    document.body.appendChild(criticalError);
  }
  cleanup() {
    if (this.game) {
      this.game.cleanup();
    }
    if (this.room) {
      this.room.leave();
    }
    logger.info("[App] Cleanup complete");
  }
}
// Start the application
try {
  const app = new App();
  app.loadAssets().catch((error) => {
    logger.error("[App] Failed to load assets:", error);
  });
  // Handle page unload
  window.addEventListener("beforeunload", () => {
    app.cleanup();
  });
} catch (error) {
  logger.error("[App] Application failed to start:", error);
}

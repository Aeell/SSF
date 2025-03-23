import {
  THREE,
  createRenderer,
  createCamera,
  createScene,
  handleResize,
} from "./utils/three.js";
import { logger } from "./utils/logger.js";
import { exportAllLogs } from "./utils/exportLogs.js";
import Game from "./game/Game.js";
import { NetworkManager } from "./network/NetworkManager.js";
import "./styles/main.css";
import { PerformanceOverlay } from "./components/PerformanceOverlay.js";
class GameClient {
  constructor() {
    try {
      logger.info("Starting game client initialization");
      this.initializeGame();
    } catch (error) {
      logger.error("Failed to initialize game:", {
        error: error.message,
        stack: error.stack,
        component: error.component || "GameClient",
      });
      this.showErrorOverlay("Game Initialization Failed", error.message);
      throw error;
    }
  }
  initializeGame() {
    try {
      logger.info("Initializing game client components...");
      // Create renderer
      logger.debug("Creating renderer...");
      this.renderer = createRenderer();
      if (!this.renderer) {
        throw new Error("Failed to create renderer");
      }
      // Create camera
      logger.debug("Creating camera...");
      this.camera = createCamera();
      if (!this.camera) {
        throw new Error("Failed to create camera");
      }
      // Create scene
      logger.debug("Creating scene...");
      this.scene = createScene();
      if (!this.scene) {
        throw new Error("Failed to create scene");
      }
      // Add renderer to DOM
      logger.debug("Adding renderer to DOM...");
      document.body.appendChild(this.renderer.domElement);
      // Initialize network manager
      logger.debug("Initializing network manager...");
      this.networkManager = new NetworkManager();
      this.networkManager.connect();
      logger.info("Network manager connected");
      // Initialize game
      logger.debug("Creating game instance...");
      this.game = new Game(this.scene, this.camera, this.networkManager);
      // Initialize performance overlay
      logger.debug("Creating performance overlay...");
      this.performanceOverlay = new PerformanceOverlay(this.game);
      // Setup resize handler
      logger.debug("Setting up resize handler...");
      window.addEventListener("resize", () => {
        handleResize(this.camera, this.renderer);
      });
      // Start game loop
      logger.debug("Starting game loop...");
      this.startGameLoop();
      // Hide loading screen
      const loadingScreen = document.getElementById("loading-screen");
      if (loadingScreen) {
        loadingScreen.style.display = "none";
      }
      logger.info("Game client fully initialized", {
        components: {
          hasRenderer: !!this.renderer,
          hasCamera: !!this.camera,
          hasScene: !!this.scene,
          hasGame: !!this.game,
          hasNetworkManager: !!this.networkManager,
          hasPerformanceOverlay: !!this.performanceOverlay,
        },
      });
    } catch (error) {
      logger.error("Failed to initialize game components:", {
        error: error.message,
        stack: error.stack,
        details: {
          hasRenderer: !!this.renderer,
          hasCamera: !!this.camera,
          hasScene: !!this.scene,
          hasGame: !!this.game,
          hasNetworkManager: !!this.networkManager,
        },
      });
      throw error;
    }
  }
  startGameLoop() {
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();
    let deltaTime = 0;
    const animate = () => {
      try {
        const currentTime = performance.now();
        deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;
        // Update FPS counter
        frameCount++;
        if (currentTime - lastFpsUpdate >= 1000) {
          if (this.performanceOverlay) {
            this.performanceOverlay.update();
          }
          frameCount = 0;
          lastFpsUpdate = currentTime;
        }
        // Update game state
        if (this.game) {
          this.game.update(deltaTime);
        }
        // Render scene
        if (this.renderer && this.scene && this.camera) {
          this.renderer.render(this.scene, this.camera);
        }
        this.animationFrameId = requestAnimationFrame(animate);
      } catch (error) {
        logger.error("Game loop error:", {
          error: error.message,
          stack: error.stack,
          details: {
            deltaTimeValue: deltaTime,
            hasGame: !!this.game,
            hasRenderer: !!this.renderer,
            hasScene: !!this.scene,
            hasCamera: !!this.camera,
            gameState: this.game ? "active" : "null",
            frameCount,
          },
        });
        this.showErrorOverlay("Game Error", error.message);
        this.cleanup();
      }
    };
    this.animationFrameId = requestAnimationFrame(animate);
    logger.debug("Game loop started");
  }
  showErrorOverlay(title, message) {
    try {
      const overlay = document.createElement("div");
      overlay.className = "error-overlay";
      overlay.innerHTML = `
                <div class="error-message">
                    <h2>${title}</h2>
                    <p>${message}</p>
                    <button onclick="location.reload()">Retry</button>
                    <button onclick="window.gameClient.downloadLogs()">Download Logs</button>
                </div>
            `;
      document.body.appendChild(overlay);
      logger.debug("Error overlay displayed", { title, message });
    } catch (error) {
      logger.error("Failed to show error overlay:", {
        error: error.message,
        stack: error.stack,
        title,
        message,
      });
    }
  }
  downloadLogs() {
    try {
      exportAllLogs();
      logger.debug("Logs exported successfully");
    } catch (error) {
      logger.error("Failed to download logs:", {
        error: error.message,
        stack: error.stack,
      });
      alert("Failed to download logs. Please check the console for errors.");
    }
  }
  cleanup() {
    try {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      if (this.performanceOverlay) {
        this.performanceOverlay.destroy();
      }
      if (this.game) {
        this.game.cleanup();
      }
      if (this.networkManager) {
        this.networkManager.disconnect();
      }
      if (this.renderer && this.renderer.domElement) {
        document.body.removeChild(this.renderer.domElement);
      }
      logger.info("Game client cleanup complete", {
        details: {
          animationFrameCleared: !this.animationFrameId,
          overlayDestroyed: !this.performanceOverlay,
          gameCleanedUp: !this.game,
          networkDisconnected: !this.networkManager,
          rendererRemoved: !this.renderer,
        },
      });
    } catch (error) {
      logger.error("Failed to cleanup game client:", {
        error: error.message,
        stack: error.stack,
        details: {
          hasAnimationFrame: !!this.animationFrameId,
          hasOverlay: !!this.performanceOverlay,
          hasGame: !!this.game,
          hasNetwork: !!this.networkManager,
          hasRenderer: !!this.renderer,
        },
      });
    }
  }
}
// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", async () => {
  try {
    logger.info("Starting game initialization...");
    await game.init();
    logger.info("Game initialization complete");
  } catch (error) {
    logger.error("Failed to initialize game:", error);
    const loadingText = document.getElementById("loading-text");
    if (loadingText) {
      loadingText.textContent =
        "Failed to start game. Please refresh the page.";
      loadingText.style.color = "#ff4444";
    }
  }
});

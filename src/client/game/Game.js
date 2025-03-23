import * as THREE from "three";
import { logger } from "../utils/logger.js";
export class Game {
  constructor() {
    this.initialized = false;
    this.loadingManager = new THREE.LoadingManager();
    this.setupLoadingManager();
  }
  setupLoadingManager() {
    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const progress = (itemsLoaded / itemsTotal) * 100;
      const progressBar = document.getElementById("progress-bar-fill");
      const loadingText = document.getElementById("loading-text");
      if (progressBar) progressBar.style.width = `${progress}%`;
      if (loadingText)
        loadingText.textContent = `Loading: ${Math.round(progress)}%`;
      logger.info(
        `Loading progress: ${progress}% (${itemsLoaded}/${itemsTotal})`,
      );
    };
    this.loadingManager.onLoad = () => {
      logger.info("All assets loaded successfully");
      this.hideLoadingScreen();
    };
    this.loadingManager.onError = (url) => {
      logger.error("Error loading asset:", url);
      const loadingText = document.getElementById("loading-text");
      if (loadingText) {
        loadingText.textContent = "Error loading game assets";
        loadingText.style.color = "#ff4444";
      }
    };
  }
  async init() {
    try {
      logger.info("Initializing game...");
      // Create scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x000000);
      // Create camera
      this.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000,
      );
      this.camera.position.set(0, 10, 20);
      this.camera.lookAt(0, 0, 0);
      // Create renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      // Add to DOM
      const container = document.getElementById("game-container");
      if (container) {
        container.appendChild(this.renderer.domElement);
      } else {
        throw new Error("Game container not found");
      }
      // Add basic lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      this.scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 5, 5);
      this.scene.add(directionalLight);
      // Add a simple ground plane for testing
      const groundGeometry = new THREE.PlaneGeometry(20, 20);
      const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      this.scene.add(ground);
      // Handle window resize
      window.addEventListener("resize", this.onWindowResize.bind(this));
      this.initialized = true;
      logger.info("Game initialized successfully");
      // Start render loop
      this.animate();
    } catch (error) {
      logger.error("Error initializing game:", error);
      this.showError("Failed to initialize game");
      throw error;
    }
  }
  animate() {
    if (!this.initialized) return;
    requestAnimationFrame(this.animate.bind(this));
    try {
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      logger.error("Error in animation loop:", error);
      this.initialized = false;
    }
  }
  onWindowResize() {
    if (!this.initialized) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  hideLoadingScreen() {
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) {
      loadingScreen.style.opacity = "0";
      setTimeout(() => {
        loadingScreen.style.display = "none";
      }, 500);
    }
  }
  showError(message) {
    const loadingText = document.getElementById("loading-text");
    if (loadingText) {
      loadingText.textContent = message;
      loadingText.style.color = "#ff4444";
    }
    logger.error(message);
  }
}
// Create and export a single instance
const game = new Game();
export default game;

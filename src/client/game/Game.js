import * as THREE from "three";
import { logger } from "../utils/logger.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Physics } from './physics/Physics';
import { Player } from './entities/Player';
import { Ball } from './entities/Ball';
import { Field } from './entities/Field';
import { InputManager } from './input/InputManager';
import { AbilityUI } from './ui/AbilityUI';

export class Game {
  constructor(container) {
    this.container = container;
    this.initialized = false;
    this.loadingManager = new THREE.LoadingManager();
    this.setupLoadingManager();
    this.setupScene();
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

  setupScene() {
    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
    
    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 15, 20);
    this.camera.lookAt(0, 0, 0);
    
    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
    
    // Initialize controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 50;
    this.controls.maxPolarAngle = Math.PI / 2;
    
    // Initialize physics
    this.physics = new Physics();
    
    // Game state
    this.isRunning = false;
    this.lastTime = 0;
    this.entities = new Set();
    
    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  async init() {
    try {
      logger.info("Initializing game...");
      await this.loadAssets();
      await this.initialize();
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

  async loadAssets() {
    // Load field model
    const fieldLoader = new THREE.GLTFLoader();
    this.fieldModel = await fieldLoader.loadAsync('/models/field.glb');
    
    // Load player model
    const playerLoader = new THREE.GLTFLoader();
    this.playerModel = await playerLoader.loadAsync('/models/player.glb');
    
    // Load ball model
    const ballLoader = new THREE.GLTFLoader();
    this.ballModel = await ballLoader.loadAsync('/models/ball.glb');
  }

  initialize() {
    // Create field
    this.field = new Field(this.scene, this.fieldModel);
    this.entities.add(this.field);
    
    // Create ball
    this.ball = new Ball(this.scene, this.physics, this.ballModel);
    this.entities.add(this.ball);
    
    // Create players
    this.players = [];
    const playerPositions = [
        { x: -5, z: -10 }, // Home team
        { x: -5, z: 0 },
        { x: -5, z: 10 },
        { x: 5, z: -10 },  // Away team
        { x: 5, z: 0 },
        { x: 5, z: 10 }
    ];
    
    playerPositions.forEach((pos, index) => {
        const player = new Player(
            this.scene,
            this.physics,
            this.playerModel,
            {
                position: new THREE.Vector3(pos.x, 0, pos.z),
                team: index < 3 ? 'home' : 'away'
            }
        );
        this.players.push(player);
        this.entities.add(player);
    });
    
    // Add lights
    this.addLights();
    
    // Initialize input manager
    this.inputManager = new InputManager(this);
    
    // Initialize ability UI
    this.abilityUI = new AbilityUI(this.container);
    this.players[0].abilities.forEach(ability => {
        this.abilityUI.addAbility(ability);
    });
    
    // Start game loop
    this.start();
  }

  addLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    this.scene.add(directionalLight);
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animate();
  }

  stop() {
    this.isRunning = false;
  }

  animate() {
    if (!this.isRunning) return;
    
    requestAnimationFrame(this.animate.bind(this));
    
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    // Update physics
    this.physics.update(deltaTime);
    
    // Update controls
    this.controls.update();
    
    // Update input manager
    this.inputManager.update(deltaTime);
    
    // Update all entities
    this.entities.forEach(entity => {
        if (entity.update) {
            entity.update(deltaTime);
        }
    });
    
    // Update ability UI
    if (this.abilityUI && this.players[0]) {
        this.players[0].abilities.forEach(ability => {
            this.abilityUI.updateAbility(ability);
        });
    }
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
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

  cleanup() {
    this.stop();
    window.removeEventListener('resize', this.onWindowResize);
    
    // Cleanup input manager
    if (this.inputManager) {
        this.inputManager.cleanup();
    }
    
    // Cleanup ability UI
    if (this.abilityUI) {
        this.abilityUI.cleanup();
    }
    
    // Cleanup all entities
    this.entities.forEach(entity => {
        if (entity.cleanup) {
            entity.cleanup();
        }
    });
    
    // Cleanup Three.js
    this.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            object.material.dispose();
        }
    });
    this.renderer.dispose();
    
    // Remove renderer from DOM
    this.container.removeChild(this.renderer.domElement);
  }
}

// Create and export a single instance
const game = new Game();
export default game;

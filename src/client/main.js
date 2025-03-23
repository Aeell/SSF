import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Game } from '@/core/Game.js';
import { assetManifest } from '@/assets/assetManifest.js';
import { Client } from 'colyseus.js';
import logger from '@/utils/logger.js';
import '@/styles.css';

class App {
  constructor() {
    this.loadingManager = new THREE.LoadingManager();
    this.gltfLoader = new GLTFLoader(this.loadingManager);
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);
    this.assets = new Map();
    this.progress = 0;

    this.setupLoadingManager();
    this.loadAssets().then(() => this.initializeGame());
  }

  setupLoadingManager() {
    this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
      logger.info('[App] Loading started', { url, itemsLoaded, itemsTotal });
    };
    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      this.progress = itemsLoaded / itemsTotal;
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.textContent = `Loading... ${Math.round(this.progress * 100)}%`;
      }
      logger.debug('[App] Loading progress', { url, itemsLoaded, itemsTotal });
    };
    this.loadingManager.onLoad = () => {
      logger.info('[App] All assets loaded');
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) loadingScreen.style.display = 'none';
    };
    this.loadingManager.onError = (url) => {
      logger.error('[App] Error loading asset', { url });
    };
  }

  async loadAssets() {
    const promises = [];
    for (const [key, url] of Object.entries(assetManifest.models)) {
      promises.push(
        new Promise((resolve, reject) => {
          this.gltfLoader.load(url, (gltf) => {
            this.assets.set(key, gltf);
            resolve();
          }, undefined, (error) => reject(error));
        })
      );
    }
    for (const [key, url] of Object.entries(assetManifest.textures)) {
      promises.push(
        new Promise((resolve, reject) => {
          this.textureLoader.load(url, (texture) => {
            this.assets.set(key, texture);
            resolve();
          }, undefined, (error) => reject(error));
        })
      );
    }
    await Promise.all(promises);
  }

  async initializeGame() {
    try {
      const client = new Client('ws://localhost:3001');
      const room = await client.joinOrCreate('game_room');
      logger.info('[App] Connected to Colyseus room', { roomId: room.id });

      this.game = new Game({
        assets: this.assets,
        room,
      });
    } catch (e) {
      logger.error('[App] Failed to initialize game', { error: e.message, stack: e.stack });
      document.body.innerHTML += '<h1>Error: Game failed to load. Check console for details.</h1>';
    }
  }
}

try {
  logger.info('[App] Starting application...');
  new App();
} catch (e) {
  logger.error('[App] Application failed to start', { error: e.message, stack: e.stack });
} 
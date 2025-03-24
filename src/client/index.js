import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { createClient } from '@supabase/supabase-js';
import { Game } from './game/Game.js';
import { logger } from './utils/logger.js';
import { PerformanceMonitor } from './utils/performance.js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const labelRenderer = new CSS2DRenderer();

// Set up renderers
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('game-container').appendChild(renderer.domElement);

labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
document.getElementById('game-container').appendChild(labelRenderer.domElement);

// Set up camera
camera.position.set(0, 10, 10);
camera.lookAt(0, 0, 0);

// Initialize game
let game;
let performanceMonitor;

// Loading screen elements
const loadingScreen = document.getElementById('loading-screen');
const loadingBar = document.querySelector('.loading-bar');
const loadingText = document.querySelector('.loading-text');

// Asset loading
const assetLoader = new GLTFLoader();
const assets = {
    characters: {},
    field: null,
    ball: null
};

// Load assets
async function loadAssets() {
    try {
        // Load field
        loadingText.textContent = 'Loading game field...';
        assets.field = await assetLoader.loadAsync('/assets/models/field.glb');
        loadingBar.style.width = '33%';

        // Load ball
        loadingText.textContent = 'Loading ball...';
        assets.ball = await assetLoader.loadAsync('/assets/models/ball.glb');
        loadingBar.style.width = '66%';

        // Load characters
        loadingText.textContent = 'Loading characters...';
        const characterModels = ['player1', 'player2', 'player3', 'player4'];
        for (const model of characterModels) {
            assets.characters[model] = await assetLoader.loadAsync(`/assets/models/${model}.glb`);
        }
        loadingBar.style.width = '100%';

        // Initialize game after assets are loaded
        initializeGame();
    } catch (error) {
        logger.error('Failed to load assets:', error);
        loadingText.textContent = 'Error loading game assets. Please refresh the page.';
        loadingText.style.color = '#FF0000';
    }
}

// Initialize game
function initializeGame() {
    try {
        // Create game instance
        game = new Game(scene, camera, renderer, labelRenderer, assets);
        
        // Initialize performance monitoring
        performanceMonitor = new PerformanceMonitor();
        
        // Hide loading screen
        loadingScreen.style.display = 'none';
        
        // Start game loop
        animate();
        
        // Handle window resize
        window.addEventListener('resize', onWindowResize, false);
        
        // Handle mobile controls
        if (window.innerWidth <= 768) {
            initializeMobileControls();
        }
    } catch (error) {
        logger.error('Failed to initialize game:', error);
        loadingText.textContent = 'Error initializing game. Please refresh the page.';
        loadingText.style.color = '#FF0000';
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    if (game) {
        game.update();
    }
    
    if (performanceMonitor) {
        performanceMonitor.update();
    }
    
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

// Window resize handler
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
}

// Mobile controls
function initializeMobileControls() {
    const joystick = document.getElementById('joystick');
    const kickButton = document.getElementById('kick-button');
    const abilityButton = document.getElementById('ability-button');
    
    // Initialize virtual joystick
    // TODO: Implement virtual joystick
    
    // Add button event listeners
    kickButton.addEventListener('touchstart', () => {
        if (game) game.handleKick();
    });
    
    abilityButton.addEventListener('touchstart', () => {
        if (game) game.handleAbility();
    });
}

// Start loading assets
loadAssets();

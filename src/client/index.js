import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Game } from './game/Game';
import { NetworkManager } from './network/NetworkManager';
import logger from './utils/logger';
import './styles/main.css';

class GameClient {
    constructor() {
        logger.info('Initializing game client');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        
        this.game = null;
        this.networkManager = null;
        this.clock = new THREE.Clock();
        
        this.init();
    }

    init() {
        logger.info('Setting up game client components');
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        logger.debug('Renderer initialized');

        // Setup camera
        this.camera.position.set(0, 20, 20);
        this.camera.lookAt(0, 0, 0);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2;
        logger.debug('Camera and controls initialized');

        // Setup scene
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.addLights();
        this.addGround();
        logger.debug('Scene setup complete');

        // Initialize game and network
        this.game = new Game(this.scene, this.camera);
        this.networkManager = new NetworkManager(this.game);
        logger.info('Game and network managers initialized');

        // Start animation loop
        this.animate();

        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
        logger.info('Game client initialization complete');
    }

    addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        this.scene.add(directionalLight);
        logger.debug('Lights added to scene');
    }

    addGround() {
        const groundGeometry = new THREE.PlaneGeometry(50, 30);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2e8b57, // Forest green
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        logger.debug('Ground added to scene');
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const deltaTime = this.clock.getDelta();
        
        this.controls.update();
        this.game.update(deltaTime);
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        logger.debug('Window resized', { 
            width: window.innerWidth, 
            height: window.innerHeight 
        });
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    logger.info('Page loaded, starting game client');
    const gameClient = new GameClient();
    document.getElementById('loading-screen').style.display = 'none';
    logger.info('Loading screen hidden, game ready');
}); 
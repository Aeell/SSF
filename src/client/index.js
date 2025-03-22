import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Game } from './game/Game';
import { NetworkManager } from './network/NetworkManager';
import './styles/main.css';

class GameClient {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        
        this.game = null;
        this.networkManager = null;
        
        this.init();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        // Setup camera
        this.camera.position.set(0, 20, 20);
        this.camera.lookAt(0, 0, 0);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Setup scene
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.addLights();
        this.addGround();

        // Initialize game and network
        this.game = new Game(this.scene, this.camera);
        this.networkManager = new NetworkManager(this.game);

        // Start animation loop
        this.animate();

        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
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
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.game.update();
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    const gameClient = new GameClient();
    document.getElementById('loading-screen').style.display = 'none';
}); 
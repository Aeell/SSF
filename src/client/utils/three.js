// Centralized Three.js imports
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Export everything from three
export * from 'three';

// Export specific commonly used classes
export { THREE, OrbitControls };

// Export a function to create a renderer with standard settings
export function createRenderer(options = {}) {
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        ...options
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    return renderer;
}

// Export a function to create a standard camera
export function createCamera(fov = 75, aspect = window.innerWidth / window.innerHeight, near = 0.1, far = 1000) {
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);
    return camera;
}

// Export a function to create a basic scene
export function createScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    return scene;
}

// Export a function to handle window resizing
export function handleResize(camera, renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
} 
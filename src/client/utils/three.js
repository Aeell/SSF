// Centralized Three.js imports
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { logger } from './logger.js';

// Export everything from three
export * from 'three';

// Export specific commonly used classes
export { THREE, OrbitControls };

// Export a function to create a renderer with standard settings
export function createRenderer() {
    try {
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;
        
        logger.debug('Renderer created successfully', {
            shadowMap: renderer.shadowMap.enabled,
            antialias: renderer.capabilities.antialias,
            pixelRatio: renderer.getPixelRatio()
        });
        
        return renderer;
    } catch (error) {
        logger.error('Failed to create renderer:', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

// Export a function to create a standard camera
export function createCamera() {
    try {
        const camera = new THREE.PerspectiveCamera(
            75, // FOV
            window.innerWidth / window.innerHeight,
            0.1, // near plane
            1000 // far plane
        );
        
        // Position camera for good field view
        camera.position.set(0, 30, 30);
        camera.lookAt(0, 0, 0);
        
        logger.debug('Camera created successfully', {
            fov: camera.fov,
            aspect: camera.aspect,
            position: camera.position
        });
        
        return camera;
    } catch (error) {
        logger.error('Failed to create camera:', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

// Export a function to create a basic scene
export function createScene() {
    try {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87ceeb); // Sky blue background
        
        // Add ambient light for base illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        scene.add(ambientLight);
        
        // Add directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 50, 50);
        directionalLight.castShadow = true;
        
        // Configure shadow properties
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        directionalLight.shadow.bias = -0.001;
        
        scene.add(directionalLight);
        
        // Add hemisphere light for better ambient lighting
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        hemiLight.position.set(0, 50, 0);
        scene.add(hemiLight);
        
        logger.debug('Scene created successfully', {
            lights: {
                ambient: !!ambientLight,
                directional: !!directionalLight,
                hemisphere: !!hemiLight
            },
            shadowsEnabled: directionalLight.castShadow
        });
        
        return scene;
    } catch (error) {
        logger.error('Failed to create scene:', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

// Export a function to handle window resizing
export function handleResize(camera, renderer) {
    try {
        if (!camera || !renderer) {
            throw new Error('Camera and renderer required for resize');
        }
        
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        logger.debug('Window resize handled', {
            width: window.innerWidth,
            height: window.innerHeight,
            aspect: camera.aspect
        });
    } catch (error) {
        logger.error('Failed to handle resize:', {
            error: error.message,
            stack: error.stack,
            details: {
                hasCamera: !!camera,
                hasRenderer: !!renderer
            }
        });
        throw error;
    }
} 
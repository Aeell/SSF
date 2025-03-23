import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import logger from '@/utils/logger.js';

export class Field {
  constructor(scene, physicsWorld, groundMaterial, assets) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.groundMaterial = groundMaterial;
    this.assets = assets;
    this.createField();
  }

  createField() {
    // Create field mesh
    const texture = this.assets.get('field');
    const geometry = new THREE.BoxGeometry(50, 0.5, 30);
    const material = texture
      ? new THREE.MeshStandardMaterial({ map: texture })
      : new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    this.ground = new THREE.Mesh(geometry, material);
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    // Create field physics body
    const groundShape = new CANNON.Box(new CANNON.Vec3(25, 0.25, 15));
    this.groundBody = new CANNON.Body({
      mass: 0,
      shape: groundShape,
      material: this.groundMaterial,
    });
    this.physicsWorld.addBody(this.groundBody);

    // Create walls
    this.createWalls();

    logger.info('[Field] Created successfully');
  }

  createWalls() {
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const wallThickness = 0.5;
    const wallHeight = 2;

    // Create walls around the field
    const walls = [
      { pos: [25, wallHeight/2, 0], size: [wallThickness, wallHeight, 30] }, // Right
      { pos: [-25, wallHeight/2, 0], size: [wallThickness, wallHeight, 30] }, // Left
      { pos: [0, wallHeight/2, 15], size: [50, wallHeight, wallThickness] }, // Back
      { pos: [0, wallHeight/2, -15], size: [50, wallHeight, wallThickness] }, // Front
    ];

    walls.forEach(wall => {
      // Visual mesh
      const wallGeometry = new THREE.BoxGeometry(...wall.size);
      const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
      wallMesh.position.set(...wall.pos);
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      this.scene.add(wallMesh);

      // Physics body
      const wallShape = new CANNON.Box(new CANNON.Vec3(wall.size[0]/2, wall.size[1]/2, wall.size[2]/2));
      const wallBody = new CANNON.Body({
        mass: 0,
        shape: wallShape,
        material: this.groundMaterial,
      });
      wallBody.position.set(...wall.pos);
      this.physicsWorld.addBody(wallBody);
    });

    logger.debug('[Field] Walls created');
  }

  update() {
    // Update field state if needed
  }

  cleanup() {
    // Remove meshes
    this.scene.remove(this.ground);
    
    // Remove physics bodies
    this.physicsWorld.removeBody(this.groundBody);
    
    logger.info('[Field] Cleanup complete');
  }
} 
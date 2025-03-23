import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import logger from '@/utils/logger.js';

export class Ball {
  constructor(scene, physicsWorld, ballMaterial, assets) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.ballMaterial = ballMaterial;
    this.assets = assets;
    this.createBall();
  }

  createBall() {
    // Create ball mesh
    const radius = 0.5;
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      roughness: 0.4,
      metalness: 0.3
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);

    // Create ball physics body
    const shape = new CANNON.Sphere(radius);
    this.body = new CANNON.Body({
      mass: 1,
      shape: shape,
      material: this.ballMaterial,
      linearDamping: 0.3,
      angularDamping: 0.3,
      fixedRotation: false
    });

    // Set initial position
    this.body.position.set(0, 2, 0);
    this.physicsWorld.addBody(this.body);

    logger.info('[Ball] Created successfully');
  }

  update() {
    // Update ball mesh position and rotation based on physics body
    this.mesh.position.copy(this.body.position);
    this.mesh.quaternion.copy(this.body.quaternion);
  }

  reset() {
    // Reset ball position and velocity
    this.body.position.set(0, 2, 0);
    this.body.velocity.setZero();
    this.body.angularVelocity.setZero();
    this.update();
    logger.debug('[Ball] Reset position');
  }

  applyImpulse(force) {
    // Apply impulse force to the ball
    this.body.applyImpulse(new CANNON.Vec3(...force));
    logger.debug(`[Ball] Applied impulse: ${force}`);
  }

  getPosition() {
    return this.body.position;
  }

  cleanup() {
    // Remove meshes
    this.scene.remove(this.mesh);
    
    // Remove physics bodies
    this.physicsWorld.removeBody(this.body);
    
    logger.info('[Ball] Cleanup complete');
  }
} 
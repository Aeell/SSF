import * as THREE from "three";
import * as CANNON from "cannon-es";
import logger from "@/utils/logger.js";
export class Player {
  constructor(
    scene,
    physicsWorld,
    playerMaterial,
    assets,
    id,
    isLocal = false,
  ) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.playerMaterial = playerMaterial;
    this.assets = assets;
    this.id = id;
    this.isLocal = isLocal;
    this.speed = 5;
    this.jumpForce = 5;
    this.canJump = true;
    this.createPlayer();
    if (isLocal) {
      this.setupControls();
    }
  }
  createPlayer() {
    // Create player mesh
    const geometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
    const material = new THREE.MeshStandardMaterial({
      color: this.isLocal ? 0x00ff00 : 0xff0000,
      roughness: 0.7,
      metalness: 0.3,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);
    // Create player physics body
    const shape = new CANNON.Cylinder(0.5, 0.5, 2, 8);
    this.body = new CANNON.Body({
      mass: 5,
      shape: shape,
      material: this.playerMaterial,
      fixedRotation: true,
      linearDamping: 0.9,
    });
    // Set initial position
    const spawnX = this.isLocal ? -10 : 10;
    this.body.position.set(spawnX, 2, 0);
    this.physicsWorld.addBody(this.body);
    // Contact event for jump detection
    this.body.addEventListener("collide", (event) => {
      const contact = event.contact;
      const normalY = contact.ni.y;
      if (Math.abs(normalY) > 0.5) {
        this.canJump = true;
      }
    });
    logger.info(`[Player ${this.id}] Created successfully`);
  }
  setupControls() {
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
    };
    window.addEventListener("keydown", (event) => this.handleKeyDown(event));
    window.addEventListener("keyup", (event) => this.handleKeyUp(event));
    logger.debug("[Player] Controls setup complete");
  }
  handleKeyDown(event) {
    switch (event.code) {
      case "KeyW":
        this.keys.forward = true;
        break;
      case "KeyS":
        this.keys.backward = true;
        break;
      case "KeyA":
        this.keys.left = true;
        break;
      case "KeyD":
        this.keys.right = true;
        break;
      case "Space":
        this.keys.jump = true;
        break;
    }
  }
  handleKeyUp(event) {
    switch (event.code) {
      case "KeyW":
        this.keys.forward = false;
        break;
      case "KeyS":
        this.keys.backward = false;
        break;
      case "KeyA":
        this.keys.left = false;
        break;
      case "KeyD":
        this.keys.right = false;
        break;
      case "Space":
        this.keys.jump = false;
        break;
    }
  }
  update() {
    if (this.isLocal) {
      this.handleMovement();
    }
    // Update player mesh position and rotation based on physics body
    this.mesh.position.copy(this.body.position);
    this.mesh.quaternion.copy(this.body.quaternion);
  }
  handleMovement() {
    const velocity = new CANNON.Vec3(0, this.body.velocity.y, 0);
    if (this.keys.forward) velocity.z = -this.speed;
    if (this.keys.backward) velocity.z = this.speed;
    if (this.keys.left) velocity.x = -this.speed;
    if (this.keys.right) velocity.x = this.speed;
    if (this.keys.jump && this.canJump) {
      velocity.y = this.jumpForce;
      this.canJump = false;
    }
    this.body.velocity.copy(velocity);
  }
  setPosition(position) {
    this.body.position.copy(position);
    this.update();
  }
  getPosition() {
    return this.body.position;
  }
  cleanup() {
    if (this.isLocal) {
      window.removeEventListener("keydown", this.handleKeyDown);
      window.removeEventListener("keyup", this.handleKeyUp);
    }
    // Remove meshes
    this.scene.remove(this.mesh);
    // Remove physics bodies
    this.physicsWorld.removeBody(this.body);
    logger.info(`[Player ${this.id}] Cleanup complete`);
  }
}

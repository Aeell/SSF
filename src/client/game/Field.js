import { THREE } from "../utils/three.js";
import * as CANNON from "cannon-es";
import { logger } from "../utils/logger.js";
export default class Field {
  constructor(scene) {
    try {
      if (!scene) {
        throw new Error("Field requires scene parameter");
      }
      this.scene = scene;
      // Field dimensions
      this.width = 50;
      this.length = 30;
      this.height = 0.5;
      // Field elements
      this.ground = null;
      this.boundaries = [];
      this.goals = [];
      // Initialize physics world
      this.initPhysicsWorld();
      // Create field components
      this.createGround();
      this.createBoundaries();
      this.createGoals();
      this.createMarkings();
      logger.debug("Field created successfully", {
        dimensions: {
          width: this.width,
          length: this.length,
          height: this.height,
        },
        hasPhysicsWorld: !!this.world,
        components: {
          ground: !!this.ground,
          boundaries: this.boundaries.length,
          goals: this.goals.length,
        },
      });
    } catch (error) {
      logger.error("Failed to create field:", {
        error: error.message,
        stack: error.stack,
        details: {
          hasScene: !!scene,
          hasPhysicsWorld: !!this.world,
        },
      });
      error.component = "Field";
      throw error;
    }
  }
  initPhysicsWorld() {
    try {
      // Create physics world
      this.world = new CANNON.World({
        gravity: new CANNON.Vec3(0, -9.82, 0),
      });
      // Configure physics world
      this.world.defaultContactMaterial.friction = 0.5;
      this.world.defaultContactMaterial.restitution = 0.3;
      // Create materials
      this.groundMaterial = new CANNON.Material("ground");
      const ballMaterial = new CANNON.Material("ball");
      // Create contact material
      const groundBallContactMaterial = new CANNON.ContactMaterial(
        this.groundMaterial,
        ballMaterial,
        {
          friction: 0.5,
          restitution: 0.3,
        },
      );
      // Add contact material to world
      this.world.addContactMaterial(groundBallContactMaterial);
      logger.debug("Physics world initialized", {
        gravity: this.world.gravity,
        materials: {
          ground: !!this.groundMaterial,
          ball: !!ballMaterial,
        },
      });
    } catch (error) {
      logger.error("Failed to initialize physics world:", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
  // Getter for physics world
  getWorld() {
    if (!this.world) {
      throw new Error("Physics world not initialized");
    }
    return this.world;
  }
  createGround() {
    try {
      // Create visual ground
      const geometry = new THREE.BoxGeometry(
        this.width,
        this.height,
        this.length,
      );
      const material = new THREE.MeshStandardMaterial({
        color: 0x2e8b57,
        roughness: 0.8,
        metalness: 0.2,
      });
      this.ground = new THREE.Mesh(geometry, material);
      this.ground.receiveShadow = true;
      this.scene.add(this.ground);
      // Create physics ground
      const groundShape = new CANNON.Box(
        new CANNON.Vec3(this.width / 2, this.height / 2, this.length / 2),
      );
      const groundBody = new CANNON.Body({
        mass: 0,
        shape: groundShape,
        material: this.groundMaterial,
      });
      this.world.addBody(groundBody);
      logger.debug("Ground created", {
        visual: {
          width: this.width,
          height: this.height,
          length: this.length,
        },
        physics: {
          mass: groundBody.mass,
          material: !!groundBody.material,
        },
      });
    } catch (error) {
      logger.error("Failed to create ground:", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
  createBoundaries() {
    try {
      const wallHeight = 2;
      const wallThickness = 0.5;
      const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
        transparent: true,
        opacity: 0.3,
      });
      // Create walls
      const walls = [
        // Left wall
        {
          size: [wallThickness, wallHeight, this.length],
          position: [-this.width / 2 - wallThickness / 2, wallHeight / 2, 0],
        },
        // Right wall
        {
          size: [wallThickness, wallHeight, this.length],
          position: [this.width / 2 + wallThickness / 2, wallHeight / 2, 0],
        },
        // Back wall
        {
          size: [this.width + wallThickness * 2, wallHeight, wallThickness],
          position: [0, wallHeight / 2, -this.length / 2 - wallThickness / 2],
        },
        // Front wall
        {
          size: [this.width + wallThickness * 2, wallHeight, wallThickness],
          position: [0, wallHeight / 2, this.length / 2 + wallThickness / 2],
        },
      ];
      walls.forEach((wall) => {
        // Visual wall
        const geometry = new THREE.BoxGeometry(...wall.size);
        const mesh = new THREE.Mesh(geometry, wallMaterial);
        mesh.position.set(...wall.position);
        this.scene.add(mesh);
        this.boundaries.push(mesh);
        // Physics wall
        const shape = new CANNON.Box(
          new CANNON.Vec3(wall.size[0] / 2, wall.size[1] / 2, wall.size[2] / 2),
        );
        const body = new CANNON.Body({
          mass: 0,
          shape: shape,
          position: new CANNON.Vec3(...wall.position),
        });
        this.world.addBody(body);
      });
    } catch (error) {
      logger.error("Failed to create boundaries:", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
  createGoals() {
    try {
      const goalWidth = 7;
      const goalHeight = 4;
      const goalDepth = 2;
      const goalThickness = 0.2;
      const goalMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const createGoalMesh = (position) => {
        const group = new THREE.Group();
        // Create goal frame
        const posts = [
          // Left post
          {
            size: [goalThickness, goalHeight, goalThickness],
            position: [-goalWidth / 2, goalHeight / 2, 0],
          },
          // Right post
          {
            size: [goalThickness, goalHeight, goalThickness],
            position: [goalWidth / 2, goalHeight / 2, 0],
          },
          // Crossbar
          {
            size: [goalWidth, goalThickness, goalThickness],
            position: [0, goalHeight, 0],
          },
        ];
        posts.forEach((post) => {
          const geometry = new THREE.BoxGeometry(...post.size);
          const mesh = new THREE.Mesh(geometry, goalMaterial);
          mesh.position.set(...post.position);
          mesh.castShadow = true;
          group.add(mesh);
          // Add physics body for post
          const shape = new CANNON.Box(
            new CANNON.Vec3(
              post.size[0] / 2,
              post.size[1] / 2,
              post.size[2] / 2,
            ),
          );
          const body = new CANNON.Body({
            mass: 0,
            shape: shape,
            position: new CANNON.Vec3(
              position[0] + post.position[0],
              post.position[1],
              position[2] + post.position[2],
            ),
          });
          this.world.addBody(body);
        });
        group.position.set(...position);
        return group;
      };
      // Create home and away goals
      const homeGoal = createGoalMesh([0, 0, -this.length / 2]);
      const awayGoal = createGoalMesh([0, 0, this.length / 2]);
      this.scene.add(homeGoal);
      this.scene.add(awayGoal);
      this.goals.push(homeGoal, awayGoal);
    } catch (error) {
      logger.error("Failed to create goals:", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
  createMarkings() {
    try {
      const lineWidth = 0.1;
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
      // Create center line
      const centerLineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-this.width / 2, 0.01, 0),
        new THREE.Vector3(this.width / 2, 0.01, 0),
      ]);
      const centerLine = new THREE.Line(centerLineGeometry, lineMaterial);
      this.scene.add(centerLine);
      // Create center circle
      const centerCircleGeometry = new THREE.CircleGeometry(3, 32);
      const centerCircle = new THREE.Line(
        new THREE.EdgesGeometry(centerCircleGeometry),
        lineMaterial,
      );
      centerCircle.rotation.x = -Math.PI / 2;
      centerCircle.position.y = 0.01;
      this.scene.add(centerCircle);
    } catch (error) {
      logger.error("Failed to create field markings:", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
  cleanup() {
    try {
      // Remove all bodies from physics world
      if (this.world) {
        const bodies = this.world.bodies;
        while (bodies.length) {
          this.world.removeBody(bodies[0]);
        }
      }
      // Remove ground
      if (this.ground) {
        this.scene.remove(this.ground);
        this.ground.geometry.dispose();
        this.ground.material.dispose();
      }
      // Remove boundaries
      this.boundaries.forEach((boundary) => {
        this.scene.remove(boundary);
        boundary.geometry.dispose();
        boundary.material.dispose();
      });
      // Remove goals
      this.goals.forEach((goal) => {
        this.scene.remove(goal);
        goal.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            child.material.dispose();
          }
        });
      });
      // Clear arrays
      this.boundaries = [];
      this.goals = [];
      logger.debug("Field cleanup complete", {
        remainingBodies: this.world ? this.world.bodies.length : 0,
      });
    } catch (error) {
      logger.error("Failed to cleanup field:", {
        error: error.message,
        stack: error.stack,
        details: {
          hasWorld: !!this.world,
          hasGround: !!this.ground,
          boundariesCount: this.boundaries.length,
          goalsCount: this.goals.length,
        },
      });
    }
  }
  update(deltaTime) {
    this.world.step(1 / 60);
  }
  getWidth() {
    return this.width;
  }
  getLength() {
    return this.length;
  }
  isInBounds(position) {
    return (
      position.x >= -this.width / 2 &&
      position.x <= this.width / 2 &&
      position.z >= -this.length / 2 &&
      position.z <= this.length / 2
    );
  }
  isGoal(position) {
    const goalWidth = 8;
    const goalHeight = 3;
    const goalDepth = 1;
    return (
      Math.abs(position.x) <= goalWidth / 2 &&
      position.y <= goalHeight &&
      Math.abs(position.z) >= this.length / 2 &&
      Math.abs(position.z) <= this.length / 2 + goalDepth
    );
  }
}

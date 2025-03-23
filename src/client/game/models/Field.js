import { THREE } from "../../utils/three.js";
import * as CANNON from "cannon-es";
export default class Field {
  constructor(scene, world) {
    if (!scene) {
      throw new Error("Field requires a valid THREE.Scene");
    }
    if (!world) {
      throw new Error("Field requires a valid CANNON.World");
    }
    this.scene = scene;
    this.world = world;
    // Create field geometry
    const fieldGeometry = new THREE.PlaneGeometry(100, 60);
    const fieldMaterial = new THREE.MeshPhongMaterial({
      color: 0x2e8b57, // Forest green
      side: THREE.DoubleSide,
    });
    this.field = new THREE.Mesh(fieldGeometry, fieldMaterial);
    this.field.rotation.x = -Math.PI / 2;
    this.field.receiveShadow = true;
    this.scene.add(this.field);
    // Create physics ground plane
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
      mass: 0, // static body
      shape: groundShape,
      material: new CANNON.Material({
        friction: 0.5,
        restitution: 0.3,
      }),
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(groundBody);
    // Add field lines
    const linesMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    // Center line
    const centerLineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.1, -30),
      new THREE.Vector3(0, 0.1, 30),
    ]);
    const centerLine = new THREE.Line(centerLineGeometry, linesMaterial);
    this.scene.add(centerLine);
    // Center circle
    const centerCircleGeometry = new THREE.CircleGeometry(9, 32);
    const centerCircle = new THREE.LineLoop(
      centerCircleGeometry,
      linesMaterial,
    );
    centerCircle.rotation.x = -Math.PI / 2;
    centerCircle.position.y = 0.1;
    this.scene.add(centerCircle);
    // Add boundaries with physics
    this.createBoundary(51, 0, 0, 2, 10, 62); // Right wall
    this.createBoundary(-51, 0, 0, 2, 10, 62); // Left wall
    this.createBoundary(0, 0, 31, 102, 10, 2); // Back wall
    this.createBoundary(0, 0, -31, 102, 10, 2); // Front wall
    // Add goals
    this.createGoal(-50, 0, 0); // Left goal
    this.createGoal(50, 0, Math.PI); // Right goal
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 100, 0);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
  }
  createBoundary(x, y, z, width, height, depth) {
    // Visual boundary
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshPhongMaterial({
      color: 0x808080,
      transparent: true,
      opacity: 0.3,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y + height / 2, z);
    this.scene.add(mesh);
    // Physics boundary
    const shape = new CANNON.Box(
      new CANNON.Vec3(width / 2, height / 2, depth / 2),
    );
    const body = new CANNON.Body({
      mass: 0,
      shape: shape,
      material: new CANNON.Material({
        friction: 0.5,
        restitution: 0.3,
      }),
    });
    body.position.set(x, y + height / 2, z);
    this.world.addBody(body);
  }
  createGoal(x, z, rotation) {
    const goalMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    // Goal posts
    const postGeometry = new THREE.CylinderGeometry(0.2, 0.2, 4);
    const leftPost = new THREE.Mesh(postGeometry, goalMaterial);
    const rightPost = new THREE.Mesh(postGeometry, goalMaterial);
    leftPost.position.set(x, 2, z - 3.7);
    rightPost.position.set(x, 2, z + 3.7);
    // Crossbar
    const crossbarGeometry = new THREE.CylinderGeometry(0.2, 0.2, 7.4);
    crossbarGeometry.rotateZ(Math.PI / 2);
    const crossbar = new THREE.Mesh(crossbarGeometry, goalMaterial);
    crossbar.position.set(x, 4, z);
    const goal = new THREE.Group();
    goal.add(leftPost);
    goal.add(rightPost);
    goal.add(crossbar);
    goal.rotation.y = rotation;
    this.scene.add(goal);
    // Add physics for goal posts
    const postShape = new CANNON.Cylinder(0.2, 0.2, 4);
    const leftPostBody = new CANNON.Body({ mass: 0, shape: postShape });
    const rightPostBody = new CANNON.Body({ mass: 0, shape: postShape });
    leftPostBody.position.copy(leftPost.position);
    rightPostBody.position.copy(rightPost.position);
    this.world.addBody(leftPostBody);
    this.world.addBody(rightPostBody);
    // Add physics for crossbar
    const crossbarShape = new CANNON.Cylinder(0.2, 0.2, 7.4);
    const crossbarBody = new CANNON.Body({ mass: 0, shape: crossbarShape });
    crossbarBody.position.copy(crossbar.position);
    crossbarBody.quaternion.setFromEuler(0, 0, Math.PI / 2);
    this.world.addBody(crossbarBody);
  }
  update(deltaTime) {
    // Step physics world
    if (this.world) {
      this.world.step(1 / 60, deltaTime, 3);
    }
  }
  cleanup() {
    // Remove all bodies from the physics world
    while (this.world.bodies.length > 0) {
      this.world.removeBody(this.world.bodies[0]);
    }
  }
}

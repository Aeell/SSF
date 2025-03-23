import { THREE } from "../../utils/three.js";
import * as CANNON from "cannon-es";
export default class Ball {
  constructor(scene, world) {
    if (!world || !(world instanceof CANNON.World)) {
      throw new Error("Ball requires valid CANNON.World");
    }
    this.scene = scene;
    this.world = world;
    // Create ball geometry
    const radius = 0.5;
    const segments = 32;
    const ballGeometry = new THREE.SphereGeometry(radius, segments, segments);
    const ballMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 50,
    });
    this.ball = new THREE.Mesh(ballGeometry, ballMaterial);
    this.ball.castShadow = true;
    this.ball.position.set(0, radius, 0);
    // Add black patches to make it look like a football
    const patchGeometry = new THREE.CircleGeometry(radius * 0.2, 5);
    const patchMaterial = new THREE.MeshPhongMaterial({
      color: 0x000000,
      side: THREE.DoubleSide,
    });
    // Create 12 patches around the ball
    for (let i = 0; i < 12; i++) {
      const patch = new THREE.Mesh(patchGeometry, patchMaterial);
      patch.position.setFromSphericalCoords(
        radius * 1.01,
        Math.PI * Math.random(),
        2 * Math.PI * Math.random(),
      );
      patch.lookAt(0, 0, 0);
      this.ball.add(patch);
    }
    scene.add(this.ball);
    // Create physics body
    const shape = new CANNON.Sphere(radius);
    this.body = new CANNON.Body({
      mass: 1,
      shape: shape,
      material: new CANNON.Material({
        friction: 0.3,
        restitution: 0.6,
      }),
    });
    // Set initial position
    this.body.position.set(0, radius, 0);
    this.world.addBody(this.body);
    // Add contact material for ball-ground interaction
    const ballGroundContact = new CANNON.ContactMaterial(
      this.body.material,
      world.defaultMaterial,
      {
        friction: 0.3,
        restitution: 0.6,
        contactEquationStiffness: 1e7,
        contactEquationRelaxation: 3,
      },
    );
    world.addContactMaterial(ballGroundContact);
  }
  update() {
    // Update visual position to match physics
    this.ball.position.copy(this.body.position);
    this.ball.quaternion.copy(this.body.quaternion);
  }
  setPosition(x, y, z) {
    this.body.position.set(x, y, z);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
  }
  getPosition() {
    return this.body.position;
  }
  setVelocity(x, y, z) {
    this.body.velocity.set(x, y, z);
  }
  getVelocity() {
    return this.body.velocity;
  }
  applyForce(force, worldPoint) {
    this.body.applyForce(force, worldPoint || this.body.position);
  }
  applyImpulse(impulse, worldPoint) {
    this.body.applyImpulse(impulse, worldPoint || this.body.position);
  }
  reset() {
    this.setPosition(0, 0.5, 0);
    this.setVelocity(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
  }
  cleanup() {
    if (this.world && this.body) {
      this.world.removeBody(this.body);
    }
    if (this.scene && this.ball) {
      this.scene.remove(this.ball);
    }
  }
}

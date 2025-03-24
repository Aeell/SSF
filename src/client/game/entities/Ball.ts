import { Scene, Mesh, SphereGeometry, MeshStandardMaterial } from 'three';
import { Physics } from '../physics/Physics';
import * as CANNON from 'cannon-es';

interface BallSettings {
  radius?: number;
  maxSpeed?: number;
  drag?: number;
}

export class Ball {
  public mesh: Mesh;
  public physicsBody: CANNON.Body;
  public radius: number;
  public maxSpeed: number;
  public drag: number;

  constructor(scene: Scene, physics: Physics, settings: BallSettings = {}) {
    this.radius = settings.radius || 0.5;
    this.maxSpeed = settings.maxSpeed || 15;
    this.drag = settings.drag || 0.3;

    this.mesh = this.createMesh(scene);
    this.physicsBody = physics.createBallBody({ x: 0, y: 1, z: 0 }, this.radius);
  }

  private createMesh(scene: Scene): Mesh {
    // Create a simple sphere mesh for now
    const geometry = new SphereGeometry(this.radius, 32, 32);
    const material = new MeshStandardMaterial({ color: 0xffffff });
    const mesh = new Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  public update(deltaTime: number): void {
    // Update visual position based on physics body
    this.mesh.position.copy(this.physicsBody.position as any);
    this.mesh.quaternion.copy(this.physicsBody.quaternion as any);

    // Apply drag
    const velocity = this.physicsBody.velocity;
    velocity.x *= (1 - this.drag * deltaTime);
    velocity.y *= (1 - this.drag * deltaTime);
    velocity.z *= (1 - this.drag * deltaTime);

    // Limit maximum speed
    const speed = Math.sqrt(
      velocity.x ** 2 +
      velocity.y ** 2 +
      velocity.z ** 2
    );

    if (speed > this.maxSpeed) {
      const factor = this.maxSpeed / speed;
      velocity.x *= factor;
      velocity.y *= factor;
      velocity.z *= factor;
    }
  }

  public reset(): void {
    this.physicsBody.position.set(0, 1, 0);
    this.physicsBody.velocity.set(0, 0, 0);
    this.physicsBody.angularVelocity.set(0, 0, 0);
  }

  public getPosition(): { x: number; y: number; z: number } {
    return {
      x: this.physicsBody.position.x,
      y: this.physicsBody.position.y,
      z: this.physicsBody.position.z
    };
  }

  public cleanup(): void {
    // Remove mesh from scene
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
  }
} 
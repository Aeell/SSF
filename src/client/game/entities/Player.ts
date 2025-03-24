import { Scene, Mesh, BoxGeometry, MeshStandardMaterial } from 'three';
import { Physics } from '../physics/Physics';
import { Ball } from './Ball';
import { Ability } from '../abilities/Ability';
import { createAbility } from '../abilities';
import * as CANNON from 'cannon-es';

interface PlayerSettings {
  moveSpeed?: number;
  rotationSpeed?: number;
  abilities?: string[];
}

export class Player {
  public mesh: Mesh;
  public physicsBody: CANNON.Body;
  public moveSpeed: number;
  public rotationSpeed: number;
  public abilities: Map<string, Ability>;
  private isMovingForward: boolean;
  private isMovingBackward: boolean;
  private isMovingLeft: boolean;
  private isMovingRight: boolean;

  constructor(scene: Scene, physics: Physics, settings: PlayerSettings = {}) {
    this.moveSpeed = settings.moveSpeed || 5;
    this.rotationSpeed = settings.rotationSpeed || 3;
    this.abilities = new Map();
    this.isMovingForward = false;
    this.isMovingBackward = false;
    this.isMovingLeft = false;
    this.isMovingRight = false;

    this.mesh = this.createMesh(scene);
    this.physicsBody = physics.createPlayerBody({ x: 0, y: 1, z: 0 }, 1);
    this.initializeAbilities(settings.abilities || ['Speed Boost', 'Power Kick', 'Shield']);
  }

  private createMesh(scene: Scene): Mesh {
    // Create a simple box mesh for now
    const geometry = new BoxGeometry(1, 2, 1);
    const material = new MeshStandardMaterial({ color: 0x00ff00 });
    const mesh = new Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  private initializeAbilities(abilityNames: string[]): void {
    abilityNames.forEach(name => {
      const ability = createAbility(name, this);
      if (ability) {
        this.abilities.set(name, ability);
      }
    });
  }

  public moveForward(): void {
    this.isMovingForward = true;
  }

  public moveBackward(): void {
    this.isMovingBackward = true;
  }

  public moveLeft(): void {
    this.isMovingLeft = true;
  }

  public moveRight(): void {
    this.isMovingRight = true;
  }

  public stopForward(): void {
    this.isMovingForward = false;
  }

  public stopBackward(): void {
    this.isMovingBackward = false;
  }

  public stopLeft(): void {
    this.isMovingLeft = false;
  }

  public stopRight(): void {
    this.isMovingRight = false;
  }

  public kick(ball: Ball): void {
    const direction = {
      x: -Math.sin(this.mesh.rotation.y),
      y: 0,
      z: -Math.cos(this.mesh.rotation.y)
    };
    const force = 10;
    ball.physicsBody.applyImpulse(
      new CANNON.Vec3(
        direction.x * force,
        direction.y * force,
        direction.z * force
      )
    );
  }

  public useAbility(name: string): void {
    const ability = this.abilities.get(name);
    if (ability && !ability.cooldown) {
      ability.activate();
    }
  }

  public update(deltaTime: number): void {
    // Update visual position based on physics body
    this.mesh.position.copy(this.physicsBody.position as any);
    this.mesh.quaternion.copy(this.physicsBody.quaternion as any);

    // Handle movement
    const velocity = this.physicsBody.velocity;
    const direction = { x: 0, z: 0 };

    if (this.isMovingForward) direction.z -= 1;
    if (this.isMovingBackward) direction.z += 1;
    if (this.isMovingLeft) direction.x -= 1;
    if (this.isMovingRight) direction.x += 1;

    // Normalize direction
    const length = Math.sqrt(direction.x ** 2 + direction.z ** 2);
    if (length > 0) {
      direction.x /= length;
      direction.z /= length;
    }

    // Apply movement
    velocity.x = direction.x * this.moveSpeed;
    velocity.z = direction.z * this.moveSpeed;

    // Update rotation towards movement direction
    if (length > 0) {
      const targetRotation = Math.atan2(direction.x, direction.z);
      const currentRotation = this.mesh.rotation.y;
      const rotationDiff = targetRotation - currentRotation;
      
      // Normalize rotation difference
      let normalizedDiff = rotationDiff;
      while (normalizedDiff > Math.PI) normalizedDiff -= 2 * Math.PI;
      while (normalizedDiff < -Math.PI) normalizedDiff += 2 * Math.PI;

      // Apply rotation
      this.mesh.rotation.y += normalizedDiff * this.rotationSpeed * deltaTime;
    }

    // Update abilities
    this.abilities.forEach(ability => ability.update(deltaTime));
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
    // Clean up abilities
    this.abilities.forEach(ability => {
      if ('cleanup' in ability) {
        (ability as any).cleanup();
      }
    });
  }
} 
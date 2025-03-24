import { Physics } from '../Physics';
import * as CANNON from 'cannon-es';

describe('Physics', () => {
  let physics: Physics;

  beforeEach(() => {
    physics = new Physics();
  });

  afterEach(() => {
    physics.cleanup();
  });

  describe('initialization', () => {
    it('should initialize with default settings', () => {
      expect(physics).toBeDefined();
      expect(physics.world).toBeDefined();
      expect(physics.world.gravity.y).toBe(-9.82);
    });
  });

  describe('body creation', () => {
    it('should create player body with correct properties', () => {
      const position = { x: 0, y: 1, z: 0 };
      const radius = 1;
      const body = physics.createPlayerBody(position, radius);

      expect(body).toBeDefined();
      expect(body.position.x).toBe(position.x);
      expect(body.position.y).toBe(position.y);
      expect(body.position.z).toBe(position.z);
      expect(body.mass).toBe(1);
      expect(body.linearDamping).toBe(0.5);
      expect(body.angularDamping).toBe(0.5);
      expect(body.material).toBeDefined();
      const material = body.material as CANNON.Material;
      expect(material.friction).toBe(0.3);
      expect(material.restitution).toBe(0.3);
    });

    it('should create ball body with correct properties', () => {
      const position = { x: 0, y: 1, z: 0 };
      const radius = 0.5;
      const body = physics.createBallBody(position, radius);

      expect(body).toBeDefined();
      expect(body.position.x).toBe(position.x);
      expect(body.position.y).toBe(position.y);
      expect(body.position.z).toBe(position.z);
      expect(body.mass).toBe(1);
      expect(body.linearDamping).toBe(0.3);
      expect(body.angularDamping).toBe(0.3);
      expect(body.material).toBeDefined();
      const material = body.material as CANNON.Material;
      expect(material.friction).toBe(0.3);
      expect(material.restitution).toBe(0.8);
    });
  });

  describe('impulse application', () => {
    it('should apply impulse to body', () => {
      const position = { x: 0, y: 1, z: 0 };
      const body = physics.createBallBody(position, 0.5);
      const impulse = { x: 1, y: 0, z: 0 };

      physics.applyImpulse(body, impulse);
      expect(body.velocity.x).toBeGreaterThan(0);
    });
  });

  describe('world update', () => {
    it('should update physics world', () => {
      const position = { x: 0, y: 1, z: 0 };
      const body = physics.createBallBody(position, 0.5);
      const initialY = body.position.y;

      physics.update(0.016); // 60 FPS
      expect(body.position.y).toBeLessThan(initialY); // Should fall due to gravity
    });
  });

  describe('cleanup', () => {
    it('should remove all bodies from world', () => {
      const position = { x: 0, y: 1, z: 0 };
      physics.createBallBody(position, 0.5);
      physics.createPlayerBody(position, 1);

      expect(physics.world.bodies.length).toBeGreaterThan(0);
      physics.cleanup();
      expect(physics.world.bodies.length).toBe(0);
    });
  });
}); 
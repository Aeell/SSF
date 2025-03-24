import { Ball } from '../Ball';
import { Scene } from 'three';
import { Physics } from '../../physics/Physics';

describe('Ball', () => {
  let ball: Ball;
  let mockScene: Scene;
  let mockPhysics: Physics;

  beforeEach(() => {
    mockScene = new Scene();
    mockPhysics = new Physics();
    ball = new Ball(mockScene, mockPhysics, {});
  });

  afterEach(() => {
    ball.cleanup();
    mockPhysics.cleanup();
  });

  describe('initialization', () => {
    it('should initialize with default settings', () => {
      expect(ball).toBeDefined();
      expect(ball.mesh).toBeDefined();
      expect(ball.physicsBody).toBeDefined();
    });

    it('should initialize with custom settings', () => {
      const customSettings = {
        radius: 0.8,
        maxSpeed: 20,
        drag: 0.5
      };
      ball = new Ball(mockScene, mockPhysics, customSettings);
      expect(ball.radius).toBe(customSettings.radius);
      expect(ball.maxSpeed).toBe(customSettings.maxSpeed);
      expect(ball.drag).toBe(customSettings.drag);
    });
  });

  describe('position and movement', () => {
    it('should update position based on physics body', () => {
      const initialPosition = ball.getPosition();
      const newPosition = { x: 1, y: 1, z: 1 };
      ball.physicsBody.position.set(newPosition.x, newPosition.y, newPosition.z);

      ball.update(0.016);
      const currentPosition = ball.getPosition();
      expect(currentPosition.x).toBe(newPosition.x);
      expect(currentPosition.y).toBe(newPosition.y);
      expect(currentPosition.z).toBe(newPosition.z);
    });

    it('should apply drag to slow down ball', () => {
      const initialVelocity = { x: 10, y: 0, z: 0 };
      ball.physicsBody.velocity.set(initialVelocity.x, initialVelocity.y, initialVelocity.z);

      ball.update(0.016);
      expect(ball.physicsBody.velocity.x).toBeLessThan(initialVelocity.x);
    });

    it('should limit maximum speed', () => {
      const highVelocity = { x: 30, y: 0, z: 0 };
      ball.physicsBody.velocity.set(highVelocity.x, highVelocity.y, highVelocity.z);

      ball.update(0.016);
      const speed = Math.sqrt(
        ball.physicsBody.velocity.x ** 2 +
        ball.physicsBody.velocity.y ** 2 +
        ball.physicsBody.velocity.z ** 2
      );
      expect(speed).toBeLessThanOrEqual(ball.maxSpeed);
    });
  });

  describe('reset', () => {
    it('should reset position and velocity', () => {
      const initialPosition = ball.getPosition();
      const initialVelocity = { x: 0, y: 0, z: 0 };

      // Move ball to new position and set velocity
      ball.physicsBody.position.set(1, 1, 1);
      ball.physicsBody.velocity.set(10, 10, 10);

      ball.reset();
      const currentPosition = ball.getPosition();
      const currentVelocity = ball.physicsBody.velocity;

      expect(currentPosition.x).toBe(initialPosition.x);
      expect(currentPosition.y).toBe(initialPosition.y);
      expect(currentPosition.z).toBe(initialPosition.z);
      expect(currentVelocity.x).toBe(initialVelocity.x);
      expect(currentVelocity.y).toBe(initialVelocity.y);
      expect(currentVelocity.z).toBe(initialVelocity.z);
    });
  });

  describe('cleanup', () => {
    it('should remove mesh from scene and body from physics world', () => {
      const meshCount = mockScene.children.length;
      const bodyCount = mockPhysics.world.bodies.length;

      ball.cleanup();

      expect(mockScene.children.length).toBe(meshCount - 1);
      expect(mockPhysics.world.bodies.length).toBe(bodyCount - 1);
    });
  });
}); 
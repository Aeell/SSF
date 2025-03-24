import { Player } from '../Player';
import { Scene } from 'three';
import { Physics } from '../../physics/Physics';
import { Ball } from '../Ball';

describe('Player', () => {
  let player: Player;
  let mockScene: Scene;
  let mockPhysics: Physics;
  let mockBall: Ball;

  beforeEach(() => {
    mockScene = new Scene();
    mockPhysics = new Physics();
    mockBall = new Ball(mockScene, mockPhysics, {});
    player = new Player(mockScene, mockPhysics, {});
  });

  afterEach(() => {
    player.cleanup();
    mockBall.cleanup();
    mockPhysics.cleanup();
  });

  describe('initialization', () => {
    it('should initialize with default settings', () => {
      expect(player).toBeDefined();
      expect(player.mesh).toBeDefined();
      expect(player.physicsBody).toBeDefined();
      expect(player.abilities.size).toBe(3); // Default abilities: Speed Boost, Power Kick, Shield
    });

    it('should initialize with custom settings', () => {
      const customSettings = {
        moveSpeed: 10,
        rotationSpeed: 5,
        abilities: ['Speed Boost', 'Power Kick']
      };
      player = new Player(mockScene, mockPhysics, customSettings);
      expect(player.moveSpeed).toBe(customSettings.moveSpeed);
      expect(player.rotationSpeed).toBe(customSettings.rotationSpeed);
      expect(player.abilities.size).toBe(2);
    });
  });

  describe('movement', () => {
    it('should move forward', () => {
      const initialPosition = player.getPosition();
      player.moveForward();
      player.update(0.016);
      const currentPosition = player.getPosition();
      expect(currentPosition.z).toBeLessThan(initialPosition.z);
    });

    it('should move backward', () => {
      const initialPosition = player.getPosition();
      player.moveBackward();
      player.update(0.016);
      const currentPosition = player.getPosition();
      expect(currentPosition.z).toBeGreaterThan(initialPosition.z);
    });

    it('should move left', () => {
      const initialPosition = player.getPosition();
      player.moveLeft();
      player.update(0.016);
      const currentPosition = player.getPosition();
      expect(currentPosition.x).toBeLessThan(initialPosition.x);
    });

    it('should move right', () => {
      const initialPosition = player.getPosition();
      player.moveRight();
      player.update(0.016);
      const currentPosition = player.getPosition();
      expect(currentPosition.x).toBeGreaterThan(initialPosition.x);
    });

    it('should stop movement when stopping', () => {
      player.moveForward();
      player.stopForward();
      const initialPosition = player.getPosition();
      player.update(0.016);
      const currentPosition = player.getPosition();
      expect(currentPosition.z).toBe(initialPosition.z);
    });
  });

  describe('abilities', () => {
    it('should use ability when available', () => {
      const speedBoost = player.abilities.get('Speed Boost');
      expect(speedBoost).toBeDefined();
      expect(speedBoost?.isOnCooldown).toBe(false);
      
      player.useAbility('Speed Boost');
      expect(speedBoost?.isOnCooldown).toBe(true);
    });

    it('should not use ability when on cooldown', () => {
      player.useAbility('Speed Boost');
      const initialSpeed = player.moveSpeed;
      
      player.useAbility('Speed Boost');
      expect(player.moveSpeed).toBe(initialSpeed);
    });

    it('should update ability cooldowns', () => {
      player.useAbility('Speed Boost');
      const speedBoost = player.abilities.get('Speed Boost');
      expect(speedBoost?.isOnCooldown).toBe(true);
      
      // Simulate time passing
      for (let i = 0; i < 100; i++) {
        player.update(0.016);
      }
      
      expect(speedBoost?.isOnCooldown).toBe(false);
    });
  });

  describe('kicking', () => {
    it('should kick ball with correct force', () => {
      const initialBallPosition = mockBall.getPosition();
      player.kick(mockBall);
      player.update(0.016);
      const currentBallPosition = mockBall.getPosition();
      expect(currentBallPosition.x).not.toBe(initialBallPosition.x);
      expect(currentBallPosition.z).not.toBe(initialBallPosition.z);
    });
  });

  describe('cleanup', () => {
    it('should remove mesh from scene and body from physics world', () => {
      const meshCount = mockScene.children.length;
      const bodyCount = mockPhysics.world.bodies.length;

      player.cleanup();

      expect(mockScene.children.length).toBe(meshCount - 1);
      expect(mockPhysics.world.bodies.length).toBe(bodyCount - 1);
    });
  });
}); 
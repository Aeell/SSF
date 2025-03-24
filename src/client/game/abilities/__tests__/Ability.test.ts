import { Ability } from '../Ability';
import { Player } from '../../entities/Player';
import { Scene } from 'three';
import { Physics } from '../../physics/Physics';
import { Ball } from '../../entities/Ball';

describe('Ability', () => {
  let scene: Scene;
  let physics: Physics;
  let player: Player;
  let ability: Ability;

  beforeEach(() => {
    scene = new Scene();
    physics = new Physics();
    player = new Player(scene, physics);
    ability = new Ability(player, {
      name: 'Test Ability',
      cooldown: 5,
      duration: 2,
      effect: () => {
        player.moveSpeed *= 2;
      },
      cleanup: () => {
        player.moveSpeed /= 2;
      }
    });
  });

  afterEach(() => {
    scene.clear();
    physics.cleanup();
    player.cleanup();
  });

  describe('initialization', () => {
    it('should initialize with correct properties', () => {
      expect(ability.name).toBe('Test Ability');
      expect(ability.cooldown).toBe(5);
      expect(ability.duration).toBe(2);
      expect(ability.isActive).toBe(false);
      expect(ability.remainingCooldown).toBe(0);
    });
  });

  describe('activation', () => {
    it('should activate ability when not on cooldown', () => {
      const initialSpeed = player.moveSpeed;
      ability.activate();
      expect(ability.isActive).toBe(true);
      expect(player.moveSpeed).toBe(initialSpeed * 2);
    });

    it('should not activate ability when on cooldown', () => {
      ability.activate();
      ability.update(3); // Deactivate ability
      ability.activate(); // Try to activate again immediately
      expect(ability.isActive).toBe(false);
    });
  });

  describe('update', () => {
    it('should deactivate ability after duration expires', () => {
      const initialSpeed = player.moveSpeed;
      ability.activate();
      ability.update(3); // Update past duration
      expect(ability.isActive).toBe(false);
      expect(player.moveSpeed).toBe(initialSpeed);
    });

    it('should update cooldown timer', () => {
      ability.activate();
      ability.update(3); // Deactivate ability
      expect(ability.remainingCooldown).toBeGreaterThan(0);
    });

    it('should reset cooldown after full cooldown period', () => {
      ability.activate();
      ability.update(3); // Deactivate ability
      ability.update(5); // Wait full cooldown period
      expect(ability.remainingCooldown).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should clean up ability effects', () => {
      const initialSpeed = player.moveSpeed;
      ability.activate();
      ability.cleanup();
      expect(player.moveSpeed).toBe(initialSpeed);
    });
  });
}); 
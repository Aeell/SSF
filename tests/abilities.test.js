import { SpeedBoost } from '../src/client/game/abilities/SpeedBoost';
import { PowerShot } from '../src/client/game/abilities/PowerShot';
import { Shield } from '../src/client/game/abilities/Shield';
import { Teleport } from '../src/client/game/abilities/Teleport';

describe('Abilities System', () => {
    let mockPlayer;
    let speedBoost;
    let powerShot;
    let shield;
    let teleport;

    beforeEach(() => {
        // Create mock player
        mockPlayer = {
            id: 'player1',
            speed: 5,
            shotPower: 10,
            mesh: {
                material: {
                    emissive: { set: jest.fn() }
                },
                position: { clone: jest.fn().mockReturnValue({ add: jest.fn() }) },
                getWorldDirection: jest.fn()
            },
            body: {
                position: { copy: jest.fn() },
                collisionFilter: 0x0001
            },
            scene: {
                add: jest.fn(),
                remove: jest.fn()
            }
        };

        // Initialize abilities
        speedBoost = new SpeedBoost();
        powerShot = new PowerShot();
        shield = new Shield();
        teleport = new Teleport();
    });

    describe('SpeedBoost Ability', () => {
        test('should increase player speed when activated', () => {
            speedBoost.activate(mockPlayer);
            expect(mockPlayer.speed).toBe(10); // 5 * 2.0
        });

        test('should restore original speed when deactivated', () => {
            speedBoost.activate(mockPlayer);
            speedBoost.deactivate(mockPlayer);
            expect(mockPlayer.speed).toBe(5);
        });

        test('should respect cooldown period', () => {
            speedBoost.activate(mockPlayer);
            speedBoost.update(31); // Update past cooldown
            expect(speedBoost.isReady()).toBe(true);
        });
    });

    describe('PowerShot Ability', () => {
        test('should increase shot power when activated', () => {
            powerShot.activate(mockPlayer);
            expect(mockPlayer.shotPower).toBe(25); // 10 * 2.5
        });

        test('should restore original shot power when deactivated', () => {
            powerShot.activate(mockPlayer);
            powerShot.deactivate(mockPlayer);
            expect(mockPlayer.shotPower).toBe(10);
        });

        test('should have instant effect duration', () => {
            powerShot.activate(mockPlayer);
            powerShot.update(1);
            expect(powerShot.isActive).toBe(false);
        });
    });

    describe('Shield Ability', () => {
        test('should modify collision filter when activated', () => {
            shield.activate(mockPlayer);
            expect(mockPlayer.body.collisionFilter).toBe(0x0002);
        });

        test('should restore original collision filter when deactivated', () => {
            shield.activate(mockPlayer);
            shield.deactivate(mockPlayer);
            expect(mockPlayer.body.collisionFilter).toBe(0x0001);
        });

        test('should last for specified duration', () => {
            shield.activate(mockPlayer);
            shield.update(9); // Update past duration
            expect(shield.isActive).toBe(false);
        });
    });

    describe('Teleport Ability', () => {
        test('should update player position when activated', () => {
            const mockPosition = { x: 0, y: 0, z: 0 };
            mockPlayer.mesh.position.clone.mockReturnValue(mockPosition);
            mockPlayer.mesh.getWorldDirection.mockImplementation((direction) => {
                direction.set(0, 0, 1);
            });

            teleport.activate(mockPlayer);
            expect(mockPlayer.body.position.copy).toHaveBeenCalled();
            expect(mockPlayer.mesh.position.copy).toHaveBeenCalled();
        });

        test('should create visual effect', () => {
            teleport.activate(mockPlayer);
            expect(mockPlayer.scene.add).toHaveBeenCalled();
        });

        test('should have instant effect duration', () => {
            teleport.activate(mockPlayer);
            teleport.update(1);
            expect(teleport.isActive).toBe(false);
        });
    });

    describe('Ability Cooldowns', () => {
        test('should prevent activation during cooldown', () => {
            speedBoost.activate(mockPlayer);
            expect(speedBoost.activate(mockPlayer)).toBe(false);
        });

        test('should allow activation after cooldown', () => {
            speedBoost.activate(mockPlayer);
            speedBoost.update(31); // Update past cooldown
            expect(speedBoost.activate(mockPlayer)).toBe(true);
        });
    });

    describe('Visual Effects', () => {
        test('should apply visual effects on activation', () => {
            speedBoost.activate(mockPlayer);
            expect(mockPlayer.mesh.material.emissive.set).toHaveBeenCalledWith(0x00ff00);
        });

        test('should remove visual effects on deactivation', () => {
            speedBoost.activate(mockPlayer);
            speedBoost.deactivate(mockPlayer);
            expect(mockPlayer.mesh.material.emissive.set).toHaveBeenCalledWith(0x000000);
        });
    });
}); 
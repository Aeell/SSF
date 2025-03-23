import { Game } from '../src/client/core/Game';
import { Physics } from '../src/client/core/Physics';
import { Input } from '../src/client/core/Input';
import { EventBus } from '../src/client/core/EventBus';

describe('Performance Tests', () => {
    let game;
    let physics;
    let input;
    let eventBus;

    beforeEach(() => {
        eventBus = new EventBus();
        physics = new Physics();
        input = new Input();
        game = new Game(physics, input, eventBus);
    });

    afterEach(() => {
        game.destroy();
        physics.destroy();
        input.destroy();
        eventBus.destroy();
    });

    describe('Frame Rate Tests', () => {
        test('should maintain 60 FPS with 100 entities', () => {
            // Create 100 entities
            for (let i = 0; i < 100; i++) {
                physics.createPlayer();
            }

            const startTime = performance.now();
            const frames = 60;
            
            for (let i = 0; i < frames; i++) {
                game.update();
                game.render();
            }

            const endTime = performance.now();
            const averageFrameTime = (endTime - startTime) / frames;
            
            // Should maintain 60 FPS (16.67ms per frame)
            expect(averageFrameTime).toBeLessThan(16.67);
        });

        test('should handle rapid input events', () => {
            const startTime = performance.now();
            const events = 1000;

            for (let i = 0; i < events; i++) {
                input.handleKeyDown(new KeyboardEvent('keydown', { key: 'w' }));
                input.handleKeyUp(new KeyboardEvent('keyup', { key: 'w' }));
            }

            const endTime = performance.now();
            const averageEventTime = (endTime - startTime) / events;

            // Should handle events in less than 1ms each
            expect(averageEventTime).toBeLessThan(1);
        });
    });

    describe('Memory Usage Tests', () => {
        test('should not leak memory during gameplay', () => {
            const initialMemory = process.memoryUsage().heapUsed;
            const iterations = 1000;

            for (let i = 0; i < iterations; i++) {
                const player = physics.createPlayer();
                game.update();
                game.render();
                physics.removeEntity(player);
            }

            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;

            // Memory increase should be less than 10MB
            expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
        });

        test('should handle rapid entity creation and deletion', () => {
            const startTime = performance.now();
            const operations = 1000;

            for (let i = 0; i < operations; i++) {
                const entity = physics.createPlayer();
                physics.removeEntity(entity);
            }

            const endTime = performance.now();
            const averageOperationTime = (endTime - startTime) / operations;

            // Should handle operations in less than 0.1ms each
            expect(averageOperationTime).toBeLessThan(0.1);
        });
    });

    describe('Network Performance Tests', () => {
        test('should handle rapid state updates', () => {
            const startTime = performance.now();
            const updates = 1000;

            for (let i = 0; i < updates; i++) {
                eventBus.emit('stateUpdate', {
                    timestamp: Date.now(),
                    data: { x: Math.random(), y: Math.random() }
                });
            }

            const endTime = performance.now();
            const averageUpdateTime = (endTime - startTime) / updates;

            // Should handle updates in less than 0.1ms each
            expect(averageUpdateTime).toBeLessThan(0.1);
        });

        test('should maintain smooth physics with network latency', () => {
            const startTime = performance.now();
            const frames = 60;
            const latency = 100; // Simulate 100ms network latency

            for (let i = 0; i < frames; i++) {
                // Simulate network update
                setTimeout(() => {
                    game.update();
                    game.render();
                }, latency);
            }

            const endTime = performance.now();
            const averageFrameTime = (endTime - startTime) / frames;

            // Should maintain smooth gameplay despite latency
            expect(averageFrameTime).toBeLessThan(16.67);
        });
    });

    describe('Asset Loading Tests', () => {
        test('should load assets efficiently', async () => {
            const startTime = performance.now();
            const assets = 100;

            for (let i = 0; i < assets; i++) {
                await game.loadAsset(`test-asset-${i}`);
            }

            const endTime = performance.now();
            const averageLoadTime = (endTime - startTime) / assets;

            // Should load assets in less than 10ms each
            expect(averageLoadTime).toBeLessThan(10);
        });

        test('should handle concurrent asset loading', async () => {
            const startTime = performance.now();
            const assets = 10;
            const concurrentLoads = 5;

            const loadPromises = [];
            for (let i = 0; i < concurrentLoads; i++) {
                for (let j = 0; j < assets; j++) {
                    loadPromises.push(game.loadAsset(`test-asset-${i}-${j}`));
                }
            }

            await Promise.all(loadPromises);
            const endTime = performance.now();
            const totalTime = endTime - startTime;

            // Should handle concurrent loads efficiently
            expect(totalTime).toBeLessThan(1000); // Less than 1 second total
        });
    });
}); 
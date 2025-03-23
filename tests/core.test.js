import { jest } from '@jest/globals';
import { Game } from '../src/client/core/Game';
import { Physics } from '../src/client/core/Physics';
import { Input } from '../src/client/core/Input';
import { EventBus } from '../src/client/core/EventBus';

describe('Core Game Functionality', () => {
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

    describe('Game Initialization', () => {
        test('should initialize game with required components', () => {
            expect(game).toBeDefined();
            expect(physics).toBeDefined();
            expect(input).toBeDefined();
            expect(eventBus).toBeDefined();
        });

        test('should set up event listeners', () => {
            const mockCallback = jest.fn();
            eventBus.on('gameStart', mockCallback);
            game.start();
            expect(mockCallback).toHaveBeenCalled();
        });
    });

    describe('Physics System', () => {
        test('should handle ball physics correctly', () => {
            const ball = physics.createBall();
            expect(ball).toBeDefined();
            expect(ball.position).toBeDefined();
            expect(ball.velocity).toBeDefined();
        });

        test('should handle player collisions', () => {
            const player1 = physics.createPlayer();
            const player2 = physics.createPlayer();
            expect(physics.checkCollision(player1, player2)).toBeDefined();
        });
    });

    describe('Input System', () => {
        test('should handle keyboard input', () => {
            const mockKeyEvent = new KeyboardEvent('keydown', { key: 'w' });
            input.handleKeyDown(mockKeyEvent);
            expect(input.isKeyPressed('w')).toBe(true);
        });

        test('should handle mouse input', () => {
            const mockMouseEvent = new MouseEvent('mousemove', {
                clientX: 100,
                clientY: 100
            });
            input.handleMouseMove(mockMouseEvent);
            expect(input.getMousePosition()).toEqual({ x: 100, y: 100 });
        });
    });

    describe('Event System', () => {
        test('should emit and handle events', () => {
            const mockCallback = jest.fn();
            eventBus.on('testEvent', mockCallback);
            eventBus.emit('testEvent', { data: 'test' });
            expect(mockCallback).toHaveBeenCalledWith({ data: 'test' });
        });

        test('should remove event listeners', () => {
            const mockCallback = jest.fn();
            eventBus.on('testEvent', mockCallback);
            eventBus.off('testEvent', mockCallback);
            eventBus.emit('testEvent', { data: 'test' });
            expect(mockCallback).not.toHaveBeenCalled();
        });
    });

    describe('Game Loop', () => {
        test('should update game state', () => {
            const mockUpdate = jest.fn();
            game.onUpdate = mockUpdate;
            game.update();
            expect(mockUpdate).toHaveBeenCalled();
        });

        test('should render game state', () => {
            const mockRender = jest.fn();
            game.onRender = mockRender;
            game.render();
            expect(mockRender).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        test('should handle physics errors gracefully', () => {
            const mockError = new Error('Physics error');
            jest.spyOn(physics, 'update').mockImplementation(() => {
                throw mockError;
            });
            expect(() => game.update()).not.toThrow();
        });

        test('should handle input errors gracefully', () => {
            const mockError = new Error('Input error');
            jest.spyOn(input, 'handleKeyDown').mockImplementation(() => {
                throw mockError;
            });
            expect(() => input.handleKeyDown(new KeyboardEvent('keydown'))).not.toThrow();
        });
    });

    describe('Performance', () => {
        test('should maintain stable frame rate', () => {
            const startTime = performance.now();
            for (let i = 0; i < 100; i++) {
                game.update();
                game.render();
            }
            const endTime = performance.now();
            const averageFrameTime = (endTime - startTime) / 100;
            expect(averageFrameTime).toBeLessThan(16.67); // 60 FPS
        });
    });
}); 
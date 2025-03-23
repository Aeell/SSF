import { Game } from '../game/Game.js';
import { Scene, Camera } from 'three';
import { logger } from '../utils/logger.js';

describe('Game', () => {
    let game;
    let scene;
    let camera;

    beforeEach(() => {
        // Create mock Three.js scene and camera
        scene = new Scene();
        camera = new Camera();
        
        // Initialize game
        game = new Game(scene, camera);
    });

    test('Game initializes correctly', () => {
        expect(game.state.isPlaying).toBe(false);
        expect(game.state.score).toEqual({ home: 0, away: 0 });
        expect(game.state.time).toBe(0);
        expect(game.state.currentHalf).toBe(1);
        expect(game.state.isHalfTime).toBe(false);
    });

    test('Game starts correctly', () => {
        game.startMatch();
        expect(game.state.isPlaying).toBe(true);
        expect(game.state.time).toBe(0);
        expect(game.state.currentHalf).toBe(1);
        expect(game.state.score).toEqual({ home: 0, away: 0 });
    });

    test('Goal detection works', () => {
        game.startMatch();
        
        // Simulate ball position and velocity for a goal
        game.ball.setPosition(0, 0, -15);
        game.ball.setVelocity(0, 0, -1);
        
        // Update game to trigger goal detection
        game.update(0.1);
        
        expect(game.state.score.away).toBe(1);
    });

    test('Half time transition works', () => {
        game.startMatch();
        
        // Simulate time passing
        game.state.time = 10 * 60; // 10 minutes
        game.update(0.1);
        
        expect(game.state.isHalfTime).toBe(true);
        expect(game.state.currentHalf).toBe(2);
    });

    test('Player switching works', () => {
        game.startMatch();
        const initialPlayer = game.currentPlayer;
        
        game.switchPlayer();
        expect(game.currentPlayer).not.toBe(initialPlayer);
    });

    test('Movement controls work', () => {
        game.startMatch();
        
        // Simulate key press
        game.movementKeys.w = true;
        game.update(0.1);
        
        expect(game.currentPlayer.mesh.position.z).toBeLessThan(0);
    });

    test('AI behavior changes with difficulty', () => {
        const easyGame = new Game(scene, camera, 'easy');
        const hardGame = new Game(scene, camera, 'hard');
        
        expect(easyGame.aiController.settings.easy.reactionTime).toBeGreaterThan(
            hardGame.aiController.settings.hard.reactionTime
        );
    });

    test('Team tactics update based on score', () => {
        game.startMatch();
        
        // Simulate losing with less than 5 minutes left
        game.state.time = 8 * 60; // 8 minutes
        game.state.score = { home: 2, away: 1 };
        
        game.update(0.1);
        
        expect(game.aiController.teamState.tactic).toBe('attacking');
    });

    test('Goal celebration works', () => {
        game.startMatch();
        
        // Simulate goal
        game.scoreGoal('home');
        
        // Check if game is paused
        expect(game.state.isPlaying).toBe(false);
        
        // Wait for celebration to end
        setTimeout(() => {
            expect(game.state.isPlaying).toBe(true);
        }, 2000);
    });
}); 
import { THREE } from '../utils/three';
import logger from '../utils/logger';
import Player from './Player';
import Ball from './Ball';
import Field from './Field';
import { Team } from './Team';
import { AIController } from './ai/AIController';

export default class Game {
    constructor(scene, camera, networkManager) {
        try {
            logger.info('Initializing game components...');
            
            this.scene = scene;
            this.camera = camera;
            this.networkManager = networkManager;
            
            // Initialize game state
            this.players = new Map();
            this.ball = null;
            this.field = null;
            this.clock = new THREE.Clock();
            
            this.initializeGameComponents();
            logger.info('Game components initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize game:', error);
            throw error;
        }
    }

    initializeGameComponents() {
        try {
            // Create field
            this.field = new Field(this.scene);
            logger.debug('Field created');

            // Create ball
            this.ball = new Ball(this.scene);
            logger.debug('Ball created');

            // Setup network event handlers
            this.setupNetworkHandlers();
            logger.debug('Network handlers setup complete');
        } catch (error) {
            logger.error('Failed to initialize game components:', error);
            throw error;
        }
    }

    setupNetworkHandlers() {
        try {
            this.networkManager.on('playerJoined', (data) => {
                logger.info('Player joined:', data.id);
                this.addPlayer(data);
            });

            this.networkManager.on('playerLeft', (playerId) => {
                logger.info('Player left:', playerId);
                this.removePlayer(playerId);
            });

            this.networkManager.on('gameState', (state) => {
                this.updateGameState(state);
            });

            logger.debug('Network handlers initialized');
        } catch (error) {
            logger.error('Failed to setup network handlers:', error);
            throw error;
        }
    }

    addPlayer(playerData) {
        try {
            const player = new Player(this.scene, playerData);
            this.players.set(playerData.id, player);
            logger.debug('Player added:', playerData.id);
        } catch (error) {
            logger.error('Failed to add player:', error);
        }
    }

    removePlayer(playerId) {
        try {
            const player = this.players.get(playerId);
            if (player) {
                player.cleanup();
                this.players.delete(playerId);
                logger.debug('Player removed:', playerId);
            }
        } catch (error) {
            logger.error('Failed to remove player:', error);
        }
    }

    updateGameState(state) {
        try {
            // Update ball position
            if (state.ball) {
                this.ball.setPosition(state.ball.position);
                this.ball.setVelocity(state.ball.velocity);
            }

            // Update players
            state.players.forEach((playerState) => {
                const player = this.players.get(playerState.id);
                if (player) {
                    player.updateState(playerState);
                }
            });
        } catch (error) {
            logger.error('Failed to update game state:', error);
        }
    }

    update() {
        try {
            const deltaTime = this.clock.getDelta();

            // Update all game components
            this.players.forEach(player => player.update(deltaTime));
            this.ball.update(deltaTime);

            // Update physics
            this.updatePhysics(deltaTime);
        } catch (error) {
            logger.error('Game update error:', error);
        }
    }

    updatePhysics(deltaTime) {
        try {
            // Ball-player collisions
            this.players.forEach(player => {
                if (this.ball.checkCollision(player)) {
                    this.handleBallCollision(player);
                }
            });

            // Ball-field collisions
            this.field.checkBallCollision(this.ball);
        } catch (error) {
            logger.error('Physics update error:', error);
        }
    }

    handleBallCollision(player) {
        try {
            // Calculate new ball velocity based on player's movement
            const ballVelocity = this.ball.getVelocity();
            const playerVelocity = player.getVelocity();
            
            // Apply collision response
            this.ball.setVelocity({
                x: ballVelocity.x + playerVelocity.x * 0.5,
                y: ballVelocity.y + playerVelocity.y * 0.5,
                z: ballVelocity.z + playerVelocity.z * 0.5
            });

            logger.debug('Ball collision handled with player:', player.id);
        } catch (error) {
            logger.error('Failed to handle ball collision:', error);
        }
    }

    cleanup() {
        try {
            // Cleanup all players
            this.players.forEach(player => player.cleanup());
            this.players.clear();

            // Cleanup ball
            if (this.ball) {
                this.ball.cleanup();
            }

            // Cleanup field
            if (this.field) {
                this.field.cleanup();
            }

            logger.info('Game cleanup complete');
        } catch (error) {
            logger.error('Failed to cleanup game:', error);
        }
    }
} 
import { logger } from '../../utils/logger.js';
import { THREE } from '../../utils/three.js';

export class AIController {
    constructor(game, difficulty = 'normal') {
        try {
            this.game = game;
            this.difficulty = difficulty;
            
            // AI settings based on difficulty
            this.settings = {
                easy: {
                    reactionTime: 1.0,
                    accuracy: 0.6,
                    aggressiveness: 0.3,
                    teamwork: 0.4
                },
                normal: {
                    reactionTime: 0.5,
                    accuracy: 0.75,
                    aggressiveness: 0.6,
                    teamwork: 0.7
                },
                hard: {
                    reactionTime: 0.2,
                    accuracy: 0.9,
                    aggressiveness: 0.8,
                    teamwork: 0.9
                }
            };
            
            // Current team state
            this.teamState = {
                possession: false,
                tactic: 'balanced',
                formation: '4-4-2',
                pressure: 0.5
            };
            
            logger.debug('AI Controller initialized', {
                difficulty,
                settings: this.settings[difficulty]
            });
        } catch (error) {
            logger.error('Failed to initialize AI Controller:', {
                error: error.message,
                stack: error.stack,
                details: {
                    difficulty,
                    hasGame: !!game
                }
            });
            throw error;
        }
    }
    
    update(deltaTime) {
        try {
            // Update team state based on game situation
            this.updateTeamState();
            
            // Update AI players
            this.game.players.forEach(player => {
                if (!player.isControlled) {
                    this.updatePlayerBehavior(player, deltaTime);
                }
            });
        } catch (error) {
            logger.error('Failed to update AI:', {
                error: error.message,
                stack: error.stack,
                details: {
                    deltaTime,
                    teamState: this.teamState
                }
            });
        }
    }
    
    updateTeamState() {
        try {
            const gameState = this.game.state;
            const ballPos = this.game.ball.mesh.position;
            
            // Update possession
            this.teamState.possession = this.calculatePossession();
            
            // Update tactics based on score and time
            if (gameState.score.home < gameState.score.away) {
                if (gameState.time > 8 * 60) { // Last 2 minutes
                    this.teamState.tactic = 'all_out_attack';
                    this.teamState.pressure = 1.0;
                } else {
                    this.teamState.tactic = 'attacking';
                    this.teamState.pressure = 0.8;
                }
            } else if (gameState.score.home > gameState.score.away) {
                if (gameState.time > 8 * 60) {
                    this.teamState.tactic = 'defensive';
                    this.teamState.pressure = 0.3;
                } else {
                    this.teamState.tactic = 'balanced';
                    this.teamState.pressure = 0.5;
                }
            }
            
            logger.debug('Team state updated', {
                possession: this.teamState.possession,
                tactic: this.teamState.tactic,
                pressure: this.teamState.pressure
            });
        } catch (error) {
            logger.error('Failed to update team state:', {
                error: error.message,
                stack: error.stack
            });
        }
    }
    
    updatePlayerBehavior(player, deltaTime) {
        try {
            const settings = this.settings[this.difficulty];
            const ballPos = this.game.ball.mesh.position;
            const playerPos = player.mesh.position;
            
            // Calculate optimal position based on role and tactics
            const targetPos = this.calculateOptimalPosition(player);
            
            // Move towards target with some randomness based on accuracy
            const direction = new THREE.Vector3()
                .subVectors(targetPos, playerPos)
                .normalize()
                .multiplyScalar(settings.accuracy);
                
            // Add some noise to movement
            direction.x += (Math.random() - 0.5) * (1 - settings.accuracy);
            direction.z += (Math.random() - 0.5) * (1 - settings.accuracy);
            
            // Apply movement
            player.movement.copy(direction);
            
            // Use abilities based on situation
            this.handleAbilities(player);
            
            logger.debug('Player behavior updated', {
                player: player.role,
                position: playerPos,
                target: targetPos,
                movement: direction
            });
        } catch (error) {
            logger.error('Failed to update player behavior:', {
                error: error.message,
                stack: error.stack,
                details: {
                    playerRole: player.role,
                    deltaTime
                }
            });
        }
    }
    
    calculateOptimalPosition(player) {
        try {
            const ballPos = this.game.ball.mesh.position;
            const settings = this.settings[this.difficulty];
            let targetPos = new THREE.Vector3();
            
            switch (player.role) {
                case 'striker':
                    if (this.teamState.possession) {
                        // Position for attack
                        targetPos.set(
                            ballPos.x * 0.8,
                            0,
                            Math.min(ballPos.z + 5, 13)
                        );
                    } else {
                        // Position for pressing
                        targetPos.set(
                            ballPos.x * 0.6,
                            0,
                            ballPos.z * 0.8
                        );
                    }
                    break;
                    
                case 'midfielder':
                    targetPos.set(
                        ballPos.x * 0.5,
                        0,
                        ballPos.z * 0.3
                    );
                    break;
                    
                case 'defender':
                    targetPos.set(
                        ballPos.x * 0.3,
                        0,
                        Math.max(ballPos.z * 0.2, -12)
                    );
                    break;
            }
            
            return targetPos;
        } catch (error) {
            logger.error('Failed to calculate optimal position:', {
                error: error.message,
                stack: error.stack,
                details: {
                    playerRole: player.role,
                    teamState: this.teamState
                }
            });
            return player.mesh.position.clone();
        }
    }
    
    handleAbilities(player) {
        try {
            const settings = this.settings[this.difficulty];
            const ballPos = this.game.ball.mesh.position;
            const playerPos = player.mesh.position;
            const distToBall = playerPos.distanceTo(ballPos);
            
            // Use abilities based on situation and role
            if (distToBall < 3 && Math.random() < settings.aggressiveness) {
                switch (player.role) {
                    case 'striker':
                        if (this.teamState.possession) {
                            player.useAbility('powerShot');
                        }
                        break;
                    case 'midfielder':
                        if (!this.teamState.possession) {
                            player.useAbility('tackle');
                        }
                        break;
                    case 'defender':
                        if (!this.teamState.possession) {
                            player.useAbility('slide');
                        }
                        break;
                }
            }
            
            // Use sprint ability when appropriate
            if (distToBall < 8 && player.stamina > 30) {
                player.useAbility('sprint');
            }
        } catch (error) {
            logger.error('Failed to handle abilities:', {
                error: error.message,
                stack: error.stack,
                details: {
                    playerRole: player.role,
                    abilities: player.abilities.map(a => a.name)
                }
            });
        }
    }
    
    calculatePossession() {
        try {
            const ballPos = this.game.ball.mesh.position;
            let nearestPlayer = null;
            let minDistance = Infinity;
            
            this.game.players.forEach(player => {
                const dist = player.mesh.position.distanceTo(ballPos);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearestPlayer = player;
                }
            });
            
            return nearestPlayer && nearestPlayer.team === 'home';
        } catch (error) {
            logger.error('Failed to calculate possession:', {
                error: error.message,
                stack: error.stack
            });
            return false;
        }
    }
} 
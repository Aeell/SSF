import * as THREE from 'three';
import logger from '../../utils/logger';

export class AIController {
    constructor(game, difficulty = 'normal') {
        this.game = game;
        this.difficulty = difficulty;
        this.updateInterval = 0.1; // 100ms between AI updates
        this.lastUpdate = 0;
        this.behaviorStates = new Map();
        this.teamState = {
            possession: null,
            formation: '4-3-3',
            tactic: 'balanced',
            lastTacticChange: 0
        };
        
        // Difficulty settings
        this.settings = {
            easy: {
                reactionTime: 0.3,
                accuracy: 0.7,
                aggression: 0.5,
                teamwork: 0.6
            },
            normal: {
                reactionTime: 0.2,
                accuracy: 0.8,
                aggression: 0.7,
                teamwork: 0.8
            },
            hard: {
                reactionTime: 0.1,
                accuracy: 0.9,
                aggression: 0.9,
                teamwork: 0.9
            }
        };
        
        logger.info('AI Controller initialized', { difficulty });
    }

    update(deltaTime) {
        const currentTime = performance.now();
        if (currentTime - this.lastUpdate < this.updateInterval * 1000) {
            return;
        }
        this.lastUpdate = currentTime;

        // Update team state
        this.updateTeamState();

        // Update AI behavior for away team
        this.game.teams.away.players.forEach(player => {
            this.updatePlayerBehavior(player, deltaTime);
        });
    }

    updateTeamState() {
        const ballPos = this.game.ball.getPosition();
        const team = this.game.teams.away;
        
        // Update possession
        const nearestPlayer = this.findNearestPlayerToBall(team.players, ballPos);
        this.teamState.possession = nearestPlayer ? nearestPlayer.id : null;

        // Update tactic based on game state
        this.updateTactic();
    }

    updateTactic() {
        const currentTime = performance.now();
        if (currentTime - this.teamState.lastTacticChange < 30000) { // Change tactic every 30 seconds
            return;
        }

        const scoreDiff = this.game.state.score.away - this.game.state.score.home;
        const timeLeft = (10 * 60) - this.game.state.time; // 10 minutes per half

        if (scoreDiff < 0 && timeLeft < 300) { // Losing with less than 5 minutes left
            this.teamState.tactic = 'attacking';
        } else if (scoreDiff > 0 && timeLeft < 300) { // Winning with less than 5 minutes left
            this.teamState.tactic = 'defensive';
        } else {
            this.teamState.tactic = 'balanced';
        }

        this.teamState.lastTacticChange = currentTime;
        logger.info('Team tactic updated', { tactic: this.teamState.tactic });
    }

    findNearestPlayerToBall(players, ballPos) {
        let nearest = null;
        let minDistance = Infinity;

        players.forEach(player => {
            const distance = player.mesh.position.distanceTo(ballPos);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = player;
            }
        });

        return nearest;
    }

    updatePlayerBehavior(player, deltaTime) {
        try {
            const state = this.getBehaviorState(player);
            const ballPos = this.game.ball.getPosition();
            const playerPos = player.mesh.position;
            const difficulty = this.settings[this.difficulty];

            // Add reaction time delay based on difficulty
            if (Math.random() > difficulty.reactionTime) {
                return;
            }

            switch (player.role) {
                case 'attacker':
                    this.updateAttackerBehavior(player, state, ballPos, playerPos, difficulty);
                    break;
                case 'defender':
                    this.updateDefenderBehavior(player, state, ballPos, playerPos, difficulty);
                    break;
                case 'goalkeeper':
                    this.updateGoalkeeperBehavior(player, state, ballPos, playerPos, difficulty);
                    break;
            }

            // Update behavior state
            this.behaviorStates.set(player.id, state);
        } catch (error) {
            logger.error('AI behavior update failed', {
                playerId: player.id,
                role: player.role,
                error: error.message
            });
        }
    }

    updateAttackerBehavior(player, state, ballPos, playerPos, difficulty) {
        const distanceToBall = playerPos.distanceTo(ballPos);
        const isNearBall = distanceToBall < 5;
        const goalPos = new THREE.Vector3(0, 0, 15); // Away team's goal

        if (isNearBall) {
            // Check if we should pass based on teamwork and tactic
            if (this.teamState.tactic === 'attacking' && Math.random() < difficulty.teamwork) {
                const teammate = this.findBestPassTarget(player);
                if (teammate) {
                    player.passBall(this.game.ball, teammate);
                    state.currentAction = 'passing';
                    return;
                }
            }

            // Try to score if accuracy check passes
            if (Math.random() < difficulty.accuracy) {
                const direction = new THREE.Vector3()
                    .subVectors(goalPos, playerPos)
                    .normalize();
                
                player.setMovement(direction.x, direction.z);
                state.currentAction = 'shooting';
            } else {
                state.currentAction = 'dribbling';
            }
        } else {
            // Position based on tactic
            const targetPos = this.getTacticalPosition(player, state);
            const direction = new THREE.Vector3()
                .subVectors(targetPos, playerPos)
                .normalize();
            
            player.setMovement(direction.x, direction.z);
            state.currentAction = 'positioning';
        }

        logger.debug('Attacker AI update', {
            playerId: player.id,
            action: state.currentAction,
            distanceToBall,
            tactic: this.teamState.tactic
        });
    }

    updateDefenderBehavior(player, state, ballPos, playerPos, difficulty) {
        const distanceToBall = playerPos.distanceTo(ballPos);
        const isNearBall = distanceToBall < 8;

        if (isNearBall) {
            // Intercept based on aggression and accuracy
            if (Math.random() < difficulty.aggression * difficulty.accuracy) {
                const direction = new THREE.Vector3()
                    .subVectors(ballPos, playerPos)
                    .normalize();
                
                player.setMovement(direction.x, direction.z);
                state.currentAction = 'intercepting';
            } else {
                state.currentAction = 'marking';
            }
        } else {
            // Position based on tactic
            const targetPos = this.getTacticalPosition(player, state);
            const direction = new THREE.Vector3()
                .subVectors(targetPos, playerPos)
                .normalize();
            
            player.setMovement(direction.x, direction.z);
            state.currentAction = 'positioning';
        }

        logger.debug('Defender AI update', {
            playerId: player.id,
            action: state.currentAction,
            distanceToBall,
            tactic: this.teamState.tactic
        });
    }

    updateGoalkeeperBehavior(player, state, ballPos, playerPos, difficulty) {
        const distanceToBall = playerPos.distanceTo(ballPos);
        const isNearBall = distanceToBall < 10;

        if (isNearBall) {
            // Save attempt based on accuracy
            if (Math.random() < difficulty.accuracy) {
                const direction = new THREE.Vector3()
                    .subVectors(ballPos, playerPos)
                    .normalize();
                
                player.setMovement(direction.x, direction.z);
                state.currentAction = 'saving';
            } else {
                state.currentAction = 'positioning';
            }
        } else {
            // Return to goal position
            const targetPos = this.getTacticalPosition(player, state);
            const direction = new THREE.Vector3()
                .subVectors(targetPos, playerPos)
                .normalize();
            
            player.setMovement(direction.x, direction.z);
            state.currentAction = 'positioning';
        }

        logger.debug('Goalkeeper AI update', {
            playerId: player.id,
            action: state.currentAction,
            distanceToBall,
            tactic: this.teamState.tactic
        });
    }

    getTacticalPosition(player, state) {
        const baseOffset = state.formationOffset;
        const tacticMultiplier = this.teamState.tactic === 'attacking' ? 1.2 : 
                                this.teamState.tactic === 'defensive' ? 0.8 : 1.0;

        return new THREE.Vector3(
            baseOffset.x * tacticMultiplier,
            0,
            baseOffset.z * tacticMultiplier
        );
    }

    findBestPassTarget(player) {
        const team = this.game.teams.away;
        let bestTarget = null;
        let bestScore = -1;

        team.players.forEach(teammate => {
            if (teammate.id === player.id) return;

            const score = this.evaluatePassTarget(player, teammate);
            if (score > bestScore) {
                bestScore = score;
                bestTarget = teammate;
            }
        });

        return bestTarget;
    }

    evaluatePassTarget(from, to) {
        const ballPos = this.game.ball.getPosition();
        const toPos = to.mesh.position;
        const distance = ballPos.distanceTo(toPos);
        
        // Favor closer teammates
        let score = 1 / distance;

        // Favor teammates in better positions
        if (to.role === 'attacker') {
            score *= 1.5;
        }

        // Penalize if teammate is marked
        const nearestOpponent = this.findNearestPlayerToBall(
            this.game.teams.home.players,
            toPos
        );
        if (nearestOpponent && nearestOpponent.mesh.position.distanceTo(toPos) < 3) {
            score *= 0.5;
        }

        return score;
    }

    getBehaviorState(player) {
        if (!this.behaviorStates.has(player.id)) {
            this.behaviorStates.set(player.id, {
                targetPosition: null,
                currentAction: 'idle',
                lastActionTime: 0,
                formationOffset: this.getFormationOffset(player)
            });
        }
        return this.behaviorStates.get(player.id);
    }

    getFormationOffset(player) {
        const team = this.game.teams.away;
        const index = team.players.indexOf(player);
        const formation = {
            attacker: [
                { x: 5, z: -2 },
                { x: -5, z: -2 },
                { x: 0, z: -3 }
            ],
            defender: [
                { x: 3, z: 2 },
                { x: -3, z: 2 }
            ],
            goalkeeper: [
                { x: 0, z: 8 }
            ]
        };

        return formation[player.role][index % formation[player.role].length];
    }

    reset() {
        this.behaviorStates.clear();
        this.lastUpdate = 0;
        this.teamState = {
            possession: null,
            formation: '4-3-3',
            tactic: 'balanced',
            lastTacticChange: 0
        };
        logger.info('AI Controller reset');
    }
} 
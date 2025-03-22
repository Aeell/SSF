import * as THREE from 'three';
import logger from '../../utils/logger';

export class AIController {
    constructor(game) {
        this.game = game;
        this.updateInterval = 0.1; // 100ms between AI updates
        this.lastUpdate = 0;
        this.behaviorStates = new Map();
        
        logger.info('AI Controller initialized');
    }

    update(deltaTime) {
        const currentTime = performance.now();
        if (currentTime - this.lastUpdate < this.updateInterval * 1000) {
            return;
        }
        this.lastUpdate = currentTime;

        // Update AI behavior for away team
        this.game.teams.away.players.forEach(player => {
            this.updatePlayerBehavior(player, deltaTime);
        });
    }

    updatePlayerBehavior(player, deltaTime) {
        try {
            const state = this.getBehaviorState(player);
            const ballPos = this.game.ball.getPosition();
            const playerPos = player.mesh.position;

            switch (player.role) {
                case 'attacker':
                    this.updateAttackerBehavior(player, state, ballPos, playerPos);
                    break;
                case 'defender':
                    this.updateDefenderBehavior(player, state, ballPos, playerPos);
                    break;
                case 'goalkeeper':
                    this.updateGoalkeeperBehavior(player, state, ballPos, playerPos);
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

    updateAttackerBehavior(player, state, ballPos, playerPos) {
        const distanceToBall = playerPos.distanceTo(ballPos);
        const isNearBall = distanceToBall < 5;

        if (isNearBall) {
            // Chase ball and try to score
            const goalPos = new THREE.Vector3(0, 0, 15); // Away team's goal
            const direction = new THREE.Vector3()
                .subVectors(goalPos, playerPos)
                .normalize();
            
            player.setMovement(direction.x, direction.z);
            state.currentAction = 'chase_ball';
        } else {
            // Return to formation position
            const targetPos = new THREE.Vector3(
                state.formationOffset.x,
                0,
                state.formationOffset.z
            );
            const direction = new THREE.Vector3()
                .subVectors(targetPos, playerPos)
                .normalize();
            
            player.setMovement(direction.x, direction.z);
            state.currentAction = 'return_to_formation';
        }

        logger.debug('Attacker AI update', {
            playerId: player.id,
            action: state.currentAction,
            distanceToBall
        });
    }

    updateDefenderBehavior(player, state, ballPos, playerPos) {
        const distanceToBall = playerPos.distanceTo(ballPos);
        const isNearBall = distanceToBall < 8;

        if (isNearBall) {
            // Intercept ball
            const direction = new THREE.Vector3()
                .subVectors(ballPos, playerPos)
                .normalize();
            
            player.setMovement(direction.x, direction.z);
            state.currentAction = 'intercept';
        } else {
            // Guard area
            const targetPos = new THREE.Vector3(
                state.formationOffset.x,
                0,
                state.formationOffset.z
            );
            const direction = new THREE.Vector3()
                .subVectors(targetPos, playerPos)
                .normalize();
            
            player.setMovement(direction.x, direction.z);
            state.currentAction = 'guard_area';
        }

        logger.debug('Defender AI update', {
            playerId: player.id,
            action: state.currentAction,
            distanceToBall
        });
    }

    updateGoalkeeperBehavior(player, state, ballPos, playerPos) {
        const distanceToBall = playerPos.distanceTo(ballPos);
        const isNearBall = distanceToBall < 10;

        if (isNearBall) {
            // Move to intercept ball
            const direction = new THREE.Vector3()
                .subVectors(ballPos, playerPos)
                .normalize();
            
            player.setMovement(direction.x, direction.z);
            state.currentAction = 'save_attempt';
        } else {
            // Return to goal position
            const targetPos = new THREE.Vector3(
                state.formationOffset.x,
                0,
                state.formationOffset.z
            );
            const direction = new THREE.Vector3()
                .subVectors(targetPos, playerPos)
                .normalize();
            
            player.setMovement(direction.x, direction.z);
            state.currentAction = 'guard_goal';
        }

        logger.debug('Goalkeeper AI update', {
            playerId: player.id,
            action: state.currentAction,
            distanceToBall
        });
    }

    reset() {
        this.behaviorStates.clear();
        this.lastUpdate = 0;
        logger.info('AI Controller reset');
    }
} 
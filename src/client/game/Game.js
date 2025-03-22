import { Player } from './Player';
import { Ball } from './Ball';
import { Field } from './Field';
import { Team } from './Team';
import { AIController } from './ai/AIController';
import logger from '../utils/logger';

export class Game {
    constructor(scene, camera) {
        logger.info('Initializing new game instance');
        this.scene = scene;
        this.camera = camera;
        
        // Game state
        this.state = {
            isPlaying: false,
            score: { home: 0, away: 0 },
            time: 0,
            currentHalf: 1,
            isHalfTime: false
        };

        // Game objects
        this.field = new Field(scene);
        this.ball = new Ball(scene);
        this.teams = {
            home: new Team(scene, 'home'),
            away: new Team(scene, 'away')
        };

        // AI Controller
        this.aiController = new AIController(this);

        // Player control
        this.currentPlayer = null;
        this.controlledTeam = 'home';
        this.movementKeys = {
            w: false,
            a: false,
            s: false,
            d: false
        };

        // Initialize game
        this.init();
    }

    init() {
        logger.info('Setting up game components');
        // Setup field
        this.field.create();
        logger.debug('Field created');

        // Setup ball
        this.ball.create();
        logger.debug('Ball created');

        // Setup teams
        this.teams.home.create();
        this.teams.away.create();
        logger.debug('Teams created');

        // Setup event listeners
        this.setupEventListeners();
        logger.debug('Event listeners set up');

        // Start game loop
        this.lastTime = performance.now();
        logger.info('Game initialization complete');
    }

    setupEventListeners() {
        // Handle movement keys
        document.addEventListener('keydown', (event) => {
            const key = event.key.toLowerCase();
            if (this.movementKeys.hasOwnProperty(key)) {
                this.movementKeys[key] = true;
            }
        });

        document.addEventListener('keyup', (event) => {
            const key = event.key.toLowerCase();
            if (this.movementKeys.hasOwnProperty(key)) {
                this.movementKeys[key] = false;
            }
        });

        // Handle player switching
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Tab') {
                this.switchPlayer();
            }
        });

        // Handle passing
        document.addEventListener('keydown', (event) => {
            if (event.key === ' ' && this.currentPlayer) {
                this.passBall();
            }
        });

        // Handle ability activation
        document.addEventListener('keydown', (event) => {
            if (this.currentPlayer) {
                switch(event.key.toLowerCase()) {
                    case 'q':
                        this.currentPlayer.activateAbility(0);
                        break;
                    case 'e':
                        this.currentPlayer.activateAbility(1);
                        break;
                    case 'r':
                        this.currentPlayer.activateAbility(2);
                        break;
                }
            }
        });
    }

    update(deltaTime) {
        // Update game state
        if (this.state.isPlaying) {
            this.state.time += deltaTime;
            this.checkHalfTime();
            this.checkForGoal();
        }

        // Update movement
        if (this.currentPlayer) {
            const x = (this.movementKeys.d ? 1 : 0) - (this.movementKeys.a ? 1 : 0);
            const z = (this.movementKeys.s ? 1 : 0) - (this.movementKeys.w ? 1 : 0);
            this.currentPlayer.setMovement(x, z);
        }

        // Update game objects
        this.ball.update(deltaTime);
        
        // Update teams
        this.teams.home.update(deltaTime);
        this.teams.away.update(deltaTime);

        // Update AI
        this.aiController.update(deltaTime);

        // Update current player
        if (this.currentPlayer) {
            this.currentPlayer.update(deltaTime);
        }
    }

    passBall() {
        if (!this.currentPlayer) {
            logger.warn('Pass failed: No current player');
            return;
        }

        const team = this.teams[this.controlledTeam];
        const target = this.currentPlayer.findNearestTeammate(team.players);
        
        if (this.currentPlayer.passBall(this.ball, target)) {
            // Auto-switch to target player
            this.switchToPlayer(target);
        }
    }

    switchToPlayer(player) {
        if (!player) {
            logger.warn('Player switch failed: Invalid target player');
            return false;
        }

        // Unset current player
        if (this.currentPlayer) {
            this.currentPlayer.setControlled(false);
        }

        // Set new player
        this.currentPlayer = player;
        this.currentPlayer.setControlled(true);
        this.camera.target = this.currentPlayer.mesh.position;

        logger.info('Player switched', {
            from: this.currentPlayer?.id,
            to: player.id,
            team: this.controlledTeam
        });

        return true;
    }

    switchPlayer() {
        const team = this.teams[this.controlledTeam];
        const currentIndex = team.players.indexOf(this.currentPlayer);
        const nextIndex = (currentIndex + 1) % team.players.length;
        
        return this.switchToPlayer(team.players[nextIndex]);
    }

    checkHalfTime() {
        const halfDuration = 10 * 60; // 10 minutes in seconds
        if (this.state.time >= halfDuration && !this.state.isHalfTime) {
            this.state.isHalfTime = true;
            this.state.isPlaying = false;
            this.handleHalfTime();
        }
    }

    handleHalfTime() {
        if (this.state.currentHalf === 1) {
            this.state.currentHalf = 2;
            this.state.time = 0;
            this.state.isHalfTime = false;
            this.state.isPlaying = true;
            this.resetPositions();
        } else {
            this.endMatch();
        }
    }

    resetPositions() {
        // Reset ball position
        this.ball.reset();

        // Reset team positions
        this.teams.home.resetPositions();
        this.teams.away.resetPositions();

        // Reset AI controller
        this.aiController.reset();
    }

    endMatch() {
        logger.info('Ending match', { finalScore: this.state.score });
        this.state.isPlaying = false;
        // Handle match end (show results, etc.)
    }

    startMatch() {
        logger.info('Starting new match');
        this.state.isPlaying = true;
        this.state.time = 0;
        this.state.currentHalf = 1;
        this.state.score = { home: 0, away: 0 };
        this.resetPositions();
        logger.debug('Match started with reset positions');
    }

    checkForGoal() {
        const ballPos = this.ball.getPosition();
        const ballVelocity = this.ball.getVelocity();

        // Check home team's goal (z = -15)
        if (ballPos.z <= -15 && Math.abs(ballPos.x) < 5) {
            if (ballVelocity.z < 0) { // Ball is moving towards the goal
                this.scoreGoal('away');
            }
        }

        // Check away team's goal (z = 15)
        if (ballPos.z >= 15 && Math.abs(ballPos.x) < 5) {
            if (ballVelocity.z > 0) { // Ball is moving towards the goal
                this.scoreGoal('home');
            }
        }
    }

    scoreGoal(team) {
        this.state.score[team]++;
        logger.info(`Goal scored by ${team} team`, { 
            currentScore: this.state.score,
            time: this.state.time,
            half: this.state.currentHalf
        });

        // Add celebration effect
        this.handleGoalCelebration(team);

        // Reset positions after a short delay
        setTimeout(() => {
            this.resetPositions();
        }, 2000);
    }

    handleGoalCelebration(team) {
        // Pause game briefly
        this.state.isPlaying = false;

        // Visual feedback
        const goalText = document.createElement('div');
        goalText.className = 'goal-text';
        goalText.textContent = 'GOAL!';
        document.body.appendChild(goalText);

        // Remove after animation
        setTimeout(() => {
            goalText.remove();
        }, 2000);

        // Resume game
        setTimeout(() => {
            this.state.isPlaying = true;
        }, 2000);
    }
} 
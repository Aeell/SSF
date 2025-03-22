import { Player } from './Player';
import { Ball } from './Ball';
import { Field } from './Field';
import { Team } from './Team';
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

        // Player control
        this.currentPlayer = null;
        this.controlledTeam = 'home';

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
        // Handle player switching
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Tab') {
                this.switchPlayer();
            }
        });

        // Handle ability activation
        document.addEventListener('keydown', (event) => {
            if (this.currentPlayer) {
                switch(event.key) {
                    case '1':
                        this.currentPlayer.activateAbility(0);
                        break;
                    case '2':
                        this.currentPlayer.activateAbility(1);
                        break;
                    case '3':
                        this.currentPlayer.activateAbility(2);
                        break;
                }
            }
        });
    }

    switchPlayer() {
        const team = this.teams[this.controlledTeam];
        const currentIndex = team.players.indexOf(this.currentPlayer);
        const nextIndex = (currentIndex + 1) % team.players.length;
        
        this.currentPlayer = team.players[nextIndex];
        this.camera.target = this.currentPlayer.mesh.position;
        logger.debug(`Switched to player ${nextIndex + 1} on ${this.controlledTeam} team`);
    }

    update() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Update game state
        if (this.state.isPlaying) {
            this.state.time += deltaTime;
            this.checkHalfTime();
        }

        // Update game objects
        this.ball.update(deltaTime);
        
        // Update teams
        this.teams.home.update(deltaTime);
        this.teams.away.update(deltaTime);

        // Update current player
        if (this.currentPlayer) {
            this.currentPlayer.update(deltaTime);
        }
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

    scoreGoal(team) {
        this.state.score[team]++;
        logger.info(`Goal scored by ${team} team`, { currentScore: this.state.score });
        this.resetPositions();
    }
} 
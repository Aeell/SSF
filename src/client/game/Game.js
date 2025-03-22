import { Player } from './Player';
import { Ball } from './Ball';
import { Field } from './Field';
import { Team } from './Team';

export class Game {
    constructor(scene, camera) {
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
        // Setup field
        this.field.create();

        // Setup ball
        this.ball.create();

        // Setup teams
        this.teams.home.create();
        this.teams.away.create();

        // Setup event listeners
        this.setupEventListeners();

        // Start game loop
        this.lastTime = performance.now();
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
        this.state.isPlaying = false;
        // Handle match end (show results, etc.)
    }

    startMatch() {
        this.state.isPlaying = true;
        this.state.time = 0;
        this.state.currentHalf = 1;
        this.state.score = { home: 0, away: 0 };
        this.resetPositions();
    }

    scoreGoal(team) {
        this.state.score[team]++;
        this.resetPositions();
    }
} 
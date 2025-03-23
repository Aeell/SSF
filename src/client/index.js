import { 
    THREE,
    createRenderer,
    createCamera,
    createScene,
    handleResize
} from './utils/three';
import logger from './utils/logger';
import { exportAllLogs } from './utils/exportLogs';
import Game from './game/Game';
import NetworkManager from './network/NetworkManager';
import './styles/main.css';

class GameClient {
    constructor() {
        logger.info('Initializing game client...');
        this.initializeGame().catch(error => {
            logger.error('Failed to initialize game client:', error);
            this.handleInitializationError(error);
        });
    }

    async initializeGame() {
        try {
            // Initialize Three.js components
            this.renderer = createRenderer();
            this.camera = createCamera();
            this.scene = createScene();
            
            // Add renderer to DOM
            document.body.appendChild(this.renderer.domElement);
            
            // Initialize network manager
            this.networkManager = new NetworkManager();
            await this.networkManager.connect();
            logger.info('Network manager connected');

            // Initialize game
            this.game = new Game(this.scene, this.camera, this.networkManager);
            logger.info('Game initialized');

            // Setup resize handler
            window.addEventListener('resize', () => {
                handleResize(this.camera, this.renderer);
            });

            // Start game loop
            this.startGameLoop();
            
            // Hide loading screen
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }

            logger.info('Game client fully initialized');
        } catch (error) {
            logger.error('Failed to initialize game:', error);
            throw error;
        }
    }

    startGameLoop() {
        // Use requestAnimationFrame for the game loop
        const animate = () => {
            try {
                if (this.game) {
                    this.game.update();
                }
                
                this.renderer.render(this.scene, this.camera);
                requestAnimationFrame(animate);
            } catch (error) {
                logger.error('Animation loop error:', error);
                this.handleGameError(error);
            }
        };

        animate();
    }

    handleInitializationError(error) {
        // Show error to user
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div class="error-message">
                    <h2>Failed to load game</h2>
                    <p>Please refresh the page or contact support if the problem persists.</p>
                    <button onclick="location.reload()">Retry</button>
                    <button onclick="window.exportLogs()">Download Logs</button>
                </div>
            `;
        }

        // Export logs for debugging
        window.exportLogs = () => {
            exportAllLogs();
        };
    }

    handleGameError(error) {
        logger.error('Game error occurred:', error);
        
        // Create an error overlay
        const errorOverlay = document.createElement('div');
        errorOverlay.className = 'error-overlay';
        errorOverlay.innerHTML = `
            <div class="error-message">
                <h2>An error occurred</h2>
                <p>The game encountered an error. Please try refreshing the page.</p>
                <button onclick="location.reload()">Refresh</button>
                <button onclick="window.exportLogs()">Download Logs</button>
            </div>
        `;
        document.body.appendChild(errorOverlay);

        // Export logs for debugging
        window.exportLogs = () => {
            exportAllLogs();
        };
    }

    cleanup() {
        try {
            // Cleanup game
            if (this.game) {
                this.game.cleanup();
            }

            // Cleanup network
            if (this.networkManager) {
                this.networkManager.disconnect();
            }

            // Remove renderer
            if (this.renderer && this.renderer.domElement) {
                document.body.removeChild(this.renderer.domElement);
            }

            logger.info('Game client cleanup complete');
        } catch (error) {
            logger.error('Failed to cleanup game client:', error);
        }
    }
}

// Start the game when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.gameClient = new GameClient();
    } catch (error) {
        logger.error('Failed to create game client:', error);
        // Export logs in case of critical failure
        exportAllLogs();
    }
}); 
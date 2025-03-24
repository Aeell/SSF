export class InputManager {
    constructor(game) {
        this.game = game;
        
        // Input state
        this.keys = new Set();
        this.touchState = {
            joystick: { x: 0, y: 0 },
            kick: false,
            ability: false
        };
        
        // Bind event handlers
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        
        // Initialize input handlers
        this.initializeInputHandlers();
    }
    
    initializeInputHandlers() {
        // Keyboard input
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        
        // Mobile touch input
        const joystick = document.getElementById('joystick');
        const kickButton = document.getElementById('kick-button');
        const abilityButton = document.getElementById('ability-button');
        
        if (joystick) {
            joystick.addEventListener('touchstart', this.handleTouchStart);
            joystick.addEventListener('touchmove', this.handleTouchMove);
            joystick.addEventListener('touchend', this.handleTouchEnd);
        }
        
        if (kickButton) {
            kickButton.addEventListener('touchstart', () => {
                this.touchState.kick = true;
            });
            kickButton.addEventListener('touchend', () => {
                this.touchState.kick = false;
            });
        }
        
        if (abilityButton) {
            abilityButton.addEventListener('touchstart', () => {
                this.touchState.ability = true;
            });
            abilityButton.addEventListener('touchend', () => {
                this.touchState.ability = false;
            });
        }
    }
    
    handleKeyDown(event) {
        this.keys.add(event.key.toLowerCase());
    }
    
    handleKeyUp(event) {
        this.keys.delete(event.key.toLowerCase());
    }
    
    handleTouchStart(event) {
        event.preventDefault();
        const touch = event.touches[0];
        const rect = event.target.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        this.touchState.joystick = {
            x: (touch.clientX - centerX) / (rect.width / 2),
            y: (touch.clientY - centerY) / (rect.height / 2)
        };
    }
    
    handleTouchMove(event) {
        event.preventDefault();
        const touch = event.touches[0];
        const rect = event.target.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        this.touchState.joystick = {
            x: (touch.clientX - centerX) / (rect.width / 2),
            y: (touch.clientY - centerY) / (rect.height / 2)
        };
    }
    
    handleTouchEnd() {
        this.touchState.joystick = { x: 0, y: 0 };
    }
    
    update(deltaTime) {
        // Get the active player (for now, just use the first player)
        const player = this.game.players[0];
        if (!player) return;
        
        // Handle keyboard input
        if (this.keys.has('w') || this.keys.has('arrowup')) {
            player.moveForward();
        } else {
            player.stopMovingForward();
        }
        
        if (this.keys.has('s') || this.keys.has('arrowdown')) {
            player.moveBackward();
        } else {
            player.stopMovingBackward();
        }
        
        if (this.keys.has('a') || this.keys.has('arrowleft')) {
            player.moveLeft();
        } else {
            player.stopMovingLeft();
        }
        
        if (this.keys.has('d') || this.keys.has('arrowright')) {
            player.moveRight();
        } else {
            player.stopMovingRight();
        }
        
        // Handle mobile touch input
        if (Math.abs(this.touchState.joystick.x) > 0.1 || Math.abs(this.touchState.joystick.y) > 0.1) {
            // Convert joystick input to movement direction
            const angle = Math.atan2(this.touchState.joystick.x, this.touchState.joystick.y);
            player.movementDirection.set(
                Math.sin(angle),
                0,
                Math.cos(angle)
            );
            player.isMoving = true;
        } else {
            player.isMoving = false;
        }
        
        // Handle kick and ability inputs
        if (this.touchState.kick || this.keys.has(' ')) {
            player.kick(this.game.ball);
        }
        
        if (this.touchState.ability || this.keys.has('shift')) {
            player.useAbility('Speed Boost');
        }
    }
    
    cleanup() {
        // Remove event listeners
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        
        const joystick = document.getElementById('joystick');
        if (joystick) {
            joystick.removeEventListener('touchstart', this.handleTouchStart);
            joystick.removeEventListener('touchmove', this.handleTouchMove);
            joystick.removeEventListener('touchend', this.handleTouchEnd);
        }
    }
} 
import io from 'socket.io-client';

export class NetworkManager {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.connected = false;
        this.playerId = null;
        this.roomId = null;
        
        // Network state
        this.state = {
            isHost: false,
            players: new Map(),
            latency: 0
        };
        
        // Initialize network
        this.init();
    }

    init() {
        // Connect to server
        this.socket = io('http://localhost:3000');
        
        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.socket.on('connect', () => {
            this.connected = true;
            console.log('Connected to server');
        });

        this.socket.on('disconnect', () => {
            this.connected = false;
            console.log('Disconnected from server');
        });

        this.socket.on('playerId', (id) => {
            this.playerId = id;
            console.log('Received player ID:', id);
        });

        this.socket.on('roomId', (id) => {
            this.roomId = id;
            console.log('Received room ID:', id);
        });

        this.socket.on('playerJoined', (playerData) => {
            this.handlePlayerJoined(playerData);
        });

        this.socket.on('playerLeft', (playerId) => {
            this.handlePlayerLeft(playerId);
        });

        this.socket.on('gameState', (state) => {
            this.handleGameState(state);
        });

        this.socket.on('playerUpdate', (update) => {
            this.handlePlayerUpdate(update);
        });

        this.socket.on('ballUpdate', (update) => {
            this.handleBallUpdate(update);
        });

        this.socket.on('goal', (data) => {
            this.handleGoal(data);
        });
    }

    createRoom() {
        if (this.connected) {
            this.socket.emit('createRoom');
            this.state.isHost = true;
        }
    }

    joinRoom(roomId) {
        if (this.connected) {
            this.socket.emit('joinRoom', roomId);
            this.state.isHost = false;
        }
    }

    leaveRoom() {
        if (this.connected && this.roomId) {
            this.socket.emit('leaveRoom', this.roomId);
            this.roomId = null;
            this.state.isHost = false;
        }
    }

    sendPlayerUpdate(update) {
        if (this.connected && this.roomId) {
            this.socket.emit('playerUpdate', {
                roomId: this.roomId,
                playerId: this.playerId,
                ...update
            });
        }
    }

    sendBallUpdate(update) {
        if (this.connected && this.roomId) {
            this.socket.emit('ballUpdate', {
                roomId: this.roomId,
                ...update
            });
        }
    }

    handlePlayerJoined(playerData) {
        this.state.players.set(playerData.id, playerData);
        console.log('Player joined:', playerData);
    }

    handlePlayerLeft(playerId) {
        this.state.players.delete(playerId);
        console.log('Player left:', playerId);
    }

    handleGameState(state) {
        // Update game state from server
        this.game.state = state;
        console.log('Received game state:', state);
    }

    handlePlayerUpdate(update) {
        const player = this.state.players.get(update.playerId);
        if (player) {
            // Update player position and state
            player.position.copy(update.position);
            player.state = update.state;
            console.log('Received player update:', update);
        }
    }

    handleBallUpdate(update) {
        // Update ball position and state
        this.game.ball.mesh.position.copy(update.position);
        this.game.ball.state = update.state;
        console.log('Received ball update:', update);
    }

    handleGoal(data) {
        // Handle goal scored
        this.game.scoreGoal(data.team);
        console.log('Goal scored:', data);
    }

    startGame() {
        if (this.connected && this.roomId && this.state.isHost) {
            this.socket.emit('startGame', this.roomId);
        }
    }

    endGame() {
        if (this.connected && this.roomId) {
            this.socket.emit('endGame', this.roomId);
        }
    }

    getLatency() {
        return this.state.latency;
    }

    isConnected() {
        return this.connected;
    }

    isHost() {
        return this.state.isHost;
    }

    getPlayerCount() {
        return this.state.players.size;
    }

    getPlayers() {
        return Array.from(this.state.players.values());
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.connected = false;
            this.playerId = null;
            this.roomId = null;
            this.state.players.clear();
        }
    }
} 
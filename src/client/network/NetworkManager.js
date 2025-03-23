import { io } from 'socket.io-client';
import { logger } from '../utils/logger.js';

export class NetworkManager {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.reconnecting = false;
        this.connectionAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.baseReconnectDelay = 1000;
        this.maxReconnectDelay = 5000;
        this.events = new Map();
        this.pendingMessages = [];
        this.lastLatency = 0;
        this.latencyCheckInterval = null;
        this.serverUrl = 'http://localhost:3001';
        this.connectionTimeout = 10000;
        this.healthCheckInterval = null;
        this.lastPingTime = 0;
    }

    async connect() {
        try {
            if (this.socket) {
                logger.warn('[Network] Closing existing socket before reconnecting');
                await this.disconnect();
            }

            logger.info('[Network] Connecting to server:', this.serverUrl);
            
            // Try to check server health before connecting
            const isServerHealthy = await this.checkServerHealth();
            if (!isServerHealthy) {
                throw new Error('Server health check failed');
            }

            this.socket = io(this.serverUrl, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: this.baseReconnectDelay,
                reconnectionDelayMax: this.maxReconnectDelay,
                timeout: this.connectionTimeout,
                autoConnect: false
            });

            this.setupSocketHandlers();
            
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    if (!this.connected) {
                        this.socket.close();
                        reject(new Error('Connection timeout'));
                    }
                }, this.connectionTimeout);

                this.socket.once('connect', () => {
                    clearTimeout(timeout);
                    this.connected = true;
                    this.connectionAttempts = 0;
                    this.startHealthChecks();
                    logger.info('[Network] Connected to server');
                    resolve();
                });

                this.socket.connect();
            });
        } catch (error) {
            logger.error('[Network] Connection error:', {
                error: error.message,
                attempts: this.connectionAttempts,
                serverUrl: this.serverUrl
            });
            throw error;
        }
    }

    async checkServerHealth() {
        try {
            const response = await fetch(`${this.serverUrl}/api/health`);
            if (!response.ok) {
                logger.warn('[Network] Server health check failed with status:', response.status);
                return false;
            }
            const data = await response.json();
            logger.info('[Network] Server health check successful:', data);
            return true;
        } catch (error) {
            logger.warn('[Network] Server health check failed:', error.message);
            return false;
        }
    }

    startHealthChecks() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        this.healthCheckInterval = setInterval(async () => {
            try {
                if (!this.connected) return;
                
                const startTime = performance.now();
                this.socket.emit('ping');
                this.lastPingTime = startTime;
                
                // Set a timeout to detect if pong is not received
                setTimeout(() => {
                    if (this.lastPingTime === startTime) {
                        logger.warn('[Network] Pong not received, connection may be unstable');
                        this.handleConnectionIssue();
                    }
                }, 5000);
            } catch (error) {
                logger.error('[Network] Health check error:', error);
            }
        }, 10000);
    }

    handleConnectionIssue() {
        if (!this.reconnecting && this.connectionAttempts < this.maxReconnectAttempts) {
            this.reconnecting = true;
            this.connectionAttempts++;
            
            const delay = Math.min(
                this.baseReconnectDelay * Math.pow(2, this.connectionAttempts - 1),
                this.maxReconnectDelay
            );

            logger.info('[Network] Attempting reconnection in', delay, 'ms');
            
            setTimeout(async () => {
                try {
                    await this.connect();
                    this.reconnecting = false;
                } catch (error) {
                    logger.error('[Network] Reconnection failed:', error);
                    this.reconnecting = false;
                }
            }, delay);
        } else if (this.connectionAttempts >= this.maxReconnectAttempts) {
            logger.error('[Network] Max reconnection attempts reached');
            this.disconnect();
        }
    }

    setupSocketHandlers() {
        if (!this.socket) return;

        this.socket.on('connect_error', (error) => {
            logger.error('[Network] Connection error:', error);
            this.handleConnectionIssue();
        });

        this.socket.on('disconnect', (reason) => {
            logger.warn('[Network] Disconnected:', reason);
            this.connected = false;
            if (reason === 'io server disconnect') {
                this.connect();
            }
        });

        this.socket.on('connection:established', (data) => {
            logger.info('[Network] Connection established:', data);
            this.connected = true;
            this.processPendingMessages();
        });

        this.socket.on('server:error', (error) => {
            logger.error('[Network] Server error:', error);
            this.emit('error', error);
        });

        this.socket.on('game:error', (error) => {
            logger.error('[Network] Game error:', error);
            this.emit('error', error);
        });

        this.socket.on('game:joined', (data) => {
            logger.info('[Network] Successfully joined game:', data);
            this.emit('gameJoined', data);
        });

        this.socket.on('player:joined', (data) => {
            logger.info('[Network] Player joined:', data);
            this.emit('playerJoined', data);
        });

        this.socket.on('player:left', (data) => {
            logger.info('[Network] Player left:', data);
            this.emit('playerLeft', data);
        });

        this.socket.on('game:state', (state) => {
            this.emit('gameState', state);
        });

        this.socket.on('pong', (data) => {
            if (this.lastPingTime) {
                this.lastLatency = performance.now() - this.lastPingTime;
                this.lastPingTime = 0;
                logger.debug('[Network] Latency:', this.lastLatency + 'ms');
            }
        });

        // Restore any additional event handlers
        this.events.forEach((handler, event) => {
            if (!event.startsWith('game:') && !event.startsWith('player:')) {
                this.socket.on(event, handler);
            }
        });
    }

    disconnect() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }

        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }

        this.connected = false;
        this.reconnecting = false;
        logger.info('[Network] Disconnected from server');
    }

    getLatency() {
        return this.lastLatency;
    }

    emit(event, data) {
        if (this.events.has(event)) {
            this.events.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    logger.error('[Network] Error in event handler:', { event, error });
                }
            });
        }
    }

    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        this.events.get(event).add(callback);
    }

    off(event, callback) {
        if (this.events.has(event)) {
            this.events.get(event).delete(callback);
        }
    }

    send(event, data) {
        if (!this.connected || !this.socket) {
            this.pendingMessages.push({ event, data });
            return;
        }
        this.socket.emit(event, data);
    }

    processPendingMessages() {
        while (this.pendingMessages.length > 0 && this.connected) {
            const { event, data } = this.pendingMessages.shift();
            this.send(event, data);
        }
    }

    isConnected() {
        return this.connected && !!this.socket;
    }

    isReconnecting() {
        return this.reconnecting;
    }
} 
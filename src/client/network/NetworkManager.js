import { io } from 'socket.io-client';
import logger from '../utils/logger';

export default class NetworkManager {
    constructor() {
        this.socket = null;
        this.eventHandlers = new Map();
        logger.info('NetworkManager initialized');
    }

    async connect() {
        try {
            this.socket = io('http://localhost:3001', {
                transports: ['websocket'],
                upgrade: false,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            return new Promise((resolve, reject) => {
                this.socket.on('connect', () => {
                    logger.info('Socket connected successfully', { id: this.socket.id });
                    resolve();
                });

                this.socket.on('connect_error', (error) => {
                    logger.error('Socket connection error:', error);
                    reject(error);
                });

                this.socket.on('disconnect', (reason) => {
                    logger.warn('Socket disconnected:', reason);
                });
            });
        } catch (error) {
            logger.error('Failed to initialize socket connection:', error);
            throw error;
        }
    }

    on(event, handler) {
        try {
            if (!this.socket) {
                throw new Error('Socket not initialized');
            }
            this.socket.on(event, handler);
            this.eventHandlers.set(event, handler);
            logger.debug('Event handler registered:', event);
        } catch (error) {
            logger.error('Failed to register event handler:', error);
        }
    }

    emit(event, data) {
        try {
            if (!this.socket) {
                throw new Error('Socket not initialized');
            }
            this.socket.emit(event, data);
            logger.debug('Event emitted:', event, data);
        } catch (error) {
            logger.error('Failed to emit event:', error);
        }
    }

    disconnect() {
        try {
            if (this.socket) {
                this.socket.disconnect();
                this.eventHandlers.clear();
                logger.info('Socket disconnected');
            }
        } catch (error) {
            logger.error('Failed to disconnect socket:', error);
        }
    }

    // Export logs for debugging
    exportLogs() {
        return {
            connectionState: this.socket?.connected,
            socketId: this.socket?.id,
            registeredEvents: Array.from(this.eventHandlers.keys()),
            logs: logger.getLogs().filter(log => log.message.includes('[NetworkManager]'))
        };
    }
} 
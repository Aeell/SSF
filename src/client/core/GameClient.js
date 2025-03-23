import { Client } from 'colyseus.js';
import { EventBus } from './EventBus.js';
import { logger } from '../utils/logger.js';

export class GameClient {
    constructor() {
        this.client = new Client('ws://localhost:3001');
        this.room = null;
        this.eventBus = new EventBus();
        this.setupEventListeners();
    }

    async connect() {
        try {
            this.room = await this.client.joinOrCreate('betting');
            logger.info('Connected to betting room');
            this.setupRoomListeners();
        } catch (error) {
            logger.error('Failed to connect to server:', error);
            throw error;
        }
    }

    setupEventListeners() {
        this.client.onOpen(() => {
            logger.info('Connected to server');
            this.eventBus.emit('connection:established');
        });

        this.client.onClose(() => {
            logger.info('Disconnected from server');
            this.eventBus.emit('connection:closed');
        });

        this.client.onError((error) => {
            logger.error('Connection error:', error);
            this.eventBus.emit('connection:error', error);
        });
    }

    setupRoomListeners() {
        this.room.onStateChange((state) => {
            this.eventBus.emit('state:changed', state);
        });

        this.room.onMessage('currencyUpdate', (data) => {
            this.eventBus.emit('currency:updated', data);
        });

        this.room.onMessage('matchUpdate', (data) => {
            this.eventBus.emit('match:updated', data);
        });

        this.room.onMessage('betError', (data) => {
            this.eventBus.emit('bet:error', data);
        });
    }

    async placeBet(teamId, amount) {
        if (!this.room) {
            throw new Error('Not connected to a room');
        }

        try {
            await this.room.send({
                type: 'placeBet',
                data: { teamId, amount }
            });
        } catch (error) {
            logger.error('Failed to place bet:', error);
            throw error;
        }
    }

    getBalance() {
        return this.room?.state?.currencies?.get(this.room.sessionId)?.balance || 0;
    }

    getMatchState() {
        return this.room?.state?.match || null;
    }

    disconnect() {
        if (this.room) {
            this.room.leave();
            this.room = null;
        }
        this.client.close();
    }
} 
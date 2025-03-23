import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { GameClient } from '../src/client/core/GameClient.js';
import { AIMatch } from '../src/server/ai/AIMatch.js';
import { Currency } from '../src/server/models/Currency.js';
import { BettingRoom } from '../src/server/rooms/BettingRoom.js';

describe('Game Functionality Tests', () => {
    let gameClient;
    let bettingRoom;

    beforeEach(() => {
        gameClient = new GameClient();
        bettingRoom = new BettingRoom();
    });

    afterEach(() => {
        gameClient.disconnect();
    });

    test('Client can connect to server', async () => {
        await gameClient.connect();
        expect(gameClient.room).toBeTruthy();
    });

    test('Client receives initial state', async () => {
        await gameClient.connect();
        const matchState = gameClient.getMatchState();
        const balance = gameClient.getBalance();

        expect(matchState).toBeTruthy();
        expect(balance).toBeGreaterThanOrEqual(0);
    });

    test('Client can place bet', async () => {
        await gameClient.connect();
        const initialBalance = gameClient.getBalance();
        const betAmount = 100;

        await gameClient.placeBet(1, betAmount);
        const newBalance = gameClient.getBalance();

        expect(newBalance).toBe(initialBalance - betAmount);
    });

    test('Client receives match updates', async () => {
        await gameClient.connect();
        const matchState = gameClient.getMatchState();
        
        // Wait for a match update
        await new Promise(resolve => setTimeout(resolve, 1000));
        const updatedState = gameClient.getMatchState();

        expect(updatedState).toBeTruthy();
        expect(updatedState.time).toBeGreaterThan(matchState.time);
    });

    test('Client handles disconnection gracefully', async () => {
        await gameClient.connect();
        gameClient.disconnect();
        
        expect(gameClient.room).toBeNull();
        expect(() => gameClient.placeBet(1, 100)).toThrow('Not connected to a room');
    });

    test('Betting room manages multiple clients', async () => {
        const client1 = new GameClient();
        const client2 = new GameClient();

        await client1.connect();
        await client2.connect();

        const balance1 = client1.getBalance();
        const balance2 = client2.getBalance();

        expect(balance1).toBeGreaterThan(0);
        expect(balance2).toBeGreaterThan(0);

        client1.disconnect();
        client2.disconnect();
    });

    test('AI Match simulation works correctly', () => {
        const match = new AIMatch();
        const initialState = match.getMatchState();

        match.update(1);
        const updatedState = match.getMatchState();

        expect(updatedState.time).toBeGreaterThan(initialState.time);
        expect(updatedState.score).toBeDefined();
    });

    test('Currency transactions are tracked', () => {
        const currency = new Currency();
        const initialBalance = currency.balance;

        currency.addTransaction(100, 'bet', 'Test bet');
        expect(currency.balance).toBe(initialBalance - 100);

        currency.addTransaction(200, 'win', 'Test win');
        expect(currency.balance).toBe(initialBalance + 100);
    });
}); 
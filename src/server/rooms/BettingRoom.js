import pkg from 'colyseus';
const { Room, Client } = pkg;
import { AIMatch } from '../ai/AIMatch.js';
import { Currency } from '../models/Currency.js';
import { ProtectionUtils } from '../config/protection.js';
import { PROTECTION_CONFIG } from '../config/protection.js';

export class BettingRoom extends Room {
    onCreate(options) {
        this.match = new AIMatch();
        this.currencies = new Map();
        this.betCooldowns = new Map();
        
        // Set up match state updates
        this.setSimulationInterval(() => {
            this.match.update(1);
            this.broadcast('matchUpdate', this.match.getMatchState());
        }, 1000);
    }

    onJoin(client, options) {
        // Initialize currency for new client
        if (!this.currencies.has(client.sessionId)) {
            this.currencies.set(client.sessionId, new Currency());
        }

        // Send initial state
        client.send('currencyUpdate', {
            balance: this.currencies.get(client.sessionId).balance
        });
        client.send('matchUpdate', this.match.getMatchState());
    }

    onLeave(client) {
        // Clean up client data
        this.currencies.delete(client.sessionId);
        this.betCooldowns.delete(client.sessionId);
    }

    onMessage(client, message) {
        if (message.type === 'placeBet') {
            this.handleBet(client, message.data);
        }
    }

    handleBet(client, betData) {
        // Validate bet
        if (!this.validateBet(client, betData)) {
            client.send('betError', { message: 'Invalid bet' });
            return;
        }

        // Check cooldown
        if (this.isOnCooldown(client)) {
            client.send('betError', { 
                message: `Please wait ${PROTECTION_CONFIG.BETTING.COOLDOWN_BETWEEN_BETS / 1000} seconds between bets` 
            });
            return;
        }

        // Process bet
        const currency = this.currencies.get(client.sessionId);
        const betAmount = betData.amount;

        // Deduct bet amount
        currency.balance -= betAmount;
        currency.transactions.push(new Transaction(
            -betAmount,
            'bet',
            `Bet on Team ${betData.teamNumber}`
        ));

        // Place bet in match
        this.match.placeBet(client.sessionId, betAmount, betData.teamNumber);

        // Set cooldown
        this.setBetCooldown(client);

        // Send updates
        client.send('currencyUpdate', { balance: currency.balance });
        this.broadcast('matchUpdate', this.match.getMatchState());
    }

    validateBet(client, betData) {
        const currency = this.currencies.get(client.sessionId);
        if (!currency) return false;

        // Check bet amount
        if (betData.amount < PROTECTION_CONFIG.BETTING.MIN_BET ||
            betData.amount > PROTECTION_CONFIG.BETTING.MAX_BET) {
            return false;
        }

        // Check balance
        if (currency.balance < betData.amount) {
            return false;
        }

        // Check team number
        if (betData.teamNumber !== 1 && betData.teamNumber !== 2) {
            return false;
        }

        // Check match status
        if (this.match.status !== 'pending') {
            return false;
        }

        return true;
    }

    isOnCooldown(client) {
        const lastBet = this.betCooldowns.get(client.sessionId);
        if (!lastBet) return false;

        const now = Date.now();
        return now - lastBet < PROTECTION_CONFIG.BETTING.COOLDOWN_BETWEEN_BETS;
    }

    setBetCooldown(client) {
        this.betCooldowns.set(client.sessionId, Date.now());
    }

    onDispose() {
        // Clean up resources
        this.match = null;
        this.currencies.clear();
        this.betCooldowns.clear();
    }
} 
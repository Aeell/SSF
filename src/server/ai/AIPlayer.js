import { Schema, type } from '@colyseus/schema';
import { ProtectionUtils } from '../config/protection.js';

export class AIPlayer extends Schema {
    constructor(config) {
        super();
        this.id = ProtectionUtils.generateSecureToken();
        this.name = config.name;
        this.abilities = this.generateAbilities();
        this.stats = this.generateStats();
        this.strategy = this.generateStrategy();
        this.lastUpdate = Date.now();
    }

    generateAbilities() {
        const availableAbilities = ['SpeedBoost', 'PowerShot', 'Shield', 'Teleport'];
        const numAbilities = Math.floor(Math.random() * 3) + 1; // 1-3 abilities
        const abilities = [];
        
        for (let i = 0; i < numAbilities; i++) {
            const abilityIndex = Math.floor(Math.random() * availableAbilities.length);
            abilities.push(availableAbilities[abilityIndex]);
        }
        
        return ProtectionUtils.encryptData(abilities);
    }

    generateStats() {
        const stats = {
            speed: Math.random() * 10 + 5,
            power: Math.random() * 10 + 5,
            defense: Math.random() * 10 + 5,
            stamina: Math.random() * 10 + 5
        };
        return ProtectionUtils.encryptData(stats);
    }

    generateStrategy() {
        const strategies = ['aggressive', 'balanced', 'defensive'];
        return strategies[Math.floor(Math.random() * strategies.length)];
    }

    update(deltaTime) {
        const currentTime = Date.now();
        if (currentTime - this.lastUpdate >= 1000) { // Update every second
            this.lastUpdate = currentTime;
            this.updateBehavior();
        }
    }

    updateBehavior() {
        // Protected AI behavior logic
        const behavior = {
            action: this.determineAction(),
            target: this.determineTarget(),
            priority: this.calculatePriority()
        };
        return ProtectionUtils.encryptData(behavior);
    }

    determineAction() {
        const actions = ['move', 'shoot', 'pass', 'useAbility'];
        return actions[Math.floor(Math.random() * actions.length)];
    }

    determineTarget() {
        return {
            x: Math.random() * 100,
            y: Math.random() * 100
        };
    }

    calculatePriority() {
        return Math.random();
    }

    getDecryptedAbilities() {
        return ProtectionUtils.decryptData(this.abilities);
    }

    getDecryptedStats() {
        return ProtectionUtils.decryptData(this.stats);
    }
}

type('string')(AIPlayer.prototype, 'id');
type('string')(AIPlayer.prototype, 'name');
type('object')(AIPlayer.prototype, 'abilities');
type('object')(AIPlayer.prototype, 'stats');
type('string')(AIPlayer.prototype, 'strategy');
type('number')(AIPlayer.prototype, 'lastUpdate'); 
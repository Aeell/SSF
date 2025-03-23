import { Ability } from './Ability';

export class SpeedBoost extends Ability {
    constructor() {
        super('speedBoost', 30, 5, 0); // 30s cooldown, 5s duration
        this.speedMultiplier = 2.0;
    }

    applyEffect(player) {
        this.originalSpeed = player.speed;
        player.speed *= this.speedMultiplier;
        // Add visual effect
        player.mesh.material.emissive.set(0x00ff00);
    }

    removeEffect(player) {
        player.speed = this.originalSpeed;
        // Remove visual effect
        player.mesh.material.emissive.set(0x000000);
    }
} 
import { Ability } from './Ability';

export class PowerShot extends Ability {
    constructor() {
        super('powerShot', 15, 0, 0); // 15s cooldown, instant effect
        this.powerMultiplier = 2.5;
    }

    applyEffect(player) {
        this.originalPower = player.shotPower;
        player.shotPower *= this.powerMultiplier;
        // Add visual effect
        player.mesh.material.emissive.set(0xff0000);
    }

    removeEffect(player) {
        player.shotPower = this.originalPower;
        // Remove visual effect
        player.mesh.material.emissive.set(0x000000);
    }
} 
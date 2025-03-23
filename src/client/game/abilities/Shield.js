import { Ability } from './Ability';

export class Shield extends Ability {
    constructor() {
        super('shield', 45, 8, 0); // 45s cooldown, 8s duration
        this.shieldStrength = 0.5; // 50% damage reduction
    }

    applyEffect(player) {
        this.originalCollisionFilter = player.body.collisionFilter;
        // Modify collision filter to ignore collisions with other players
        player.body.collisionFilter = 0x0002;
        // Add visual effect
        player.mesh.material.emissive.set(0x0000ff);
    }

    removeEffect(player) {
        player.body.collisionFilter = this.originalCollisionFilter;
        // Remove visual effect
        player.mesh.material.emissive.set(0x000000);
    }
} 
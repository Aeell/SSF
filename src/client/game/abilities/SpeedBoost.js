import { Ability } from './Ability';

export class SpeedBoost extends Ability {
    constructor(player) {
        super(player, {
            name: 'Speed Boost',
            description: 'Temporarily increases movement speed',
            cooldown: 10, // 10 seconds cooldown
            duration: 5  // 5 seconds duration
        });
        
        this.speedMultiplier = 1.5; // 50% speed increase
        this.originalSpeed = player.moveSpeed;
    }
    
    applyEffects() {
        this.player.moveSpeed *= this.speedMultiplier;
        
        // Add visual effect (e.g., trail or glow)
        this.player.mesh.material.emissive.setHex(0x00ff00);
        this.player.mesh.material.emissiveIntensity = 0.5;
    }
    
    removeEffects() {
        this.player.moveSpeed = this.originalSpeed;
        
        // Remove visual effect
        this.player.mesh.material.emissive.setHex(0x000000);
        this.player.mesh.material.emissiveIntensity = 0;
    }
} 
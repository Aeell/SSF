import { Ability } from './Ability';

export class Teleport extends Ability {
    constructor() {
        super('teleport', 20, 0, 0); // 20s cooldown, instant effect
        this.teleportDistance = 10; // Maximum teleport distance
    }

    applyEffect(player) {
        // Calculate teleport position (in front of player)
        const direction = new THREE.Vector3();
        player.mesh.getWorldDirection(direction);
        const teleportPosition = player.mesh.position.clone().add(
            direction.multiplyScalar(this.teleportDistance)
        );

        // Update physics body position
        player.body.position.copy(teleportPosition);
        player.mesh.position.copy(teleportPosition);

        // Add visual effect
        this.createTeleportEffect(player.mesh.position);
    }

    removeEffect(player) {
        // No cleanup needed for instant effect
    }

    createTeleportEffect(position) {
        // Create particle effect
        const particles = new THREE.Points(
            new THREE.BufferGeometry(),
            new THREE.PointsMaterial({
                color: 0xffff00,
                size: 0.1,
                transparent: true,
                opacity: 0.6
            })
        );

        // Add particles to scene
        player.scene.add(particles);

        // Animate and remove particles
        setTimeout(() => {
            player.scene.remove(particles);
        }, 1000);
    }
} 
import { Ability } from './Ability';

export class Shield extends Ability {
    constructor(player) {
        super(player, {
            name: 'Shield',
            description: 'Creates a protective barrier around the player',
            cooldown: 20, // 20 seconds cooldown
            duration: 8  // 8 seconds duration
        });
        
        this.shieldRadius = 1.5;
        this.shieldStrength = 0.8; // 80% damage reduction
        this.originalMass = player.physicsBody.mass;
    }
    
    applyEffects() {
        // Create shield mesh
        const shieldGeometry = new THREE.SphereGeometry(this.shieldRadius, 32, 32);
        const shieldMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        
        this.shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
        this.shieldMesh.position.copy(this.player.mesh.position);
        this.player.scene.add(this.shieldMesh);
        
        // Modify physics properties
        this.player.physicsBody.mass *= 0.5; // Reduce mass to make collisions less impactful
        
        // Add visual effect to player
        this.player.mesh.material.emissive.setHex(0x00ffff);
        this.player.mesh.material.emissiveIntensity = 0.3;
    }
    
    removeEffects() {
        // Remove shield mesh
        if (this.shieldMesh) {
            this.player.scene.remove(this.shieldMesh);
            this.shieldMesh.geometry.dispose();
            this.shieldMesh.material.dispose();
            this.shieldMesh = null;
        }
        
        // Restore physics properties
        this.player.physicsBody.mass = this.originalMass;
        
        // Remove player visual effect
        this.player.mesh.material.emissive.setHex(0x000000);
        this.player.mesh.material.emissiveIntensity = 0;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        if (this.isActive && this.shieldMesh) {
            // Update shield position to follow player
            this.shieldMesh.position.copy(this.player.mesh.position);
            
            // Animate shield
            const pulseScale = 1 + Math.sin(Date.now() * 0.005) * 0.1;
            this.shieldMesh.scale.set(pulseScale, pulseScale, pulseScale);
            
            // Rotate shield
            this.shieldMesh.rotation.y += deltaTime * 0.5;
        }
    }
    
    handleCollision(otherBody) {
        if (!this.isActive) return;
        
        // Apply reduced impact force
        const relativeVelocity = otherBody.velocity.clone().sub(this.player.physicsBody.velocity);
        const impactForce = relativeVelocity.multiplyScalar(this.shieldStrength);
        
        this.player.physicsBody.applyImpulse(impactForce, new THREE.Vector3());
    }
} 
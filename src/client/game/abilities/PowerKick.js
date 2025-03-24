import { Ability } from './Ability';

export class PowerKick extends Ability {
    constructor(player) {
        super(player, {
            name: 'Power Kick',
            description: 'Increases kick power for the next shot',
            cooldown: 15, // 15 seconds cooldown
            duration: 3  // 3 seconds duration
        });
        
        this.powerMultiplier = 2.0; // Double kick power
        this.originalKickPower = player.kickPower;
    }
    
    applyEffects() {
        this.player.kickPower *= this.powerMultiplier;
        
        // Add visual effect
        this.player.mesh.material.emissive.setHex(0xff0000);
        this.player.mesh.material.emissiveIntensity = 0.5;
        
        // Add particle effect for power charging
        this.createPowerEffect();
    }
    
    removeEffects() {
        this.player.kickPower = this.originalKickPower;
        
        // Remove visual effect
        this.player.mesh.material.emissive.setHex(0x000000);
        this.player.mesh.material.emissiveIntensity = 0;
        
        // Remove particle effect
        this.removePowerEffect();
    }
    
    createPowerEffect() {
        // Create a particle system for the power charging effect
        const particleCount = 20;
        const particles = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            particles[i3] = (Math.random() - 0.5) * 2;     // x
            particles[i3 + 1] = Math.random() * 2;         // y
            particles[i3 + 2] = (Math.random() - 0.5) * 2; // z
            
            colors[i3] = 1;     // r
            colors[i3 + 1] = 0; // g
            colors[i3 + 2] = 0; // b
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(particles, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        this.powerEffect = new THREE.Points(geometry, material);
        this.powerEffect.position.copy(this.player.mesh.position);
        this.player.scene.add(this.powerEffect);
    }
    
    removePowerEffect() {
        if (this.powerEffect) {
            this.player.scene.remove(this.powerEffect);
            this.powerEffect.geometry.dispose();
            this.powerEffect.material.dispose();
            this.powerEffect = null;
        }
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        if (this.isActive && this.powerEffect) {
            // Rotate particles around the player
            this.powerEffect.rotation.y += deltaTime * 2;
            
            // Pulse the particles
            const scale = 1 + Math.sin(Date.now() * 0.01) * 0.2;
            this.powerEffect.scale.set(scale, scale, scale);
        }
    }
} 
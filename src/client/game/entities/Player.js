import * as THREE from 'three';
import { Ability } from '../abilities/Ability.js';

export class Player {
    constructor(scene, physics, model, options = {}) {
        this.scene = scene;
        this.physics = physics;
        this.model = model;
        this.options = options;
        
        // Movement properties
        this.moveSpeed = 5;
        this.rotationSpeed = 10;
        this.currentSpeed = 0;
        this.direction = new THREE.Vector3();
        
        // Ability properties
        this.abilities = [];
        this.abilityCooldowns = new Map();
        this.initializeAbilities();
        
        // Create 3D object
        this.mesh = this.createMesh();
        
        // Create physics body
        this.body = this.physics.createPlayerBody(options.position);
        
        // Movement state
        this.isMoving = false;
        this.movementDirection = new THREE.Vector3();
        
        // Initialize position and rotation
        this.updatePosition();
        this.updateRotation();
    }
    
    createMesh() {
        const mesh = this.model.scene.clone();
        mesh.scale.set(1, 1, 1);
        mesh.position.copy(this.options.position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        return mesh;
    }
    
    initializeAbilities() {
        // Add default abilities
        this.addAbility(new Ability({
            name: 'Speed Boost',
            cooldown: 10,
            duration: 3,
            effect: () => {
                this.moveSpeed *= 1.5;
                setTimeout(() => {
                    this.moveSpeed /= 1.5;
                }, 3000);
            }
        }));
        
        this.addAbility(new Ability({
            name: 'Power Shot',
            cooldown: 15,
            duration: 1,
            effect: () => {
                // Implement power shot effect
            }
        }));
    }
    
    addAbility(ability) {
        this.abilities.push(ability);
        this.abilityCooldowns.set(ability.name, 0);
    }
    
    update(deltaTime) {
        // Update movement
        if (this.isMoving) {
            this.move(deltaTime);
        }
        
        // Update ability cooldowns
        this.updateAbilityCooldowns(deltaTime);
        
        // Update visual position
        this.updatePosition();
        
        // Update visual rotation
        this.updateRotation();
    }
    
    move(deltaTime) {
        // Calculate movement
        const movement = this.movementDirection.clone()
            .multiplyScalar(this.moveSpeed * deltaTime);
        
        // Apply movement to physics body
        this.body.position.x += movement.x;
        this.body.position.z += movement.z;
    }
    
    moveForward() {
        this.isMoving = true;
        this.movementDirection.set(0, 0, -1);
    }
    
    moveBackward() {
        this.isMoving = true;
        this.movementDirection.set(0, 0, 1);
    }
    
    moveLeft() {
        this.isMoving = true;
        this.movementDirection.set(-1, 0, 0);
    }
    
    moveRight() {
        this.isMoving = true;
        this.movementDirection.set(1, 0, 0);
    }
    
    stopMovingForward() {
        if (this.movementDirection.z === -1) {
            this.isMoving = false;
        }
    }
    
    stopMovingBackward() {
        if (this.movementDirection.z === 1) {
            this.isMoving = false;
        }
    }
    
    stopMovingLeft() {
        if (this.movementDirection.x === -1) {
            this.isMoving = false;
        }
    }
    
    stopMovingRight() {
        if (this.movementDirection.x === 1) {
            this.isMoving = false;
        }
    }
    
    kick(ball) {
        // Calculate kick direction
        const kickDirection = new THREE.Vector3();
        kickDirection.subVectors(ball.mesh.position, this.mesh.position).normalize();
        
        // Apply kick force
        const kickForce = new THREE.Vector3(
            kickDirection.x * 10,
            0.5, // Add some upward force
            kickDirection.z * 10
        );
        
        this.physics.applyImpulse(ball.body, kickForce);
    }
    
    useAbility(abilityName) {
        const ability = this.abilities.find(a => a.name === abilityName);
        if (ability && this.abilityCooldowns.get(abilityName) <= 0) {
            ability.activate();
            this.abilityCooldowns.set(abilityName, ability.cooldown);
        }
    }
    
    updateAbilityCooldowns(deltaTime) {
        for (const [abilityName, cooldown] of this.abilityCooldowns.entries()) {
            if (cooldown > 0) {
                this.abilityCooldowns.set(abilityName, cooldown - deltaTime);
            }
        }
    }
    
    getAbilityCooldown(abilityName) {
        return this.abilityCooldowns.get(abilityName) || 0;
    }
    
    updatePosition() {
        this.mesh.position.copy(this.body.position);
    }
    
    updateRotation() {
        if (this.isMoving) {
            const targetRotation = Math.atan2(
                this.movementDirection.x,
                this.movementDirection.z
            );
            this.mesh.rotation.y = targetRotation;
        }
    }
    
    getPosition() {
        return this.mesh.position;
    }
    
    cleanup() {
        // Remove mesh from scene
        this.scene.remove(this.mesh);
        
        // Remove physics body
        this.physics.world.removeBody(this.body);
    }
} 
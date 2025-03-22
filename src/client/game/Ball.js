import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Ball {
    constructor(scene) {
        this.scene = scene;
        
        // Ball properties
        this.radius = 0.5;
        this.mass = 1;
        this.friction = 0.3;
        this.restitution = 0.7;
        
        // Ball state
        this.state = {
            isMoving: false,
            isCharged: false,
            chargeLevel: 0,
            lastTouchedBy: null
        };
        
        // Physics
        this.body = null;
        
        // Visual
        this.mesh = null;
        
        // Create ball
        this.create();
    }

    create() {
        // Create visual mesh
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            roughness: 0.5,
            metalness: 0.5
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);

        // Create physics body
        const shape = new CANNON.Sphere(this.radius);
        this.body = new CANNON.Body({
            mass: this.mass,
            material: new CANNON.Material({
                friction: this.friction,
                restitution: this.restitution
            })
        });
        this.body.addShape(shape);
    }

    update(deltaTime) {
        // Update visual position from physics
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);

        // Check if ball is moving
        const velocity = this.body.velocity;
        this.state.isMoving = velocity.length() > 0.1;

        // Update charge effects if ball is charged
        if (this.state.isCharged) {
            this.updateChargeEffects();
        }
    }

    updateChargeEffects() {
        // Add visual effects based on charge level
        const intensity = this.state.chargeLevel;
        this.mesh.material.emissive.setHex(0xff0000);
        this.mesh.material.emissiveIntensity = intensity;
    }

    applyForce(force, point) {
        this.body.applyForce(force, point);
    }

    kick(direction, power, player) {
        const force = new CANNON.Vec3(
            direction.x * power,
            direction.y * power,
            direction.z * power
        );
        this.body.applyForce(force, this.body.position);
        this.state.lastTouchedBy = player;
    }

    charge(amount) {
        this.state.chargeLevel = Math.min(1, this.state.chargeLevel + amount);
        if (this.state.chargeLevel >= 1) {
            this.state.isCharged = true;
        }
    }

    discharge() {
        this.state.isCharged = false;
        this.state.chargeLevel = 0;
        this.mesh.material.emissiveIntensity = 0;
    }

    reset() {
        // Reset position
        this.body.position.set(0, this.radius, 0);
        this.body.velocity.set(0, 0, 0);
        this.body.angularVelocity.set(0, 0, 0);
        
        // Reset state
        this.state.isMoving = false;
        this.state.isCharged = false;
        this.state.chargeLevel = 0;
        this.state.lastTouchedBy = null;
        
        // Reset visual effects
        this.mesh.material.emissiveIntensity = 0;
    }

    getPosition() {
        return this.mesh.position;
    }

    getVelocity() {
        return this.body.velocity;
    }

    isMoving() {
        return this.state.isMoving;
    }

    isCharged() {
        return this.state.isCharged;
    }

    getChargeLevel() {
        return this.state.chargeLevel;
    }

    getLastTouchedBy() {
        return this.state.lastTouchedBy;
    }
} 
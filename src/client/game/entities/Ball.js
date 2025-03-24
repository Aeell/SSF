import * as THREE from 'three';

export class Ball {
    constructor(scene, physics, model) {
        this.scene = scene;
        this.physics = physics;
        this.model = model;
        
        // Create 3D object
        this.mesh = this.createMesh();
        
        // Create physics body
        this.body = this.physics.createBallBody(this.mesh.position);
        
        // Ball properties
        this.radius = 0.2;
        this.maxSpeed = 20;
        this.drag = 0.99;
    }
    
    createMesh() {
        const mesh = this.model.scene.clone();
        mesh.scale.set(1, 1, 1);
        mesh.position.set(0, 0.2, 0); // Start slightly above ground
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        return mesh;
    }
    
    update(deltaTime) {
        // Update visual position
        this.mesh.position.copy(this.body.position);
        
        // Update visual rotation based on physics body rotation
        this.mesh.quaternion.copy(this.body.quaternion);
        
        // Apply drag to slow down the ball
        this.body.velocity.x *= this.drag;
        this.body.velocity.z *= this.drag;
        
        // Limit maximum speed
        const speed = Math.sqrt(
            this.body.velocity.x * this.body.velocity.x +
            this.body.velocity.z * this.body.velocity.z
        );
        
        if (speed > this.maxSpeed) {
            const factor = this.maxSpeed / speed;
            this.body.velocity.x *= factor;
            this.body.velocity.z *= factor;
        }
    }
    
    reset() {
        // Reset position
        this.mesh.position.set(0, 0.2, 0);
        this.body.position.set(0, 0.2, 0);
        
        // Reset velocity
        this.body.velocity.set(0, 0, 0);
        this.body.angularVelocity.set(0, 0, 0);
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
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import logger from '../utils/logger';

export class Ball {
    constructor(scene) {
        this.scene = scene;
        this.radius = 0.3;
        this.mass = 1;
        this.restitution = 0.8;
        this.friction = 0.3;
        this.linearDamping = 0.3;
        this.angularDamping = 0.3;
        
        // Create ball mesh and physics body
        this.create();
        
        logger.debug('Ball created', {
            radius: this.radius,
            mass: this.mass,
            restitution: this.restitution
        });
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
        this.body = new CANNON.Body({
            mass: this.mass,
            shape: new CANNON.Sphere(this.radius),
            material: new CANNON.Material({
                friction: this.friction,
                restitution: this.restitution,
                linearDamping: this.linearDamping,
                angularDamping: this.angularDamping
            })
        });
    }

    update(deltaTime) {
        // Update visual position from physics
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
    }

    kick(direction, power) {
        if (!direction || !power) {
            logger.warn('Ball kick failed: Invalid parameters', {
                direction: direction ? 'valid' : 'invalid',
                power: power || 0
            });
            return false;
        }

        try {
            // Convert direction to force
            const force = new CANNON.Vec3(
                direction.x * power,
                direction.y * power,
                direction.z * power
            );

            // Apply force at the ball's center
            this.body.applyForce(force, this.body.position);

            logger.info('Ball kicked', {
                direction: {
                    x: direction.x,
                    y: direction.y,
                    z: direction.z
                },
                power: power
            });

            return true;
        } catch (error) {
            logger.error('Ball kick failed: Physics error', {
                error: error.message,
                direction: {
                    x: direction.x,
                    y: direction.y,
                    z: direction.z
                },
                power: power
            });
            return false;
        }
    }

    reset() {
        try {
            // Reset physics body
            this.body.position.set(0, this.radius, 0);
            this.body.velocity.set(0, 0, 0);
            this.body.angularVelocity.set(0, 0, 0);

            // Reset visual mesh
            this.mesh.position.copy(this.body.position);
            this.mesh.quaternion.copy(this.body.quaternion);

            logger.debug('Ball reset to center');
            return true;
        } catch (error) {
            logger.error('Ball reset failed', {
                error: error.message
            });
            return false;
        }
    }

    getPosition() {
        return this.mesh.position.clone();
    }

    getVelocity() {
        return new THREE.Vector3(
            this.body.velocity.x,
            this.body.velocity.y,
            this.body.velocity.z
        );
    }
} 
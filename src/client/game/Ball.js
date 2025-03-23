import { THREE } from '../utils/three.js';
import * as CANNON from 'cannon-es';
import { logger } from '../utils/logger.js';

export default class Ball {
    constructor(scene, world) {
        try {
            if (!scene || !(scene instanceof THREE.Scene)) {
                throw new Error('Ball requires valid THREE.Scene');
            }
            if (!world || !(world instanceof CANNON.World)) {
                throw new Error('Ball requires valid CANNON.World');
            }

            this.scene = scene;
            this.world = world;

            // Ball properties
            this.radius = 0.5;
            this.mass = 1;

            // Create Three.js mesh
            this.createVisualBall();

            // Create Cannon.js body
            this.createPhysicsBall();

            logger.debug('Ball created successfully', {
                properties: {
                    radius: this.radius,
                    mass: this.mass
                },
                components: {
                    mesh: !!this.mesh,
                    body: !!this.body
                }
            });
        } catch (error) {
            logger.error('Failed to create ball:', {
                error: error.message,
                stack: error.stack,
                details: {
                    hasScene: !!scene,
                    hasWorld: !!world,
                    sceneType: scene ? scene.constructor.name : 'undefined',
                    worldType: world ? world.constructor.name : 'undefined'
                }
            });
            error.component = 'Ball';
            throw error;
        }
    }

    createVisualBall() {
        try {
            const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
            const material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.4,
                metalness: 0.6,
                envMapIntensity: 0.8
            });
            
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.castShadow = true;
            this.mesh.receiveShadow = true;
            this.scene.add(this.mesh);
            
            logger.debug('Visual ball created', {
                geometry: {
                    radius: this.radius,
                    segments: 32
                },
                material: {
                    type: material.type,
                    color: material.color.getHex()
                }
            });
        } catch (error) {
            logger.error('Failed to create visual ball:', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    createPhysicsBall() {
        try {
            const shape = new CANNON.Sphere(this.radius);
            
            // Create a new ball material
            const ballMaterial = new CANNON.Material('ball');
            
            this.body = new CANNON.Body({
                mass: this.mass,
                shape: shape,
                position: new CANNON.Vec3(0, this.radius, 0),
                material: ballMaterial,
                linearDamping: 0.1,
                angularDamping: 0.1
            });

            // Add body to physics world
            this.world.addBody(this.body);
            
            logger.debug('Physics ball created', {
                body: {
                    mass: this.body.mass,
                    position: this.body.position,
                    material: ballMaterial.name
                }
            });
        } catch (error) {
            logger.error('Failed to create physics ball:', {
                error: error.message,
                stack: error.stack,
                details: {
                    hasWorld: !!this.world,
                    hasBody: !!this.body
                }
            });
            throw error;
        }
    }

    update() {
        try {
            if (!this.mesh || !this.body) {
                throw new Error('Ball not properly initialized');
            }
            
            // Update mesh position to match physics body
            this.mesh.position.copy(this.body.position);
            this.mesh.quaternion.copy(this.body.quaternion);
        } catch (error) {
            logger.error('Failed to update ball:', {
                error: error.message,
                stack: error.stack,
                details: {
                    hasMesh: !!this.mesh,
                    hasBody: !!this.body,
                    position: this.body ? this.body.position : null
                }
            });
            throw error;
        }
    }

    setPosition(position) {
        try {
            if (!this.body) {
                throw new Error('Physics body not initialized');
            }
            
            if (position instanceof THREE.Vector3) {
                this.body.position.copy(position);
            } else if (Array.isArray(position)) {
                this.body.position.set(position[0], position[1], position[2]);
            } else {
                throw new Error('Invalid position format');
            }
            
            // Wake up the body
            this.body.wakeUp();
            
            logger.debug('Ball position set', {
                position: this.body.position
            });
        } catch (error) {
            logger.error('Failed to set ball position:', {
                error: error.message,
                stack: error.stack,
                position
            });
            throw error;
        }
    }

    setVelocity(velocity) {
        try {
            if (!this.body) {
                throw new Error('Physics body not initialized');
            }
            
            if (velocity instanceof THREE.Vector3) {
                this.body.velocity.copy(velocity);
            } else if (Array.isArray(velocity)) {
                this.body.velocity.set(velocity[0], velocity[1], velocity[2]);
            } else {
                throw new Error('Invalid velocity format');
            }
            
            // Wake up the body
            this.body.wakeUp();
            
            logger.debug('Ball velocity set', {
                velocity: this.body.velocity
            });
        } catch (error) {
            logger.error('Failed to set ball velocity:', {
                error: error.message,
                stack: error.stack,
                velocity
            });
            throw error;
        }
    }

    cleanup() {
        try {
            // Remove from physics world
            if (this.body && this.world) {
                this.world.removeBody(this.body);
            }
            
            // Remove from scene
            if (this.mesh && this.scene) {
                this.scene.remove(this.mesh);
                this.mesh.geometry.dispose();
                this.mesh.material.dispose();
            }
            
            logger.debug('Ball cleanup complete');
        } catch (error) {
            logger.error('Failed to cleanup ball:', {
                error: error.message,
                stack: error.stack,
                details: {
                    hasBody: !!this.body,
                    hasMesh: !!this.mesh,
                    hasWorld: !!this.world,
                    hasScene: !!this.scene
                }
            });
        }
    }
} 
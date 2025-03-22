import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Ability } from './abilities/Ability';
import logger from '../utils/logger';

export class Player {
    constructor(scene, role, position, team) {
        this.scene = scene;
        this.role = role;
        this.position = position;
        this.team = team;
        this.isControlled = false;
        this.speed = 5;
        this.movement = new THREE.Vector3();
        this.abilities = this.initializeAbilities();
        this.stamina = 100;
        this.staminaRegenRate = 5;
        this.staminaDrainRate = 10;
        
        // Physics body
        this.body = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            shape: new CANNON.Sphere(0.5)
        });
        
        // Create player mesh
        this.create();
        
        logger.debug('Player created', { 
            role, 
            position, 
            team,
            abilities: this.abilities.map(a => a.name)
        });
    }

    create() {
        const geometry = new THREE.SphereGeometry(0.5, 32, 32);
        const material = new THREE.MeshStandardMaterial({ 
            color: this.team === 'home' ? 0x0000ff : 0xff0000,
            roughness: 0.5,
            metalness: 0.5
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
    }

    initializeAbilities() {
        const abilities = [];
        switch(this.role) {
            case 'attacker':
                abilities.push(
                    new Ability('Jiggle', 10000, 0.75), // 10s cooldown, 75% dodge
                    new Ability('Speed Boost', 15000, 0.5),
                    new Ability('Super Shot', 30000, 0.25)
                );
                break;
            case 'defender':
                abilities.push(
                    new Ability('Shield', 15000, 0.6),
                    new Ability('Tackle', 20000, 0.4),
                    new Ability('Wall', 25000, 0.3)
                );
                break;
            case 'goalkeeper':
                abilities.push(
                    new Ability('Save', 10000, 0.8),
                    new Ability('Energy Wall', 20000, 0.5),
                    new Ability('Super Save', 30000, 0.2)
                );
                break;
        }
        return abilities;
    }

    update(deltaTime) {
        // Update position from physics
        this.mesh.position.copy(this.body.position);
        
        // Update abilities
        this.abilities.forEach(ability => ability.update(deltaTime));
        
        // Regenerate stamina
        if (this.stamina < 100) {
            this.stamina = Math.min(100, this.stamina + this.staminaRegenRate * deltaTime);
        }
        
        // Update movement if controlled
        if (this.isControlled) {
            this.updateMovement();
        }
    }

    updateMovement() {
        if (this.movement.length() > 0) {
            // Apply movement force
            const force = new CANNON.Vec3(
                this.movement.x * this.speed,
                0,
                this.movement.z * this.speed
            );
            this.body.applyForce(force, this.body.position);
            
            // Drain stamina
            this.stamina = Math.max(0, this.stamina - this.staminaDrainRate * 0.016);
            
            // Reset movement vector
            this.movement.set(0, 0, 0);
        }
    }

    setMovement(x, z) {
        this.movement.set(x, 0, z);
    }

    findNearestTeammate(players) {
        let nearest = null;
        let minDistance = Infinity;
        
        players.forEach(player => {
            if (player !== this && player.team === this.team) {
                const distance = this.mesh.position.distanceTo(player.mesh.position);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = player;
                }
            }
        });
        
        return nearest;
    }

    passBall(ball, target) {
        if (!target) {
            logger.warn('Pass failed: No valid target found', {
                playerId: this.id,
                team: this.team
            });
            return false;
        }

        const direction = new THREE.Vector3()
            .subVectors(target.mesh.position, this.mesh.position)
            .normalize();
            
        const power = 5;
        const success = ball.kick(direction, power);
        
        if (success) {
            logger.info('Pass successful', {
                from: this.id,
                to: target.id,
                team: this.team,
                distance: this.mesh.position.distanceTo(target.mesh.position)
            });
            return true;
        } else {
            logger.warn('Pass failed: Ball kick failed', {
                from: this.id,
                to: target.id,
                team: this.team
            });
            return false;
        }
    }

    activateAbility(index) {
        if (index < 0 || index >= this.abilities.length) {
            logger.warn('Ability activation failed: Invalid index', {
                playerId: this.id,
                index,
                availableAbilities: this.abilities.length
            });
            return false;
        }

        const ability = this.abilities[index];
        if (ability.isReady() && this.stamina >= ability.staminaCost) {
            const success = ability.activate();
            if (success) {
                this.stamina -= ability.staminaCost;
                logger.info('Ability activated', {
                    playerId: this.id,
                    ability: ability.name,
                    remainingStamina: this.stamina
                });
                return true;
            }
        }

        logger.warn('Ability activation failed', {
            playerId: this.id,
            ability: ability.name,
            isReady: ability.isReady(),
            stamina: this.stamina,
            requiredStamina: ability.staminaCost
        });
        return false;
    }

    setControlled(controlled) {
        this.isControlled = controlled;
        logger.debug('Player control changed', {
            playerId: this.id,
            isControlled: controlled,
            role: this.role
        });
    }
} 
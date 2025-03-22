import * as THREE from 'three';
import { Ability } from './abilities/Ability';

export class Player {
    constructor(scene, team, role, position) {
        this.scene = scene;
        this.team = team;
        this.role = role;
        this.position = position;
        
        // Player state
        this.state = {
            hasBall: false,
            isMoving: false,
            isDribbling: false,
            stamina: 100,
            cooldowns: {},
            charges: {}
        };

        // Player mesh and physics
        this.mesh = null;
        this.body = null;
        
        // Movement
        this.velocity = new THREE.Vector3();
        this.moveSpeed = 5;
        this.dribbleSpeed = 3;
        this.sprintSpeed = 8;
        
        // Abilities
        this.abilities = this.initializeAbilities();
        
        // Create player
        this.create();
    }

    create() {
        // Create player mesh (temporary geometry)
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
        const material = new THREE.MeshStandardMaterial({ 
            color: this.team === 'home' ? 0x0000ff : 0xff0000 
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);

        // Add name label
        this.nameLabel = this.createNameLabel();
        this.mesh.add(this.nameLabel);

        // Initialize abilities
        this.initializeAbilities();
    }

    createNameLabel() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;

        context.fillStyle = 'white';
        context.font = 'bold 32px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(this.role, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(2, 0.5, 1);
        sprite.position.y = 2.5;

        return sprite;
    }

    initializeAbilities() {
        const abilities = [];
        
        switch(this.role) {
            case 'attacker':
                abilities.push(
                    new Ability('Jiggle', 10, 0, this.jiggle.bind(this)),
                    new Ability('Power Shot', 20, 6, this.powerShot.bind(this)),
                    new Ability('Meteor Strike', 0, 10, this.meteorStrike.bind(this))
                );
                break;
            case 'defender':
                abilities.push(
                    new Ability('Shield', 15, 0, this.shield.bind(this)),
                    new Ability('Hook', 12, 0, this.hook.bind(this)),
                    new Ability('Tackle', 8, 0, this.tackle.bind(this))
                );
                break;
            case 'goalkeeper':
                abilities.push(
                    new Ability('Energy Wall', 15, 0, this.energyWall.bind(this)),
                    new Ability('Super Save', 20, 0, this.superSave.bind(this)),
                    new Ability('Clear', 10, 0, this.clear.bind(this))
                );
                break;
        }

        return abilities;
    }

    update(deltaTime) {
        // Update movement
        this.updateMovement(deltaTime);
        
        // Update abilities
        this.updateAbilities(deltaTime);
        
        // Update stamina
        this.updateStamina(deltaTime);
    }

    updateMovement(deltaTime) {
        if (this.state.isMoving) {
            const speed = this.state.isDribbling ? this.dribbleSpeed : this.moveSpeed;
            this.mesh.position.add(this.velocity.multiplyScalar(speed * deltaTime));
        }
    }

    updateAbilities(deltaTime) {
        this.abilities.forEach(ability => {
            ability.update(deltaTime);
        });
    }

    updateStamina(deltaTime) {
        if (this.state.isMoving) {
            this.state.stamina = Math.max(0, this.state.stamina - deltaTime * 10);
        } else {
            this.state.stamina = Math.min(100, this.state.stamina + deltaTime * 5);
        }
    }

    move(direction) {
        this.velocity.copy(direction);
        this.state.isMoving = true;
    }

    stop() {
        this.velocity.set(0, 0, 0);
        this.state.isMoving = false;
    }

    activateAbility(index) {
        if (index >= 0 && index < this.abilities.length) {
            const ability = this.abilities[index];
            if (ability.canActivate()) {
                ability.activate();
            }
        }
    }

    // Ability implementations
    jiggle() {
        // 75% chance to dodge
        if (Math.random() < 0.75) {
            // Implement dodge logic
        }
    }

    powerShot() {
        if (this.state.hasBall) {
            // Implement power shot logic
        }
    }

    meteorStrike() {
        // Implement meteor strike logic
    }

    shield() {
        // Implement shield logic
    }

    hook() {
        // Implement hook logic
    }

    tackle() {
        // Implement tackle logic
    }

    energyWall() {
        // Implement energy wall logic
    }

    superSave() {
        // Implement super save logic
    }

    clear() {
        // Implement clear logic
    }

    receiveBall() {
        this.state.hasBall = true;
    }

    loseBall() {
        this.state.hasBall = false;
        this.state.isDribbling = false;
    }

    reset() {
        this.mesh.position.copy(this.position);
        this.velocity.set(0, 0, 0);
        this.state.hasBall = false;
        this.state.isMoving = false;
        this.state.isDribbling = false;
        this.state.stamina = 100;
        
        // Reset ability cooldowns and charges
        this.abilities.forEach(ability => {
            ability.reset();
        });
    }
} 
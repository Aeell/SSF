import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Field {
    constructor(scene) {
        this.scene = scene;
        
        // Field dimensions
        this.width = 50;
        this.length = 30;
        this.height = 0.5;
        
        // Field elements
        this.ground = null;
        this.boundaries = [];
        this.goals = [];
        
        // Physics world
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0)
        });
        
        // Create field
        this.create();
    }

    create() {
        // Create ground
        this.createGround();
        
        // Create boundaries
        this.createBoundaries();
        
        // Create goals
        this.createGoals();
        
        // Create field markings
        this.createMarkings();
    }

    createGround() {
        // Visual ground
        const geometry = new THREE.PlaneGeometry(this.width, this.length);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x2e8b57, // Forest green
            roughness: 0.8,
            metalness: 0.2
        });
        this.ground = new THREE.Mesh(geometry, material);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);

        // Physics ground
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({
            type: CANNON.Body.STATIC,
            material: new CANNON.Material()
        });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.world.addBody(groundBody);
    }

    createBoundaries() {
        const wallHeight = 2;
        const wallThickness = 0.5;
        
        // Create walls
        const walls = [
            { position: [0, wallHeight/2, this.length/2], rotation: [0, 0, 0] }, // North
            { position: [0, wallHeight/2, -this.length/2], rotation: [0, Math.PI, 0] }, // South
            { position: [this.width/2, wallHeight/2, 0], rotation: [0, Math.PI/2, 0] }, // East
            { position: [-this.width/2, wallHeight/2, 0], rotation: [0, -Math.PI/2, 0] } // West
        ];

        walls.forEach(wall => {
            // Visual wall
            const geometry = new THREE.BoxGeometry(
                wall.position[0] === 0 ? this.width : wallThickness,
                wallHeight,
                wall.position[2] === 0 ? this.length : wallThickness
            );
            const material = new THREE.MeshStandardMaterial({ 
                color: 0xffffff,
                roughness: 0.7
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(...wall.position);
            mesh.rotation.set(...wall.rotation);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            this.boundaries.push(mesh);

            // Physics wall
            const shape = new CANNON.Box(new CANNON.Vec3(
                wall.position[0] === 0 ? this.width/2 : wallThickness/2,
                wallHeight/2,
                wall.position[2] === 0 ? this.length/2 : wallThickness/2
            ));
            const body = new CANNON.Body({
                type: CANNON.Body.STATIC,
                material: new CANNON.Material()
            });
            body.addShape(shape);
            body.position.set(...wall.position);
            body.quaternion.setFromEuler(...wall.rotation);
            this.world.addBody(body);
        });
    }

    createGoals() {
        const goalWidth = 8;
        const goalHeight = 3;
        const goalDepth = 1;
        
        // Create goals
        const goals = [
            { position: [0, goalHeight/2, this.length/2 + goalDepth/2], rotation: [0, 0, 0] }, // North
            { position: [0, goalHeight/2, -this.length/2 - goalDepth/2], rotation: [0, Math.PI, 0] } // South
        ];

        goals.forEach(goal => {
            // Visual goal
            const geometry = new THREE.BoxGeometry(goalWidth, goalHeight, goalDepth);
            const material = new THREE.MeshStandardMaterial({ 
                color: 0xffffff,
                roughness: 0.5,
                metalness: 0.5
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(...goal.position);
            mesh.rotation.set(...goal.rotation);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            this.goals.push(mesh);

            // Physics goal
            const shape = new CANNON.Box(new CANNON.Vec3(
                goalWidth/2,
                goalHeight/2,
                goalDepth/2
            ));
            const body = new CANNON.Body({
                type: CANNON.Body.STATIC,
                material: new CANNON.Material()
            });
            body.addShape(shape);
            body.position.set(...goal.position);
            body.quaternion.setFromEuler(...goal.rotation);
            this.world.addBody(body);
        });
    }

    createMarkings() {
        // Center circle
        const centerCircle = new THREE.RingGeometry(3, 3.2, 32);
        const centerMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            side: THREE.DoubleSide
        });
        const centerMesh = new THREE.Mesh(centerCircle, centerMaterial);
        centerMesh.rotation.x = -Math.PI / 2;
        centerMesh.position.y = 0.01; // Slightly above ground
        this.scene.add(centerMesh);

        // Center line
        const centerLine = new THREE.PlaneGeometry(0.2, this.length);
        const centerLineMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            side: THREE.DoubleSide
        });
        const centerLineMesh = new THREE.Mesh(centerLine, centerLineMaterial);
        centerLineMesh.rotation.x = -Math.PI / 2;
        centerLineMesh.position.y = 0.01;
        this.scene.add(centerLineMesh);

        // Penalty areas
        const penaltyAreaWidth = 16;
        const penaltyAreaLength = 8;
        const penaltyAreas = [
            { position: [0, 0.01, this.length/2 - penaltyAreaLength/2] }, // North
            { position: [0, 0.01, -this.length/2 + penaltyAreaLength/2] } // South
        ];

        penaltyAreas.forEach(area => {
            const geometry = new THREE.PlaneGeometry(penaltyAreaWidth, penaltyAreaLength);
            const material = new THREE.MeshStandardMaterial({ 
                color: 0xffffff,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.2
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.set(...area.position);
            this.scene.add(mesh);
        });
    }

    update(deltaTime) {
        this.world.step(1/60);
    }

    getWorld() {
        return this.world;
    }

    getWidth() {
        return this.width;
    }

    getLength() {
        return this.length;
    }

    isInBounds(position) {
        return (
            position.x >= -this.width/2 &&
            position.x <= this.width/2 &&
            position.z >= -this.length/2 &&
            position.z <= this.length/2
        );
    }

    isGoal(position) {
        const goalWidth = 8;
        const goalHeight = 3;
        const goalDepth = 1;
        
        return (
            Math.abs(position.x) <= goalWidth/2 &&
            position.y <= goalHeight &&
            (Math.abs(position.z) >= this.length/2 && Math.abs(position.z) <= this.length/2 + goalDepth)
        );
    }
} 
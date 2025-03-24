import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export class Physics {
    constructor() {
        // Create physics world
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0)
        });
        
        // Create ground plane
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({
            type: CANNON.Body.STATIC,
            shape: groundShape
        });
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.world.addBody(groundBody);
        
        // Create walls
        this.createWalls();
        
        // Create goal posts
        this.createGoalPosts();
    }
    
    createWalls() {
        // Left wall
        const leftWall = new CANNON.Body({
            type: CANNON.Body.STATIC,
            shape: new CANNON.Box(new CANNON.Vec3(0.5, 5, 15))
        });
        leftWall.position.set(-10, 2.5, 0);
        this.world.addBody(leftWall);
        
        // Right wall
        const rightWall = new CANNON.Body({
            type: CANNON.Body.STATIC,
            shape: new CANNON.Box(new CANNON.Vec3(0.5, 5, 15))
        });
        rightWall.position.set(10, 2.5, 0);
        this.world.addBody(rightWall);
        
        // Back wall
        const backWall = new CANNON.Body({
            type: CANNON.Body.STATIC,
            shape: new CANNON.Box(new CANNON.Vec3(10, 5, 0.5))
        });
        backWall.position.set(0, 2.5, -7.5);
        this.world.addBody(backWall);
        
        // Front wall
        const frontWall = new CANNON.Body({
            type: CANNON.Body.STATIC,
            shape: new CANNON.Box(new CANNON.Vec3(10, 5, 0.5))
        });
        frontWall.position.set(0, 2.5, 7.5);
        this.world.addBody(frontWall);
    }
    
    createGoalPosts() {
        // Home team goal (right side)
        const homeGoal = new CANNON.Body({
            type: CANNON.Body.STATIC,
            shape: new CANNON.Box(new CANNON.Vec3(0.5, 2, 3))
        });
        homeGoal.position.set(10, 1, 0);
        this.world.addBody(homeGoal);
        
        // Away team goal (left side)
        const awayGoal = new CANNON.Body({
            type: CANNON.Body.STATIC,
            shape: new CANNON.Box(new CANNON.Vec3(0.5, 2, 3))
        });
        awayGoal.position.set(-10, 1, 0);
        this.world.addBody(awayGoal);
    }
    
    update(deltaTime) {
        this.world.step(deltaTime);
    }
    
    createPlayerBody(position, radius = 0.5) {
        const shape = new CANNON.Sphere(radius);
        const body = new CANNON.Body({
            mass: 5,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            shape: shape,
            material: new CANNON.Material('player')
        });
        
        // Add friction to prevent sliding
        body.linearDamping = 0.5;
        body.angularDamping = 0.5;
        
        this.world.addBody(body);
        return body;
    }
    
    createBallBody(position, radius = 0.2) {
        const shape = new CANNON.Sphere(radius);
        const body = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            shape: shape,
            material: new CANNON.Material('ball')
        });
        
        // Add friction and restitution for realistic ball behavior
        body.linearDamping = 0.3;
        body.angularDamping = 0.3;
        body.restitution = 0.8;
        
        this.world.addBody(body);
        return body;
    }
    
    applyImpulse(body, impulse) {
        body.applyImpulse(new CANNON.Vec3(impulse.x, impulse.y, impulse.z));
    }
    
    cleanup() {
        // Remove all bodies from the world
        while (this.world.bodies.length > 0) {
            this.world.removeBody(this.world.bodies[0]);
        }
    }
} 
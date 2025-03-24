import * as THREE from 'three';

export class Field {
    constructor(scene, model) {
        this.scene = scene;
        this.model = model;
        
        // Create field mesh
        this.mesh = this.createMesh();
        
        // Add field lines
        this.createFieldLines();
        
        // Add goal posts
        this.createGoalPosts();
    }
    
    createMesh() {
        const mesh = this.model.scene.clone();
        mesh.scale.set(1, 1, 1);
        mesh.position.set(0, 0, 0);
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        return mesh;
    }
    
    createFieldLines() {
        // Field dimensions
        const width = 20;
        const length = 30;
        const lineColor = 0xFFFFFF;
        const lineWidth = 0.1;
        
        // Create field lines material
        const material = new THREE.LineBasicMaterial({ color: lineColor });
        
        // Center line
        const centerLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0.01, -length/2),
                new THREE.Vector3(0, 0.01, length/2)
            ]),
            material
        );
        this.scene.add(centerLine);
        
        // Center circle
        const centerCircle = new THREE.RingGeometry(3, 3.1, 32);
        const centerCircleMesh = new THREE.Mesh(
            centerCircle,
            new THREE.MeshBasicMaterial({ color: lineColor })
        );
        centerCircleMesh.rotation.x = -Math.PI / 2;
        centerCircleMesh.position.y = 0.01;
        this.scene.add(centerCircleMesh);
        
        // Penalty areas
        const penaltyAreaWidth = 4;
        const penaltyAreaLength = 8;
        
        // Home team penalty area
        const homePenaltyArea = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-width/2, 0.01, -penaltyAreaLength/2),
                new THREE.Vector3(-width/2 + penaltyAreaWidth, 0.01, -penaltyAreaLength/2),
                new THREE.Vector3(-width/2 + penaltyAreaWidth, 0.01, penaltyAreaLength/2),
                new THREE.Vector3(-width/2, 0.01, penaltyAreaLength/2)
            ]),
            material
        );
        this.scene.add(homePenaltyArea);
        
        // Away team penalty area
        const awayPenaltyArea = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(width/2, 0.01, -penaltyAreaLength/2),
                new THREE.Vector3(width/2 - penaltyAreaWidth, 0.01, -penaltyAreaLength/2),
                new THREE.Vector3(width/2 - penaltyAreaWidth, 0.01, penaltyAreaLength/2),
                new THREE.Vector3(width/2, 0.01, penaltyAreaLength/2)
            ]),
            material
        );
        this.scene.add(awayPenaltyArea);
    }
    
    createGoalPosts() {
        const postColor = 0xFFFFFF;
        const postMaterial = new THREE.MeshStandardMaterial({ color: postColor });
        
        // Goal post dimensions
        const postHeight = 2;
        const postWidth = 0.1;
        const postDepth = 0.1;
        const goalWidth = 3;
        
        // Create goal post geometry
        const postGeometry = new THREE.BoxGeometry(postWidth, postHeight, postDepth);
        
        // Home team goal posts
        const homeLeftPost = new THREE.Mesh(postGeometry, postMaterial);
        homeLeftPost.position.set(10, postHeight/2, -goalWidth/2);
        this.scene.add(homeLeftPost);
        
        const homeRightPost = new THREE.Mesh(postGeometry, postMaterial);
        homeRightPost.position.set(10, postHeight/2, goalWidth/2);
        this.scene.add(homeRightPost);
        
        const homeCrossbar = new THREE.Mesh(
            new THREE.BoxGeometry(postDepth, postWidth, goalWidth),
            postMaterial
        );
        homeCrossbar.position.set(10, postHeight, 0);
        this.scene.add(homeCrossbar);
        
        // Away team goal posts
        const awayLeftPost = new THREE.Mesh(postGeometry, postMaterial);
        awayLeftPost.position.set(-10, postHeight/2, -goalWidth/2);
        this.scene.add(awayLeftPost);
        
        const awayRightPost = new THREE.Mesh(postGeometry, postMaterial);
        awayRightPost.position.set(-10, postHeight/2, goalWidth/2);
        this.scene.add(awayRightPost);
        
        const awayCrossbar = new THREE.Mesh(
            new THREE.BoxGeometry(postDepth, postWidth, goalWidth),
            postMaterial
        );
        awayCrossbar.position.set(-10, postHeight, 0);
        this.scene.add(awayCrossbar);
    }
    
    cleanup() {
        // Remove field mesh
        this.scene.remove(this.mesh);
        
        // Remove all field lines and goal posts
        this.scene.traverse((object) => {
            if (object instanceof THREE.Line || 
                (object instanceof THREE.Mesh && object.material.color.getHex() === 0xFFFFFF)) {
                this.scene.remove(object);
            }
        });
    }
} 
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Field } from '@/entities/Field.js';
import { Ball } from '@/entities/Ball.js';
import { Player } from '@/entities/Player.js';
import { EventBus } from '@/core/EventBus.js';
import logger from '@/utils/logger.js';

export class Game {
  constructor({ assets, room }) {
    this.assets = assets;
    this.room = room;
    this.eventBus = new EventBus();
    this.players = new Map();

    // Scene setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.getElementById('game-container').appendChild(this.renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 50, 50);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Initial camera position
    this.camera.position.set(0, 20, 30);
    this.camera.lookAt(0, 0, 0);

    // Physics
    this.physicsWorld = new CANNON.World();
    this.physicsWorld.gravity.set(0, -9.82, 0);

    // Materials
    this.groundMaterial = new CANNON.Material('ground');
    this.ballMaterial = new CANNON.Material('ball');
    this.playerMaterial = new CANNON.Material('player');
    this.physicsWorld.addContactMaterial(new CANNON.ContactMaterial(this.groundMaterial, this.ballMaterial, {
      friction: 0.3,
      restitution: 0.7,
    }));
    this.physicsWorld.addContactMaterial(new CANNON.ContactMaterial(this.groundMaterial, this.playerMaterial, {
      friction: 0.5,
      restitution: 0.3,
    }));
    this.physicsWorld.addContactMaterial(new CANNON.ContactMaterial(this.ballMaterial, this.playerMaterial, {
      friction: 0.3,
      restitution: 0.8,
    }));

    // Entities
    this.field = new Field(this.scene, this.physicsWorld, this.groundMaterial, this.assets);
    this.ball = new Ball(this.scene, this.physicsWorld, this.ballMaterial, this.assets);
    
    // Create local player
    this.localPlayer = new Player(
      this.scene,
      this.physicsWorld,
      this.playerMaterial,
      this.assets,
      this.room.sessionId,
      true
    );
    this.players.set(this.room.sessionId, this.localPlayer);

    // Networking
    this.setupNetworking();

    // Game state
    this.score = { home: 0, away: 0 };
    this.lastGoalTime = 0;
    this.goalCooldown = 2000; // 2 seconds cooldown between goals

    // Game loop
    this.lastTime = performance.now();
    this.fixedTimeStep = 1 / 60;
    this.maxSubSteps = 3;
    this.fps = 0;
    this.frameCount = 0;
    this.lastFpsTime = performance.now();

    // Start animation loop
    this.animate();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());

    logger.info('[Game] Initialized successfully');
  }

  setupNetworking() {
    // Handle player joins
    this.room.state.players.onAdd((player, key) => {
      if (key !== this.room.sessionId) {
        const newPlayer = new Player(
          this.scene,
          this.physicsWorld,
          this.playerMaterial,
          this.assets,
          key,
          false
        );
        this.players.set(key, newPlayer);
        logger.info(`[Game] Player ${key} joined`);
      }
    });

    // Handle player leaves
    this.room.state.players.onRemove((player, key) => {
      const playerToRemove = this.players.get(key);
      if (playerToRemove) {
        playerToRemove.cleanup();
        this.players.delete(key);
        logger.info(`[Game] Player ${key} left`);
      }
    });

    // Handle state updates
    this.room.onStateChange((state) => {
      // Update ball position
      this.ball.body.position.copy(state.ball.position);
      this.ball.body.quaternion.copy(state.ball.quaternion);
      
      // Update remote players
      state.players.forEach((playerState, key) => {
        if (key !== this.room.sessionId) {
          const player = this.players.get(key);
          if (player) {
            player.setPosition(playerState.position);
          }
        }
      });

      // Update score
      if (state.score) {
        this.score = state.score;
        this.eventBus.emit('scoreUpdate', this.score);
      }
    });

    // Handle kick messages
    this.room.onMessage('kick', (message) => {
      const { playerId, force } = message;
      if (playerId !== this.room.sessionId) {
        this.ball.applyImpulse(force);
      }
    });
  }

  checkForGoal() {
    const now = performance.now();
    if (now - this.lastGoalTime < this.goalCooldown) return;

    const ballPos = this.ball.getPosition();
    const goalDepth = 2;
    const goalWidth = 7;
    const goalHeight = 3;

    // Check left goal (home team)
    if (ballPos.x < -24 && Math.abs(ballPos.z) < goalWidth/2 && ballPos.y < goalHeight) {
      this.score.away++;
      this.handleGoal('away');
    }
    // Check right goal (away team)
    else if (ballPos.x > 24 && Math.abs(ballPos.z) < goalWidth/2 && ballPos.y < goalHeight) {
      this.score.home++;
      this.handleGoal('home');
    }
  }

  handleGoal(scoringTeam) {
    this.lastGoalTime = performance.now();
    this.ball.reset();
    this.room.send('goal', { team: scoringTeam, score: this.score });
    this.eventBus.emit('goal', { team: scoringTeam, score: this.score });
    logger.info(`[Game] Goal scored by ${scoringTeam} team!`);
  }

  updateCamera() {
    if (this.localPlayer) {
      const playerPos = this.localPlayer.getPosition();
      const ballPos = this.ball.getPosition();
      
      // Calculate camera target position (between player and ball)
      const targetX = (playerPos.x + ballPos.x) / 2;
      const targetZ = (playerPos.z + ballPos.z) / 2;
      
      // Smoothly move camera
      this.camera.position.lerp(
        new THREE.Vector3(targetX, 20, targetZ + 30),
        0.05
      );
      this.camera.lookAt(targetX, 0, targetZ);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Update physics
    this.physicsWorld.step(this.fixedTimeStep, deltaTime, this.maxSubSteps);

    // Update entities
    this.field.update();
    this.ball.update();
    this.players.forEach(player => player.update(deltaTime));

    // Check for goals
    this.checkForGoal();

    // Update camera
    this.updateCamera();

    // Sync local player and ball position with server
    if (this.localPlayer) {
      this.room.send('updatePlayer', {
        position: this.localPlayer.getPosition(),
      });
    }
    this.room.send('updateBall', {
      position: this.ball.getPosition(),
      quaternion: this.ball.body.quaternion,
    });

    // Update FPS counter
    this.frameCount++;
    const elapsed = (currentTime - this.lastFpsTime) / 1000;
    if (elapsed >= 1) {
      this.fps = this.frameCount / elapsed;
      this.frameCount = 0;
      this.lastFpsTime = currentTime;
      logger.debug('[Game] FPS:', { fps: this.fps.toFixed(2) });
    }

    // Render scene
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  cleanup() {
    // Cleanup all players
    this.players.forEach(player => player.cleanup());
    this.players.clear();

    // Cleanup other entities
    this.field.cleanup();
    this.ball.cleanup();

    // Leave room and cleanup renderer
    this.room.leave();
    this.renderer.dispose();
    this.scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    window.removeEventListener('resize', () => this.onWindowResize());
    logger.info('[Game] Cleanup complete');
  }
} 
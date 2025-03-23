import { Player } from "./Player.js";
import logger from "@/utils/logger.js";
export class AIPlayer extends Player {
  constructor(scene, physicsWorld, playerMaterial, assets, id) {
    super(scene, physicsWorld, playerMaterial, assets, id, false);
    this.targetPosition = null;
    this.state = "idle"; // idle, chasing, shooting, defending
    this.decisionInterval = 1000; // Make decisions every second
    this.lastDecisionTime = 0;
    this.ball = null;
    this.goalPosition = { x: 24, z: 0 }; // Default to right goal
  }
  setBall(ball) {
    this.ball = ball;
  }
  setGoalPosition(x, z) {
    this.goalPosition = { x, z };
  }
  update(deltaTime) {
    super.update(deltaTime);
    if (!this.ball) return;
    const currentTime = performance.now();
    if (currentTime - this.lastDecisionTime < this.decisionInterval) return;
    this.lastDecisionTime = currentTime;
    this.makeDecision();
  }
  makeDecision() {
    const ballPos = this.ball.getPosition();
    const playerPos = this.getPosition();
    const distanceToBall = this.calculateDistance(playerPos, ballPos);
    const distanceToGoal = this.calculateDistance(playerPos, this.goalPosition);
    // Simple decision making based on distance and game state
    if (distanceToBall < 5) {
      this.state = "shooting";
      this.shoot();
    } else if (distanceToBall < 15) {
      this.state = "chasing";
      this.moveTowards(ballPos);
    } else {
      this.state = "defending";
      this.defend();
    }
    logger.debug(
      `[AI ${this.id}] State: ${this.state}, Distance to ball: ${distanceToBall.toFixed(2)}`,
    );
  }
  calculateDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
  moveTowards(target) {
    const playerPos = this.getPosition();
    const dx = target.x - playerPos.x;
    const dz = target.z - playerPos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    if (distance > 0.1) {
      const velocity = new THREE.Vector3(
        (dx / distance) * this.speed,
        this.body.velocity.y,
        (dz / distance) * this.speed,
      );
      this.body.velocity.copy(velocity);
    }
  }
  shoot() {
    const ballPos = this.ball.getPosition();
    const playerPos = this.getPosition();
    const direction = new THREE.Vector3(
      this.goalPosition.x - ballPos.x,
      0.5, // Slight upward angle
      this.goalPosition.z - ballPos.z,
    ).normalize();
    const force = direction.multiplyScalar(10);
    this.ball.applyImpulse([force.x, force.y, force.z]);
    logger.debug(`[AI ${this.id}] Shooting ball`);
  }
  defend() {
    // Move to a defensive position between ball and goal
    const ballPos = this.ball.getPosition();
    const defensiveX = (ballPos.x + this.goalPosition.x) / 2;
    const defensiveZ = (ballPos.z + this.goalPosition.z) / 2;
    this.moveTowards({ x: defensiveX, z: defensiveZ });
  }
}

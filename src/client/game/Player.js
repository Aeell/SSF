import * as THREE from "three";
import * as CANNON from "cannon-es";
import { Ability } from "./abilities/Ability.js";
import { logger } from "../utils/logger.js";
export class Player {
  constructor(scene, role, position, team) {
    try {
      if (!scene || !(scene instanceof THREE.Scene)) {
        throw new Error("Player requires valid THREE.Scene");
      }
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
      // Create physics body
      this.createPhysicsBody();
      // Create visual mesh
      this.createMesh();
      logger.debug("Player created", {
        role,
        position,
        team,
        abilities: this.abilities.map((a) => a.name),
      });
    } catch (error) {
      logger.error("Failed to create player:", {
        error: error.message,
        stack: error.stack,
        details: {
          hasScene: !!scene,
          role,
          team,
        },
      });
      throw error;
    }
  }
  createPhysicsBody() {
    try {
      this.body = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(
          this.position.x,
          this.position.y,
          this.position.z,
        ),
        shape: new CANNON.Sphere(0.5),
      });
      logger.debug("Player physics body created", {
        mass: this.body.mass,
        position: this.body.position,
      });
    } catch (error) {
      logger.error("Failed to create player physics body:", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
  createMesh() {
    try {
      const geometry = new THREE.SphereGeometry(0.5, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: this.team === "home" ? 0x0000ff : 0xff0000,
        roughness: 0.5,
        metalness: 0.5,
      });
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.copy(this.position);
      this.mesh.castShadow = true;
      this.mesh.receiveShadow = true;
      this.scene.add(this.mesh);
      logger.debug("Player mesh created", {
        team: this.team,
        position: this.mesh.position,
      });
    } catch (error) {
      logger.error("Failed to create player mesh:", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
  initializeAbilities() {
    try {
      // Initialize abilities based on role
      const abilities = [];
      switch (this.role) {
        case "striker":
          abilities.push(new Ability("sprint", 20));
          abilities.push(new Ability("powerShot", 30));
          break;
        case "midfielder":
          abilities.push(new Ability("tackle", 15));
          abilities.push(new Ability("pass", 10));
          break;
        case "defender":
          abilities.push(new Ability("slide", 25));
          abilities.push(new Ability("block", 20));
          break;
        default:
          abilities.push(new Ability("sprint", 15));
      }
      logger.debug("Player abilities initialized", {
        role: this.role,
        abilities: abilities.map((a) => a.name),
      });
      return abilities;
    } catch (error) {
      logger.error("Failed to initialize player abilities:", {
        error: error.message,
        stack: error.stack,
        role: this.role,
      });
      throw error;
    }
  }
  update(deltaTime) {
    try {
      // Update physics
      if (this.body) {
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
      }
      // Update stamina
      if (this.isControlled) {
        this.stamina = Math.max(
          0,
          this.stamina - this.staminaDrainRate * deltaTime,
        );
      } else {
        this.stamina = Math.min(
          100,
          this.stamina + this.staminaRegenRate * deltaTime,
        );
      }
      // Update abilities cooldowns
      this.abilities.forEach((ability) => ability.update(deltaTime));
    } catch (error) {
      logger.error("Failed to update player:", {
        error: error.message,
        stack: error.stack,
        details: {
          deltaTime,
          hasBody: !!this.body,
          hasMesh: !!this.mesh,
          stamina: this.stamina,
        },
      });
    }
  }
  useAbility(abilityName) {
    try {
      const ability = this.abilities.find((a) => a.name === abilityName);
      if (!ability) {
        throw new Error(`Ability ${abilityName} not found`);
      }
      if (ability.isOnCooldown()) {
        logger.warn("Ability on cooldown:", {
          ability: abilityName,
          remainingCooldown: ability.getRemainingCooldown(),
        });
        return false;
      }
      if (this.stamina < ability.staminaCost) {
        logger.warn("Not enough stamina for ability:", {
          ability: abilityName,
          currentStamina: this.stamina,
          requiredStamina: ability.staminaCost,
        });
        return false;
      }
      // Use the ability
      ability.use();
      this.stamina -= ability.staminaCost;
      logger.debug("Ability used:", {
        ability: abilityName,
        remainingStamina: this.stamina,
      });
      return true;
    } catch (error) {
      logger.error("Failed to use ability:", {
        error: error.message,
        stack: error.stack,
        ability: abilityName,
      });
      return false;
    }
  }
  cleanup() {
    try {
      if (this.mesh) {
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
      }
      logger.debug("Player cleanup complete");
    } catch (error) {
      logger.error("Failed to cleanup player:", {
        error: error.message,
        stack: error.stack,
        details: {
          hasMesh: !!this.mesh,
          hasScene: !!this.scene,
        },
      });
    }
  }
  updateMovement() {
    if (this.movement.length() > 0) {
      // Apply movement force
      const force = new CANNON.Vec3(
        this.movement.x * this.speed,
        0,
        this.movement.z * this.speed,
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
    players.forEach((player) => {
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
      logger.warn("Pass failed: No valid target found", {
        playerId: this.id,
        team: this.team,
      });
      return false;
    }
    const direction = new THREE.Vector3()
      .subVectors(target.mesh.position, this.mesh.position)
      .normalize();
    const power = 5;
    const success = ball.kick(direction, power);
    if (success) {
      logger.info("Pass successful", {
        from: this.id,
        to: target.id,
        team: this.team,
        distance: this.mesh.position.distanceTo(target.mesh.position),
      });
      return true;
    } else {
      logger.warn("Pass failed: Ball kick failed", {
        from: this.id,
        to: target.id,
        team: this.team,
      });
      return false;
    }
  }
  activateAbility(index) {
    if (index < 0 || index >= this.abilities.length) {
      logger.warn("Ability activation failed: Invalid index", {
        playerId: this.id,
        index,
        availableAbilities: this.abilities.length,
      });
      return false;
    }
    const ability = this.abilities[index];
    if (ability.isReady() && this.stamina >= ability.staminaCost) {
      const success = ability.activate();
      if (success) {
        this.stamina -= ability.staminaCost;
        logger.info("Ability activated", {
          playerId: this.id,
          ability: ability.name,
          remainingStamina: this.stamina,
        });
        return true;
      }
    }
    logger.warn("Ability activation failed", {
      playerId: this.id,
      ability: ability.name,
      isReady: ability.isReady(),
      stamina: this.stamina,
      requiredStamina: ability.staminaCost,
    });
    return false;
  }
  setControlled(controlled) {
    this.isControlled = controlled;
    logger.debug("Player control changed", {
      playerId: this.id,
      isControlled: controlled,
      role: this.role,
    });
  }
}

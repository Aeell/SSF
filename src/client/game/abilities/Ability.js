import { EventBus } from '../../core/EventBus';

export class Ability {
  constructor(name, cooldown, duration, cost) {
    this.name = name;
    this.cooldown = cooldown;
    this.duration = duration;
    this.cost = cost;
    this.isActive = false;
    this.currentCooldown = 0;
    this.currentDuration = 0;
    this.eventBus = EventBus.getInstance();
  }

  activate(player) {
    if (this.currentCooldown <= 0 && !this.isActive) {
      this.isActive = true;
      this.currentDuration = this.duration;
      this.currentCooldown = this.cooldown;
      this.applyEffect(player);
      this.eventBus.emit('abilityActivated', {
        playerId: player.id,
        ability: this.name,
        duration: this.duration
      });
      return true;
    }
    return false;
  }

  deactivate(player) {
    if (this.isActive) {
      this.isActive = false;
      this.removeEffect(player);
      this.eventBus.emit('abilityDeactivated', {
        playerId: player.id,
        ability: this.name
      });
    }
  }

  update(deltaTime) {
    if (this.isActive) {
      this.currentDuration -= deltaTime;
      if (this.currentDuration <= 0) {
        this.isActive = false;
      }
    }
    if (this.currentCooldown > 0) {
      this.currentCooldown -= deltaTime;
    }
  }

  applyEffect(player) {
    // To be implemented by specific abilities
    throw new Error('applyEffect must be implemented by ability subclass');
  }

  removeEffect(player) {
    // To be implemented by specific abilities
    throw new Error('removeEffect must be implemented by ability subclass');
  }

  getCooldownPercentage() {
    return this.currentCooldown / this.cooldown;
  }

  getDurationPercentage() {
    return this.currentDuration / this.duration;
  }

  isReady() {
    return this.currentCooldown <= 0 && !this.isActive;
  }
}

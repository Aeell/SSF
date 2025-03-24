import { Player } from '../entities/Player';

interface AbilityOptions {
  name: string;
  cooldown: number;
  duration: number;
  effect: () => void;
  cleanup: () => void;
}

export class Ability {
  public readonly name: string;
  public readonly cooldown: number;
  public readonly duration: number;
  public readonly effect: () => void;
  public readonly cleanup: () => void;
  public isActive: boolean;
  public remainingCooldown: number;
  private remainingDuration: number;

  constructor(player: Player, options: AbilityOptions) {
    this.name = options.name;
    this.cooldown = options.cooldown;
    this.duration = options.duration;
    this.effect = options.effect;
    this.cleanup = options.cleanup;
    this.isActive = false;
    this.remainingCooldown = 0;
    this.remainingDuration = 0;
  }

  public activate(): void {
    if (this.remainingCooldown > 0) {
      return;
    }

    this.isActive = true;
    this.remainingDuration = this.duration;
    this.effect();
  }

  public update(deltaTime: number): void {
    if (this.isActive) {
      this.remainingDuration -= deltaTime;
      if (this.remainingDuration <= 0) {
        this.isActive = false;
        this.cleanup();
        this.remainingCooldown = this.cooldown;
      }
    } else if (this.remainingCooldown > 0) {
      this.remainingCooldown -= deltaTime;
    }
  }
} 
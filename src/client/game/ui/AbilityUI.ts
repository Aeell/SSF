export class AbilityUI {
  private container: HTMLDivElement;
  private abilities: Map<string, HTMLDivElement>;
  private isInitialized: boolean;

  constructor() {
    this.container = document.createElement('div');
    this.abilities = new Map();
    this.isInitialized = false;
  }

  public initialize(): void {
    if (this.isInitialized) return;

    this.container.className = 'ability-ui';
    this.container.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 10px;
      z-index: 1000;
    `;

    document.body.appendChild(this.container);
    this.isInitialized = true;
  }

  public addAbility(name: string, cooldown: number): void {
    if (!this.isInitialized) return;

    const abilitySlot = document.createElement('div');
    abilitySlot.className = 'ability-slot';
    abilitySlot.style.cssText = `
      width: 60px;
      height: 60px;
      background: rgba(0, 0, 0, 0.5);
      border: 2px solid #fff;
      border-radius: 8px;
      position: relative;
      cursor: pointer;
      transition: all 0.2s ease;
    `;

    const icon = document.createElement('div');
    icon.className = 'ability-icon';
    icon.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 24px;
    `;
    icon.textContent = this.getAbilityIcon(name);

    const cooldownOverlay = document.createElement('div');
    cooldownOverlay.className = 'cooldown-overlay';
    cooldownOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      border-radius: 6px;
      display: none;
    `;

    const keyBinding = document.createElement('div');
    keyBinding.className = 'key-binding';
    keyBinding.style.cssText = `
      position: absolute;
      bottom: -20px;
      left: 50%;
      transform: translateX(-50%);
      color: #fff;
      font-size: 12px;
      white-space: nowrap;
    `;
    keyBinding.textContent = this.getKeyBinding(name);

    abilitySlot.appendChild(icon);
    abilitySlot.appendChild(cooldownOverlay);
    abilitySlot.appendChild(keyBinding);

    abilitySlot.addEventListener('mouseenter', () => {
      abilitySlot.style.transform = 'scale(1.1)';
      abilitySlot.style.borderColor = '#00ff00';
    });

    abilitySlot.addEventListener('mouseleave', () => {
      abilitySlot.style.transform = 'scale(1)';
      abilitySlot.style.borderColor = '#fff';
    });

    this.abilities.set(name, abilitySlot);
    this.container.appendChild(abilitySlot);
  }

  public updateAbility(name: string, cooldown: number, isActive: boolean): void {
    const abilitySlot = this.abilities.get(name);
    if (!abilitySlot) return;

    const cooldownOverlay = abilitySlot.querySelector('.cooldown-overlay') as HTMLDivElement;
    const icon = abilitySlot.querySelector('.ability-icon') as HTMLDivElement;

    if (cooldown > 0) {
      cooldownOverlay.style.display = 'block';
      cooldownOverlay.style.height = `${(cooldown / 100) * 100}%`;
    } else {
      cooldownOverlay.style.display = 'none';
    }

    if (isActive) {
      abilitySlot.style.borderColor = '#00ff00';
      abilitySlot.style.transform = 'scale(1.1)';
    } else {
      abilitySlot.style.borderColor = '#fff';
      abilitySlot.style.transform = 'scale(1)';
    }
  }

  public update(): void {
    // Update all abilities based on their current state
    this.abilities.forEach((slot, name) => {
      // This would be called with actual cooldown and active state values
      // from the game state
      this.updateAbility(name, 0, false);
    });
  }

  private getAbilityIcon(name: string): string {
    const icons: { [key: string]: string } = {
      'Speed Boost': '⚡',
      'Power Kick': '⚽',
      'Shield': '🛡️'
    };
    return icons[name] || '?';
  }

  private getKeyBinding(name: string): string {
    const bindings: { [key: string]: string } = {
      'Speed Boost': 'Q',
      'Power Kick': 'E',
      'Shield': 'R'
    };
    return bindings[name] || '';
  }

  public cleanup(): void {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.abilities.clear();
    this.isInitialized = false;
  }
} 
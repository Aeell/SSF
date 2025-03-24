import { AbilityUI } from '../AbilityUI';

describe('AbilityUI', () => {
  let abilityUI: AbilityUI;
  let mockContainer: HTMLDivElement;

  beforeEach(() => {
    // Create a mock container
    mockContainer = document.createElement('div');
    document.body.appendChild(mockContainer);

    // Create a new instance of AbilityUI
    abilityUI = new AbilityUI();
  });

  afterEach(() => {
    // Clean up
    abilityUI.cleanup();
    document.body.removeChild(mockContainer);
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      expect(abilityUI).toBeDefined();
    });

    it('should create UI elements on initialize', () => {
      abilityUI.initialize();
      const container = document.querySelector('.ability-ui');
      expect(container).toBeDefined();
    });
  });

  describe('ability management', () => {
    beforeEach(() => {
      abilityUI.initialize();
    });

    it('should add ability with correct elements', () => {
      abilityUI.addAbility('Speed Boost', 0);
      const abilitySlot = document.querySelector('.ability-slot');
      const abilityIcon = document.querySelector('.ability-icon');
      const cooldownOverlay = document.querySelector('.cooldown-overlay');
      const keyBinding = document.querySelector('.key-binding');

      expect(abilitySlot).toBeDefined();
      expect(abilityIcon).toBeDefined();
      expect(cooldownOverlay).toBeDefined();
      expect(keyBinding).toBeDefined();
      expect(abilityIcon?.textContent).toBe('⚡');
      expect(keyBinding?.textContent).toBe('Q');
    });

    it('should update ability cooldown', () => {
      abilityUI.addAbility('Speed Boost', 0);
      abilityUI.updateAbility('Speed Boost', 50, false);
      const cooldownOverlay = document.querySelector('.cooldown-overlay') as HTMLDivElement;
      expect(cooldownOverlay.style.display).toBe('block');
      expect(cooldownOverlay.style.height).toBe('50%');
    });

    it('should update ability active state', () => {
      abilityUI.addAbility('Speed Boost', 0);
      abilityUI.updateAbility('Speed Boost', 0, true);
      const abilitySlot = document.querySelector('.ability-slot') as HTMLDivElement;
      expect(abilitySlot.style.borderColor).toBe('#00ff00');
      expect(abilitySlot.style.transform).toBe('scale(1.1)');
    });

    it('should handle unknown ability icons', () => {
      abilityUI.addAbility('Unknown Ability', 0);
      const abilityIcon = document.querySelector('.ability-icon');
      expect(abilityIcon?.textContent).toBe('?');
    });

    it('should handle unknown key bindings', () => {
      abilityUI.addAbility('Unknown Ability', 0);
      const keyBinding = document.querySelector('.key-binding');
      expect(keyBinding?.textContent).toBe('');
    });
  });

  describe('cleanup', () => {
    it('should remove UI elements on cleanup', () => {
      abilityUI.initialize();
      abilityUI.addAbility('Speed Boost', 0);
      abilityUI.cleanup();
      const container = document.querySelector('.ability-ui');
      expect(container).toBeNull();
    });
  });
}); 
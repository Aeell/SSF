export class Ability {
  constructor(name, cooldown, chargeTime, callback) {
    this.name = name;
    this.cooldown = cooldown;
    this.chargeTime = chargeTime;
    this.callback = callback;
    // State
    this.state = {
      isReady: true,
      isCharging: false,
      currentCooldown: 0,
      currentCharge: 0,
    };
  }
  update(deltaTime) {
    // Update cooldown
    if (this.state.currentCooldown > 0) {
      this.state.currentCooldown -= deltaTime;
      if (this.state.currentCooldown <= 0) {
        this.state.currentCooldown = 0;
        this.state.isReady = true;
      }
    }
    // Update charge
    if (this.state.isCharging) {
      this.state.currentCharge += deltaTime;
      if (this.state.currentCharge >= this.chargeTime) {
        this.state.isCharging = false;
        this.state.currentCharge = 0;
        this.activate();
      }
    }
  }
  canActivate() {
    return this.state.isReady && !this.state.isCharging;
  }
  startCharging() {
    if (this.chargeTime > 0 && this.state.isReady) {
      this.state.isCharging = true;
      this.state.currentCharge = 0;
      return true;
    }
    return false;
  }
  activate() {
    if (this.canActivate()) {
      // Call the ability's callback function
      this.callback();
      // Start cooldown
      this.state.currentCooldown = this.cooldown;
      this.state.isReady = false;
      this.state.isCharging = false;
      this.state.currentCharge = 0;
    }
  }
  cancel() {
    this.state.isCharging = false;
    this.state.currentCharge = 0;
  }
  reset() {
    this.state = {
      isReady: true,
      isCharging: false,
      currentCooldown: 0,
      currentCharge: 0,
    };
  }
  getCooldownProgress() {
    return this.state.currentCooldown / this.cooldown;
  }
  getChargeProgress() {
    return this.state.currentCharge / this.chargeTime;
  }
  isCharging() {
    return this.state.isCharging;
  }
  isReady() {
    return this.state.isReady;
  }
}

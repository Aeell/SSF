import { Player } from "./Player.js";
export class Team {
  constructor(scene, side) {
    this.scene = scene;
    this.side = side; // 'home' or 'away'
    // Team composition
    this.players = [];
    this.formation = {
      attackers: 3,
      defenders: 2,
      goalkeeper: 1,
    };
    // Team state
    this.state = {
      hasPossession: false,
      score: 0,
      formation: "4-3-3", // Default formation
    };
    // Create team
    this.create();
  }
  create() {
    // Create players based on formation
    this.createAttackers();
    this.createDefenders();
    this.createGoalkeeper();
    // Set initial positions
    this.setFormation(this.state.formation);
  }
  createAttackers() {
    for (let i = 0; i < this.formation.attackers; i++) {
      const position = this.getInitialPosition("attacker", i);
      const player = new Player(this.scene, this.side, "attacker", position);
      this.players.push(player);
    }
  }
  createDefenders() {
    for (let i = 0; i < this.formation.defenders; i++) {
      const position = this.getInitialPosition("defender", i);
      const player = new Player(this.scene, this.side, "defender", position);
      this.players.push(player);
    }
  }
  createGoalkeeper() {
    const position = this.getInitialPosition("goalkeeper", 0);
    const player = new Player(this.scene, this.side, "goalkeeper", position);
    this.players.push(player);
  }
  getInitialPosition(role, index) {
    const isHome = this.side === "home";
    const zOffset = isHome
      ? -this.scene.field.getLength() / 4
      : this.scene.field.getLength() / 4;
    switch (role) {
      case "attacker":
        return new THREE.Vector3(
          (index - 1) * 5, // Spread attackers horizontally
          1,
          zOffset + (isHome ? 5 : -5),
        );
      case "defender":
        return new THREE.Vector3(
          (index - 0.5) * 6, // Spread defenders horizontally
          1,
          zOffset + (isHome ? -5 : 5),
        );
      case "goalkeeper":
        return new THREE.Vector3(
          0,
          1,
          zOffset +
            (isHome
              ? -this.scene.field.getLength() / 2 + 2
              : this.scene.field.getLength() / 2 - 2),
        );
      default:
        return new THREE.Vector3(0, 1, zOffset);
    }
  }
  setFormation(formation) {
    this.state.formation = formation;
    // Update player positions based on formation
    this.updatePositions();
  }
  updatePositions() {
    // Update positions based on current formation
    this.players.forEach((player, index) => {
      const position = this.getInitialPosition(player.role, index);
      player.mesh.position.copy(position);
    });
  }
  update(deltaTime) {
    // Update all players
    this.players.forEach((player) => {
      player.update(deltaTime);
    });
    // Update team state
    this.updateTeamState();
  }
  updateTeamState() {
    // Check possession
    this.state.hasPossession = this.players.some(
      (player) => player.state.hasBall,
    );
  }
  getPlayerWithBall() {
    return this.players.find((player) => player.state.hasBall);
  }
  getNearestPlayerTo(position) {
    let nearest = null;
    let minDistance = Infinity;
    this.players.forEach((player) => {
      const distance = player.mesh.position.distanceTo(position);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = player;
      }
    });
    return nearest;
  }
  resetPositions() {
    this.setFormation(this.state.formation);
    this.players.forEach((player) => {
      player.reset();
    });
  }
  getScore() {
    return this.state.score;
  }
  incrementScore() {
    this.state.score++;
  }
  hasPossession() {
    return this.state.hasPossession;
  }
  getPlayers() {
    return this.players;
  }
  getAttackers() {
    return this.players.filter((player) => player.role === "attacker");
  }
  getDefenders() {
    return this.players.filter((player) => player.role === "defender");
  }
  getGoalkeeper() {
    return this.players.find((player) => player.role === "goalkeeper");
  }
}

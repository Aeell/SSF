import { Scene, PerspectiveCamera, WebGLRenderer, Vector3, WebGLShadowMap } from 'three';
import { Physics } from './physics/Physics';
import { Player } from './entities/Player';
import { Ball } from './entities/Ball';
import { AbilityUI } from './ui/AbilityUI';

interface GameSettings {
  maxPlayers: number;
  matchDuration: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface ExtendedWebGLRenderer extends WebGLRenderer {
  shadowMap: WebGLShadowMap;
}

interface ExtendedPerspectiveCamera extends PerspectiveCamera {
  position: Vector3;
}

export class Game {
  private scene: Scene;
  private camera: ExtendedPerspectiveCamera;
  private renderer: ExtendedWebGLRenderer;
  private physics: Physics;
  private players: Player[];
  private ball: Ball;
  private abilityUI: AbilityUI;
  private isRunning: boolean;
  private score: { home: number; away: number };
  private settings: GameSettings;

  constructor(settings: GameSettings = { maxPlayers: 4, matchDuration: 300, difficulty: 'medium' }) {
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000) as ExtendedPerspectiveCamera;
    this.renderer = new WebGLRenderer({ antialias: true }) as ExtendedWebGLRenderer;
    this.physics = new Physics();
    this.players = [];
    this.ball = new Ball(this.scene, this.physics, {});
    this.abilityUI = new AbilityUI();
    this.isRunning = false;
    this.score = { home: 0, away: 0 };
    this.settings = settings;

    this.initialize();
  }

  private initialize(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.body.appendChild(this.renderer.domElement);

    const cameraPosition = new Vector3(0, 10, 20);
    this.camera.position.copy(cameraPosition);
    this.camera.lookAt(0, 0, 0);

    this.abilityUI.initialize();
  }

  public start(): void {
    this.isRunning = true;
    this.animate();
  }

  public pause(): void {
    this.isRunning = false;
  }

  public resume(): void {
    this.isRunning = true;
    this.animate();
  }

  public end(): void {
    this.isRunning = false;
    this.cleanup();
  }

  public updateScore(team: 'home' | 'away'): void {
    this.score[team]++;
  }

  public resetScore(): void {
    this.score = { home: 0, away: 0 };
  }

  private animate(): void {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this.animate());

    const deltaTime = 0.016; // 60 FPS
    this.physics.update(deltaTime);
    this.players.forEach(player => player.update(deltaTime));
    this.ball.update(deltaTime);
    this.abilityUI.update();

    this.renderer.render(this.scene, this.camera);
  }

  public cleanup(): void {
    this.isRunning = false;
    this.physics.cleanup();
    this.players.forEach(player => player.cleanup());
    this.ball.cleanup();
    this.abilityUI.cleanup();
    document.body.removeChild(this.renderer.domElement);
  }
} 
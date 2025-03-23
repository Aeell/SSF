import { EventBus } from '@/core/EventBus.js';
import { ProtectionUtils } from '@/utils/protection.js';

export class AIMatchVisualizer {
    constructor(canvas, match) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.match = match;
        this.scale = 1;
        this.offset = { x: 0, y: 0 };
        this.animations = [];
        this.lastFrame = 0;
        
        this.setupCanvas();
        this.setupEventListeners();
    }

    setupCanvas() {
        // Set canvas size to match container
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        // Set initial scale based on field size
        const fieldWidth = 100;
        const fieldHeight = 60;
        this.scale = Math.min(
            this.canvas.width / fieldWidth,
            this.canvas.height / fieldHeight
        );
        
        // Center the field
        this.offset = {
            x: (this.canvas.width - fieldWidth * this.scale) / 2,
            y: (this.canvas.height - fieldHeight * this.scale) / 2
        };
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.setupCanvas());
        
        // Listen for match updates
        EventBus.on('matchUpdate', (matchState) => {
            if (matchState.id === this.match.id) {
                this.updateMatchState(matchState);
            }
        });
    }

    updateMatchState(matchState) {
        this.match = matchState;
        this.render();
    }

    render() {
        const now = performance.now();
        const deltaTime = now - this.lastFrame;
        this.lastFrame = now;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw field
        this.drawField();

        // Draw players
        this.drawPlayers();

        // Draw ball
        this.drawBall();

        // Draw score and time
        this.drawHUD();

        // Update animations
        this.updateAnimations(deltaTime);

        // Request next frame
        requestAnimationFrame(() => this.render());
    }

    drawField() {
        this.ctx.save();
        this.ctx.translate(this.offset.x, this.offset.y);
        this.ctx.scale(this.scale, this.scale);

        // Draw grass
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.fillRect(0, 0, 100, 60);

        // Draw lines
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 0.5;

        // Center line
        this.ctx.beginPath();
        this.ctx.moveTo(50, 0);
        this.ctx.lineTo(50, 60);
        this.ctx.stroke();

        // Center circle
        this.ctx.beginPath();
        this.ctx.arc(50, 30, 9.15, 0, Math.PI * 2);
        this.ctx.stroke();

        // Penalty areas
        this.ctx.strokeRect(0, 22, 16.5, 16);
        this.ctx.strokeRect(83.5, 22, 16.5, 16);

        // Goal areas
        this.ctx.strokeRect(0, 27, 5.5, 6);
        this.ctx.strokeRect(94.5, 27, 5.5, 6);

        this.ctx.restore();
    }

    drawPlayers() {
        const team1 = ProtectionUtils.decryptData(this.match.team1);
        const team2 = ProtectionUtils.decryptData(this.match.team2);

        // Draw team 1
        team1.forEach((player, index) => {
            this.drawPlayer(player, index, '#3498db');
        });

        // Draw team 2
        team2.forEach((player, index) => {
            this.drawPlayer(player, index, '#e74c3c');
        });
    }

    drawPlayer(player, index, color) {
        const stats = player.getDecryptedStats();
        const position = this.calculatePlayerPosition(player, index);
        
        this.ctx.save();
        this.ctx.translate(this.offset.x, this.offset.y);
        this.ctx.scale(this.scale, this.scale);

        // Draw player circle
        this.ctx.beginPath();
        this.ctx.arc(position.x, position.y, 1.5, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 0.2;
        this.ctx.stroke();

        // Draw player number
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '0.8px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(index + 1, position.x, position.y);

        // Draw ability indicators
        const abilities = player.getDecryptedAbilities();
        abilities.forEach((ability, i) => {
            this.drawAbilityIndicator(position, ability, i);
        });

        this.ctx.restore();
    }

    calculatePlayerPosition(player, index) {
        // This would normally use the player's actual position from the match state
        // For now, we'll use a simple formation-based position
        const formation = {
            team1: [
                { x: 10, y: 30 }, // Goalkeeper
                { x: 25, y: 15 }, // Defender
                { x: 25, y: 30 }, // Defender
                { x: 25, y: 45 }, // Defender
                { x: 40, y: 30 }  // Midfielder
            ],
            team2: [
                { x: 90, y: 30 }, // Goalkeeper
                { x: 75, y: 15 }, // Defender
                { x: 75, y: 30 }, // Defender
                { x: 75, y: 45 }, // Defender
                { x: 60, y: 30 }  // Midfielder
            ]
        };

        return formation[`team${index < 5 ? 1 : 2}`][index % 5];
    }

    drawAbilityIndicator(position, ability, index) {
        const angle = (index / 4) * Math.PI * 2;
        const radius = 2;
        const x = position.x + Math.cos(angle) * radius;
        const y = position.y + Math.sin(angle) * radius;

        this.ctx.beginPath();
        this.ctx.arc(x, y, 0.3, 0, Math.PI * 2);
        this.ctx.fillStyle = this.getAbilityColor(ability);
        this.ctx.fill();
    }

    getAbilityColor(ability) {
        const colors = {
            SpeedBoost: '#f1c40f',
            PowerShot: '#e74c3c',
            Shield: '#3498db',
            Teleport: '#9b59b6'
        };
        return colors[ability] || '#95a5a6';
    }

    drawBall() {
        this.ctx.save();
        this.ctx.translate(this.offset.x, this.offset.y);
        this.ctx.scale(this.scale, this.scale);

        // Draw ball at center (or actual position from match state)
        this.ctx.beginPath();
        this.ctx.arc(50, 30, 0.5, 0, Math.PI * 2);
        this.ctx.fillStyle = '#fff';
        this.ctx.fill();
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 0.1;
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawHUD() {
        this.ctx.save();
        this.ctx.translate(this.offset.x, this.offset.y);
        this.ctx.scale(this.scale, this.scale);

        // Draw score
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '2px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            `${this.match.score.team1} - ${this.match.score.team2}`,
            50, 5
        );

        // Draw time
        const minutes = Math.floor(this.match.time / 60);
        const seconds = this.match.time % 60;
        this.ctx.fillText(
            `${minutes}:${seconds.toString().padStart(2, '0')}`,
            50, 58
        );

        this.ctx.restore();
    }

    updateAnimations(deltaTime) {
        this.animations = this.animations.filter(animation => {
            animation.update(deltaTime);
            return !animation.isComplete;
        });
    }

    addAnimation(animation) {
        this.animations.push(animation);
    }
} 
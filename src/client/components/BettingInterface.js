import { EventBus } from '@/core/EventBus.js';
import { ProtectionUtils } from '@/utils/protection.js';

export class BettingInterface {
    constructor(container, match) {
        this.container = container;
        this.match = match;
        this.currentBet = 0;
        this.selectedTeam = null;
        
        this.setupUI();
        this.setupEventListeners();
    }

    setupUI() {
        // Create main container
        this.element = document.createElement('div');
        this.element.className = 'betting-interface';
        this.element.innerHTML = `
            <div class="betting-header">
                <h2>Place Your Bet</h2>
                <div class="match-info">
                    <span class="score">${this.match.score.team1} - ${this.match.score.team2}</span>
                    <span class="time">${this.formatTime(this.match.time)}</span>
                </div>
            </div>
            
            <div class="betting-options">
                <div class="team-option" data-team="1">
                    <div class="team-name">Team 1</div>
                    <div class="odds">${this.match.odds.team1.toFixed(2)}x</div>
                </div>
                <div class="team-option" data-team="2">
                    <div class="team-name">Team 2</div>
                    <div class="odds">${this.match.odds.team2.toFixed(2)}x</div>
                </div>
            </div>
            
            <div class="betting-controls">
                <div class="bet-amount">
                    <label>Bet Amount:</label>
                    <input type="number" min="10" max="1000" value="10">
                </div>
                <div class="potential-winnings">
                    <span>Potential Winnings:</span>
                    <span class="amount">0</span>
                </div>
                <button class="place-bet" disabled>Place Bet</button>
            </div>
            
            <div class="betting-history">
                <h3>Recent Bets</h3>
                <div class="bets-list"></div>
            </div>
        `;
        
        this.container.appendChild(this.element);
        
        // Add styles
        this.addStyles();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .betting-interface {
                background: rgba(0, 0, 0, 0.8);
                border-radius: 8px;
                padding: 20px;
                color: white;
                font-family: Arial, sans-serif;
            }
            
            .betting-header {
                text-align: center;
                margin-bottom: 20px;
            }
            
            .match-info {
                display: flex;
                justify-content: space-around;
                margin-top: 10px;
                font-size: 1.2em;
            }
            
            .betting-options {
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
            }
            
            .team-option {
                flex: 1;
                margin: 0 10px;
                padding: 15px;
                border: 2px solid #3498db;
                border-radius: 5px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .team-option.selected {
                background: #3498db;
                color: white;
            }
            
            .team-option[data-team="2"] {
                border-color: #e74c3c;
            }
            
            .team-option[data-team="2"].selected {
                background: #e74c3c;
            }
            
            .odds {
                font-size: 1.5em;
                font-weight: bold;
                margin-top: 5px;
            }
            
            .betting-controls {
                margin: 20px 0;
            }
            
            .bet-amount {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .bet-amount input {
                width: 100px;
                padding: 5px;
                margin-left: 10px;
                border-radius: 3px;
                border: none;
            }
            
            .potential-winnings {
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
                font-size: 1.2em;
            }
            
            .place-bet {
                width: 100%;
                padding: 10px;
                background: #2ecc71;
                border: none;
                border-radius: 5px;
                color: white;
                font-size: 1.1em;
                cursor: pointer;
                transition: background 0.3s ease;
            }
            
            .place-bet:disabled {
                background: #95a5a6;
                cursor: not-allowed;
            }
            
            .place-bet:hover:not(:disabled) {
                background: #27ae60;
            }
            
            .betting-history {
                margin-top: 20px;
            }
            
            .bets-list {
                max-height: 200px;
                overflow-y: auto;
            }
            
            .bet-item {
                display: flex;
                justify-content: space-between;
                padding: 5px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Team selection
        this.element.querySelectorAll('.team-option').forEach(option => {
            option.addEventListener('click', () => {
                this.selectedTeam = parseInt(option.dataset.team);
                this.element.querySelectorAll('.team-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                option.classList.add('selected');
                this.updateBetButton();
            });
        });

        // Bet amount input
        const betInput = this.element.querySelector('.bet-amount input');
        betInput.addEventListener('input', (e) => {
            this.currentBet = parseInt(e.target.value) || 0;
            this.updatePotentialWinnings();
            this.updateBetButton();
        });

        // Place bet button
        const betButton = this.element.querySelector('.place-bet');
        betButton.addEventListener('click', () => {
            this.placeBet();
        });

        // Listen for match updates
        EventBus.on('matchUpdate', (matchState) => {
            if (matchState.id === this.match.id) {
                this.updateMatchState(matchState);
            }
        });
    }

    updateMatchState(matchState) {
        this.match = matchState;
        this.element.querySelector('.score').textContent = 
            `${matchState.score.team1} - ${matchState.score.team2}`;
        this.element.querySelector('.time').textContent = 
            this.formatTime(matchState.time);
        
        // Update odds
        this.element.querySelector('[data-team="1"] .odds').textContent = 
            `${matchState.odds.team1.toFixed(2)}x`;
        this.element.querySelector('[data-team="2"] .odds').textContent = 
            `${matchState.odds.team2.toFixed(2)}x`;
    }

    updatePotentialWinnings() {
        if (!this.selectedTeam || !this.currentBet) {
            this.element.querySelector('.potential-winnings .amount').textContent = '0';
            return;
        }

        const odds = this.match.odds[`team${this.selectedTeam}`];
        const potentialWinnings = this.currentBet * odds;
        this.element.querySelector('.potential-winnings .amount').textContent = 
            potentialWinnings.toFixed(2);
    }

    updateBetButton() {
        const betButton = this.element.querySelector('.place-bet');
        betButton.disabled = !this.selectedTeam || !this.currentBet || 
            this.currentBet < 10 || this.currentBet > 1000;
    }

    placeBet() {
        if (!this.selectedTeam || !this.currentBet) return;

        const bet = {
            matchId: this.match.id,
            teamNumber: this.selectedTeam,
            amount: this.currentBet,
            timestamp: Date.now()
        };

        // Emit bet event
        EventBus.emit('placeBet', bet);

        // Add to history
        this.addBetToHistory(bet);

        // Reset selection
        this.selectedTeam = null;
        this.currentBet = 0;
        this.element.querySelector('.bet-amount input').value = '10';
        this.element.querySelectorAll('.team-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        this.updateBetButton();
    }

    addBetToHistory(bet) {
        const betsList = this.element.querySelector('.bets-list');
        const betElement = document.createElement('div');
        betElement.className = 'bet-item';
        betElement.innerHTML = `
            <span>Team ${bet.teamNumber}</span>
            <span>${bet.amount}</span>
            <span>${this.formatTime(bet.timestamp)}</span>
        `;
        betsList.insertBefore(betElement, betsList.firstChild);
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
} 
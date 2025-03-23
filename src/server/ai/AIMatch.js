import { Schema, type } from '@colyseus/schema';
import { ProtectionUtils } from '../config/protection.js';
import { AIPlayer } from './AIPlayer.js';

export class AIMatch extends Schema {
    constructor(config) {
        super();
        this.id = ProtectionUtils.generateSecureToken();
        this.team1 = this.generateTeam();
        this.team2 = this.generateTeam();
        this.score = { team1: 0, team2: 0 };
        this.time = 0;
        this.status = 'pending';
        this.bets = [];
        this.odds = this.calculateInitialOdds();
        this.lastUpdate = Date.now();
    }

    generateTeam() {
        const team = [];
        const numPlayers = 5;
        for (let i = 0; i < numPlayers; i++) {
            team.push(new AIPlayer({
                name: `AI Player ${i + 1}`
            }));
        }
        return ProtectionUtils.encryptData(team);
    }

    calculateInitialOdds() {
        const team1Stats = this.getTeamStats(1);
        const team2Stats = this.getTeamStats(2);
        
        const total1 = team1Stats.reduce((sum, stat) => sum + stat, 0);
        const total2 = team2Stats.reduce((sum, stat) => sum + stat, 0);
        
        const odds = {
            team1: total2 / total1,
            team2: total1 / total2
        };
        
        return ProtectionUtils.encryptData(odds);
    }

    getTeamStats(teamNumber) {
        const team = teamNumber === 1 ? this.team1 : this.team2;
        const decryptedTeam = ProtectionUtils.decryptData(team);
        return decryptedTeam.map(player => {
            const stats = player.getDecryptedStats();
            return Object.values(stats).reduce((sum, stat) => sum + stat, 0);
        });
    }

    placeBet(userId, amount, teamNumber) {
        const bet = {
            userId,
            amount,
            teamNumber,
            timestamp: Date.now()
        };
        
        this.bets.push(ProtectionUtils.encryptData(bet));
        this.updateOdds();
    }

    updateOdds() {
        const decryptedBets = this.bets.map(bet => ProtectionUtils.decryptData(bet));
        const team1Bets = decryptedBets.filter(bet => bet.teamNumber === 1)
            .reduce((sum, bet) => sum + bet.amount, 0);
        const team2Bets = decryptedBets.filter(bet => bet.teamNumber === 2)
            .reduce((sum, bet) => sum + bet.amount, 0);
        
        const odds = {
            team1: team2Bets / (team1Bets || 1),
            team2: team1Bets / (team2Bets || 1)
        };
        
        this.odds = ProtectionUtils.encryptData(odds);
    }

    start() {
        this.status = 'in_progress';
        this.simulateMatch();
    }

    simulateMatch() {
        const matchDuration = 90 * 60; // 90 minutes in seconds
        const updateInterval = 1000; // 1 second
        
        const simulation = setInterval(() => {
            if (this.time >= matchDuration) {
                clearInterval(simulation);
                this.endMatch();
                return;
            }
            
            this.time += 1;
            this.updateMatchState();
        }, updateInterval);
    }

    updateMatchState() {
        const currentTime = Date.now();
        if (currentTime - this.lastUpdate >= 1000) {
            this.lastUpdate = currentTime;
            this.simulateTeamActions();
        }
    }

    simulateTeamActions() {
        const team1 = ProtectionUtils.decryptData(this.team1);
        const team2 = ProtectionUtils.decryptData(this.team2);
        
        team1.forEach(player => player.update(1));
        team2.forEach(player => player.update(1));
        
        this.team1 = ProtectionUtils.encryptData(team1);
        this.team2 = ProtectionUtils.encryptData(team2);
    }

    endMatch() {
        this.status = 'completed';
        this.processBets();
    }

    processBets() {
        const decryptedBets = this.bets.map(bet => ProtectionUtils.decryptData(bet));
        const winningTeam = this.score.team1 > this.score.team2 ? 1 : 2;
        
        decryptedBets.forEach(bet => {
            if (bet.teamNumber === winningTeam) {
                const odds = ProtectionUtils.decryptData(this.odds);
                const winnings = bet.amount * odds[`team${bet.teamNumber}`];
                // Process winnings through currency system
            }
        });
    }

    getMatchState() {
        return {
            id: this.id,
            score: this.score,
            time: this.time,
            status: this.status,
            odds: ProtectionUtils.decryptData(this.odds)
        };
    }
}

type('string')(AIMatch.prototype, 'id');
type('object')(AIMatch.prototype, 'team1');
type('object')(AIMatch.prototype, 'team2');
type('object')(AIMatch.prototype, 'score');
type('number')(AIMatch.prototype, 'time');
type('string')(AIMatch.prototype, 'status');
type('array')(AIMatch.prototype, 'bets');
type('object')(AIMatch.prototype, 'odds');
type('number')(AIMatch.prototype, 'lastUpdate'); 
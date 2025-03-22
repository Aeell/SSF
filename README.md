# Super Slam Football (SSF)

A 6v6 football game with unique abilities, blending FIFA-like gameplay with over-the-top effects and strategic depth.

## Features

- Fast-paced 6v6 football matches
- Unique player abilities for each role (Attackers, Defenders, Goalkeeper)
- Real-time multiplayer support
- Cross-platform compatibility (Browser and Mobile)
- Beautiful 3D graphics with Three.js
- Physics-based gameplay with Cannon.js
- Responsive controls and UI

## Game Modes

- Fun Mode: Casual 6v6 matches
- League/Tournaments: Competitive brackets with leaderboards
- Practice Mode: Single-player vs. AI

## Player Roles & Abilities

### Attackers (3)
- Jiggle: 75% chance to dodge
- Power Shot: Charge for 6 seconds, high-speed shot with knockback
- Meteor Strike: Ultimate ability (10 passes to charge)

### Defenders (2)
- Shield: Defensive barrier
- Hook: Pull opponents
- Tackle: Ball-stealing ability

### Goalkeeper (1)
- Energy Wall: Defensive barrier
- Super Save: Enhanced save ability
- Clear: Strong kick to clear the ball

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/super-slam-football.git
cd super-slam-football
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Start the client development server:
```bash
npm run client
```

5. Open your browser and navigate to `http://localhost:3000`

## Development

### Project Structure

```
src/
├── client/
│   ├── game/
│   │   ├── Game.js
│   │   ├── Player.js
│   │   ├── Ball.js
│   │   ├── Field.js
│   │   ├── Team.js
│   │   └── abilities/
│   │       └── Ability.js
│   ├── network/
│   │   └── NetworkManager.js
│   ├── styles/
│   │   └── main.css
│   ├── index.html
│   └── index.js
└── server/
    └── index.js
```

### Available Scripts

- `npm start`: Start the production server
- `npm run dev`: Start the development server with hot reloading
- `npm run client`: Start the client development server
- `npm run build`: Build the client for production
- `npm test`: Run tests

## Controls

- WASD/Arrow Keys: Move player
- Tab: Switch between players
- 1-3: Activate abilities
- Space: Sprint
- Mouse: Camera control

## Technologies Used

- Three.js: 3D graphics
- Cannon.js: Physics engine
- Socket.IO: Real-time multiplayer
- Express: Server framework
- Webpack: Build tool

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Acknowledgments

- Inspired by Sega Soccer Slam (2002)
- FIFA series for gameplay mechanics
- League of Legends and Dota 2 for ability system inspiration 
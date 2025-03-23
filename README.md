# Super Slam Football

A multiplayer football game with special abilities, built using Three.js and Cannon.js.

## Features

- Real-time multiplayer gameplay
- Physics-based ball and player interactions
- Dynamic camera system
- Goal detection and scoring
- Special abilities (coming soon)

## Tech Stack

- Three.js for 3D graphics
- Cannon.js for physics simulation
- Colyseus.js for multiplayer networking
- Vite for build and development
- Node.js for server runtime

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

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

## Development

Start the development server:
```bash
npm run dev
```

The game will be available at `http://localhost:3000`

## Building for Production

Build the project:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Controls

- WASD: Move player
- Space: Jump
- Mouse: Look around (coming soon)
- Special abilities (coming soon)

## Project Structure

```
src/
├── client/          # Client-side code
│   ├── core/       # Core game engine
│   ├── entities/   # Game entities
│   ├── assets/     # Game assets
│   └── utils/      # Utility functions
└── server/         # Server-side code
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Three.js team for the amazing 3D graphics library
- Cannon.js team for the physics engine
- Colyseus.js team for the multiplayer framework 
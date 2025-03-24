# Super Slam Football (SSF)

A multiplayer football game with special abilities, built with Three.js and Cannon.js.

## Features

### Core Game Features
- Real-time multiplayer football gameplay
- Special abilities system with unique player powers
- Physics-based ball and player movement
- Modern UI with ability cooldowns and status indicators
- Mobile-friendly controls

### Technical Features
- TypeScript for type safety
- Three.js for 3D graphics
- Cannon.js for physics simulation
- Jest for comprehensive testing
- Performance monitoring and error tracking
- Real-time logging system

## Project Structure

```
src/
├── client/           # Client-side code
│   ├── components/   # React components
│   ├── game/        # Game logic
│   │   ├── abilities/  # Special abilities
│   │   ├── entities/   # Game entities (Player, Ball)
│   │   ├── physics/    # Physics system
│   │   └── ui/        # UI components
│   └── utils/       # Utility functions
├── server/          # Server-side code
└── shared/          # Shared code between client and server
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Modern web browser

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Aeell/SSF.git
cd SSF
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run linter
- `npm run format` - Format code with Prettier

### Testing
The project uses Jest for testing. Tests are located in `__tests__` directories throughout the codebase.

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Code Style
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting

## Game Features

### Special Abilities
1. Speed Boost
   - Temporarily increases player movement speed
   - Cooldown: 5 seconds
   - Duration: 2 seconds

2. Power Kick
   - Increases ball kick force
   - Cooldown: 3 seconds
   - Duration: 1 second

3. Shield
   - Provides temporary invincibility
   - Cooldown: 10 seconds
   - Duration: 3 seconds

### Controls
- WASD - Player movement
- Space - Jump
- Q - Speed Boost
- E - Power Kick
- R - Shield

### Mobile Controls
- Virtual joystick for movement
- Touch buttons for abilities
- Swipe for camera control

## Performance Monitoring

The game includes a sophisticated performance monitoring system that tracks:
- FPS (Frames Per Second)
- Memory usage
- Network latency
- Error rates
- Player statistics

Access the debug panel in-game by clicking the "Show Debug Panel" button.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Three.js for 3D graphics
- Cannon.js for physics simulation
- Jest for testing framework
- React for UI components

## Support

For support, please open an issue in the GitHub repository or contact the maintainers. 
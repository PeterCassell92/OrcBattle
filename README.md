# Orcs Battle Game 🏰⚔️

A Phaser 3 battle simulation game for **deciding 50:50 outcomes through epic orc combat**! 

Instead of flipping a coin, watch two orc armies clash in strategic warfare complete with kings, fireballs, berserkers, and victory ceremonies. Each battle is designed to be roughly balanced while providing entertaining visual spectacle.

## 🎮 Play the Game

[![Play OrcBattle](https://img.shields.io/badge/▶️_Play_Now-Game_Repository-red?style=for-the-badge&logo=github)](https://github.com/PeterCassell92/OrcBattle)

> **To play**: Clone the repository and open `Orcs.html` in your browser, or see the [Running the Game](#running-the-game-🚀) section below.

## Project Philosophy 📋

This project demonstrates **good JavaScript practices** for game development:
- **Small, focused files** - Each file has a single responsibility for easy AI parsing
- **Modular architecture** - Components are composable and reusable
- **Clean separation** - Game logic, rendering, and data are properly separated
- **Consistent patterns** - Similar structures across all modules

## Project Structure
```
gamelogic/
├── main.js             # Entry point and game initialization
├── setup.js            # Game configuration and user settings
├── battlescene/        # Main battle scene and components
│   ├── battlescene.js  # Core game loops and scene management
│   ├── index.js        # Composite scene assembly from modules
│   ├── king/           # King behavior and fireball combat
│   │   ├── king.js     # King class with marching and combat
│   │   └── fireball.js # Fireball projectile with arc physics
│   ├── phases/         # Game phase management (modular)
│   │   ├── initial-phases.js    # Ceasefire and cover firer phases
│   │   ├── king-release-phase.js # Kings enter battlefield
│   │   ├── berserker-phase.js   # Berserker trio activation
│   │   └── victory-phase.js     # Victory ceremony and celebration
│   ├── collisions.js   # Collision detection and handling
│   ├── effects.js      # Visual effects and animations
│   └── knockback.js    # Physics knockback effects
├── orc/                # Orc classes and AI behavior
│   ├── index.js        # Composite orc assembly
│   ├── orc.js          # Main orc class
│   ├── orc-behaviour.js # AI movement and combat logic
│   └── orc-dialog.js   # Speech and communication system
├── sprites/            # Sprite generation and management
│   ├── spriteGenerator.js # Procedural sprite creation
│   ├── bloodstain.js   # Persistent battle aftermath
│   ├── rock.js         # Destructible rock terrain
│   └── block.js        # Destructible block terrain
└── dialogUI/           # User interface components
    └── speechbubble.js # Dynamic speech bubble system
```

## Game Features 🎮

### Battle Phases
1. **Ceasefire** - Initial pause before combat begins
2. **Laser Battle** - Cover firers provide ranged support
3. **Royal March** - Kings enter the battlefield with fireballs
4. **Berserker Phase** - Losing team gets powerful berserkers
5. **Victory Ceremony** - Winning team celebrates with speeches

### Combat Mechanics
- **Balanced RNG** - Carefully tuned for ~50:50 outcomes
- **Strategic AI** - Orcs use cover, advance tactically
- **Environmental destruction** - Terrain can be destroyed
- **Visual effects** - Explosions, fire, bloodstains, particles

## Setup for Development 🛠️

### Prerequisites
- Node.js (for ESLint and Prettier)
- VS Code with recommended extensions

### Getting Started
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Open in VS Code for best development experience

### VS Code Extensions (Recommended)
- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)

### Code Quality Commands
```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix

# Format code with Prettier
npm run format

# Check if code is properly formatted
npm run format:check
```

## Development Guidelines 📝

### Code Quality
- **Code auto-formats** on save in VS Code
- **ESLint shows errors** and warnings in real-time
- **Fix ESLint errors** before committing
- **Small files preferred** - easier for AI tools to parse and understand

### JavaScript Best Practices
- Use `const` over `let`, avoid `var`
- Always use `===` instead of `==`
- Keep functions focused and single-purpose
- Use descriptive variable and function names
- Add comments for complex game logic

### File Organization
- **One class per file** when possible
- **Modular exports** - use named exports for clarity
- **Consistent structure** across similar files
- **Logical grouping** - related functionality stays together

## Running the Game 🚀
Open `Orcs.html` in a browser or use a local server.

## Running the Game in Mac/Linux
- Make sure have done steps as above (clone, npm install)
- Make 'start-server.sh' executable with command:  chmod +x start-server.sh
- Run 'start-server.sh' with command: ./start_server.sh
- Go to 'http://localhost:8000/Orcs.html' in browser

## Production Build 🏢

### Prerequisites for Building
```bash
# Install build dependencies
npm install rollup archiver --save-dev
```

### Creating Production Build
```bash
# Build production-ready bundle
npm run build:prod
```

### Build Output
The build script creates:
- `deployment/dist/` - Ready-to-deploy files
- `deployment/dist/orc_build.zip` - Deployment package

### Build Features
- ⚙️ **Rollup bundling** - All modules crushed into single `main.js`
- 📦 **ZIP packaging** - Ready for deployment
- 🧼 **Asset copying** - All images and resources included
- 🔧 **Config updates** - Web.config updated for production
- 🗜️ **Clean builds** - Purges old builds automatically

### Deployment
1. Run `npm run build:prod`
2. Extract `orc_build.zip` to your web server
3. Ensure server serves `index.html` as default document


## Contributing 🤝
This project is designed for **team collaboration** with developers of varying experience levels. The modular structure and linting setup help maintain code quality while teaching good JavaScript practices.

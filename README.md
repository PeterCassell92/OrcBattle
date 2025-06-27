# Orcs Battle Game 🏰⚔️

A Phaser 3 battle simulation game featuring orc armies, kings, and epic fireball combat!

## Setup for Development

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

### Development Guidelines
- Code will auto-format on save in VS Code
- ESLint will show errors and warnings in real-time
- Fix ESLint errors before committing
- Use `console.log` sparingly (will show warnings)
- Prefer `const` over `let`, avoid `var`
- Always use `===` instead of `==`

### Project Structure
```
gamelogic/
├── battlescene/        # Main battle scene and components
│   ├── king/          # King class and fireball logic
│   ├── phases/        # Game phases (victory, berserker, etc.)
│   └── index.js       # Scene assembly
├── orc/               # Orc classes and behavior
├── sprites/           # Sprite generation and management
└── main.js            # Entry point
```

## Running the Game
Open `Orcs.html` in a browser or use a local server.

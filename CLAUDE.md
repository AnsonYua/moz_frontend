# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based Trading Card Game frontend for "Revolution and Rebellion" using Phaser 3. The game features strategic card placement mechanics where leaders summon characters to compete based on power and combinations rather than direct combat.

## Technical Stack

- **Phaser 3** - Primary game engine
- **HTML5/CSS3/JavaScript (ES6+)** - Core web technologies  
- **Webpack/Vite** - Build system (to be determined based on setup)
- **ESLint/Prettier** - Code quality tools
- Modern browser support (Chrome, Firefox, Safari, Edge)

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Code quality checks
npm run lint
npm run format
```

## Project Architecture

### Scene Structure
The game uses Phaser 3 scenes organized as follows:

1. **MenuScene** - Main menu, game creation, lobby
2. **GameScene** - Core gameplay interface and interactions
3. **CardSelectionScene** - Modal overlay for card selection workflows
4. **BattleResultScene** - Battle results, victory points, round progression
5. **GameOverScene** - Final victory screen and game statistics
6. **PreloaderScene** - Asset loading with progress bar

### Directory Structure (Planned)
```
src/
├── scenes/           # Phaser scene classes
├── components/       # Reusable UI components  
├── managers/         # Game state and API managers
├── utils/           # Helper functions and utilities
├── assets/          # Images, audio, fonts
├── config/          # Game configuration
└── main.js          # Application entry point
```

### Game State Management
The application maintains a comprehensive game state object:

```javascript
gameState = {
  gameId: string,
  playerId: string,
  playerName: string,
  gameEnv: {
    phase: string,           // Current game phase
    currentPlayer: string,   // Active player ID
    players: {},            // Player data and hands
    zones: {},              // Card placement zones
    gameEvents: [],         // Unprocessed events
    pendingCardSelections: {}, // Card selection workflows
    victoryPoints: {},      // Current VP totals
    round: number           // Current round/leader
  },
  uiState: {
    selectedCard: null,
    hoveredZone: null,
    showingCardDetails: false,
    pendingAction: null
  }
}
```

## Backend Integration

### API Endpoints
The frontend integrates with these backend endpoints:

**Game Management:**
- `POST /game/create`
- `GET /game/:gameId`
- `POST /player/startGame`
- `POST /player/startReady`

**Gameplay Actions:**
- `POST /player/playerAction`
- `POST /player/selectCard`
- `POST /player/acknowledgeEvents`
- `GET /player/:playerId`

**Battle Progression:**
- `POST /player/nextRound`

### Event System
- Poll `GET /player/:playerId?gameId=X` every 1 second
- Process events from `gameEnv.gameEvents` array
- Call `POST /player/acknowledgeEvents` to mark events processed
- Handle extensive event types (30+ different event types including GAME_STARTED, CARD_PLAYED, BATTLE_CALCULATED, etc.)

## Game Mechanics Implementation

### Card System
- **Card Types**: Character (blue), Help (green), SP (purple), Leader (gold)
- **Zones**: TOP, LEFT, RIGHT, HELP zones for each player
- **Face-down Mechanics**: Strategic placement with right-click toggle
- **Drag-and-Drop**: Complete system with validation and visual feedback

### Phase Flow
1. **Main Phase**: Card placement from hand to zones
2. **SP Phase**: Face-down SP cards with auto-reveal
3. **Battle Phase**: Power calculation and combo resolution
4. **Round Progression**: 4 leaders with victory point tracking

### UI Layout
The game features a complex board layout with opponent zones at top, battle area in center, player zones at bottom, and hand display below the main board.

## Key Implementation Notes

- **Responsive Design**: Desktop primary (1920x1080), tablet support (1024x768)
- **Performance**: Maintain 60 FPS, efficient memory management
- **Error Handling**: Comprehensive error recovery and user feedback
- **Asset Management**: Dynamic card loading with fallback images
- **Animation System**: Smooth transitions for all game actions

## Testing Approach

Focus on:
- Complete game flow testing from menu to victory
- Error scenario handling and recovery
- Multi-browser compatibility
- Network disconnection handling
- Edge cases with unusual card combinations

## Development Priorities

1. **Core Game Board**: Implement main game scene with zones and basic card display
2. **Drag-and-Drop System**: Complete card interaction mechanics
3. **Backend Integration**: API communication and event polling
4. **Card Selection Workflows**: Modal interfaces for card selection
5. **Battle Resolution**: Power calculation and victory point system
6. **Visual Polish**: Animations, effects, and responsive design
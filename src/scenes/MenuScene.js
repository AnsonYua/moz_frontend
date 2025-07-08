import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig.js';
import GameStateManager from '../managers/GameStateManager.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
    this.gameStateManager = new GameStateManager();
  }

  create() {
    this.createBackground();
    this.createTitle();
    this.createMenuUI();
  }

  createBackground() {
    const { width, height } = this.cameras.main;
    
    // Create gradient background
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    graphics.fillRect(0, 0, width, height);
    
    // Add decorative elements
    
    for (let i = 0; i < 20; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 3),
        0xffffff,
        0.3
      );
      
      this.tweens.add({
        targets: star,
        alpha: { from: 0.3, to: 0.8 },
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1
      });
    }
  }

  createTitle() {
    const { width, height } = this.cameras.main;
    
    const title = this.add.text(width / 2, height / 4, 'REVOLUTION\n& REBELLION', {
      fontSize: '64px',
      fontFamily: 'Arial',
      fill: '#ffffff',
      align: 'center',
      stroke: GAME_CONFIG.colors.highlight,
      strokeThickness: 2
    });
    title.setOrigin(0.5);
    
    const subtitle = this.add.text(width / 2, height / 4 + 120, 'Trading Card Game', {
      fontSize: '24px',
      fontFamily: 'Arial',
      fill: '#cccccc',
      align: 'center'
    });
    subtitle.setOrigin(0.5);
    
    // Animate title
    this.tweens.add({
      targets: title,
      scaleX: { from: 1, to: 1.05 },
      scaleY: { from: 1, to: 1.05 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  createMenuUI() {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const startY = height / 2 + 50;
    
    // Player name input
    this.createPlayerNameInput(centerX, startY);
    
    // Menu buttons
    this.createButton(centerX, startY + 100, 'Create Game', () => this.createGame());
    this.createButton(centerX, startY + 170, 'Join Game', () => this.showJoinGameInput());
    this.createButton(centerX, startY + 240, 'Demo Mode', () => this.startDemo());
    
    // Instructions
    const instructions = this.add.text(centerX, height - 100, 
      'Enter your name and create or join a game to begin', {
      fontSize: '16px',
      fontFamily: 'Arial',
      fill: '#888888',
      align: 'center'
    });
    instructions.setOrigin(0.5);
  }

  createPlayerNameInput(x, y) {
    // Create input background
    const inputBg = this.add.graphics();
    inputBg.fillStyle(0x333333);
    inputBg.fillRoundedRect(x - 150, y - 25, 300, 50, 8);
    inputBg.lineStyle(2, 0x555555);
    inputBg.strokeRoundedRect(x - 150, y - 25, 300, 50, 8);
    
    // Label
    const label = this.add.text(x, y - 60, 'Player Name:', {
      fontSize: '18px',
      fontFamily: 'Arial',
      fill: '#ffffff'
    });
    label.setOrigin(0.5);
    
    // Placeholder text
    this.playerNameText = this.add.text(x, y, 'Click to enter name...', {
      fontSize: '16px',
      fontFamily: 'Arial',
      fill: '#888888'
    });
    this.playerNameText.setOrigin(0.5);
    
    // Make input interactive
    const inputZone = this.add.zone(x, y, 300, 50);
    inputZone.setInteractive();
    inputZone.on('pointerdown', () => this.showNameInput());
    
    this.playerName = '';
  }

  createButton(x, y, text, callback) {
    const button = this.add.image(x, y, 'button');
    button.setInteractive();
    
    const buttonText = this.add.text(x, y, text, {
      fontSize: '18px',
      fontFamily: 'Arial',
      fill: '#ffffff'
    });
    buttonText.setOrigin(0.5);
    
    button.on('pointerover', () => {
      button.setTint(0xcccccc);
      this.game.canvas.style.cursor = 'pointer';
    });
    
    button.on('pointerout', () => {
      button.clearTint();
      this.game.canvas.style.cursor = 'default';
    });
    
    button.on('pointerdown', callback);
    
    return { button, text: buttonText };
  }

  showNameInput() {
    const name = prompt('Enter your player name:');
    if (name && name.trim()) {
      this.playerName = name.trim();
      this.playerNameText.setText(this.playerName);
      this.playerNameText.setStyle({ fill: '#ffffff' });
    }
  }

  createGame() {
    if (!this.playerName) {
      alert('Please enter your name first');
      return;
    }
    
    // For demo purposes, create a mock game
    const gameId = 'demo_' + Date.now();
    const playerId = 'player_' + Date.now();
    
    this.gameStateManager.initializeGame(gameId, playerId, this.playerName);
    
    // Set up demo game state
    this.setupDemoGameState();
    
    // Pass the game state manager to the game scene
    this.scene.start('GameScene', { gameStateManager: this.gameStateManager });
  }

  showJoinGameInput() {
    if (!this.playerName) {
      alert('Please enter your name first');
      return;
    }
    
    const gameId = prompt('Enter Game ID:');
    if (gameId && gameId.trim()) {
      // For demo purposes, join mock game
      const playerId = 'player_' + Date.now();
      this.gameStateManager.initializeGame(gameId.trim(), playerId, this.playerName);
      this.setupDemoGameState();
      this.scene.start('GameScene', { gameStateManager: this.gameStateManager });
    }
  }

  startDemo() {
    // Start demo with preset name
    this.playerName = 'Demo Player';
    this.createGame();
  }

  setupDemoGameState() {
    // Create demo game state with sample data
    const opponentId = 'opponent_demo';
    const playerId = this.gameStateManager.getGameState().playerId;
    
    this.gameStateManager.updateGameEnv({
      phase: GAME_CONFIG.phases.MAIN,
      currentPlayer: playerId,
      players: {
        [playerId]: {
          name: this.playerName,
          hand: this.createDemoHand(),
          leader: { id: 'leader_1', name: 'Revolutionary Leader', power: 15 }
        },
        [opponentId]: {
          name: 'Opponent',
          hand: Array(5).fill().map((_, i) => ({ id: `opp_card_${i}`, faceDown: true })),
          leader: { id: 'leader_2', name: 'Imperial Commander', power: 18 }
        }
      },
      zones: {
        [playerId]: {
          top: null,
          left: null,
          right: null,
          help: null,
          sp: null
        },
        [opponentId]: {
          top: null,
          left: null,
          right: null,
          help: null,
          sp: null
        }
      },
      victoryPoints: {
        [playerId]: 0,
        [opponentId]: 0
      },
      round: 1
    });
  }

  createDemoHand() {
    return [
      { id: 'char_1', name: 'Revolutionary Fighter', type: 'character', power: 8, zones: ['top', 'left'] },
      { id: 'char_2', name: 'Rebel Strategist', type: 'character', power: 6, zones: ['right'] },
      { id: 'help_1', name: 'Supply Drop', type: 'help', effect: 'Draw 2 cards' },
      { id: 'char_3', name: 'Freedom Fighter', type: 'character', power: 7, zones: ['top', 'right'] },
      { id: 'sp_1', name: 'Revolution Spark', type: 'sp', effect: 'All characters +3 power' },
      { id: 'char_4', name: 'Guerrilla Warrior', type: 'character', power: 5, zones: ['left', 'right'] },
      { id: 'help_2', name: 'Strategic Planning', type: 'help', effect: 'Search deck for character' }
    ];
  }
}
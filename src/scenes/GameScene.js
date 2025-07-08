import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig.js';
import Card from '../components/Card.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    
    this.gameStateManager = null;
    this.playerHand = [];
    this.playerZones = {};
    this.opponentZones = {};
    this.selectedCard = null;
    this.draggedCard = null;
  }

  init(data) {
    this.gameStateManager = data.gameStateManager;
  }

  create() {
    this.createBackground();
    this.createGameBoard();
    this.createUI();
    this.setupEventListeners();
    this.playShuffleDeckAnimation();
  }

  createBackground() {
    const { width, height } = this.cameras.main;
    
    // Create gradient background
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x0f3460, 0x0f3460, 0x16213e, 0x16213e, 1);
    graphics.fillRect(0, 0, width, height);
    
    // Add table texture
    const tableGraphics = this.add.graphics();
    tableGraphics.fillStyle(0x2d5016);
    tableGraphics.fillRoundedRect(50, 100, width - 100, height - 200, 20);
    tableGraphics.lineStyle(4, 0x8b4513);
    tableGraphics.strokeRoundedRect(50, 100, width - 100, height - 200, 20);
  }

  createGameBoard() {
    const { width, height } = this.cameras.main;
    
    // Define layout positions
    this.layout = {
      // Opponent zones (top area)
      opponent: {
        top: { x: width * 0.25, y: height * 0.25 },
        left: { x: width * 0.35, y: height * 0.25 },
        right: { x: width * 0.45, y: height * 0.25 },
        help: { x: width * 0.55, y: height * 0.25 },
        sp: { x: width * 0.15, y: height * 0.4 }
      },
      // Player zones (bottom area)
      player: {
        top: { x: width * 0.25, y: height * 0.65 },
        left: { x: width * 0.35, y: height * 0.65 },
        right: { x: width * 0.45, y: height * 0.65 },
        help: { x: width * 0.55, y: height * 0.65 },
        sp: { x: width * 0.15, y: height * 0.55 }
      },
      // Battle area (center)
      battle: { x: width * 0.5, y: height * 0.45 },
      // Hand area (bottom)
      hand: { x: width * 0.5, y: height * 0.85 }
    };
    
    this.createZones();
    this.createBattleArea();
  }

  createZones() {
    // Create opponent zones
    this.opponentZones = {};
    Object.entries(this.layout.opponent).forEach(([zoneType, position]) => {
      const zone = this.createZone(position.x, position.y, zoneType, false);
      this.opponentZones[zoneType] = zone;
    });
    
    // Create player zones
    this.playerZones = {};
    Object.entries(this.layout.player).forEach(([zoneType, position]) => {
      const zone = this.createZone(position.x, position.y, zoneType, true);
      this.playerZones[zoneType] = zone;
    });
    
    // Add zone labels
    this.addZoneLabels();
  }

  createZone(x, y, type, isPlayerZone) {
    // Zone placeholder
    const placeholder = this.add.image(x, y, 'zone-placeholder');
    
    // Zone label
    const label = this.add.text(x, y + 110, type.toUpperCase(), {
      fontSize: '12px',
      fontFamily: 'Arial',
      fill: '#ffffff',
      align: 'center'
    });
    label.setOrigin(0.5);
    
    // Zone interaction (only for player zones)
    if (isPlayerZone) {
      const dropZone = this.add.zone(x, y, 130, 190);
      dropZone.setRectangleDropZone(130, 190);
      dropZone.setData('zoneType', type);
      
      // Visual feedback for drop zones
      dropZone.on('dragenter', (pointer, gameObject) => {
        if (this.canDropCardInZone(gameObject, type)) {
          const highlight = this.add.image(x, y, 'zone-highlight');
          highlight.setTint(GAME_CONFIG.colors.success);
          dropZone.setData('highlight', highlight);
        }
      });
      
      dropZone.on('dragleave', () => {
        const highlight = dropZone.getData('highlight');
        if (highlight) {
          highlight.destroy();
          dropZone.setData('highlight', null);
        }
      });
      
      dropZone.on('drop', (pointer, gameObject) => {
        this.handleCardDrop(gameObject, type, x, y);
        const highlight = dropZone.getData('highlight');
        if (highlight) {
          highlight.destroy();
          dropZone.setData('highlight', null);
        }
      });
    }
    
    return {
      placeholder,
      label,
      x,
      y,
      card: null,
      type,
      isPlayerZone
    };
  }

  createBattleArea() {
    const { x, y } = this.layout.battle;
    
    // Battle area background
    const battleBg = this.add.graphics();
    battleBg.fillStyle(0x4a4a4a, 0.3);
    battleBg.fillRoundedRect(x - 200, y - 100, 400, 200, 10);
    battleBg.lineStyle(2, 0x888888);
    battleBg.strokeRoundedRect(x - 200, y - 100, 400, 200, 10);
    
    // Battle results display
    this.battleResultsText = this.add.text(x, y, 'Battle Area', {
      fontSize: '18px',
      fontFamily: 'Arial',
      fill: '#ffffff',
      align: 'center'
    });
    this.battleResultsText.setOrigin(0.5);
  }

  addZoneLabels() {
    const { width } = this.cameras.main;
    
    // Opponent area label
    this.add.text(width * 0.4, this.layout.opponent.top.y - 120, 'OPPONENT ZONES', {
      fontSize: '16px',
      fontFamily: 'Arial Bold',
      fill: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    
    // Player area label
    this.add.text(width * 0.4, this.layout.player.top.y - 120, 'YOUR ZONES', {
      fontSize: '16px',
      fontFamily: 'Arial Bold',
      fill: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
  }

  createUI() {
    const { width, height } = this.cameras.main;
    
    // Top UI bar
    this.createTopUI();
    
    // Phase indicator
    this.phaseText = this.add.text(width / 2, 50, 'MAIN PHASE', {
      fontSize: '24px',
      fontFamily: 'Arial Bold',
      fill: GAME_CONFIG.colors.highlight,
      align: 'center'
    });
    this.phaseText.setOrigin(0.5);
    
    // Action buttons
    this.createActionButtons();
    
    // Hand area
    this.createHandArea();
  }

  createTopUI() {
    const { width } = this.cameras.main;
    
    // Create UI background
    const uiBg = this.add.graphics();
    uiBg.fillStyle(0x000000, 0.7);
    uiBg.fillRect(0, 0, width, 100);
    
    // Player info (left side)
    const gameState = this.gameStateManager.getGameState();
    const player = this.gameStateManager.getPlayer();
    const opponent = this.gameStateManager.getOpponent();
    const opponentData = this.gameStateManager.getPlayer(opponent);
    
    this.playerInfoText = this.add.text(50, 25, `You: ${gameState.playerName}`, {
      fontSize: '16px',
      fontFamily: 'Arial',
      fill: '#ffffff'
    });
    
    this.playerVPText = this.add.text(50, 50, `VP: ${this.gameStateManager.getVictoryPoints()}`, {
      fontSize: '14px',
      fontFamily: 'Arial',
      fill: '#4CAF50'
    });
    
    this.playerHandText = this.add.text(50, 70, `Hand: ${player ? player.hand.length : 0}`, {
      fontSize: '14px',
      fontFamily: 'Arial',
      fill: '#ffffff'
    });
    
    // Opponent info (right side)
    this.opponentInfoText = this.add.text(width - 50, 25, `Opponent: ${opponentData ? opponentData.name : 'Unknown'}`, {
      fontSize: '16px',
      fontFamily: 'Arial',
      fill: '#ffffff'
    });
    this.opponentInfoText.setOrigin(1, 0);
    
    this.opponentVPText = this.add.text(width - 50, 50, `VP: ${this.gameStateManager.getVictoryPoints(opponent)}`, {
      fontSize: '14px',
      fontFamily: 'Arial',
      fill: '#FF5722'
    });
    this.opponentVPText.setOrigin(1, 0);
    
    this.opponentHandText = this.add.text(width - 50, 70, `Hand: ${opponentData ? opponentData.hand.length : 0}`, {
      fontSize: '14px',
      fontFamily: 'Arial',
      fill: '#ffffff'
    });
    this.opponentHandText.setOrigin(1, 0);
    
    // Round info (center)
    this.roundText = this.add.text(width / 2, 30, `Round ${this.gameStateManager.getCurrentRound()} / 4`, {
      fontSize: '18px',
      fontFamily: 'Arial Bold',
      fill: GAME_CONFIG.colors.highlight,
      align: 'center'
    });
    this.roundText.setOrigin(0.5);
  }

  createActionButtons() {
    const { width, height } = this.cameras.main;
    
    // End Turn button
    this.endTurnButton = this.add.image(width - 120, height - 60, 'button');
    this.endTurnButton.setScale(0.8);
    this.endTurnButton.setInteractive();
    
    const endTurnText = this.add.text(width - 120, height - 60, 'End Turn', {
      fontSize: '14px',
      fontFamily: 'Arial',
      fill: '#ffffff'
    });
    endTurnText.setOrigin(0.5);
    
    this.endTurnButton.on('pointerdown', () => this.endTurn());
    
    // Menu button
    this.menuButton = this.add.image(width - 220, height - 60, 'button');
    this.menuButton.setScale(0.8);
    this.menuButton.setInteractive();
    
    const menuText = this.add.text(width - 220, height - 60, 'Menu', {
      fontSize: '14px',
      fontFamily: 'Arial',
      fill: '#ffffff'
    });
    menuText.setOrigin(0.5);
    
    this.menuButton.on('pointerdown', () => this.openMenu());
  }

  createHandArea() {
    const { width, height } = this.cameras.main;
    
    // Hand background
    const handBg = this.add.graphics();
    handBg.fillStyle(0x000000, 0.5);
    handBg.fillRoundedRect(50, height - 220, width - 100, 170, 10);
    
    // Hand label
    this.add.text(width / 2, height - 210, 'YOUR HAND', {
      fontSize: '14px',
      fontFamily: 'Arial Bold',
      fill: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    
    this.handContainer = this.add.container(width / 2, height - 120);
  }

  setupEventListeners() {
    // Card interaction events
    this.events.on('card-select', (card) => {
      if (this.selectedCard && this.selectedCard !== card) {
        this.selectedCard.deselect();
      }
      this.selectedCard = card;
    });
    
    this.events.on('card-drag-start', (card) => {
      this.draggedCard = card;
    });
    
    this.events.on('card-drag-end', (card) => {
      this.draggedCard = null;
    });
  }

  updateGameState() {
    this.updatePlayerHand();
    this.updateZones();
    this.updateUI();
  }

  updatePlayerHand() {
    // Clear existing hand
    this.playerHand.forEach(card => card.destroy());
    this.playerHand = [];
    this.handContainer.removeAll();
    
    // Get hand from game state
    const hand = this.gameStateManager.getPlayerHand();
    if (!hand || hand.length === 0) return;
    
    // Calculate card positions
    const cardSpacing = Math.min(140, (this.cameras.main.width - 200) / hand.length);
    const startX = -(hand.length - 1) * cardSpacing / 2;
    
    // Create cards
    hand.forEach((cardData, index) => {
      const x = startX + (index * cardSpacing);
      const card = new Card(this, x, 0, cardData, {
        interactive: true,
        draggable: true,
        scale: 0.8
      });
      
      // Set up drag and drop
      this.input.setDraggable(card);
      
      this.playerHand.push(card);
      this.handContainer.add(card);
    });
  }

  updateZones() {
    const playerZones = this.gameStateManager.getPlayerZones();
    const opponentId = this.gameStateManager.getOpponent();
    const opponentZones = this.gameStateManager.getPlayerZones(opponentId);
    
    // Update player zones
    Object.entries(playerZones).forEach(([zoneType, cardData]) => {
      const zone = this.playerZones[zoneType];
      if (zone && cardData && !zone.card) {
        const card = new Card(this, zone.x, zone.y, cardData, {
          interactive: false,
          scale: 0.9
        });
        zone.card = card;
        zone.placeholder.setVisible(false);
      }
    });
    
    // Update opponent zones
    Object.entries(opponentZones).forEach(([zoneType, cardData]) => {
      const zone = this.opponentZones[zoneType];
      if (zone && cardData && !zone.card) {
        const card = new Card(this, zone.x, zone.y, cardData, {
          interactive: false,
          faceDown: cardData.faceDown || false,
          scale: 0.9
        });
        zone.card = card;
        zone.placeholder.setVisible(false);
      }
    });
  }

  updateUI() {
    const gameState = this.gameStateManager.getGameState();
    const player = this.gameStateManager.getPlayer();
    const opponent = this.gameStateManager.getOpponent();
    const opponentData = this.gameStateManager.getPlayer(opponent);
    
    // Update phase
    this.phaseText.setText(gameState.gameEnv.phase.toUpperCase() + ' PHASE');
    
    // Update round
    this.roundText.setText(`Round ${gameState.gameEnv.round} / 4`);
    
    // Update player info
    this.playerVPText.setText(`VP: ${this.gameStateManager.getVictoryPoints()}`);
    this.playerHandText.setText(`Hand: ${player ? player.hand.length : 0}`);
    
    // Update opponent info
    this.opponentVPText.setText(`VP: ${this.gameStateManager.getVictoryPoints(opponent)}`);
    this.opponentHandText.setText(`Hand: ${opponentData ? opponentData.hand.length : 0}`);
    
    // Update turn indicator
    const isCurrentPlayer = this.gameStateManager.isCurrentPlayer();
    this.endTurnButton.setTint(isCurrentPlayer ? 0xffffff : 0x888888);
  }

  canDropCardInZone(card, zoneType) {
    const cardData = card.getCardData();
    return card.canPlayInZone(zoneType);
  }

  handleCardDrop(card, zoneType, x, y) {
    if (this.canDropCardInZone(card, zoneType)) {
      // Move card to zone
      card.moveToPosition(x, y);
      card.options.draggable = false;
      
      // Update game state (this would normally be sent to server)
      this.playCardToZone(card.getCardData(), zoneType);
      
      // Remove from hand
      const handIndex = this.playerHand.indexOf(card);
      if (handIndex > -1) {
        this.playerHand.splice(handIndex, 1);
        this.handContainer.remove(card);
        this.reorganizeHand();
      }
      
      // Update zone
      const zone = this.playerZones[zoneType];
      if (zone) {
        zone.card = card;
        zone.placeholder.setVisible(false);
      }
    } else {
      // Return card to hand
      card.returnToOriginalPosition();
    }
  }

  playCardToZone(cardData, zoneType) {
    // This would normally make an API call to the backend
    console.log(`Playing card ${cardData.id} to ${zoneType} zone`);
    
    // For demo purposes, just update local state
    const gameState = this.gameStateManager.getGameState();
    const zones = { ...gameState.gameEnv.zones };
    if (!zones[gameState.playerId]) {
      zones[gameState.playerId] = {};
    }
    zones[gameState.playerId][zoneType] = cardData;
    
    this.gameStateManager.updateGameEnv({ zones });
  }

  reorganizeHand() {
    if (this.playerHand.length === 0) return;
    
    const cardSpacing = Math.min(140, (this.cameras.main.width - 200) / this.playerHand.length);
    const startX = -(this.playerHand.length - 1) * cardSpacing / 2;
    
    this.playerHand.forEach((card, index) => {
      const newX = startX + (index * cardSpacing);
      card.moveToPosition(newX, 0);
      card.originalPosition.x = newX;
    });
  }

  endTurn() {
    if (!this.gameStateManager.isCurrentPlayer()) {
      console.log('Not your turn');
      return;
    }
    
    console.log('Ending turn...');
    // This would normally make an API call to end the turn
  }

  openMenu() {
    // Return to menu scene
    this.scene.start('MenuScene');
  }

  playShuffleDeckAnimation() {
    const { width, height } = this.cameras.main;
    
    // Create deck position (bottom center)
    const deckX = width / 2;
    const deckY = height - 100;
    
    // Create multiple card backs to simulate a deck
    const deckCards = [];
    const numCards = 8;
    
    for (let i = 0; i < numCards; i++) {
      const card = this.add.image(deckX + (i * 2), deckY - (i * 1), 'card-back');
      card.setScale(0.6);
      card.setDepth(i);
      deckCards.push(card);
    }
    
    // Create shuffle animation
    const shufflePromises = [];
    
    deckCards.forEach((card, index) => {
      const delay = index * 100;
      
      // First movement - cards fly up and spread out
      const shufflePromise = new Promise((resolve) => {
        this.tweens.add({
          targets: card,
          x: deckX + (Math.random() - 0.5) * 200,
          y: deckY - 100 - (Math.random() * 50),
          rotation: (Math.random() - 0.5) * 0.5,
          duration: 300,
          delay: delay,
          ease: 'Power2.easeOut',
          onComplete: () => {
            // Second movement - cards come back together
            this.tweens.add({
              targets: card,
              x: deckX + (index * 2),
              y: deckY - (index * 1),
              rotation: 0,
              duration: 400,
              delay: 200,
              ease: 'Power2.easeInOut',
              onComplete: () => {
                if (index === deckCards.length - 1) {
                  // Animation complete, fade out deck and start game
                  this.tweens.add({
                    targets: deckCards,
                    alpha: 0,
                    duration: 300,
                    delay: 500,
                    onComplete: () => {
                      deckCards.forEach(card => card.destroy());
                      this.updateGameState();
                      resolve();
                    }
                  });
                }
              }
            });
          }
        });
      });
      
      shufflePromises.push(shufflePromise);
    });
    
    // Show shuffle text
    const shuffleText = this.add.text(width / 2, height / 2, 'Shuffling Deck...', {
      fontSize: '32px',
      fontFamily: 'Arial Bold',
      fill: '#ffffff',
      align: 'center'
    });
    shuffleText.setOrigin(0.5);
    shuffleText.setAlpha(0);
    
    // Animate shuffle text
    this.tweens.add({
      targets: shuffleText,
      alpha: 1,
      duration: 300,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        shuffleText.destroy();
      }
    });
    
    // Add shuffle sound effect (if available)
    if (this.sound.get('shuffle')) {
      this.sound.play('shuffle');
    }
  }
}
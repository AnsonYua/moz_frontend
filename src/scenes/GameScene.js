import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig.js';
import Card from '../components/Card.js';
import ShuffleAnimationManager from '../components/ShuffleAnimationManager.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    
    this.gameStateManager = null;
    this.playerHand = [];
    this.playerZones = {};
    this.opponentZones = {};
    this.selectedCard = null;
    this.draggedCard = null;
    this.shuffleAnimationManager = null;
    this.cardPreviewZone = null;
    this.previewCard = null;
    this.leaderCards = [];
  }

  init(data) {
    console.log('GameScene init called with data:', data);
    this.gameStateManager = data.gameStateManager;
  }

  async create() {
    console.log('GameScene create method called');
    this.createBackground();
    this.createGameBoard();
    this.createUI();
    this.setupEventListeners();
    
    // Load mock hand data but don't display cards yet
    await this.loadMockHandData();
    
    // Load leader cards data
    await this.loadLeaderCardsData();
    
    // Hide hand area during shuffling
    this.hideHandArea();
    
    // Initialize shuffle animation manager
    this.shuffleAnimationManager = new ShuffleAnimationManager(this);
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
    tableGraphics.fillRoundedRect(50, 50, width - 100, height - 140, 20);
    tableGraphics.lineStyle(4, 0x8b4513);
    tableGraphics.strokeRoundedRect(50, 50, width - 100, height - 140, 20);
  }

  createGameBoard() {
    console.log('createGameBoard called');
    const { width, height } = this.cameras.main;
    // card size 130x190
    // Define layout positions

    const startY = 45;
    const cardHeight = 160;
    this.layout = {
      functionalArea: {
        cardPreview: {
          x: width * 0.5 + 130 +  50 + 130 + 80 + 130 + 130 ,
          y: startY + 100+ cardHeight
        },
      },
      // Opponent zones (top area)
      opponent: {
        top: { x: width * 0.5, y:  startY + 100+ cardHeight + 10+ 15},
        left: { x:width * 0.5- 130- 50, y:  startY + 100+ cardHeight + 10+ 15},
        right: { x: width * 0.5 + 130 +  50, y:  startY + 100+ cardHeight + 10+ 15},
        help: { x: width * 0.5- 130- 50, y: startY + 100+ 0},
        sp: { x:  width * 0.5 + 130 +  50, y: startY + 100+ 0},
        leader: { x: width * 0.5, y: startY + 100+ 0},
        deck: { x: width * 0.5 - 130 -  50 - 130 - 50 , y: startY + 100+ cardHeight+10+15},
        leaderDeck: { x: width * 0.5 + 130 +  50 + 130 + 50 , y: startY + 100+ cardHeight+10+15},
        
      },
      // Player zones (bottom area)
      player: {
        top: { x: width * 0.5, y: startY + 100+ cardHeight + 10+ 15 +cardHeight + 70},
        left: { x: width * 0.5- 130- 50, y: startY + 100+ cardHeight + 10+ 15 +cardHeight + 70},
        right: { x: width * 0.5 + 130 +  50, y: startY + 100+ cardHeight + 10+ 15 +cardHeight + 70 },
        help: { x: width * 0.5- 130- 50, y: startY + 100+ cardHeight + 10+ 15 +cardHeight + 70 + cardHeight +30 },
        sp: { x: width * 0.5 + 130 +  50,y: startY + 100+ cardHeight + 10+ 15 +cardHeight + 70 + cardHeight +30 },
        leader: { x: width * 0.5, y: startY + 100+ cardHeight + 10+ 15 +cardHeight + 70 + cardHeight +30},
        deck: { x: width * 0.5 + 130 + 50+130+50 , y: startY + 100+ cardHeight + 10+ 15 +cardHeight + 70},
        leaderDeck: { x: width * 0.5 - 130 - 50 - 130 - 70 , y: startY + 100+ cardHeight + 10+ 15 +cardHeight + 70 + 50}
      },
      // Battle area (center)
      //battle: { x: width * 0.5, y: height * 0.45 },
      // Hand area (bottom)
      hand: { x: width * 0.5, y: height * 0.85 }
    };
    
    this.createZones();
    //this.createBattleArea();
  }

  createZones() {
    
    // Create opponent zones
    this.opponentZones = {};
    console.log('About to iterate over opponent zones');
    const opponentEntries = Object.entries(this.layout.opponent);
    console.log('Opponent entries:', opponentEntries);
    opponentEntries.forEach(([zoneType, position]) => {
      console.log('Processing zone:', zoneType);
      const zone = this.createZone(position.x, position.y, zoneType, false);
      this.opponentZones[zoneType] = zone;
    });
    
    // Create player zones
    this.playerZones = {};
    Object.entries(this.layout.player).forEach(([zoneType, position]) => {
      const zone = this.createZone(position.x, position.y, zoneType, true);
      this.playerZones[zoneType] = zone;
    });

    Object.entries(this.layout.functionalArea).forEach(([zoneType, position]) => {
      const zone = this.createZone(position.x, position.y, zoneType, false);
      if (zoneType === 'cardPreview') {
        this.cardPreviewZone = zone;
      }
    });
    
    // Add zone labels
    this.addZoneLabels();
    
    // Create deck visualizations
    this.createDeckVisualizations();
  }
  
 
  createZone(x, y, type, isPlayerZone) {
    let placeholder;
    
    // Show deck cards for deck zones, placeholder for others
    if (type === 'deck') {
      // Create deck stack for initial display
      const initialDeckStack = this.createDeckStack(x, y, isPlayerZone ? 'player' : 'opponent');
      placeholder = initialDeckStack[0]; // Use the first card as the main placeholder reference
      
      // Store the initial deck stacks for later reference
      if (isPlayerZone) {
        this.initialPlayerDeckStack = initialDeckStack;
      } else {
        this.initialOpponentDeckStack = initialDeckStack;
      }
    } else if (type === 'cardPreview') {
      placeholder = this.add.image(x, y, 'zone-placeholder');
    } else if (type === 'leaderDeck') {
      // Create placeholder for leaderDeck zones
      placeholder = this.add.image(x, y, 'zone-placeholder');
    } else {
      // Zone placeholder for non-deck zones
      placeholder = this.add.image(x, y, 'zone-placeholder');
    }
    
    // Zone label
    const label = this.add.text(x, y + 95, type.toUpperCase(), {
      fontSize: '12px',
      fontFamily: 'Arial',
      fill: '#ffffff',
      align: 'center'
    });
    label.setOrigin(0.5);
    if(type === 'leaderDeck' ) {
      placeholder.setRotation(Math.PI / 2); // Rotate 90 degrees
      label.setAlpha(1); // Show the label
      label.setY(label.y - 20); // Move label up by 5 pixels
    }else if(type === 'cardPreview'){
      placeholder.setScale(3);
      label.setAlpha(0); 
    }else{
      label.setAlpha(1); // Show the label
    }
    
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
    /*
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
    */
  }

  createDeckVisualizations() {
    // Use the initial deck stacks created in createZone as the main deck stacks
    this.playerDeckStack = this.initialPlayerDeckStack || [];
    this.opponentDeckStack = this.initialOpponentDeckStack || [];
    
    // The initial deck stacks are already visible, so no need to hide them
  }

  createDeckStack(x, y, owner) {
    // Create a stack of card backs to represent the deck
    const numCards = 5;
    const stackOffset = 1;
    const deckCards = [];
    
    for (let i = 0; i < numCards; i++) {
      // Ensure pixel-perfect positioning
      const cardX = Math.round(x + (i * stackOffset));
      const cardY = Math.round(y - (i * stackOffset));
      const card = this.add.image(cardX, cardY, 'card-back');
      
      // Scale card to match our card config dimensions
      const scaleX = GAME_CONFIG.card.width / card.width;
      const scaleY = GAME_CONFIG.card.height / card.height;
      const scale = Math.min(scaleX, scaleY) * 0.95;
      card.setScale(scale);
      
      // Ensure crisp rendering
      card.setDepth(i);
      card.setOrigin(0.5, 0.5); // Center origin for crisp rendering
      
      deckCards.push(card);
      
      // Store reference for potential updates
      if (owner === 'player') {
        if (!this.playerDeckCards) this.playerDeckCards = [];
        this.playerDeckCards.push(card);
      } else {
        if (!this.opponentDeckCards) this.opponentDeckCards = [];
        this.opponentDeckCards.push(card);
      }
    }
    
    return deckCards;
  }

  createUI() {
    const { width, height } = this.cameras.main;
    
    // Top UI bar
    this.createTopUI();
    
    // Phase indicator
    this.phaseText = this.add.text(width / 2, 35, 'MAIN PHASE', {
      fontSize: '20px',
      fontFamily: 'Arial Bold',
      fill: '#ffffff',
      align: 'center'
    });
    this.phaseText.setOrigin(0.5);
    
    // Opponent hand count display
    this.createOpponentHandDisplay();
    
    // Action buttons
    this.createActionButtons();
    
    // Hand area
    this.createHandArea();
  }

  createTopUI() {
    const { width } = this.cameras.main;
    
    // Create UI background
    const uiBg = this.add.graphics();
    uiBg.fillStyle(0x000000, 0.5);
    uiBg.fillRect(0, 0, width, 50);
    
    // Player info (left side)
    const gameState = this.gameStateManager.getGameState();
    const player = this.gameStateManager.getPlayer();
    const opponent = this.gameStateManager.getOpponent();
    const opponentData = this.gameStateManager.getPlayer(opponent);
    
    this.playerInfoText = this.add.text(50, 5, `You: ${gameState.playerName}`, {
      fontSize: '16px',
      fontFamily: 'Arial',
      fill: '#ffffff'
    });
    
    this.playerVPText = this.add.text(-100, 30, `VP: ${this.gameStateManager.getVictoryPoints()}`, {
      fontSize: '14px',
      fontFamily: 'Arial',
      fill: '#4CAF50'
    });
    
    this.playerHandText = this.add.text(-100, 50, `Hand: ${player ? player.hand.length : 0}`, {
      fontSize: '14px',
      fontFamily: 'Arial',
      fill: '#ffffff'
    });
    
    // Opponent info (right side)
    this.opponentInfoText = this.add.text(width - 50, 5, `Opponent: ${opponentData ? opponentData.name : 'Unknown'}`, {
      fontSize: '16px',
      fontFamily: 'Arial',
      fill: '#ffffff'
    });
    this.opponentInfoText.setOrigin(1, 0);
    
    this.opponentVPText = this.add.text(width +1000, 30, `VP: ${this.gameStateManager.getVictoryPoints(opponent)}`, {
      fontSize: '14px',
      fontFamily: 'Arial',
      fill: '#FF5722'
    });
    this.opponentVPText.setOrigin(1, 0);
    
    this.opponentHandText = this.add.text(width+1000, 50, `Hand: ${opponentData ? opponentData.hand.length : 0}`, {
      fontSize: '14px',
      fontFamily: 'Arial',
      fill: '#ffffff'
    });
    this.opponentHandText.setOrigin(1, 0);
    
    // Round info (center)
    this.roundText = this.add.text(width / 2, 15, `Round ${this.gameStateManager.getCurrentRound()} / 4`, {
      fontSize: '18px',
      fontFamily: 'Arial Bold',
      fill: '#ffffff',
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
    this.menuButton = this.add.image( 0+130, height - 60, 'button');
    this.menuButton.setScale(0.8);
    this.menuButton.setInteractive();
    
    const menuText = this.add.text( 0+130, height - 60, 'Menu', {
      fontSize: '14px',
      fontFamily: 'Arial',
      fill: '#ffffff'
    });
    menuText.setOrigin(0.5);
    
    this.menuButton.on('pointerdown', () => this.openMenu());


    // button for testing
      this.testLeaderButton = this.add.image( 0+130, height - 120, 'button');
      this.testLeaderButton.setScale(0.8);
      this.testLeaderButton.setInteractive();
      
      const testLeaderButtonText = this.add.text( 0+130, height - 120, 'Test Leader', {
        fontSize: '14px',
        fontFamily: 'Arial',
        fill: '#ffffff'
      });
      testLeaderButtonText.setOrigin(0.5);
      
      this.testLeaderButton.on('pointerdown', () => this.selectLeaderCard());

    // Test Opponent Leader button
    this.testOpponentLeaderButton = this.add.image(0+130, height - 180, 'button');
    this.testOpponentLeaderButton.setScale(0.8);
    this.testOpponentLeaderButton.setInteractive();
    
    const testOpponentLeaderButtonText = this.add.text(0+130, height - 180, 'Test Opp Leader', {
      fontSize: '12px',
      fontFamily: 'Arial',
      fill: '#ffffff'
    });
    testOpponentLeaderButtonText.setOrigin(0.5);
    
    this.testOpponentLeaderButton.on('pointerdown', () => this.selectOpponentLeaderCard());

    // Test Add Card button
    this.testAddCardButton = this.add.image(0+130, height - 240, 'button');
    this.testAddCardButton.setScale(0.8);
    this.testAddCardButton.setInteractive();
    
    const testAddCardButtonText = this.add.text(0+130, height - 240, 'Test Add Card', {
      fontSize: '12px',
      fontFamily: 'Arial',
      fill: '#ffffff'
    });
    testAddCardButtonText.setOrigin(0.5);
    
    this.testAddCardButton.on('pointerdown', () => this.testAddCard());

  }

  createOpponentHandDisplay() {
    const { width, height } = this.cameras.main;
    
    // Position the display in the top-right area near opponent zones
    const displayX =  200;
    const displayY = 120;
    
    // Background for the display
    const displayBg = this.add.graphics();
    displayBg.fillStyle(0x000000, 0.7);
    displayBg.fillRoundedRect(displayX - 70, displayY - 20, 220, 45, 5);
    displayBg.lineStyle(2, 0x888888);
    displayBg.strokeRoundedRect(displayX - 70, displayY - 20, 220, 45, 5);
    
    // Label text
    this.opponentHandLabel = this.add.text(displayX+30, displayY, 'Opponent Hand:', {
      fontSize: '24px',
      fontFamily: 'Arial',
      fill: '#ffffff',
      align: 'center'
    });
    this.opponentHandLabel.setOrigin(0.5);
    
    // Count text
    this.opponentHandCountText = this.add.text(displayX+130, displayY +1 , '0', {
      fontSize: '25px',
      fontFamily: 'Arial Bold',
      fill: '#FFD700',
      align: 'center'
    });
    this.opponentHandCountText.setOrigin(0.5);
  }

  createHandArea() {
    const { width, height } = this.cameras.main;
    
    // Hand background
    const handBg = this.add.graphics();
    handBg.fillStyle(0x000000, 0);
    //fillRoundedRect(x, y, width, height, [radius])
    handBg.fillRoundedRect(50, height - 220, width - 100, 170, 10);
    
    // Hand label
    /*
    this.add.text(width / 2, height - 210, 'YOUR HAND', {
      fontSize: '14px',
      fontFamily: 'Arial Bold',
      fill: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    */
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
      // Hide preview when dragging starts
      this.hideCardPreview();
    });
    
    this.events.on('card-drag-end', (card) => {
      this.draggedCard = null;
    });
    
    // Card hover events for preview
    this.events.on('card-hover', (card) => {
      // Only show preview for hand cards (not dragging)
      if (!this.draggedCard && this.playerHand.includes(card)) {
        this.showCardPreview(card.getCardData());
      }
    });
    
    this.events.on('card-unhover', (card) => {
      // Hide preview when not hovering
      if (!this.draggedCard) {
        this.hideCardPreview();
      }
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
    console.log('updatePlayerHand - hand data:', JSON.stringify(hand));
    console.log('updatePlayerHand - hand length:', hand ? hand.length : 0);
    if (!hand || hand.length === 0) {
      console.log('No hand data found, returning early');
      return;
    }
    
    // Calculate card positions with larger spacing for bigger cards
    const cardSpacing = Math.min(160, (this.cameras.main.width - 200) / hand.length);
    const startX = -(hand.length - 1) * cardSpacing / 2;
    
    // Create cards
    hand.forEach((cardData, index) => {
      const x = startX + (index * cardSpacing);
      const card = new Card(this, x, 0, cardData, {
        interactive: true,
        draggable: true,
        scale: 1.15, // Match deck card scale
        usePreview: true // Use preview images for hand cards
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
    
    // Update opponent hand count display
    if (this.opponentHandCountText) {
      const opponentHandCount = opponentData ? opponentData.hand.length : 0;
      this.opponentHandCountText.setText(opponentHandCount.toString());
    }
    
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
    
    const cardSpacing = Math.min(160, (this.cameras.main.width - 200) / this.playerHand.length);
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
    // Hide the initial deck stacks during shuffle
    if (this.playerDeckStack) {
      this.playerDeckStack.forEach(card => card.setVisible(false));
    }
    if (this.opponentDeckStack) {
      this.opponentDeckStack.forEach(card => card.setVisible(false));
    }
    
    this.shuffleAnimationManager.playShuffleDeckAnimation(this.layout, () => {
      // Show deck stacks immediately to maintain deck visibility
      this.showDeckStacks();
      
      // Show hand area and update game state after shuffle animation completes
      this.showHandArea();
      this.updateGameState();
    });
  }


  async loadMockHandData() {
    try {
      console.log('Loading mock hand data...');
      const response = await fetch('/handCards.json');
      const mockData = await response.json();
      
      if (mockData.success) {
        console.log('Mock hand data loaded:', mockData.data);
        
        // Setup mock game state with hand cards
        this.gameStateManager.initializeGame('mock-game', mockData.data.playerId, 'Test Player');
        
        // Update game state with mock hand data
        this.gameStateManager.updateGameEnv({
          phase: GAME_CONFIG.phases.MAIN,
          currentPlayer: mockData.data.playerId,
          players: {
            [mockData.data.playerId]: {
              id: mockData.data.playerId,
              name: 'Test Player',
              hand: mockData.data.handCards
            }
          }
        });
        
        console.log('Mock game state setup complete');
        
        // Debug: Check if the game state was set correctly
        const gameState = this.gameStateManager.getGameState();
        console.log('Current game state:', gameState);
        console.log('Current player hand:', this.gameStateManager.getPlayerHand());
        
        // Don't update hand display yet - wait for shuffle animation to complete
      } else {
        console.error('Failed to load mock hand data');
      }
    } catch (error) {
      console.error('Error loading mock hand data:', error);
    }
  }

  showDeckStacks() {
    // Show the permanent deck stacks directly without animation
    this.playerDeckStack.forEach((card, index) => {
      card.setVisible(true);
      card.setAlpha(1); // Full opacity for crisp rendering
    });
    
    this.opponentDeckStack.forEach((card, index) => {
      card.setVisible(true);
      card.setAlpha(1); // Full opacity for crisp rendering
    });
  }

  hideHandArea() {
    // Hide the hand container during shuffling
    if (this.handContainer) {
      this.handContainer.setVisible(false);
    }
  }

  showHandArea() {
    // Show the hand container after shuffling
    if (this.handContainer) {
      this.handContainer.setVisible(true);
    }
  }

  showCardPreview(cardData) {
    // Remove existing preview card if any
    this.hideCardPreview();
    
    if (this.cardPreviewZone && cardData) {
      // Create a larger preview card using original (full-detail) images
      this.previewCard = new Card(this, this.cardPreviewZone.x, this.cardPreviewZone.y, cardData, {
        interactive: false,
        draggable: false,
        scale: 3.5, // Large scale for preview
        usePreview: false // Use original full-detail images for preview
      });
      
      // Set high depth to appear on top
      this.previewCard.setDepth(2000);
    }
  }

  hideCardPreview() {
    if (this.previewCard) {
      this.previewCard.destroy();
      this.previewCard = null;
    }
  }

  async loadLeaderCardsData() {
    try {
      console.log('Loading leader cards data...');
      const response = await fetch('/leaderCards.json');
      const mockData = await response.json();
      
      if (mockData.success) {
        console.log('Leader cards data loaded:', mockData.data);
        this.leaderCards = mockData.data.leaderCards;
        
        // Leader cards will be displayed during shuffle animation, not immediately
      } else {
        console.error('Failed to load leader cards data');
      }
    } catch (error) {
      console.error('Error loading leader cards data:', error);
    }
  }

  updateLeaderDecks() {
    // Update player leader deck
    const playerLeaderZone = this.playerZones.leaderDeck;
    if (playerLeaderZone && this.leaderCards.length > 0) {
      this.createLeaderDeckDisplay(playerLeaderZone, 'player');
    }
    
    // Update opponent leader deck
    const opponentLeaderZone = this.opponentZones.leaderDeck;
    if (opponentLeaderZone && this.leaderCards.length > 0) {
      this.createLeaderDeckDisplay(opponentLeaderZone, 'opponent');
    }
  }

  createLeaderDeckDisplay(zone, owner) {
    // Clear existing placeholder
    if (zone.placeholder) {
      zone.placeholder.destroy();
    }
    
    // Create a stack of leader cards (showing top card)
    const topCard = this.leaderCards[0]; // Show the first leader card on top
    const card = new Card(this, zone.x, zone.y, topCard, {
      interactive: true,
      draggable: false,
      scale: 0.9,
      usePreview: true // Use preview images for leader deck display
    });
    
    // Rotate the card 90 degrees to match the original leaderDeck orientation
    card.setRotation(Math.PI / 2);
    
    // Store the card in the zone
    zone.card = card;
    zone.placeholder = card; // Update placeholder reference
    
    console.log(`Created leader deck display for ${owner} with card:`, topCard.id);
  }

  selectLeaderCard() {
    // Get the player leader deck zone
    const playerLeaderDeckZone = this.playerZones.leaderDeck;
    const playerLeaderZone = this.playerZones.leader;
    
    if (!playerLeaderDeckZone || !playerLeaderZone) {
      console.log('Leader zones not found');
      return;
    }

    // Check if there are leader cards in the animation manager
    if (!this.shuffleAnimationManager || !this.shuffleAnimationManager.playerLeaderCards || this.shuffleAnimationManager.playerLeaderCards.length === 0) {
      console.log('No leader cards available in deck');
      return;
    }

    // Get the top card from the leader deck (first card in array - highest depth/position)
    const topCardIndex = 0;
    const topCard = this.shuffleAnimationManager.playerLeaderCards[topCardIndex];
    
    if (!topCard) {
      console.log('No top card found');
      return;
    }

    // Get the corresponding card data (the cards are in the same order as leaderCards array)
    const cardData = this.leaderCards[this.leaderCards.length - this.shuffleAnimationManager.playerLeaderCards.length];
    
    if (!cardData) {
      console.log('No card data found for top card');
      return;
    }

    console.log('Moving leader card to leader position:', cardData.name);

    // Animate the card moving to leader position and flipping
    this.tweens.add({
      targets: topCard,
      x: playerLeaderZone.x,
      y: playerLeaderZone.y,
      rotation: 0, // Remove the 90-degree rotation
      duration: 300,
      ease: 'Power2.easeInOut',
      onComplete: () => {
        // NOW remove the card from the leader deck array
        this.shuffleAnimationManager.playerLeaderCards.splice(topCardIndex, 1);

        // Destroy the old card back image
        topCard.destroy();
        if (topCard.borderGraphics) {
          topCard.borderGraphics.destroy();
        }

        // Create new card with actual leader card image (face up)
        const leaderCard = new Card(this, playerLeaderZone.x, playerLeaderZone.y, cardData, {
          interactive: true,
          draggable: false,
          scale: 0.9,
          usePreview: true // Use preview image for leader position
        });

        // Add hover events for preview
        leaderCard.on('pointerover', () => {
          this.showCardPreview(cardData);
        });
        
        leaderCard.on('pointerout', () => {
          this.hideCardPreview();
        });

        // Update the zone
        playerLeaderZone.card = leaderCard;
        if (playerLeaderZone.placeholder) {
          playerLeaderZone.placeholder.setVisible(false);
        }

        console.log(`Leader card ${cardData.name} placed in leader position`);

        // Move remaining cards forward to maintain top card position
        this.repositionLeaderDeckCards();
      }
    });
  }

  repositionLeaderDeckCards() {
    if (!this.shuffleAnimationManager || !this.shuffleAnimationManager.playerLeaderCards) {
      return;
    }

    const playerLeaderDeckZone = this.playerZones.leaderDeck;
    if (!playerLeaderDeckZone) {
      return;
    }

    // Get the target position for the top card (same as original leaderDeck position)
    const targetX = playerLeaderDeckZone.x;
    const targetY = playerLeaderDeckZone.y;

    // Animate remaining cards to their new positions
    this.shuffleAnimationManager.playerLeaderCards.forEach((card, index) => {
      // Calculate the new position based on the stacking offset
      const newX = targetX;
      const newY = targetY + (index * 30); // 30 pixel offset BELOW the leaderDeck position

      // Animate card to new position
      this.tweens.add({
        targets: card,
        x: newX,
        y: newY,
        duration: 150,
        ease: 'Power2.easeOut'
      });

      // Also animate the border graphics if they exist
      if (card.borderGraphics) {
        this.tweens.add({
          targets: card.borderGraphics,
          x: newX,
          y: newY,
          duration: 150,
          ease: 'Power2.easeOut'
        });
      }

      // Update depth to maintain proper stacking order
      card.setDepth(1000 + this.shuffleAnimationManager.playerLeaderCards.length - index);
    });
  }

  selectOpponentLeaderCard() {
    // Get the opponent leader deck zone
    const opponentLeaderDeckZone = this.opponentZones.leaderDeck;
    const opponentLeaderZone = this.opponentZones.leader;
    
    if (!opponentLeaderDeckZone || !opponentLeaderZone) {
      console.log('Opponent leader zones not found');
      return;
    }

    // Check if there are leader cards in the animation manager
    if (!this.shuffleAnimationManager || !this.shuffleAnimationManager.opponentLeaderCards || this.shuffleAnimationManager.opponentLeaderCards.length === 0) {
      console.log('No opponent leader cards available in deck');
      return;
    }

    // Get the top card from the opponent leader deck (first card in array - highest depth/position)
    const topCardIndex = 0;
    const topCard = this.shuffleAnimationManager.opponentLeaderCards[topCardIndex];
    
    if (!topCard) {
      console.log('No opponent top card found');
      return;
    }

    // Get the corresponding card data (the cards are in the same order as leaderCards array)
    const cardData = this.leaderCards[this.leaderCards.length - this.shuffleAnimationManager.opponentLeaderCards.length];
    
    if (!cardData) {
      console.log('No card data found for opponent top card');
      return;
    }

    console.log('Moving opponent leader card to leader position:', cardData.name);

    // Animate the card moving to opponent leader position and flipping
    this.tweens.add({
      targets: topCard,
      x: opponentLeaderZone.x,
      y: opponentLeaderZone.y,
      rotation: 0, // Remove the 90-degree rotation
      duration: 300,
      ease: 'Power2.easeInOut',
      onComplete: () => {
        // NOW remove the card from the opponent leader deck array
        this.shuffleAnimationManager.opponentLeaderCards.splice(topCardIndex, 1);

        // Destroy the old card back image
        topCard.destroy();
        if (topCard.borderGraphics) {
          topCard.borderGraphics.destroy();
        }

        // Create new card with actual leader card image (face up)
        const leaderCard = new Card(this, opponentLeaderZone.x, opponentLeaderZone.y, cardData, {
          interactive: true,
          draggable: false,
          scale: 0.9,
          usePreview: true // Use preview image for leader position
        });

        // Add hover events for preview
        leaderCard.on('pointerover', () => {
          this.showCardPreview(cardData);
        });
        
        leaderCard.on('pointerout', () => {
          this.hideCardPreview();
        });

        // Update the zone
        opponentLeaderZone.card = leaderCard;
        if (opponentLeaderZone.placeholder) {
          opponentLeaderZone.placeholder.setVisible(false);
        }

        console.log(`Opponent leader card ${cardData.name} placed in leader position`);

        // Move remaining cards forward to maintain top card position
        this.repositionOpponentLeaderDeckCards();
      }
    });
  }

  repositionOpponentLeaderDeckCards() {
    if (!this.shuffleAnimationManager || !this.shuffleAnimationManager.opponentLeaderCards) {
      return;
    }

    const opponentLeaderDeckZone = this.opponentZones.leaderDeck;
    if (!opponentLeaderDeckZone) {
      return;
    }

    // Get the target position for the top card (same as original opponent leaderDeck position)
    const targetX = opponentLeaderDeckZone.x;
    const targetY = opponentLeaderDeckZone.y;

    // Animate remaining cards to their new positions
    this.shuffleAnimationManager.opponentLeaderCards.forEach((card, index) => {
      // Calculate the new position based on the stacking offset (match original opponent positioning)
      const newX = targetX;
      const newY = targetY - (index * 30); // 30 pixel offset ABOVE the leaderDeck position (like original)

      // Animate card to new position
      this.tweens.add({
        targets: card,
        x: newX,
        y: newY,
        duration: 150,
        ease: 'Power2.easeOut'
      });

      // Also animate the border graphics if they exist
      if (card.borderGraphics) {
        this.tweens.add({
          targets: card.borderGraphics,
          x: newX,
          y: newY,
          duration: 150,
          ease: 'Power2.easeOut'
        });
      }

      // Update depth to maintain proper stacking order
      card.setDepth(1000 + this.shuffleAnimationManager.opponentLeaderCards.length - index);
    });
  }

  async testAddCard() {
    try {
      console.log('Loading add card data...');
      const response = await fetch('/addNewHand.json');
      const addCardData = await response.json();
      
      if (addCardData.success) {
        console.log('Add card data loaded:', addCardData.data);
        
        const { playerId, handCardsToAdd } = addCardData.data;
        const isPlayerTarget = playerId === 'player-1';
        
        console.log(`Adding ${handCardsToAdd.length} cards to ${isPlayerTarget ? 'player' : 'opponent'} hand`);
        
        if (isPlayerTarget) {
          // Add cards to player hand with animation
          this.addCardsToPlayerHand(handCardsToAdd);
        } else {
          // Add cards to opponent hand (update count display)
          this.addCardsToOpponentHand(handCardsToAdd);
        }
      } else {
        console.error('Failed to load add card data');
      }
    } catch (error) {
      console.error('Error loading add card data:', error);
    }
  }

  addCardsToPlayerHand(cardsToAdd) {
    // Get current game state to update
    const gameState = this.gameStateManager.getGameState();
    const player = this.gameStateManager.getPlayer();
    
    if (!player || !player.hand) {
      console.error('Player hand not found');
      return;
    }

    // Add cards to game state first
    const updatedHand = [...player.hand, ...cardsToAdd];
    
    // Update game state
    this.gameStateManager.updateGameEnv({
      players: {
        ...gameState.gameEnv.players,
        [gameState.playerId]: {
          ...player,
          hand: updatedHand
        }
      }
    });

    // Animate cards from deck to hand
    this.animateCardsFromDeckToHand(cardsToAdd);
  }

  addCardsToOpponentHand(cardsToAdd) {
    // Get current game state to update
    const gameState = this.gameStateManager.getGameState();
    const opponent = this.gameStateManager.getOpponent();
    const opponentData = this.gameStateManager.getPlayer(opponent);
    
    if (!opponentData || !opponentData.hand) {
      console.error('Opponent hand not found');
      return;
    }

    // Add cards to opponent's hand in game state
    const updatedOpponentHand = [...opponentData.hand, ...cardsToAdd];
    
    // Update game state
    this.gameStateManager.updateGameEnv({
      players: {
        ...gameState.gameEnv.players,
        [opponent]: {
          ...opponentData,
          hand: updatedOpponentHand
        }
      }
    });

    // Update UI to reflect new opponent hand count
    this.updateUI();
    
    console.log(`Added ${cardsToAdd.length} cards to opponent hand`);
  }

  animateCardsFromDeckToHand(cardsToAdd) {
    const playerDeckPosition = this.layout.player.deck;
    
    // Animate each new card sequentially with individual slide animations
    cardsToAdd.forEach((cardData, index) => {
      setTimeout(() => {
        // Create temporary card at deck position (card back)
        const tempCard = this.add.image(playerDeckPosition.x, playerDeckPosition.y, 'card-back');
        
        // Set the card to hand card size immediately
        const scaleX = GAME_CONFIG.card.width / tempCard.width;
        const scaleY = GAME_CONFIG.card.height / tempCard.height;
        const handScale = Math.min(scaleX, scaleY) * 0.95 * 1.15; // Match hand card scale
        tempCard.setScale(handScale);
        tempCard.setDepth(2000);
        
        // Calculate spacing for current hand size + this new card
        const currentHandLength = this.playerHand.length; // Current cards in hand
        const totalCards = currentHandLength + 1; // Including this new card
        const cardSpacing = Math.min(160, (this.cameras.main.width - 200) / totalCards);
        const startX = -(totalCards - 1) * cardSpacing / 2;
        const newCardX = startX + (currentHandLength * cardSpacing); // Position for new card
        
        // Convert to world coordinates
        const worldTargetX = this.handContainer.x + newCardX;
        const worldTargetY = this.handContainer.y;
        
        // Animate existing hand cards to slide left to make space for this card
        this.slideHandCardsLeft(totalCards, cardSpacing);
        
        // Animate new card from deck to hand position
        this.tweens.add({
          targets: tempCard,
          x: worldTargetX,
          y: worldTargetY,
          duration: 500,
          ease: 'Power2.easeOut',
          onComplete: () => {
            // Flip animation: card back to card face
            this.tweens.add({
              targets: tempCard,
              scaleX: 0, // Flip to invisible
              duration: 150,
              ease: 'Power2.easeIn',
              onComplete: () => {
                // Change to actual card image
                const cardKey = `${cardData.id}-preview`;
                tempCard.setTexture(cardKey);
                
                // Recalculate scale for the new texture to maintain consistent card size
                const newScaleX = GAME_CONFIG.card.width / tempCard.width;
                const newScaleY = GAME_CONFIG.card.height / tempCard.height;
                const newHandScale = Math.min(newScaleX, newScaleY) * 0.95 * 1.15;
                
                // Update Y scale to match the new texture
                tempCard.setScale(0, newHandScale);
                
                // Flip back to visible with correct scale
                this.tweens.add({
                  targets: tempCard,
                  scaleX: newHandScale, // Use properly calculated scale for new texture
                  duration: 150,
                  ease: 'Power2.easeOut',
                  onComplete: () => {
                    // Calculate position relative to hand container
                    const relativeX = tempCard.x - this.handContainer.x;
                    const relativeY = tempCard.y - this.handContainer.y;
                    
                    // Convert temporary card to actual hand card
                    const newCard = new Card(this, relativeX, relativeY, cardData, {
                      interactive: true,
                      draggable: true,
                      scale: 1.15,
                      usePreview: true
                    });
                    
                    // Set up drag and drop
                    this.input.setDraggable(newCard);
                    
                    // Add to hand array and container
                    this.playerHand.push(newCard);
                    this.handContainer.add(newCard);
                    
                    // Update original position for drag/drop
                    newCard.originalPosition.x = relativeX;
                    newCard.originalPosition.y = relativeY;
                    
                    // Set proper depth
                    newCard.setDepth(100);
                    
                    // Destroy temporary card
                    tempCard.destroy();
                    
                    console.log(`Card ${cardData.id} added to hand at position ${this.playerHand.length - 1} at (${relativeX}, ${relativeY})`);
                  }
                });
              }
            });
          }
        });
      }, index * 1000); // 1000ms delay between each card to allow slide + flip animations to complete
    });
  }

  slideHandCardsLeft(newTotalCards, cardSpacing) {
    // Recalculate positions for all existing cards with new spacing
    const newStartX = -(newTotalCards - 1) * cardSpacing / 2;
    
    this.playerHand.forEach((card, index) => {
      const newX = newStartX + (index * cardSpacing);
      
      // Animate existing cards to new positions
      this.tweens.add({
        targets: card,
        x: newX,
        duration: 300,
        ease: 'Power2.easeOut'
      });
      
      // Update original position for drag/drop functionality
      card.originalPosition.x = newX;
    });
  }

}
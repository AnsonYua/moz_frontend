import { GAME_CONFIG } from '../config/gameConfig.js';

export default class ShuffleAnimationManager {
  constructor(scene) {
    this.scene = scene;
    this.playerDeckCards = [];
    this.opponentDeckCards = [];
  }

  playShuffleDeckAnimation(layout, onComplete) {
    const { width, height } = this.scene.cameras.main;
    
    // Get deck positions from layout
    const playerDeckPos = layout.player.deck;
    const opponentDeckPos = layout.opponent.deck;
    
    // Create player deck in initial position
    this.playerDeckCards = [];
    this.opponentDeckCards = [];
    const numCards = 50;
    
    // Create player deck cards in initial position
    for (let i = 0; i < numCards; i++) {
      const card = this.scene.add.image(playerDeckPos.x + (i * 0), playerDeckPos.y - (i * 0), 'card-back');
      const scaleX = GAME_CONFIG.card.width / card.width;
      const scaleY = GAME_CONFIG.card.height / card.height;
      card.setScale(Math.min(scaleX, scaleY) * 0.95);
      card.setDepth(i);
      this.playerDeckCards.push(card);
    }
    
    // Create opponent deck cards in initial position
    for (let i = 0; i < numCards; i++) {
      const card = this.scene.add.image(opponentDeckPos.x + (i * 0), opponentDeckPos.y - (i * 0), 'card-back');
      const scaleX = GAME_CONFIG.card.width / card.width;
      const scaleY = GAME_CONFIG.card.height / card.height;
      card.setScale(Math.min(scaleX, scaleY) * 0.95);
      card.setDepth(i);
      this.opponentDeckCards.push(card);
    }
    
    // Show shuffle text
    const shuffleText = this.scene.add.text(width / 2, height / 2 - 120, 'Shuffling Decks...', {
      fontSize: '28px',
      fontFamily: 'Arial Bold',
      fill: '#ffffff',
      align: 'center'
    });
    shuffleText.setOrigin(0.5);
    shuffleText.setAlpha(0);
    
    // Animate shuffle text
    this.scene.tweens.add({
      targets: shuffleText,
      alpha: 1,
      duration: 300,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        shuffleText.destroy();
      }
    });
    
    // Bring cards to front layer before starting animation
    this.playerDeckCards.forEach(card => card.setDepth(1000));
    for (let i = 0; i < this.playerDeckCards.length; i++) {
      this.playerDeckCards[i].setDepth(this.playerDeckCards.length - i);
    }
    
    // Start the new shuffle animation
    setTimeout(() => {
      this.performCustomShuffle(layout, onComplete);
    }, 500);
  }

  performCustomShuffle(layout, onComplete) {
    const { width, height } = this.scene.cameras.main;
    
    // Game board center for card placement during shuffle
    const boardCenterX = width / 2;
    const boardCenterY = height / 2;
    
    // Track completion of both decks
    let playerDeckComplete = false;
    let opponentDeckComplete = false;
    
    const checkBothComplete = () => {
      if (playerDeckComplete && opponentDeckComplete) {
        // Both decks shuffled, move to final positions
        this.moveDecksToFinalPositions(onComplete);
      }
    };
    
    // Start both deck shuffles simultaneously
    this.shufflePlayerDeck(layout.player.deck, boardCenterX, boardCenterY, () => {
      playerDeckComplete = true;
      checkBothComplete();
    });
    
    this.shuffleOpponentDeck(layout.opponent.deck, boardCenterX, boardCenterY, () => {
      opponentDeckComplete = true;
      checkBothComplete();
    });
  }

  shufflePlayerDeck(deckPosition, boardCenterX, boardCenterY, onComplete) {
    const shuffledOrder = this.getCustomShuffleOrder(this.playerDeckCards.length);
    let currentCardIndex = 0;
    const newStack = [];
    
    console.log('Player deck shuffling with custom method');
    
    const shuffleNextCard = () => {
      if (currentCardIndex >= shuffledOrder.length) {
        // Shuffle complete, move cards back to deck position
        this.moveShuffledCardsToDeck(this.playerDeckCards, deckPosition, onComplete);
        return;
      }
      
      const originalIndex = shuffledOrder[currentCardIndex];
      const card = this.playerDeckCards[originalIndex];
      card.setDepth(currentCardIndex);
      
      this.applyCustomShuffleLogic(card, newStack, currentCardIndex, 'player', () => {
        currentCardIndex++;
        setTimeout(() => {
          shuffleNextCard();
        }, 100);
      });
    };
    
    // Start shuffling
    shuffleNextCard();
  }

  shuffleOpponentDeck(deckPosition, boardCenterX, boardCenterY, onComplete) {
    const shuffledOrder = this.getCustomShuffleOrder(this.opponentDeckCards.length);
    let currentCardIndex = 0;
    const newStack = [];
    
    console.log('Opponent deck shuffling with custom method');
    
    const shuffleNextCard = () => {
      if (currentCardIndex >= shuffledOrder.length) {
        // Shuffle complete, move cards back to deck position
        this.moveShuffledCardsToDeck(this.opponentDeckCards, deckPosition, onComplete);
        return;
      }
      
      const originalIndex = shuffledOrder[currentCardIndex];
      const card = this.opponentDeckCards[originalIndex];
      this.applyCustomShuffleLogic(card, newStack, currentCardIndex, 'opponent', () => {
        currentCardIndex++;
        setTimeout(() => {
          shuffleNextCard();
        }, 100);
      });
    };
    
    // Start shuffling
    shuffleNextCard();
  }

  applyCustomShuffleLogic(card, newStack, cardIndex, deckType, onComplete) {
    const { width, height } = this.scene.cameras.main;
    const boardCenterX = width / 2;
    let boardCenterY = height / 2;
    
    // Calculate horizontal positions for the new stack
    const cardSpacing = 120; // Space between cards (increased to prevent overlap)
    const numberOfStacks = 5; // Total number of cards in deck
    
    // Different positions for player and opponent
    let stackStartX;
    if (deckType === 'player') {
      // Player stack on the left side
      stackStartX = boardCenterX - ((numberOfStacks - 1) * cardSpacing) / 2;
    } else {
      // Opponent stack on the right side
      stackStartX = boardCenterX - ((numberOfStacks - 1) * cardSpacing) / 2;
    }

    const startY = 45;
    const cardHeight = 160;

    if (deckType === 'player') {
      boardCenterY = startY + 100 + cardHeight + 10 + 15 + cardHeight + 70;
    } else {
      boardCenterY = startY + 100 + 10 + 15;
    }
    
    // Custom shuffle method: 5 columns × 2 rows layout
    const totalPositions = 10; // 5 columns × 2 rows
    const cardsPerRow = 5;
    const rowSpacing = 170; // Vertical spacing between rows
    
    if (cardIndex < totalPositions) {
      // First 10 cards go to the grid layout
      newStack.push(card);
      
      // Calculate row and column position
      const row = Math.floor(cardIndex / cardsPerRow); // 0 or 1
      const col = cardIndex % cardsPerRow; // 0, 1, 2, 3, or 4
      
      const targetX = stackStartX + (col * cardSpacing);
      const targetY = boardCenterY + 50 + (row * rowSpacing);
      
      this.scene.tweens.add({
        targets: card,
        x: targetX,
        y: targetY,
        rotation: 0,
        duration: 200,
        ease: 'Power2.easeInOut',
        onComplete: () => {
          onComplete();
        }
      });
    } else {
      // 11th card onwards go on top of the grid positions
      newStack.unshift(card); // Add to beginning (top) of stack
      
      // Calculate which position this card should go to
      const positionIndex = (cardIndex - totalPositions) % totalPositions; // 0-9 for grid positions
      const row = Math.floor(positionIndex / cardsPerRow); // 0 or 1
      const col = positionIndex % cardsPerRow; // 0, 1, 2, 3, or 4
      
      const targetX = stackStartX + (col * cardSpacing);
      
      // Calculate how many cards are already at this position to stack on top
      const cardsAtThisPosition = Math.floor((cardIndex - totalPositions) / totalPositions) + 1;
      const targetY = boardCenterY + 50 + (row * rowSpacing) - (cardsAtThisPosition * 5); // Stack vertically
      
      this.scene.tweens.add({
        targets: card,
        x: targetX,
        y: targetY,
        rotation: 0,
        duration: 200,
        ease: 'Power2.easeInOut',
        onComplete: () => {
          onComplete();
        }
      });
    }
  }

  moveShuffledCardsToDeck(deckCards, deckPosition, onComplete) {
    // Move all cards back to their deck position - top cards move first
    deckCards.reverse();
    deckCards.forEach((card, index) => {
      // First cards to move (index 0) should be on top of deck
      
      this.scene.tweens.add({
        targets: card,
        x: deckPosition.x,
        y: deckPosition.y,
        rotation: 0,
        duration: 400,
        delay: index * 50,
        ease: 'Power2.easeInOut',
        onStart: () => {
          setTimeout(() => {
            card.setDepth(index);
          }, 350);
        },
        onComplete: () => {
          if (index === deckCards.length - 1) {
            onComplete();
          }
        }
      });
    });
  }

  getCustomShuffleOrder(length) {
    // Create a custom shuffle order based on your method
    const order = Array.from({ length }, (_, i) => i);
    
    // Custom shuffle: take cards one by one from top to bottom, place first 4 in new stack, then 5th goes on top
    const shuffledOrder = [];
    const tempStack = [...order];
    
    while (tempStack.length > 0) {
      // Take card from top (index 0) instead of random
      const card = tempStack.splice(0, 1)[0];
      shuffledOrder.push(card);
    }
    
    return shuffledOrder;
  }

  moveDecksToFinalPositions(onComplete) {
    // Fade out the temporary shuffle cards
    this.scene.tweens.add({
      targets: this.playerDeckCards,
      alpha: 0,
      duration: 300,
      delay: 500,
      onComplete: () => {
        this.playerDeckCards.forEach(card => card.destroy());
      }
    });
    
    this.scene.tweens.add({
      targets: this.opponentDeckCards,
      alpha: 0,
      duration: 300,
      delay: 500,
      onComplete: () => {
        this.opponentDeckCards.forEach(card => card.destroy());
        onComplete();
      }
    });
  }
}
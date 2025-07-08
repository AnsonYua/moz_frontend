import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig.js';

export default class Card extends Phaser.GameObjects.Container {
  constructor(scene, x, y, cardData, options = {}) {
    super(scene, x, y);
    
    this.cardData = cardData;
    this.options = {
      interactive: true,
      draggable: false,
      faceDown: false,
      scale: 1,
      ...options
    };
    
    this.isSelected = false;
    this.isDragging = false;
    this.originalPosition = { x, y };
    
    this.create();
    this.setupInteraction();
    
    scene.add.existing(this);
  }

  create() {
    // Card background/frame
    const frameKey = this.options.faceDown ? 'card-back' : `${this.cardData.type}-frame`;
    this.cardFrame = this.scene.add.image(0, 0, frameKey);
    this.add(this.cardFrame);
    
    if (!this.options.faceDown && this.cardData) {
      this.createCardContent();
    }
    
    this.setScale(this.options.scale);
    this.updateVisualState();
  }

  createCardContent() {
    // Card name
    this.cardName = this.scene.add.text(0, -70, this.cardData.name || 'Unknown Card', {
      fontSize: '12px',
      fontFamily: 'Arial',
      fill: '#000000',
      align: 'center',
      wordWrap: { width: 100 }
    });
    this.cardName.setOrigin(0.5);
    this.add(this.cardName);

    // Power value for character cards
    if (this.cardData.type === 'character' && this.cardData.power !== undefined) {
      this.powerText = this.scene.add.text(45, -45, this.cardData.power.toString(), {
        fontSize: '20px',
        fontFamily: 'Arial Bold',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      });
      this.powerText.setOrigin(0.5);
      this.add(this.powerText);
    }

    // Card type indicator
    const typeColor = GAME_CONFIG.colors[this.cardData.type] || 0xffffff;
    this.typeIndicator = this.scene.add.circle(-45, -60, 8, typeColor);
    this.add(this.typeIndicator);

    // Zone compatibility icons for character cards
    if (this.cardData.type === 'character' && this.cardData.zones) {
      this.createZoneIcons();
    }

    // Effect text for non-character cards
    if (this.cardData.type !== 'character' && this.cardData.effect) {
      this.effectText = this.scene.add.text(0, 20, this.cardData.effect, {
        fontSize: '10px',
        fontFamily: 'Arial',
        fill: '#333333',
        align: 'center',
        wordWrap: { width: 90 }
      });
      this.effectText.setOrigin(0.5);
      this.add(this.effectText);
    }

    // Card ID (for debugging/development)
    this.cardId = this.scene.add.text(0, 70, this.cardData.id, {
      fontSize: '8px',
      fontFamily: 'Arial',
      fill: '#666666',
      align: 'center'
    });
    this.cardId.setOrigin(0.5);
    this.add(this.cardId);
  }

  createZoneIcons() {
    const iconY = 40;
    const iconSpacing = 15;
    const startX = -(this.cardData.zones.length - 1) * iconSpacing / 2;
    
    this.cardData.zones.forEach((zone, index) => {
      const iconX = startX + (index * iconSpacing);
      const icon = this.scene.add.text(iconX, iconY, zone.toUpperCase()[0], {
        fontSize: '10px',
        fontFamily: 'Arial Bold',
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 3, y: 2 }
      });
      icon.setOrigin(0.5);
      this.add(icon);
    });
  }

  setupInteraction() {
    if (!this.options.interactive) return;

    this.setSize(120, 180);
    this.setInteractive();

    // Hover effects
    this.on('pointerover', () => {
      if (!this.isDragging) {
        this.scene.tweens.add({
          targets: this,
          scaleX: this.options.scale * 1.1,
          scaleY: this.options.scale * 1.1,
          duration: 200,
          ease: 'Power2'
        });
        
        this.scene.game.canvas.style.cursor = 'pointer';
        this.emit('card-hover', this);
      }
    });

    this.on('pointerout', () => {
      if (!this.isDragging && !this.isSelected) {
        this.scene.tweens.add({
          targets: this,
          scaleX: this.options.scale,
          scaleY: this.options.scale,
          duration: 200,
          ease: 'Power2'
        });
      }
      
      this.scene.game.canvas.style.cursor = 'default';
      this.emit('card-unhover', this);
    });

    // Click/tap interaction
    this.on('pointerdown', (pointer, localX, localY, event) => {
      if (pointer.rightButtonDown()) {
        // Right click for face-down toggle
        this.toggleFaceDown();
        event.stopPropagation();
      } else {
        // Left click for selection
        this.select();
        this.emit('card-select', this);
        
        if (this.options.draggable) {
          this.startDrag(pointer);
        }
      }
    });

    // Drag functionality
    if (this.options.draggable) {
      this.scene.input.on('pointermove', (pointer) => {
        if (this.isDragging) {
          this.x = pointer.x;
          this.y = pointer.y;
          this.emit('card-drag', this, pointer);
        }
      });

      this.scene.input.on('pointerup', (pointer) => {
        if (this.isDragging) {
          this.stopDrag(pointer);
        }
      });
    }
  }

  startDrag(pointer) {
    this.isDragging = true;
    this.setDepth(1000);
    
    this.scene.tweens.add({
      targets: this,
      scaleX: this.options.scale * 1.2,
      scaleY: this.options.scale * 1.2,
      duration: 100
    });
    
    this.emit('card-drag-start', this, pointer);
  }

  stopDrag(pointer) {
    this.isDragging = false;
    this.setDepth(0);
    
    this.scene.tweens.add({
      targets: this,
      scaleX: this.options.scale,
      scaleY: this.options.scale,
      duration: 200
    });
    
    this.emit('card-drag-end', this, pointer);
  }

  select() {
    this.isSelected = true;
    this.updateVisualState();
  }

  deselect() {
    this.isSelected = false;
    this.updateVisualState();
  }

  toggleFaceDown() {
    this.options.faceDown = !this.options.faceDown;
    this.recreate();
    this.emit('card-face-toggle', this);
  }

  updateVisualState() {
    if (this.isSelected) {
      // Add selection highlight
      if (!this.selectionHighlight) {
        this.selectionHighlight = this.scene.add.graphics();
        this.selectionHighlight.lineStyle(3, GAME_CONFIG.colors.highlight);
        this.selectionHighlight.strokeRoundedRect(-62, -92, 124, 184, 8);
        this.addAt(this.selectionHighlight, 0);
      }
    } else {
      // Remove selection highlight
      if (this.selectionHighlight) {
        this.selectionHighlight.destroy();
        this.selectionHighlight = null;
      }
    }
  }

  recreate() {
    // Clear existing content
    this.removeAll(true);
    
    // Recreate card
    this.create();
  }

  returnToOriginalPosition(duration = 300) {
    this.scene.tweens.add({
      targets: this,
      x: this.originalPosition.x,
      y: this.originalPosition.y,
      duration: duration,
      ease: 'Power2'
    });
  }

  moveToPosition(x, y, duration = 300) {
    this.originalPosition = { x, y };
    
    this.scene.tweens.add({
      targets: this,
      x: x,
      y: y,
      duration: duration,
      ease: 'Power2'
    });
  }

  canPlayInZone(zoneType) {
    if (this.cardData.type === 'character') {
      return this.cardData.zones && this.cardData.zones.includes(zoneType);
    }
    
    if (this.cardData.type === 'help') {
      return zoneType === 'help';
    }
    
    if (this.cardData.type === 'sp') {
      return zoneType === 'sp';
    }
    
    return false;
  }

  getCardData() {
    return this.cardData;
  }

  isFaceDown() {
    return this.options.faceDown;
  }
}
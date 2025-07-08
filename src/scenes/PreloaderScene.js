import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig.js';

export default class PreloaderScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloaderScene' });
  }

  preload() {
    this.createLoadingBar();
    this.loadAssets();
    
    this.load.on('progress', (value) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(GAME_CONFIG.colors.highlight);
      this.progressBar.fillRect(
        this.cameras.main.width / 2 - 200,
        this.cameras.main.height / 2 - 10,
        400 * value,
        20
      );
    });

    this.load.on('complete', () => {
      this.progressBar.destroy();
      this.progressBox.destroy();
      this.loadingText.destroy();
      this.scene.start('MenuScene');
    });
    
  }

  createLoadingBar() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222);
    this.progressBox.fillRect(width / 2 - 210, height / 2 - 20, 420, 40);

    this.progressBar = this.add.graphics();

    this.loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      font: '20px Arial',
      fill: '#ffffff'
    });
    this.loadingText.setOrigin(0.5, 0.5);
  }

  loadAssets() {
    // Create placeholder card textures
    this.createCardTextures();
    
    // Create UI textures
    this.createUITextures();
    
    // In a real implementation, you would load actual image files:
    // this.load.image('card-back', 'assets/images/card-back.png');
    // this.load.image('character-frame', 'assets/images/character-frame.png');
    // etc.
  }

  createCardTextures() {
    // Create card back texture
    const cardBackGraphics = this.add.graphics();
    cardBackGraphics.fillStyle(GAME_CONFIG.colors.cardBack);
    cardBackGraphics.fillRoundedRect(0, 0, 120, 180, 8);
    cardBackGraphics.lineStyle(2, 0x444444);
    cardBackGraphics.strokeRoundedRect(0, 0, 120, 180, 8);
    cardBackGraphics.generateTexture('card-back', 120, 180);
    cardBackGraphics.destroy();

    // Create card frames for different types
    Object.entries(GAME_CONFIG.colors).forEach(([type, color]) => {
      if (['character', 'help', 'sp', 'leader'].includes(type)) {
        const frameGraphics = this.add.graphics();
        frameGraphics.fillStyle(0xffffff);
        frameGraphics.fillRoundedRect(0, 0, 120, 180, 8);
        frameGraphics.lineStyle(3, color);
        frameGraphics.strokeRoundedRect(0, 0, 120, 180, 8);
        frameGraphics.generateTexture(`${type}-frame`, 120, 180);
        frameGraphics.destroy();
      }
    });
  }

  createUITextures() {
    // Create zone placeholder
    const zoneGraphics = this.add.graphics();
    zoneGraphics.lineStyle(2, 0x666666, 1);
    zoneGraphics.strokeRoundedRect(0, 0, 130, 190, 8);
    zoneGraphics.setAlpha(0.5);
    zoneGraphics.generateTexture('zone-placeholder', 130, 190);
    zoneGraphics.destroy();

    // Create zone highlight
    const highlightGraphics = this.add.graphics();
    highlightGraphics.lineStyle(3, GAME_CONFIG.colors.highlight, 1);
    highlightGraphics.strokeRoundedRect(0, 0, 130, 190, 8);
    highlightGraphics.generateTexture('zone-highlight', 130, 190);
    highlightGraphics.destroy();

    // Create button texture
    const buttonGraphics = this.add.graphics();
    buttonGraphics.fillStyle(0x4A90E2);
    buttonGraphics.fillRoundedRect(0, 0, 200, 50, 8);
    buttonGraphics.lineStyle(2, 0x357ABD);
    buttonGraphics.strokeRoundedRect(0, 0, 200, 50, 8);
    buttonGraphics.generateTexture('button', 200, 50);
    buttonGraphics.destroy();
  }
}
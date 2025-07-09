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
    // Load actual card back image
    this.load.image('card-back', 'src/assets/cardBack.png');
    
    // Create placeholder card textures
    this.createCardTextures();
    
    // Create UI textures
    this.createUITextures();
  }

  createCardTextures() {
    // Create card frames for different types
    Object.entries(GAME_CONFIG.colors).forEach(([type, color]) => {
      if (['character', 'help', 'sp', 'leader'].includes(type)) {
        const frameGraphics = this.add.graphics();
        frameGraphics.fillStyle(0xffffff);
        frameGraphics.fillRoundedRect(0, 0, GAME_CONFIG.card.width, GAME_CONFIG.card.height, GAME_CONFIG.card.cornerRadius);
        frameGraphics.lineStyle(GAME_CONFIG.card.borderWidth, color);
        frameGraphics.strokeRoundedRect(0, 0, GAME_CONFIG.card.width, GAME_CONFIG.card.height, GAME_CONFIG.card.cornerRadius);
        frameGraphics.generateTexture(`${type}-frame`, GAME_CONFIG.card.width, GAME_CONFIG.card.height);
        frameGraphics.destroy();
      }
    });
  }

  createUITextures() {
    // Create zone placeholder
    const zoneGraphics = this.add.graphics();
    zoneGraphics.lineStyle(2, 0x666666, 1);
    zoneGraphics.strokeRoundedRect(0, 0, GAME_CONFIG.card.width - 10, GAME_CONFIG.card.height , GAME_CONFIG.card.cornerRadius);
    zoneGraphics.setAlpha(1);
    zoneGraphics.generateTexture('zone-placeholder', GAME_CONFIG.card.width - 10, GAME_CONFIG.card.height );
    zoneGraphics.destroy();

    // Create zone highlight
    const highlightGraphics = this.add.graphics();
    highlightGraphics.lineStyle(3, GAME_CONFIG.colors.highlight, 1);
    highlightGraphics.strokeRoundedRect(0, 0, GAME_CONFIG.card.width + 10, GAME_CONFIG.card.height + 10, GAME_CONFIG.card.cornerRadius);
    highlightGraphics.generateTexture('zone-highlight', GAME_CONFIG.card.width + 10, GAME_CONFIG.card.height + 10);
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
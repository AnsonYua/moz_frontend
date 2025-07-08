import { GAME_CONFIG } from '../config/gameConfig.js';

export default class APIManager {
  constructor() {
    this.baseUrl = GAME_CONFIG.apiBaseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Game Management
  async createGame(playerName) {
    return this.request('/game/create', {
      method: 'POST',
      body: JSON.stringify({ playerName })
    });
  }

  async getGame(gameId) {
    return this.request(`/game/${gameId}`);
  }

  async startGame(playerId, gameId) {
    return this.request('/player/startGame', {
      method: 'POST',
      body: JSON.stringify({ playerId, gameId })
    });
  }

  async startReady(playerId, gameId) {
    return this.request('/player/startReady', {
      method: 'POST',
      body: JSON.stringify({ playerId, gameId })
    });
  }

  // Gameplay Actions
  async playerAction(playerId, gameId, action, data = {}) {
    return this.request('/player/playerAction', {
      method: 'POST',
      body: JSON.stringify({
        playerId,
        gameId,
        action,
        ...data
      })
    });
  }

  async selectCard(playerId, gameId, cardId, selections = []) {
    return this.request('/player/selectCard', {
      method: 'POST',
      body: JSON.stringify({
        playerId,
        gameId,
        cardId,
        selections
      })
    });
  }

  async acknowledgeEvents(playerId, gameId) {
    return this.request('/player/acknowledgeEvents', {
      method: 'POST',
      body: JSON.stringify({ playerId, gameId })
    });
  }

  async getPlayer(playerId, gameId) {
    const params = gameId ? `?gameId=${gameId}` : '';
    return this.request(`/player/${playerId}${params}`);
  }

  // Battle Progression
  async nextRound(playerId, gameId) {
    return this.request('/player/nextRound', {
      method: 'POST',
      body: JSON.stringify({ playerId, gameId })
    });
  }

  // Demo/Mock API methods for development
  async createMockGame(playerName) {
    // Simulate API delay
    await this.delay(500);
    
    return {
      gameId: 'mock_' + Date.now(),
      playerId: 'player_' + Date.now(),
      status: 'created'
    };
  }

  async getMockPlayer(playerId, gameId) {
    // Simulate API delay
    await this.delay(100);
    
    // Return mock player data
    return {
      playerId,
      gameEnv: {
        phase: GAME_CONFIG.phases.MAIN,
        currentPlayer: playerId,
        gameEvents: [],
        // ... other mock data
      }
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility methods for API interaction
  isOnline() {
    return navigator.onLine;
  }

  async testConnection() {
    try {
      const response = await fetch(this.baseUrl + '/health', {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      console.warn('API connection test failed:', error);
      return false;
    }
  }
}
// lib/websocket.ts
import { getAccessToken, getRefreshToken, setTokens } from './api';

type MessageHandler = (data: any) => void;
type ErrorHandler = (error: Event) => void;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

class WebSocketService {
  private connections: Map<string, WebSocket> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private messageHandlers: Map<string, MessageHandler> = new Map();
  private errorHandlers: Map<string, ErrorHandler | undefined> = new Map();
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 1000; // ✅ FIX: Base delay for exponential backoff
  private maxReconnectDelay = 30000; // ✅ FIX: Max delay cap
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000';
  }

  // ✅ FIX: Calculate exponential backoff delay with jitter
  private getReconnectDelay(attempts: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s (capped at maxReconnectDelay)
    const exponentialDelay = this.baseReconnectDelay * Math.pow(2, attempts);
    const cappedDelay = Math.min(exponentialDelay, this.maxReconnectDelay);
    // Add random jitter (0-25%) to prevent thundering herd
    const jitter = cappedDelay * Math.random() * 0.25;
    return cappedDelay + jitter;
  }

  // ✅ FIX: Check if token is expired
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  }

  // ✅ FIX: Refresh token if expired
  private async refreshTokenIfNeeded(): Promise<string | null> {
    const token = getAccessToken();
    if (!token) return null;

    if (!this.isTokenExpired(token)) {
      return token;
    }

    // Token expired, try to refresh
    console.log('🔄 WebSocket token expired, refreshing...');
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      console.error('No refresh token available');
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const { access } = await response.json();
        setTokens(access, refreshToken);
        console.log('✅ WebSocket token refreshed successfully');
        return access;
      } else {
        console.error('Failed to refresh token for WebSocket');
        return null;
      }
    } catch (error) {
      console.error('Error refreshing WebSocket token:', error);
      return null;
    }
  }

  // ✅ FIX: Made connect async to support token refresh
  async connect(
    endpoint: string,
    onMessage: MessageHandler,
    onError?: ErrorHandler
  ): Promise<WebSocket | null> {
    // ✅ FIX: Refresh token if needed before connecting
    const token = await this.refreshTokenIfNeeded();
    if (!token) {
      console.error('No valid access token available for WebSocket connection');
      return null;
    }

    const wsUrl = `${this.baseUrl}/ws/${endpoint}/?token=${token}`;

    // Store handlers for reconnection
    this.messageHandlers.set(endpoint, onMessage);
    this.errorHandlers.set(endpoint, onError);

    if (this.connections.has(endpoint)) {
      console.log(`WebSocket for ${endpoint} already connected`);
      return this.connections.get(endpoint)!;
    }

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log(`✅ WebSocket connected: ${endpoint}`);
        this.reconnectAttempts.set(endpoint, 0);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      ws.onerror = (error) => {
        console.error(`❌ WebSocket error on ${endpoint}:`, error);
        if (onError) onError(error);
      };

      ws.onclose = () => {
        console.log(`🔌 WebSocket closed: ${endpoint}`);

        // ✅ FIX: Only reconnect if connection is still tracked (not manually disconnected)
        if (this.connections.has(endpoint)) {
          this.connections.delete(endpoint);
          this.handleReconnect(endpoint);
        }
      };

      this.connections.set(endpoint, ws);
      return ws;
    } catch (error) {
      console.error(`Failed to create WebSocket for ${endpoint}:`, error);
      return null;
    }
  }

  // ✅ FIX: Reconnect with stored handlers, fresh token, and exponential backoff
  private async handleReconnect(endpoint: string) {
    const attempts = this.reconnectAttempts.get(endpoint) || 0;

    if (attempts < this.maxReconnectAttempts) {
      const delay = this.getReconnectDelay(attempts);
      console.log(
        `🔄 Reconnecting ${endpoint} in ${Math.round(delay)}ms (attempt ${attempts + 1}/${this.maxReconnectAttempts})...`
      );

      setTimeout(async () => {
        this.reconnectAttempts.set(endpoint, attempts + 1);
        const onMessage = this.messageHandlers.get(endpoint);
        const onError = this.errorHandlers.get(endpoint);
        if (onMessage) {
          await this.connect(endpoint, onMessage, onError);
        }
      }, delay);
    } else {
      console.error(`❌ Max reconnect attempts reached for ${endpoint}`);
      this.reconnectAttempts.delete(endpoint);
      this.messageHandlers.delete(endpoint);
      this.errorHandlers.delete(endpoint);
    }
  }

  send(endpoint: string, data: any) {
    const ws = this.connections.get(endpoint);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    } else {
      console.error(`WebSocket not connected: ${endpoint}`);
    }
  }

  disconnect(endpoint: string) {
    const ws = this.connections.get(endpoint);
    if (ws) {
      // ✅ FIX: Clear reconnect attempts FIRST to prevent reconnect
      this.reconnectAttempts.delete(endpoint);
      this.messageHandlers.delete(endpoint);
      this.errorHandlers.delete(endpoint);

      // ✅ FIX: Remove from connections BEFORE closing to prevent onclose from reconnecting
      this.connections.delete(endpoint);

      // Close the WebSocket connection
      ws.close();
    }
  }

  disconnectAll() {
    this.connections.forEach((ws) => ws.close());
    this.connections.clear();
    this.reconnectAttempts.clear();
    this.messageHandlers.clear();
    this.errorHandlers.clear();
  }

  isConnected(endpoint: string): boolean {
    const ws = this.connections.get(endpoint);
    return ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const wsService = new WebSocketService();

// Specific WebSocket connection helpers - now async
export const connectDashboard = (onMessage: MessageHandler, onError?: ErrorHandler) =>
  wsService.connect('dashboard', onMessage, onError);

export const connectProgress = (onMessage: MessageHandler, onError?: ErrorHandler) =>
  wsService.connect('progress', onMessage, onError);

export const connectLeaderboard = (onMessage: MessageHandler, onError?: ErrorHandler) =>
  wsService.connect('leaderboard', onMessage, onError);

export const connectStreak = (onMessage: MessageHandler, onError?: ErrorHandler) =>
  wsService.connect('streak', onMessage, onError);

// ✅ Achievement notifications WebSocket
export const connectAchievements = (onMessage: MessageHandler, onError?: ErrorHandler) =>
  wsService.connect('achievements', onMessage, onError);

export const connectChat = (roomName: string, onMessage: MessageHandler, onError?: ErrorHandler) =>
  wsService.connect(`chat/${roomName}`, onMessage, onError);

export default wsService;

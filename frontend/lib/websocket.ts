// lib/websocket.ts
import { getAccessToken } from './api';

type MessageHandler = (data: any) => void;
type ErrorHandler = (error: Event) => void;

class WebSocketService {
  private connections: Map<string, WebSocket> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000';
  }

  connect(
    endpoint: string,
    onMessage: MessageHandler,
    onError?: ErrorHandler
  ): WebSocket | null {
    const token = getAccessToken();
    if (!token) {
      console.error('No access token available for WebSocket connection');
      return null;
    }

    const wsUrl = `${this.baseUrl}/ws/${endpoint}/?token=${token}`;

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
        this.connections.delete(endpoint);
        this.handleReconnect(endpoint, onMessage, onError);
      };

      this.connections.set(endpoint, ws);
      return ws;
    } catch (error) {
      console.error(`Failed to create WebSocket for ${endpoint}:`, error);
      return null;
    }
  }

  private handleReconnect(
    endpoint: string,
    onMessage: MessageHandler,
    onError?: ErrorHandler
  ) {
    const attempts = this.reconnectAttempts.get(endpoint) || 0;

    if (attempts < this.maxReconnectAttempts) {
      console.log(
        `🔄 Reconnecting ${endpoint} (attempt ${attempts + 1}/${this.maxReconnectAttempts})...`
      );

      setTimeout(() => {
        this.reconnectAttempts.set(endpoint, attempts + 1);
        this.connect(endpoint, onMessage, onError);
      }, this.reconnectDelay);
    } else {
      console.error(`❌ Max reconnect attempts reached for ${endpoint}`);
      this.reconnectAttempts.delete(endpoint);
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
      ws.close();
      this.connections.delete(endpoint);
      this.reconnectAttempts.delete(endpoint);
    }
  }

  disconnectAll() {
    this.connections.forEach((ws) => ws.close());
    this.connections.clear();
    this.reconnectAttempts.clear();
  }

  isConnected(endpoint: string): boolean {
    const ws = this.connections.get(endpoint);
    return ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const wsService = new WebSocketService();

// Specific WebSocket connection helpers
export const connectDashboard = (onMessage: MessageHandler, onError?: ErrorHandler) =>
  wsService.connect('dashboard', onMessage, onError);

export const connectProgress = (onMessage: MessageHandler, onError?: ErrorHandler) =>
  wsService.connect('progress', onMessage, onError);

export const connectLeaderboard = (onMessage: MessageHandler, onError?: ErrorHandler) =>
  wsService.connect('leaderboard', onMessage, onError);

export const connectStreak = (onMessage: MessageHandler, onError?: ErrorHandler) =>
  wsService.connect('streak', onMessage, onError);

export const connectChat = (roomName: string, onMessage: MessageHandler, onError?: ErrorHandler) =>
  wsService.connect(`chat/${roomName}`, onMessage, onError);

export default wsService;
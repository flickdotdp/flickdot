// -------------------------------------------------------------------------
// WebSocket Event Types & Schemas
// -------------------------------------------------------------------------
export enum WsEventType {
  GENERATION_QUEUED = "generation_queued",
  GENERATION_STARTED = "generation_started",
  GENERATION_PROGRESS = "generation_progress",
  GENERATION_COMPLETED = "generation_completed",
  GENERATION_FAILED = "generation_failed",
  GENERATION_CANCELLED = "generation_cancelled",
  QUEUE_UPDATE = "queue_updated",
  PROJECT_UPDATE = "project_updated",
  GALLERY_UPDATE = "gallery_updated",
  SYSTEM_STATUS_CHANGED = "system_status_changed",
  COMFYUI_STATUS_CHANGED = "comfyui_status_changed"
}

export interface WsMessage<T = any> {
  event: WsEventType | string;
  payload: T;
  timestamp?: string;
}

export type WsConnectionState = 'CONNECTING' | 'OPEN' | 'CLOSED' | 'RECONNECTING';

export type WsMessageHandler = (payload: any) => void;

// -------------------------------------------------------------------------
// Production-Ready WebSocket Client
// -------------------------------------------------------------------------
class WebSocketClient {
  private socket: WebSocket | null = null;
  private url: string;
  
  // Connection state
  private state: WsConnectionState = 'CLOSED';
  private clientId: string;
  
  // Reconnection variables
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000; // 1 second
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;

  // Heartbeat monitoring
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private pongTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly PING_RATE = 15000; // 15 seconds
  private readonly PONG_WAIT = 5000;  // 5 seconds

  // Event Handlers
  private handlers: Map<string, Set<WsMessageHandler>> = new Map();
  private stateChangeHandlers: Set<(state: WsConnectionState) => void> = new Set();

  constructor() {
    this.url = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000/api/v1/ws';
    this.clientId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7);
  }

  // -------------------------------------------------------------------------
  // Connection Lifecycle
  // -------------------------------------------------------------------------
  public connect() {
    if (this.state === 'OPEN' || this.state === 'CONNECTING') return;

    try {
      this.intentionalClose = false;
      this.updateState(this.reconnectAttempts > 0 ? 'RECONNECTING' : 'CONNECTING');
      
      const fullUrl = `${this.url}?client_id=${this.clientId}`;
      this.socket = new WebSocket(fullUrl);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      
    } catch (error) {
      console.error('[WebSocket] Connection instantiation failed:', error);
      this.scheduleReconnect();
    }
  }

  public disconnect() {
    this.intentionalClose = true;
    this.cleanupTimeouts();
    if (this.socket) {
      this.socket.close(1000, "Client intentionally disconnected");
      this.socket = null;
    }
    this.updateState('CLOSED');
  }

  public reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }

  // -------------------------------------------------------------------------
  // Internal Event Handlers
  // -------------------------------------------------------------------------
  private handleOpen() {
    console.log(`[WebSocket] Connected to ${this.url}`);
    this.reconnectAttempts = 0;
    this.updateState('OPEN');
    this.startHeartbeat();
  }

  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      
      // Handle Heartbeat internally
      if (data.event === 'pong') {
        if (this.pongTimeout) clearTimeout(this.pongTimeout);
        return;
      }
      
      // Subscriptions confirm
      if (data.event === 'subscribed' || data.event === 'unsubscribed') {
        console.debug(`[WebSocket] ${data.event} to ${data.type}:${data.id}`);
        return;
      }

      // Standard Event Routing
      if (data.event) {
        this.publishLocalEvent(data.event, data.payload);
      }
      
    } catch (error) {
      console.warn('[WebSocket] Received unparseable message:', event.data);
    }
  }

  private handleClose(event: CloseEvent) {
    this.cleanupTimeouts();
    this.updateState('CLOSED');
    
    if (!this.intentionalClose) {
      console.warn(`[WebSocket] Disconnected unexpectedly (Code: ${event.code}). Initiating recovery...`);
      this.scheduleReconnect();
    } else {
      console.log('[WebSocket] Connection closed cleanly.');
    }
  }

  private handleError(event: Event) {
    console.error('[WebSocket] Error encountered:', event);
    // Usually followed by an onclose event, so we let handleClose handle the reconnection
  }

  // -------------------------------------------------------------------------
  // Resilience Mechanisms
  // -------------------------------------------------------------------------
  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Maximum reconnection attempts reached. Giving up.');
      return;
    }

    const delay = Math.min(this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts), 10000);
    this.reconnectAttempts++;
    
    console.log(`[WebSocket] Reconnecting in ${delay}ms (Attempt ${this.reconnectAttempts})...`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat() {
    this.cleanupTimeouts();
    
    this.pingInterval = setInterval(() => {
      if (this.state === 'OPEN') {
        this.sendMessage('ping', { timestamp: Date.now() });
        
        // Start waiting for the pong
        this.pongTimeout = setTimeout(() => {
          console.warn('[WebSocket] Heartbeat timeout. Connection may be stale. Reconnecting...');
          if (this.socket) this.socket.close(); // Force close to trigger onclose recovery
        }, this.PONG_WAIT);
      }
    }, this.PING_RATE);
  }

  private cleanupTimeouts() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.pongTimeout) clearTimeout(this.pongTimeout);
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
  }

  // -------------------------------------------------------------------------
  // Public API Methods
  // -------------------------------------------------------------------------
  public sendMessage(action: string, payload: any = {}) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ action, ...payload }));
    } else {
      console.warn(`[WebSocket] Cannot send action '${action}', socket is not OPEN.`);
    }
  }

  // Topic Subscriptions
  public subscribeToProject(projectId: string) {
    this.sendMessage('subscribe', { type: 'project', id: projectId });
  }

  public subscribeToGeneration(generationId: string) {
    this.sendMessage('subscribe', { type: 'generation', id: generationId });
  }

  public unsubscribe(type: 'project' | 'generation', id: string) {
    this.sendMessage('unsubscribe', { type, id });
  }

  // Event Listener Management
  public registerHandler(event: WsEventType | string, handler: WsMessageHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)?.add(handler);
  }

  public unregisterHandler(event: WsEventType | string, handler: WsMessageHandler) {
    this.handlers.get(event)?.delete(handler);
  }

  public clearHandlers(event?: WsEventType | string) {
    if (event) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
    }
  }

  public publishLocalEvent(event: WsEventType | string, payload: any) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (e) {
          console.error(`[WebSocket] Error in handler for event ${event}:`, e);
        }
      });
    }
  }

  // State Management
  public getConnectionState(): WsConnectionState {
    return this.state;
  }

  public onStateChange(handler: (state: WsConnectionState) => void) {
    this.stateChangeHandlers.add(handler);
    return () => this.stateChangeHandlers.delete(handler);
  }

  private updateState(newState: WsConnectionState) {
    if (this.state !== newState) {
      this.state = newState;
      this.stateChangeHandlers.forEach(handler => handler(newState));
    }
  }
}

// Export global singleton instance
export const wsClient = new WebSocketClient();

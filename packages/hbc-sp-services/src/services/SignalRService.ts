import {
  SignalRConnectionStatus,
  SignalRMessage,
  SignalRMessageType,
} from '../models/ISignalRMessage';

type StatusChangeCallback = (status: SignalRConnectionStatus) => void;
type MessageCallback = (message: SignalRMessage) => void;

interface ISubscription {
  channelKey: string;
  callback: MessageCallback;
}

/**
 * SignalR connection manager — singleton service.
 *
 * Follows the same patterns as OfflineQueueService:
 * - Singleton exported instance
 * - initialize() for dependency injection
 * - Status observer with unsubscribe function
 * - Automatic reconnect with exponential backoff
 * - Fire-and-forget broadcasts
 */
export class SignalRService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private connection: any = null;
  private _status: SignalRConnectionStatus = 'disconnected';
  private statusListeners: StatusChangeCallback[] = [];
  private subscriptions: ISubscription[] = [];
  private baseUrl: string = '';
  private getAccessToken: (() => Promise<string>) | null = null;
  private reconnectAttempt: number = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed: boolean = false;
  private joinedGroups: Set<string> = new Set();

  private static readonly MAX_RECONNECT_DELAY = 30000;
  private static readonly BASE_RECONNECT_DELAY = 1000;

  get status(): SignalRConnectionStatus {
    return this._status;
  }

  /**
   * Configure the service with the Functions API base URL and token provider.
   * Must be called before connect().
   * @param baseUrl - e.g. 'https://func-hbc-signalr-prod.azurewebsites.net/api'
   * @param getAccessToken - AAD token provider for the Function App
   */
  initialize(
    baseUrl: string,
    getAccessToken: () => Promise<string>
  ): void {
    this.baseUrl = baseUrl;
    this.getAccessToken = getAccessToken;
  }

  /**
   * Register a callback for connection status changes.
   * Returns an unsubscribe function.
   */
  onStatusChange(callback: StatusChangeCallback): () => void {
    this.statusListeners.push(callback);
    return () => {
      this.statusListeners = this.statusListeners.filter((fn) => fn !== callback);
    };
  }

  /**
   * Subscribe to messages matching a channel key.
   * Channel keys: 'EntityChanged', 'UserPresence', 'WorkflowAdvanced', or '*' for all.
   * Returns an unsubscribe function.
   */
  subscribe(channelKey: string, callback: MessageCallback): () => void {
    const sub: ISubscription = { channelKey, callback };
    this.subscriptions.push(sub);
    return () => {
      this.subscriptions = this.subscriptions.filter((s) => s !== sub);
    };
  }

  /**
   * Establish connection to SignalR hub.
   */
  async connect(): Promise<void> {
    if (this.disposed) return;
    if (!this.baseUrl || !this.getAccessToken) {
      console.warn('[SignalR] Not initialized — call initialize() first');
      return;
    }
    if (this._status === 'connected' || this._status === 'connecting') return;

    this.setStatus('connecting');

    try {
      // Dynamically import @microsoft/signalr to avoid bundling when unused
      const signalRModule = await import(
        /* webpackChunkName: "lib-signalr-realtime" */
        '@microsoft/signalr'
      );

      const tokenProvider = this.getAccessToken;

      this.connection = new signalRModule.HubConnectionBuilder()
        .withUrl(`${this.baseUrl}/negotiate`, {
          accessTokenFactory: () => tokenProvider(),
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s max
            const delay = Math.min(
              SignalRService.BASE_RECONNECT_DELAY * Math.pow(2, retryContext.previousRetryCount),
              SignalRService.MAX_RECONNECT_DELAY
            );
            return delay;
          },
        })
        .configureLogging(signalRModule.LogLevel.Warning)
        .build();

      // Wire up event handlers
      this.connection.onreconnecting(() => {
        this.setStatus('reconnecting');
      });

      this.connection.onreconnected(() => {
        this.reconnectAttempt = 0;
        this.setStatus('connected');
        // Rejoin all groups after reconnect
        this.rejoinGroups();
      });

      this.connection.onclose(() => {
        if (!this.disposed) {
          this.setStatus('disconnected');
          this.scheduleReconnect();
        }
      });

      // Register message handlers for each message type
      const messageTypes: SignalRMessageType[] = ['EntityChanged', 'UserPresence', 'WorkflowAdvanced', 'ProvisioningStatus'];
      for (const msgType of messageTypes) {
        this.connection.on(msgType, (message: SignalRMessage) => {
          this.dispatchMessage(message);
        });
      }

      await this.connection.start();
      this.reconnectAttempt = 0;
      this.setStatus('connected');
    } catch (error) {
      console.warn('[SignalR] Connection failed:', error);
      this.setStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from SignalR hub.
   */
  async disconnect(): Promise<void> {
    this.clearReconnectTimer();
    this.joinedGroups.clear();
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch {
        // Ignore stop errors
      }
      this.connection = null;
    }
    this.setStatus('disconnected');
  }

  /**
   * Clean up all resources. Call from WebPart onDispose().
   */
  dispose(): void {
    this.disposed = true;
    this.disconnect();
    this.statusListeners = [];
    this.subscriptions = [];
  }

  /**
   * Join a SignalR group (e.g., 'project:2024-001').
   * Membership persists across reconnects.
   */
  async joinGroup(groupName: string): Promise<void> {
    this.joinedGroups.add(groupName);
    if (this._status !== 'connected' || !this.getAccessToken) return;

    try {
      const token = await this.getAccessToken();
      await fetch(`${this.baseUrl}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ groupName, action: 'join' }),
      });
    } catch (error) {
      console.warn('[SignalR] Failed to join group:', groupName, error);
    }
  }

  /**
   * Leave a SignalR group.
   */
  async leaveGroup(groupName: string): Promise<void> {
    this.joinedGroups.delete(groupName);
    if (this._status !== 'connected' || !this.getAccessToken) return;

    try {
      const token = await this.getAccessToken();
      await fetch(`${this.baseUrl}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ groupName, action: 'leave' }),
      });
    } catch (error) {
      console.warn('[SignalR] Failed to leave group:', groupName, error);
    }
  }

  /**
   * Broadcast a change message to other connected clients.
   * Fire-and-forget — never blocks the calling mutation.
   */
  async broadcastChange(message: SignalRMessage): Promise<void> {
    if (this._status !== 'connected' || !this.getAccessToken) return;

    try {
      const token = await this.getAccessToken();
      await fetch(`${this.baseUrl}/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });
    } catch (error) {
      console.warn('[SignalR] Broadcast failed:', error);
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private setStatus(status: SignalRConnectionStatus): void {
    if (this._status !== status) {
      this._status = status;
      this.statusListeners.forEach((fn) => fn(status));
    }
  }

  private dispatchMessage(message: SignalRMessage): void {
    for (const sub of this.subscriptions) {
      if (sub.channelKey === '*' || sub.channelKey === message.type) {
        try {
          sub.callback(message);
        } catch (error) {
          console.warn('[SignalR] Subscriber error:', error);
        }
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.disposed) return;
    this.clearReconnectTimer();

    const delay = Math.min(
      SignalRService.BASE_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempt),
      SignalRService.MAX_RECONNECT_DELAY
    );
    this.reconnectAttempt++;

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private async rejoinGroups(): Promise<void> {
    for (const group of this.joinedGroups) {
      await this.joinGroup(group);
    }
  }
}

export const signalRService = new SignalRService();

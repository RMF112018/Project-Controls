interface IQueuedWrite {
  id: string;
  timestamp: number;
  operation: 'create' | 'update' | 'delete';
  entityType: string;
  entityId?: number;
  data: unknown;
  retryCount: number;
}

export type ConnectivityStatus = 'online' | 'syncing' | 'offline';

type StatusChangeCallback = (status: ConnectivityStatus) => void;

export class OfflineQueueService {
  private queue: IQueuedWrite[] = [];
  private readonly STORAGE_KEY = 'hbc_offline_queue';
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly RETRY_INTERVAL = 30000;
  private retryTimer: ReturnType<typeof setInterval> | null = null;
  private _status: ConnectivityStatus = 'online';
  private statusListeners: StatusChangeCallback[] = [];
  private syncFn: ((item: IQueuedWrite) => Promise<void>) | null = null;

  constructor() {
    this.loadQueue();
    this.startMonitoring();
  }

  get status(): ConnectivityStatus {
    return this._status;
  }

  private setStatus(status: ConnectivityStatus): void {
    if (this._status !== status) {
      this._status = status;
      this.statusListeners.forEach(fn => fn(status));
    }
  }

  onStatusChange(callback: StatusChangeCallback): () => void {
    this.statusListeners.push(callback);
    return () => {
      this.statusListeners = this.statusListeners.filter(fn => fn !== callback);
    };
  }

  initialize(syncFunction: (item: IQueuedWrite) => Promise<void>): void {
    this.syncFn = syncFunction;
  }

  enqueue(operation: IQueuedWrite['operation'], entityType: string, data: unknown, entityId?: number): void {
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      console.warn('[OfflineQueue] Queue full, dropping oldest entry');
      this.queue.shift();
    }

    const item: IQueuedWrite = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
      operation,
      entityType,
      entityId,
      data,
      retryCount: 0,
    };

    this.queue.push(item);
    this.saveQueue();
    this.setStatus('offline');
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  async processQueue(): Promise<void> {
    if (!this.syncFn || this.queue.length === 0) return;

    this.setStatus('syncing');
    const processed: string[] = [];

    for (const item of this.queue) {
      try {
        await this.syncFn(item);
        processed.push(item.id);
      } catch {
        item.retryCount++;
        if (item.retryCount >= 5) {
          console.error('[OfflineQueue] Max retries reached, dropping:', item);
          processed.push(item.id);
        }
      }
    }

    this.queue = this.queue.filter(item => !processed.includes(item.id));
    this.saveQueue();
    this.setStatus(this.queue.length > 0 ? 'offline' : 'online');
  }

  private loadQueue(): void {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch {
      this.queue = [];
    }
  }

  private saveQueue(): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch {
      // Storage full
    }
  }

  private startMonitoring(): void {
    this.retryTimer = setInterval(() => {
      if (navigator.onLine && this.queue.length > 0) {
        this.processQueue();
      }
    }, this.RETRY_INTERVAL);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (this.queue.length > 0) {
          this.processQueue();
        } else {
          this.setStatus('online');
        }
      });
      window.addEventListener('offline', () => this.setStatus('offline'));
    }
  }

  dispose(): void {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
    }
  }
}

export const offlineQueueService = new OfflineQueueService();

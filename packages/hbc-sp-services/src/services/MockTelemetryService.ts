import type { ITelemetryService, ITelemetryEvent } from './ITelemetryService';

export class MockTelemetryService implements ITelemetryService {
  private _events: ITelemetryEvent[] = [];
  private _initialized = false;

  initialize(_cs: string, _user: string, _role: string): void {
    this._initialized = true;
    if (process.env.NODE_ENV === 'development') {
      console.debug('[MockTelemetry] Initialized (dev mode)');
    }
  }

  trackEvent(event: ITelemetryEvent): void {
    this._events.push(event);
    if (process.env.NODE_ENV === 'development') {
      console.debug('[MockTelemetry] event:', event.name, event.properties);
    }
  }

  trackMetric(name: string, value: number): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[MockTelemetry] metric:', name, value);
    }
  }

  trackException(error: Error): void {
    console.error('[MockTelemetry] exception:', error.message);
  }

  trackPageView(pageName: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[MockTelemetry] pageView:', pageName);
    }
  }

  flush(): void { /* no-op */ }

  isInitialized(): boolean { return this._initialized; }

  /** Dev/test: inspect captured events */
  getEvents(): ITelemetryEvent[] { return [...this._events]; }
  clearEvents(): void { this._events = []; }
}

export const mockTelemetryService = new MockTelemetryService();

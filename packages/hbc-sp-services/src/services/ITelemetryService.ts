export interface ITelemetryEvent {
  name: string;
  properties?: Record<string, string>;
  measurements?: Record<string, number>;
}

export interface ITelemetryService {
  /** Initialize SDK with connection string. Must be called before other methods. */
  initialize(connectionString: string, userId: string, roleName: string): void;
  /** Track a named business event (e.g. 'Audit.LeadCreated'). */
  trackEvent(event: ITelemetryEvent): void;
  /** Track a numeric metric (e.g. WebPart load time). */
  trackMetric(name: string, value: number, properties?: Record<string, string>): void;
  /** Track a caught or uncaught exception. PII scrubbing applied before send. */
  trackException(error: Error, properties?: Record<string, string>): void;
  /** Track a page view (called on route change). */
  trackPageView(pageName: string, url?: string): void;
  /**
   * Flush the internal buffer immediately — call in SPFx dispose() to ensure
   * in-flight events are sent before the web part is unloaded.
   */
  flush(): void;
  /** Returns whether telemetry is currently initialized and enabled. */
  isInitialized(): boolean;
}

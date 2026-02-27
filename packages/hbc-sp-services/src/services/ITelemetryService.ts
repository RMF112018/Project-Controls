export interface ITelemetryEvent {
  name: string;
  properties?: Record<string, string>;
  measurements?: Record<string, number>;
  correlation?: ITelemetryCorrelationContext;
  samplingKey?: string;
}

export interface ITelemetryStreamItem {
  kind: 'event' | 'metric' | 'exception' | 'pageView';
  name: string;
  timestamp: string;
  properties?: Record<string, string>;
  measurements?: Record<string, number>;
}

export interface ITelemetrySamplingRule {
  namePattern: string;
  sampleRate: number;
  kind?: ITelemetryStreamItem['kind'];
}

export interface ITelemetryCorrelationContext {
  operationId?: string;
  parentOperationId?: string;
  scope?: string;
}

export interface IMonitoringExportRow {
  timestamp: string;
  kind: ITelemetryStreamItem['kind'];
  name: string;
  route: string;
  workspace: string;
  role: string;
  corr_session_id: string;
  corr_operation_id: string;
  corr_parent_operation_id?: string;
  propertiesJson: string;
  measurementsJson: string;
}

export interface IMonitoringExportAggregates {
  byDay: Array<{ day: string; count: number }>;
  byName: Array<{ name: string; count: number }>;
  p95ByMetric: Array<{ metric: string; p95: number }>;
  breachCounts: Array<{ metric: string; threshold: number; count: number }>;
}

export interface IMonitoringExportOptions {
  fromDate?: string;
  toDate?: string;
  includeNames?: string[];
  limit?: number;
  retentionDays?: number;
}

export interface IMonitoringExportPayload {
  metadata: {
    generatedAt: string;
    retentionDays: number;
    rowCount: number;
    fromDate?: string;
    toDate?: string;
  };
  rows: IMonitoringExportRow[];
  aggregates: IMonitoringExportAggregates;
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
  /** Returns recent in-memory telemetry items for dashboard live refresh. */
  getRecentTelemetryItems(limit?: number): ITelemetryStreamItem[];
  /** Registers a callback sink used by the telemetry dashboard persistence bridge. */
  setDashboardSink(sink?: (item: ITelemetryStreamItem) => void): void;
  /** Sets event-level telemetry sampling rules (0..1 sample rates). */
  setSamplingRules(rules: ITelemetrySamplingRule[]): void;
  /** Returns the active event-level telemetry sampling rules. */
  getSamplingRules(): ITelemetrySamplingRule[];
  /** Creates an operation correlation ID, scoped by caller context. */
  newOperationId(scope: string): string;
  /** Returns session-level correlation ID shared across emitted events. */
  getSessionCorrelationId(): string;
  /** Sets retention window for in-memory telemetry records (days). */
  setRetentionDays(days: number): void;
  /** Returns retention window for in-memory telemetry records (days). */
  getRetentionDays(): number;
  /** Returns monitoring-ready export payload (rows + aggregates) for BI tooling. */
  getMonitoringExportPayload(options?: IMonitoringExportOptions): IMonitoringExportPayload;
}

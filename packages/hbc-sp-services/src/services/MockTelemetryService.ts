import type {
  ITelemetryService,
  ITelemetryEvent,
  ITelemetryStreamItem,
  ITelemetrySamplingRule,
  IMonitoringExportOptions,
  IMonitoringExportPayload,
} from './ITelemetryService';

const DEFAULT_RETENTION_DAYS = 30;
const DEFAULT_MAX_RECENT_ITEMS = 1000;

function parseIsoDate(value: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return Date.now();
  }
  return parsed;
}

function dateKey(iso: string): string {
  return new Date(parseIsoDate(iso)).toISOString().slice(0, 10);
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * p) - 1));
  return sorted[index] ?? 0;
}

export class MockTelemetryService implements ITelemetryService {
  private _events: ITelemetryEvent[] = [];
  private _initialized = false;
  private _recentItems: ITelemetryStreamItem[] = [];
  private _maxRecentItems = DEFAULT_MAX_RECENT_ITEMS;
  private _dashboardSink?: (item: ITelemetryStreamItem) => void;
  private _samplingRules: ITelemetrySamplingRule[] = [];
  private _samplingEnabled = false;
  private _retentionDays = DEFAULT_RETENTION_DAYS;
  private _sessionCorrelationId = '';
  private _operationCounter = 0;

  private nextSessionCorrelationId(): string {
    return `sess-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e8).toString(36)}`;
  }

  private pruneRecentItems(): void {
    const minTimestamp = Date.now() - (this._retentionDays * 24 * 60 * 60 * 1000);
    this._recentItems = this._recentItems
      .filter((item) => parseIsoDate(item.timestamp) >= minTimestamp)
      .slice(-this._maxRecentItems);
  }

  private withCorrelation(properties: Record<string, string> | undefined, scope: string): Record<string, string> {
    const operationId = properties?.corr_operation_id ?? this.newOperationId(scope);
    const sessionId = this.getSessionCorrelationId();
    return {
      ...(properties ?? {}),
      corr_session_id: sessionId,
      corr_operation_id: operationId,
    };
  }

  private pushRecentItem(item: ITelemetryStreamItem): void {
    this.pruneRecentItems();
    this._recentItems.push(item);
    this.pruneRecentItems();
    this._dashboardSink?.(item);
  }

  initialize(_cs: string, _user: string, _role: string): void {
    this._initialized = true;
    if (!this._sessionCorrelationId) {
      this._sessionCorrelationId = this.nextSessionCorrelationId();
    }
    if (process.env.NODE_ENV === 'development') {
      console.debug('[MockTelemetry] Initialized (dev mode)');
    }
  }

  trackEvent(event: ITelemetryEvent): void {
    this._events.push(event);
    const properties = this.withCorrelation(event.properties, event.correlation?.scope ?? 'event');
    this.pushRecentItem({
      kind: 'event',
      name: event.name,
      timestamp: new Date().toISOString(),
      properties,
      measurements: event.measurements,
    });
    if (process.env.NODE_ENV === 'development') {
      console.debug('[MockTelemetry] event:', event.name, event.properties);
    }
  }

  trackMetric(name: string, value: number, properties?: Record<string, string>): void {
    this.pushRecentItem({
      kind: 'metric',
      name,
      timestamp: new Date().toISOString(),
      properties: this.withCorrelation(properties, 'metric'),
      measurements: { value },
    });
    if (process.env.NODE_ENV === 'development') {
      console.debug('[MockTelemetry] metric:', name, value);
    }
  }

  trackException(error: Error, properties?: Record<string, string>): void {
    this.pushRecentItem({
      kind: 'exception',
      name: error.name || 'Error',
      timestamp: new Date().toISOString(),
      properties: this.withCorrelation({
        ...(properties ?? {}),
        message: error.message,
      }, 'exception'),
    });
    console.error('[MockTelemetry] exception:', error.message);
  }

  trackPageView(pageName: string, url?: string): void {
    this.pushRecentItem({
      kind: 'pageView',
      name: pageName,
      timestamp: new Date().toISOString(),
      properties: this.withCorrelation(url ? { url } : undefined, 'pageView'),
    });
    if (process.env.NODE_ENV === 'development') {
      console.debug('[MockTelemetry] pageView:', pageName);
    }
  }

  flush(): void { /* no-op */ }

  isInitialized(): boolean { return this._initialized; }

  getRecentTelemetryItems(limit?: number): ITelemetryStreamItem[] {
    this.pruneRecentItems();
    const max = limit && limit > 0 ? Math.floor(limit) : this._recentItems.length;
    if (max >= this._recentItems.length) {
      return [...this._recentItems];
    }
    return this._recentItems.slice(this._recentItems.length - max);
  }

  setDashboardSink(sink?: (item: ITelemetryStreamItem) => void): void {
    this._dashboardSink = sink;
  }

  setSamplingRules(rules: ITelemetrySamplingRule[]): void {
    this._samplingRules = [...rules];
  }

  getSamplingRules(): ITelemetrySamplingRule[] {
    return [...this._samplingRules];
  }

  newOperationId(scope: string): string {
    this._operationCounter += 1;
    const normalizedScope = scope.trim().replace(/[^a-zA-Z0-9_-]+/g, '-') || 'op';
    return `${normalizedScope}-${Date.now().toString(36)}-${this._operationCounter.toString(36)}`;
  }

  getSessionCorrelationId(): string {
    if (!this._sessionCorrelationId) {
      this._sessionCorrelationId = this.nextSessionCorrelationId();
    }
    return this._sessionCorrelationId;
  }

  setRetentionDays(days: number): void {
    if (!Number.isFinite(days)) return;
    this._retentionDays = Math.max(1, Math.floor(days));
    this.pruneRecentItems();
  }

  getRetentionDays(): number {
    return this._retentionDays;
  }

  getMonitoringExportPayload(options?: IMonitoringExportOptions): IMonitoringExportPayload {
    const now = Date.now();
    const retentionDays = options?.retentionDays ?? this._retentionDays;
    const fromMs = options?.fromDate ? parseIsoDate(options.fromDate) : now - (retentionDays * 24 * 60 * 60 * 1000);
    const toMs = options?.toDate ? parseIsoDate(options.toDate) : now;
    const include = options?.includeNames ? new Set(options.includeNames) : null;

    const byDay = new Map<string, number>();
    const byName = new Map<string, number>();
    const metrics = new Map<string, number[]>();

    const rows = this.getRecentTelemetryItems(options?.limit)
      .filter((item) => {
        const itemMs = parseIsoDate(item.timestamp);
        if (itemMs < fromMs || itemMs > toMs) return false;
        if (include && !include.has(item.name)) return false;
        return true;
      })
      .map((item) => {
        byDay.set(dateKey(item.timestamp), (byDay.get(dateKey(item.timestamp)) ?? 0) + 1);
        byName.set(item.name, (byName.get(item.name) ?? 0) + 1);
        const metricValue = toNumber(item.measurements?.value) ?? toNumber(item.measurements?.durationMs);
        if (metricValue !== undefined) {
          const values = metrics.get(item.name) ?? [];
          values.push(metricValue);
          metrics.set(item.name, values);
        }

        const route = item.properties?.route ?? item.properties?.toPath ?? item.properties?.fromPath ?? '/';
        const normalized = route.replace(/^\//, '');
        const workspace = item.properties?.workspaceId ?? (normalized.split('/')[0] || 'hub');
        return {
          timestamp: item.timestamp,
          kind: item.kind,
          name: item.name,
          route,
          workspace,
          role: item.properties?.role ?? item.properties?.userRole ?? 'Unknown',
          corr_session_id: item.properties?.corr_session_id ?? this.getSessionCorrelationId(),
          corr_operation_id: item.properties?.corr_operation_id ?? this.newOperationId('export'),
          corr_parent_operation_id: item.properties?.corr_parent_operation_id,
          propertiesJson: JSON.stringify(item.properties ?? {}),
          measurementsJson: JSON.stringify(item.measurements ?? {}),
        };
      });

    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        retentionDays,
        rowCount: rows.length,
        fromDate: options?.fromDate,
        toDate: options?.toDate,
      },
      rows,
      aggregates: {
        byDay: Array.from(byDay.entries()).map(([day, count]) => ({ day, count })),
        byName: Array.from(byName.entries()).map(([name, count]) => ({ name, count })),
        p95ByMetric: Array.from(metrics.entries()).map(([metric, values]) => ({
          metric,
          p95: Number(percentile(values, 0.95).toFixed(2)),
        })),
        breachCounts: [],
      },
    };
  }

  /** Dev/test: inspect captured events */
  getEvents(): ITelemetryEvent[] { return [...this._events]; }
  clearEvents(): void { this._events = []; }

  /** Dev/test: report whether deterministic sampling is active. */
  isSamplingEnabled(): boolean { return this._samplingEnabled; }
}

export const mockTelemetryService = new MockTelemetryService();

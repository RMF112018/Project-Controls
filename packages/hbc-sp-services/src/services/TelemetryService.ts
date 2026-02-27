import type { ITelemetryItem } from '@microsoft/applicationinsights-web';
import type {
  ITelemetryService,
  ITelemetryEvent,
  ITelemetryStreamItem,
  ITelemetrySamplingRule,
  ITelemetryCorrelationContext,
  IMonitoringExportOptions,
  IMonitoringExportPayload,
  IMonitoringExportRow,
} from './ITelemetryService';

const PII_FIELDS = ['email', 'loginname', 'displayname', 'userid'];
const DEFAULT_RETENTION_DAYS = 30;
const DEFAULT_MAX_RECENT_ITEMS = 1000;
const HASH_MODULUS = 10000;

const DEFAULT_SAMPLING_RULES: ITelemetrySamplingRule[] = [
  { namePattern: 'route:lazy:load', sampleRate: 1 },
  { namePattern: 'route:lazy:load:duration', sampleRate: 1 },
  { namePattern: 'route:lazy:load:failure', sampleRate: 1 },
  { namePattern: 'chunk:load:error', sampleRate: 1 },
  { namePattern: 'a11y:scan:summary', sampleRate: 1 },
  { namePattern: 'a11y:responsive:summary', sampleRate: 1 },
  { namePattern: 'app:load:completed', sampleRate: 1 },
  { namePattern: 'ui:error:boundary', sampleRate: 1 },
  { namePattern: 'telemetry:export:generated', sampleRate: 1 },
  { namePattern: 'app:init:phase:duration', sampleRate: 0.5 },
  { namePattern: 'virtualization:frame:jank', sampleRate: 0.5 },
  { namePattern: 'longtask:jank:summary', sampleRate: 0.5 },
  { namePattern: 'react:commit:duration', sampleRate: 0.25 },
  { namePattern: 'table:filter:interaction', sampleRate: 0.25 },
  { namePattern: 'virtualization:state', sampleRate: 0.25 },
  { namePattern: '*', sampleRate: 1 },
];

function hashString(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function encodePii(value: string): string {
  try {
    if (typeof btoa === 'function') {
      return btoa(value).slice(-8);
    }
  } catch {
    // fallback below
  }
  return Math.abs(hashString(value)).toString(36).slice(0, 8);
}

function scrubPii(props: Record<string, string> = {}): Record<string, string> {
  const clean: Record<string, string> = {};
  for (const [key, value] of Object.entries(props)) {
    if (PII_FIELDS.includes(key.toLowerCase())) {
      clean[key] = encodePii(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

function parseIsoDate(value: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return Date.now();
  }
  return parsed;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * p) - 1));
  return sorted[index] ?? 0;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function dateKey(iso: string): string {
  return new Date(parseIsoDate(iso)).toISOString().slice(0, 10);
}

function pickRoute(properties?: Record<string, string>): string {
  return properties?.route ?? properties?.toPath ?? properties?.fromPath ?? '/';
}

function pickWorkspace(route: string, properties?: Record<string, string>): string {
  if (properties?.workspaceId) {
    return properties.workspaceId;
  }
  const normalized = route.replace(/^\//, '');
  if (!normalized) return 'hub';
  return normalized.split('/')[0] || 'hub';
}

function pickRole(properties?: Record<string, string>): string {
  return properties?.role ?? properties?.userRole ?? 'Unknown';
}

function metricCandidate(item: ITelemetryStreamItem): number | undefined {
  return (
    toNumber(item.measurements?.value) ??
    toNumber(item.measurements?.durationMs) ??
    toNumber(item.measurements?.maxFrameDeltaMs) ??
    toNumber(item.measurements?.avgFrameDeltaMs)
  );
}

export class TelemetryService implements ITelemetryService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _appInsights: any = null;
  private _initialized = false;
  private _recentItems: ITelemetryStreamItem[] = [];
  private _maxRecentItems = DEFAULT_MAX_RECENT_ITEMS;
  private _dashboardSink?: (item: ITelemetryStreamItem) => void;
  private _samplingRules: ITelemetrySamplingRule[] = [...DEFAULT_SAMPLING_RULES];
  private _retentionDays = DEFAULT_RETENTION_DAYS;
  private _sessionCorrelationId = '';
  private _operationCounter = 0;

  private pruneRecentItems(nowMs: number = Date.now()): void {
    const minTimestamp = nowMs - (this._retentionDays * 24 * 60 * 60 * 1000);
    this._recentItems = this._recentItems
      .filter((item) => parseIsoDate(item.timestamp) >= minTimestamp)
      .slice(-this._maxRecentItems);
  }

  private nextSessionCorrelationId(): string {
    return `sess-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e8).toString(36)}`;
  }

  private resolveSamplingRule(name: string, kind: ITelemetryStreamItem['kind']): ITelemetrySamplingRule {
    for (const rule of this._samplingRules) {
      const kindMatches = !rule.kind || rule.kind === kind;
      const patternMatches = rule.namePattern === '*' || rule.namePattern === name;
      if (kindMatches && patternMatches) {
        return rule;
      }
    }
    return { namePattern: '*', sampleRate: 1 };
  }

  private shouldSample(
    name: string,
    kind: ITelemetryStreamItem['kind'],
    operationId: string,
    samplingKey?: string,
  ): boolean {
    const rule = this.resolveSamplingRule(name, kind);
    if (rule.sampleRate >= 1) return true;
    if (rule.sampleRate <= 0) return false;

    const seed = `${this._sessionCorrelationId}|${name}|${kind}|${operationId}|${samplingKey ?? ''}`;
    const value = hashString(seed) % HASH_MODULUS;
    return value < Math.floor(rule.sampleRate * HASH_MODULUS);
  }

  private withCorrelation(
    properties: Record<string, string> | undefined,
    correlation?: ITelemetryCorrelationContext,
  ): { properties: Record<string, string>; operationId: string } {
    const base = scrubPii(properties);
    const operationId = correlation?.operationId
      ?? base.corr_operation_id
      ?? this.newOperationId(correlation?.scope ?? 'op');
    const sessionId = this._sessionCorrelationId || this.getSessionCorrelationId();

    const next: Record<string, string> = {
      ...base,
      corr_session_id: sessionId,
      corr_operation_id: operationId,
    };

    const parentId = correlation?.parentOperationId ?? base.corr_parent_operation_id;
    if (parentId) {
      next.corr_parent_operation_id = parentId;
    }

    return { properties: next, operationId };
  }

  private pushRecentItem(item: ITelemetryStreamItem): void {
    this.pruneRecentItems();
    this._recentItems.push(item);
    this.pruneRecentItems();
    this._dashboardSink?.(item);
  }

  initialize(connectionString: string, userHash: string, roleName: string): void {
    if (this._initialized) return;
    this._sessionCorrelationId = this.nextSessionCorrelationId();

    import('@microsoft/applicationinsights-web').then(({ ApplicationInsights }) => {
      this._appInsights = new ApplicationInsights({
        config: {
          connectionString,
          enableAutoRouteTracking: false,
          disableAjaxTracking: true,
          samplingPercentage: 100,
          maxBatchSizeInBytes: 65536,
          maxBatchInterval: 5000,
        },
      });

      this._appInsights.addTelemetryInitializer((item: ITelemetryItem) => {
        item.tags = item.tags ?? [];
        item.tags['ai.user.id'] = userHash;
        item.tags['ai.user.authUserId'] = userHash;
        if (item.baseData) {
          item.baseData.properties = {
            ...item.baseData.properties,
            hbc_role: roleName,
            hbc_spfxVersion: '1.22.2',
          };
        }
        return true;
      });

      this._appInsights.loadAppInsights();
    }).catch(() => {
      // Graceful degradation by design.
    });

    this._initialized = true;
  }

  trackEvent(event: ITelemetryEvent): void {
    const correlated = this.withCorrelation(event.properties, event.correlation);
    if (!this.shouldSample(event.name, 'event', correlated.operationId, event.samplingKey)) {
      return;
    }

    const item: ITelemetryStreamItem = {
      kind: 'event',
      name: event.name,
      timestamp: new Date().toISOString(),
      properties: correlated.properties,
      measurements: event.measurements,
    };
    this.pushRecentItem(item);

    if (!this._initialized || !this._appInsights) return;
    this._appInsights.trackEvent({
      name: event.name,
      properties: correlated.properties,
      measurements: event.measurements,
    });
  }

  trackMetric(name: string, value: number, properties?: Record<string, string>): void {
    const correlated = this.withCorrelation(properties, { scope: 'metric' });
    if (!this.shouldSample(name, 'metric', correlated.operationId)) {
      return;
    }

    const item: ITelemetryStreamItem = {
      kind: 'metric',
      name,
      timestamp: new Date().toISOString(),
      properties: correlated.properties,
      measurements: { value },
    };
    this.pushRecentItem(item);

    if (!this._initialized || !this._appInsights) return;
    this._appInsights.trackMetric({ name, average: value }, correlated.properties);
  }

  trackException(error: Error, properties?: Record<string, string>): void {
    const correlated = this.withCorrelation({
      ...(properties ?? {}),
      message: error.message,
    }, { scope: 'exception' });
    if (!this.shouldSample(error.name || 'Error', 'exception', correlated.operationId)) {
      return;
    }

    const item: ITelemetryStreamItem = {
      kind: 'exception',
      name: error.name || 'Error',
      timestamp: new Date().toISOString(),
      properties: correlated.properties,
    };
    this.pushRecentItem(item);

    if (!this._initialized || !this._appInsights) return;
    this._appInsights.trackException({ exception: error, properties: correlated.properties });
  }

  trackPageView(pageName: string, url?: string): void {
    const correlated = this.withCorrelation(url ? { url } : undefined, { scope: 'pageView' });
    if (!this.shouldSample(pageName, 'pageView', correlated.operationId)) {
      return;
    }

    const item: ITelemetryStreamItem = {
      kind: 'pageView',
      name: pageName,
      timestamp: new Date().toISOString(),
      properties: correlated.properties,
    };
    this.pushRecentItem(item);

    if (!this._initialized || !this._appInsights) return;
    this._appInsights.trackPageView({ name: pageName, uri: url, properties: correlated.properties });
  }

  flush(): void {
    this._appInsights?.flush();
  }

  isInitialized(): boolean {
    return this._initialized;
  }

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
    this._samplingRules = rules.length > 0 ? [...rules] : [...DEFAULT_SAMPLING_RULES];
  }

  getSamplingRules(): ITelemetrySamplingRule[] {
    return [...this._samplingRules];
  }

  newOperationId(scope: string): string {
    this._operationCounter += 1;
    const normalizedScope = scope.trim().replace(/[^a-zA-Z0-9_-]+/g, '-') || 'op';
    return `${normalizedScope}-${Date.now().toString(36)}-${this._operationCounter.toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
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
    const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;
    const fromMs = options?.fromDate ? parseIsoDate(options.fromDate) : now - maxAgeMs;
    const toMs = options?.toDate ? parseIsoDate(options.toDate) : now;
    const include = options?.includeNames ? new Set(options.includeNames) : null;

    const rows: IMonitoringExportRow[] = [];
    const byDay = new Map<string, number>();
    const byName = new Map<string, number>();
    const metricValues = new Map<string, number[]>();
    const breachCounts = new Map<string, { threshold: number; count: number }>();

    const items = this.getRecentTelemetryItems(options?.limit);
    for (const item of items) {
      const itemMs = parseIsoDate(item.timestamp);
      if (itemMs < fromMs || itemMs > toMs) {
        continue;
      }
      if (include && !include.has(item.name)) {
        continue;
      }

      const route = pickRoute(item.properties);
      const workspace = pickWorkspace(route, item.properties);
      const role = pickRole(item.properties);
      const corrSession = item.properties?.corr_session_id ?? this.getSessionCorrelationId();
      const corrOperation = item.properties?.corr_operation_id ?? this.newOperationId('export');

      rows.push({
        timestamp: item.timestamp,
        kind: item.kind,
        name: item.name,
        route,
        workspace,
        role,
        corr_session_id: corrSession,
        corr_operation_id: corrOperation,
        corr_parent_operation_id: item.properties?.corr_parent_operation_id,
        propertiesJson: JSON.stringify(item.properties ?? {}),
        measurementsJson: JSON.stringify(item.measurements ?? {}),
      });

      const day = dateKey(item.timestamp);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
      byName.set(item.name, (byName.get(item.name) ?? 0) + 1);

      const metricValue = metricCandidate(item);
      if (metricValue !== undefined) {
        const values = metricValues.get(item.name) ?? [];
        values.push(metricValue);
        metricValues.set(item.name, values);
      }

      const threshold = item.name === 'route:lazy:load:duration'
        ? 500
        : item.name === 'longtask:jank:summary'
          ? 250
          : item.name === 'chunk:load:error'
            ? 0
            : undefined;
      if (threshold !== undefined) {
        const value = metricValue ?? 1;
        if (value > threshold) {
          const current = breachCounts.get(item.name) ?? { threshold, count: 0 };
          current.count += 1;
          breachCounts.set(item.name, current);
        }
      }
    }

    const p95ByMetric = Array.from(metricValues.entries()).map(([metric, values]) => ({
      metric,
      p95: Number(percentile(values, 0.95).toFixed(2)),
    }));

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
        byDay: Array.from(byDay.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([day, count]) => ({ day, count })),
        byName: Array.from(byName.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([name, count]) => ({ name, count })),
        p95ByMetric,
        breachCounts: Array.from(breachCounts.entries()).map(([metric, value]) => ({
          metric,
          threshold: value.threshold,
          count: value.count,
        })),
      },
    };
  }
}

export const telemetryService = new TelemetryService();

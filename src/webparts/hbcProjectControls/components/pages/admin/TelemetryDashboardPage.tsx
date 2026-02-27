import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Input,
  Select,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import {
  EntityType,
  ExportService,
  RoleName,
  type IAuditEntry,
  type ITelemetryService,
} from '@hbc/sp-services';
import { useAppContext } from '../../contexts/AppContext';
import { RoleGate } from '../../guards/RoleGate';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { HbcEChart } from '../../shared/HbcEChart';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { KPICard } from '../../shared/KPICard';
import { ExportButtons } from '../../shared/ExportButtons';
import { HbcSkeleton } from '../../shared/HbcSkeleton';

type TelemetryKind = ITelemetryStreamItem['kind'];
type TelemetrySource = 'audit' | 'live';

interface ITelemetryStreamItem {
  kind: 'event' | 'metric' | 'exception' | 'pageView';
  name: string;
  timestamp: string;
  properties?: Record<string, string>;
  measurements?: Record<string, number>;
}

interface ITelemetryDashboardLiveCapable {
  getRecentTelemetryItems?: (limit?: number) => ITelemetryStreamItem[];
  getMonitoringExportPayload?: (options?: {
    fromDate?: string;
    toDate?: string;
    limit?: number;
    retentionDays?: number;
  }) => IMonitoringExportPayload;
  getRetentionDays?: () => number;
}

interface IMonitoringExportPayload {
  metadata: {
    generatedAt: string;
    retentionDays: number;
    rowCount: number;
    fromDate?: string;
    toDate?: string;
  };
  rows: Array<Record<string, unknown>>;
  aggregates: {
    byDay: Array<{ day: string; count: number }>;
    byName: Array<{ name: string; count: number }>;
    p95ByMetric: Array<{ metric: string; p95: number }>;
    breachCounts: Array<{ metric: string; threshold: number; count: number }>;
  };
}

interface ITelemetryDashboardItem extends ITelemetryStreamItem {
  source: TelemetrySource;
  route: string;
  workspace: string;
  role: string;
  dedupeKey: string;
}

interface IKpiSnapshot {
  avgLoadTime: number;
  activeUsers30d: number;
  provisioningSuccess: number;
  totalEvents: number;
  p95LazyLoadDuration: number;
  avgJankMax: number;
  a11yViolationTotal: number;
  p95AppLoad: number;
}

const EVENT_NAMES = {
  lazyLoad: 'route:lazy:load',
  lazyDuration: 'route:lazy:load:duration',
  virtualizationJank: 'virtualization:frame:jank',
  virtualizationState: 'virtualization:state',
  a11yScan: 'a11y:scan:summary',
  a11yResponsive: 'a11y:responsive:summary',
  appInitPhaseDuration: 'app:init:phase:duration',
} as const;

const useStyles = makeStyles({
  root: {
    ...shorthands.padding('16px', '0'),
    display: 'grid',
    ...shorthands.gap('16px'),
  },
  filters: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    ...shorthands.gap('12px'),
    alignItems: 'end',
  },
  filterField: {
    display: 'grid',
    ...shorthands.gap('4px'),
  },
  filterLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  filterActions: {
    display: 'flex',
    ...shorthands.gap('8px'),
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    ...shorthands.gap('12px'),
  },
  chartGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    ...shorthands.gap('12px'),
  },
  tableSection: {
    display: 'grid',
    ...shorthands.gap('10px'),
  },
  tableMeta: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  muted: {
    color: tokens.colorNeutralForeground3,
  },
});

function parseTelemetryKind(value: unknown): TelemetryKind {
  if (value === 'event' || value === 'metric' || value === 'exception' || value === 'pageView') {
    return value;
  }
  return 'event';
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

function toIsoDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
}

function dateKey(value: string): string {
  return toIsoDate(value).slice(0, 10);
}

function workspaceFromRoute(route: string): string {
  const normalized = route.replace(/^\//, '');
  if (!normalized) {
    return 'hub';
  }
  return normalized.split('/')[0] || 'hub';
}

function pickRoute(item: Pick<ITelemetryStreamItem, 'properties'>): string {
  const routeValue =
    item.properties?.route ??
    item.properties?.toPath ??
    item.properties?.fromPath;
  if (typeof routeValue === 'string' && routeValue.trim().length > 0) {
    return routeValue;
  }
  return '/';
}

function parseAuditTelemetry(entry: IAuditEntry): ITelemetryStreamItem | null {
  try {
    const parsed = JSON.parse(entry.Details ?? '{}') as Partial<ITelemetryStreamItem>;
    const properties =
      parsed.properties && typeof parsed.properties === 'object'
        ? parsed.properties
        : undefined;
    const measurements =
      parsed.measurements && typeof parsed.measurements === 'object'
        ? parsed.measurements
        : undefined;

    return {
      kind: parseTelemetryKind(parsed.kind),
      name: typeof parsed.name === 'string' && parsed.name.length > 0 ? parsed.name : entry.EntityId,
      timestamp: typeof parsed.timestamp === 'string' ? parsed.timestamp : entry.Timestamp,
      properties,
      measurements,
    };
  } catch {
    return null;
  }
}

function toDashboardItem(item: ITelemetryStreamItem, source: TelemetrySource): ITelemetryDashboardItem {
  const route = pickRoute(item);
  const workspace =
    typeof item.properties?.workspaceId === 'string' && item.properties.workspaceId.length > 0
      ? item.properties.workspaceId
      : workspaceFromRoute(route);
  const role =
    typeof item.properties?.role === 'string' && item.properties.role.length > 0
      ? item.properties.role
      : typeof item.properties?.userRole === 'string' && item.properties.userRole.length > 0
        ? item.properties.userRole
        : 'Unknown';
  const dedupeKey = [
    item.kind,
    item.name,
    item.timestamp,
    route,
    workspace,
    role,
  ].join('|');

  return {
    ...item,
    source,
    route,
    workspace,
    role,
    dedupeKey,
  };
}

function getMetricValue(item: ITelemetryDashboardItem): number | undefined {
  return (
    toNumber(item.measurements?.value) ??
    toNumber(item.measurements?.durationMs) ??
    toNumber(item.measurements?.maxFrameDeltaMs) ??
    toNumber(item.measurements?.violationCount)
  );
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values: number[], percentileValue: number): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * percentileValue) - 1));
  return sorted[index] ?? 0;
}

function bucketSeries(
  items: ITelemetryDashboardItem[],
  mapper: (item: ITelemetryDashboardItem) => number | undefined,
): Array<{ day: string; value: number }> {
  const buckets = new Map<string, number[]>();

  for (const item of items) {
    const value = mapper(item);
    if (value === undefined) {
      continue;
    }
    const key = dateKey(item.timestamp);
    const existing = buckets.get(key) ?? [];
    existing.push(value);
    buckets.set(key, existing);
  }

  return Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, values]) => ({ day, value: Number(average(values).toFixed(2)) }));
}

function inDateRange(isoTimestamp: string, fromDate: string, toDate: string): boolean {
  const value = toIsoDate(isoTimestamp).slice(0, 10);
  if (fromDate && value < fromDate) {
    return false;
  }
  if (toDate && value > toDate) {
    return false;
  }
  return true;
}

function formatNumber(value: number, digits: number = 0): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

const ACCESS_DENIED = (
  <HbcCard title="Telemetry Dashboard" subtitle="Access denied">
    You need Administrator or Leadership role access to view telemetry monitoring.
  </HbcCard>
);

const exportService = new ExportService();
type IExportServiceWithMonitoringBundle = ExportService & {
  exportMonitoringBundle?: (payload: IMonitoringExportPayload, options: { filename: string; title?: string }) => void;
};
const MONITORING_RETENTION_DAYS = 30;

export const TelemetryDashboardPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, telemetryService, isFeatureEnabled } = useAppContext();

  const [routeFilter, setRouteFilter] = React.useState('');
  const [workspaceFilter, setWorkspaceFilter] = React.useState('all');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [fromDate, setFromDate] = React.useState('');
  const [toDate, setToDate] = React.useState('');
  const defaultFromDate = React.useMemo(() => {
    return new Date(Date.now() - (MONITORING_RETENTION_DAYS * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10);
  }, []);
  const effectiveFromDate = fromDate || defaultFromDate;

  React.useEffect(() => {
    telemetryService.trackPageView('AdminTelemetryDashboard', '/#/admin/telemetry');
  }, [telemetryService]);

  const auditQuery = useQuery({
    queryKey: ['telemetry-dashboard', 'audit', effectiveFromDate, toDate],
    queryFn: () => dataService.getAuditLog(EntityType.Telemetry, undefined, effectiveFromDate || undefined, toDate || undefined),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const performanceQuery = useQuery({
    queryKey: ['telemetry-dashboard', 'performance', effectiveFromDate, toDate],
    queryFn: () => dataService.getPerformanceLogs({
      startDate: effectiveFromDate || undefined,
      endDate: toDate || undefined,
      limit: 2000,
    }),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const liveQuery = useQuery({
    queryKey: ['telemetry-dashboard', 'live'],
    queryFn: () => {
      const liveCapable = telemetryService as ITelemetryService & ITelemetryDashboardLiveCapable;
      return Promise.resolve(liveCapable.getRecentTelemetryItems?.(1000) ?? []);
    },
    staleTime: 0,
    refetchInterval: 5_000,
  });

  const allTelemetryItems = React.useMemo(() => {
    const auditItems = (auditQuery.data ?? [])
      .map(parseAuditTelemetry)
      .filter((item): item is ITelemetryStreamItem => item !== null)
      .map((item) => toDashboardItem(item, 'audit'));

    const liveItems = (liveQuery.data ?? []).map((item) => toDashboardItem(item, 'live'));

    const merged = [...auditItems, ...liveItems].filter((item) => inDateRange(item.timestamp, effectiveFromDate, toDate));

    const deduped = new Map<string, ITelemetryDashboardItem>();
    for (const item of merged) {
      deduped.set(item.dedupeKey, item);
    }

    return Array.from(deduped.values()).sort((a, b) =>
      toIsoDate(b.timestamp).localeCompare(toIsoDate(a.timestamp))
    );
  }, [auditQuery.data, liveQuery.data, effectiveFromDate, toDate]);

  const workspaceOptions = React.useMemo(() => {
    return Array.from(new Set(allTelemetryItems.map((item) => item.workspace))).sort();
  }, [allTelemetryItems]);

  const roleOptions = React.useMemo(() => {
    return Array.from(new Set(allTelemetryItems.map((item) => item.role))).sort();
  }, [allTelemetryItems]);

  const filteredItems = React.useMemo(() => {
    return allTelemetryItems.filter((item) => {
      if (routeFilter && !item.route.toLowerCase().includes(routeFilter.toLowerCase())) {
        return false;
      }
      if (workspaceFilter !== 'all' && item.workspace !== workspaceFilter) {
        return false;
      }
      if (roleFilter !== 'all' && item.role !== roleFilter) {
        return false;
      }
      return true;
    });
  }, [allTelemetryItems, routeFilter, workspaceFilter, roleFilter]);

  const filteredPerformanceLogs = React.useMemo(() => {
    return (performanceQuery.data ?? []).filter((log) => inDateRange(log.Timestamp, effectiveFromDate, toDate));
  }, [performanceQuery.data, effectiveFromDate, toDate]);

  const kpiSnapshot = React.useMemo<IKpiSnapshot>(() => {
    const totalLoads = filteredPerformanceLogs.map((log) => log.TotalLoadMs).filter((value) => Number.isFinite(value));
    const lazyDurations = filteredItems
      .filter((item) => item.name === EVENT_NAMES.lazyDuration)
      .map((item) => toNumber(item.measurements?.value))
      .filter((value): value is number => value !== undefined);

    const jankMaxValues = filteredItems
      .filter((item) => item.name === EVENT_NAMES.virtualizationJank)
      .map((item) => toNumber(item.measurements?.maxFrameDeltaMs))
      .filter((value): value is number => value !== undefined);

    const a11yViolations = filteredItems
      .filter((item) => item.name === EVENT_NAMES.a11yScan || item.name === EVENT_NAMES.a11yResponsive)
      .map((item) => toNumber(item.measurements?.violationCount) ?? 0);

    const lazyLoadEvents = filteredItems.filter((item) => item.name === EVENT_NAMES.lazyLoad);
    const successfulLazyLoads = lazyLoadEvents.filter((item) => item.properties?.success === 'true').length;
    const activeUsers = new Set((auditQuery.data ?? []).map((entry) => entry.User).filter(Boolean));

    return {
      avgLoadTime: Number(average(totalLoads).toFixed(1)),
      activeUsers30d: activeUsers.size,
      provisioningSuccess: lazyLoadEvents.length > 0
        ? Number(((successfulLazyLoads / lazyLoadEvents.length) * 100).toFixed(1))
        : 0,
      totalEvents: filteredItems.length,
      p95LazyLoadDuration: Number(percentile(lazyDurations, 0.95).toFixed(1)),
      avgJankMax: Number(average(jankMaxValues).toFixed(1)),
      a11yViolationTotal: a11yViolations.reduce((sum, value) => sum + value, 0),
      p95AppLoad: Number(percentile(totalLoads, 0.95).toFixed(1)),
    };
  }, [auditQuery.data, filteredItems, filteredPerformanceLogs]);

  const lazyDurationTrend = React.useMemo(
    () => bucketSeries(filteredItems.filter((item) => item.name === EVENT_NAMES.lazyDuration), getMetricValue),
    [filteredItems],
  );

  const lazyOutcomeByDay = React.useMemo(() => {
    const buckets = new Map<string, { success: number; failure: number }>();
    for (const item of filteredItems) {
      if (item.name !== EVENT_NAMES.lazyLoad) {
        continue;
      }
      const key = dateKey(item.timestamp);
      const bucket = buckets.get(key) ?? { success: 0, failure: 0 };
      const success = String(item.properties?.success ?? 'false') === 'true';
      if (success) {
        bucket.success += 1;
      } else {
        bucket.failure += 1;
      }
      buckets.set(key, bucket);
    }

    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, outcome]) => ({ day, ...outcome }));
  }, [filteredItems]);

  const virtualizationJankTrend = React.useMemo(() => {
    const buckets = new Map<string, { maxValues: number[]; avgValues: number[] }>();
    for (const item of filteredItems) {
      if (item.name !== EVENT_NAMES.virtualizationJank) {
        continue;
      }
      const key = dateKey(item.timestamp);
      const bucket = buckets.get(key) ?? { maxValues: [], avgValues: [] };
      const maxDelta = toNumber(item.measurements?.maxFrameDeltaMs);
      const avgDelta = toNumber(item.measurements?.avgFrameDeltaMs);
      if (maxDelta !== undefined) {
        bucket.maxValues.push(maxDelta);
      }
      if (avgDelta !== undefined) {
        bucket.avgValues.push(avgDelta);
      }
      buckets.set(key, bucket);
    }

    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, values]) => ({
        day,
        maxDelta: Number(average(values.maxValues).toFixed(2)),
        avgDelta: Number(average(values.avgValues).toFixed(2)),
      }));
  }, [filteredItems]);

  const virtualizationStateByTable = React.useMemo(() => {
    const buckets = new Map<string, number>();
    for (const item of filteredItems) {
      if (item.name !== EVENT_NAMES.virtualizationState) {
        continue;
      }
      const tableId = typeof item.properties?.tableId === 'string' ? item.properties.tableId : 'unknown';
      buckets.set(tableId, (buckets.get(tableId) ?? 0) + 1);
    }

    return Array.from(buckets.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tableId, count]) => ({ tableId, count }));
  }, [filteredItems]);

  const a11yViolationTrend = React.useMemo(() => {
    return bucketSeries(
      filteredItems.filter((item) => item.name === EVENT_NAMES.a11yScan || item.name === EVENT_NAMES.a11yResponsive),
      (item) => toNumber(item.measurements?.violationCount),
    );
  }, [filteredItems]);

  const a11ySeverityTrend = React.useMemo(() => {
    const buckets = new Map<string, { critical: number; serious: number }>();
    for (const item of filteredItems) {
      if (item.name !== EVENT_NAMES.a11yScan && item.name !== EVENT_NAMES.a11yResponsive) {
        continue;
      }
      const key = dateKey(item.timestamp);
      const bucket = buckets.get(key) ?? { critical: 0, serious: 0 };
      bucket.critical += toNumber(item.measurements?.criticalCount) ?? 0;
      bucket.serious += toNumber(item.measurements?.seriousCount) ?? 0;
      buckets.set(key, bucket);
    }

    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, severity]) => ({ day, ...severity }));
  }, [filteredItems]);

  const appInitPhaseDurations = React.useMemo(() => {
    const phaseBuckets = new Map<string, number[]>();
    for (const item of filteredItems) {
      if (item.name !== EVENT_NAMES.appInitPhaseDuration) {
        continue;
      }
      const phase = typeof item.properties?.phase === 'string' ? item.properties.phase : 'unknown';
      const value = toNumber(item.measurements?.durationMs) ?? toNumber(item.measurements?.value);
      if (value === undefined) {
        continue;
      }
      const values = phaseBuckets.get(phase) ?? [];
      values.push(value);
      phaseBuckets.set(phase, values);
    }

    return Array.from(phaseBuckets.entries())
      .map(([phase, values]) => ({ phase, avgMs: Number(average(values).toFixed(2)) }))
      .sort((a, b) => b.avgMs - a.avgMs);
  }, [filteredItems]);

  const stage13PerformanceTrend = React.useMemo(() => {
    const buckets = new Map<string, number[]>();
    for (const log of filteredPerformanceLogs) {
      const key = dateKey(log.Timestamp);
      const values = buckets.get(key) ?? [];
      values.push(log.TotalLoadMs);
      buckets.set(key, values);
    }

    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, values]) => ({
        day,
        avgMs: Number(average(values).toFixed(2)),
        p95Ms: Number(percentile(values, 0.95).toFixed(2)),
      }));
  }, [filteredPerformanceLogs]);

  const chartCards = React.useMemo(() => {
    const noData = (values: unknown[]): boolean => values.length === 0;

    return [
      {
        title: 'Lazy-Load Duration Trend',
        subtitle: 'route:lazy:load:duration (ms)',
        empty: noData(lazyDurationTrend),
        option: {
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: lazyDurationTrend.map((row) => row.day) },
          yAxis: { type: 'value', name: 'ms' },
          series: [{
            name: 'Avg Duration',
            type: 'line',
            data: lazyDurationTrend.map((row) => row.value),
            smooth: true,
          }],
        },
      },
      {
        title: 'Lazy-Load Success / Failure',
        subtitle: 'route:lazy:load outcomes',
        empty: noData(lazyOutcomeByDay),
        option: {
          tooltip: { trigger: 'axis' },
          legend: { top: 0 },
          xAxis: { type: 'category', data: lazyOutcomeByDay.map((row) => row.day) },
          yAxis: { type: 'value', name: 'Count' },
          series: [
            { name: 'Success', type: 'bar', stack: 'lazy', data: lazyOutcomeByDay.map((row) => row.success) },
            { name: 'Failure', type: 'bar', stack: 'lazy', data: lazyOutcomeByDay.map((row) => row.failure) },
          ],
        },
      },
      {
        title: 'Virtualization Jank Trend',
        subtitle: 'max/avg frame delta (ms)',
        empty: noData(virtualizationJankTrend),
        option: {
          tooltip: { trigger: 'axis' },
          legend: { top: 0 },
          xAxis: { type: 'category', data: virtualizationJankTrend.map((row) => row.day) },
          yAxis: { type: 'value', name: 'ms' },
          series: [
            { name: 'Max Frame Delta', type: 'line', data: virtualizationJankTrend.map((row) => row.maxDelta), smooth: true },
            { name: 'Avg Frame Delta', type: 'line', data: virtualizationJankTrend.map((row) => row.avgDelta), smooth: true },
          ],
        },
      },
      {
        title: 'Virtualization Coverage',
        subtitle: 'virtualization:state by table',
        empty: noData(virtualizationStateByTable),
        option: {
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'value', name: 'Events' },
          yAxis: { type: 'category', data: virtualizationStateByTable.map((row) => row.tableId) },
          series: [{
            name: 'State Events',
            type: 'bar',
            data: virtualizationStateByTable.map((row) => row.count),
          }],
        },
      },
      {
        title: 'A11y Violation Trend',
        subtitle: 'a11y summary violations by day',
        empty: noData(a11yViolationTrend),
        option: {
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: a11yViolationTrend.map((row) => row.day) },
          yAxis: { type: 'value', name: 'Violations' },
          series: [{
            name: 'Violations',
            type: 'line',
            data: a11yViolationTrend.map((row) => row.value),
            smooth: true,
          }],
        },
      },
      {
        title: 'A11y Severity Breakdown',
        subtitle: 'critical + serious counts',
        empty: noData(a11ySeverityTrend),
        option: {
          tooltip: { trigger: 'axis' },
          legend: { top: 0 },
          xAxis: { type: 'category', data: a11ySeverityTrend.map((row) => row.day) },
          yAxis: { type: 'value', name: 'Violations' },
          series: [
            { name: 'Critical', type: 'bar', stack: 'a11y', data: a11ySeverityTrend.map((row) => row.critical) },
            { name: 'Serious', type: 'bar', stack: 'a11y', data: a11ySeverityTrend.map((row) => row.serious) },
          ],
        },
      },
      {
        title: 'App Init Phase Durations',
        subtitle: 'app:init:phase:duration',
        empty: noData(appInitPhaseDurations),
        option: {
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: appInitPhaseDurations.map((row) => row.phase) },
          yAxis: { type: 'value', name: 'ms' },
          series: [{
            name: 'Avg Duration',
            type: 'bar',
            data: appInitPhaseDurations.map((row) => row.avgMs),
          }],
        },
      },
      {
        title: 'Stage 13 Load Performance',
        subtitle: 'avg + p95 total load (ms)',
        empty: noData(stage13PerformanceTrend),
        option: {
          tooltip: { trigger: 'axis' },
          legend: { top: 0 },
          xAxis: { type: 'category', data: stage13PerformanceTrend.map((row) => row.day) },
          yAxis: { type: 'value', name: 'ms' },
          series: [
            { name: 'Avg Total Load', type: 'line', data: stage13PerformanceTrend.map((row) => row.avgMs), smooth: true },
            { name: 'P95 Total Load', type: 'line', data: stage13PerformanceTrend.map((row) => row.p95Ms), smooth: true },
          ],
        },
      },
    ];
  }, [
    lazyDurationTrend,
    lazyOutcomeByDay,
    virtualizationJankTrend,
    virtualizationStateByTable,
    a11yViolationTrend,
    a11ySeverityTrend,
    appInitPhaseDurations,
    stage13PerformanceTrend,
  ]);

  const telemetryColumns = React.useMemo((): IHbcDataTableColumn<ITelemetryDashboardItem>[] => [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (row) => new Date(row.timestamp).toLocaleString(),
    },
    {
      key: 'source',
      header: 'Source',
      render: (row) => row.source,
    },
    {
      key: 'kind',
      header: 'Kind',
      render: (row) => row.kind,
    },
    {
      key: 'name',
      header: 'Event',
      render: (row) => row.name,
    },
    {
      key: 'route',
      header: 'Route',
      render: (row) => row.route,
    },
    {
      key: 'workspace',
      header: 'Workspace',
      render: (row) => row.workspace,
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => row.role,
    },
    {
      key: 'value',
      header: 'Value',
      render: (row) => {
        const value = getMetricValue(row);
        return value === undefined ? '-' : formatNumber(value, 2);
      },
    },
  ], []);

  const exportData = React.useMemo(() => {
    return filteredItems.map((item) => ({
      timestamp: item.timestamp,
      source: item.source,
      kind: item.kind,
      name: item.name,
      route: item.route,
      workspace: item.workspace,
      role: item.role,
      properties: JSON.stringify(item.properties ?? {}),
      measurements: JSON.stringify(item.measurements ?? {}),
      avgLoadTime: kpiSnapshot.avgLoadTime,
      activeUsers30d: kpiSnapshot.activeUsers30d,
      provisioningSuccess: kpiSnapshot.provisioningSuccess,
      totalEvents: kpiSnapshot.totalEvents,
      p95LazyLoadDuration: kpiSnapshot.p95LazyLoadDuration,
      avgJankMax: kpiSnapshot.avgJankMax,
      a11yViolationTotal: kpiSnapshot.a11yViolationTotal,
      p95AppLoad: kpiSnapshot.p95AppLoad,
    }));
  }, [filteredItems, kpiSnapshot]);

  const loading = auditQuery.isLoading || performanceQuery.isLoading;

  const handleReset = React.useCallback(() => {
    setRouteFilter('');
    setWorkspaceFilter('all');
    setRoleFilter('all');
    setFromDate('');
    setToDate('');
  }, []);

  const buildFallbackMonitoringPayload = React.useCallback((): IMonitoringExportPayload => {
    const rows = filteredItems.map((item) => ({
      timestamp: item.timestamp,
      kind: item.kind,
      name: item.name,
      route: item.route,
      workspace: item.workspace,
      role: item.role,
      corr_session_id: item.properties?.corr_session_id ?? '',
      corr_operation_id: item.properties?.corr_operation_id ?? '',
      corr_parent_operation_id: item.properties?.corr_parent_operation_id ?? '',
      propertiesJson: JSON.stringify(item.properties ?? {}),
      measurementsJson: JSON.stringify(item.measurements ?? {}),
    }));
    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        retentionDays: MONITORING_RETENTION_DAYS,
        rowCount: rows.length,
        fromDate: effectiveFromDate,
        toDate: toDate || undefined,
      },
      rows,
      aggregates: {
        byDay: [],
        byName: [],
        p95ByMetric: [],
        breachCounts: [],
      },
    };
  }, [filteredItems, effectiveFromDate, toDate]);

  const handleExportMonitoringBundle = React.useCallback((): void => {
    const exportCapable = telemetryService as ITelemetryService & ITelemetryDashboardLiveCapable;
    const payload = exportCapable.getMonitoringExportPayload?.({
      fromDate: effectiveFromDate,
      toDate: toDate || undefined,
      retentionDays: exportCapable.getRetentionDays?.() ?? MONITORING_RETENTION_DAYS,
      limit: 5000,
    }) ?? buildFallbackMonitoringPayload();

    (exportService as IExportServiceWithMonitoringBundle).exportMonitoringBundle?.(payload, {
      filename: 'telemetry-dashboard',
      title: 'Telemetry Dashboard Monitoring Bundle',
    });

    telemetryService.trackEvent({
      name: 'telemetry:export:generated',
      properties: {
        format: 'monitoring_bundle',
        from: effectiveFromDate,
        to: toDate || '',
      },
      measurements: {
        rowCount: payload.metadata.rowCount,
        retentionDays: payload.metadata.retentionDays,
      },
    });
  }, [telemetryService, effectiveFromDate, toDate, buildFallbackMonitoringPayload]);

  const handleRefresh = React.useCallback(() => {
    void Promise.all([auditQuery.refetch(), performanceQuery.refetch(), liveQuery.refetch()]);
  }, [auditQuery, performanceQuery, liveQuery]);

  if (!isFeatureEnabled('TelemetryDashboard')) {
    return (
      <RoleGate allowedRoles={[RoleName.Administrator, RoleName.Leadership]} fallback={ACCESS_DENIED}>
        <div className={styles.root}>
          <PageHeader title="Telemetry Dashboard" subtitle="Feature flag is disabled." />
          <HbcCard title="Telemetry dashboard unavailable" subtitle="Enable the TelemetryDashboard feature flag to access this page.">
            <span className={styles.muted}>No data will be queried until the feature is enabled.</span>
          </HbcCard>
        </div>
      </RoleGate>
    );
  }

  if (loading && filteredItems.length === 0 && filteredPerformanceLogs.length === 0) {
    return (
      <RoleGate allowedRoles={[RoleName.Administrator, RoleName.Leadership]} fallback={ACCESS_DENIED}>
        <div className={styles.root}>
          <PageHeader title="Telemetry Dashboard" subtitle="Live production observability for Stage 10/11/13 metrics." />
          <HbcSkeleton variant="kpi-grid" columns={4} />
          <HbcSkeleton variant="card" rows={10} />
        </div>
      </RoleGate>
    );
  }

  return (
    <RoleGate allowedRoles={[RoleName.Administrator, RoleName.Leadership]} fallback={ACCESS_DENIED}>
      <div className={styles.root}>
        <PageHeader
          title="Telemetry Dashboard"
          subtitle="Stage 15 monitoring for lazy-load, virtualization, accessibility, and load performance telemetry."
        />

        <HbcCard title="Filters" subtitle="Route, workspace, role, and date range">
          <div className={styles.filters}>
            <div className={styles.filterField}>
              <span className={styles.filterLabel}>Route</span>
              <Input
                value={routeFilter}
                onChange={(_, data) => setRouteFilter(data.value)}
                placeholder="/admin/telemetry"
                aria-label="Route filter"
              />
            </div>

            <div className={styles.filterField}>
              <span className={styles.filterLabel}>Workspace</span>
              <Select
                value={workspaceFilter}
                onChange={(event) => setWorkspaceFilter(event.target.value)}
                aria-label="Workspace filter"
              >
                <option value="all">All workspaces</option>
                {workspaceOptions.map((workspace) => (
                  <option key={workspace} value={workspace}>{workspace}</option>
                ))}
              </Select>
            </div>

            <div className={styles.filterField}>
              <span className={styles.filterLabel}>Role</span>
              <Select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                aria-label="Role filter"
              >
                <option value="all">All roles</option>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </Select>
            </div>

            <div className={styles.filterField}>
              <span className={styles.filterLabel}>From</span>
              <Input
                type="date"
                value={fromDate}
                onChange={(_, data) => setFromDate(data.value)}
                aria-label="From date"
              />
            </div>

            <div className={styles.filterField}>
              <span className={styles.filterLabel}>To</span>
              <Input
                type="date"
                value={toDate}
                onChange={(_, data) => setToDate(data.value)}
                aria-label="To date"
              />
            </div>

            <div className={styles.filterActions}>
              <Button appearance="primary" onClick={handleRefresh}>Refresh</Button>
              <Button onClick={handleReset}>Reset</Button>
              <Button onClick={handleExportMonitoringBundle}>Monitoring Bundle</Button>
              <ExportButtons data={exportData} filename="telemetry-dashboard" title="Telemetry Dashboard" />
            </div>
          </div>
        </HbcCard>

        <div className={styles.kpiGrid}>
          <KPICard title="Avg Load Time" value={`${formatNumber(kpiSnapshot.avgLoadTime, 1)} ms`} subtitle="Stage 13 total load" />
          <KPICard title="Active Users (30d)" value={kpiSnapshot.activeUsers30d} subtitle="Unique telemetry actors" />
          <KPICard title="Provisioning Success" value={`${formatNumber(kpiSnapshot.provisioningSuccess, 1)}%`} subtitle="Lazy-load success ratio" />
          <KPICard title="Total Events" value={kpiSnapshot.totalEvents} subtitle="Filtered telemetry items" />
          <KPICard title="P95 Lazy Load" value={`${formatNumber(kpiSnapshot.p95LazyLoadDuration, 1)} ms`} subtitle="route:lazy:load:duration" />
          <KPICard title="Avg Jank Max" value={`${formatNumber(kpiSnapshot.avgJankMax, 1)} ms`} subtitle="virtualization:frame:jank" />
          <KPICard title="A11y Violations" value={kpiSnapshot.a11yViolationTotal} subtitle="a11y summary totals" />
          <KPICard title="P95 App Load" value={`${formatNumber(kpiSnapshot.p95AppLoad, 1)} ms`} subtitle="Performance logs" />
        </div>

        <div className={styles.chartGrid}>
          {chartCards.map((chart) => (
            <div key={chart.title} data-testid="chart-card">
              <HbcCard title={chart.title} subtitle={chart.subtitle}>
                <HbcEChart
                  option={chart.option as never}
                  height={280}
                  empty={chart.empty}
                  emptyMessage="No telemetry in selected filter range"
                  ariaLabel={chart.title}
                />
              </HbcCard>
            </div>
          ))}
        </div>

        <section className={styles.tableSection}>
          <span className={styles.tableMeta}>
            Showing {filteredItems.length} merged telemetry records ({auditQuery.data?.length ?? 0} audit, {liveQuery.data?.length ?? 0} live)
          </span>
          <HbcDataTable
            tableId="telemetry-dashboard-events"
            columns={telemetryColumns}
            items={filteredItems}
            keyExtractor={(item) => item.dedupeKey}
            ariaLabel="Telemetry dashboard event table"
            virtualization={{
              enabled: true,
              threshold: 120,
              estimateRowHeight: 42,
              containerHeight: 540,
              overscan: 8,
              adaptiveOverscan: true,
            }}
            searchPlaceholder="Filter telemetry rows"
          />
        </section>

        {auditQuery.error || performanceQuery.error ? (
          <HbcCard title="Query warning" subtitle="One or more telemetry sources failed to refresh.">
            <span className={styles.muted}>Data may be partially stale. Use refresh to retry.</span>
          </HbcCard>
        ) : null}
      </div>
    </RoleGate>
  );
};

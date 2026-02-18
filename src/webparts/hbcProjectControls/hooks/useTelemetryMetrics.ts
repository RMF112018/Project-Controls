import * as React from 'react';
import type { IAuditEntry, IPerformanceLog } from '@hbc/sp-services';
import { useAppContext } from '../components/contexts/AppContext';

// ---------------------------------------------------------------------------
// Public shape
// ---------------------------------------------------------------------------
export interface IFeatureUsage { feature: string; count: number }
export interface IRoleActivity { role: string; count: number }
export interface IAdoptionCell { day: number; hour: number; count: number }
export interface IProvisioningStat { status: 'success' | 'partial' | 'failed'; count: number }
export interface IErrorPoint { date: string; count: number }
export interface IForecastPoint { projectCode: string; estimated: number; actual: number }
export interface IChecklistPoint { projectCode: string; pct: number }
export interface ILoadPerf { date: string; p50: number; p95: number }

export interface ITelemetryMetrics {
  performanceLogs: IPerformanceLog[];
  auditLog: IAuditEntry[];
  featureUsage: IFeatureUsage[];
  roleActivity: IRoleActivity[];
  adoptionByHour: IAdoptionCell[];
  provisioningStats: IProvisioningStat[];
  errorTrend: IErrorPoint[];
  forecastAccuracy: IForecastPoint[];
  checklistCompletion: IChecklistPoint[];
  loadPerf: ILoadPerf[];
  isLoading: boolean;
  error: string | null;
}

const defaultMetrics: ITelemetryMetrics = {
  performanceLogs: [],
  auditLog: [],
  featureUsage: [],
  roleActivity: [],
  adoptionByHour: [],
  provisioningStats: [],
  errorTrend: [],
  forecastAccuracy: [],
  checklistCompletion: [],
  loadPerf: [],
  isLoading: false,
  error: null,
};

// ---------------------------------------------------------------------------
// Aggregation helpers
// ---------------------------------------------------------------------------
function computeFeatureUsage(log: IAuditEntry[]): IFeatureUsage[] {
  const counts: Record<string, number> = {};
  for (const e of log) {
    const feat = String(e.Action).split('.')[0];
    counts[feat] = (counts[feat] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([feature, count]) => ({ feature, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function computeRoleActivity(log: IAuditEntry[]): IRoleActivity[] {
  const counts: Record<string, number> = {};
  for (const e of log) {
    const role = e.Details?.split('role:')[1]?.trim() || 'Unknown';
    counts[role] = (counts[role] ?? 0) + 1;
  }
  return Object.entries(counts).map(([role, count]) => ({ role, count }));
}

function computeAdoptionHeatmap(log: IAuditEntry[]): IAdoptionCell[] {
  const grid: Record<string, number> = {};
  for (const e of log) {
    const d = new Date(e.Timestamp);
    const key = `${d.getDay()}_${d.getHours()}`;
    grid[key] = (grid[key] ?? 0) + 1;
  }
  return Object.entries(grid).map(([k, count]) => {
    const [day, hour] = k.split('_').map(Number);
    return { day, hour, count };
  });
}

function computeProvisioningStats(log: IAuditEntry[]): IProvisioningStat[] {
  const provisioned = log.filter(e => (e.Action as string).includes('Site.Provisioned') ||
    (e.Action as string).includes('Provisioned'));
  let success = 0, partial = 0, failed = 0;
  for (const e of provisioned) {
    const steps = parseInt(e.Details?.match(/stepsCompleted:(\d+)/)?.[1] ?? '7', 10);
    if (steps === 7) success++;
    else if (steps >= 3) partial++;
    else failed++;
  }
  return [
    { status: 'success', count: success },
    { status: 'partial', count: partial },
    { status: 'failed', count: failed },
  ];
}

function computeErrorTrend(log: IAuditEntry[], range: [Date, Date]): IErrorPoint[] {
  const errorActions: string[] = ['Service.Error', 'DataMart.SyncFailed', 'Graph.GroupMemberAddFailed'];
  const counts: Record<string, number> = {};

  // Build day buckets across range
  const start = new Date(range[0]);
  const end = new Date(range[1]);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    counts[d.toISOString().slice(0, 10)] = 0;
  }

  for (const e of log) {
    if (errorActions.some(a => (e.Action as string).includes(a))) {
      const dateKey = e.Timestamp.slice(0, 10);
      if (dateKey in counts) {
        counts[dateKey]++;
      }
    }
  }

  return Object.entries(counts).map(([date, count]) => ({ date, count }));
}

function computeForecastAccuracy(log: IAuditEntry[]): IForecastPoint[] {
  const variance = log.filter(e => (e.Action as string).includes('BudgetVariance'));
  return variance.map(e => {
    const det = e.Details ?? '';
    const estimated = parseFloat(det.match(/estimatedValue:([\d.]+)/)?.[1] ?? '0');
    const actual = parseFloat(det.match(/actualValue:([\d.]+)/)?.[1] ?? '0');
    return { projectCode: e.ProjectCode ?? 'Unknown', estimated, actual };
  }).filter(p => p.estimated > 0);
}

function computeChecklistCompletion(log: IAuditEntry[]): IChecklistPoint[] {
  const completed: Record<string, number> = {};
  const projects = new Set<string>();
  for (const e of log) {
    if ((e.Action as string).includes('Checklist.ItemCompleted') && e.ProjectCode) {
      projects.add(e.ProjectCode);
      completed[e.ProjectCode] = (completed[e.ProjectCode] ?? 0) + 1;
    }
  }
  // Normalize: assume 20 total items max per project for pct calculation
  const TOTAL_ITEMS = 20;
  return Array.from(projects).map(pc => ({
    projectCode: pc,
    pct: Math.min(100, Math.round(((completed[pc] ?? 0) / TOTAL_ITEMS) * 100)),
  })).sort((a, b) => b.pct - a.pct);
}

function computeLoadPerf(logs: IPerformanceLog[]): ILoadPerf[] {
  const byDay: Record<string, number[]> = {};
  for (const l of logs) {
    const key = l.Timestamp.slice(0, 10);
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(l.TotalLoadMs);
  }
  return Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, vals]) => {
    const sorted = [...vals].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
    return { date, p50, p95 };
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
/**
 * Detects and tracks a11y-relevant browser environment signals.
 * Fire-and-forget — does not affect the component render cycle.
 */
function useA11yEnvironmentDetection(): void {
  const { telemetryService } = useAppContext();

  React.useEffect(() => {
    if (!telemetryService.isInitialized()) return;

    // Detect Windows High Contrast Mode (forced-colors: active)
    const highContrastQuery = window.matchMedia('(forced-colors: active)');
    if (highContrastQuery.matches) {
      telemetryService.trackEvent({ name: 'a11y:high-contrast', properties: { mode: 'forced-colors' } });
    }

    // Detect keyboard-only navigation: first Tab key without prior pointer event
    let pointerUsed = false;
    const onPointer = (): void => { pointerUsed = true; };
    const onKeydown = (e: KeyboardEvent): void => {
      if (e.key === 'Tab' && !pointerUsed) {
        telemetryService.trackEvent({ name: 'a11y:keyboard-user-detected' });
        document.removeEventListener('keydown', onKeydown);
        document.removeEventListener('pointerdown', onPointer);
      }
    };
    document.addEventListener('pointerdown', onPointer, { once: false });
    document.addEventListener('keydown', onKeydown);
    return () => {
      document.removeEventListener('keydown', onKeydown);
      document.removeEventListener('pointerdown', onPointer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function useTelemetryMetrics(dateRange: [Date, Date]): ITelemetryMetrics {
  const { dataService, resolvedPermissions, selectedProject } = useAppContext();
  const [metrics, setMetrics] = React.useState<ITelemetryMetrics>(defaultMetrics);

  useA11yEnvironmentDetection();

  const projectCode = resolvedPermissions?.globalAccess ? undefined : selectedProject?.projectCode;

  const startIso = dateRange[0].toISOString();
  const endIso = dateRange[1].toISOString();

  React.useEffect(() => {
    let cancelled = false;
    setMetrics(m => ({ ...m, isLoading: true, error: null }));

    Promise.all([
      dataService.getPerformanceLogs({ startDate: startIso, endDate: endIso }),
      dataService.getAuditLog(undefined, undefined, startIso, endIso),
    ]).then(([perfLogs, auditLog]) => {
      if (cancelled) return;
      const scoped = projectCode
        ? auditLog.filter(e => e.ProjectCode === projectCode)
        : auditLog;

      setMetrics({
        performanceLogs: perfLogs,
        auditLog: scoped,
        featureUsage: computeFeatureUsage(scoped),
        roleActivity: computeRoleActivity(scoped),
        adoptionByHour: computeAdoptionHeatmap(scoped),
        provisioningStats: computeProvisioningStats(scoped),
        errorTrend: computeErrorTrend(scoped, dateRange),
        forecastAccuracy: computeForecastAccuracy(scoped),
        checklistCompletion: computeChecklistCompletion(scoped),
        loadPerf: computeLoadPerf(perfLogs),
        isLoading: false,
        error: null,
      });
    }).catch((err: unknown) => {
      if (!cancelled) {
        setMetrics(m => ({
          ...m,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to load telemetry',
        }));
      }
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataService, startIso, endIso, projectCode]);

  return metrics;
}

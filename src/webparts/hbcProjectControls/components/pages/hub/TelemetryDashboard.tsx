import * as React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import type { EChartsOption } from 'echarts';
import { HbcEChart } from '../../shared/HbcEChart';
import { KPICard } from '../../shared/KPICard';
import { PageHeader } from '../../shared/PageHeader';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import { HBC_COLORS } from '../../../theme/tokens';
import { NAVY_GRADIENT } from '../../../theme/hbcEChartsTheme';
import {
  useTelemetryMetrics,
  type IFeatureUsage,
  type IRoleActivity,
  type IAdoptionCell,
  type IProvisioningStat,
  type IErrorPoint,
  type IForecastPoint,
  type IChecklistPoint,
  type ILoadPerf,
} from '../../../hooks/useTelemetryMetrics';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  chartGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
    gap: '16px',
  },
  chartCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  chartTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
    marginBottom: '4px',
  },
  chartSubtitle: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    marginBottom: '16px',
  },
});

// ---------------------------------------------------------------------------
// Colour palette (shared across chart sub-components)
// ---------------------------------------------------------------------------
const PALETTE = [
  HBC_COLORS.navy,
  HBC_COLORS.orange,
  HBC_COLORS.success,
  HBC_COLORS.info,
  HBC_COLORS.warning,
  HBC_COLORS.lightNavy,
  HBC_COLORS.lightOrange,
  HBC_COLORS.gray400,
];

// ---------------------------------------------------------------------------
// ChartCard wrapper
// ---------------------------------------------------------------------------
const ChartCard: React.FC<{
  title: string;
  subtitle: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => {
  const styles = useStyles();
  // Stable slug-based ID for aria-labelledby association
  const titleId = React.useId();
  return (
    <div
      className={styles.chartCard}
      data-testid="chart-card"
      role="region"
      aria-labelledby={titleId}
    >
      <h3 id={titleId} className={styles.chartTitle}>{title}</h3>
      <p className={styles.chartSubtitle}>{subtitle}</p>
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Chart 1 — Adoption Heatmap
// ---------------------------------------------------------------------------
const AdoptionHeatmapChart: React.FC<{ data: IAdoptionCell[] }> = ({ data }) => {
  const maxCount = React.useMemo(() => Math.max(1, ...data.map(d => d.count)), [data]);
  const option = React.useMemo<EChartsOption>(() => ({
    tooltip: {
      formatter: (p: unknown) => {
        const { value } = p as { value: [number, number, number] };
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return `${days[value[1]] ?? ''} ${value[0]}:00 — ${value[2]} actions`;
      },
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, i) => `${i}h`),
      splitArea: { show: true },
    },
    yAxis: {
      type: 'category',
      data: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      splitArea: { show: true },
    },
    visualMap: {
      min: 0,
      max: maxCount,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: { color: [`${HBC_COLORS.navy}20`, HBC_COLORS.navy] },
    },
    series: [{
      type: 'heatmap',
      data: data.map(d => [d.hour, d.day, d.count]),
      label: { show: false },
    }],
    grid: { top: 10, right: 10, bottom: 60, left: 40, containLabel: true },
  }), [data, maxCount]);

  return (
    <HbcEChart
      option={option}
      height={280}
      ariaLabel="User adoption heatmap by hour and day of week"
      empty={data.length === 0}
      emptyMessage="No activity data available"
    />
  );
};

// ---------------------------------------------------------------------------
// Chart 2 — Load Performance (P50/P95)
// ---------------------------------------------------------------------------
const LoadPerformanceChart: React.FC<{ data: ILoadPerf[] }> = ({ data }) => {
  const option = React.useMemo<EChartsOption>(() => ({
    legend: { bottom: 0 },
    grid: { top: 10, right: 16, bottom: 40, left: 0, containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(d => d.date),
      axisLabel: { rotate: -30, fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (v: number) => `${v}ms` },
    },
    series: [
      {
        name: 'P50',
        type: 'line',
        data: data.map(d => d.p50),
        smooth: true,
        lineStyle: { color: HBC_COLORS.navy, width: 2 },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        areaStyle: NAVY_GRADIENT as any,
        itemStyle: { color: HBC_COLORS.navy },
      },
      {
        name: 'P95',
        type: 'line',
        data: data.map(d => d.p95),
        smooth: true,
        lineStyle: { color: HBC_COLORS.warning, width: 2, type: 'dashed' },
        itemStyle: { color: HBC_COLORS.warning },
      },
    ],
  }), [data]);

  return (
    <HbcEChart
      option={option}
      height={280}
      ariaLabel="Page load performance P50 and P95 over time"
      empty={data.length === 0}
      emptyMessage="No performance data available"
    />
  );
};

// ---------------------------------------------------------------------------
// Chart 3 — Feature Usage (Horizontal Bar)
// ---------------------------------------------------------------------------
const FeatureUsageChart: React.FC<{ data: IFeatureUsage[] }> = ({ data }) => {
  const option = React.useMemo<EChartsOption>(() => ({
    grid: { top: 10, right: 60, bottom: 10, left: 20, containLabel: true },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: data.map(d => d.feature) },
    series: [{
      type: 'bar',
      data: data.map(d => ({
        value: d.count,
        itemStyle: { color: HBC_COLORS.navy, borderRadius: [0, 4, 4, 0] },
      })),
      label: {
        show: true,
        position: 'right',
        formatter: (p: unknown) => String((p as { value: number }).value),
      },
    }],
  }), [data]);

  return (
    <HbcEChart
      option={option}
      height={280}
      ariaLabel="Feature usage count by feature"
      empty={data.length === 0}
      emptyMessage="No feature usage data available"
    />
  );
};

// ---------------------------------------------------------------------------
// Chart 4 — Role Activity (Donut)
// ---------------------------------------------------------------------------
const RoleActivityChart: React.FC<{ data: IRoleActivity[] }> = ({ data }) => {
  const option = React.useMemo<EChartsOption>(() => ({
    tooltip: {
      trigger: 'item',
      formatter: (p: unknown) => {
        const { name, value, percent } = p as { name: string; value: number; percent: number };
        return `${name}<br/>${value} events (${percent}%)`;
      },
    },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['40%', '50%'],
      data: data.map((d, i) => ({
        name: d.role,
        value: d.count,
        itemStyle: { color: PALETTE[i % PALETTE.length] },
      })),
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
    }],
  }), [data]);

  return (
    <HbcEChart
      option={option}
      height={280}
      ariaLabel="Audit activity distribution by user role"
      empty={data.length === 0}
      emptyMessage="No role activity data available"
    />
  );
};

// ---------------------------------------------------------------------------
// Chart 5 — Forecast Accuracy (Scatter)
// ---------------------------------------------------------------------------
const ForecastAccuracyChart: React.FC<{ data: IForecastPoint[] }> = ({ data }) => {
  const option = React.useMemo<EChartsOption>(() => ({
    tooltip: {
      formatter: (p: unknown) => {
        const { name, value } = p as { name: string; value: [number, number] };
        const est = value[0] / 1e6;
        const act = value[1] / 1e6;
        const delta = ((value[1] - value[0]) / value[0] * 100).toFixed(1);
        return `${name}<br/>Est: $${est.toFixed(2)}M<br/>Act: $${act.toFixed(2)}M<br/>Δ ${delta}%`;
      },
    },
    grid: { top: 20, right: 20, bottom: 40, left: 0, containLabel: true },
    xAxis: {
      type: 'value',
      name: 'Estimated',
      axisLabel: { formatter: (v: number) => `$${(v / 1e6).toFixed(1)}M` },
    },
    yAxis: {
      type: 'value',
      name: 'Actual',
      axisLabel: { formatter: (v: number) => `$${(v / 1e6).toFixed(1)}M` },
    },
    series: [{
      type: 'scatter',
      symbolSize: 12,
      data: data.map(d => ({
        name: d.projectCode,
        value: [d.estimated, d.actual],
        itemStyle: {
          color: Math.abs(d.actual - d.estimated) / d.estimated > 0.1
            ? HBC_COLORS.error
            : HBC_COLORS.success,
        },
      })),
    }],
  }), [data]);

  return (
    <HbcEChart
      option={option}
      height={280}
      ariaLabel="Forecast accuracy scatter: estimated vs actual project value"
      empty={data.length === 0}
      emptyMessage="No budget variance data available"
    />
  );
};

// ---------------------------------------------------------------------------
// Chart 6 — Checklist Completion (Horizontal Bar)
// ---------------------------------------------------------------------------
const ChecklistCompletionChart: React.FC<{ data: IChecklistPoint[] }> = ({ data }) => {
  const option = React.useMemo<EChartsOption>(() => ({
    grid: { top: 10, right: 30, bottom: 10, left: 60, containLabel: true },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: (v: number) => `${v}%` },
    },
    yAxis: { type: 'category', data: data.map(d => d.projectCode) },
    series: [{
      type: 'bar',
      data: data.map(d => ({
        value: d.pct,
        itemStyle: {
          color: d.pct >= 80 ? HBC_COLORS.success : d.pct >= 50 ? HBC_COLORS.warning : HBC_COLORS.error,
          borderRadius: [0, 4, 4, 0],
        },
      })),
      markLine: {
        data: [{
          xAxis: 80,
          label: { formatter: '80% target', position: 'end' },
          lineStyle: { color: HBC_COLORS.gray400, type: 'dashed' },
        }],
      },
    }],
  }), [data]);

  return (
    <HbcEChart
      option={option}
      height={280}
      ariaLabel="Checklist completion percentage per project"
      empty={data.length === 0}
      emptyMessage="No checklist data available"
    />
  );
};

// ---------------------------------------------------------------------------
// Chart 7 — Provisioning Outcomes (Donut with centre label)
// ---------------------------------------------------------------------------
const ProvisioningRateChart: React.FC<{ data: IProvisioningStat[] }> = ({ data }) => {
  const option = React.useMemo<EChartsOption>(() => {
    const success = data.find(d => d.status === 'success')?.count ?? 0;
    const total = data.reduce((s, d) => s + d.count, 0);
    const pct = total > 0 ? Math.round((success / total) * 100) : 0;
    return {
      graphic: [{
        type: 'text',
        left: 'center',
        top: 'center',
        style: {
          text: `${pct}%\nSuccess`,
          textAlign: 'center',
          fill: HBC_COLORS.navy,
          fontSize: 18,
          fontWeight: 'bold',
          lineHeight: 24,
        },
      }],
      series: [{
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['50%', '50%'],
        data: [
          { name: 'Success', value: success, itemStyle: { color: HBC_COLORS.success } },
          {
            name: 'Partial',
            value: data.find(d => d.status === 'partial')?.count ?? 0,
            itemStyle: { color: HBC_COLORS.warning },
          },
          {
            name: 'Failed',
            value: data.find(d => d.status === 'failed')?.count ?? 0,
            itemStyle: { color: HBC_COLORS.error },
          },
        ],
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 13 } },
      }],
    };
  }, [data]);

  return (
    <HbcEChart
      option={option}
      height={280}
      ariaLabel="Site provisioning outcome distribution"
      empty={data.every(d => d.count === 0)}
      emptyMessage="No provisioning data available"
    />
  );
};

// ---------------------------------------------------------------------------
// Chart 8 — Exception Trend (Smoothed Area)
// ---------------------------------------------------------------------------
const ErrorTrendChart: React.FC<{ data: IErrorPoint[] }> = ({ data }) => {
  const option = React.useMemo<EChartsOption>(() => ({
    grid: { top: 10, right: 16, bottom: 40, left: 0, containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(d => d.date),
      axisLabel: { rotate: -30, fontSize: 10 },
    },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      type: 'line',
      smooth: true,
      data: data.map(d => d.count),
      lineStyle: { color: HBC_COLORS.error, width: 2 },
      areaStyle: { color: `${HBC_COLORS.error}30` },
      itemStyle: { color: HBC_COLORS.error },
      symbol: 'circle',
      symbolSize: 5,
    }],
  }), [data]);

  return (
    <HbcEChart
      option={option}
      height={280}
      ariaLabel="Application exception count over time"
      empty={data.every(d => d.count === 0)}
      emptyMessage="No exceptions in the selected period"
    />
  );
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function last30Days(): [Date, Date] {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 30);
  return [start, end];
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export const TelemetryDashboard: React.FC = () => {
  const styles = useStyles();
  const [dateRange] = React.useState<[Date, Date]>(last30Days);
  const metrics = useTelemetryMetrics(dateRange);

  const avgLoadMs = React.useMemo(() => {
    if (metrics.performanceLogs.length === 0) return 0;
    const total = metrics.performanceLogs.reduce((s, l) => s + (l.TotalLoadMs ?? 0), 0);
    return Math.round(total / metrics.performanceLogs.length);
  }, [metrics.performanceLogs]);

  const uniqueUsers = React.useMemo(() => {
    const users = new Set(metrics.auditLog.map(e => e.User));
    return users.size;
  }, [metrics.auditLog]);

  const provisioningPct = React.useMemo(() => {
    const success = metrics.provisioningStats.find(d => d.status === 'success')?.count ?? 0;
    const total = metrics.provisioningStats.reduce((s, d) => s + d.count, 0);
    return total > 0 ? Math.round((success / total) * 100) : 0;
  }, [metrics.provisioningStats]);

  const breadcrumbs = [{ label: 'Admin', path: '/admin' }, { label: 'Telemetry' }];

  if (metrics.isLoading) {
    return (
      <div className={styles.container}>
        <Breadcrumb items={breadcrumbs} />
        <PageHeader title="Telemetry Dashboard" subtitle="Application Insights — Last 30 Days" />
        <SkeletonLoader variant="table" rows={4} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Breadcrumb items={breadcrumbs} />
      <PageHeader
        title="Telemetry Dashboard"
        subtitle="Application Insights — Last 30 Days"
      />

      {/* KPI row */}
      <div className={styles.kpiGrid}>
        <KPICard title="Avg Load Time" value={`${avgLoadMs}ms`} subtitle="WebPart total load" />
        <KPICard title="Active Users (30d)" value={uniqueUsers} subtitle="Unique audit authors" />
        <KPICard title="Provisioning Success" value={`${provisioningPct}%`} subtitle="Full 7-step completions" />
        <KPICard title="Total Events" value={metrics.auditLog.length} subtitle="Audit log entries" />
      </div>

      {/* Chart grid */}
      <div className={styles.chartGrid}>
        <ChartCard title="User Adoption Heatmap" subtitle="Actions by hour of day × day of week">
          <AdoptionHeatmapChart data={metrics.adoptionByHour} />
        </ChartCard>

        <ChartCard title="Page Load Performance" subtitle="P50 / P95 load times by day">
          <LoadPerformanceChart data={metrics.loadPerf} />
        </ChartCard>

        <ChartCard title="Feature Usage" subtitle="Top 10 most-triggered features (30d)">
          <FeatureUsageChart data={metrics.featureUsage} />
        </ChartCard>

        <ChartCard title="Activity by Role" subtitle="Audit events distributed by user role">
          <RoleActivityChart data={metrics.roleActivity} />
        </ChartCard>

        <ChartCard title="Forecast Accuracy" subtitle="Estimated vs. actual project value">
          <ForecastAccuracyChart data={metrics.forecastAccuracy} />
        </ChartCard>

        <ChartCard title="Checklist Completion" subtitle="% complete per active project">
          <ChecklistCompletionChart data={metrics.checklistCompletion} />
        </ChartCard>

        <ChartCard title="Provisioning Outcomes" subtitle="Site provisioning success rate">
          <ProvisioningRateChart data={metrics.provisioningStats} />
        </ChartCard>

        <ChartCard title="Exception Trend" subtitle="Application errors over time">
          <ErrorTrendChart data={metrics.errorTrend} />
        </ChartCard>
      </div>
    </div>
  );
};

export default TelemetryDashboard;

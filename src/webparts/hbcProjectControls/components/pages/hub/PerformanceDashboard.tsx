import * as React from 'react';
import { Button, Input, makeStyles, tokens } from '@fluentui/react-components';
import { ArrowClockwiseRegular, ChevronDownRegular, ChevronUpRegular } from '@fluentui/react-icons';
import type { EChartsOption } from 'echarts';
import { HbcEChart } from '../../shared/HbcEChart';
import { PERFORMANCE_THRESHOLDS, IPerformanceLog } from '@hbc/sp-services';
import { HBC_COLORS } from '../../../theme/tokens';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { DataTable } from '../../shared/DataTable';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import { StatusBadge } from '../../shared/StatusBadge';
import { usePerformanceMetrics } from '../../hooks/usePerformanceMetrics';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  chartRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
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
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    marginBottom: '16px',
  },
  expandBtn: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: HBC_COLORS.navy,
    border: 'none',
    backgroundColor: 'transparent',
    padding: '4px',
  },
  marksList: {
    marginTop: '8px',
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  markItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '2px 0',
  },
});

function getStatusColor(ms: number): { label: string; color: string; bg: string } {
  if (ms < PERFORMANCE_THRESHOLDS.WARNING_LOAD_MS) {
    return { label: 'Fast', color: '#fff', bg: HBC_COLORS.success };
  }
  if (ms < PERFORMANCE_THRESHOLDS.SLOW_LOAD_MS) {
    return { label: 'Normal', color: '#fff', bg: HBC_COLORS.warning };
  }
  return { label: 'Slow', color: '#fff', bg: HBC_COLORS.error };
}

function getBarColor(ms: number): string {
  if (ms < PERFORMANCE_THRESHOLDS.WARNING_LOAD_MS) return HBC_COLORS.success;
  if (ms < PERFORMANCE_THRESHOLDS.SLOW_LOAD_MS) return HBC_COLORS.warning;
  return HBC_COLORS.error;
}

// Expandable marks detail row
const MarksDetail: React.FC<{ marks: IPerformanceLog['Marks'] }> = ({ marks }) => {
  const styles = useStyles();
  const [expanded, setExpanded] = React.useState(false);

  if (!marks || marks.length === 0) return null;

  return (
    <div>
      <button className={styles.expandBtn} onClick={() => setExpanded(!expanded)}>
        {expanded ? <ChevronUpRegular /> : <ChevronDownRegular />}
        {marks.length} marks
      </button>
      {expanded && (
        <div className={styles.marksList}>
          {marks.map((m, i) => (
            <div key={i} className={styles.markItem}>
              <span>{m.name}</span>
              <span>{m.duration ?? '—'}ms</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const PerformanceDashboard: React.FC = () => {
  const styles = useStyles();
  const { logs, summary, loading, error, refresh, dateRange, setDateRange } = usePerformanceMetrics();

  const breadcrumbItems = [
    { label: 'Admin', path: '/admin' },
    { label: 'Performance' },
  ];

  const tableColumns = React.useMemo(() => [
    {
      key: 'Timestamp',
      header: 'Timestamp',
      sortable: true,
      width: '160px',
      render: (row: IPerformanceLog) => new Date(row.Timestamp).toLocaleString(),
    },
    {
      key: 'UserEmail',
      header: 'User',
      sortable: true,
      width: '180px',
      render: (row: IPerformanceLog) => row.UserEmail.split('@')[0],
    },
    {
      key: 'SiteUrl',
      header: 'Site',
      sortable: true,
      hideOnMobile: true,
      render: (row: IPerformanceLog) => {
        try {
          return new URL(row.SiteUrl).pathname;
        } catch {
          return row.SiteUrl;
        }
      },
    },
    {
      key: 'ProjectCode',
      header: 'Project',
      sortable: true,
      width: '100px',
      hideOnMobile: true,
      render: (row: IPerformanceLog) => row.ProjectCode || '—',
    },
    {
      key: 'TotalLoadMs',
      header: 'Total (ms)',
      sortable: true,
      width: '100px',
      render: (row: IPerformanceLog) => row.TotalLoadMs.toLocaleString(),
    },
    {
      key: 'WebPartLoadMs',
      header: 'WebPart (ms)',
      sortable: true,
      width: '110px',
      hideOnMobile: true,
      render: (row: IPerformanceLog) => row.WebPartLoadMs.toLocaleString(),
    },
    {
      key: 'AppInitMs',
      header: 'App Init (ms)',
      sortable: true,
      width: '110px',
      hideOnMobile: true,
      render: (row: IPerformanceLog) => row.AppInitMs.toLocaleString(),
    },
    {
      key: 'status',
      header: 'Status',
      width: '80px',
      render: (row: IPerformanceLog) => {
        const s = getStatusColor(row.TotalLoadMs);
        return <StatusBadge label={s.label} color={s.color} backgroundColor={s.bg} size="small" />;
      },
    },
    {
      key: 'marks',
      header: 'Marks',
      width: '100px',
      hideOnMobile: true,
      render: (row: IPerformanceLog) => <MarksDetail marks={row.Marks} />,
    },
  ], []);

  // Build breakdown data for bar chart (last 10 sessions)
  const breakdownData = React.useMemo(() => {
    return logs.slice(0, 10).reverse().map((log, i) => ({
      name: `#${i + 1}`,
      WebPart: log.WebPartLoadMs,
      AppInit: log.AppInitMs,
      DataFetch: log.DataFetchMs ?? 0,
      total: log.TotalLoadMs,
    }));
  }, [logs]);

  // ─── ECharts option memos ────────────────────────────────────────────────

  const lineChartOption = React.useMemo<EChartsOption>(() => ({
    grid: { top: 10, right: 16, bottom: 8, left: 0, containLabel: true },
    tooltip: { trigger: 'axis', formatter: (p: unknown) => {
      const params = p as Array<{ name: string; value: number; marker: string }>;
      return `<div style="font-family:'Segoe UI',sans-serif;padding:4px 0"><div style="font-size:11px;color:${HBC_COLORS.gray500};margin-bottom:4px">${params[0].name}</div><div style="font-size:13px;font-weight:600;color:${HBC_COLORS.navy}">${params[0].marker}Avg Load: ${params[0].value}ms</div></div>`;
    }, extraCssText: `border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.12);padding:10px 14px;` },
    xAxis: { type: 'category', data: (summary?.byDay ?? []).map(d => d.date), axisLabel: { fontSize: 11, color: HBC_COLORS.gray500 }, axisLine: { lineStyle: { color: '#E5E7EB' } }, axisTick: { show: false } },
    yAxis: { type: 'value', axisLabel: { formatter: (v: number) => `${v}ms`, fontSize: 11, color: HBC_COLORS.gray500 }, splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } }, axisLine: { show: false }, axisTick: { show: false } },
    series: [{
      type: 'line',
      name: 'Avg Load (ms)',
      data: (summary?.byDay ?? []).map(d => d.avgMs),
      smooth: false,
      symbol: 'circle',
      symbolSize: 4,
      lineStyle: { color: HBC_COLORS.navy, width: 2 },
      itemStyle: { color: HBC_COLORS.navy },
    }],
  }), [summary]);

  const stackedBarOption = React.useMemo<EChartsOption>(() => ({
    grid: { top: 10, right: 16, bottom: 8, left: 0, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p: unknown) => {
      const params = p as Array<{ seriesName: string; value: number; marker: string }>;
      const name = (p as Array<{ name: string }>)[0]?.name ?? '';
      const rows = params.map(item => `<div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">${item.marker}<span style="flex:1;font-size:12px;color:${HBC_COLORS.gray600}">${item.seriesName}</span><span style="font-size:13px;font-weight:600;color:${HBC_COLORS.navy}">${item.value}ms</span></div>`).join('');
      return `<div style="font-family:'Segoe UI',sans-serif;padding:4px 0"><div style="font-size:11px;color:${HBC_COLORS.gray500};margin-bottom:6px">${name}</div>${rows}</div>`;
    }, extraCssText: `border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.12);padding:10px 14px;` },
    legend: { bottom: 0, textStyle: { fontSize: 11, color: HBC_COLORS.gray600 } },
    xAxis: { type: 'category', data: breakdownData.map(d => d.name), axisLabel: { fontSize: 11, color: HBC_COLORS.gray500 }, axisLine: { lineStyle: { color: '#E5E7EB' } }, axisTick: { show: false } },
    yAxis: { type: 'value', axisLabel: { formatter: (v: number) => `${v}ms`, fontSize: 11, color: HBC_COLORS.gray500 }, splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } }, axisLine: { show: false }, axisTick: { show: false } },
    series: [
      { type: 'bar', name: 'WebPart Init', stack: 'total', data: breakdownData.map(d => d.WebPart), itemStyle: { color: HBC_COLORS.navy } },
      { type: 'bar', name: 'App Init', stack: 'total', data: breakdownData.map(d => d.AppInit), itemStyle: { color: HBC_COLORS.orange } },
      {
        type: 'bar',
        name: 'Data Fetch',
        stack: 'total',
        barMaxWidth: 60,
        data: breakdownData.map(d => ({
          value: d.DataFetch,
          itemStyle: { color: getBarColor(d.total) },
        })),
      },
    ],
  }), [breakdownData]);

  if (loading && logs.length === 0) {
    return (
      <div className={styles.container}>
        <Breadcrumb items={breadcrumbItems} />
        <PageHeader title="Performance Monitoring" />
        <SkeletonLoader variant="kpi-grid" />
        <SkeletonLoader variant="table" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Breadcrumb items={breadcrumbItems} />
        <PageHeader title="Performance Monitoring" />
        <div style={{ color: HBC_COLORS.error, padding: '16px' }}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Breadcrumb items={breadcrumbItems} />
      <PageHeader
        title="Performance Monitoring"
        subtitle="Web part load time analytics"
        actions={
          <div className={styles.filterRow}>
            <Input
              type="date"
              value={dateRange.startDate || ''}
              onChange={(_, data) => setDateRange({ ...dateRange, startDate: data.value || undefined })}
              placeholder="Start date"
            />
            <Input
              type="date"
              value={dateRange.endDate || ''}
              onChange={(_, data) => setDateRange({ ...dateRange, endDate: data.value || undefined })}
              placeholder="End date"
            />
            <Button icon={<ArrowClockwiseRegular />} onClick={refresh} appearance="subtle">
              Refresh
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <KPICard
          title="Avg Load Time"
          value={summary ? `${summary.avgTotalLoadMs.toLocaleString()}ms` : '—'}
          subtitle="All sessions"
        />
        <KPICard
          title="P95 Load Time"
          value={summary ? `${summary.p95TotalLoadMs.toLocaleString()}ms` : '—'}
          subtitle="95th percentile"
        />
        <KPICard
          title="Total Sessions"
          value={summary?.totalSessions?.toLocaleString() || '0'}
          subtitle="Recorded page loads"
        />
        <KPICard
          title="Slow Loads"
          value={summary?.slowSessionCount?.toLocaleString() || '0'}
          subtitle={`>${PERFORMANCE_THRESHOLDS.SLOW_LOAD_MS / 1000}s threshold`}
        />
      </div>

      {/* Charts */}
      {summary && summary.byDay.length > 0 && (
        <div className={styles.chartRow}>
          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>Daily Average Load Time</div>
            <HbcEChart
              option={lineChartOption}
              height={250}
              ariaLabel="Daily average page load time in milliseconds"
            />
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>Load Time Breakdown (Recent Sessions)</div>
            <HbcEChart
              option={stackedBarOption}
              height={250}
              ariaLabel="Load time breakdown by component for recent sessions"
            />
          </div>
        </div>
      )}

      {/* Session Table */}
      <DataTable
        columns={tableColumns}
        items={logs}
        keyExtractor={(row) => row.SessionId}
        isLoading={loading}
        sortField="Timestamp"
        pageSize={20}
      />
    </div>
  );
};

export default PerformanceDashboard;

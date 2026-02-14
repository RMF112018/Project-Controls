import * as React from 'react';
import { Button, Input, makeStyles, tokens } from '@fluentui/react-components';
import { ArrowClockwiseRegular, ChevronDownRegular, ChevronUpRegular } from '@fluentui/react-icons';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from 'recharts';
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
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={summary.byDay}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="ms" />
                <Tooltip formatter={(value: number) => `${value}ms`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgMs"
                  name="Avg Load (ms)"
                  stroke={HBC_COLORS.navy}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>Load Time Breakdown (Recent Sessions)</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={breakdownData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="ms" />
                <Tooltip formatter={(value: number) => `${value}ms`} />
                <Legend />
                <Bar dataKey="WebPart" name="WebPart Init" stackId="a" fill={HBC_COLORS.navy} />
                <Bar dataKey="AppInit" name="App Init" stackId="a" fill={HBC_COLORS.orange} />
                <Bar dataKey="DataFetch" name="Data Fetch" stackId="a" fill={HBC_COLORS.info}>
                  {breakdownData.map((entry, index) => (
                    <Cell key={index} fill={getBarColor(entry.total)} opacity={0.4} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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

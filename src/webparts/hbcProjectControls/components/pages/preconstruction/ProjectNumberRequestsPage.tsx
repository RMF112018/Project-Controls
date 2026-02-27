/**
 * ProjectNumberRequestsPage — Tracking Table (Phase 4E)
 *
 * Read-only log of all project number requests with 7 columns per plan spec.
 * Rows are clickable → opens the form pre-populated with the record.
 * RoleGate: visible to Estimating Coordinator, Project Executive, PM, Leadership.
 */
import * as React from 'react';
import { makeStyles, shorthands, tokens, Badge } from '@fluentui/react-components';
import { Add24Regular } from '@fluentui/react-icons';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcCard } from '../../shared/HbcCard';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { HbcButton } from '../../shared/HbcButton';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { useAppContext } from '../../contexts/AppContext';
import { useAppNavigate } from '../../hooks/router/useAppNavigate';
import { JobNumberRequestStatus, formatDate } from '@hbc/sp-services';
import type { IJobNumberRequest } from '@hbc/sp-services';

// ── Status Color Mapping ────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: 'success' | 'warning' | 'informative' | 'subtle' | 'important' }> = {
  [JobNumberRequestStatus.Completed]: { label: 'Completed', color: 'success' },
  [JobNumberRequestStatus.PendingController]: { label: 'Pending Controller', color: 'warning' },
  [JobNumberRequestStatus.PendingProvisioning]: { label: 'Pending Provisioning', color: 'informative' },
  [JobNumberRequestStatus.Submitted]: { label: 'Submitted', color: 'subtle' },
  [JobNumberRequestStatus.Draft]: { label: 'Draft', color: 'subtle' },
  [JobNumberRequestStatus.Pending]: { label: 'Pending', color: 'warning' },
};

// ── Styles (Griffel + tokens — 4.75/10 elevation) ───────────────────
const useStyles = makeStyles({
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    ...shorthands.gap(tokens.spacingHorizontalL),
    marginBottom: tokens.spacingVerticalL,
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  tableCard: {
    marginTop: tokens.spacingVerticalM,
  },
  statusBadge: {
    textTransform: 'capitalize' as const,
  },
});

// ── Component ───────────────────────────────────────────────────────
export const ProjectNumberRequestsPage: React.FC = () => {
  const styles = useStyles();
  const { dataService } = useAppContext();
  const navigate = useAppNavigate();

  // ── State ─────────────────────────────────────────────────────────
  const [requests, setRequests] = React.useState<IJobNumberRequest[]>([]);
  const [loading, setLoading] = React.useState(true);

  // ── Data Fetch ────────────────────────────────────────────────────
  React.useEffect(() => {
    dataService.getJobNumberRequests()
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, [dataService]);

  // ── KPI Calculations ──────────────────────────────────────────────
  const totalRequests = requests.length;
  const pendingCount = requests.filter(r =>
    r.RequestStatus !== JobNumberRequestStatus.Completed
  ).length;
  const completedCount = requests.filter(r =>
    r.RequestStatus === JobNumberRequestStatus.Completed
  ).length;

  // ── Row Click Handler ─────────────────────────────────────────────
  const onRowClick = React.useCallback((row: IJobNumberRequest) => {
    navigate(`/preconstruction/project-number-requests/${row.id}`);
  }, [navigate]);

  // ── New Request ───────────────────────────────────────────────────
  const onNewRequest = React.useCallback(() => {
    navigate('/preconstruction/project-number-requests/new');
  }, [navigate]);

  // ── Column Definitions (7 per plan spec) ──────────────────────────
  const columns = React.useMemo((): IHbcDataTableColumn<IJobNumberRequest>[] => [
    {
      key: 'ProjectName',
      header: 'Project Name',
      render: (row) => row.ProjectName || row.ProjectAddress || '—',
      sortable: true,
    },
    {
      key: 'ProjectNumber',
      header: 'Project Number',
      render: (row) => row.AssignedJobNumber || row.TempProjectCode || '—',
      sortable: true,
      width: '140px',
    },
    {
      key: 'Status',
      header: 'Status',
      render: (row) => {
        const config = STATUS_CONFIG[row.RequestStatus] ?? { label: row.RequestStatus, color: 'subtle' as const };
        return (
          <Badge
            appearance="filled"
            color={config.color}
            className={styles.statusBadge}
          >
            {config.label}
          </Badge>
        );
      },
      sortable: true,
      width: '170px',
    },
    {
      key: 'RequestDate',
      header: 'Request Date',
      render: (row) => formatDate(row.RequestDate, { dateStyle: 'numeric', placeholder: '—', fallbackOnInvalid: '—' }),
      sortable: true,
      width: '120px',
    },
    {
      key: 'RequiredByDate',
      header: 'Required by Date',
      render: (row) => formatDate(row.RequiredByDate, { dateStyle: 'numeric', placeholder: '—', fallbackOnInvalid: '—' }),
      sortable: true,
      width: '140px',
    },
    {
      key: 'RequestedBy',
      header: 'Requested By',
      render: (row) => row.SubmittedBy || row.Originator || '—',
      sortable: true,
    },
    {
      key: 'BallInCourt',
      header: 'Ball in Court',
      render: (row) => row.BallInCourt || '—',
      sortable: true,
    },
  ], [styles.statusBadge]);

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Project Number Requests"
        subtitle="Track and manage project number requests across the organization."
        actions={
          <HbcButton emphasis="strong" icon={<Add24Regular />} onClick={onNewRequest}>
            New Request
          </HbcButton>
        }
      />

      {/* KPI Summary */}
      {loading ? (
        <HbcSkeleton variant="kpi-grid" columns={3} />
      ) : (
        <div className={styles.kpiGrid}>
          <KPICard title="Total Requests" value={totalRequests} />
          <KPICard title="Pending" value={pendingCount} />
          <KPICard title="Completed" value={completedCount} />
        </div>
      )}

      {/* Tracking Table */}
      <HbcCard title="All Requests" className={styles.tableCard}>
        {loading ? (
          <HbcSkeleton variant="table" rows={5} />
        ) : (
          <HbcDataTable
            tableId="project-number-requests"
            columns={columns}
            items={requests}
            keyExtractor={(row) => String(row.id)}
            onRowClick={onRowClick}
            emptyTitle="No requests yet"
            emptyDescription="Create a new project number request to get started."
            ariaLabel="Project number requests tracking table"
          />
        )}
      </HbcCard>
    </div>
  );
};

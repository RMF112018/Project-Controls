/**
 * ProjectNumberRequestsPage — Tracking Table (Phase 4E)
 *
 * Read-only log of all project number requests with 7 columns per plan spec.
 * Rows are clickable → opens the form pre-populated with the record.
 * RoleGate: visible to Estimating Coordinator, Project Executive, PM, Leadership.
 */
import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { makeStyles, shorthands, tokens, Badge, MessageBar, MessageBarBody } from '@fluentui/react-components';
import { Add24Regular } from '@fluentui/react-icons';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcCard } from '../../shared/HbcCard';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { HbcButton } from '../../shared/HbcButton';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { useToast } from '../../shared/ToastContainer';
import { useAppContext } from '../../contexts/AppContext';
import { useAppNavigate } from '../../hooks/router/useAppNavigate';
import { JobNumberRequestStatus, formatDate } from '@hbc/sp-services';
import type { IJobNumberRequest } from '@hbc/sp-services';

const SETUP_COMPLETE_STATUS = 'SetupComplete' as JobNumberRequestStatus;

// ── Status Color Mapping ────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: 'success' | 'warning' | 'informative' | 'subtle' | 'important' }> = {
  [JobNumberRequestStatus.Completed]: { label: 'Completed', color: 'success' },
  [SETUP_COMPLETE_STATUS]: { label: 'Setup Complete', color: 'success' },
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
  errorBanner: {
    marginBottom: tokens.spacingVerticalM,
  },
});

// ── Component ───────────────────────────────────────────────────────
export const ProjectNumberRequestsPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, currentUser } = useAppContext();
  const { addToast } = useToast();
  const navigate = useAppNavigate();
  const requestsQuery = useQuery({
    queryKey: ['project-number-requests'],
    queryFn: () => dataService.getJobNumberRequests(),
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    refetchInterval: () => (typeof document !== 'undefined' && document.hidden ? false : 30_000),
    refetchOnWindowFocus: true,
  });
  const requests = requestsQuery.data ?? [];
  const deferredRequests = React.useDeferredValue(requests);
  const loading = requestsQuery.isLoading;
  const seenSetupCompleteRef = React.useRef<Set<number>>(new Set());

  const seenStorageKey = React.useMemo(
    () => `hbc:project-number-setup-toast:${currentUser?.email ?? 'anonymous'}`,
    [currentUser?.email]
  );

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem(seenStorageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      const ids = Array.isArray(parsed) ? parsed.filter((value): value is number => typeof value === 'number') : [];
      seenSetupCompleteRef.current = new Set(ids);
    } catch {
      seenSetupCompleteRef.current = new Set();
    }
  }, [seenStorageKey]);

  React.useEffect(() => {
    if (!currentUser) return;
    const identityTokens = [currentUser.email, currentUser.displayName]
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    if (identityTokens.length === 0) return;

    const notifyTimer = window.setTimeout(() => {
      let changed = false;
      for (const request of deferredRequests) {
        if (request.RequestStatus !== SETUP_COMPLETE_STATUS) continue;
        const ownerTokens = [request.Originator, request.Email, request.SubmittedBy]
          .map((value) => (value ?? '').trim().toLowerCase())
          .filter(Boolean);
        const isOwner = ownerTokens.some((token) => identityTokens.includes(token));
        if (!isOwner || seenSetupCompleteRef.current.has(request.id)) continue;

        const projectLabel = request.ProjectName || request.ProjectAddress || `Request #${request.id}`;
        const projectNumber = request.AssignedJobNumber || request.TempProjectCode;
        addToast(
          projectNumber
            ? `Accounting setup complete for ${projectLabel} (${projectNumber}).`
            : `Accounting setup complete for ${projectLabel}.`,
          'success'
        );
        seenSetupCompleteRef.current.add(request.id);
        changed = true;
      }

      if (changed) {
        sessionStorage.setItem(seenStorageKey, JSON.stringify(Array.from(seenSetupCompleteRef.current)));
      }
    }, 250);

    return () => window.clearTimeout(notifyTimer);
  }, [deferredRequests, currentUser, addToast, seenStorageKey]);

  // ── KPI Calculations ──────────────────────────────────────────────
  const totalRequests = deferredRequests.length;
  const pendingCount = deferredRequests.filter((r) =>
    r.RequestStatus !== JobNumberRequestStatus.Completed &&
    r.RequestStatus !== SETUP_COMPLETE_STATUS
  ).length;
  const completedCount = deferredRequests.filter((r) =>
    r.RequestStatus === JobNumberRequestStatus.Completed ||
    r.RequestStatus === SETUP_COMPLETE_STATUS
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
      key: 'AssignedJobNumber',
      header: 'Project Number',
      render: (row) => row.AssignedJobNumber || row.TempProjectCode || '—',
      sortable: true,
      width: '140px',
    },
    {
      key: 'RequestStatus',
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
      key: 'SubmittedBy',
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

      {requestsQuery.isError ? (
        <MessageBar intent="error" className={styles.errorBanner}>
          <MessageBarBody>Unable to refresh project number requests. Retrying automatically.</MessageBarBody>
        </MessageBar>
      ) : null}

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
            items={deferredRequests}
            keyExtractor={(row) => String(row.id)}
            onRowClick={onRowClick}
            emptyTitle="No requests yet"
            emptyDescription="Create a new project number request to get started."
            ariaLabel="Project number requests tracking table"
            virtualization={{
              enabled: true,
              threshold: 60,
              estimateRowHeight: 52,
              containerHeight: 540,
              overscan: 8,
              adaptiveOverscan: true,
            }}
          />
        )}
      </HbcCard>
    </div>
  );
};

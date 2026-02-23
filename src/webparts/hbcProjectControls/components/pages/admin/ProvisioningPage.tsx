import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { HbcButton } from '../../shared/HbcButton';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { StatusBadge } from '../../shared/StatusBadge';
import { KPICard } from '../../shared/KPICard';
import { useAppContext } from '../../contexts/AppContext';
import { useToast } from '../../shared/ToastContainer';
import { ProvisioningStatus, AuditAction, EntityType } from '@hbc/sp-services';
import type { IProvisioningLog } from '@hbc/sp-services';
import type { IProvisioningSummary } from '@hbc/sp-services';

const POLL_INTERVAL_MS = 30_000;

const STATUS_COLORS: Record<ProvisioningStatus, { color: string; backgroundColor: string }> = {
  [ProvisioningStatus.Completed]: { color: tokens.colorStatusSuccessForeground2, backgroundColor: tokens.colorStatusSuccessBackground2 },
  [ProvisioningStatus.InProgress]: { color: tokens.colorCompoundBrandForeground1, backgroundColor: tokens.colorNeutralBackground3 },
  [ProvisioningStatus.Failed]: { color: tokens.colorStatusDangerForeground2, backgroundColor: tokens.colorStatusDangerBackground2 },
  [ProvisioningStatus.PartialFailure]: { color: tokens.colorStatusWarningForeground2, backgroundColor: tokens.colorStatusWarningBackground2 },
  [ProvisioningStatus.Queued]: { color: tokens.colorNeutralForeground3, backgroundColor: tokens.colorNeutralBackground3 },
};

const useStyles = makeStyles({
  container: {
    ...shorthands.padding('16px', '0'),
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    ...shorthands.gap('16px'),
    marginBottom: '24px',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    marginBottom: '16px',
  },
  progressText: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
});

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '\u2014';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export const ProvisioningPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, currentUser } = useAppContext();
  const { addToast } = useToast();

  const [summary, setSummary] = React.useState<IProvisioningSummary | null>(null);
  const [logs, setLogs] = React.useState<IProvisioningLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [retryingCode, setRetryingCode] = React.useState<string | null>(null);

  const fetchData = React.useCallback(() => {
    const summaryPromise = dataService.getProvisioningSummary()
      .then(result => setSummary(result))
      .catch(() => setSummary(null));

    const logsPromise = dataService.getProvisioningLogs()
      .then(result => setLogs(result))
      .catch(() => setLogs([]));

    Promise.all([summaryPromise, logsPromise])
      .finally(() => setLoading(false));
  }, [dataService]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh polling when any entries are in-progress
  React.useEffect(() => {
    const hasInProgress = logs.some(
      log => log.status === ProvisioningStatus.InProgress || log.status === ProvisioningStatus.Queued
    );
    if (!hasInProgress) return;

    const intervalId = window.setInterval(() => {
      dataService.getProvisioningLogs()
        .then(result => setLogs(result))
        .catch(() => { /* ignore polling errors */ });
      dataService.getProvisioningSummary()
        .then(result => setSummary(result))
        .catch(() => { /* ignore polling errors */ });
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [logs, dataService]);

  const handleRetry = React.useCallback(async (log: IProvisioningLog) => {
    setRetryingCode(log.projectCode);
    try {
      await dataService.retryProvisioning(log.projectCode, log.failedStep ?? 1);
      await dataService.logAudit({
        Action: AuditAction.SiteProvisioningTriggered,
        EntityType: EntityType.Project,
        EntityId: log.projectCode,
        User: currentUser?.email || 'unknown',
        Details: JSON.stringify({ action: 'retry', fromStep: log.failedStep }),
      });
      addToast(`Retry triggered for ${log.projectCode}.`, 'success');
      fetchData();
    } catch {
      addToast(`Failed to retry provisioning for ${log.projectCode}.`, 'error');
    } finally {
      setRetryingCode(null);
    }
  }, [dataService, currentUser, addToast, fetchData]);

  const columns = React.useMemo((): IHbcDataTableColumn<IProvisioningLog>[] => [
    {
      key: 'projectCode',
      header: 'Project Code',
      render: (row) => row.projectCode,
    },
    {
      key: 'projectName',
      header: 'Project Name',
      render: (row) => row.projectName || '\u2014',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const colors = STATUS_COLORS[row.status] || STATUS_COLORS[ProvisioningStatus.Queued];
        return (
          <StatusBadge
            label={row.status}
            color={colors.color}
            backgroundColor={colors.backgroundColor}
          />
        );
      },
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (row) => (
        <span className={styles.progressText}>
          {row.completedSteps} / 7 steps
        </span>
      ),
    },
    {
      key: 'errorMessage',
      header: 'Error',
      render: (row) => row.errorMessage || '\u2014',
    },
    {
      key: 'requestedAt',
      header: 'Requested',
      render: (row) => formatDate(row.requestedAt),
    },
  ], [styles]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Site Provisioning" />
        <div className={styles.container}>
          <HbcSkeleton variant="kpi-grid" columns={4} />
          <HbcSkeleton variant="table" rows={6} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Site Provisioning"
        subtitle="Monitor and manage SharePoint site provisioning operations."
        actions={
          <HbcButton emphasis="strong" onClick={fetchData}>
            Refresh
          </HbcButton>
        }
      />
      <div className={styles.container}>
        <div className={styles.kpiGrid}>
          <KPICard
            title="Total Provisioned"
            value={summary?.totalProvisioned ?? 0}
          />
          <KPICard
            title="In Progress"
            value={summary?.inProgress ?? 0}
          />
          <KPICard
            title="Failed"
            value={summary?.failed ?? 0}
          />
          <KPICard
            title="Avg Duration"
            value={summary?.averageDurationMs ? formatDuration(summary.averageDurationMs) : '\u2014'}
            subtitle={summary?.lastProvisionedAt ? `Last: ${formatDate(summary.lastProvisionedAt)}` : undefined}
          />
        </div>

        <HbcDataTable
          tableId="admin-provisioning"
          columns={columns}
          items={logs}
          isLoading={loading}
          keyExtractor={(row) => String(row.id)}
          rowActions={(row) =>
            row.status === ProvisioningStatus.Failed || row.status === ProvisioningStatus.PartialFailure ? (
              <HbcButton
                isLoading={retryingCode === row.projectCode}
                onClick={() => handleRetry(row)}
              >
                Retry
              </HbcButton>
            ) : null
          }
        />
      </div>
    </div>
  );
};

import * as React from 'react';
import { Button } from '@fluentui/react-components';
import { useAppContext } from '../../contexts/AppContext';
import { PageHeader } from '../../shared/PageHeader';
import { DataTable, IDataTableColumn } from '../../shared/DataTable';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { ProvisioningStatusView } from '../../shared/ProvisioningStatus';
import { RoleGate } from '../../guards/RoleGate';
import { IProvisioningLog, ProvisioningStatus, RoleName } from '../../../models';
import { ProvisioningService } from '../../../services/ProvisioningService';
import { HBC_COLORS, SPACING } from '../../../theme/tokens';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function getStatusBadgeColor(status: ProvisioningStatus): string {
  switch (status) {
    case ProvisioningStatus.Completed: return HBC_COLORS.success;
    case ProvisioningStatus.InProgress: return HBC_COLORS.info;
    case ProvisioningStatus.Queued: return HBC_COLORS.gray400;
    case ProvisioningStatus.PartialFailure:
    case ProvisioningStatus.Failed: return HBC_COLORS.error;
    default: return HBC_COLORS.gray400;
  }
}

export const AdminPanel: React.FC = () => {
  const { dataService } = useAppContext();
  const [logs, setLogs] = React.useState<IProvisioningLog[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [retrying, setRetrying] = React.useState<string | null>(null);
  const [expandedCode, setExpandedCode] = React.useState<string | null>(null);

  const provisioningService = React.useMemo(
    () => new ProvisioningService(dataService),
    [dataService]
  );

  const fetchLogs = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const items = await dataService.getProvisioningLogs();
      setLogs(items);
    } catch (err) {
      console.error('Failed to fetch provisioning logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  React.useEffect(() => {
    fetchLogs().catch(console.error);
  }, [fetchLogs]);

  // Poll for updates while any log is in-progress
  React.useEffect(() => {
    const hasActive = logs.some(
      l => l.status === ProvisioningStatus.InProgress || l.status === ProvisioningStatus.Queued
    );
    if (!hasActive) return;

    const interval = setInterval(() => {
      fetchLogs().catch(console.error);
    }, 1000);

    return () => clearInterval(interval);
  }, [logs, fetchLogs]);

  const handleRetry = React.useCallback(async (log: IProvisioningLog) => {
    const fromStep = log.failedStep ?? log.completedSteps + 1;
    setRetrying(log.projectCode);
    try {
      await provisioningService.retryFromStep(log.projectCode, fromStep);
      await fetchLogs();
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setRetrying(null);
    }
  }, [provisioningService, fetchLogs]);

  const columns: IDataTableColumn<IProvisioningLog>[] = [
    {
      key: 'projectCode',
      header: 'Project Code',
      width: '120px',
      render: (item) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: HBC_COLORS.navy }}>
          {item.projectCode}
        </span>
      ),
    },
    {
      key: 'projectName',
      header: 'Project Name',
      width: '200px',
      render: (item) => <span>{item.projectName}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      render: (item) => (
        <span style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: '10px',
          fontSize: '11px',
          fontWeight: 600,
          color: HBC_COLORS.white,
          backgroundColor: getStatusBadgeColor(item.status),
        }}>
          {item.status}
        </span>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      width: '100px',
      render: (item) => <span>{item.completedSteps}/7 steps</span>,
    },
    {
      key: 'error',
      header: 'Error',
      width: '200px',
      render: (item) => (
        <span style={{ fontSize: '12px', color: item.errorMessage ? HBC_COLORS.error : HBC_COLORS.gray400 }}>
          {item.errorMessage || '-'}
        </span>
      ),
    },
    {
      key: 'retryCount',
      header: 'Retries',
      width: '70px',
      render: (item) => <span>{item.retryCount}</span>,
    },
    {
      key: 'requestedBy',
      header: 'Requested By',
      width: '160px',
      render: (item) => <span>{item.requestedBy}</span>,
    },
    {
      key: 'requestedAt',
      header: 'Requested At',
      width: '160px',
      render: (item) => <span>{formatDateTime(item.requestedAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: (item) => {
        const canRetry = item.status === ProvisioningStatus.Failed ||
          item.status === ProvisioningStatus.PartialFailure;
        const canExpand = true;

        return (
          <div style={{ display: 'flex', gap: '4px' }}>
            {canRetry && (
              <Button
                appearance="primary"
                size="small"
                style={{ backgroundColor: HBC_COLORS.orange, fontSize: '11px' }}
                disabled={retrying === item.projectCode}
                onClick={(e) => { e.stopPropagation(); handleRetry(item).catch(console.error); }}
              >
                {retrying === item.projectCode ? 'Retrying...' : 'Retry'}
              </Button>
            )}
            {canExpand && (
              <Button
                appearance="subtle"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedCode(expandedCode === item.projectCode ? null : item.projectCode);
                }}
              >
                {expandedCode === item.projectCode ? 'Hide' : 'Details'}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <RoleGate
      allowedRoles={[RoleName.ExecutiveLeadership, RoleName.IDS]}
      fallback={
        <div style={{ padding: '48px', textAlign: 'center', color: HBC_COLORS.gray500 }}>
          <h3>Access Restricted</h3>
          <p>Admin panel is restricted to Executive Leadership and IDS roles.</p>
        </div>
      }
    >
      <PageHeader
        title="Admin Panel"
        subtitle="Site Provisioning Management"
        actions={
          <Button appearance="secondary" onClick={() => fetchLogs().catch(console.error)}>
            Refresh
          </Button>
        }
      />

      {isLoading && logs.length === 0 ? (
        <LoadingSpinner label="Loading provisioning logs..." />
      ) : (
        <>
          <DataTable
            columns={columns}
            items={logs}
            keyExtractor={(item) => item.id}
            emptyTitle="No Provisioning Requests"
            emptyDescription="Provisioning logs will appear here when GO decisions trigger site creation."
          />

          {/* Expanded detail view */}
          {expandedCode && (
            <div style={{
              marginTop: SPACING.md,
              padding: SPACING.lg,
              background: HBC_COLORS.gray50,
              borderRadius: '8px',
              border: `1px solid ${HBC_COLORS.gray200}`,
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: SPACING.md,
              }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: HBC_COLORS.navy }}>
                  Provisioning Details: {expandedCode}
                </span>
                <Button
                  appearance="subtle"
                  size="small"
                  onClick={() => setExpandedCode(null)}
                >
                  Close
                </Button>
              </div>
              <ProvisioningStatusView
                projectCode={expandedCode}
                pollInterval={1000}
              />
            </div>
          )}
        </>
      )}
    </RoleGate>
  );
};

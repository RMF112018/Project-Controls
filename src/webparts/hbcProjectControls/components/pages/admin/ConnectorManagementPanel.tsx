import * as React from 'react';
import {
  makeStyles,
  shorthands,
  tokens,
  Button,
  Badge,
} from '@fluentui/react-components';
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerHeaderNavigation,
} from '@fluentui/react-drawer';
import { Dismiss24Regular } from '@fluentui/react-icons';
import { HbcCard } from '../../shared/HbcCard';
import { HbcButton } from '../../shared/HbcButton';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { StatusBadge } from '../../shared/StatusBadge';
import { useAppContext } from '../../contexts/AppContext';
import { useConnectorMutation } from '../../../tanstack/query/mutations/useConnectorMutation';
import type { IExternalConnector, ISyncHistoryEntry, ConnectorStatus, IConnectorRetryPolicy } from '@hbc/sp-services';

const DEFAULT_CONNECTOR_RETRY_POLICY: IConnectorRetryPolicy = {
  retryableStatuses: [429, 500, 502, 503, 504],
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 15000,
};

const STATUS_COLORS: Record<ConnectorStatus, { color: string; backgroundColor: string }> = {
  Active: { color: tokens.colorStatusSuccessForeground2, backgroundColor: tokens.colorStatusSuccessBackground2 },
  Inactive: { color: tokens.colorNeutralForeground3, backgroundColor: tokens.colorNeutralBackground3 },
  Error: { color: tokens.colorStatusDangerForeground2, backgroundColor: tokens.colorStatusDangerBackground2 },
  Configuring: { color: tokens.colorStatusWarningForeground2, backgroundColor: tokens.colorStatusWarningBackground2 },
};

const useStyles = makeStyles({
  section: {
    ...shorthands.padding('24px', '0', '0'),
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    ...shorthands.margin('0', '0', '16px'),
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    ...shorthands.gap('16px'),
  },
  cardBody: {
    display: 'grid',
    ...shorthands.gap('8px'),
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
  },
  value: {
    fontSize: '13px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  actions: {
    display: 'flex',
    ...shorthands.gap('8px'),
    ...shorthands.padding('8px', '0', '0'),
  },
  drawerBody: {
    ...shorthands.padding('0', '16px', '16px'),
  },
  historyItem: {
    display: 'grid',
    ...shorthands.gap('4px'),
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius('8px'),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.margin('0', '0', '8px'),
  },
  historyRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '13px',
  },
  historyLabel: {
    color: tokens.colorNeutralForeground3,
  },
  historyValue: {
    fontWeight: tokens.fontWeightSemibold,
  },
  emptyState: {
    ...shorthands.padding('24px'),
    textAlign: 'center' as const,
    color: tokens.colorNeutralForeground3,
    fontSize: '14px',
  },
});

export const ConnectorManagementPanel: React.FC = () => {
  const styles = useStyles();
  const { dataService } = useAppContext();
  const [connectors, setConnectors] = React.useState<IExternalConnector[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [drawerConnector, setDrawerConnector] = React.useState<IExternalConnector | null>(null);
  const [syncHistory, setSyncHistory] = React.useState<ISyncHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);

  // Phase 5A.1: Connector mutations via useConnectorMutation (resilience hook)
  const testMutation = useConnectorMutation<{ success: boolean; message: string }, number>({
    operationName: 'connector:testConnection',
    mutationFn: (connectorId: number) => dataService.testConnectorConnection(connectorId),
    retryPolicy: DEFAULT_CONNECTOR_RETRY_POLICY,
    onSuccess: (result, connectorId) => {
      setConnectors(prev =>
        prev.map(c =>
          c.id === connectorId
            ? { ...c, status: result.success ? ('Active' as const) : ('Error' as const) }
            : c,
        ),
      );
    },
  });

  const syncMutation = useConnectorMutation<ISyncHistoryEntry, number>({
    operationName: 'connector:triggerSync',
    mutationFn: async (connectorId: number) => {
      const entry = await dataService.triggerConnectorSync(connectorId);
      const updated = await dataService.getConnector(connectorId);
      if (updated) {
        setConnectors(prev => prev.map(c => (c.id === connectorId ? updated : c)));
      }
      return entry;
    },
    retryPolicy: DEFAULT_CONNECTOR_RETRY_POLICY,
  });

  React.useEffect(() => {
    dataService
      .getConnectors()
      .then(result => setConnectors(result))
      .catch(() => setConnectors([]))
      .finally(() => setLoading(false));
  }, [dataService]);

  const handleOpenHistory = React.useCallback(
    async (connector: IExternalConnector) => {
      setDrawerConnector(connector);
      setDrawerOpen(true);
      setHistoryLoading(true);
      try {
        const history = await dataService.getConnectorSyncHistory(connector.id);
        setSyncHistory(history);
      } catch {
        setSyncHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    },
    [dataService],
  );

  if (loading) {
    return (
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>External Integrations</h3>
        <HbcSkeleton variant="card" />
      </div>
    );
  }

  if (connectors.length === 0) {
    return (
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>External Integrations</h3>
        <p className={styles.emptyState}>No external connectors configured.</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>External Integrations</h3>
        <div className={styles.grid} data-testid="connector-grid">
          {connectors.map(connector => {
            const statusColors = STATUS_COLORS[connector.status];
            return (
              <div key={connector.id} data-testid={`connector-card-${connector.id}`}>
              <HbcCard
                title={connector.name}
                statusBadge={
                  <span data-testid={`connector-status-${connector.id}`}>
                    <StatusBadge
                      label={connector.status}
                      color={statusColors.color}
                      backgroundColor={statusColors.backgroundColor}
                    />
                  </span>
                }
              >
                <div className={styles.cardBody}>
                  <div className={styles.row}>
                    <span className={styles.label}>Type</span>
                    <Badge appearance="outline">{connector.connectorType}</Badge>
                  </div>
                  <div className={styles.row}>
                    <span className={styles.label}>Direction</span>
                    <span className={styles.value}>{connector.syncDirection}</span>
                  </div>
                  <div className={styles.row}>
                    <span className={styles.label}>Last Sync</span>
                    <span className={styles.value}>
                      {connector.lastSyncAt
                        ? new Date(connector.lastSyncAt).toLocaleString()
                        : 'Never'}
                    </span>
                  </div>
                  <div className={styles.actions}>
                    <HbcButton
                      isLoading={testMutation.isPending && testMutation.variables === connector.id}
                      onClick={() => testMutation.mutate(connector.id)}
                      data-testid={`connector-test-${connector.id}`}
                    >
                      Test
                    </HbcButton>
                    <HbcButton
                      emphasis="strong"
                      isLoading={syncMutation.isPending && syncMutation.variables === connector.id}
                      onClick={() => syncMutation.mutate(connector.id)}
                      data-testid={`connector-sync-${connector.id}`}
                    >
                      Sync Now
                    </HbcButton>
                    <HbcButton onClick={() => handleOpenHistory(connector)} data-testid={`connector-history-${connector.id}`}>History</HbcButton>
                  </div>
                </div>
              </HbcCard>
              </div>
            );
          })}
        </div>
      </div>

      <Drawer
        type="overlay"
        position="end"
        open={drawerOpen}
        onOpenChange={(_, data) => setDrawerOpen(data.open)}
        size="medium"
        data-testid="sync-history-drawer"
      >
        <DrawerHeader>
          <DrawerHeaderNavigation>
            <Button
              appearance="subtle"
              icon={<Dismiss24Regular />}
              onClick={() => setDrawerOpen(false)}
              aria-label="Close sync history"
            />
          </DrawerHeaderNavigation>
          <DrawerHeaderTitle>
            Sync History &mdash; {drawerConnector?.name ?? ''}
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody className={styles.drawerBody}>
          {historyLoading ? (
            <HbcSkeleton variant="card" />
          ) : syncHistory.length === 0 ? (
            <p className={styles.emptyState}>No sync history available.</p>
          ) : (
            syncHistory.map(entry => (
              <div key={entry.id} className={styles.historyItem}>
                <div className={styles.historyRow}>
                  <span className={styles.historyLabel}>Started</span>
                  <span className={styles.historyValue}>
                    {new Date(entry.startedAt).toLocaleString()}
                  </span>
                </div>
                {entry.completedAt && (
                  <div className={styles.historyRow}>
                    <span className={styles.historyLabel}>Completed</span>
                    <span>{new Date(entry.completedAt).toLocaleString()}</span>
                  </div>
                )}
                <div className={styles.historyRow}>
                  <span className={styles.historyLabel}>Direction</span>
                  <span>{entry.direction}</span>
                </div>
                <div className={styles.historyRow}>
                  <span className={styles.historyLabel}>Records</span>
                  <span className={styles.historyValue}>{entry.recordsSynced}</span>
                </div>
                <div className={styles.historyRow}>
                  <span className={styles.historyLabel}>Errors</span>
                  <span style={{ color: entry.errors > 0 ? tokens.colorStatusDangerForeground2 : undefined }}>
                    {entry.errors}
                  </span>
                </div>
                <div className={styles.historyRow}>
                  <span className={styles.historyLabel}>Status</span>
                  <Badge
                    appearance="filled"
                    color={entry.status === 'Completed' ? 'success' : entry.status === 'Failed' ? 'danger' : 'informative'}
                  >
                    {entry.status}
                  </Badge>
                </div>
                {entry.errorDetails && (
                  <div className={styles.historyRow}>
                    <span className={styles.historyLabel}>Details</span>
                    <span style={{ color: tokens.colorStatusDangerForeground2 }}>{entry.errorDetails}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </DrawerBody>
      </Drawer>
    </>
  );
};

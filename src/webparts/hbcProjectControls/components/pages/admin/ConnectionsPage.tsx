import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { HbcButton } from '../../shared/HbcButton';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { StatusBadge } from '../../shared/StatusBadge';
import { ConnectorManagementPanel } from './ConnectorManagementPanel';

type ConnectionStatus = 'Connected' | 'Disconnected' | 'Unknown';

interface IServiceState {
  status: ConnectionStatus;
  testing: boolean;
  lastTested: string | null;
}

const SERVICES = [
  { key: 'sp-lists', name: 'SharePoint Lists', description: 'Core list data access' },
  { key: 'graph-api', name: 'Graph API', description: 'Microsoft Graph integration' },
  { key: 'pnp', name: 'PnP Provisioning', description: 'Site provisioning engine' },
  { key: 'power-automate', name: 'Power Automate', description: 'Workflow automation' },
  { key: 'azure-functions', name: 'Azure Functions', description: 'Serverless compute' },
];

const STATUS_COLORS: Record<ConnectionStatus, { color: string; backgroundColor: string }> = {
  Connected: { color: tokens.colorStatusSuccessForeground2, backgroundColor: tokens.colorStatusSuccessBackground2 },
  Disconnected: { color: tokens.colorStatusDangerForeground2, backgroundColor: tokens.colorStatusDangerBackground2 },
  Unknown: { color: tokens.colorNeutralForeground3, backgroundColor: tokens.colorNeutralBackground3 },
};

const useStyles = makeStyles({
  container: {
    ...shorthands.padding('16px', '0'),
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ...shorthands.padding('0', '0', '16px'),
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    ...shorthands.gap('16px'),
  },
  cardBody: {
    display: 'grid',
    ...shorthands.gap('8px'),
  },
  description: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
    ...shorthands.margin('0'),
  },
  footer: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
});

function buildInitialState(): Record<string, IServiceState> {
  const state: Record<string, IServiceState> = {};
  for (const service of SERVICES) {
    state[service.key] = { status: 'Unknown', testing: false, lastTested: null };
  }
  return state;
}

export const ConnectionsPage: React.FC = () => {
  const styles = useStyles();
  const [loading, setLoading] = React.useState(true);
  const [serviceStates, setServiceStates] = React.useState<Record<string, IServiceState>>(buildInitialState);
  const [testingAll, setTestingAll] = React.useState(false);

  // Simulate initial load
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => window.clearTimeout(timer);
  }, []);

  const testService = React.useCallback((key: string) => {
    setServiceStates(prev => ({
      ...prev,
      [key]: { ...prev[key], testing: true },
    }));

    window.setTimeout(() => {
      const connected = Math.random() > 0.3;
      setServiceStates(prev => ({
        ...prev,
        [key]: {
          status: connected ? 'Connected' : 'Disconnected',
          testing: false,
          lastTested: new Date().toLocaleTimeString(),
        },
      }));
    }, 1000);
  }, []);

  const testAll = React.useCallback(() => {
    setTestingAll(true);
    for (const service of SERVICES) {
      testService(service.key);
    }
    window.setTimeout(() => {
      setTestingAll(false);
    }, 1200);
  }, [testService]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Service Connections" />
        <div className={styles.container}>
          <HbcSkeleton variant="card" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Service Connections" subtitle="Test and monitor external service connectivity." />
      <div className={styles.container}>
        <div className={styles.toolbar}>
          <HbcButton emphasis="strong" isLoading={testingAll} onClick={testAll}>
            Test All
          </HbcButton>
        </div>
        <div className={styles.grid}>
          {SERVICES.map(service => {
            const state = serviceStates[service.key];
            const statusColors = STATUS_COLORS[state.status];
            return (
              <HbcCard
                key={service.key}
                title={service.name}
                statusBadge={
                  <StatusBadge
                    label={state.status}
                    color={statusColors.color}
                    backgroundColor={statusColors.backgroundColor}
                  />
                }
                footer={
                  <span className={styles.footer}>
                    {state.lastTested ? `Last tested: ${state.lastTested}` : 'Not yet tested'}
                  </span>
                }
              >
                <div className={styles.cardBody}>
                  <p className={styles.description}>{service.description}</p>
                  <div>
                    <HbcButton isLoading={state.testing} onClick={() => testService(service.key)}>
                      Test
                    </HbcButton>
                  </div>
                </div>
              </HbcCard>
            );
          })}
        </div>
        <ConnectorManagementPanel />
      </div>
    </div>
  );
};

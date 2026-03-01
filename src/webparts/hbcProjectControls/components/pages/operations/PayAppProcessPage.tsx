import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { StatusBadge } from '../../shared/StatusBadge';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { useAppContext } from '../../contexts/AppContext';
import type { IContractInfo, IDeliverable } from '@hbc/sp-services';

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  contractSummary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    ...shorthands.gap('12px'),
  },
  summaryLabel: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    marginBottom: '4px',
  },
  summaryValue: {
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
  },
});

function getDeliverableStatusBadge(status: string): React.ReactNode {
  switch (status) {
    case 'Completed':
    case 'Complete':
      return <StatusBadge label="Completed" color={tokens.colorStatusSuccessForeground1} backgroundColor={tokens.colorStatusSuccessBackground1} />;
    case 'InProgress':
    case 'In Progress':
      return <StatusBadge label="In Progress" color={tokens.colorBrandForeground1} backgroundColor={tokens.colorNeutralBackground4} />;
    case 'Overdue':
      return <StatusBadge label="Overdue" color={tokens.colorStatusDangerForeground1} backgroundColor={tokens.colorStatusDangerBackground1} />;
    default:
      return <StatusBadge label={status} color={tokens.colorNeutralForeground2} backgroundColor={tokens.colorNeutralBackground3} />;
  }
}

const DELIVERABLE_COLUMNS: IHbcDataTableColumn<IDeliverable>[] = [
  { key: 'name', header: 'Description', render: item => item.name },
  { key: 'dueDate', header: 'Due Date', render: item => item.dueDate },
  { key: 'status', header: 'Status', render: item => getDeliverableStatusBadge(item.status) },
  { key: 'assignedTo', header: 'Assigned To', render: item => item.assignedTo },
];

export const PayAppProcessPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, selectedProject } = useAppContext();
  const projectCode = selectedProject?.projectCode || '';

  const [contractInfo, setContractInfo] = React.useState<IContractInfo | null>(null);
  const [deliverables, setDeliverables] = React.useState<IDeliverable[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!projectCode) {
      setLoading(false);
      return;
    }

    Promise.all([
      dataService.getContractInfo(projectCode),
      dataService.getDeliverables(projectCode),
    ])
      .then(([contract, delivs]) => {
        setContractInfo(contract);
        setDeliverables(delivs);
      })
      .catch(() => {
        setContractInfo(null);
        setDeliverables([]);
      })
      .finally(() => setLoading(false));
  }, [dataService, projectCode]);

  if (!projectCode) {
    return (
      <div>
        <PageHeader title="Pay Application Process" />
        <HbcEmptyState
          title="No Project Selected"
          description="Select a project to continue."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Pay Application Process" />
        <HbcSkeleton variant="card" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader title="Pay Application Process" subtitle={selectedProject?.projectName} />

      {contractInfo && (
        <HbcCard title="Contract Summary">
          <div className={styles.contractSummary}>
            <div>
              <div className={styles.summaryLabel}>Contract Type</div>
              <div className={styles.summaryValue}>{contractInfo.contractType || 'N/A'}</div>
            </div>
            <div>
              <div className={styles.summaryLabel}>Contract Value</div>
              <div className={styles.summaryValue}>
                {contractInfo.contractValue ? `$${contractInfo.contractValue.toLocaleString()}` : 'N/A'}
              </div>
            </div>
            <div>
              <div className={styles.summaryLabel}>Status</div>
              <div className={styles.summaryValue}>{contractInfo.contractStatus}</div>
            </div>
            <div>
              <div className={styles.summaryLabel}>Execution Date</div>
              <div className={styles.summaryValue}>{contractInfo.executionDate || 'N/A'}</div>
            </div>
          </div>
        </HbcCard>
      )}

      <HbcDataTable
        tableId="pay-app-deliverables"
        columns={DELIVERABLE_COLUMNS}
        items={deliverables}
        keyExtractor={item => item.id}
        emptyTitle="No Deliverables"
        emptyDescription="No deliverables found for this project."
        ariaLabel="Pay application deliverables"
      />
    </div>
  );
};

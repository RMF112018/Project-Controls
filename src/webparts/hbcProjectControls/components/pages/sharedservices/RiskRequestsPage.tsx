import * as React from 'react';
import { makeStyles, shorthands } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
});

export const RiskRequestsPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <PageHeader title="Risk Management Requests" subtitle="COI requests, subcontractor enrollment, and license renewals." />
      <HbcCard title="Request Queue">
        <HbcEmptyState
          title="No Pending Requests"
          description="Certificate of insurance requests and subcontractor enrollment forms will appear here."
        />
      </HbcCard>
    </div>
  );
};

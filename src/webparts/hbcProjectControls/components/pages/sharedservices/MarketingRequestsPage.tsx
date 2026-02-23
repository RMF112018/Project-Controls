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

export const MarketingRequestsPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <PageHeader title="Marketing Requests" subtitle="Submit and track marketing service requests." />
      <HbcCard title="Request Queue">
        <HbcEmptyState
          title="No Active Requests"
          description="Marketing requests will appear here once the request workflow is configured."
        />
      </HbcCard>
    </div>
  );
};

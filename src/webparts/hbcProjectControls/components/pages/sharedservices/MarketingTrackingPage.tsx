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

export const MarketingTrackingPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <PageHeader title="Campaign Tracking" subtitle="Track campaign performance and marketing projects." />
      <HbcCard title="Active Campaigns">
        <HbcEmptyState
          title="No Campaigns"
          description="Campaign tracking data will be populated from the marketing project records."
        />
      </HbcCard>
    </div>
  );
};

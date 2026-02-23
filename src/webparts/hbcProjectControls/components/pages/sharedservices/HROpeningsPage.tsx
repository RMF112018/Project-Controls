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

export const HROpeningsPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <PageHeader title="Job Openings" subtitle="Current openings and recruitment pipeline." />
      <HbcCard title="Open Positions">
        <HbcEmptyState
          title="No Open Positions"
          description="Job openings will appear here once connected to the HR system."
        />
      </HbcCard>
    </div>
  );
};

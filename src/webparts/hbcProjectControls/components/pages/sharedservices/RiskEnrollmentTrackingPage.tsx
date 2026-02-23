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

export const RiskEnrollmentTrackingPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <PageHeader title="Enrollment Tracking" subtitle="Subcontractor insurance enrollment and compliance status." />
      <HbcCard title="Enrollment Status">
        <HbcEmptyState
          title="No Enrollment Data"
          description="Subcontractor enrollment tracking will be populated from the risk management system."
        />
      </HbcCard>
    </div>
  );
};

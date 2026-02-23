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

export const HRAnnouncementsPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <PageHeader title="Announcements" subtitle="Birthdays, anniversaries, promotions, and company news." />
      <HbcCard title="Company Announcements">
        <HbcEmptyState
          title="No Announcements"
          description="Team announcements, birthdays, and milestones will be displayed here."
        />
      </HbcCard>
    </div>
  );
};

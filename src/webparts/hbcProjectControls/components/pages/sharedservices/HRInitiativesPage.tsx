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

export const HRInitiativesPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <PageHeader title="HR Initiatives" subtitle="Active programs, training initiatives, and wellness." />
      <HbcCard title="Active Initiatives">
        <HbcEmptyState
          title="No Active Initiatives"
          description="HR initiatives and programs will appear here once configured."
        />
      </HbcCard>
    </div>
  );
};

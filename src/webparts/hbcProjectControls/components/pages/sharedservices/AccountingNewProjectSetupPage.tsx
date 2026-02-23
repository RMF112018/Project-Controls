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

export const AccountingNewProjectSetupPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <PageHeader title="New Project Setup" subtitle="Configure project financial setup and cost codes." />
      <HbcCard title="Project Setup Queue">
        <HbcEmptyState
          title="No Pending Setups"
          description="New project financial setups will appear here when job numbers are requested."
        />
      </HbcCard>
    </div>
  );
};

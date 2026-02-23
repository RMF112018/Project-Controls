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

export const HRDocumentsPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <PageHeader title="HR Documents" subtitle="Policies, handbooks, and HR forms." />
      <HbcCard title="Document Library">
        <HbcEmptyState
          title="Connect Document Library"
          description="Configure the SharePoint document library connection to view HR documents."
        />
      </HbcCard>
    </div>
  );
};

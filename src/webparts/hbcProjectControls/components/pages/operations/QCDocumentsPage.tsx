import * as React from 'react';
import { makeStyles, shorthands } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcEmptyState } from '../../shared/HbcEmptyState';

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
});

export const QCDocumentsPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <PageHeader title="Documents" />
      <HbcEmptyState
        title="No Document Library Configured"
        description="Contact your administrator to configure the SharePoint document library connection for this workspace."
      />
    </div>
  );
};

import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { HbcEmptyState } from '../../shared/HbcEmptyState';

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  description: {
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    color: tokens.colorNeutralForeground3,
  },
});

export const CommercialDocumentsPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <PageHeader title="Documents" />
      <HbcCard title="Document Library Integration">
        <span className={styles.description}>
          Document library integration connects to your SharePoint document libraries.
        </span>
      </HbcCard>
      <HbcEmptyState
        title="No Document Library Configured"
        description="Contact your administrator to configure the SharePoint document library connection for this workspace."
      />
    </div>
  );
};

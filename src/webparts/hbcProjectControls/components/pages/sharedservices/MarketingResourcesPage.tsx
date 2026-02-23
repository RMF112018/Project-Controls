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

export const MarketingResourcesPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <PageHeader title="Marketing Resources" subtitle="Brand assets, templates, and collateral." />
      <HbcCard title="Resource Library">
        <HbcEmptyState
          title="Coming Soon"
          description="Marketing resource library will be connected to the SharePoint document library."
        />
      </HbcCard>
    </div>
  );
};

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

export const RiskKnowledgeCenterPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <PageHeader title="Knowledge Center" subtitle="Insurance policies, coverage guides, and compliance resources." />
      <HbcCard title="Insurance Knowledge Base">
        <HbcEmptyState
          title="Coming Soon"
          description="Insurance policy guides, coverage FAQs, and compliance resources will be available here."
        />
      </HbcCard>
    </div>
  );
};

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

export const AccountingReceivablesPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <PageHeader title="Accounts Receivable Report" subtitle="Aging report, invoice tracking, and collection status." />
      <HbcCard title="Receivables Overview">
        <HbcEmptyState
          title="No Data Available"
          description="Accounts receivable data will be populated from the financial system integration."
        />
      </HbcCard>
    </div>
  );
};

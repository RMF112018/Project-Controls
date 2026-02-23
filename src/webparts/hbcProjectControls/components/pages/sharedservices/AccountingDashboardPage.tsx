import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { useAppNavigate } from '../../hooks/router/useAppNavigate';
const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    ...shorthands.gap('16px'),
    ...shorthands.padding('16px', '0'),
  },
  tileDescription: {
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    color: tokens.colorNeutralForeground3,
  },
});

const SUB_PAGES = [
  {
    label: 'New Project Setup',
    description: 'Configure new project financial setup and cost codes.',
    path: '/shared-services/accounting/new-project',
  },
  {
    label: 'Accounts Receivable Report',
    description: 'Aging report, invoice tracking, and collection status.',
    path: '/shared-services/accounting/receivables',
  },
  {
    label: 'Documents',
    description: 'Accounting policies, procedures, and financial documents.',
    path: '/shared-services/accounting/documents',
  },
];

export const AccountingDashboardPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useAppNavigate();

  return (
    <div>
      <PageHeader title="Accounting" subtitle="Project financial setup, receivables, and accounting documents." />
      <div className={styles.grid}>
        {SUB_PAGES.map(page => (
          <HbcCard
            key={page.path}
            title={page.label}
            interactive
            onClick={() => navigate(page.path)}
          >
            <span className={styles.tileDescription}>{page.description}</span>
          </HbcCard>
        ))}
      </div>
    </div>
  );
};

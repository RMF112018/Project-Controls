// Stage 3 (sub-tasks 5+6): Polished with KPI cards and TanStack Query.
import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { useQuery } from '@tanstack/react-query';
import {
  Receipt24Regular,
  Clock24Regular,
  DocumentAdd24Regular,
} from '@fluentui/react-icons';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcCard } from '../../shared/HbcCard';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { useAppNavigate } from '../../hooks/router/useAppNavigate';

const useStyles = makeStyles({
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    ...shorthands.gap('16px'),
    ...shorthands.padding('16px', '0'),
  },
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

// Stage 3 (sub-task 6): TanStack Query for KPI data with mock static values.
const ACCOUNTING_KPIS = {
  openInvoices: 42,
  arAging90: '$1.2M',
  pendingSetup: 7,
};

export const AccountingDashboardPage: React.FC = React.memo(() => {
  const styles = useStyles();
  const navigate = useAppNavigate();

  const { data: kpis, isLoading } = useQuery({
    queryKey: ['dashboard', 'accounting', 'kpis'],
    queryFn: () => Promise.resolve(ACCOUNTING_KPIS),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div>
      <PageHeader title="Accounting" subtitle="Project financial setup, receivables, and accounting documents." />
      {isLoading ? (
        <HbcSkeleton variant="kpi-grid" columns={3} />
      ) : (
        <div className={styles.kpiGrid}>
          <KPICard
            title="Open Invoices"
            value={kpis?.openInvoices ?? 0}
            subtitle="Across all projects"
            icon={<Receipt24Regular />}
          />
          <KPICard
            title="AR Aging 90+"
            value={kpis?.arAging90 ?? '$0'}
            subtitle="Past 90 days"
            icon={<Clock24Regular />}
            trend={{ value: -8.3, isPositive: true }}
          />
          <KPICard
            title="New Projects Pending"
            value={kpis?.pendingSetup ?? 0}
            subtitle="Awaiting setup"
            icon={<DocumentAdd24Regular />}
          />
        </div>
      )}
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
});
AccountingDashboardPage.displayName = 'AccountingDashboardPage';

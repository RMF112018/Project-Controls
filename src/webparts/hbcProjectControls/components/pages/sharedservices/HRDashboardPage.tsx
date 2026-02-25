// Stage 3 (sub-tasks 5+6): Polished with KPI cards and TanStack Query.
import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { useQuery } from '@tanstack/react-query';
import {
  PersonAvailable24Regular,
  CalendarStar24Regular,
  Lightbulb24Regular,
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
    label: 'Openings',
    description: 'Current job openings and recruitment pipeline.',
    path: '/shared-services/hr/openings',
  },
  {
    label: 'Announcements',
    description: 'Birthdays, anniversaries, promotions, and company news.',
    path: '/shared-services/hr/announcements',
  },
  {
    label: 'Initiatives',
    description: 'Active HR programs, training initiatives, and wellness.',
    path: '/shared-services/hr/initiatives',
  },
  {
    label: 'Documents',
    description: 'HR policies, handbooks, and forms.',
    path: '/shared-services/hr/documents',
  },
];

// Stage 3 (sub-task 6): TanStack Query for KPI data with mock static values.
const HR_KPIS = {
  activeOpenings: 12,
  upcomingAnniversaries: 8,
  activeInitiatives: 5,
};

export const HRDashboardPage: React.FC = React.memo(() => {
  const styles = useStyles();
  const navigate = useAppNavigate();

  const { data: kpis, isLoading } = useQuery({
    queryKey: ['dashboard', 'hr', 'kpis'],
    queryFn: () => Promise.resolve(HR_KPIS),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div>
      <PageHeader title="People & Culture" subtitle="Human resources, openings, and company culture." />
      {isLoading ? (
        <HbcSkeleton variant="kpi-grid" columns={3} />
      ) : (
        <div className={styles.kpiGrid}>
          <KPICard
            title="Active Openings"
            value={kpis?.activeOpenings ?? 0}
            subtitle="Across all departments"
            icon={<PersonAvailable24Regular />}
            trend={{ value: 3, isPositive: true }}
          />
          <KPICard
            title="Upcoming Anniversaries"
            value={kpis?.upcomingAnniversaries ?? 0}
            subtitle="Next 30 days"
            icon={<CalendarStar24Regular />}
          />
          <KPICard
            title="Active Initiatives"
            value={kpis?.activeInitiatives ?? 0}
            subtitle="Training & wellness"
            icon={<Lightbulb24Regular />}
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
HRDashboardPage.displayName = 'HRDashboardPage';

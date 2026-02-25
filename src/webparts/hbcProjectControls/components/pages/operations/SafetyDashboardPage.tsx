// Stage 3 (sub-tasks 5+6): Polished with Quick Actions and TanStack Query.
import * as React from 'react';
import { makeStyles, shorthands, tokens, Button } from '@fluentui/react-components';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldError24Regular,
  CalendarSearchRegular,
  Certificate24Regular,
} from '@fluentui/react-icons';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcCard } from '../../shared/HbcCard';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { useAppContext } from '../../contexts/AppContext';
import { useAppNavigate } from '../../hooks/router/useAppNavigate';

const useStyles = makeStyles({
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    ...shorthands.gap('16px'),
    ...shorthands.padding('16px', '0'),
  },
  quickActions: {
    display: 'flex',
    ...shorthands.gap('12px'),
    ...shorthands.padding('0', '0', '16px'),
    flexWrap: 'wrap',
  },
  sectionLabel: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    ...shorthands.padding('8px', '0', '4px'),
  },
  tileGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    ...shorthands.gap('16px'),
    ...shorthands.padding('8px', '0'),
  },
  tileDescription: {
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    color: tokens.colorNeutralForeground3,
  },
});

const TILES = [
  {
    label: 'Training & Certification',
    description: 'Safety training programs and certification management.',
    path: '/operations/safety/training',
  },
  {
    label: 'Safety Scorecard',
    description: 'Safety performance metrics and trending.',
    path: '/operations/safety/scorecard',
  },
  {
    label: 'Resources',
    description: 'Tool-Box Talks, safety updates, and reference materials.',
    path: '/operations/safety/resources',
  },
  {
    label: 'Documents',
    description: 'Safety documentation and compliance records.',
    path: '/operations/safety/documents',
  },
];

export const SafetyDashboardPage: React.FC = React.memo(() => {
  const styles = useStyles();
  const { dataService, selectedProject } = useAppContext();
  const navigate = useAppNavigate();
  const projectCode = selectedProject?.projectCode;

  // Stage 3 (sub-task 6): Replaced manual useEffect/useState with TanStack Query.
  const { data: concerns = [], isLoading: loading } = useQuery({
    queryKey: ['dashboard', 'safety', 'concerns', projectCode],
    queryFn: () => dataService.getSafetyConcerns(projectCode!),
    enabled: !!projectCode,
    staleTime: 5 * 60 * 1000,
  });

  const openCount = concerns.filter(c => c.status === 'Open' || c.status === 'Monitoring').length;
  const resolvedCount = concerns.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
  const totalCount = concerns.length;
  const hasProject = !!projectCode;

  return (
    <div>
      <PageHeader title="Safety Dashboard" />
      {hasProject && (
        loading ? (
          <HbcSkeleton variant="kpi-grid" columns={3} />
        ) : (
          <div className={styles.kpiGrid}>
            <KPICard title="Open Concerns" value={openCount} />
            <KPICard title="Resolved Concerns" value={resolvedCount} />
            <KPICard title="Total Concerns" value={totalCount} />
          </div>
        )
      )}
      <div className={styles.sectionLabel}>Quick Actions</div>
      <div className={styles.quickActions}>
        <Button
          appearance="primary"
          icon={<ShieldError24Regular />}
          onClick={() => navigate('/operations/safety/resources')}
        >
          Report Concern
        </Button>
        <Button
          appearance="outline"
          icon={<CalendarSearchRegular />}
          onClick={() => navigate('/operations/safety/scorecard')}
        >
          Schedule Inspection
        </Button>
        <Button
          appearance="outline"
          icon={<Certificate24Regular />}
          onClick={() => navigate('/operations/safety/training')}
        >
          View Certifications
        </Button>
      </div>
      <div className={styles.tileGrid}>
        {TILES.map(tile => (
          <HbcCard
            key={tile.path}
            title={tile.label}
            interactive
            onClick={() => navigate(tile.path)}
          >
            <span className={styles.tileDescription}>{tile.description}</span>
          </HbcCard>
        ))}
      </div>
    </div>
  );
});
SafetyDashboardPage.displayName = 'SafetyDashboardPage';

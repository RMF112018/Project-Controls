import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcCard } from '../../shared/HbcCard';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { useAppContext } from '../../contexts/AppContext';
import { useAppNavigate } from '../../hooks/router/useAppNavigate';
import type { ISafetyConcern } from '@hbc/sp-services';

const useStyles = makeStyles({
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    ...shorthands.gap('16px'),
    ...shorthands.padding('16px', '0'),
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

export const SafetyDashboardPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, selectedProject } = useAppContext();
  const navigate = useAppNavigate();
  const [concerns, setConcerns] = React.useState<ISafetyConcern[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!selectedProject?.projectCode) {
      setConcerns([]);
      return;
    }
    setLoading(true);
    dataService
      .getSafetyConcerns(selectedProject.projectCode)
      .then(result => setConcerns(result))
      .catch(() => setConcerns([]))
      .finally(() => setLoading(false));
  }, [dataService, selectedProject?.projectCode]);

  const openCount = concerns.filter(c => c.status === 'Open' || c.status === 'Monitoring').length;
  const resolvedCount = concerns.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
  const totalCount = concerns.length;
  const hasProject = !!selectedProject?.projectCode;

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
};

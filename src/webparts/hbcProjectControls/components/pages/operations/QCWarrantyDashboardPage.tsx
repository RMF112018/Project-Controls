import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcCard } from '../../shared/HbcCard';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { useAppContext } from '../../contexts/AppContext';
import { useAppNavigate } from '../../hooks/router/useAppNavigate';
import type { IQualityConcern } from '@hbc/sp-services';

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
    label: 'Best Practices',
    description: 'Quality best practices library and standards.',
    path: '/operations/qc/best-practices',
  },
  {
    label: 'QA Tracking',
    description: 'Quality assurance concern tracking and resolution.',
    path: '/operations/qc/tracking',
  },
  {
    label: 'QC Checklists',
    description: 'Quality control inspection checklists.',
    path: '/operations/qc/checklists',
  },
  {
    label: 'Warranty',
    description: 'Warranty guides, tracking, and client portal.',
    path: '/operations/qc/warranty',
  },
  {
    label: 'Documents',
    description: 'Quality control documentation and records.',
    path: '/operations/qc/documents',
  },
];

export const QCWarrantyDashboardPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, selectedProject } = useAppContext();
  const navigate = useAppNavigate();
  const [concerns, setConcerns] = React.useState<IQualityConcern[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!selectedProject?.projectCode) {
      setConcerns([]);
      return;
    }
    setLoading(true);
    dataService
      .getQualityConcerns(selectedProject.projectCode)
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
      <PageHeader title="Quality Control & Warranty" />
      {hasProject && (
        loading ? (
          <HbcSkeleton variant="kpi-grid" columns={3} />
        ) : (
          <div className={styles.kpiGrid}>
            <KPICard title="Open Concerns" value={openCount} />
            <KPICard title="Resolved" value={resolvedCount} />
            <KPICard title="Total" value={totalCount} />
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

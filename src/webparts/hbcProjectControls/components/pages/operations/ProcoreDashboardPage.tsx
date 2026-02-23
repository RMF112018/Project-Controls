import * as React from 'react';
import { makeStyles, shorthands, tokens, Badge } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcCard } from '../../shared/HbcCard';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { useAppContext } from '../../contexts/AppContext';
import { useAppNavigate } from '../../hooks/router/useAppNavigate';
import type { IProcoreProject, IProcoreConflict } from '@hbc/sp-services';

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
  projectList: {
    ...shorthands.padding('16px', '0'),
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.margin('0', '0', '12px'),
  },
  projectGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    ...shorthands.gap('12px'),
  },
  projectRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  projectLabel: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
  },
  projectValue: {
    fontSize: '13px',
    fontWeight: tokens.fontWeightSemibold,
  },
});

const TILES = [
  {
    label: 'RFIs',
    description: 'Review and manage synced RFIs from Procore.',
    path: '/operations/procore/rfis',
  },
  {
    label: 'Budget',
    description: 'Budget line items, commitments, and projected costs.',
    path: '/operations/procore/budget',
  },
  {
    label: 'Sync Conflicts',
    description: 'Resolve data conflicts between Procore and HBC.',
    path: '/operations/procore/conflicts',
  },
];

export const ProcoreDashboardPage: React.FC = () => {
  const styles = useStyles();
  const { dataService } = useAppContext();
  const navigate = useAppNavigate();
  const [projects, setProjects] = React.useState<IProcoreProject[]>([]);
  const [conflicts, setConflicts] = React.useState<IProcoreConflict[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([dataService.getProcoreProjects(), dataService.getProcoreConflicts('')])
      .then(([p, c]) => {
        setProjects(p);
        setConflicts(c);
      })
      .catch(() => {
        setProjects([]);
        setConflicts([]);
      })
      .finally(() => setLoading(false));
  }, [dataService]);

  const activeProjects = projects.filter(p => p.status === 'Active').length;
  const unresolvedConflicts = conflicts.filter(c => !c.resolution || c.resolution === 'pending').length;

  return (
    <div>
      <PageHeader title="Procore Integration" subtitle="Bidirectional sync with Procore for projects, RFIs, submittals, and budget." />
      {loading ? (
        <HbcSkeleton variant="kpi-grid" columns={4} />
      ) : (
        <div className={styles.kpiGrid}>
          <KPICard title="Synced Projects" value={projects.length} />
          <KPICard title="Active Projects" value={activeProjects} />
          <KPICard title="Unresolved Conflicts" value={unresolvedConflicts} />
        </div>
      )}
      <div className={styles.tileGrid}>
        {TILES.map(tile => (
          <HbcCard key={tile.path} title={tile.label} interactive onClick={() => navigate(tile.path)}>
            <span className={styles.tileDescription}>{tile.description}</span>
          </HbcCard>
        ))}
      </div>
      {!loading && projects.length > 0 && (
        <div className={styles.projectList}>
          <h3 className={styles.sectionTitle}>Synced Projects</h3>
          <div className={styles.projectGrid}>
            {projects.map(project => (
              <HbcCard key={project.id} title={project.name}>
                <div className={styles.projectRow}>
                  <span className={styles.projectLabel}>Status</span>
                  <Badge appearance="filled" color={project.status === 'Active' ? 'success' : 'informative'}>
                    {project.status}
                  </Badge>
                </div>
                <div className={styles.projectRow}>
                  <span className={styles.projectLabel}>PM</span>
                  <span className={styles.projectValue}>{project.projectManager}</span>
                </div>
                <div className={styles.projectRow}>
                  <span className={styles.projectLabel}>Client</span>
                  <span className={styles.projectValue}>{project.client}</span>
                </div>
              </HbcCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import * as React from 'react';
import { makeStyles, shorthands, tokens, MessageBar, MessageBarBody } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { StatusBadge } from '../../shared/StatusBadge';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS } from '../../../theme/tokens';
import type { IActiveProject, ProjectStatus } from '@hbc/sp-services';

const STATUS_BADGE_CONFIG: Record<ProjectStatus, { color: string; backgroundColor: string }> = {
  'Precon': { color: '#fff', backgroundColor: HBC_COLORS.info },
  'Construction': { color: '#fff', backgroundColor: HBC_COLORS.success },
  'Final Payment': { color: '#fff', backgroundColor: HBC_COLORS.warning },
};

const useStyles = makeStyles({
  infoBanner: {
    ...shorthands.margin('0', '0', '16px'),
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    ...shorthands.gap('16px'),
    ...shorthands.padding('16px', '0'),
  },
  tableContainer: {
    ...shorthands.padding('8px', '0'),
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600 as const,
    color: tokens.colorNeutralForeground1,
    ...shorthands.margin('24px', '0', '12px'),
  },
});

export const LuxuryResidentialPage: React.FC = () => {
  const styles = useStyles();
  const { dataService } = useAppContext();
  const [projects, setProjects] = React.useState<IActiveProject[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    dataService.getActiveProjects()
      .then(result => {
        const luxuryProjects = result.filter(p => p.sector === 'Residential');
        setProjects(luxuryProjects);
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [dataService]);

  const activeCount = projects.filter(p => p.status === 'Construction').length;
  const totalProjects = projects.length;

  const columns = React.useMemo((): IHbcDataTableColumn<IActiveProject>[] => [
    { key: 'projectCode', header: 'Project Code', render: (row) => row.projectCode || '\u2014' },
    { key: 'projectName', header: 'Title', render: (row) => row.projectName || '\u2014' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const cfg = STATUS_BADGE_CONFIG[row.status] || { color: '#fff', backgroundColor: HBC_COLORS.gray400 };
        return <StatusBadge label={row.status} color={cfg.color} backgroundColor={cfg.backgroundColor} />;
      },
    },
    { key: 'sector', header: 'Division', render: (row) => row.sector || '\u2014' },
    { key: 'pm', header: 'PM', render: (row) => row.personnel.leadPM || '\u2014' },
  ], []);

  return (
    <div>
      <PageHeader title="Luxury Residential Operations" subtitle="Luxury Residential division project tracking and oversight." />
      <MessageBar intent="info" className={styles.infoBanner}>
        <MessageBarBody>Showing Luxury Residential division projects only.</MessageBarBody>
      </MessageBar>
      {loading ? (
        <>
          <HbcSkeleton variant="kpi-grid" columns={4} />
          <HbcSkeleton variant="table" rows={5} />
        </>
      ) : (
        <>
          <div className={styles.kpiGrid}>
            <KPICard title="Active Projects" value={activeCount} subtitle="Currently in construction" />
            <KPICard title="Open Buyouts" value={totalProjects} subtitle="Across luxury projects" />
            <KPICard title="Pending Permits" value={totalProjects} subtitle="Awaiting approval" />
            <KPICard title="Active Constraints" value={totalProjects} subtitle="Tracked constraints" />
          </div>
          <h2 className={styles.sectionTitle}>Luxury Residential Projects</h2>
          <div className={styles.tableContainer}>
            <HbcDataTable
              tableId="luxury-residential-projects"
              columns={columns}
              items={projects}
              isLoading={loading}
              keyExtractor={(row) => String(row.id)}
              ariaLabel="Luxury residential projects table"
            />
          </div>
        </>
      )}
    </div>
  );
};

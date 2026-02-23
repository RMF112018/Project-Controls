import * as React from 'react';
import { makeStyles, shorthands } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { StatusBadge } from '../../shared/StatusBadge';
import { HbcButton } from '../../shared/HbcButton';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { useAppContext } from '../../contexts/AppContext';
import { useAppNavigate } from '../../hooks/router/useAppNavigate';
import type { IQualityConcern } from '@hbc/sp-services';
import { HBC_COLORS } from '../../../theme/tokens';

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    ...shorthands.gap('16px'),
  },
  linkRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    ...shorthands.padding('8px', '0'),
  },
});

function getConcernStatusBadge(status: string): React.ReactNode {
  switch (status) {
    case 'Resolved':
    case 'Closed':
      return <StatusBadge label={status} color={HBC_COLORS.success} backgroundColor={HBC_COLORS.successLight} />;
    case 'Monitoring':
      return <StatusBadge label="Monitoring" color={HBC_COLORS.warning} backgroundColor={HBC_COLORS.warningLight} />;
    case 'Open':
      return <StatusBadge label="Open" color={HBC_COLORS.error} backgroundColor={HBC_COLORS.errorLight} />;
    default:
      return <StatusBadge label={status} color={HBC_COLORS.gray500} backgroundColor={HBC_COLORS.gray100} />;
  }
}

const CONCERN_COLUMNS: IHbcDataTableColumn<IQualityConcern>[] = [
  { key: 'description', header: 'Description', render: item => item.description },
  { key: 'letter', header: 'Category', render: item => item.letter },
  { key: 'status', header: 'Status', render: item => getConcernStatusBadge(item.status) },
  { key: 'raisedDate', header: 'Date Reported', render: item => item.raisedDate },
  { key: 'resolvedDate', header: 'Resolved Date', render: item => item.resolvedDate || '-' },
];

export const QAQCProgramPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, selectedProject } = useAppContext();
  const projectCode = selectedProject?.projectCode || '';
  const navigate = useAppNavigate();

  const [concerns, setConcerns] = React.useState<IQualityConcern[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!projectCode) {
      setLoading(false);
      return;
    }

    dataService.getQualityConcerns(projectCode)
      .then(result => setConcerns(result))
      .catch(() => setConcerns([]))
      .finally(() => setLoading(false));
  }, [dataService, projectCode]);

  if (!projectCode) {
    return (
      <div>
        <PageHeader title="QA/QC Program" />
        <HbcEmptyState
          title="No Project Selected"
          description="Select a project to continue."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="QA/QC Program" />
        <HbcSkeleton variant="kpi-grid" columns={2} />
      </div>
    );
  }

  const openCount = concerns.filter(c => c.status === 'Open' || c.status === 'Monitoring').length;
  const resolvedCount = concerns.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

  return (
    <div className={styles.container}>
      <PageHeader title="QA/QC Program" subtitle={selectedProject?.projectName} />

      <div className={styles.kpiGrid}>
        <KPICard title="Open Concerns" value={openCount} />
        <KPICard title="Resolved Concerns" value={resolvedCount} />
      </div>

      <HbcDataTable
        tableId="qaqc-concerns"
        columns={CONCERN_COLUMNS}
        items={concerns}
        keyExtractor={item => item.id}
        emptyTitle="No Quality Concerns"
        emptyDescription="No quality concerns recorded for this project."
        ariaLabel="Quality concerns"
      />

      <div className={styles.linkRow}>
        <HbcButton emphasis="subtle" onClick={() => navigate('/operations/qc')}>
          View Full QC Workspace
        </HbcButton>
      </div>
    </div>
  );
};

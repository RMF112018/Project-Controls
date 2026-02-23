import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { StatusBadge } from '../../shared/StatusBadge';
import { useAppContext } from '../../contexts/AppContext';
import type { IQualityConcern, QualityConcernStatus } from '@hbc/sp-services';

const useStyles = makeStyles({
  tableContainer: {
    ...shorthands.padding('8px', '0'),
  },
  noProject: {
    ...shorthands.padding('48px'),
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
});

const STATUS_MAP: Record<QualityConcernStatus, { label: string; color: string; backgroundColor: string }> = {
  Open: { label: 'Open', color: tokens.colorStatusDangerForeground2, backgroundColor: tokens.colorStatusDangerBackground2 },
  Monitoring: { label: 'Monitoring', color: tokens.colorStatusWarningForeground2, backgroundColor: tokens.colorStatusWarningBackground2 },
  Resolved: { label: 'Resolved', color: tokens.colorStatusSuccessForeground2, backgroundColor: tokens.colorStatusSuccessBackground2 },
  Closed: { label: 'Closed', color: tokens.colorNeutralForeground2, backgroundColor: tokens.colorNeutralBackground3 },
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) return '\u2014';
  try {
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '\u2014';
  }
};

export const QATrackingPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, selectedProject } = useAppContext();
  const projectCode = selectedProject?.projectCode || '';
  const [concerns, setConcerns] = React.useState<IQualityConcern[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!projectCode) {
      setConcerns([]);
      return;
    }
    setLoading(true);
    dataService
      .getQualityConcerns(projectCode)
      .then(result => setConcerns(result))
      .catch(() => setConcerns([]))
      .finally(() => setLoading(false));
  }, [dataService, projectCode]);

  const columns = React.useMemo((): IHbcDataTableColumn<IQualityConcern>[] => [
    {
      key: 'description',
      header: 'Description',
      render: (row) => row.description || '\u2014',
    },
    {
      key: 'letter',
      header: 'Category',
      render: (row) => row.letter || '\u2014',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const badge = STATUS_MAP[row.status] || STATUS_MAP.Open;
        return <StatusBadge label={badge.label} color={badge.color} backgroundColor={badge.backgroundColor} />;
      },
    },
    {
      key: 'raisedDate',
      header: 'Date Reported',
      render: (row) => formatDate(row.raisedDate),
    },
    {
      key: 'resolvedDate',
      header: 'Resolved Date',
      render: (row) => formatDate(row.resolvedDate),
    },
    {
      key: 'raisedBy',
      header: 'Assigned To',
      render: (row) => row.raisedBy || '\u2014',
    },
  ], []);

  if (!projectCode) {
    return (
      <div>
        <PageHeader title="QA Tracking" />
        <div className={styles.noProject}>Select a project to view quality concerns.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="QA Tracking" />
        <HbcSkeleton variant="table" rows={5} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="QA Tracking" />
      <div className={styles.tableContainer}>
        <HbcDataTable<IQualityConcern>
          tableId="qa-tracking-concerns"
          columns={columns}
          items={concerns}
          isLoading={loading}
          keyExtractor={(row) => String(row.id)}
          emptyTitle="No Quality Concerns"
          emptyDescription="No quality concerns have been recorded for this project."
          ariaLabel="Quality concerns tracking table"
        />
      </div>
    </div>
  );
};

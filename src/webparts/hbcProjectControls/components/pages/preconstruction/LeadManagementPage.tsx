import * as React from 'react';
import { makeStyles, shorthands } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { useAppContext } from '../../contexts/AppContext';
import { getStageLabel } from '@hbc/sp-services';
import type { ILead } from '@hbc/sp-services';

const useStyles = makeStyles({
  container: {
    ...shorthands.padding('16px', '0'),
  },
});

const columns: IHbcDataTableColumn<ILead>[] = [
  { key: 'Title', header: 'Project Name', render: (row) => row.Title },
  { key: 'ProjectCode', header: 'Code', render: (row) => row.ProjectCode || '—' },
  { key: 'Stage', header: 'Stage', render: (row) => <span>{getStageLabel(row.Stage)}</span> },
  { key: 'Region', header: 'Region', render: (row) => row.Region || '—' },
  { key: 'Division', header: 'Division', render: (row) => row.Division || '—' },
  { key: 'ProjectValue', header: 'Est. Value', render: (row) => row.ProjectValue ? `$${row.ProjectValue.toLocaleString()}` : '—' },
];

export const LeadManagementPage: React.FC = () => {
  const styles = useStyles();
  const { dataService } = useAppContext();
  const [leads, setLeads] = React.useState<ILead[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    dataService.getLeads()
      .then(result => setLeads(result.items))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, [dataService]);

  return (
    <div>
      <PageHeader title="Lead Management" />
      <div className={styles.container}>
        <HbcDataTable
          tableId="precon-lead-management"
          columns={columns}
          items={leads}
          isLoading={loading}
          keyExtractor={(row) => String(row.id)}
        />
      </div>
    </div>
  );
};

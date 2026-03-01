import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../shared/PageHeader';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { useAppContext } from '../../contexts/AppContext';
import { getStageLabel } from '@hbc/sp-services';
import type { ILead } from '@hbc/sp-services';

const useStyles = makeStyles({
  container: {
    ...shorthands.padding(tokens.spacingVerticalM, '0'),
  },
});

const columns: IHbcDataTableColumn<ILead>[] = [
  { key: 'Title', header: 'Project Name', render: (row) => row.Title },
  { key: 'ProjectCode', header: 'Code', render: (row) => row.ProjectCode || '\u2014' },
  { key: 'Stage', header: 'Stage', render: (row) => <span>{getStageLabel(row.Stage)}</span> },
  { key: 'Region', header: 'Region', render: (row) => row.Region || '\u2014' },
  { key: 'Division', header: 'Division', render: (row) => row.Division || '\u2014' },
  { key: 'ProjectValue', header: 'Est. Value', render: (row) => row.ProjectValue ? `$${row.ProjectValue.toLocaleString()}` : '\u2014' },
];

const LeadManagementPageInner: React.FC = () => {
  const styles = useStyles();
  const { dataService } = useAppContext();

  const { data, isLoading } = useQuery({
    queryKey: ['lead-management-leads'],
    queryFn: () => dataService.getLeads(),
    staleTime: 5 * 60_000,
  });

  const leads = data?.items ?? [];

  return (
    <div>
      <PageHeader title="Lead Management" />
      <div className={styles.container}>
        <HbcDataTable
          tableId="precon-lead-management"
          columns={columns}
          items={leads}
          isLoading={isLoading}
          keyExtractor={(row) => String(row.id)}
          ariaLabel="Lead management tracking table"
        />
      </div>
    </div>
  );
};

export const LeadManagementPage = React.memo(LeadManagementPageInner);

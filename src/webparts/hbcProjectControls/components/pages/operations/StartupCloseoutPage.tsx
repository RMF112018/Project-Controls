import * as React from 'react';
import { makeStyles, shorthands } from '@fluentui/react-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../shared/PageHeader';
import { CollapsibleSection } from '../../shared/CollapsibleSection';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { StatusBadge } from '../../shared/StatusBadge';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { useAppContext } from '../../contexts/AppContext';
import type { IStartupChecklistItem, ICloseoutItem } from '@hbc/sp-services';
import { useQueryScope } from '../../../tanstack/query/useQueryScope';
import { closeoutItemsOptions, startupChecklistOptions } from '../../../tanstack/query/queryOptions/operations';
import { qk } from '../../../tanstack/query/queryKeys';
import { HBC_COLORS } from '../../../theme/tokens';

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
});

function getChecklistStatusBadge(status: string): React.ReactNode {
  switch (status) {
    case 'Complete':
    case 'Completed':
      return <StatusBadge label={status} color={HBC_COLORS.success} backgroundColor={HBC_COLORS.successLight} />;
    case 'In Progress':
    case 'InProgress':
      return <StatusBadge label="In Progress" color={HBC_COLORS.info} backgroundColor={HBC_COLORS.infoLight} />;
    case 'NotStarted':
    case 'Not Started':
      return <StatusBadge label="Not Started" color={HBC_COLORS.gray500} backgroundColor={HBC_COLORS.gray100} />;
    case 'NA':
      return <StatusBadge label="N/A" color={HBC_COLORS.gray400} backgroundColor={HBC_COLORS.gray100} />;
    default:
      return <StatusBadge label={status} color={HBC_COLORS.gray500} backgroundColor={HBC_COLORS.gray100} />;
  }
}

const STARTUP_COLUMNS: IHbcDataTableColumn<IStartupChecklistItem>[] = [
  { key: 'label', header: 'Item', render: item => item.label },
  { key: 'sectionName', header: 'Category', render: item => item.sectionName },
  { key: 'status', header: 'Status', render: item => getChecklistStatusBadge(item.status) },
  { key: 'assignedToName', header: 'Assignee', render: item => item.assignedToName || 'Unassigned' },
  { key: 'respondedDate', header: 'Due Date', render: item => item.respondedDate || '-' },
];

const CLOSEOUT_COLUMNS: IHbcDataTableColumn<ICloseoutItem>[] = [
  { key: 'label', header: 'Item', render: item => item.label || item.description },
  { key: 'sectionName', header: 'Category', render: item => item.sectionName || item.category },
  { key: 'status', header: 'Status', render: item => getChecklistStatusBadge(String(item.status)) },
  { key: 'assignedTo', header: 'Assignee', render: item => item.assignedTo || 'Unassigned' },
  { key: 'completedDate', header: 'Due Date', render: item => item.completedDate || '-' },
];

export const StartupCloseoutPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, selectedProject } = useAppContext();
  const scope = useQueryScope();
  const queryClient = useQueryClient();
  const projectCode = selectedProject?.projectCode || '';

  const startupQuery = useQuery(startupChecklistOptions(scope, dataService, projectCode));
  const closeoutQuery = useQuery(closeoutItemsOptions(scope, dataService, projectCode));

  const startupItems = startupQuery.data ?? [];
  const closeoutItems = closeoutQuery.data ?? [];
  const loading = !!projectCode && (startupQuery.isLoading || closeoutQuery.isLoading);

  // Mutation plumbing for upcoming editable startup/closeout UX.
  // The page remains read-only in this change.
  useMutation<IStartupChecklistItem, Error, { itemId: number; data: Partial<IStartupChecklistItem> }, { previous?: IStartupChecklistItem[] }>({
    mutationFn: async ({ itemId, data }) => dataService.updateChecklistItem(projectCode, itemId, data),
    onMutate: async ({ itemId, data }) => {
      const queryKey = qk.startupChecklist.base(scope, projectCode);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<IStartupChecklistItem[]>(queryKey);
      queryClient.setQueryData<IStartupChecklistItem[]>(queryKey, (current = []) => (
        current.map((item) => (item.id === itemId ? { ...item, ...data } : item))
      ));
      return { previous };
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(qk.startupChecklist.base(scope, projectCode), context?.previous);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.startupChecklist.base(scope, projectCode) });
    },
  });

  useMutation<ICloseoutItem, Error, { itemId: number; data: Partial<ICloseoutItem> }, { previous?: ICloseoutItem[] }>({
    mutationFn: async ({ itemId, data }) => dataService.updateCloseoutItem(itemId, data),
    onMutate: async ({ itemId, data }) => {
      const queryKey = qk.closeout.byProject(scope, projectCode);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ICloseoutItem[]>(queryKey);
      queryClient.setQueryData<ICloseoutItem[]>(queryKey, (current = []) => (
        current.map((item) => (item.id === itemId ? { ...item, ...data } : item))
      ));
      return { previous };
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(qk.closeout.byProject(scope, projectCode), context?.previous);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.closeout.byProject(scope, projectCode) });
    },
  });

  if (!projectCode) {
    return (
      <div>
        <PageHeader title="Startup & Closeout" />
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
        <PageHeader title="Startup & Closeout" />
        <HbcSkeleton variant="table" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader title="Startup & Closeout" subtitle={selectedProject?.projectName} />

      <CollapsibleSection
        title="Startup Checklist"
        badge={<StatusBadge label={`${startupItems.length} items`} color={HBC_COLORS.info} backgroundColor={HBC_COLORS.infoLight} />}
      >
        <HbcDataTable
          tableId="startup-checklist"
          columns={STARTUP_COLUMNS}
          items={startupItems}
          keyExtractor={item => item.id}
          emptyTitle="No Startup Items"
          emptyDescription="No startup checklist items found for this project."
          ariaLabel="Startup checklist"
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Closeout Checklist"
        badge={<StatusBadge label={`${closeoutItems.length} items`} color={HBC_COLORS.info} backgroundColor={HBC_COLORS.infoLight} />}
      >
        <HbcDataTable
          tableId="closeout-checklist"
          columns={CLOSEOUT_COLUMNS}
          items={closeoutItems}
          keyExtractor={item => item.id}
          emptyTitle="No Closeout Items"
          emptyDescription="No closeout items found for this project."
          ariaLabel="Closeout checklist"
        />
      </CollapsibleSection>
    </div>
  );
};

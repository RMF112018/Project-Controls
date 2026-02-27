import * as React from 'react';
import { makeStyles, shorthands } from '@fluentui/react-components';
import { Add24Regular, Delete24Regular } from '@fluentui/react-icons';
import { PageHeader } from '../../shared/PageHeader';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { StatusBadge } from '../../shared/StatusBadge';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { HbcButton } from '../../shared/HbcButton';
import { ConfirmDialog } from '../../shared/ConfirmDialog';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { useToast } from '../../shared/ToastContainer';
import { useAppContext } from '../../contexts/AppContext';
import { formatDate, type IConstraintLog } from '@hbc/sp-services';
import { HBC_COLORS } from '../../../theme/tokens';

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  Open: { color: HBC_COLORS.info, bg: HBC_COLORS.infoLight },
  Closed: { color: HBC_COLORS.gray500, bg: HBC_COLORS.gray100 },
};

const PRIORITY_APPEARANCE: Record<string, { color: string; bg: string }> = {
  High: { color: HBC_COLORS.error, bg: HBC_COLORS.errorLight },
  Medium: { color: HBC_COLORS.warning, bg: HBC_COLORS.warningLight },
  Low: { color: HBC_COLORS.success, bg: HBC_COLORS.successLight },
};

const useStyles = makeStyles({
  root: {
    display: 'grid',
    ...shorthands.gap('16px'),
  },
});

/** Derive a priority label from the constraint category for display purposes. */
const derivePriority = (constraint: IConstraintLog): string => {
  if (constraint.budgetImpactCost && constraint.budgetImpactCost > 50000) return 'High';
  if (constraint.budgetImpactCost && constraint.budgetImpactCost > 10000) return 'Medium';
  return 'Low';
};

export const ConstraintsLogPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, selectedProject } = useAppContext();
  const projectCode = selectedProject?.projectCode || '';
  const { addToast } = useToast();

  const [constraints, setConstraints] = React.useState<IConstraintLog[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<IConstraintLog | null>(null);

  const loadConstraints = React.useCallback(async (): Promise<void> => {
    if (!projectCode) return;
    setIsLoading(true);
    try {
      const data = await dataService.getConstraints(projectCode);
      setConstraints(data);
    } catch (err) {
      console.error('Failed to load constraints:', err);
      addToast('Failed to load constraints.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [dataService, projectCode, addToast]);

  React.useEffect(() => {
    loadConstraints().catch(console.error);
  }, [loadConstraints]);

  const handleAdd = React.useCallback(async (): Promise<void> => {
    try {
      await dataService.addConstraint(projectCode, {
        projectCode,
        category: 'Other',
        description: 'New Constraint',
        status: 'Open',
        assignedTo: '',
        dateIdentified: new Date().toISOString(),
        dueDate: new Date().toISOString(),
      });
      addToast('Constraint added.', 'success');
      await loadConstraints();
    } catch (err) {
      console.error('Failed to add constraint:', err);
      addToast('Failed to add constraint.', 'error');
    }
  }, [dataService, projectCode, addToast, loadConstraints]);

  const handleDelete = React.useCallback(async (): Promise<void> => {
    if (!deleteTarget) return;
    try {
      await dataService.removeConstraint(projectCode, deleteTarget.id);
      addToast('Constraint removed.', 'success');
      setDeleteTarget(null);
      await loadConstraints();
    } catch (err) {
      console.error('Failed to remove constraint:', err);
      addToast('Failed to remove constraint.', 'error');
    }
  }, [dataService, projectCode, deleteTarget, addToast, loadConstraints]);

  const columns = React.useMemo<IHbcDataTableColumn<IConstraintLog>[]>(() => [
    {
      key: 'Description',
      header: 'Description',
      render: (row) => row.description,
      sortable: true,
    },
    {
      key: 'Category',
      header: 'Category',
      render: (row) => row.category,
      sortable: true,
    },
    {
      key: 'Priority',
      header: 'Priority',
      render: (row) => {
        const priority = derivePriority(row);
        const colors = PRIORITY_APPEARANCE[priority] || PRIORITY_APPEARANCE.Low;
        return <StatusBadge label={priority} color={colors.color} backgroundColor={colors.bg} />;
      },
    },
    {
      key: 'Status',
      header: 'Status',
      render: (row) => {
        const colors = STATUS_COLORS[row.status] || STATUS_COLORS.Open;
        return <StatusBadge label={row.status} color={colors.color} backgroundColor={colors.bg} />;
      },
    },
    {
      key: 'Owner',
      header: 'Owner',
      render: (row) => row.assignedTo || '\u2014',
    },
    {
      key: 'DueDate',
      header: 'Due Date',
      render: (row) => formatDate(row.dueDate, { dateStyle: 'numeric', placeholder: '\u2014', fallbackOnInvalid: '\u2014' }),
      sortable: true,
    },
  ], []);

  if (!projectCode) {
    return (
      <div className={styles.root}>
        <PageHeader title="Constraints Log" />
        <HbcEmptyState title="No Project Selected" description="Select a project to view the constraints log." />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <PageHeader
        title="Constraints Log"
        subtitle="Track project constraints and resolution status"
        actions={
          <HbcButton emphasis="strong" icon={<Add24Regular />} onClick={handleAdd}>
            Add Constraint
          </HbcButton>
        }
      />

      {isLoading ? (
        <HbcSkeleton variant="table" rows={6} />
      ) : (
        <HbcDataTable<IConstraintLog>
          tableId="constraints-log"
          columns={columns}
          items={constraints}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyTitle="No Constraints"
          emptyDescription="No constraints have been recorded for this project."
          ariaLabel="Constraints log table"
          pageSize={20}
          rowActions={(item) => (
            <HbcButton
              emphasis="subtle"
              icon={<Delete24Regular />}
              iconOnlyLabel="Remove constraint"
              onClick={() => setDeleteTarget(item)}
            />
          )}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Remove Constraint"
        message={`Are you sure you want to remove "${deleteTarget?.description || 'this constraint'}"? This action cannot be undone.`}
        confirmLabel="Remove"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  );
};

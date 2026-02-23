import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
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
import type { IBuyoutEntry } from '@hbc/sp-services';
import { HBC_COLORS } from '../../../theme/tokens';

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  'Not Started': { color: HBC_COLORS.gray500, bg: HBC_COLORS.gray100 },
  'In Progress': { color: HBC_COLORS.info, bg: HBC_COLORS.infoLight },
  'Awarded': { color: HBC_COLORS.success, bg: HBC_COLORS.successLight },
  'Executed': { color: HBC_COLORS.navy, bg: HBC_COLORS.gray200 },
};

const formatCurrency = (value: number | undefined): string => {
  if (value === undefined || value === null) return '--';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString();
};

const useStyles = makeStyles({
  root: {
    display: 'grid',
    ...shorthands.gap('16px'),
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'flex-end',
    ...shorthands.gap('8px'),
  },
});

export const BuyoutLogPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, selectedProject } = useAppContext();
  const projectCode = selectedProject?.projectCode || '';
  const { addToast } = useToast();

  const [entries, setEntries] = React.useState<IBuyoutEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<IBuyoutEntry | null>(null);

  const loadEntries = React.useCallback(async (): Promise<void> => {
    if (!projectCode) return;
    setIsLoading(true);
    try {
      const data = await dataService.getBuyoutEntries(projectCode);
      setEntries(data);
    } catch (err) {
      console.error('Failed to load buyout entries:', err);
      addToast('Failed to load buyout entries.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [dataService, projectCode, addToast]);

  React.useEffect(() => {
    loadEntries().catch(console.error);
  }, [loadEntries]);

  const handleAdd = React.useCallback(async (): Promise<void> => {
    try {
      await dataService.addBuyoutEntry(projectCode, {
        projectCode,
        divisionCode: '',
        divisionDescription: 'New Entry',
        originalBudget: 0,
        estimatedTax: 0,
        totalBudget: 0,
        status: 'Not Started',
      });
      addToast('Buyout entry added.', 'success');
      await loadEntries();
    } catch (err) {
      console.error('Failed to add buyout entry:', err);
      addToast('Failed to add buyout entry.', 'error');
    }
  }, [dataService, projectCode, addToast, loadEntries]);

  const handleDelete = React.useCallback(async (): Promise<void> => {
    if (!deleteTarget) return;
    try {
      await dataService.removeBuyoutEntry(projectCode, deleteTarget.id);
      addToast('Buyout entry removed.', 'success');
      setDeleteTarget(null);
      await loadEntries();
    } catch (err) {
      console.error('Failed to remove buyout entry:', err);
      addToast('Failed to remove buyout entry.', 'error');
    }
  }, [dataService, projectCode, deleteTarget, addToast, loadEntries]);

  const columns = React.useMemo<IHbcDataTableColumn<IBuyoutEntry>[]>(() => [
    {
      key: 'Trade',
      header: 'Trade',
      render: (row) => row.divisionDescription || row.divisionCode,
      sortable: true,
    },
    {
      key: 'Subcontractor',
      header: 'Subcontractor',
      render: (row) => row.subcontractorName || '--',
    },
    {
      key: 'BuyoutAmount',
      header: 'Buyout Amount',
      render: (row) => formatCurrency(row.contractValue ?? row.totalBudget),
      sortable: true,
    },
    {
      key: 'Status',
      header: 'Status',
      render: (row) => {
        const colors = STATUS_COLORS[row.status] || STATUS_COLORS['Not Started'];
        return <StatusBadge label={row.status} color={colors.color} backgroundColor={colors.bg} />;
      },
    },
    {
      key: 'CommitmentDate',
      header: 'Commitment Date',
      render: (row) => formatDate(row.contractExecutedDate || row.loiSentDate),
      sortable: true,
    },
  ], []);

  if (!projectCode) {
    return (
      <div className={styles.root}>
        <PageHeader title="Buyout Log" />
        <HbcEmptyState title="No Project Selected" description="Select a project to view the buyout log." />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <PageHeader
        title="Buyout Log"
        subtitle="Track subcontractor buyout status and commitments"
        actions={
          <HbcButton emphasis="strong" icon={<Add24Regular />} onClick={handleAdd}>
            Add Entry
          </HbcButton>
        }
      />

      {isLoading ? (
        <HbcSkeleton variant="table" rows={6} />
      ) : (
        <HbcDataTable<IBuyoutEntry>
          tableId="buyout-log"
          columns={columns}
          items={entries}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyTitle="No Buyout Entries"
          emptyDescription="No buyout entries have been recorded for this project."
          ariaLabel="Buyout log table"
          pageSize={20}
          rowActions={(item) => (
            <HbcButton
              emphasis="subtle"
              icon={<Delete24Regular />}
              iconOnlyLabel="Remove entry"
              onClick={() => setDeleteTarget(item)}
            />
          )}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Remove Buyout Entry"
        message={`Are you sure you want to remove "${deleteTarget?.divisionDescription || 'this entry'}"? This action cannot be undone.`}
        confirmLabel="Remove"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  );
};

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
import type { IPermit } from '@hbc/sp-services';
import { HBC_COLORS } from '../../../theme/tokens';

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  'Active': { color: HBC_COLORS.success, bg: HBC_COLORS.successLight },
  'Pending Application': { color: HBC_COLORS.warning, bg: HBC_COLORS.warningLight },
  'Pending Revision': { color: HBC_COLORS.warning, bg: HBC_COLORS.warningLight },
  'Inactive': { color: HBC_COLORS.gray500, bg: HBC_COLORS.gray100 },
  'VOID': { color: HBC_COLORS.error, bg: HBC_COLORS.errorLight },
  'Expired': { color: HBC_COLORS.error, bg: HBC_COLORS.errorLight },
  'Closed': { color: HBC_COLORS.gray500, bg: HBC_COLORS.gray200 },
};

const formatDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString();
};

const truncate = (text: string | undefined, maxLen: number): string => {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return `${text.substring(0, maxLen)}...`;
};

const useStyles = makeStyles({
  root: {
    display: 'grid',
    ...shorthands.gap('16px'),
  },
});

export const PermitLogPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, selectedProject } = useAppContext();
  const projectCode = selectedProject?.projectCode || '';
  const { addToast } = useToast();

  const [permits, setPermits] = React.useState<IPermit[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<IPermit | null>(null);

  const loadPermits = React.useCallback(async (): Promise<void> => {
    if (!projectCode) return;
    setIsLoading(true);
    try {
      const data = await dataService.getPermits(projectCode);
      setPermits(data);
    } catch (err) {
      console.error('Failed to load permits:', err);
      addToast('Failed to load permits.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [dataService, projectCode, addToast]);

  React.useEffect(() => {
    loadPermits().catch(console.error);
  }, [loadPermits]);

  const handleAdd = React.useCallback(async (): Promise<void> => {
    try {
      await dataService.addPermit(projectCode, {
        projectCode,
        refNumber: '',
        location: '',
        type: 'PRIMARY',
        permitNumber: '',
        description: 'New Permit',
        responsibleContractor: '',
        address: '',
        status: 'Pending Application',
        ahj: '',
      });
      addToast('Permit added.', 'success');
      await loadPermits();
    } catch (err) {
      console.error('Failed to add permit:', err);
      addToast('Failed to add permit.', 'error');
    }
  }, [dataService, projectCode, addToast, loadPermits]);

  const handleDelete = React.useCallback(async (): Promise<void> => {
    if (!deleteTarget) return;
    try {
      await dataService.removePermit(projectCode, deleteTarget.id);
      addToast('Permit removed.', 'success');
      setDeleteTarget(null);
      await loadPermits();
    } catch (err) {
      console.error('Failed to remove permit:', err);
      addToast('Failed to remove permit.', 'error');
    }
  }, [dataService, projectCode, deleteTarget, addToast, loadPermits]);

  const columns = React.useMemo<IHbcDataTableColumn<IPermit>[]>(() => [
    {
      key: 'PermitType',
      header: 'Permit Type',
      render: (row) => row.type,
      sortable: true,
    },
    {
      key: 'PermitNumber',
      header: 'Number',
      render: (row) => row.permitNumber || '\u2014',
    },
    {
      key: 'Status',
      header: 'Status',
      render: (row) => {
        const colors = STATUS_COLORS[row.status] || STATUS_COLORS['Inactive'];
        return <StatusBadge label={row.status} color={colors.color} backgroundColor={colors.bg} />;
      },
    },
    {
      key: 'IssueDate',
      header: 'Issue Date',
      render: (row) => formatDate(row.dateReceived),
      sortable: true,
    },
    {
      key: 'ExpirationDate',
      header: 'Expiration Date',
      render: (row) => formatDate(row.dateExpires),
      sortable: true,
    },
    {
      key: 'Notes',
      header: 'Notes',
      render: (row) => truncate(row.comments, 50),
      hideOnMobile: true,
    },
  ], []);

  if (!projectCode) {
    return (
      <div className={styles.root}>
        <PageHeader title="Permits Log" />
        <HbcEmptyState title="No Project Selected" description="Select a project to view the permits log." />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <PageHeader
        title="Permits Log"
        subtitle="Track project permits, applications, and expirations"
        actions={
          <HbcButton emphasis="strong" icon={<Add24Regular />} onClick={handleAdd}>
            Add Permit
          </HbcButton>
        }
      />

      {isLoading ? (
        <HbcSkeleton variant="table" rows={6} />
      ) : (
        <HbcDataTable<IPermit>
          tableId="permits-log"
          columns={columns}
          items={permits}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyTitle="No Permits"
          emptyDescription="No permits have been recorded for this project."
          ariaLabel="Permits log table"
          pageSize={20}
          rowActions={(item) => (
            <HbcButton
              emphasis="subtle"
              icon={<Delete24Regular />}
              iconOnlyLabel="Remove permit"
              onClick={() => setDeleteTarget(item)}
            />
          )}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Remove Permit"
        message={`Are you sure you want to remove permit "${deleteTarget?.permitNumber || deleteTarget?.description || 'this permit'}"? This action cannot be undone.`}
        confirmLabel="Remove"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  );
};

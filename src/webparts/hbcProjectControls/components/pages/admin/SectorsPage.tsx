import * as React from 'react';
import { Input, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { HbcField } from '../../shared/HbcField';
import { HbcButton } from '../../shared/HbcButton';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { StatusBadge } from '../../shared/StatusBadge';
import { useAppContext } from '../../contexts/AppContext';
import { useToast } from '../../shared/ToastContainer';
import { AuditAction, EntityType } from '@hbc/sp-services';
import type { ISectorDefinition } from '@hbc/sp-services';

const useStyles = makeStyles({
  container: {
    ...shorthands.padding('16px', '0'),
  },
  addForm: {
    display: 'flex',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    ...shorthands.gap('12px'),
    ...shorthands.padding('0', '0', '16px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke1),
    marginBottom: '16px',
  },
  statusPill: {
    display: 'inline-block',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('12px'),
    fontSize: '12px',
    fontWeight: 500 as const,
  },
});

const EMPTY_FORM = { label: '', code: '', sortOrder: '' };

export const SectorsPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, currentUser } = useAppContext();
  const { addToast } = useToast();

  const [sectors, setSectors] = React.useState<ISectorDefinition[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [adding, setAdding] = React.useState(false);
  const [togglingId, setTogglingId] = React.useState<number | null>(null);
  const [form, setForm] = React.useState(EMPTY_FORM);

  const fetchSectors = React.useCallback(() => {
    setLoading(true);
    dataService.getSectorDefinitions()
      .then(result => setSectors(result))
      .catch(() => setSectors([]))
      .finally(() => setLoading(false));
  }, [dataService]);

  React.useEffect(() => {
    fetchSectors();
  }, [fetchSectors]);

  const handleAdd = React.useCallback(async () => {
    if (!form.label.trim() || !form.code.trim()) {
      addToast('Label and code are required.', 'warning');
      return;
    }

    setAdding(true);
    try {
      await dataService.createSectorDefinition({
        label: form.label.trim(),
        code: form.code.trim().toUpperCase(),
        sortOrder: Number(form.sortOrder) || 0,
        isActive: true,
      });
      await dataService.logAudit({
        Action: AuditAction.ConfigRoleChanged,
        EntityType: EntityType.Config,
        EntityId: form.code.trim().toUpperCase(),
        User: currentUser?.email ?? 'unknown',
        Details: `Sector "${form.label.trim()}" created`,
      });
      addToast(`Sector "${form.label.trim()}" added.`, 'success');
      setForm(EMPTY_FORM);
      fetchSectors();
    } catch {
      addToast('Failed to add sector.', 'error');
    } finally {
      setAdding(false);
    }
  }, [form, dataService, currentUser, addToast, fetchSectors]);

  const handleToggleActive = React.useCallback(async (sector: ISectorDefinition) => {
    setTogglingId(sector.id);
    const nextActive = !sector.isActive;
    try {
      await dataService.updateSectorDefinition(sector.id, { isActive: nextActive });
      await dataService.logAudit({
        Action: AuditAction.ConfigRoleChanged,
        EntityType: EntityType.Config,
        EntityId: String(sector.id),
        User: currentUser?.email ?? 'unknown',
        Details: `Sector "${sector.label}" ${nextActive ? 'activated' : 'deactivated'}`,
      });
      addToast(`Sector "${sector.label}" ${nextActive ? 'activated' : 'deactivated'}.`, 'success');
      fetchSectors();
    } catch {
      addToast('Failed to update sector.', 'error');
    } finally {
      setTogglingId(null);
    }
  }, [dataService, currentUser, addToast, fetchSectors]);

  const columns = React.useMemo((): IHbcDataTableColumn<ISectorDefinition>[] => [
    {
      key: 'sortOrder',
      header: 'Order',
      render: (row) => String(row.sortOrder),
    },
    {
      key: 'label',
      header: 'Label',
      render: (row) => row.label,
    },
    {
      key: 'code',
      header: 'Code',
      render: (row) => row.code,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (
        <StatusBadge
          label={row.isActive ? 'Active' : 'Inactive'}
          color={row.isActive ? tokens.colorStatusSuccessForeground2 : tokens.colorNeutralForeground3}
          backgroundColor={row.isActive ? tokens.colorStatusSuccessBackground2 : tokens.colorNeutralBackground3}
        />
      ),
    },
  ], []);

  if (loading) {
    return (
      <div>
        <PageHeader title="Sector Definitions" />
        <div className={styles.container}>
          <HbcSkeleton variant="table" rows={5} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Sector Definitions" subtitle="Manage sector codes used for project classification." />
      <div className={styles.container}>
        <div className={styles.addForm}>
          <HbcField label="Label" required>
            <Input
              value={form.label}
              onChange={(_, data) => setForm(prev => ({ ...prev, label: data.value }))}
              placeholder="e.g. Airport"
            />
          </HbcField>
          <HbcField label="Code" required>
            <Input
              value={form.code}
              onChange={(_, data) => setForm(prev => ({ ...prev, code: data.value }))}
              placeholder="e.g. AIRPORT"
            />
          </HbcField>
          <HbcField label="Sort Order">
            <Input
              type="number"
              value={form.sortOrder}
              onChange={(_, data) => setForm(prev => ({ ...prev, sortOrder: data.value }))}
              placeholder="0"
            />
          </HbcField>
          <HbcButton emphasis="strong" isLoading={adding} onClick={handleAdd}>
            Add Sector
          </HbcButton>
        </div>

        <HbcDataTable
          tableId="admin-sectors"
          columns={columns}
          items={sectors}
          isLoading={loading}
          keyExtractor={(row) => String(row.id)}
          rowActions={(row) => (
            <HbcButton
              isLoading={togglingId === row.id}
              onClick={() => handleToggleActive(row)}
            >
              {row.isActive ? 'Deactivate' : 'Activate'}
            </HbcButton>
          )}
        />
      </div>
    </div>
  );
};

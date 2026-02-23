import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { HbcButton } from '../../shared/HbcButton';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { StatusBadge } from '../../shared/StatusBadge';
import { ConfirmDialog } from '../../shared/ConfirmDialog';
import { useAppContext } from '../../contexts/AppContext';
import { useToast } from '../../shared/ToastContainer';
import { AuditAction, EntityType } from '@hbc/sp-services';
import type { IPermissionTemplate } from '@hbc/sp-services';

const useStyles = makeStyles({
  container: {
    ...shorthands.padding('16px', '0'),
  },
  truncated: {
    display: 'inline-block',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});

export const PermissionsPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, currentUser } = useAppContext();
  const { addToast } = useToast();

  const [templates, setTemplates] = React.useState<IPermissionTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deactivatingId, setDeactivatingId] = React.useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<IPermissionTemplate | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  const fetchTemplates = React.useCallback(() => {
    setLoading(true);
    dataService.getPermissionTemplates()
      .then(result => setTemplates(result))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, [dataService]);

  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDeactivateClick = React.useCallback((template: IPermissionTemplate) => {
    setDeleteTarget(template);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDeactivate = React.useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteConfirmOpen(false);
    setDeactivatingId(deleteTarget.id);
    try {
      await dataService.deletePermissionTemplate(deleteTarget.id);
      await dataService.logAudit({
        Action: AuditAction.TemplateDeleted,
        EntityType: EntityType.PermissionTemplate,
        EntityId: String(deleteTarget.id),
        User: currentUser?.email || 'unknown',
        Details: JSON.stringify({ templateName: deleteTarget.name }),
      });
      addToast(`Template "${deleteTarget.name}" deactivated.`, 'success');
      fetchTemplates();
    } catch {
      addToast('Failed to deactivate permission template.', 'error');
    } finally {
      setDeactivatingId(null);
      setDeleteTarget(null);
    }
  }, [deleteTarget, dataService, currentUser, addToast, fetchTemplates]);

  const columns = React.useMemo((): IHbcDataTableColumn<IPermissionTemplate>[] => [
    {
      key: 'name',
      header: 'Name',
      render: (row) => row.name,
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => (
        <span className={styles.truncated} title={row.description}>
          {row.description && row.description.length > 60
            ? `${row.description.slice(0, 60)}...`
            : row.description || '\u2014'}
        </span>
      ),
    },
    {
      key: 'identityType',
      header: 'Identity',
      render: (row) => row.identityType,
    },
    {
      key: 'isGlobal',
      header: 'Scope',
      render: (row) => (
        <StatusBadge
          label={row.isGlobal ? 'Global' : 'Scoped'}
          color={row.isGlobal ? tokens.colorStatusSuccessForeground2 : tokens.colorNeutralForeground3}
          backgroundColor={row.isGlobal ? tokens.colorStatusSuccessBackground2 : tokens.colorNeutralBackground3}
        />
      ),
    },
    {
      key: 'toolAccess',
      header: 'Tools',
      render: (row) => String(row.toolAccess?.length || 0),
    },
    {
      key: 'version',
      header: 'Version',
      render: (row) => String(row.version),
    },
    {
      key: 'isDefault',
      header: 'Default',
      render: (row) => row.isDefault ? (
        <StatusBadge
          label="Default"
          color={tokens.colorCompoundBrandForeground1}
          backgroundColor={tokens.colorNeutralBackground3}
        />
      ) : '\u2014',
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (
        <StatusBadge
          label={row.isActive ? 'Active' : 'Inactive'}
          color={row.isActive ? tokens.colorStatusSuccessForeground2 : tokens.colorStatusDangerForeground2}
          backgroundColor={row.isActive ? tokens.colorStatusSuccessBackground2 : tokens.colorStatusDangerBackground2}
        />
      ),
    },
  ], [styles]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Permission Templates" />
        <div className={styles.container}>
          <HbcSkeleton variant="table" rows={6} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Permission Templates"
        subtitle="Manage permission templates that define tool access levels and granular flags."
      />
      <div className={styles.container}>
        <HbcDataTable
          tableId="admin-permission-templates"
          columns={columns}
          items={templates}
          isLoading={loading}
          keyExtractor={(row) => String(row.id)}
          rowActions={(row) =>
            row.isActive ? (
              <HbcButton
                isLoading={deactivatingId === row.id}
                onClick={() => handleDeactivateClick(row)}
              >
                Deactivate
              </HbcButton>
            ) : null
          }
        />
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Deactivate Permission Template"
        message={deleteTarget
          ? `Deactivate the "${deleteTarget.name}" template? Users currently assigned this template will lose associated permissions.`
          : 'Deactivate this template?'
        }
        confirmLabel="Deactivate"
        onConfirm={confirmDeactivate}
        onCancel={() => { setDeleteConfirmOpen(false); setDeleteTarget(null); }}
        danger
      />
    </div>
  );
};

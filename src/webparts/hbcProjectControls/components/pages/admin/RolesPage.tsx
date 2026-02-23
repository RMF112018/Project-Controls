import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { HbcButton } from '../../shared/HbcButton';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { StatusBadge } from '../../shared/StatusBadge';
import { useAppContext } from '../../contexts/AppContext';
import { useToast } from '../../shared/ToastContainer';
import { AuditAction, EntityType } from '@hbc/sp-services';
import type { IRoleConfiguration } from '@hbc/sp-services';

const useStyles = makeStyles({
  container: {
    ...shorthands.padding('16px', '0'),
  },
});

export const RolesPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, currentUser } = useAppContext();
  const { addToast } = useToast();

  const [roles, setRoles] = React.useState<IRoleConfiguration[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deactivatingId, setDeactivatingId] = React.useState<number | null>(null);

  const fetchRoles = React.useCallback(() => {
    setLoading(true);
    dataService.getRoleConfigurations()
      .then(result => setRoles(result))
      .catch(() => setRoles([]))
      .finally(() => setLoading(false));
  }, [dataService]);

  React.useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleDeactivate = React.useCallback(async (role: IRoleConfiguration) => {
    setDeactivatingId(role.id);
    try {
      await dataService.deleteRoleConfiguration(role.id);
      await dataService.logAudit({
        Action: AuditAction.RoleConfigurationDeleted,
        EntityType: EntityType.RoleConfiguration,
        EntityId: String(role.id),
        User: currentUser?.email || 'unknown',
        Details: JSON.stringify({ roleName: role.roleName }),
      });
      addToast(`Role "${role.displayName}" deactivated.`, 'success');
      fetchRoles();
    } catch {
      addToast('Failed to deactivate role.', 'error');
    } finally {
      setDeactivatingId(null);
    }
  }, [dataService, currentUser, addToast, fetchRoles]);

  const handleAddRole = React.useCallback(() => {
    addToast('Add Role form coming soon.', 'info');
  }, [addToast]);

  const columns = React.useMemo((): IHbcDataTableColumn<IRoleConfiguration>[] => [
    {
      key: 'displayName',
      header: 'Display Name',
      render: (row) => row.displayName,
    },
    {
      key: 'roleName',
      header: 'Role Name',
      render: (row) => row.roleName,
    },
    {
      key: 'permissionsCount',
      header: 'Permissions',
      render: (row) => String(row.defaultPermissions.length),
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
    {
      key: 'isSystem',
      header: 'Type',
      render: (row) => row.isSystem ? (
        <StatusBadge
          label="System"
          color={tokens.colorNeutralForeground2}
          backgroundColor={tokens.colorNeutralBackground3}
        />
      ) : '—',
    },
  ], []);

  if (loading) {
    return (
      <div>
        <PageHeader title="Role Configuration" />
        <div className={styles.container}>
          <HbcSkeleton variant="table" rows={6} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Role Configuration"
        subtitle="Manage application roles, permissions, and scope assignments."
        actions={
          <HbcButton emphasis="strong" onClick={handleAddRole}>
            Add Role
          </HbcButton>
        }
      />
      <div className={styles.container}>
        <HbcDataTable
          tableId="admin-roles"
          columns={columns}
          items={roles}
          isLoading={loading}
          keyExtractor={(row) => String(row.id)}
          rowActions={(row) =>
            !row.isSystem ? (
              <HbcButton
                isLoading={deactivatingId === row.id}
                onClick={() => handleDeactivate(row)}
              >
                Deactivate
              </HbcButton>
            ) : null
          }
        />
      </div>
    </div>
  );
};

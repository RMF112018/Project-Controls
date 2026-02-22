import * as React from 'react';
import {
  Button,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  Input,
  Switch,
  Badge,
  Checkbox,
  Spinner,
  Toaster,
  useToastController,
  useId,
  Toast,
  ToastTitle,
  ToastBody,
} from '@fluentui/react-components';
import { makeStyles, shorthands } from '@griffel/react';
import { PERMISSIONS } from '@hbc/sp-services';
import type { IRoleConfiguration } from '@hbc/sp-services';
import { useRoleConfigurationEngine } from '../../hooks/useRoleConfigurationEngine';
import { PermissionGate } from '../../guards/PermissionGate';
import { HBC_COLORS } from '../../../theme/tokens';

// ─── Styles ──────────────────────────────────────────────────────────
const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    ...shorthands.gap('8px'),
  },
  headerTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: HBC_COLORS.navy,
    ...shorthands.margin('0'),
  },
  headerSubtitle: {
    fontSize: '13px',
    color: HBC_COLORS.gray500,
    ...shorthands.margin('4px', '0', '0', '0'),
  },
  actions: {
    display: 'flex',
    ...shorthands.gap('8px'),
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  th: {
    textAlign: 'left',
    ...shorthands.padding('8px', '12px'),
    backgroundColor: HBC_COLORS.gray50,
    ...shorthands.borderBottom('1px', 'solid', HBC_COLORS.gray200),
    fontSize: '11px',
    fontWeight: 700,
    color: HBC_COLORS.gray500,
    textTransform: 'uppercase' as const,
  },
  td: {
    ...shorthands.padding('8px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', HBC_COLORS.gray100),
    verticalAlign: 'middle',
  },
  roleName: {
    fontWeight: 500,
    color: HBC_COLORS.navy,
  },
  emptyState: {
    ...shorthands.padding('24px'),
    textAlign: 'center',
    color: HBC_COLORS.gray400,
    fontSize: '13px',
  },
  disabledMessage: {
    ...shorthands.padding('24px'),
    textAlign: 'center',
    color: HBC_COLORS.gray400,
    fontSize: '13px',
  },
  dialogField: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
    marginBottom: '12px',
  },
  dialogLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: HBC_COLORS.gray600,
  },
  permissionSection: {
    marginBottom: '12px',
  },
  permissionSectionTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: HBC_COLORS.navy,
    textTransform: 'uppercase' as const,
    marginBottom: '4px',
    ...shorthands.padding('4px', '0'),
    ...shorthands.borderBottom('1px', 'solid', HBC_COLORS.gray200),
  },
  permissionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    ...shorthands.gap('2px'),
  },
  navGroupGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap('8px'),
  },
  scrollableBody: {
    maxHeight: '60vh',
    overflowY: 'auto' as const,
  },
  errorBanner: {
    ...shorthands.padding('10px', '16px'),
    ...shorthands.borderRadius('6px'),
    backgroundColor: HBC_COLORS.errorLight,
    color: '#991B1B',
    fontSize: '13px',
    marginBottom: '12px',
  },
});

// ─── Permission grouping helpers ─────────────────────────────────────
const ALL_PERMISSION_VALUES = Object.values(PERMISSIONS);

interface IPermissionGroup {
  prefix: string;
  label: string;
  keys: string[];
}

function groupPermissions(): IPermissionGroup[] {
  const groups = new Map<string, string[]>();
  for (const perm of ALL_PERMISSION_VALUES) {
    const colonIdx = perm.indexOf(':');
    const prefix = colonIdx > 0 ? perm.substring(0, colonIdx) : 'other';
    if (!groups.has(prefix)) {
      groups.set(prefix, []);
    }
    groups.get(prefix)!.push(perm);
  }
  const result: IPermissionGroup[] = [];
  for (const [prefix, keys] of groups.entries()) {
    result.push({
      prefix,
      label: prefix.charAt(0).toUpperCase() + prefix.slice(1),
      keys: keys.sort(),
    });
  }
  return result.sort((a, b) => a.label.localeCompare(b.label));
}

const PERMISSION_GROUPS = groupPermissions();

const NAV_GROUPS = ['Marketing', 'Preconstruction', 'Operations', 'Accounting', 'Admin'];

// ─── Component ───────────────────────────────────────────────────────
export const RoleConfigurationPanel: React.FC = () => {
  const styles = useStyles();
  const {
    roles,
    isLoading,
    isEnabled,
    error,
    createRole,
    updateRole,
    deleteRole,
    seedDefaults,
  } = useRoleConfigurationEngine();

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingRole, setEditingRole] = React.useState<IRoleConfiguration | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<number | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // Form state
  const [formRoleName, setFormRoleName] = React.useState('');
  const [formDisplayName, setFormDisplayName] = React.useState('');
  const [formDescription, setFormDescription] = React.useState('');
  const [formIsGlobal, setFormIsGlobal] = React.useState(false);
  const [formIsActive, setFormIsActive] = React.useState(true);
  const [formPermissions, setFormPermissions] = React.useState<Set<string>>(new Set());
  const [formNavGroups, setFormNavGroups] = React.useState<Set<string>>(new Set());

  // Toast
  const toasterId = useId('role-config-toaster');
  const { dispatchToast } = useToastController(toasterId);

  const showToast = React.useCallback(
    (title: string, body: string, intent: 'success' | 'error') => {
      dispatchToast(
        <Toast>
          <ToastTitle>{title}</ToastTitle>
          <ToastBody>{body}</ToastBody>
        </Toast>,
        { intent, timeout: 3000 }
      );
    },
    [dispatchToast]
  );

  // Reset form
  const resetForm = React.useCallback(() => {
    setFormRoleName('');
    setFormDisplayName('');
    setFormDescription('');
    setFormIsGlobal(false);
    setFormIsActive(true);
    setFormPermissions(new Set());
    setFormNavGroups(new Set());
    setEditingRole(null);
  }, []);

  // Open create dialog
  const handleOpenCreate = React.useCallback(() => {
    resetForm();
    setDialogOpen(true);
  }, [resetForm]);

  // Open edit dialog
  const handleOpenEdit = React.useCallback((role: IRoleConfiguration) => {
    setEditingRole(role);
    setFormRoleName(role.roleName);
    setFormDisplayName(role.displayName);
    setFormDescription(role.description);
    setFormIsGlobal(role.isGlobal);
    setFormIsActive(role.isActive);
    setFormPermissions(new Set(role.defaultPermissions));
    setFormNavGroups(new Set(role.navGroupAccess));
    setDialogOpen(true);
  }, []);

  // Close dialog
  const handleCloseDialog = React.useCallback(() => {
    setDialogOpen(false);
    resetForm();
  }, [resetForm]);

  // Save (create or update)
  const handleSave = React.useCallback(async () => {
    if (!formRoleName.trim() || !formDisplayName.trim()) return;
    setIsSaving(true);
    try {
      const payload: Partial<IRoleConfiguration> = {
        roleName: formRoleName.trim(),
        displayName: formDisplayName.trim(),
        description: formDescription.trim(),
        isGlobal: formIsGlobal,
        isActive: formIsActive,
        defaultPermissions: Array.from(formPermissions),
        navGroupAccess: Array.from(formNavGroups),
      };
      if (editingRole) {
        await updateRole(editingRole.id, payload);
        showToast('Role Updated', `"${formDisplayName}" has been updated.`, 'success');
      } else {
        await createRole(payload);
        showToast('Role Created', `"${formDisplayName}" has been created.`, 'success');
      }
      handleCloseDialog();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      showToast('Error', msg, 'error');
    } finally {
      setIsSaving(false);
    }
  }, [
    formRoleName, formDisplayName, formDescription, formIsGlobal, formIsActive,
    formPermissions, formNavGroups, editingRole, createRole, updateRole,
    handleCloseDialog, showToast,
  ]);

  // Delete
  const handleConfirmDelete = React.useCallback(async () => {
    if (confirmDeleteId === null) return;
    setIsSaving(true);
    try {
      await deleteRole(confirmDeleteId);
      showToast('Role Deleted', 'The role configuration has been deleted.', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      showToast('Error', msg, 'error');
    } finally {
      setIsSaving(false);
      setConfirmDeleteId(null);
    }
  }, [confirmDeleteId, deleteRole, showToast]);

  // Seed defaults
  const handleSeedDefaults = React.useCallback(async () => {
    setIsSaving(true);
    try {
      const seeded = await seedDefaults();
      showToast('Defaults Seeded', `${seeded.length} default roles have been created.`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      showToast('Error', msg, 'error');
    } finally {
      setIsSaving(false);
    }
  }, [seedDefaults, showToast]);

  // Permission toggle
  const togglePermission = React.useCallback((perm: string) => {
    setFormPermissions(prev => {
      const next = new Set(prev);
      if (next.has(perm)) {
        next.delete(perm);
      } else {
        next.add(perm);
      }
      return next;
    });
  }, []);

  // Nav group toggle
  const toggleNavGroup = React.useCallback((group: string) => {
    setFormNavGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  }, []);

  // Keyboard: Escape closes dialogs
  React.useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        if (confirmDeleteId !== null) {
          setConfirmDeleteId(null);
        } else if (dialogOpen) {
          handleCloseDialog();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [dialogOpen, confirmDeleteId, handleCloseDialog]);

  // ─── Render ──────────────────────────────────────────────────────
  if (!isEnabled) {
    return (
      <div className={styles.disabledMessage}>
        Role Configuration Engine is not enabled. Enable the &quot;RoleConfigurationEngine&quot; feature flag to use this panel.
      </div>
    );
  }

  return (
    <PermissionGate
      permission={PERMISSIONS.ADMIN_ROLES}
      fallback={
        <div className={styles.disabledMessage}>
          You do not have permission to manage role configurations.
        </div>
      }
    >
      <Toaster toasterId={toasterId} />

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h3 className={styles.headerTitle}>Role Configuration Engine</h3>
            <p className={styles.headerSubtitle}>
              Manage configuration-driven roles, permissions, and nav group access. System roles cannot be deleted.
            </p>
          </div>
          <div className={styles.actions}>
            {roles.length === 0 && (
              <Button
                appearance="secondary"
                size="small"
                disabled={isSaving}
                onClick={handleSeedDefaults}
              >
                {isSaving ? 'Seeding...' : 'Seed Defaults'}
              </Button>
            )}
            <Button
              appearance="primary"
              size="small"
              onClick={handleOpenCreate}
            >
              New Role
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && <div className={styles.errorBanner}>{error}</div>}

        {/* Loading */}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
            <Spinner size="medium" label="Loading role configurations..." />
          </div>
        )}

        {/* Table */}
        {!isLoading && roles.length === 0 && (
          <div className={styles.emptyState}>
            No role configurations found. Click &quot;Seed Defaults&quot; to create the 6 core roles, or add a new role manually.
          </div>
        )}

        {!isLoading && roles.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Role Name</th>
                  <th className={styles.th}>Display Name</th>
                  <th className={styles.th} style={{ width: '110px' }}>Global / Scoped</th>
                  <th className={styles.th} style={{ width: '80px' }}>System</th>
                  <th className={styles.th} style={{ width: '80px' }}>Status</th>
                  <th className={styles.th} style={{ width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(role => (
                  <tr key={role.id}>
                    <td className={styles.td}>
                      <span className={styles.roleName}>{role.roleName}</span>
                    </td>
                    <td className={styles.td}>{role.displayName}</td>
                    <td className={styles.td}>
                      <Badge
                        appearance="filled"
                        color={role.isGlobal ? 'brand' : 'informative'}
                        size="small"
                      >
                        {role.isGlobal ? 'Global' : 'Scoped'}
                      </Badge>
                    </td>
                    <td className={styles.td}>
                      {role.isSystem && (
                        <Badge appearance="outline" color="severe" size="small">
                          System
                        </Badge>
                      )}
                    </td>
                    <td className={styles.td}>
                      <Badge
                        appearance="filled"
                        color={role.isActive ? 'success' : 'warning'}
                        size="small"
                      >
                        {role.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className={styles.td}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <Button
                          appearance="subtle"
                          size="small"
                          onClick={() => handleOpenEdit(role)}
                        >
                          Edit
                        </Button>
                        <Button
                          appearance="subtle"
                          size="small"
                          disabled={role.isSystem}
                          title={role.isSystem ? 'System roles cannot be deleted' : 'Delete role'}
                          onClick={() => setConfirmDeleteId(role.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Create / Edit Dialog ────────────────────────────────── */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(_e, data) => { if (!data.open) handleCloseDialog(); }}
      >
        <DialogSurface style={{ maxWidth: '720px', width: '90vw' }}>
          <DialogTitle>{editingRole ? 'Edit Role' : 'New Role'}</DialogTitle>
          <DialogBody className={styles.scrollableBody}>
            {/* Role Name */}
            <div className={styles.dialogField}>
              <label className={styles.dialogLabel}>Role Name</label>
              <Input
                value={formRoleName}
                onChange={(_e, data) => setFormRoleName(data.value)}
                placeholder="e.g. Project Coordinator"
                disabled={editingRole?.isSystem === true}
              />
            </div>

            {/* Display Name */}
            <div className={styles.dialogField}>
              <label className={styles.dialogLabel}>Display Name</label>
              <Input
                value={formDisplayName}
                onChange={(_e, data) => setFormDisplayName(data.value)}
                placeholder="e.g. Project Coordinator"
              />
            </div>

            {/* Description */}
            <div className={styles.dialogField}>
              <label className={styles.dialogLabel}>Description</label>
              <Input
                value={formDescription}
                onChange={(_e, data) => setFormDescription(data.value)}
                placeholder="Short description of this role's responsibilities"
              />
            </div>

            {/* isGlobal toggle */}
            <div className={styles.dialogField}>
              <Switch
                checked={formIsGlobal}
                onChange={(_e, data) => setFormIsGlobal(data.checked)}
                label="Global Access (all projects and departments)"
              />
            </div>

            {/* isActive toggle */}
            <div className={styles.dialogField}>
              <Switch
                checked={formIsActive}
                onChange={(_e, data) => setFormIsActive(data.checked)}
                label="Active"
              />
            </div>

            {/* Nav Group Access */}
            <div className={styles.dialogField}>
              <label className={styles.dialogLabel}>Nav Group Access</label>
              <div className={styles.navGroupGrid}>
                {NAV_GROUPS.map(group => (
                  <Checkbox
                    key={group}
                    checked={formNavGroups.has(group)}
                    onChange={() => toggleNavGroup(group)}
                    label={group}
                  />
                ))}
              </div>
            </div>

            {/* Permissions grouped by domain prefix */}
            <div className={styles.dialogField}>
              <label className={styles.dialogLabel}>Permissions</label>
              {PERMISSION_GROUPS.map(group => (
                <div key={group.prefix} className={styles.permissionSection}>
                  <div className={styles.permissionSectionTitle}>
                    {group.label} ({group.keys.filter(k => formPermissions.has(k)).length}/{group.keys.length})
                  </div>
                  <div className={styles.permissionGrid}>
                    {group.keys.map(perm => (
                      <Checkbox
                        key={perm}
                        checked={formPermissions.has(perm)}
                        onChange={() => togglePermission(perm)}
                        label={perm}
                        size="medium"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </DialogBody>
          <DialogActions>
            <Button appearance="secondary" onClick={handleCloseDialog} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              onClick={handleSave}
              disabled={isSaving || !formRoleName.trim() || !formDisplayName.trim()}
            >
              {isSaving ? 'Saving...' : editingRole ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ──────────────────────────── */}
      <Dialog
        open={confirmDeleteId !== null}
        onOpenChange={(_e, data) => { if (!data.open) setConfirmDeleteId(null); }}
      >
        <DialogSurface>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogBody>
            Are you sure you want to delete this role configuration? This action cannot be undone.
          </DialogBody>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setConfirmDeleteId(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              style={{ backgroundColor: HBC_COLORS.error }}
              onClick={handleConfirmDelete}
              disabled={isSaving}
            >
              {isSaving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </PermissionGate>
  );
};

import * as React from 'react';
import {
  Checkbox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  type DialogOpenChangeData,
  type DialogOpenChangeEvent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  Switch,
  Textarea,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
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
  createFormContainer: {
    display: 'grid',
    ...shorthands.gap('12px'),
  },
  createPanelActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    ...shorthands.gap('8px'),
  },
  addRoleButton: {
    ...shorthands.border('none'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding(tokens.spacingVerticalSNudge, tokens.spacingHorizontalM),
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    fontWeight: tokens.fontWeightSemibold,
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
    },
    ':active': {
      backgroundColor: tokens.colorBrandBackgroundPressed,
    },
    ':focus-visible': {
      outlineColor: tokens.colorStrokeFocus2,
      outlineStyle: 'solid',
      outlineWidth: tokens.strokeWidthThick,
    },
  },
  saveRoleButton: {
    ...shorthands.border('none'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding(tokens.spacingVerticalSNudge, tokens.spacingHorizontalM),
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    fontWeight: tokens.fontWeightSemibold,
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
    },
    ':active': {
      backgroundColor: tokens.colorBrandBackgroundPressed,
    },
    ':focus-visible': {
      outlineColor: tokens.colorStrokeFocus2,
      outlineStyle: 'solid',
      outlineWidth: tokens.strokeWidthThick,
    },
  },
  matrix: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    ...shorthands.gap('8px'),
  },
});

const PERMISSION_OPTIONS = [
  'view-dashboard',
  'manage-users',
  'manage-roles',
  'manage-permissions',
  'manage-feature-flags',
  'manage-connections',
  'manage-provisioning',
  'view-audit-log',
] as const;

type RoleCreatePayload = {
  roleName: string;
  displayName: string;
  description: string;
  defaultPermissions: string[];
  isGlobal: boolean;
  isActive: boolean;
  isSystem: boolean;
};

type RoleCreateFormValues = {
  roleName: string;
  displayName: string;
  description: string;
  selectedPermissions: string[];
  isGlobal: boolean;
};

type RoleModalMode = 'create' | 'view' | 'edit';

type RoleCreateFormProps = {
  open: boolean;
  mode: RoleModalMode;
  initialValues: RoleCreateFormValues | null;
  onSave: (values: RoleCreateFormValues) => Promise<void>;
  onValidationWarning: (message: string) => void;
};

type RoleCreateFormHandle = {
  submit: () => Promise<void>;
};

const RoleCreateForm = React.memo(
  React.forwardRef<RoleCreateFormHandle, RoleCreateFormProps>((props, ref) => {
    const { open, mode, initialValues, onSave, onValidationWarning } = props;
    const styles = useStyles();
    const isReadOnly = mode === 'view';

    // Keep heavy form state local so page/table rendering remains isolated.
    const [roleName, setRoleName] = React.useState('');
    const [displayName, setDisplayName] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [isGlobal, setIsGlobal] = React.useState(true);
    const [selectedPermissions, setSelectedPermissions] = React.useState<string[]>([]);

    // Explicit reset-on-open preserves clean create state and ensures selected rows preload reliably.
    React.useEffect(() => {
      if (!open) {
        return;
      }
      setRoleName(initialValues?.roleName ?? '');
      setDisplayName(initialValues?.displayName ?? '');
      setDescription(initialValues?.description ?? '');
      setIsGlobal(initialValues?.isGlobal ?? true);
      setSelectedPermissions(initialValues?.selectedPermissions ? [...initialValues.selectedPermissions] : []);
    }, [open, initialValues]);

    const handlePermissionChange = React.useCallback((permission: string, checked: boolean) => {
      setSelectedPermissions((prev) => {
        if (checked) {
          return prev.includes(permission) ? prev : [...prev, permission];
        }
        return prev.filter((item) => item !== permission);
      });
    }, []);

    const submit = React.useCallback(async () => {
      if (isReadOnly) {
        return;
      }

      const nextRoleName = roleName.trim();
      const nextDisplayName = displayName.trim();
      const nextDescription = description.trim();

      if (!nextRoleName || !nextDisplayName) {
        onValidationWarning('Role name and display name are required.');
        return;
      }

      if (selectedPermissions.length === 0) {
        onValidationWarning('Select at least one permission.');
        return;
      }

      await onSave({
        roleName: nextRoleName,
        displayName: nextDisplayName,
        description: nextDescription,
        isGlobal,
        selectedPermissions,
      });
    }, [
      isReadOnly,
      roleName,
      displayName,
      description,
      selectedPermissions,
      isGlobal,
      onSave,
      onValidationWarning,
    ]);

    React.useImperativeHandle(ref, () => ({ submit }), [submit]);

    return (
      <div className={styles.createFormContainer} data-testid="admin-roles-create-form">
        <Field label="Role Name" required>
          <Input
            value={roleName}
            readOnly={isReadOnly}
            onChange={(_, data) => setRoleName(data.value)}
            data-testid="admin-roles-input-role-name"
            placeholder="e.g. RegionalOpsManager"
          />
        </Field>
        <Field label="Display Name" required>
          <Input
            value={displayName}
            readOnly={isReadOnly}
            onChange={(_, data) => setDisplayName(data.value)}
            data-testid="admin-roles-input-display-name"
            placeholder="e.g. Regional Operations Manager"
          />
        </Field>
        <Field label="Description">
          <Textarea
            value={description}
            readOnly={isReadOnly}
            onChange={(_, data) => setDescription(data.value)}
            data-testid="admin-roles-input-description"
            placeholder="Describe the role purpose and scope"
          />
        </Field>
        <Field label="Global Scope">
          <Switch
            checked={isGlobal}
            disabled={isReadOnly}
            onChange={(_, data) => setIsGlobal(Boolean(data.checked))}
            label={isGlobal ? 'Global' : 'Scoped'}
            data-testid="admin-roles-input-is-global"
          />
        </Field>
        <Field label="Permission Matrix" required>
          <div className={styles.matrix}>
            {PERMISSION_OPTIONS.map((permission) => {
              const checked = selectedPermissions.includes(permission);
              return (
                <Checkbox
                  key={permission}
                  checked={checked}
                  disabled={isReadOnly}
                  label={permission}
                  data-testid={`admin-roles-permission-${permission}`}
                  onChange={(_, data) => handlePermissionChange(permission, Boolean(data.checked))}
                />
              );
            })}
          </div>
        </Field>
      </div>
    );
  })
);

RoleCreateForm.displayName = 'RoleCreateForm';
const LazyRoleCreateForm = React.lazy(async () => ({ default: RoleCreateForm }));

export const RolesPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, currentUser } = useAppContext();
  const { addToast } = useToast();

  const [roles, setRoles] = React.useState<IRoleConfiguration[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deactivatingId, setDeactivatingId] = React.useState<number | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createFormReady, setCreateFormReady] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<RoleModalMode>('create');
  const [selectedRoleId, setSelectedRoleId] = React.useState<number | null>(null);
  const [selectedRoleInitialValues, setSelectedRoleInitialValues] = React.useState<RoleCreateFormValues | null>(null);
  const [, startTransition] = React.useTransition();
  const createFormRef = React.useRef<RoleCreateFormHandle | null>(null);

  const fetchRoles = React.useCallback(() => {
    setLoading(true);
    dataService
      .getRoleConfigurations()
      .then((result) => setRoles(result))
      .catch(() => setRoles([]))
      .finally(() => setLoading(false));
  }, [dataService]);

  React.useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleDeactivate = React.useCallback(
    async (role: IRoleConfiguration) => {
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
    },
    [dataService, currentUser, addToast, fetchRoles]
  );

  const handleAddRole = React.useCallback(() => {
    window.setTimeout(() => {
      startTransition(() => {
        setModalMode('create');
        setSelectedRoleId(null);
        setSelectedRoleInitialValues(null);
        setCreateFormReady(false);
        setCreateOpen(true);
      });
    }, 0);
  }, [startTransition]);

  const handleRoleRowClick = React.useCallback(
    (role: IRoleConfiguration) => {
      const snapshot: RoleCreateFormValues = {
        roleName: role.roleName,
        displayName: role.displayName,
        description: role.description,
        selectedPermissions: [...role.defaultPermissions],
        isGlobal: role.isGlobal,
      };

      window.setTimeout(() => {
        startTransition(() => {
          setModalMode('view');
          setSelectedRoleId(role.id);
          setSelectedRoleInitialValues(snapshot);
          setCreateFormReady(false);
          setCreateOpen(true);
        });
      }, 0);
    },
    [startTransition]
  );

  const handleEditRole = React.useCallback(() => {
    setModalMode('edit');
  }, []);

  const handleCloseCreate = React.useCallback(() => {
    setModalMode('create');
    setSelectedRoleId(null);
    setSelectedRoleInitialValues(null);
    setCreateFormReady(false);
    setCreateOpen(false);
  }, []);

  React.useEffect(() => {
    if (!createOpen) {
      return;
    }
    // Defer heavy form mount until after dialog paint so click processing completes first.
    const rafId = window.requestAnimationFrame(() => {
      setCreateFormReady(true);
    });
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [createOpen]);

  const handleCreateValidationWarning = React.useCallback(
    (message: string) => {
      addToast(message, 'warning');
    },
    [addToast]
  );

  const handleDialogOpenChange = React.useCallback(
    (_event: DialogOpenChangeEvent, data: DialogOpenChangeData) => {
      if (!data.open) {
        handleCloseCreate();
      }
    },
    [handleCloseCreate]
  );

  const handleSaveRole = React.useCallback(
    async (values: RoleCreateFormValues) => {
      setSaving(true);
      try {
        const payload: RoleCreatePayload = {
          roleName: values.roleName,
          displayName: values.displayName,
          description: values.description,
          defaultPermissions: values.selectedPermissions,
          isGlobal: values.isGlobal,
          isActive: true,
          isSystem: false,
        };

        const createRole = (dataService as unknown as {
          createRoleConfiguration?: (input: RoleCreatePayload) => Promise<void>;
        }).createRoleConfiguration;
        const updateRole = (dataService as unknown as {
          updateRoleConfiguration?: (id: number, input: RoleCreatePayload) => Promise<void>;
        }).updateRoleConfiguration;

        const isEditMode = modalMode === 'edit' && selectedRoleId !== null;
        let savedViaApi = false;

        if (isEditMode) {
          if (updateRole) {
            try {
              await updateRole(selectedRoleId, payload);
              savedViaApi = true;
            } catch {
              setRoles((prev) =>
                prev.map((role) =>
                  role.id === selectedRoleId
                    ? ({
                        ...role,
                        roleName: payload.roleName,
                        displayName: payload.displayName,
                        description: payload.description,
                        defaultPermissions: payload.defaultPermissions,
                        isGlobal: payload.isGlobal,
                        isActive: payload.isActive,
                        isSystem: payload.isSystem,
                      } as IRoleConfiguration)
                    : role
                )
              );
            }
          } else {
            setRoles((prev) =>
              prev.map((role) =>
                role.id === selectedRoleId
                  ? ({
                      ...role,
                      roleName: payload.roleName,
                      displayName: payload.displayName,
                      description: payload.description,
                      defaultPermissions: payload.defaultPermissions,
                      isGlobal: payload.isGlobal,
                      isActive: payload.isActive,
                      isSystem: payload.isSystem,
                    } as IRoleConfiguration)
                  : role
              )
            );
          }
        } else if (createRole) {
          try {
            await createRole(payload);
            savedViaApi = true;
          } catch {
            // Preserve current dev fallback behavior for partially wired local services.
            setRoles((prev) => [
              ...prev,
              {
                id: prev.length > 0 ? Math.max(...prev.map((role) => role.id)) + 1 : 1,
                roleName: payload.roleName,
                displayName: payload.displayName,
                description: payload.description,
                defaultPermissions: payload.defaultPermissions,
                isGlobal: payload.isGlobal,
                isActive: payload.isActive,
                isSystem: payload.isSystem,
              } as IRoleConfiguration,
            ]);
          }
        } else {
          // Preserve current dev fallback behavior for partially wired local services.
          setRoles((prev) => [
            ...prev,
            {
              id: prev.length > 0 ? Math.max(...prev.map((role) => role.id)) + 1 : 1,
              roleName: payload.roleName,
              displayName: payload.displayName,
              description: payload.description,
              defaultPermissions: payload.defaultPermissions,
              isGlobal: payload.isGlobal,
              isActive: payload.isActive,
              isSystem: payload.isSystem,
            } as IRoleConfiguration,
          ]);
        }

        await dataService.logAudit({
          Action: AuditAction.ConfigRoleChanged,
          EntityType: EntityType.RoleConfiguration,
          EntityId: isEditMode ? String(selectedRoleId) : values.roleName,
          User: currentUser?.email || 'unknown',
          Details: JSON.stringify({
            roleName: values.roleName,
            displayName: values.displayName,
            mode: isEditMode ? 'edit' : 'create',
          }),
        });

        addToast(
          isEditMode ? `Role "${values.displayName}" updated.` : `Role "${values.displayName}" created.`,
          'success'
        );
        handleCloseCreate();
        if (savedViaApi) {
          fetchRoles();
        }
      } catch {
        addToast(modalMode === 'edit' ? 'Failed to update role.' : 'Failed to create role.', 'error');
      } finally {
        setSaving(false);
      }
    },
    [dataService, currentUser, addToast, fetchRoles, modalMode, selectedRoleId, handleCloseCreate]
  );

  const handleSubmitCreateRole = React.useCallback(async () => {
    window.setTimeout(async () => {
      await createFormRef.current?.submit();
    }, 0);
  }, []);

  const columns = React.useMemo(
    (): IHbcDataTableColumn<IRoleConfiguration>[] => [
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
        render: (row) =>
          row.isSystem ? (
            <StatusBadge
              label="System"
              color={tokens.colorNeutralForeground2}
              backgroundColor={tokens.colorNeutralBackground3}
            />
          ) : (
            '—'
          ),
      },
    ],
    []
  );

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
          <button
            type="button"
            onMouseDown={(event) => {
              // Keep pointer click path lightweight; opening is handled by onClick.
              event.preventDefault();
            }}
            onClick={handleAddRole}
            data-testid="admin-roles-add-role-button"
            className={styles.addRoleButton}
          >
            Add Role
          </button>
        }
      />
      <div className={styles.container}>
        <HbcDataTable
          tableId="admin-roles"
          columns={columns}
          items={roles}
          isLoading={loading}
          keyExtractor={(row) => String(row.id)}
          onRowClick={handleRoleRowClick}
          rowActions={(row) =>
            !row.isSystem ? (
              <HbcButton isLoading={deactivatingId === row.id} onClick={() => handleDeactivate(row)}>
                Deactivate
              </HbcButton>
            ) : null
          }
        />
      </div>

      <Dialog open={createOpen} onOpenChange={handleDialogOpenChange}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{modalMode === 'create' ? 'Create Role' : 'Role Details'}</DialogTitle>
            {/* Canonical Fluent v9 slot structure with DialogContent avoids production/runtime slot issues. */}
            {/* Lazy mount + deferred open keeps row-click and add-click pointer handling responsive in dev/preview. */}
            {/* Explicit reset-on-open still happens inside RoleCreateForm based on `open` + snapshot initial values. */}
            <DialogContent>
              {createFormReady ? (
                <React.Suspense fallback={<div>Loading role form...</div>}>
                  <LazyRoleCreateForm
                    ref={createFormRef}
                    open={createOpen}
                    mode={modalMode}
                    initialValues={selectedRoleInitialValues}
                    onSave={handleSaveRole}
                    onValidationWarning={handleCreateValidationWarning}
                  />
                </React.Suspense>
              ) : (
                <div>Preparing role form...</div>
              )}
            </DialogContent>
            <DialogActions className={styles.createPanelActions}>
              <HbcButton onClick={handleCloseCreate}>{modalMode === 'create' ? 'Cancel' : 'Close'}</HbcButton>
              {modalMode === 'view' ? (
                <HbcButton emphasis="strong" onClick={handleEditRole}>
                  Edit
                </HbcButton>
              ) : (
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  disabled={!createFormReady || saving}
                  onClick={handleSubmitCreateRole}
                  data-testid="admin-roles-save-button"
                  className={styles.saveRoleButton}
                >
                  {saving ? 'Saving...' : 'Save Role'}
                </button>
              )}
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

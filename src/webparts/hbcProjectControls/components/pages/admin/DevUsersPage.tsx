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
  MessageBar,
  MessageBarBody,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { HbcButton } from '../../shared/HbcButton';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { useAppContext } from '../../contexts/AppContext';
import { useToast } from '../../shared/ToastContainer';
import { CANONICAL_ROLES } from '@hbc/sp-services';

// ── Types ───────────────────────────────────────────────────────────────────
interface IMockUser {
  id: number;
  displayName: string;
  email: string;
  roles: string[];
}

// ── Default mock users (canonical role names) ───────────────────────────────
const MOCK_USERS: IMockUser[] = [
  { id: 1, displayName: 'John Smith', email: 'john.smith@hedrick.com', roles: ['Administrator'] },
  { id: 2, displayName: 'Jane Doe', email: 'jane.doe@hedrick.com', roles: ['Business Development Manager'] },
  { id: 3, displayName: 'Mike Johnson', email: 'mike.johnson@hedrick.com', roles: ['Estimator'] },
  { id: 4, displayName: 'Sarah Williams', email: 'sarah.williams@hedrick.com', roles: ['Commercial Operations Manager'] },
  { id: 5, displayName: 'Robert Brown', email: 'robert.brown@hedrick.com', roles: ['Leadership'] },
  { id: 6, displayName: 'Emily Davis', email: 'emily.davis@hedrick.com', roles: ['Preconstruction Manager'] },
  { id: 7, displayName: 'David Wilson', email: 'david.wilson@hedrick.com', roles: ['Administrator', 'Commercial Operations Manager'] },
  { id: 8, displayName: 'Lisa Martinez', email: 'lisa.martinez@hedrick.com', roles: ['Business Development Manager', 'Estimator'] },
];

// ── Styles ──────────────────────────────────────────────────────────────────
const useStyles = makeStyles({
  container: {
    ...shorthands.padding('16px', '0'),
  },
  banner: {
    marginBottom: '16px',
  },
  notAvailable: {
    ...shorthands.padding('24px'),
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
    fontSize: '14px',
  },
  formContainer: {
    display: 'grid',
    ...shorthands.gap('12px'),
  },
  roleMatrix: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    ...shorthands.gap('8px'),
  },
  panelActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    ...shorthands.gap('8px'),
  },
  saveButton: {
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
});

// ── Form Types ──────────────────────────────────────────────────────────────
type UserModalMode = 'create' | 'view' | 'edit';

type UserFormValues = {
  displayName: string;
  email: string;
  roles: string[];
};

type UserFormProps = {
  open: boolean;
  mode: UserModalMode;
  initialValues: UserFormValues | null;
  onSave: (values: UserFormValues) => Promise<void>;
  onValidationWarning: (message: string) => void;
};

type UserFormHandle = {
  submit: () => Promise<void>;
};

// ── User Create/Edit Form ───────────────────────────────────────────────────
const UserCreateForm = React.memo(
  React.forwardRef<UserFormHandle, UserFormProps>((props, ref) => {
    const { open, mode, initialValues, onSave, onValidationWarning } = props;
    const styles = useStyles();
    const isReadOnly = mode === 'view';

    const [displayName, setDisplayName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [roles, setRoles] = React.useState<string[]>([]);

    React.useEffect(() => {
      if (!open) return;
      setDisplayName(initialValues?.displayName ?? '');
      setEmail(initialValues?.email ?? '');
      setRoles(initialValues?.roles ? [...initialValues.roles] : []);
    }, [open, initialValues]);

    const handleRoleChange = React.useCallback((role: string, checked: boolean) => {
      setRoles(prev => {
        if (checked) {
          return prev.includes(role) ? prev : [...prev, role];
        }
        return prev.filter(r => r !== role);
      });
    }, []);

    const submit = React.useCallback(async () => {
      if (isReadOnly) return;

      const trimmedName = displayName.trim();
      const trimmedEmail = email.trim();

      if (!trimmedName) {
        onValidationWarning('Display name is required.');
        return;
      }
      if (!trimmedEmail) {
        onValidationWarning('Email is required.');
        return;
      }
      if (roles.length === 0) {
        onValidationWarning('Select at least one role.');
        return;
      }

      await onSave({
        displayName: trimmedName,
        email: trimmedEmail,
        roles,
      });
    }, [isReadOnly, displayName, email, roles, onSave, onValidationWarning]);

    React.useImperativeHandle(ref, () => ({ submit }), [submit]);

    return (
      <div className={styles.formContainer} data-testid="admin-user-create-form">
        <Field label="Display Name" required>
          <Input
            value={displayName}
            readOnly={isReadOnly}
            onChange={(_, data) => setDisplayName(data.value)}
            data-testid="admin-user-input-display-name"
            placeholder="e.g. John Smith"
          />
        </Field>
        <Field label="Email" required>
          <Input
            value={email}
            readOnly={isReadOnly}
            onChange={(_, data) => setEmail(data.value)}
            data-testid="admin-user-input-email"
            placeholder="e.g. john.smith@hedrick.com"
            type="email"
          />
        </Field>
        <Field label="Roles" required>
          <div className={styles.roleMatrix}>
            {CANONICAL_ROLES.map(role => (
              <Checkbox
                key={role}
                checked={roles.includes(role)}
                disabled={isReadOnly}
                label={role}
                data-testid={`admin-user-role-${role.replace(/\s+/g, '-').toLowerCase()}`}
                onChange={(_, data) => handleRoleChange(role, Boolean(data.checked))}
              />
            ))}
          </div>
        </Field>
      </div>
    );
  })
);
UserCreateForm.displayName = 'UserCreateForm';
const LazyUserCreateForm = React.lazy(async () => ({ default: UserCreateForm }));

// ── Main Page ───────────────────────────────────────────────────────────────
export const DevUsersPage: React.FC = () => {
  const styles = useStyles();
  const { dataServiceMode } = useAppContext();
  const { addToast } = useToast();

  const [users, setUsers] = React.useState<IMockUser[]>(MOCK_USERS);
  const [loading, setLoading] = React.useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [formReady, setFormReady] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<UserModalMode>('create');
  const [selectedUserId, setSelectedUserId] = React.useState<number | null>(null);
  const [initialValues, setInitialValues] = React.useState<UserFormValues | null>(null);
  const [, startTransition] = React.useTransition();
  const formRef = React.useRef<UserFormHandle | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // ── Create / View / Edit ────────────────────────────────────────────────
  const handleCreate = React.useCallback(() => {
    window.setTimeout(() => {
      startTransition(() => {
        setModalMode('create');
        setSelectedUserId(null);
        setInitialValues(null);
        setFormReady(false);
        setDialogOpen(true);
      });
    }, 0);
  }, [startTransition]);

  const handleRowClick = React.useCallback((user: IMockUser) => {
    const snapshot: UserFormValues = {
      displayName: user.displayName,
      email: user.email,
      roles: [...user.roles],
    };
    window.setTimeout(() => {
      startTransition(() => {
        setModalMode('view');
        setSelectedUserId(user.id);
        setInitialValues(snapshot);
        setFormReady(false);
        setDialogOpen(true);
      });
    }, 0);
  }, [startTransition]);

  const handleEdit = React.useCallback(() => {
    setModalMode('edit');
  }, []);

  const handleClose = React.useCallback(() => {
    setModalMode('create');
    setSelectedUserId(null);
    setInitialValues(null);
    setFormReady(false);
    setDialogOpen(false);
  }, []);

  React.useEffect(() => {
    if (!dialogOpen) return;
    const rafId = window.requestAnimationFrame(() => setFormReady(true));
    return () => window.cancelAnimationFrame(rafId);
  }, [dialogOpen]);

  const handleDialogOpenChange = React.useCallback(
    (_event: DialogOpenChangeEvent, data: DialogOpenChangeData) => {
      if (!data.open) {
        handleClose();
      }
    },
    [handleClose]
  );

  const handleValidationWarning = React.useCallback(
    (message: string) => addToast(message, 'warning'),
    [addToast]
  );

  const handleSave = React.useCallback(async (values: UserFormValues) => {
    setSaving(true);
    try {
      const isEditMode = modalMode === 'edit' && selectedUserId !== null;

      if (isEditMode) {
        setUsers(prev => prev.map(u =>
          u.id === selectedUserId
            ? { ...u, displayName: values.displayName, email: values.email, roles: values.roles }
            : u
        ));
        addToast(`User "${values.displayName}" updated.`, 'success');
      } else {
        const nextId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        setUsers(prev => [...prev, {
          id: nextId,
          displayName: values.displayName,
          email: values.email,
          roles: values.roles,
        }]);
        addToast(`User "${values.displayName}" created.`, 'success');
      }

      handleClose();
    } catch {
      addToast(modalMode === 'edit' ? 'Failed to update user.' : 'Failed to create user.', 'error');
    } finally {
      setSaving(false);
    }
  }, [modalMode, selectedUserId, users, addToast, handleClose]);

  const handleSubmit = React.useCallback(async () => {
    window.setTimeout(async () => {
      await formRef.current?.submit();
    }, 0);
  }, []);

  if (dataServiceMode !== 'mock') {
    return (
      <div>
        <PageHeader title="Dev Users" />
        <div className={styles.notAvailable}>
          Dev Users is only available in mock mode. Current mode: {dataServiceMode}.
        </div>
      </div>
    );
  }

  // ── Table Columns ─────────────────────────────────────────────────────────
  const columns: IHbcDataTableColumn<IMockUser>[] = [
    {
      key: 'displayName',
      header: 'Display Name',
      render: (row) => row.displayName,
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => row.email,
    },
    {
      key: 'roles',
      header: 'Roles',
      render: (row) => row.roles.join(', '),
    },
  ];

  if (loading) {
    return (
      <div>
        <PageHeader title="Dev Users" />
        <div className={styles.container}>
          <HbcSkeleton variant="table" rows={6} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dev Users"
        subtitle="Mock user accounts for development and testing."
        actions={
          <HbcButton emphasis="strong" onClick={handleCreate} data-testid="admin-user-add-button">
            Add User
          </HbcButton>
        }
      />
      <div className={styles.container}>
        <div className={styles.banner}>
          <MessageBar>
            <MessageBarBody>
              Changes are session-only and will not persist across page reloads.
            </MessageBarBody>
          </MessageBar>
        </div>

        <HbcDataTable
          tableId="admin-dev-users"
          columns={columns}
          items={users}
          isLoading={loading}
          keyExtractor={(row) => String(row.id)}
          onRowClick={handleRowClick}
        />
      </div>

      {/* Create / View / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogSurface style={{ maxWidth: '560px' }}>
          <DialogBody>
            <DialogTitle>
              {modalMode === 'create' ? 'Create User' : modalMode === 'edit' ? 'Edit User' : 'User Details'}
            </DialogTitle>
            <DialogContent>
              {formReady ? (
                <React.Suspense fallback={<div>Loading user form...</div>}>
                  <LazyUserCreateForm
                    ref={formRef}
                    open={dialogOpen}
                    mode={modalMode}
                    initialValues={initialValues}
                    onSave={handleSave}
                    onValidationWarning={handleValidationWarning}
                  />
                </React.Suspense>
              ) : (
                <div>Preparing user form...</div>
              )}
            </DialogContent>
            <DialogActions className={styles.panelActions}>
              <HbcButton onClick={handleClose}>{modalMode === 'create' || modalMode === 'edit' ? 'Cancel' : 'Close'}</HbcButton>
              {modalMode === 'view' ? (
                <HbcButton emphasis="strong" onClick={handleEdit}>
                  Edit
                </HbcButton>
              ) : (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  disabled={!formReady || saving}
                  onClick={handleSubmit}
                  data-testid="admin-user-save-button"
                  className={styles.saveButton}
                >
                  {saving ? 'Saving...' : modalMode === 'edit' ? 'Save Changes' : 'Create User'}
                </button>
              )}
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

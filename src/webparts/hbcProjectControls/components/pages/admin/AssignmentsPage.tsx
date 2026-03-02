import * as React from 'react';
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  type DialogOpenChangeData,
  type DialogOpenChangeEvent,
  DialogSurface,
  DialogTitle,
  Dropdown,
  Field,
  Input,
  Option,
  Switch,
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
import { ConfirmDialog } from '../../shared/ConfirmDialog';
import { useAppContext } from '../../contexts/AppContext';
import { useToast } from '../../shared/ToastContainer';
import { usePermissionEngine } from '../../hooks/usePermissionEngine';
import { useQuery } from '@tanstack/react-query';
import { useQueryScope } from '../../../tanstack/query/useQueryScope';
import { permissionAssignmentsOptions } from '../../../tanstack/query/queryOptions/permissionEngine';
import { AuditAction, EntityType } from '@hbc/sp-services';
import type { IProjectTeamAssignment, IPermissionTemplate } from '@hbc/sp-services';

// ── Styles ──────────────────────────────────────────────────────────────────
const useStyles = makeStyles({
  container: {
    ...shorthands.padding('16px', '0'),
  },
  formContainer: {
    display: 'grid',
    ...shorthands.gap('12px'),
  },
  panelActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    ...shorthands.gap('8px'),
  },
  rowActions: {
    display: 'flex',
    ...shorthands.gap('4px'),
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

// ── Constants ───────────────────────────────────────────────────────────────
// Project team roles observed in mock data and HBC operational structure
const PROJECT_TEAM_ROLES = [
  'Principal-in-Charge',
  'Project Executive',
  'Lead PM',
  'Assistant PM',
  'Lead Superintendent',
  'Superintendent',
  'Project Accountant',
  'Director of Preconstruction',
  'BD Representative',
  'Safety Officer',
  'Quality Manager',
  'Estimator',
] as const;

// Known mock project codes — derived from projectTeamAssignments.json
const MOCK_PROJECT_CODES = ['25-042-01', '25-115-01'] as const;

// ── Types ───────────────────────────────────────────────────────────────────
type AssignmentModalMode = 'create' | 'view' | 'edit';

type AssignmentFormValues = {
  projectCode: string;
  userDisplayName: string;
  userEmail: string;
  assignedRole: string;
  templateOverrideId: number | undefined;
  isActive: boolean;
};

type AssignmentFormProps = {
  open: boolean;
  mode: AssignmentModalMode;
  initialValues: AssignmentFormValues | null;
  templates: IPermissionTemplate[];
  onSave: (values: AssignmentFormValues) => Promise<void>;
  onValidationWarning: (message: string) => void;
};

type AssignmentFormHandle = {
  submit: () => Promise<void>;
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(iso: string | null | undefined): string {
  if (!iso) return '\u2014';
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

// ── Assignment Create/Edit Form ─────────────────────────────────────────────
const AssignmentCreateForm = React.memo(
  React.forwardRef<AssignmentFormHandle, AssignmentFormProps>((props, ref) => {
    const { open, mode, initialValues, templates, onSave, onValidationWarning } = props;
    const styles = useStyles();
    const isReadOnly = mode === 'view';

    const [projectCode, setProjectCode] = React.useState('');
    const [userDisplayName, setUserDisplayName] = React.useState('');
    const [userEmail, setUserEmail] = React.useState('');
    const [assignedRole, setAssignedRole] = React.useState('');
    const [templateOverrideId, setTemplateOverrideId] = React.useState<number | undefined>(undefined);
    const [isActive, setIsActive] = React.useState(true);

    React.useEffect(() => {
      if (!open) return;
      setProjectCode(initialValues?.projectCode ?? '');
      setUserDisplayName(initialValues?.userDisplayName ?? '');
      setUserEmail(initialValues?.userEmail ?? '');
      setAssignedRole(initialValues?.assignedRole ?? '');
      setTemplateOverrideId(initialValues?.templateOverrideId);
      setIsActive(initialValues?.isActive ?? true);
    }, [open, initialValues]);

    const submit = React.useCallback(async () => {
      if (isReadOnly) return;

      const trimmedName = userDisplayName.trim();
      const trimmedEmail = userEmail.trim();

      if (!projectCode) {
        onValidationWarning('Project code is required.');
        return;
      }
      if (!trimmedName) {
        onValidationWarning('User display name is required.');
        return;
      }
      if (!trimmedEmail) {
        onValidationWarning('User email is required.');
        return;
      }
      if (!assignedRole) {
        onValidationWarning('Assigned role is required.');
        return;
      }

      await onSave({
        projectCode,
        userDisplayName: trimmedName,
        userEmail: trimmedEmail,
        assignedRole,
        templateOverrideId,
        isActive,
      });
    }, [isReadOnly, projectCode, userDisplayName, userEmail, assignedRole, templateOverrideId, isActive, onSave, onValidationWarning]);

    React.useImperativeHandle(ref, () => ({ submit }), [submit]);

    const activeTemplates = React.useMemo(
      () => templates.filter(t => t.isActive),
      [templates]
    );

    return (
      <div className={styles.formContainer} data-testid="admin-assignment-create-form">
        <Field label="Project Code" required>
          <Dropdown
            value={projectCode}
            selectedOptions={projectCode ? [projectCode] : []}
            disabled={isReadOnly}
            onOptionSelect={(_, data) => {
              if (data.optionValue) setProjectCode(data.optionValue);
            }}
            placeholder="Select project"
            data-testid="admin-assignment-input-project-code"
          >
            {MOCK_PROJECT_CODES.map(code => (
              <Option key={code} value={code}>{code}</Option>
            ))}
          </Dropdown>
        </Field>
        <Field label="User Display Name" required>
          <Input
            value={userDisplayName}
            readOnly={isReadOnly}
            onChange={(_, data) => setUserDisplayName(data.value)}
            data-testid="admin-assignment-input-display-name"
            placeholder="e.g. John Smith"
          />
        </Field>
        <Field label="User Email" required>
          <Input
            value={userEmail}
            readOnly={isReadOnly}
            onChange={(_, data) => setUserEmail(data.value)}
            data-testid="admin-assignment-input-email"
            placeholder="e.g. john.smith@hedrick.com"
            type="email"
          />
        </Field>
        <Field label="Assigned Role" required>
          <Dropdown
            value={assignedRole}
            selectedOptions={assignedRole ? [assignedRole] : []}
            disabled={isReadOnly}
            onOptionSelect={(_, data) => {
              if (data.optionValue) setAssignedRole(data.optionValue);
            }}
            placeholder="Select role"
            data-testid="admin-assignment-input-role"
          >
            {PROJECT_TEAM_ROLES.map(role => (
              <Option key={role} value={role}>{role}</Option>
            ))}
          </Dropdown>
        </Field>
        <Field label="Template Override (optional)">
          <Dropdown
            value={templateOverrideId !== undefined ? String(templateOverrideId) : ''}
            selectedOptions={templateOverrideId !== undefined ? [String(templateOverrideId)] : []}
            disabled={isReadOnly}
            onOptionSelect={(_, data) => {
              if (data.optionValue === '') {
                setTemplateOverrideId(undefined);
              } else {
                setTemplateOverrideId(Number(data.optionValue));
              }
            }}
            placeholder="None (use default)"
            data-testid="admin-assignment-input-template"
          >
            <Option value="">None (use default)</Option>
            {activeTemplates.map(t => (
              <Option key={t.id} value={String(t.id)}>{t.name}</Option>
            ))}
          </Dropdown>
        </Field>
        <Field label="Active">
          <Switch
            checked={isActive}
            disabled={isReadOnly}
            onChange={(_, data) => setIsActive(Boolean(data.checked))}
            label={isActive ? 'Active' : 'Inactive'}
            data-testid="admin-assignment-input-is-active"
          />
        </Field>
      </div>
    );
  })
);
AssignmentCreateForm.displayName = 'AssignmentCreateForm';
const LazyAssignmentCreateForm = React.lazy(async () => ({ default: AssignmentCreateForm }));

// ── Main Page ───────────────────────────────────────────────────────────────
export const AssignmentsPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, currentUser, refreshPermissions } = useAppContext();
  const { addToast } = useToast();
  const scope = useQueryScope();
  const {
    assignToProject,
    removeFromProject,
    updateAssignment,
    templates,
  } = usePermissionEngine();

  // Reactive assignment data via TanStack Query
  const assignmentsQuery = useQuery(permissionAssignmentsOptions(scope, dataService));
  const assignments = React.useMemo(() => assignmentsQuery.data ?? [], [assignmentsQuery.data]);
  const loading = assignmentsQuery.isFetching;

  // Remove confirm state
  const [removingId, setRemovingId] = React.useState<number | null>(null);
  const [removeTarget, setRemoveTarget] = React.useState<IProjectTeamAssignment | null>(null);
  const [removeConfirmOpen, setRemoveConfirmOpen] = React.useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [formReady, setFormReady] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<AssignmentModalMode>('create');
  const [selectedAssignmentId, setSelectedAssignmentId] = React.useState<number | null>(null);
  const [initialValues, setInitialValues] = React.useState<AssignmentFormValues | null>(null);
  const [, startTransition] = React.useTransition();
  const formRef = React.useRef<AssignmentFormHandle | null>(null);

  // ── Remove ──────────────────────────────────────────────────────────────
  const handleRemoveClick = React.useCallback((assignment: IProjectTeamAssignment) => {
    setRemoveTarget(assignment);
    setRemoveConfirmOpen(true);
  }, []);

  const confirmRemove = React.useCallback(async () => {
    if (!removeTarget) return;
    setRemoveConfirmOpen(false);
    setRemovingId(removeTarget.id);
    try {
      await removeFromProject(removeTarget.id);
      await dataService.logAudit({
        Action: AuditAction.ProjectTeamRemoved,
        EntityType: EntityType.ProjectTeamAssignment,
        EntityId: String(removeTarget.id),
        User: currentUser?.email || 'unknown',
        Details: JSON.stringify({
          projectCode: removeTarget.projectCode,
          user: removeTarget.userDisplayName,
          role: removeTarget.assignedRole,
        }),
      });
      addToast(`Assignment for "${removeTarget.userDisplayName}" removed.`, 'success');
      await refreshPermissions();
    } catch {
      addToast('Failed to remove assignment.', 'error');
    } finally {
      setRemovingId(null);
      setRemoveTarget(null);
    }
  }, [removeTarget, removeFromProject, dataService, currentUser, addToast, refreshPermissions]);

  // ── Create / View / Edit ────────────────────────────────────────────────
  const handleCreate = React.useCallback(() => {
    window.setTimeout(() => {
      startTransition(() => {
        setModalMode('create');
        setSelectedAssignmentId(null);
        setInitialValues(null);
        setFormReady(false);
        setDialogOpen(true);
      });
    }, 0);
  }, [startTransition]);

  const handleRowClick = React.useCallback((assignment: IProjectTeamAssignment) => {
    const snapshot: AssignmentFormValues = {
      projectCode: assignment.projectCode,
      userDisplayName: assignment.userDisplayName,
      userEmail: assignment.userEmail,
      assignedRole: assignment.assignedRole,
      templateOverrideId: assignment.templateOverrideId,
      isActive: assignment.isActive,
    };
    window.setTimeout(() => {
      startTransition(() => {
        setModalMode('view');
        setSelectedAssignmentId(assignment.id);
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
    setSelectedAssignmentId(null);
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

  const handleSave = React.useCallback(async (values: AssignmentFormValues) => {
    setSaving(true);
    try {
      const isEditMode = modalMode === 'edit' && selectedAssignmentId !== null;
      const userId = `user-${values.userEmail.split('@')[0]}`;

      if (isEditMode) {
        await updateAssignment(selectedAssignmentId, {
          projectCode: values.projectCode,
          userId,
          userDisplayName: values.userDisplayName,
          userEmail: values.userEmail,
          assignedRole: values.assignedRole,
          templateOverrideId: values.templateOverrideId,
          isActive: values.isActive,
        });
        await dataService.logAudit({
          Action: AuditAction.ProjectTeamOverridden,
          EntityType: EntityType.ProjectTeamAssignment,
          EntityId: String(selectedAssignmentId),
          User: currentUser?.email || 'unknown',
          Details: JSON.stringify({
            projectCode: values.projectCode,
            user: values.userDisplayName,
            role: values.assignedRole,
            mode: 'edit',
          }),
        });
        addToast(`Assignment for "${values.userDisplayName}" updated.`, 'success');
      } else {
        const created = await assignToProject({
          projectCode: values.projectCode,
          userId,
          userDisplayName: values.userDisplayName,
          userEmail: values.userEmail,
          assignedRole: values.assignedRole,
          templateOverrideId: values.templateOverrideId,
          isActive: values.isActive,
        });
        await dataService.logAudit({
          Action: AuditAction.ProjectTeamAssigned,
          EntityType: EntityType.ProjectTeamAssignment,
          EntityId: String(created.id),
          User: currentUser?.email || 'unknown',
          Details: JSON.stringify({
            projectCode: values.projectCode,
            user: values.userDisplayName,
            role: values.assignedRole,
            mode: 'create',
          }),
        });
        addToast(`"${values.userDisplayName}" assigned to ${values.projectCode}.`, 'success');
      }

      await refreshPermissions();
      handleClose();
    } catch {
      addToast(modalMode === 'edit' ? 'Failed to update assignment.' : 'Failed to create assignment.', 'error');
    } finally {
      setSaving(false);
    }
  }, [modalMode, selectedAssignmentId, assignToProject, updateAssignment, dataService, currentUser, addToast, refreshPermissions, handleClose]);

  const handleSubmit = React.useCallback(async () => {
    window.setTimeout(async () => {
      await formRef.current?.submit();
    }, 0);
  }, []);

  // ── Table Columns ─────────────────────────────────────────────────────────
  const columns = React.useMemo((): IHbcDataTableColumn<IProjectTeamAssignment>[] => [
    {
      key: 'projectCode',
      header: 'Project Code',
      render: (row) => row.projectCode,
    },
    {
      key: 'userDisplayName',
      header: 'Name',
      render: (row) => row.userDisplayName,
    },
    {
      key: 'userEmail',
      header: 'Email',
      render: (row) => row.userEmail || '\u2014',
    },
    {
      key: 'assignedRole',
      header: 'Role',
      render: (row) => row.assignedRole,
    },
    {
      key: 'assignedBy',
      header: 'Assigned By',
      render: (row) => row.assignedBy || '\u2014',
    },
    {
      key: 'assignedDate',
      header: 'Assigned Date',
      render: (row) => formatDate(row.assignedDate),
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
  ], []);

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading && assignments.length === 0) {
    return (
      <div>
        <PageHeader title="Project Team Assignments" />
        <div className={styles.container}>
          <HbcSkeleton variant="table" rows={6} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Project Team Assignments"
        subtitle="View and manage project team role assignments across all projects."
        actions={
          <HbcButton emphasis="strong" onClick={handleCreate} data-testid="admin-assignment-add-button">
            Add Assignment
          </HbcButton>
        }
      />
      <div className={styles.container}>
        <HbcDataTable
          tableId="admin-project-assignments"
          columns={columns}
          items={assignments}
          isLoading={loading}
          keyExtractor={(row) => String(row.id)}
          onRowClick={handleRowClick}
          rowActions={(row) => (
            <HbcButton
              isLoading={removingId === row.id}
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleRemoveClick(row); }}
            >
              Remove
            </HbcButton>
          )}
        />
      </div>

      {/* Remove confirm dialog */}
      <ConfirmDialog
        open={removeConfirmOpen}
        title="Remove Team Assignment"
        message={removeTarget
          ? `Remove "${removeTarget.userDisplayName}" (${removeTarget.assignedRole}) from project ${removeTarget.projectCode}?`
          : 'Remove this assignment?'
        }
        confirmLabel="Remove"
        onConfirm={confirmRemove}
        onCancel={() => { setRemoveConfirmOpen(false); setRemoveTarget(null); }}
        danger
      />

      {/* Create / View / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogSurface style={{ maxWidth: '560px' }}>
          <DialogBody>
            <DialogTitle>
              {modalMode === 'create' ? 'Add Team Assignment' : modalMode === 'edit' ? 'Edit Team Assignment' : 'Assignment Details'}
            </DialogTitle>
            <DialogContent>
              {formReady ? (
                <React.Suspense fallback={<div>Loading assignment form...</div>}>
                  <LazyAssignmentCreateForm
                    ref={formRef}
                    open={dialogOpen}
                    mode={modalMode}
                    initialValues={initialValues}
                    templates={templates}
                    onSave={handleSave}
                    onValidationWarning={handleValidationWarning}
                  />
                </React.Suspense>
              ) : (
                <div>Preparing assignment form...</div>
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
                  data-testid="admin-assignment-save-button"
                  className={styles.saveButton}
                >
                  {saving ? 'Saving...' : modalMode === 'edit' ? 'Save Changes' : 'Add Assignment'}
                </button>
              )}
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

import * as React from 'react';
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Checkbox,
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
import { ConfirmDialog } from '../../shared/ConfirmDialog';
import { useAppContext } from '../../contexts/AppContext';
import { useToast } from '../../shared/ToastContainer';
import { usePermissionEngine } from '../../hooks/usePermissionEngine';
import {
  AuditAction,
  EntityType,
  PermissionLevel,
  TOOL_DEFINITIONS,
  TOOL_GROUPS,
} from '@hbc/sp-services';
import type {
  IPermissionTemplate,
  IToolAccess,
  IToolDefinition,
  IGranularFlagDef,
} from '@hbc/sp-services';

// ── Styles ──────────────────────────────────────────────────────────────────
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
  formContainer: {
    display: 'grid',
    ...shorthands.gap('12px'),
  },
  panelActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    ...shorthands.gap('8px'),
  },
  toolRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 160px',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    ...shorthands.padding('4px', '0'),
  },
  toolLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
  },
  toolDescription: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  granularSection: {
    ...shorthands.padding('4px', '0', '4px', '24px'),
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    ...shorthands.gap('4px'),
  },
  groupHeader: {
    textTransform: 'capitalize' as const,
    fontWeight: tokens.fontWeightSemibold,
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

// ── Types ───────────────────────────────────────────────────────────────────
type TemplateModalMode = 'create' | 'view' | 'edit';

type TemplateFormValues = {
  name: string;
  description: string;
  identityType: 'Internal' | 'External';
  isGlobal: boolean;
  isActive: boolean;
  toolAccess: IToolAccess[];
};

type TemplateCreateFormProps = {
  open: boolean;
  mode: TemplateModalMode;
  initialValues: TemplateFormValues | null;
  onSave: (values: TemplateFormValues) => Promise<void>;
  onValidationWarning: (message: string) => void;
};

type TemplateCreateFormHandle = {
  submit: () => Promise<void>;
};

// ── Group Label Map ─────────────────────────────────────────────────────────
const GROUP_LABELS: Record<string, string> = {
  marketing: 'Marketing',
  preconstruction: 'Preconstruction',
  operations: 'Operations',
  shared_services: 'Shared Services',
  site_control: 'Site Control',
  admin: 'Administration',
};

const PERMISSION_LEVELS: PermissionLevel[] = [
  PermissionLevel.NONE,
  PermissionLevel.READ_ONLY,
  PermissionLevel.STANDARD,
  PermissionLevel.ADMIN,
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function buildDefaultToolAccess(): IToolAccess[] {
  return TOOL_DEFINITIONS.map(def => ({
    toolKey: def.toolKey,
    level: PermissionLevel.NONE,
    granularFlags: [],
  }));
}

function buildToolAccessFromTemplate(template: IPermissionTemplate): IToolAccess[] {
  const existing = new Map((template.toolAccess ?? []).map(ta => [ta.toolKey, ta]));
  return TOOL_DEFINITIONS.map(def => {
    const ta = existing.get(def.toolKey);
    return {
      toolKey: def.toolKey,
      level: ta?.level ?? PermissionLevel.NONE,
      granularFlags: ta?.granularFlags ? [...ta.granularFlags] : [],
    };
  });
}

// ── Tool Row Component ──────────────────────────────────────────────────────
const ToolRow = React.memo<{
  tool: IToolDefinition;
  access: IToolAccess;
  isReadOnly: boolean;
  onLevelChange: (toolKey: string, level: PermissionLevel) => void;
  onFlagChange: (toolKey: string, flagKey: string, checked: boolean) => void;
}>(({ tool, access, isReadOnly, onLevelChange, onFlagChange }) => {
  const styles = useStyles();
  const hasGranularFlags = tool.granularFlags.length > 0;

  return (
    <div>
      <div className={styles.toolRow}>
        <div>
          <div className={styles.toolLabel}>{tool.label}</div>
          <div className={styles.toolDescription}>{tool.description}</div>
        </div>
        <Dropdown
          value={access.level}
          selectedOptions={[access.level]}
          disabled={isReadOnly}
          onOptionSelect={(_, data) => {
            if (data.optionValue) {
              onLevelChange(tool.toolKey, data.optionValue as PermissionLevel);
            }
          }}
          aria-label={`Permission level for ${tool.label}`}
        >
          {PERMISSION_LEVELS.map(level => (
            <Option key={level} value={level}>{level}</Option>
          ))}
        </Dropdown>
      </div>
      {hasGranularFlags && access.level !== PermissionLevel.NONE && (
        <div className={styles.granularSection}>
          {tool.granularFlags.map((flag: IGranularFlagDef) => (
            <Checkbox
              key={flag.key}
              checked={access.granularFlags?.includes(flag.key) ?? false}
              disabled={isReadOnly}
              label={flag.label}
              title={flag.description}
              onChange={(_, data) => onFlagChange(tool.toolKey, flag.key, Boolean(data.checked))}
            />
          ))}
        </div>
      )}
    </div>
  );
});
ToolRow.displayName = 'ToolRow';

// ── Template Create/Edit Form ───────────────────────────────────────────────
const TemplateCreateForm = React.memo(
  React.forwardRef<TemplateCreateFormHandle, TemplateCreateFormProps>((props, ref) => {
    const { open, mode, initialValues, onSave, onValidationWarning } = props;
    const styles = useStyles();
    const isReadOnly = mode === 'view';

    const [name, setName] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [identityType, setIdentityType] = React.useState<'Internal' | 'External'>('Internal');
    const [isGlobal, setIsGlobal] = React.useState(false);
    const [isActive, setIsActive] = React.useState(true);
    const [toolAccess, setToolAccess] = React.useState<IToolAccess[]>(buildDefaultToolAccess);

    // Reset on open
    React.useEffect(() => {
      if (!open) return;
      setName(initialValues?.name ?? '');
      setDescription(initialValues?.description ?? '');
      setIdentityType(initialValues?.identityType ?? 'Internal');
      setIsGlobal(initialValues?.isGlobal ?? false);
      setIsActive(initialValues?.isActive ?? true);
      setToolAccess(initialValues?.toolAccess ? initialValues.toolAccess.map(ta => ({ ...ta })) : buildDefaultToolAccess());
    }, [open, initialValues]);

    const handleLevelChange = React.useCallback((toolKey: string, level: PermissionLevel) => {
      setToolAccess(prev => prev.map(ta =>
        ta.toolKey === toolKey
          ? { ...ta, level, granularFlags: level === PermissionLevel.NONE ? [] : ta.granularFlags }
          : ta
      ));
    }, []);

    const handleFlagChange = React.useCallback((toolKey: string, flagKey: string, checked: boolean) => {
      setToolAccess(prev => prev.map(ta => {
        if (ta.toolKey !== toolKey) return ta;
        const flags = ta.granularFlags ?? [];
        return {
          ...ta,
          granularFlags: checked
            ? flags.includes(flagKey) ? flags : [...flags, flagKey]
            : flags.filter(f => f !== flagKey),
        };
      }));
    }, []);

    const submit = React.useCallback(async () => {
      if (isReadOnly) return;

      const trimmedName = name.trim();
      if (!trimmedName) {
        onValidationWarning('Template name is required.');
        return;
      }

      const hasAnyTool = toolAccess.some(ta => ta.level !== PermissionLevel.NONE);
      if (!hasAnyTool) {
        onValidationWarning('At least one tool must have a permission level above NONE.');
        return;
      }

      // Strip NONE-level entries before saving — only include tools with actual access
      const filteredToolAccess = toolAccess
        .filter(ta => ta.level !== PermissionLevel.NONE)
        .map(ta => ({
          toolKey: ta.toolKey,
          level: ta.level,
          ...(ta.granularFlags && ta.granularFlags.length > 0 ? { granularFlags: ta.granularFlags } : {}),
        }));

      await onSave({
        name: trimmedName,
        description: description.trim(),
        identityType,
        isGlobal,
        isActive,
        toolAccess: filteredToolAccess,
      });
    }, [isReadOnly, name, description, identityType, isGlobal, isActive, toolAccess, onSave, onValidationWarning]);

    React.useImperativeHandle(ref, () => ({ submit }), [submit]);

    // Group tools for the Accordion
    const toolsByGroup = React.useMemo(() => {
      const accessMap = new Map(toolAccess.map(ta => [ta.toolKey, ta]));
      return TOOL_GROUPS.map(group => ({
        group,
        label: GROUP_LABELS[group] ?? group,
        tools: TOOL_DEFINITIONS.filter(t => t.toolGroup === group).map(tool => ({
          tool,
          access: accessMap.get(tool.toolKey) ?? { toolKey: tool.toolKey, level: PermissionLevel.NONE, granularFlags: [] },
        })),
      }));
    }, [toolAccess]);

    return (
      <div className={styles.formContainer} data-testid="admin-template-create-form">
        <Field label="Template Name" required>
          <Input
            value={name}
            readOnly={isReadOnly}
            onChange={(_, data) => setName(data.value)}
            data-testid="admin-template-input-name"
            placeholder="e.g. Regional Operations Manager"
          />
        </Field>
        <Field label="Description">
          <Textarea
            value={description}
            readOnly={isReadOnly}
            onChange={(_, data) => setDescription(data.value)}
            data-testid="admin-template-input-description"
            placeholder="Describe the template purpose and scope"
          />
        </Field>
        <Field label="Identity Type">
          <Dropdown
            value={identityType}
            selectedOptions={[identityType]}
            disabled={isReadOnly}
            onOptionSelect={(_, data) => {
              if (data.optionValue === 'Internal' || data.optionValue === 'External') {
                setIdentityType(data.optionValue);
              }
            }}
            data-testid="admin-template-input-identity-type"
          >
            <Option value="Internal">Internal</Option>
            <Option value="External">External</Option>
          </Dropdown>
        </Field>
        <Field label="Global Scope">
          <Switch
            checked={isGlobal}
            disabled={isReadOnly}
            onChange={(_, data) => setIsGlobal(Boolean(data.checked))}
            label={isGlobal ? 'Global — applies to all projects' : 'Scoped — project-specific'}
            data-testid="admin-template-input-is-global"
          />
        </Field>
        <Field label="Active">
          <Switch
            checked={isActive}
            disabled={isReadOnly}
            onChange={(_, data) => setIsActive(Boolean(data.checked))}
            label={isActive ? 'Active' : 'Inactive'}
            data-testid="admin-template-input-is-active"
          />
        </Field>
        <Field label="Tool Access Matrix" required>
          <Accordion multiple collapsible>
            {toolsByGroup.map(({ group, label, tools }) => (
              <AccordionItem key={group} value={group}>
                <AccordionHeader>
                  <span className={styles.groupHeader}>{label}</span>
                  {' '}({tools.filter(t => t.access.level !== PermissionLevel.NONE).length}/{tools.length} enabled)
                </AccordionHeader>
                <AccordionPanel>
                  {tools.map(({ tool, access }) => (
                    <ToolRow
                      key={tool.toolKey}
                      tool={tool}
                      access={access}
                      isReadOnly={isReadOnly}
                      onLevelChange={handleLevelChange}
                      onFlagChange={handleFlagChange}
                    />
                  ))}
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </Field>
      </div>
    );
  })
);
TemplateCreateForm.displayName = 'TemplateCreateForm';
const LazyTemplateCreateForm = React.lazy(async () => ({ default: TemplateCreateForm }));

// ── Main Page ───────────────────────────────────────────────────────────────
export const PermissionsPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, currentUser, refreshPermissions } = useAppContext();
  const { addToast } = useToast();
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate } = usePermissionEngine();

  const [deactivatingId, setDeactivatingId] = React.useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<IPermissionTemplate | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [formReady, setFormReady] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<TemplateModalMode>('create');
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<number | null>(null);
  const [initialValues, setInitialValues] = React.useState<TemplateFormValues | null>(null);
  const [, startTransition] = React.useTransition();
  const formRef = React.useRef<TemplateCreateFormHandle | null>(null);

  // ── Deactivate ──────────────────────────────────────────────────────────
  const handleDeactivateClick = React.useCallback((template: IPermissionTemplate) => {
    setDeleteTarget(template);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDeactivate = React.useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteConfirmOpen(false);
    setDeactivatingId(deleteTarget.id);
    try {
      await deleteTemplate(deleteTarget.id);
      await dataService.logAudit({
        Action: AuditAction.TemplateDeleted,
        EntityType: EntityType.PermissionTemplate,
        EntityId: String(deleteTarget.id),
        User: currentUser?.email || 'unknown',
        Details: JSON.stringify({ templateName: deleteTarget.name }),
      });
      addToast(`Template "${deleteTarget.name}" deactivated.`, 'success');
      await refreshPermissions();
    } catch {
      addToast('Failed to deactivate permission template.', 'error');
    } finally {
      setDeactivatingId(null);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteTemplate, dataService, currentUser, addToast, refreshPermissions]);

  // ── Create / View / Edit ────────────────────────────────────────────────
  const handleCreate = React.useCallback(() => {
    window.setTimeout(() => {
      startTransition(() => {
        setModalMode('create');
        setSelectedTemplateId(null);
        setInitialValues(null);
        setFormReady(false);
        setDialogOpen(true);
      });
    }, 0);
  }, [startTransition]);

  const handleRowClick = React.useCallback((template: IPermissionTemplate) => {
    const snapshot: TemplateFormValues = {
      name: template.name,
      description: template.description,
      identityType: template.identityType,
      isGlobal: template.isGlobal,
      isActive: template.isActive,
      toolAccess: buildToolAccessFromTemplate(template),
    };
    window.setTimeout(() => {
      startTransition(() => {
        setModalMode('view');
        setSelectedTemplateId(template.id);
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
    setSelectedTemplateId(null);
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

  const handleSave = React.useCallback(async (values: TemplateFormValues) => {
    setSaving(true);
    try {
      const isEditMode = modalMode === 'edit' && selectedTemplateId !== null;

      if (isEditMode) {
        await updateTemplate(selectedTemplateId, {
          name: values.name,
          description: values.description,
          identityType: values.identityType,
          isGlobal: values.isGlobal,
          globalAccess: values.isGlobal,
          isActive: values.isActive,
          toolAccess: values.toolAccess,
        });
        await dataService.logAudit({
          Action: AuditAction.TemplateUpdated,
          EntityType: EntityType.PermissionTemplate,
          EntityId: String(selectedTemplateId),
          User: currentUser?.email || 'unknown',
          Details: JSON.stringify({ templateName: values.name, mode: 'edit' }),
        });
        addToast(`Template "${values.name}" updated.`, 'success');
      } else {
        const created = await createTemplate({
          name: values.name,
          description: values.description,
          identityType: values.identityType,
          isGlobal: values.isGlobal,
          globalAccess: values.isGlobal,
          isActive: values.isActive,
          isDefault: false,
          version: 1,
          toolAccess: values.toolAccess,
        });
        await dataService.logAudit({
          Action: AuditAction.TemplateCreated,
          EntityType: EntityType.PermissionTemplate,
          EntityId: String(created.id),
          User: currentUser?.email || 'unknown',
          Details: JSON.stringify({ templateName: values.name, mode: 'create' }),
        });
        addToast(`Template "${values.name}" created.`, 'success');
      }

      await refreshPermissions();
      handleClose();
    } catch {
      addToast(modalMode === 'edit' ? 'Failed to update template.' : 'Failed to create template.', 'error');
    } finally {
      setSaving(false);
    }
  }, [modalMode, selectedTemplateId, createTemplate, updateTemplate, dataService, currentUser, addToast, refreshPermissions, handleClose]);

  const handleSubmit = React.useCallback(async () => {
    window.setTimeout(async () => {
      await formRef.current?.submit();
    }, 0);
  }, []);

  // ── Table Columns ─────────────────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading && templates.length === 0) {
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
        actions={
          <HbcButton emphasis="strong" onClick={handleCreate} data-testid="admin-template-create-button">
            Create Template
          </HbcButton>
        }
      />
      <div className={styles.container}>
        <HbcDataTable
          tableId="admin-permission-templates"
          columns={columns}
          items={templates}
          isLoading={loading}
          keyExtractor={(row) => String(row.id)}
          onRowClick={handleRowClick}
          rowActions={(row) =>
            row.isActive ? (
              <HbcButton
                isLoading={deactivatingId === row.id}
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleDeactivateClick(row); }}
              >
                Deactivate
              </HbcButton>
            ) : null
          }
        />
      </div>

      {/* Deactivate confirm dialog */}
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

      {/* Create / View / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogSurface style={{ maxWidth: '720px' }}>
          <DialogBody>
            <DialogTitle>
              {modalMode === 'create' ? 'Create Permission Template' : modalMode === 'edit' ? 'Edit Permission Template' : 'Permission Template Details'}
            </DialogTitle>
            <DialogContent>
              {formReady ? (
                <React.Suspense fallback={<div>Loading template form...</div>}>
                  <LazyTemplateCreateForm
                    ref={formRef}
                    open={dialogOpen}
                    mode={modalMode}
                    initialValues={initialValues}
                    onSave={handleSave}
                    onValidationWarning={handleValidationWarning}
                  />
                </React.Suspense>
              ) : (
                <div>Preparing template form...</div>
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
                  data-testid="admin-template-save-button"
                  className={styles.saveButton}
                >
                  {saving ? 'Saving...' : modalMode === 'edit' ? 'Save Changes' : 'Create Template'}
                </button>
              )}
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

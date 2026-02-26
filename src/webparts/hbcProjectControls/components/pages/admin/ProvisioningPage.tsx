import * as React from 'react';
import { makeStyles, shorthands, tokens, TabList, Tab, Switch, Dropdown, Option, Field, Textarea, Spinner } from '@fluentui/react-components';
import type { SelectTabData, SelectTabEvent } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { HbcButton } from '../../shared/HbcButton';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { StatusBadge } from '../../shared/StatusBadge';
import { KPICard } from '../../shared/KPICard';
import { SlideDrawer } from '../../shared/SlideDrawer';
import { HbcTanStackTable } from '../../../tanstack/table/HbcTanStackTable';
import type { IHbcTanStackTableColumn } from '../../../tanstack/table/types';
import { useAppContext } from '../../contexts/AppContext';
import { useToast } from '../../shared/ToastContainer';
import { ProvisioningStatus, AuditAction, EntityType, TemplateSyncStatus } from '@hbc/sp-services';
import type { IProvisioningLog, IProvisioningSummary, ISiteTemplate, SiteTemplateType } from '@hbc/sp-services';
import { ProvisioningStatusStepper } from '../../shared/ProvisioningStatusStepper';
import { FeatureGate } from '../../guards/FeatureGate';
import { useProvisioningStatus } from '../../hooks/useProvisioningStatus';

type ProvisioningTab = 'logs' | 'templates';

const POLL_INTERVAL_MS = 30_000;

const STATUS_COLORS: Record<ProvisioningStatus, { color: string; backgroundColor: string }> = {
  [ProvisioningStatus.Completed]: { color: tokens.colorStatusSuccessForeground2, backgroundColor: tokens.colorStatusSuccessBackground2 },
  [ProvisioningStatus.InProgress]: { color: tokens.colorCompoundBrandForeground1, backgroundColor: tokens.colorNeutralBackground3 },
  [ProvisioningStatus.Failed]: { color: tokens.colorStatusDangerForeground2, backgroundColor: tokens.colorStatusDangerBackground2 },
  [ProvisioningStatus.PartialFailure]: { color: tokens.colorStatusWarningForeground2, backgroundColor: tokens.colorStatusWarningBackground2 },
  [ProvisioningStatus.Queued]: { color: tokens.colorNeutralForeground3, backgroundColor: tokens.colorNeutralBackground3 },
  [ProvisioningStatus.Compensating]: { color: tokens.colorPaletteDarkOrangeForeground1, backgroundColor: tokens.colorPaletteDarkOrangeBackground1 },
};

const SYNC_STATUS_COLORS: Record<TemplateSyncStatus, { color: string; backgroundColor: string }> = {
  [TemplateSyncStatus.Success]: { color: tokens.colorStatusSuccessForeground2, backgroundColor: tokens.colorStatusSuccessBackground2 },
  [TemplateSyncStatus.Syncing]: { color: tokens.colorCompoundBrandForeground1, backgroundColor: tokens.colorNeutralBackground3 },
  [TemplateSyncStatus.Failed]: { color: tokens.colorStatusDangerForeground2, backgroundColor: tokens.colorStatusDangerBackground2 },
  [TemplateSyncStatus.Idle]: { color: tokens.colorNeutralForeground3, backgroundColor: tokens.colorNeutralBackground3 },
};

const useStyles = makeStyles({
  container: {
    ...shorthands.padding('16px', '0'),
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    ...shorthands.gap('16px'),
    marginBottom: '24px',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    marginBottom: '16px',
  },
  progressText: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  stepperToggle: {
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap('4px'),
    fontSize: '12px',
    color: tokens.colorBrandForeground1,
    ':hover': {
      textDecorationLine: 'underline',
    },
  },
  stepperContainer: {
    ...shorthands.padding('8px', '0'),
  },
  tabList: {
    marginBottom: '16px',
  },
  tabContent: {
    ...shorthands.padding('4px', '0'),
  },
  syncButton: {
    minWidth: 'auto',
  },
  drawerField: {
    marginBottom: '16px',
  },
  drawerActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    ...shorthands.gap('8px'),
    marginTop: '24px',
    ...shorthands.padding('16px', '0', '0'),
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
  },
  templateTableWrapper: {
    marginTop: '4px',
  },
});

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '\u2014';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/** Expandable cell with ProvisioningStatusStepper — dual-path via deprecated-disabled ProvisioningSaga gate. */
const ProvisioningProgressCell: React.FC<{ log: IProvisioningLog }> = ({ log }) => {
  const styles = useStyles();
  const [expanded, setExpanded] = React.useState(false);
  const provisioningStatus = useProvisioningStatus(
    log.status === ProvisioningStatus.InProgress || log.status === ProvisioningStatus.Compensating
      ? log.projectCode
      : undefined
  );

  const completedSteps = React.useMemo(() => {
    // Build completed steps array from the log's completedSteps count
    const steps: number[] = [];
    for (let i = 1; i <= (provisioningStatus.status !== 'idle' ? provisioningStatus.currentStep : log.completedSteps); i++) {
      if (i !== log.failedStep) steps.push(i);
    }
    return steps;
  }, [log.completedSteps, log.failedStep, provisioningStatus.status, provisioningStatus.currentStep]);

  const stepStatus = provisioningStatus.status !== 'idle'
    ? provisioningStatus.stepStatus
    : log.status === ProvisioningStatus.Completed ? 'completed'
    : log.status === ProvisioningStatus.Failed ? 'failed'
    : 'pending';

  return (
    <div>
      <span
        className={styles.stepperToggle}
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpanded(!expanded); }}
        aria-expanded={expanded}
      >
        {log.completedSteps} / 7 steps {expanded ? '\u25B2' : '\u25BC'}
      </span>
      {expanded && (
        <div className={styles.stepperContainer}>
          <ProvisioningStatusStepper
            currentStep={provisioningStatus.status !== 'idle' ? provisioningStatus.currentStep : log.currentStep}
            completedSteps={completedSteps}
            failedStep={log.failedStep}
            stepStatus={stepStatus}
            compensationResults={log.compensationLog}
          />
        </div>
      )}
    </div>
  );
};

// ─── Site Templates Tab ───────────────────────────────────────────────────────

interface ITemplateFormState {
  Title: SiteTemplateType;
  TemplateSiteUrl: string;
  ProjectTypeId: number | null;
  GitRepoUrl: string;
  IsActive: boolean;
  Description: string;
}

const EMPTY_FORM: ITemplateFormState = {
  Title: 'Default',
  TemplateSiteUrl: '',
  ProjectTypeId: null,
  GitRepoUrl: '',
  IsActive: true,
  Description: '',
};

const SiteTemplatesTab: React.FC = () => {
  const styles = useStyles();
  const { dataService, currentUser } = useAppContext();
  const { addToast } = useToast();

  const [templates, setTemplates] = React.useState<ISiteTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<ISiteTemplate | null>(null);
  const [syncingId, setSyncingId] = React.useState<number | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<ITemplateFormState>(EMPTY_FORM);

  const fetchTemplates = React.useCallback(async () => {
    try {
      const data = await dataService.getSiteTemplates();
      setTemplates(data);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [dataService]);

  React.useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  const activeCount = React.useMemo(() => templates.filter(t => t.IsActive).length, [templates]);
  const lastSynced = React.useMemo(() => {
    const synced = templates
      .filter(t => t.LastSynced)
      .sort((a, b) => new Date(b.LastSynced!).getTime() - new Date(a.LastSynced!).getTime());
    return synced.length > 0 ? formatDate(synced[0].LastSynced) : '\u2014';
  }, [templates]);

  const handleSync = React.useCallback(async (template: ISiteTemplate) => {
    setSyncingId(template.id);
    try {
      const result = await dataService.syncTemplateToGitOps(template.id);
      if (result.success) {
        addToast(`Template "${template.Title}" synced successfully.${result.prUrl ? ` PR: ${result.prUrl}` : ''}`, 'success');
      } else {
        addToast(`Sync failed for "${template.Title}": ${result.error || 'Unknown error'}`, 'error');
      }
      await fetchTemplates();
    } catch {
      addToast(`Failed to sync template "${template.Title}".`, 'error');
    } finally {
      setSyncingId(null);
    }
  }, [dataService, addToast, fetchTemplates]);

  const handleOpenAdd = React.useCallback(() => {
    setEditingTemplate(null);
    setForm(EMPTY_FORM);
    setDrawerOpen(true);
  }, []);

  const handleOpenEdit = React.useCallback((template: ISiteTemplate) => {
    setEditingTemplate(template);
    setForm({
      Title: template.Title,
      TemplateSiteUrl: template.TemplateSiteUrl,
      ProjectTypeId: template.ProjectTypeId,
      GitRepoUrl: template.GitRepoUrl,
      IsActive: template.IsActive,
      Description: template.Description || '',
    });
    setDrawerOpen(true);
  }, []);

  const handleSave = React.useCallback(async () => {
    setSaving(true);
    try {
      if (editingTemplate) {
        await dataService.updateSiteTemplate(editingTemplate.id, {
          Title: form.Title,
          TemplateSiteUrl: form.TemplateSiteUrl,
          ProjectTypeId: form.ProjectTypeId,
          GitRepoUrl: form.GitRepoUrl,
          IsActive: form.IsActive,
          Description: form.Description || undefined,
        });
        addToast(`Template "${form.Title}" updated.`, 'success');
      } else {
        await dataService.createSiteTemplate({
          Title: form.Title,
          TemplateSiteUrl: form.TemplateSiteUrl,
          ProjectTypeId: form.ProjectTypeId,
          GitRepoUrl: form.GitRepoUrl,
          LastSynced: null,
          SyncStatus: TemplateSyncStatus.Idle,
          IsActive: form.IsActive,
          Description: form.Description || undefined,
          CreatedBy: currentUser?.email || 'unknown',
          ModifiedAt: new Date().toISOString(),
        });
        addToast(`Template "${form.Title}" created.`, 'success');
      }
      setDrawerOpen(false);
      await fetchTemplates();
    } catch {
      addToast(`Failed to save template.`, 'error');
    } finally {
      setSaving(false);
    }
  }, [editingTemplate, form, dataService, currentUser, addToast, fetchTemplates]);

  const handleCloseDrawer = React.useCallback(() => {
    setDrawerOpen(false);
    setEditingTemplate(null);
  }, []);

  const templateColumns = React.useMemo((): IHbcTanStackTableColumn<ISiteTemplate>[] => [
    {
      key: 'Title',
      header: 'Template Name',
      render: (row) => row.Title,
      sortable: true,
    },
    {
      key: 'SyncStatus',
      header: 'Sync Status',
      render: (row) => {
        const colors = SYNC_STATUS_COLORS[row.SyncStatus] || SYNC_STATUS_COLORS[TemplateSyncStatus.Idle];
        return (
          <StatusBadge
            label={row.SyncStatus}
            color={colors.color}
            backgroundColor={colors.backgroundColor}
          />
        );
      },
    },
    {
      key: 'IsActive',
      header: 'Active',
      render: (row) => row.IsActive ? 'Yes' : 'No',
    },
    {
      key: 'LastSynced',
      header: 'Last Synced',
      render: (row) => formatDate(row.LastSynced),
      sortable: true,
    },
    {
      key: 'TemplateSiteUrl',
      header: 'Template Site',
      render: (row) => row.TemplateSiteUrl ? row.TemplateSiteUrl.replace(/^https?:\/\/[^/]+/, '') : '\u2014',
      hideOnMobile: true,
    },
  ], []);

  const renderRowActions = React.useCallback((row: ISiteTemplate) => (
    <div style={{ display: 'flex', gap: '8px' }}>
      <HbcButton onClick={() => handleOpenEdit(row)}>
        Edit
      </HbcButton>
      <HbcButton
        className={styles.syncButton}
        isLoading={syncingId === row.id}
        onClick={() => handleSync(row)}
        data-testid={`sync-button-${row.id}`}
      >
        {syncingId === row.id ? <Spinner size="tiny" /> : 'Sync'}
      </HbcButton>
    </div>
  ), [handleOpenEdit, handleSync, syncingId, styles.syncButton]);

  if (loading) {
    return (
      <div className={styles.tabContent}>
        <HbcSkeleton variant="kpi-grid" columns={3} />
        <HbcSkeleton variant="table" rows={4} />
      </div>
    );
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.kpiGrid}>
        <KPICard title="Total Templates" value={templates.length} />
        <KPICard title="Active" value={activeCount} />
        <KPICard title="Last Synced" value={lastSynced} />
      </div>

      <div className={styles.toolbar}>
        <HbcButton emphasis="strong" onClick={handleOpenAdd}>
          Add Template
        </HbcButton>
      </div>

      <div className={styles.templateTableWrapper} data-testid="site-templates-table">
        <HbcTanStackTable<ISiteTemplate>
          columns={templateColumns}
          items={templates}
          keyExtractor={(row) => row.id}
          ariaLabel="Site Templates"
          rowActions={renderRowActions}
        />
      </div>

      <SlideDrawer
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        title={editingTemplate ? `Edit Template: ${editingTemplate.Title}` : 'Add Site Template'}
      >
        <div data-testid="template-edit-drawer">
          <Field label="Template Type" className={styles.drawerField}>
            <Dropdown
              value={form.Title}
              selectedOptions={[form.Title]}
              onOptionSelect={(_, data) => setForm(prev => ({ ...prev, Title: (data.optionValue || 'Default') as SiteTemplateType }))}
            >
              <Option value="Default">Default</Option>
              <Option value="Commercial">Commercial</Option>
              <Option value="Luxury Residential">Luxury Residential</Option>
            </Dropdown>
          </Field>

          <Field label="Template Site URL" className={styles.drawerField}>
            <input
              type="text"
              value={form.TemplateSiteUrl}
              onChange={(e) => setForm(prev => ({ ...prev, TemplateSiteUrl: e.target.value }))}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: `1px solid ${tokens.colorNeutralStroke1}` }}
            />
          </Field>

          <Field label="Git Repository URL" className={styles.drawerField}>
            <input
              type="text"
              value={form.GitRepoUrl}
              onChange={(e) => setForm(prev => ({ ...prev, GitRepoUrl: e.target.value }))}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: `1px solid ${tokens.colorNeutralStroke1}` }}
            />
          </Field>

          <Field label="Project Type ID" className={styles.drawerField}>
            <input
              type="number"
              value={form.ProjectTypeId ?? ''}
              onChange={(e) => setForm(prev => ({ ...prev, ProjectTypeId: e.target.value ? Number(e.target.value) : null }))}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: `1px solid ${tokens.colorNeutralStroke1}` }}
              placeholder="Optional"
            />
          </Field>

          <Field label="Description" className={styles.drawerField}>
            <Textarea
              value={form.Description}
              onChange={(_, data) => setForm(prev => ({ ...prev, Description: data.value }))}
              rows={3}
              resize="vertical"
            />
          </Field>

          <Field label="Active" className={styles.drawerField}>
            <Switch
              checked={form.IsActive}
              onChange={(_, data) => setForm(prev => ({ ...prev, IsActive: data.checked }))}
            />
          </Field>

          <div className={styles.drawerActions}>
            <HbcButton onClick={handleCloseDrawer}>Cancel</HbcButton>
            <HbcButton emphasis="strong" onClick={handleSave} isLoading={saving}>
              {editingTemplate ? 'Save Changes' : 'Create Template'}
            </HbcButton>
          </div>
        </div>
      </SlideDrawer>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const ProvisioningPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, currentUser } = useAppContext();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = React.useState<ProvisioningTab>('logs');
  const [summary, setSummary] = React.useState<IProvisioningSummary | null>(null);
  const [logs, setLogs] = React.useState<IProvisioningLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [retryingCode, setRetryingCode] = React.useState<string | null>(null);

  const handleTabSelect = React.useCallback((_event: SelectTabEvent, data: SelectTabData): void => {
    setActiveTab(data.value as ProvisioningTab);
  }, []);

  const fetchData = React.useCallback(() => {
    const summaryPromise = dataService.getProvisioningSummary()
      .then(result => setSummary(result))
      .catch(() => setSummary(null));

    const logsPromise = dataService.getProvisioningLogs()
      .then(result => setLogs(result))
      .catch(() => setLogs([]));

    Promise.all([summaryPromise, logsPromise])
      .finally(() => setLoading(false));
  }, [dataService]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh polling when any entries are in-progress
  React.useEffect(() => {
    const hasInProgress = logs.some(
      log => log.status === ProvisioningStatus.InProgress || log.status === ProvisioningStatus.Queued
    );
    if (!hasInProgress) return;

    const intervalId = window.setInterval(() => {
      dataService.getProvisioningLogs()
        .then(result => setLogs(result))
        .catch(() => { /* ignore polling errors */ });
      dataService.getProvisioningSummary()
        .then(result => setSummary(result))
        .catch(() => { /* ignore polling errors */ });
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [logs, dataService]);

  const handleRetry = React.useCallback(async (log: IProvisioningLog) => {
    setRetryingCode(log.projectCode);
    try {
      await dataService.retryProvisioning(log.projectCode, log.failedStep ?? 1);
      await dataService.logAudit({
        Action: AuditAction.SiteProvisioningTriggered,
        EntityType: EntityType.Project,
        EntityId: log.projectCode,
        User: currentUser?.email || 'unknown',
        Details: JSON.stringify({ action: 'retry', fromStep: log.failedStep }),
      });
      addToast(`Retry triggered for ${log.projectCode}.`, 'success');
      fetchData();
    } catch {
      addToast(`Failed to retry provisioning for ${log.projectCode}.`, 'error');
    } finally {
      setRetryingCode(null);
    }
  }, [dataService, currentUser, addToast, fetchData]);

  const columns = React.useMemo((): IHbcDataTableColumn<IProvisioningLog>[] => [
    {
      key: 'projectCode',
      header: 'Project Code',
      render: (row) => row.projectCode,
    },
    {
      key: 'projectName',
      header: 'Project Name',
      render: (row) => row.projectName || '\u2014',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const colors = STATUS_COLORS[row.status] || STATUS_COLORS[ProvisioningStatus.Queued];
        return (
          <StatusBadge
            label={row.status}
            color={colors.color}
            backgroundColor={colors.backgroundColor}
          />
        );
      },
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (row) => (
        <FeatureGate
          featureName="ProvisioningSaga"
          fallback={
            <span className={styles.progressText}>
              {row.completedSteps} / 7 steps
            </span>
          }
        >
          <ProvisioningProgressCell log={row} />
        </FeatureGate>
      ),
    },
    {
      key: 'errorMessage',
      header: 'Error',
      render: (row) => row.errorMessage || '\u2014',
    },
    {
      key: 'requestedAt',
      header: 'Requested',
      render: (row) => formatDate(row.requestedAt),
    },
  ], [styles]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Site Provisioning" />
        <div className={styles.container}>
          <HbcSkeleton variant="kpi-grid" columns={4} />
          <HbcSkeleton variant="table" rows={6} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Site Provisioning"
        subtitle="Monitor and manage SharePoint site provisioning operations."
        actions={
          <HbcButton emphasis="strong" onClick={fetchData}>
            Refresh
          </HbcButton>
        }
      />
      <div className={styles.container}>
        <TabList
          className={styles.tabList}
          selectedValue={activeTab}
          onTabSelect={handleTabSelect}
        >
          <Tab value="logs">Provisioning Logs</Tab>
          <Tab value="templates" data-testid="site-templates-tab">
            Site Templates
          </Tab>
        </TabList>

        {activeTab === 'logs' && (
          <div className={styles.tabContent}>
            <div className={styles.kpiGrid}>
              <KPICard
                title="Total Provisioned"
                value={summary?.totalProvisioned ?? 0}
              />
              <KPICard
                title="In Progress"
                value={summary?.inProgress ?? 0}
              />
              <KPICard
                title="Failed"
                value={summary?.failed ?? 0}
              />
              <KPICard
                title="Avg Duration"
                value={summary?.averageDurationMs ? formatDuration(summary.averageDurationMs) : '\u2014'}
                subtitle={summary?.lastProvisionedAt ? `Last: ${formatDate(summary.lastProvisionedAt)}` : undefined}
              />
            </div>

            <HbcDataTable
              tableId="admin-provisioning"
              columns={columns}
              items={logs}
              isLoading={loading}
              keyExtractor={(row) => String(row.id)}
              rowActions={(row) =>
                row.status === ProvisioningStatus.Failed || row.status === ProvisioningStatus.PartialFailure ? (
                  <HbcButton
                    isLoading={retryingCode === row.projectCode}
                    onClick={() => handleRetry(row)}
                  >
                    Retry
                  </HbcButton>
                ) : null
              }
            />
          </div>
        )}

        {activeTab === 'templates' && (
          <FeatureGate featureName="SiteTemplateManagement">
            <SiteTemplatesTab />
          </FeatureGate>
        )}
      </div>
    </div>
  );
};

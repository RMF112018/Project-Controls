import {
  buildBreadcrumbs,
  FeatureFlagCategory,
  ProvisioningService,
  MockHubNavigationService,
  MockDataService,
  AssignmentType,
  ISectorDefinition,
  formatDateTime,
  PERMISSIONS,
  IRole,
  IFeatureFlag,
  IAuditEntry,
  IProvisioningLog,
  ProvisioningStatus,
  RoleName,
  AuditAction,
  EntityType
} from '@hbc/sp-services';
import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@fluentui/react-components';
import { useAppContext } from '../../contexts/AppContext';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import { DataTable, IDataTableColumn } from '../../shared/DataTable';
import { StatusBadge } from '../../shared/StatusBadge';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { ExportButtons } from '../../shared/ExportButtons';
import { ProvisioningStatusView } from '../../shared/ProvisioningStatus';
import { RoleGate } from '../../guards/RoleGate';
import { CollapsibleSection } from '../../shared/CollapsibleSection';
import { FeatureGate } from '../../guards/FeatureGate';
import { WorkflowDefinitionsPanel } from './WorkflowDefinitionsPanel';
import { PermissionTemplateEditor } from './PermissionTemplateEditor';
import { ProjectAssignmentsPanel } from './ProjectAssignmentsPanel';
import { useTabFromUrl } from '../../hooks/useTabFromUrl';
import { useSectorDefinitions } from '../../hooks/useSectorDefinitions';
import { useAssignmentMappings } from '../../hooks/useAssignmentMappings';
import { HBC_COLORS, SPACING } from '../../../theme/tokens';

const TAB_KEYS = ['connections', 'roles', 'flags', 'provisioning', 'workflows', 'permissions', 'sectors', 'assignments', 'devUsers', 'audit'] as const;
type AdminTab = typeof TAB_KEYS[number];
const TAB_LABELS: Record<AdminTab, string> = {
  connections: 'Connections',
  roles: 'Roles',
  flags: 'Feature Flags',
  provisioning: 'Provisioning',
  workflows: 'Workflows',
  permissions: 'Permissions',
  sectors: 'Sectors',
  assignments: 'Assignments',
  devUsers: 'Dev Users',
  audit: 'Audit Log',
};

interface IConnectionEntry {
  id: number;
  name: string;
  status: 'Connected' | 'Disconnected' | 'Unknown';
  lastTested: string | null;
}

const INITIAL_CONNECTIONS: IConnectionEntry[] = [
  { id: 1, name: 'SharePoint Lists', status: 'Unknown', lastTested: null },
  { id: 2, name: 'Graph API', status: 'Unknown', lastTested: null },
  { id: 3, name: 'PnP Provisioning', status: 'Unknown', lastTested: null },
  { id: 4, name: 'Power Automate', status: 'Unknown', lastTested: null },
  { id: 5, name: 'Azure Functions', status: 'Unknown', lastTested: null },
];

// Client-side error buffer (last 50)
interface IClientError {
  id: number;
  timestamp: string;
  message: string;
  source: string;
}

class ErrorBuffer {
  private errors: IClientError[] = [];
  private nextId = 1;
  private maxSize = 50;

  capture(message: string, source: string): void {
    this.errors.unshift({
      id: this.nextId++,
      timestamp: new Date().toISOString(),
      message,
      source,
    });
    if (this.errors.length > this.maxSize) {
      this.errors.pop();
    }
  }

  getErrors(): IClientError[] {
    return [...this.errors];
  }

  clear(): void {
    this.errors = [];
  }
}

const errorBuffer = new ErrorBuffer();

// Install global error handler
if (typeof window !== 'undefined') {
  const originalOnError = window.onerror;
  window.onerror = (message, source, _line, _col, _error) => {
    errorBuffer.capture(String(message), String(source || 'unknown'));
    if (originalOnError) {
      return (originalOnError as (...args: unknown[]) => boolean)(message, source, _line, _col, _error);
    }
    return false;
  };
}

function getStatusBadgeColor(status: ProvisioningStatus): string {
  switch (status) {
    case ProvisioningStatus.Completed: return HBC_COLORS.success;
    case ProvisioningStatus.InProgress: return HBC_COLORS.info;
    case ProvisioningStatus.Queued: return HBC_COLORS.gray400;
    case ProvisioningStatus.PartialFailure:
    case ProvisioningStatus.Failed: return HBC_COLORS.error;
    default: return HBC_COLORS.gray400;
  }
}

export const AdminPanel: React.FC = () => {
  const location = useLocation();
  const breadcrumbs = buildBreadcrumbs(location.pathname);
  const { dataService, currentUser, hasPermission, isFeatureEnabled } = useAppContext();
  const [activeTab, setActiveTab] = useTabFromUrl<AdminTab>('connections', TAB_KEYS);

  // -- Connection Testing state --
  const [connections, setConnections] = React.useState<IConnectionEntry[]>(INITIAL_CONNECTIONS);
  const [testingId, setTestingId] = React.useState<number | null>(null);

  // -- Roles state --
  const [roles, setRoles] = React.useState<IRole[]>([]);
  const [rolesLoading, setRolesLoading] = React.useState(false);

  // -- Feature Flags state --
  const [flags, setFlags] = React.useState<IFeatureFlag[]>([]);
  const [flagsLoading, setFlagsLoading] = React.useState(false);
  const [togglingFlag, setTogglingFlag] = React.useState<number | null>(null);

  // -- Hub Site URL state --
  const [hubSiteUrl, setHubSiteUrl] = React.useState('');
  const [hubSiteUrlLoading, setHubSiteUrlLoading] = React.useState(false);
  const [hubSiteUrlSaving, setHubSiteUrlSaving] = React.useState(false);
  const [hubSiteUrlTesting, setHubSiteUrlTesting] = React.useState(false);
  const [hubSiteUrlTestResult, setHubSiteUrlTestResult] = React.useState<'success' | 'failed' | null>(null);
  const [hubSiteUrlSaveResult, setHubSiteUrlSaveResult] = React.useState<'success' | 'failed' | null>(null);

  // -- Provisioning state --
  const [logs, setLogs] = React.useState<IProvisioningLog[]>([]);
  const [provLoading, setProvLoading] = React.useState(false);
  const [retrying, setRetrying] = React.useState<string | null>(null);
  const [retryingNavLink, setRetryingNavLink] = React.useState<string | null>(null);
  const [expandedCode, setExpandedCode] = React.useState<string | null>(null);

  // -- Audit Log state --
  const [auditEntries, setAuditEntries] = React.useState<IAuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = React.useState(false);
  const [auditEntityFilter, setAuditEntityFilter] = React.useState('All');
  const [auditActionFilter, setAuditActionFilter] = React.useState('All');
  const [auditStartDate, setAuditStartDate] = React.useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [auditEndDate, setAuditEndDate] = React.useState(() => new Date().toISOString().split('T')[0]);

  // -- Sectors state --
  const { sectors: sectorDefs, createSector: createSectorDef, updateSector: updateSectorDef, loading: sectorsLoading } = useSectorDefinitions();
  const [newSectorLabel, setNewSectorLabel] = React.useState('');

  // -- Assignment Mappings state --
  const { mappings: assignmentMappings, fetchMappings: fetchAssignmentMappings, createMapping, deleteMapping } = useAssignmentMappings();
  const [newMappingRegion, setNewMappingRegion] = React.useState('');
  const [newMappingSector, setNewMappingSector] = React.useState('');
  const [newMappingType, setNewMappingType] = React.useState<AssignmentType>('Director');
  const [newMappingName, setNewMappingName] = React.useState('');
  const [newMappingEmail, setNewMappingEmail] = React.useState('');
  const [assignmentMappingsLoaded, setAssignmentMappingsLoaded] = React.useState(false);

  // -- Dev Users state --
  const [devUsers, setDevUsers] = React.useState<Array<{ id: number; displayName: string; email: string; roles: string[]; region: string; department: string }>>([]);
  const [editingUserId, setEditingUserId] = React.useState<number | null>(null);
  const [editingRoles, setEditingRoles] = React.useState<string[]>([]);

  const hubNavService = React.useMemo(() => new MockHubNavigationService(), []);
  const provisioningService = React.useMemo(
    () => new ProvisioningService(dataService, hubNavService, undefined, undefined, false, isFeatureEnabled('ProvisioningRealOps')),
    [dataService, hubNavService, isFeatureEnabled]
  );

  // Load hub site URL on mount
  React.useEffect(() => {
    setHubSiteUrlLoading(true);
    dataService.getHubSiteUrl()
      .then(url => setHubSiteUrl(url))
      .catch(console.error)
      .finally(() => setHubSiteUrlLoading(false));
  }, [dataService]);

  // Load data based on active tab
  React.useEffect(() => {
    if (activeTab === 'roles' && roles.length === 0) {
      setRolesLoading(true);
      dataService.getRoles().then(setRoles).catch(console.error).finally(() => setRolesLoading(false));
    } else if (activeTab === 'flags' && flags.length === 0) {
      setFlagsLoading(true);
      dataService.getFeatureFlags().then(setFlags).catch(console.error).finally(() => setFlagsLoading(false));
    } else if (activeTab === 'provisioning' && logs.length === 0) {
      setProvLoading(true);
      dataService.getProvisioningLogs().then(setLogs).catch(console.error).finally(() => setProvLoading(false));
    } else if (activeTab === 'audit' && auditEntries.length === 0) {
      setAuditLoading(true);
      dataService.getAuditLog(undefined, undefined, auditStartDate, auditEndDate)
        .then(setAuditEntries).catch(console.error).finally(() => setAuditLoading(false));
    }
  }, [activeTab, dataService, roles.length, flags.length, logs.length, auditEntries.length, auditStartDate, auditEndDate]);

  // Provisioning polling
  React.useEffect(() => {
    if (activeTab !== 'provisioning') return;
    const hasActive = logs.some(l => l.status === ProvisioningStatus.InProgress || l.status === ProvisioningStatus.Queued);
    if (!hasActive) return;
    const interval = setInterval(() => {
      dataService.getProvisioningLogs().then(setLogs).catch(console.error);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTab, logs, dataService]);

  // -- Handlers --
  const handleTestConnection = async (id: number): Promise<void> => {
    setTestingId(id);
    await new Promise(resolve => setTimeout(resolve, 500));
    setConnections(prev => prev.map(c =>
      c.id === id ? { ...c, status: 'Connected', lastTested: new Date().toISOString() } : c
    ));
    setTestingId(null);
  };

  const handleTestAll = async (): Promise<void> => {
    for (const conn of connections) {
      await handleTestConnection(conn.id);
    }
  };

  const handleToggleFlag = async (flag: IFeatureFlag): Promise<void> => {
    const action = flag.Enabled ? 'disable' : 'enable';
    const confirmed = window.confirm(`Are you sure you want to ${action} "${flag.DisplayName}"?`);
    if (!confirmed) return;
    setTogglingFlag(flag.id);
    try {
      const updated = await dataService.updateFeatureFlag(flag.id, { Enabled: !flag.Enabled });
      setFlags(prev => prev.map(f => f.id === flag.id ? updated : f));
      dataService.logAudit({
        Action: AuditAction.ConfigFeatureFlagChanged,
        EntityType: EntityType.Config,
        EntityId: String(flag.id),
        FieldChanged: 'Enabled',
        PreviousValue: String(flag.Enabled),
        NewValue: String(!flag.Enabled),
        User: currentUser?.displayName || 'Unknown',
        UserId: currentUser?.id,
        Details: `Feature flag "${flag.DisplayName}" ${!flag.Enabled ? 'enabled' : 'disabled'}`,
      }).catch(console.error);
    } catch (err) {
      console.error('Failed to toggle flag:', err);
    } finally {
      setTogglingFlag(null);
    }
  };

  const handleRetry = async (log: IProvisioningLog): Promise<void> => {
    const fromStep = log.failedStep ?? log.completedSteps + 1;
    setRetrying(log.projectCode);
    try {
      await provisioningService.retryFromStep(log.projectCode, fromStep);
      const updated = await dataService.getProvisioningLogs();
      setLogs(updated);
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setRetrying(null);
    }
  };

  const handleTestHubSiteUrl = async (): Promise<void> => {
    setHubSiteUrlTesting(true);
    setHubSiteUrlTestResult(null);
    await new Promise(resolve => setTimeout(resolve, 500));
    setHubSiteUrlTestResult(hubSiteUrl.startsWith('https://') ? 'success' : 'failed');
    setHubSiteUrlTesting(false);
  };

  const handleSaveHubSiteUrl = async (): Promise<void> => {
    setHubSiteUrlSaving(true);
    setHubSiteUrlSaveResult(null);
    try {
      await dataService.setHubSiteUrl(hubSiteUrl);
      setHubSiteUrlSaveResult('success');
      dataService.logAudit({
        Action: AuditAction.HubSiteUrlUpdated,
        EntityType: EntityType.Config,
        EntityId: 'HUB_SITE_URL',
        User: currentUser?.displayName || 'Unknown',
        Details: `Hub site URL updated to "${hubSiteUrl}"`,
      }).catch(console.error);
    } catch {
      setHubSiteUrlSaveResult('failed');
    } finally {
      setHubSiteUrlSaving(false);
    }
  };

  const handleRetryNavLink = async (log: IProvisioningLog): Promise<void> => {
    setRetryingNavLink(log.projectCode);
    try {
      await provisioningService.retryHubNavLink(log.projectCode, currentUser?.displayName || 'Unknown');
      const updated = await dataService.getProvisioningLogs();
      setLogs(updated);
    } catch (err) {
      console.error('Nav link retry failed:', err);
    } finally {
      setRetryingNavLink(null);
    }
  };

  const refreshAudit = async (): Promise<void> => {
    setAuditLoading(true);
    try {
      const entries = await dataService.getAuditLog(undefined, undefined, auditStartDate, auditEndDate);
      setAuditEntries(entries);
    } finally {
      setAuditLoading(false);
    }
  };

  // -- Column defs --
  const connectionColumns: IDataTableColumn<IConnectionEntry>[] = [
    { key: 'name', header: 'Service', render: (c) => <span style={{ fontWeight: 500, color: HBC_COLORS.navy }}>{c.name}</span> },
    { key: 'status', header: 'Status', width: '120px', render: (c) => {
      const color = c.status === 'Connected' ? '#065F46' : c.status === 'Disconnected' ? '#991B1B' : HBC_COLORS.gray500;
      const bg = c.status === 'Connected' ? HBC_COLORS.successLight : c.status === 'Disconnected' ? HBC_COLORS.errorLight : HBC_COLORS.gray100;
      return <StatusBadge label={c.status} color={color} backgroundColor={bg} />;
    }},
    { key: 'lastTested', header: 'Last Tested', width: '160px', render: (c) => c.lastTested ? formatDateTime(c.lastTested) : '-' },
    { key: 'actions', header: '', width: '80px', render: (c) => (
      <Button size="small" appearance="subtle" disabled={testingId === c.id} onClick={() => { handleTestConnection(c.id).catch(console.error); }}>
        {testingId === c.id ? '...' : 'Test'}
      </Button>
    )},
  ];

  const roleColumns: IDataTableColumn<IRole>[] = [
    { key: 'Title', header: 'Role Name', render: (r) => <span style={{ fontWeight: 500, color: HBC_COLORS.navy }}>{r.Title}</span> },
    { key: 'Users', header: 'Users', width: '200px', render: (r) => r.UserOrGroup.join(', ') || '-' },
    { key: 'Permissions', header: 'Permissions', width: '100px', render: (r) => <span>{r.Permissions.length}</span> },
    { key: 'IsActive', header: 'Active', width: '80px', render: (r) => (
      <span style={{
        display: 'inline-block',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: r.IsActive ? HBC_COLORS.success : HBC_COLORS.gray300,
      }} />
    )},
  ];

  const flagColumns: IDataTableColumn<IFeatureFlag>[] = [
    { key: 'DisplayName', header: 'Feature', render: (f) => <span style={{ fontWeight: 500, color: HBC_COLORS.navy }}>{f.DisplayName}</span> },
    { key: 'Enabled', header: 'Enabled', width: '80px', render: (f) => (
      <button
        onClick={(e) => { e.stopPropagation(); handleToggleFlag(f).catch(console.error); }}
        disabled={togglingFlag === f.id}
        style={{
          width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer',
          backgroundColor: f.Enabled ? HBC_COLORS.success : HBC_COLORS.gray300,
          position: 'relative', transition: 'background-color 0.2s',
        }}
      >
        <span style={{
          display: 'block', width: '16px', height: '16px', borderRadius: '50%',
          backgroundColor: '#fff', position: 'absolute', top: '3px',
          left: f.Enabled ? '21px' : '3px', transition: 'left 0.2s',
        }} />
      </button>
    )},
    { key: 'TargetDate', header: 'Target Date', width: '110px', render: (f) => f.TargetDate || '-' },
    { key: 'Notes', header: 'Notes', width: '200px', render: (f) => (
      <span style={{ fontSize: '12px', color: HBC_COLORS.gray500 }}>{f.Notes || '-'}</span>
    )},
  ];

  const provColumns: IDataTableColumn<IProvisioningLog>[] = [
    { key: 'projectCode', header: 'Project Code', width: '120px', render: (item) => (
      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: HBC_COLORS.navy }}>{item.projectCode}</span>
    )},
    { key: 'projectName', header: 'Project Name', width: '200px', render: (item) => item.projectName },
    { key: 'status', header: 'Status', width: '130px', render: (item) => (
      <span style={{
        display: 'inline-block', padding: '2px 8px', borderRadius: '10px',
        fontSize: '11px', fontWeight: 600, color: HBC_COLORS.white,
        backgroundColor: getStatusBadgeColor(item.status),
      }}>
        {item.status}
      </span>
    )},
    { key: 'progress', header: 'Progress', width: '100px', render: (item) => `${item.completedSteps}/7 steps` },
    { key: 'error', header: 'Error', width: '200px', render: (item) => (
      item.errorMessage ? (
        <span
          title={item.errorMessage}
          style={{ fontSize: '12px', color: HBC_COLORS.error, cursor: 'pointer', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '190px' }}
          onClick={(e) => { e.stopPropagation(); void navigator.clipboard.writeText(item.errorMessage || ''); }}
        >
          {item.failedStep ? `Step ${item.failedStep}: ` : ''}{item.errorMessage}
        </span>
      ) : (
        <span style={{ fontSize: '12px', color: HBC_COLORS.gray400 }}>-</span>
      )
    )},
    { key: 'requestedAt', header: 'Requested', width: '160px', render: (item) => formatDateTime(item.requestedAt) },
    { key: 'navLink', header: 'Nav Link', width: '100px', render: (item) => {
      const status = item.hubNavLinkStatus;
      if (!status || status === 'not_applicable') return <span style={{ color: HBC_COLORS.gray400 }}>-</span>;
      const color = status === 'success' ? '#065F46' : '#991B1B';
      const bg = status === 'success' ? HBC_COLORS.successLight : HBC_COLORS.errorLight;
      return <StatusBadge label={status === 'success' ? 'Success' : 'Failed'} color={color} backgroundColor={bg} />;
    }},
    { key: 'actions', header: '', width: '160px', render: (item) => {
      const canRetry = item.status === ProvisioningStatus.Failed || item.status === ProvisioningStatus.PartialFailure;
      const canRetryNav = item.status === ProvisioningStatus.Completed && item.hubNavLinkStatus === 'failed';
      return (
        <div style={{ display: 'flex', gap: '4px' }}>
          {canRetry && (
            <Button size="small" appearance="primary" style={{ backgroundColor: HBC_COLORS.orange, fontSize: '11px' }}
              disabled={retrying === item.projectCode}
              onClick={(e) => { e.stopPropagation(); handleRetry(item).catch(console.error); }}
            >
              {retrying === item.projectCode ? 'Retrying...' : 'Retry'}
            </Button>
          )}
          {canRetryNav && (
            <Button size="small" appearance="subtle" style={{ fontSize: '11px' }}
              disabled={retryingNavLink === item.projectCode}
              onClick={(e) => { e.stopPropagation(); handleRetryNavLink(item).catch(console.error); }}
            >
              {retryingNavLink === item.projectCode ? '...' : 'Retry Nav'}
            </Button>
          )}
          <Button size="small" appearance="subtle"
            onClick={(e) => { e.stopPropagation(); setExpandedCode(expandedCode === item.projectCode ? null : item.projectCode); }}
          >
            {expandedCode === item.projectCode ? 'Hide' : 'Details'}
          </Button>
        </div>
      );
    }},
  ];

  // Feature flag grouping by category
  const CATEGORY_ORDER: FeatureFlagCategory[] = [
    'Core Platform',
    'Preconstruction',
    'Project Execution',
    'Infrastructure',
    'Integrations',
    'Debug',
  ];

  const groupedFlags = React.useMemo(() => {
    const groups = new Map<string, IFeatureFlag[]>();
    for (const cat of CATEGORY_ORDER) {
      groups.set(cat, []);
    }
    groups.set('Other', []);
    for (const f of flags) {
      const cat = f.Category && CATEGORY_ORDER.includes(f.Category) ? f.Category : 'Other';
      groups.get(cat)!.push(f);
    }
    // Remove empty groups
    const result: { category: string; items: IFeatureFlag[] }[] = [];
    for (const [category, items] of groups.entries()) {
      if (items.length > 0) result.push({ category, items });
    }
    return result;
  }, [flags]);

  // Audit log filtered entries
  const filteredAudit = React.useMemo(() => {
    return auditEntries
      .filter(e => auditEntityFilter === 'All' || e.EntityType === auditEntityFilter)
      .filter(e => auditActionFilter === 'All' || e.Action === auditActionFilter)
      .sort((a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime());
  }, [auditEntries, auditEntityFilter, auditActionFilter]);

  const auditColumns: IDataTableColumn<IAuditEntry>[] = [
    { key: 'Timestamp', header: 'Timestamp', sortable: true, width: '160px', render: (e) => (
      <span style={{ fontSize: '12px' }}>{formatDateTime(e.Timestamp)}</span>
    )},
    { key: 'User', header: 'User', width: '120px', render: (e) => e.User },
    { key: 'Action', header: 'Action', width: '160px', render: (e) => (
      <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{e.Action}</span>
    )},
    { key: 'EntityType', header: 'Entity', width: '80px', render: (e) => e.EntityType },
    { key: 'EntityId', header: 'ID', width: '60px', render: (e) => e.EntityId },
    { key: 'FieldChanged', header: 'Field', width: '100px', render: (e) => e.FieldChanged || '-' },
    { key: 'Change', header: 'Change', width: '160px', render: (e) => {
      if (!e.PreviousValue && !e.NewValue) return '-';
      return <span style={{ fontSize: '11px' }}>{e.PreviousValue || '(empty)'} → {e.NewValue || '(empty)'}</span>;
    }},
    { key: 'Details', header: 'Details', width: '200px', render: (e) => (
      <span style={{ fontSize: '12px', color: HBC_COLORS.gray500 }}>{e.Details}</span>
    )},
  ];

  const auditExportData = React.useMemo(() =>
    filteredAudit.map(e => ({
      Timestamp: e.Timestamp,
      User: e.User,
      Action: e.Action,
      EntityType: e.EntityType,
      EntityId: e.EntityId,
      FieldChanged: e.FieldChanged || '',
      PreviousValue: e.PreviousValue || '',
      NewValue: e.NewValue || '',
      Details: e.Details,
    })),
  [filteredAudit]);

  const tabStyle = (key: AdminTab): React.CSSProperties => ({
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: activeTab === key ? 600 : 400,
    color: activeTab === key ? HBC_COLORS.navy : HBC_COLORS.gray500,
    borderBottom: activeTab === key ? `3px solid ${HBC_COLORS.navy}` : '3px solid transparent',
    transition: 'all 0.2s',
  });

  const selectStyle: React.CSSProperties = {
    padding: '6px 10px', borderRadius: '6px', border: `1px solid ${HBC_COLORS.gray200}`,
    fontSize: '13px', backgroundColor: '#fff', color: HBC_COLORS.gray800,
  };

  return (
    <RoleGate
      allowedRoles={[RoleName.ExecutiveLeadership, RoleName.IDS]}
      fallback={
        <div style={{ padding: '48px', textAlign: 'center', color: HBC_COLORS.gray500 }}>
          <h3>Access Restricted</h3>
          <p>Admin panel is restricted to Executive Leadership and IDS roles.</p>
        </div>
      }
    >
      <PageHeader title="Admin Panel" subtitle="System administration and configuration" breadcrumb={<Breadcrumb items={breadcrumbs} />} />

      {/* Tab Bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${HBC_COLORS.gray200}`, marginBottom: '20px' }}>
        {TAB_KEYS.map((key) => {
          if (key === 'devUsers' && !isFeatureEnabled('DevUserManagement')) return null;
          return (
            <div key={key} style={tabStyle(key)} onClick={() => setActiveTab(key)}>
              {TAB_LABELS[key]}
            </div>
          );
        })}
      </div>

      {/* Tab 1: Connection Testing */}
      {activeTab === 'connections' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <Button appearance="primary" size="small" onClick={() => { handleTestAll().catch(console.error); }}>
              Test All
            </Button>
          </div>
          <DataTable<IConnectionEntry>
            columns={connectionColumns}
            items={connections}
            keyExtractor={c => c.id}
            emptyTitle="No connections configured"
          />

          {/* Client-side Error Log */}
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: HBC_COLORS.navy, margin: 0 }}>
                Client-Side Error Log (Last 50)
              </h3>
              <Button size="small" appearance="subtle" onClick={() => { errorBuffer.clear(); setConnections([...connections]); }}>
                Clear
              </Button>
            </div>
            {(() => {
              const errors = errorBuffer.getErrors();
              if (errors.length === 0) {
                return (
                  <div style={{ padding: '16px', textAlign: 'center', color: HBC_COLORS.gray400, backgroundColor: HBC_COLORS.gray50, borderRadius: '6px' }}>
                    No client-side errors captured.
                  </div>
                );
              }
              return (
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: '6px' }}>
                  {errors.map(err => (
                    <div key={err.id} style={{ padding: '8px 12px', borderBottom: `1px solid ${HBC_COLORS.gray100}`, fontSize: '12px' }}>
                      <span style={{ color: HBC_COLORS.gray400, marginRight: '8px' }}>{formatDateTime(err.timestamp)}</span>
                      <span style={{ color: HBC_COLORS.error }}>{err.message}</span>
                      <span style={{ color: HBC_COLORS.gray300, marginLeft: '8px' }}>({err.source})</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Hub Site URL Config */}
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: HBC_COLORS.navy, margin: '0 0 4px 0' }}>
              Hub Site URL
            </h3>
            <p style={{ fontSize: '13px', color: HBC_COLORS.gray500, margin: '0 0 12px 0' }}>
              The URL of the HB Central hub site. Used for adding project navigation links after provisioning.
            </p>
            {hubSiteUrlLoading ? (
              <LoadingSpinner label="Loading hub site URL..." size="small" />
            ) : (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={hubSiteUrl}
                  onChange={(e) => { setHubSiteUrl(e.target.value); setHubSiteUrlTestResult(null); setHubSiteUrlSaveResult(null); }}
                  style={{
                    flex: '1 1 300px', padding: '8px 12px', borderRadius: '6px',
                    border: `1px solid ${HBC_COLORS.gray200}`, fontSize: '13px',
                    fontFamily: 'monospace', color: HBC_COLORS.gray800,
                  }}
                  placeholder="https://tenant.sharepoint.com/sites/HBCentral"
                />
                <Button size="small" appearance="subtle"
                  disabled={hubSiteUrlTesting || !hubSiteUrl}
                  onClick={() => { handleTestHubSiteUrl().catch(console.error); }}
                >
                  {hubSiteUrlTesting ? 'Testing...' : 'Test'}
                </Button>
                <Button size="small" appearance="primary"
                  style={{ backgroundColor: HBC_COLORS.navy }}
                  disabled={hubSiteUrlSaving || !hubSiteUrl}
                  onClick={() => { handleSaveHubSiteUrl().catch(console.error); }}
                >
                  {hubSiteUrlSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
            {hubSiteUrlTestResult && (
              <div style={{
                marginTop: '8px', padding: '8px 12px', borderRadius: '6px', fontSize: '13px',
                backgroundColor: hubSiteUrlTestResult === 'success' ? HBC_COLORS.successLight : HBC_COLORS.errorLight,
                color: hubSiteUrlTestResult === 'success' ? '#065F46' : '#991B1B',
              }}>
                {hubSiteUrlTestResult === 'success' ? 'Connection test passed.' : 'Connection test failed. Verify the URL.'}
              </div>
            )}
            {hubSiteUrlSaveResult && (
              <div style={{
                marginTop: '8px', padding: '8px 12px', borderRadius: '6px', fontSize: '13px',
                backgroundColor: hubSiteUrlSaveResult === 'success' ? HBC_COLORS.successLight : HBC_COLORS.errorLight,
                color: hubSiteUrlSaveResult === 'success' ? '#065F46' : '#991B1B',
              }}>
                {hubSiteUrlSaveResult === 'success' ? 'Hub site URL saved successfully.' : 'Failed to save hub site URL.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Roles Management */}
      {activeTab === 'roles' && (
        hasPermission(PERMISSIONS.ADMIN_ROLES) ? (
          rolesLoading ? <SkeletonLoader variant="table" rows={5} columns={4} /> : (
            <DataTable<IRole>
              columns={roleColumns}
              items={roles}
              keyExtractor={r => r.id}
              emptyTitle="No roles configured"
            />
          )
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: HBC_COLORS.gray400 }}>
            You do not have permission to manage roles.
          </div>
        )
      )}

      {/* Tab 3: Feature Flags */}
      {activeTab === 'flags' && (
        hasPermission(PERMISSIONS.ADMIN_FLAGS) ? (
          flagsLoading ? <SkeletonLoader variant="table" rows={5} columns={4} /> : (
            <div>
              {groupedFlags.map(group => {
                const enabledCount = group.items.filter(f => f.Enabled).length;
                return (
                  <CollapsibleSection
                    key={group.category}
                    title={group.category}
                    badge={
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: enabledCount === group.items.length ? HBC_COLORS.success : HBC_COLORS.gray500,
                        backgroundColor: enabledCount === group.items.length ? HBC_COLORS.successLight : HBC_COLORS.gray100,
                        padding: '2px 8px',
                        borderRadius: '10px',
                      }}>
                        {enabledCount} of {group.items.length} enabled
                      </span>
                    }
                    defaultExpanded
                  >
                    <DataTable<IFeatureFlag>
                      columns={flagColumns}
                      items={group.items}
                      keyExtractor={f => f.id}
                      emptyTitle="No feature flags"
                    />
                  </CollapsibleSection>
                );
              })}
            </div>
          )
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: HBC_COLORS.gray400 }}>
            You do not have permission to manage feature flags.
          </div>
        )
      )}

      {/* Tab 4: Provisioning Queue */}
      {activeTab === 'provisioning' && (
        hasPermission(PERMISSIONS.ADMIN_PROVISIONING) ? (
          provLoading && logs.length === 0 ? <SkeletonLoader variant="table" rows={5} columns={5} /> : (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: SPACING.sm }}>
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: '10px',
                  fontSize: '11px', fontWeight: 600,
                  background: isFeatureEnabled('ProvisioningRealOps') ? HBC_COLORS.success : HBC_COLORS.info,
                  color: HBC_COLORS.white,
                }}>
                  {isFeatureEnabled('ProvisioningRealOps') ? 'Live' : 'Simulation'}
                </span>
              </div>
              <DataTable<IProvisioningLog>
                columns={provColumns}
                items={logs}
                keyExtractor={item => item.id}
                emptyTitle="No Provisioning Requests"
                emptyDescription="Provisioning logs will appear here when GO decisions trigger site creation."
              />
              {expandedCode && (
                <div style={{
                  marginTop: SPACING.md, padding: SPACING.lg,
                  background: HBC_COLORS.gray50, borderRadius: '8px',
                  border: `1px solid ${HBC_COLORS.gray200}`,
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md,
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: HBC_COLORS.navy }}>
                      Provisioning Details: {expandedCode}
                    </span>
                    <Button appearance="subtle" size="small" onClick={() => setExpandedCode(null)}>Close</Button>
                  </div>
                  <ProvisioningStatusView projectCode={expandedCode} pollInterval={1000} />
                </div>
              )}
            </>
          )
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: HBC_COLORS.gray400 }}>
            You do not have permission to manage provisioning.
          </div>
        )
      )}

      {/* Tab 5: Workflows */}
      {activeTab === 'workflows' && (
        hasPermission(PERMISSIONS.WORKFLOW_MANAGE) ? (
          <>
            <FeatureGate featureName="WorkflowDefinitions">
              <WorkflowDefinitionsPanel />
            </FeatureGate>

            {/* Assignment Mappings Section */}
            {hasPermission(PERMISSIONS.ADMIN_ASSIGNMENTS) && (
              <div style={{ marginTop: '32px', borderTop: `1px solid ${HBC_COLORS.gray200}`, paddingTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0, color: HBC_COLORS.navy, fontSize: '16px' }}>Assignment Mappings</h3>
                    <p style={{ margin: '4px 0 0', color: HBC_COLORS.gray500, fontSize: '13px' }}>
                      Configure Director of Preconstruction and Estimating Coordinator assignments per Region/Sector.
                    </p>
                  </div>
                  {!assignmentMappingsLoaded && (
                    <Button size="small" appearance="secondary" onClick={() => { fetchAssignmentMappings().then(() => setAssignmentMappingsLoaded(true)).catch(console.error); }}>
                      Load Mappings
                    </Button>
                  )}
                </div>

                {assignmentMappingsLoaded && (
                  <>
                    {/* Add New Mapping */}
                    <div style={{
                      display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'flex-end',
                      padding: '12px', backgroundColor: HBC_COLORS.gray50, borderRadius: '8px',
                      flexWrap: 'wrap',
                    }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: HBC_COLORS.gray500, marginBottom: '2px' }}>Region</label>
                        <select
                          value={newMappingRegion}
                          onChange={e => setNewMappingRegion(e.target.value)}
                          style={{ padding: '6px 10px', borderRadius: '4px', border: `1px solid ${HBC_COLORS.gray300}`, fontSize: '13px' }}
                        >
                          <option value="">Select...</option>
                          <option value="All Regions">All Regions</option>
                          <option value="Miami">Miami</option>
                          <option value="West Palm Beach">West Palm Beach</option>
                          <option value="Martin County">Martin County</option>
                          <option value="Orlando">Orlando</option>
                          <option value="Tallahassee">Tallahassee</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: HBC_COLORS.gray500, marginBottom: '2px' }}>Sector</label>
                        <select
                          value={newMappingSector}
                          onChange={e => setNewMappingSector(e.target.value)}
                          style={{ padding: '6px 10px', borderRadius: '4px', border: `1px solid ${HBC_COLORS.gray300}`, fontSize: '13px' }}
                        >
                          <option value="">Select...</option>
                          <option value="All Sectors">All Sectors</option>
                          {sectorDefs.filter(s => s.isActive).map(s => (
                            <option key={s.id} value={s.label}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: HBC_COLORS.gray500, marginBottom: '2px' }}>Type</label>
                        <select
                          value={newMappingType}
                          onChange={e => setNewMappingType(e.target.value as AssignmentType)}
                          style={{ padding: '6px 10px', borderRadius: '4px', border: `1px solid ${HBC_COLORS.gray300}`, fontSize: '13px' }}
                        >
                          <option value="Director">Director</option>
                          <option value="Estimator">Estimator</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: HBC_COLORS.gray500, marginBottom: '2px' }}>Assignee Name</label>
                        <input
                          type="text"
                          value={newMappingName}
                          onChange={e => setNewMappingName(e.target.value)}
                          placeholder="Display name"
                          style={{ padding: '6px 10px', borderRadius: '4px', border: `1px solid ${HBC_COLORS.gray300}`, fontSize: '13px', width: '150px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: HBC_COLORS.gray500, marginBottom: '2px' }}>Email</label>
                        <input
                          type="email"
                          value={newMappingEmail}
                          onChange={e => setNewMappingEmail(e.target.value)}
                          placeholder="email@hedrickbrothers.com"
                          style={{ padding: '6px 10px', borderRadius: '4px', border: `1px solid ${HBC_COLORS.gray300}`, fontSize: '13px', width: '200px' }}
                        />
                      </div>
                      <Button
                        size="small"
                        appearance="primary"
                        disabled={!newMappingRegion || !newMappingSector || !newMappingName.trim() || !newMappingEmail.trim()}
                        onClick={() => {
                          createMapping({
                            region: newMappingRegion,
                            sector: newMappingSector,
                            assignmentType: newMappingType,
                            assignee: { userId: newMappingEmail.split('@')[0], displayName: newMappingName, email: newMappingEmail },
                          }).then(() => {
                            setNewMappingRegion('');
                            setNewMappingSector('');
                            setNewMappingName('');
                            setNewMappingEmail('');
                            dataService.logAudit({
                              Action: AuditAction.AssignmentMappingUpdated,
                              EntityType: EntityType.AssignmentMapping,
                              EntityId: 'new',
                              User: currentUser?.displayName || 'Unknown',
                              Details: `Added ${newMappingType} mapping for ${newMappingRegion}/${newMappingSector}: ${newMappingName}`,
                            }).catch(console.error);
                          }).catch(console.error);
                        }}
                      >
                        Add Mapping
                      </Button>
                    </div>

                    {/* Mappings Table */}
                    <div style={{ border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 1.5fr 1.5fr 60px', padding: '8px 12px', background: HBC_COLORS.gray50, borderBottom: `1px solid ${HBC_COLORS.gray200}`, fontSize: '11px', fontWeight: 700, color: HBC_COLORS.gray500, textTransform: 'uppercase' }}>
                        <span>Region</span>
                        <span>Sector</span>
                        <span>Type</span>
                        <span>Assignee</span>
                        <span>Email</span>
                        <span />
                      </div>
                      {assignmentMappings.length === 0 && (
                        <div style={{ padding: '24px', textAlign: 'center', color: HBC_COLORS.gray400, fontSize: '13px' }}>
                          No assignment mappings configured. Add one above.
                        </div>
                      )}
                      {assignmentMappings.map(m => (
                        <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 1.5fr 1.5fr 60px', padding: '8px 12px', alignItems: 'center', borderBottom: `1px solid ${HBC_COLORS.gray100}`, fontSize: '13px' }}>
                          <span style={{ color: HBC_COLORS.navy, fontWeight: 500 }}>{m.region}</span>
                          <span>{m.sector}</span>
                          <span>
                            <StatusBadge
                              label={m.assignmentType}
                              color={m.assignmentType === 'Director' ? '#1E40AF' : '#065F46'}
                              backgroundColor={m.assignmentType === 'Director' ? '#DBEAFE' : '#D1FAE5'}
                              size="small"
                            />
                          </span>
                          <span>{m.assignee.displayName}</span>
                          <span style={{ color: HBC_COLORS.gray500 }}>{m.assignee.email}</span>
                          <span style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => {
                                deleteMapping(m.id).then(() => {
                                  dataService.logAudit({
                                    Action: AuditAction.AssignmentMappingUpdated,
                                    EntityType: EntityType.AssignmentMapping,
                                    EntityId: String(m.id),
                                    User: currentUser?.displayName || 'Unknown',
                                    Details: `Removed ${m.assignmentType} mapping for ${m.region}/${m.sector}`,
                                  }).catch(console.error);
                                }).catch(console.error);
                              }}
                              style={{ border: 'none', background: 'none', color: HBC_COLORS.error, cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                            >
                              Remove
                            </button>
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: HBC_COLORS.gray400 }}>
            You do not have permission to manage workflow definitions.
          </div>
        )
      )}

      {/* Tab 6: Permissions */}
      {activeTab === 'permissions' && (
        hasPermission(PERMISSIONS.PERMISSION_TEMPLATES_MANAGE) ? (
          <FeatureGate featureName="PermissionEngine">
            <PermissionTemplateEditor />
          </FeatureGate>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: HBC_COLORS.gray400 }}>
            You do not have permission to manage permission templates.
          </div>
        )
      )}

      {/* Tab 7: Sectors */}
      {activeTab === 'sectors' && (
        hasPermission(PERMISSIONS.PERMISSION_TEMPLATES_MANAGE) ? (
          <FeatureGate featureName="PermissionEngine">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, color: HBC_COLORS.navy, fontSize: '16px' }}>Sector Definitions</h3>
                  <p style={{ margin: '4px 0 0', color: HBC_COLORS.gray500, fontSize: '13px' }}>
                    Manage industry sectors for lead classification. Changes affect all sector dropdowns across the application.
                  </p>
                </div>
              </div>

              {/* Add Sector */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={newSectorLabel}
                  onChange={e => setNewSectorLabel(e.target.value)}
                  placeholder="New sector name..."
                  style={{
                    padding: '6px 12px', borderRadius: '4px', border: `1px solid ${HBC_COLORS.gray300}`,
                    fontSize: '13px', width: '250px',
                  }}
                />
                <Button
                  appearance="primary"
                  size="small"
                  disabled={!newSectorLabel.trim()}
                  onClick={async () => {
                    if (!newSectorLabel.trim()) return;
                    await createSectorDef({ label: newSectorLabel.trim() });
                    setNewSectorLabel('');
                    dataService.logAudit({
                      Action: AuditAction.ConfigRoleChanged,
                      EntityType: EntityType.Config,
                      EntityId: 'sector-definitions',
                      User: currentUser?.displayName || '',
                      Details: `Created sector: ${newSectorLabel.trim()}`,
                    });
                  }}
                >
                  Add Sector
                </Button>
              </div>

              {sectorsLoading ? (
                <SkeletonLoader variant="table" rows={6} columns={4} />
              ) : (
                <DataTable<ISectorDefinition>
                  columns={[
                    { key: 'sortOrder', header: '#', width: '60px', render: (s: ISectorDefinition) => <span style={{ color: HBC_COLORS.gray500, fontSize: '12px' }}>{s.sortOrder}</span> },
                    { key: 'label', header: 'Label', render: (s: ISectorDefinition) => <span style={{ fontWeight: 500 }}>{s.label}</span> },
                    { key: 'code', header: 'Code', render: (s: ISectorDefinition) => <span style={{ fontFamily: 'monospace', fontSize: '12px', color: HBC_COLORS.gray500 }}>{s.code}</span> },
                    { key: 'isActive', header: 'Status', width: '100px', render: (s: ISectorDefinition) => (
                      <StatusBadge
                        label={s.isActive ? 'Active' : 'Inactive'}
                        color={s.isActive ? HBC_COLORS.success : HBC_COLORS.gray400}
                        backgroundColor={s.isActive ? HBC_COLORS.successLight : HBC_COLORS.gray100}
                      />
                    )},
                    { key: 'actions', header: 'Actions', width: '100px', render: (s: ISectorDefinition) => (
                      <Button
                        appearance="subtle"
                        size="small"
                        onClick={async () => {
                          await updateSectorDef(s.id, { isActive: !s.isActive });
                          dataService.logAudit({
                            Action: AuditAction.ConfigRoleChanged,
                            EntityType: EntityType.Config,
                            EntityId: `sector-${s.id}`,
                            User: currentUser?.displayName || '',
                            Details: `${s.isActive ? 'Deactivated' : 'Activated'} sector: ${s.label}`,
                          });
                        }}
                      >
                        {s.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    )},
                  ]}
                  items={sectorDefs}
                  keyExtractor={(s: ISectorDefinition) => s.id.toString()}
                />
              )}
            </div>
          </FeatureGate>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: HBC_COLORS.gray400 }}>
            You do not have permission to manage sector definitions.
          </div>
        )
      )}

      {/* Tab 8: Project Assignments */}
      {activeTab === 'assignments' && (
        hasPermission(PERMISSIONS.PERMISSION_PROJECT_TEAM_MANAGE) ? (
          <ProjectAssignmentsPanel />
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: HBC_COLORS.gray400 }}>
            You do not have permission to manage project team assignments.
          </div>
        )
      )}

      {/* Tab 9: Dev Users */}
      {activeTab === 'devUsers' && isFeatureEnabled('DevUserManagement') && (
        (() => {
          const isMock = dataService instanceof MockDataService;
          if (!isMock) {
            return (
              <div style={{ padding: '48px', textAlign: 'center', color: HBC_COLORS.gray500 }}>
                <h3 style={{ color: HBC_COLORS.navy }}>Dev Mode Only</h3>
                <p>Dev Users management is only available in dev mode with MockDataService.</p>
              </div>
            );
          }
          const mockDs = dataService as MockDataService;
          const loadUsers = (): void => {
            setDevUsers([...mockDs.getMockUsers()]);
          };
          if (devUsers.length === 0) loadUsers();
          const allRoleValues = Object.values(RoleName);

          return (
            <div>
              {/* Info banner */}
              <div style={{
                padding: '10px 16px', marginBottom: '16px', borderRadius: '6px',
                backgroundColor: '#FEF3C7', border: '1px solid #F59E0B',
                fontSize: '13px', color: '#92400E',
              }}>
                Changes persist for this dev session only. Restart resets to defaults.
              </div>

              {/* Users table */}
              <div style={{ border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: '8px', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1.5fr 2fr 2.5fr 1fr 1fr 100px',
                  padding: '8px 12px', background: HBC_COLORS.gray50,
                  borderBottom: `1px solid ${HBC_COLORS.gray200}`,
                  fontSize: '11px', fontWeight: 700, color: HBC_COLORS.gray500, textTransform: 'uppercase',
                }}>
                  <span>Name</span>
                  <span>Email</span>
                  <span>Roles</span>
                  <span>Region</span>
                  <span>Department</span>
                  <span />
                </div>

                {/* Rows */}
                {devUsers.map(user => {
                  const isEditing = editingUserId === user.id;
                  return (
                    <div key={user.id} style={{
                      display: 'grid', gridTemplateColumns: '1.5fr 2fr 2.5fr 1fr 1fr 100px',
                      padding: '8px 12px', alignItems: 'center',
                      borderBottom: `1px solid ${HBC_COLORS.gray100}`, fontSize: '13px',
                    }}>
                      <span style={{ color: HBC_COLORS.navy, fontWeight: 500 }}>{user.displayName}</span>
                      <span style={{ color: HBC_COLORS.gray500, fontSize: '12px' }}>{user.email}</span>
                      <span>
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {editingRoles.map(role => (
                                <span key={role} style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                                  backgroundColor: '#DBEAFE', color: '#1E40AF',
                                }}>
                                  {role}
                                  <button
                                    onClick={() => setEditingRoles(prev => prev.filter(r => r !== role))}
                                    style={{
                                      border: 'none', background: 'none', cursor: 'pointer',
                                      color: '#1E40AF', fontSize: '13px', fontWeight: 700, padding: 0, lineHeight: 1,
                                    }}
                                  >
                                    x
                                  </button>
                                </span>
                              ))}
                            </div>
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value && !editingRoles.includes(e.target.value)) {
                                  setEditingRoles(prev => [...prev, e.target.value]);
                                }
                              }}
                              style={{
                                padding: '4px 8px', borderRadius: '4px',
                                border: `1px solid ${HBC_COLORS.gray300}`, fontSize: '12px', width: '180px',
                              }}
                            >
                              <option value="">Add role...</option>
                              {allRoleValues.filter(r => !editingRoles.includes(r)).map(r => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {user.roles.map(role => (
                              <StatusBadge
                                key={role}
                                label={role}
                                color="#1E40AF"
                                backgroundColor="#DBEAFE"
                                size="small"
                              />
                            ))}
                          </div>
                        )}
                      </span>
                      <span style={{ fontSize: '12px', color: HBC_COLORS.gray500 }}>{user.region}</span>
                      <span style={{ fontSize: '12px', color: HBC_COLORS.gray500 }}>{user.department}</span>
                      <span style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                        {isEditing ? (
                          <>
                            <Button size="small" appearance="primary" style={{ fontSize: '11px' }}
                              disabled={editingRoles.length === 0}
                              onClick={() => {
                                mockDs.updateMockUserRoles(user.id, editingRoles);
                                setEditingUserId(null);
                                loadUsers();
                              }}
                            >
                              Save
                            </Button>
                            <Button size="small" appearance="subtle" style={{ fontSize: '11px' }}
                              onClick={() => setEditingUserId(null)}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button size="small" appearance="subtle" style={{ fontSize: '11px' }}
                            onClick={() => { setEditingUserId(user.id); setEditingRoles([...user.roles]); }}
                          >
                            Edit
                          </Button>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()
      )}

      {/* Tab 10: Audit Log */}
      {activeTab === 'audit' && (
        <div>
          {auditEntries.length > 5000 && (
            <div style={{
              padding: '10px 16px', marginBottom: '12px', borderRadius: '6px',
              backgroundColor: '#FEF3C7', border: '1px solid #F59E0B',
              fontSize: '13px', color: '#92400E',
            }}>
              Showing filtered results. Archive older entries to maintain performance.
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '13px', color: HBC_COLORS.gray500 }}>
                From:
                <input type="date" style={{ ...selectStyle, marginLeft: '6px' }} value={auditStartDate}
                  onChange={e => { setAuditStartDate(e.target.value); setAuditEntries([]); }} />
              </label>
              <label style={{ fontSize: '13px', color: HBC_COLORS.gray500 }}>
                To:
                <input type="date" style={{ ...selectStyle, marginLeft: '6px' }} value={auditEndDate}
                  onChange={e => { setAuditEndDate(e.target.value); setAuditEntries([]); }} />
              </label>
              <label style={{ fontSize: '13px', color: HBC_COLORS.gray500 }}>
                Entity:
                <select style={{ ...selectStyle, marginLeft: '6px' }} value={auditEntityFilter} onChange={e => setAuditEntityFilter(e.target.value)}>
                  <option value="All">All</option>
                  {Object.values(EntityType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label style={{ fontSize: '13px', color: HBC_COLORS.gray500 }}>
                Action:
                <select style={{ ...selectStyle, marginLeft: '6px' }} value={auditActionFilter} onChange={e => setAuditActionFilter(e.target.value)}>
                  <option value="All">All</option>
                  {Object.values(AuditAction).map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </label>
              <Button size="small" appearance="subtle" onClick={() => { refreshAudit().catch(console.error); }}>Refresh</Button>
            </div>
            <ExportButtons
              data={auditExportData}
              filename="hbc-audit-log"
              title="Audit Log"
            />
          </div>
          {auditLoading ? <SkeletonLoader variant="table" rows={8} columns={5} /> : (
            <DataTable<IAuditEntry>
              columns={auditColumns}
              items={filteredAudit}
              keyExtractor={e => e.id}
              emptyTitle="No audit entries"
              emptyDescription="Audit events will appear here as actions are performed."
              pageSize={25}
            />
          )}
        </div>
      )}
    </RoleGate>
  );
};

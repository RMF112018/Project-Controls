import * as React from 'react';
import { Button } from '@fluentui/react-components';
import { useAppContext } from '../../contexts/AppContext';
import { PageHeader } from '../../shared/PageHeader';
import { DataTable, IDataTableColumn } from '../../shared/DataTable';
import { StatusBadge } from '../../shared/StatusBadge';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { ExportButtons } from '../../shared/ExportButtons';
import { ProvisioningStatusView } from '../../shared/ProvisioningStatus';
import { RoleGate } from '../../guards/RoleGate';
import {
  IRole,
  IFeatureFlag,
  IAuditEntry,
  IProvisioningLog,
  ProvisioningStatus,
  RoleName,
  AuditAction,
  EntityType,
} from '../../../models';
import { ProvisioningService } from '../../../services/ProvisioningService';
import { HBC_COLORS, SPACING } from '../../../theme/tokens';
import { formatDateTime } from '../../../utils/formatters';
import { PERMISSIONS } from '../../../utils/permissions';

const TABS = ['Connections', 'Roles', 'Feature Flags', 'Provisioning', 'Audit Log'] as const;

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
      return (originalOnError as Function)(message, source, _line, _col, _error);
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
  const { dataService, currentUser, hasPermission } = useAppContext();
  const [activeTab, setActiveTab] = React.useState(0);

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

  // -- Provisioning state --
  const [logs, setLogs] = React.useState<IProvisioningLog[]>([]);
  const [provLoading, setProvLoading] = React.useState(false);
  const [retrying, setRetrying] = React.useState<string | null>(null);
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

  const provisioningService = React.useMemo(
    () => new ProvisioningService(dataService),
    [dataService]
  );

  // Load data based on active tab
  React.useEffect(() => {
    if (activeTab === 1 && roles.length === 0) {
      setRolesLoading(true);
      dataService.getRoles().then(setRoles).catch(console.error).finally(() => setRolesLoading(false));
    } else if (activeTab === 2 && flags.length === 0) {
      setFlagsLoading(true);
      dataService.getFeatureFlags().then(setFlags).catch(console.error).finally(() => setFlagsLoading(false));
    } else if (activeTab === 3 && logs.length === 0) {
      setProvLoading(true);
      dataService.getProvisioningLogs().then(setLogs).catch(console.error).finally(() => setProvLoading(false));
    } else if (activeTab === 4 && auditEntries.length === 0) {
      setAuditLoading(true);
      dataService.getAuditLog(undefined, undefined, auditStartDate, auditEndDate)
        .then(setAuditEntries).catch(console.error).finally(() => setAuditLoading(false));
    }
  }, [activeTab, dataService, roles.length, flags.length, logs.length, auditEntries.length, auditStartDate, auditEndDate]);

  // Provisioning polling
  React.useEffect(() => {
    if (activeTab !== 3) return;
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
    const confirmed = window.confirm(`Are you sure you want to ${action} "${flag.FeatureName}"?`);
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
        Details: `Feature flag "${flag.FeatureName}" ${!flag.Enabled ? 'enabled' : 'disabled'}`,
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
    { key: 'FeatureName', header: 'Feature', render: (f) => <span style={{ fontWeight: 500, color: HBC_COLORS.navy }}>{f.FeatureName}</span> },
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
      <span style={{ fontSize: '12px', color: item.errorMessage ? HBC_COLORS.error : HBC_COLORS.gray400 }}>
        {item.errorMessage || '-'}
      </span>
    )},
    { key: 'requestedAt', header: 'Requested', width: '160px', render: (item) => formatDateTime(item.requestedAt) },
    { key: 'actions', header: '', width: '120px', render: (item) => {
      const canRetry = item.status === ProvisioningStatus.Failed || item.status === ProvisioningStatus.PartialFailure;
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
          <Button size="small" appearance="subtle"
            onClick={(e) => { e.stopPropagation(); setExpandedCode(expandedCode === item.projectCode ? null : item.projectCode); }}
          >
            {expandedCode === item.projectCode ? 'Hide' : 'Details'}
          </Button>
        </div>
      );
    }},
  ];

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

  const tabStyle = (idx: number): React.CSSProperties => ({
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: activeTab === idx ? 600 : 400,
    color: activeTab === idx ? HBC_COLORS.navy : HBC_COLORS.gray500,
    borderBottom: activeTab === idx ? `3px solid ${HBC_COLORS.navy}` : '3px solid transparent',
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
      <PageHeader title="Admin Panel" subtitle="System administration and configuration" />

      {/* Tab Bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${HBC_COLORS.gray200}`, marginBottom: '20px' }}>
        {TABS.map((label, idx) => (
          <div key={label} style={tabStyle(idx)} onClick={() => setActiveTab(idx)}>
            {label}
          </div>
        ))}
      </div>

      {/* Tab 1: Connection Testing */}
      {activeTab === 0 && (
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
        </div>
      )}

      {/* Tab 2: Roles Management */}
      {activeTab === 1 && (
        hasPermission(PERMISSIONS.ADMIN_ROLES) ? (
          rolesLoading ? <LoadingSpinner label="Loading roles..." /> : (
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
      {activeTab === 2 && (
        hasPermission(PERMISSIONS.ADMIN_FLAGS) ? (
          flagsLoading ? <LoadingSpinner label="Loading feature flags..." /> : (
            <DataTable<IFeatureFlag>
              columns={flagColumns}
              items={flags}
              keyExtractor={f => f.id}
              emptyTitle="No feature flags"
            />
          )
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: HBC_COLORS.gray400 }}>
            You do not have permission to manage feature flags.
          </div>
        )
      )}

      {/* Tab 4: Provisioning Queue */}
      {activeTab === 3 && (
        hasPermission(PERMISSIONS.ADMIN_PROVISIONING) ? (
          provLoading && logs.length === 0 ? <LoadingSpinner label="Loading provisioning logs..." /> : (
            <>
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

      {/* Tab 5: Audit Log */}
      {activeTab === 4 && (
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
          {auditLoading ? <LoadingSpinner label="Loading audit log..." /> : (
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

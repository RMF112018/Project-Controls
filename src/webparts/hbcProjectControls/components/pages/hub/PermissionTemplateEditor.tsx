import * as React from 'react';
import { Button } from '@fluentui/react-components';
import { useAppContext } from '../../contexts/AppContext';
import { usePermissionEngine } from '../../hooks/usePermissionEngine';
import { ToolPermissionMatrix } from '../../shared/ToolPermissionMatrix';
import { DataTable, IDataTableColumn } from '../../shared/DataTable';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { StatusBadge } from '../../shared/StatusBadge';
import { IPermissionTemplate, IToolAccess, ISecurityGroupMapping } from '../../../models/IPermissionTemplate';
import { IEnvironmentConfig } from '../../../models/IEnvironmentConfig';
import { AuditAction, EntityType } from '../../../models/enums';
import { HBC_COLORS, SPACING } from '../../../theme/tokens';
import { formatDateTime } from '../../../utils/formatters';

export const PermissionTemplateEditor: React.FC = () => {
  const { dataService, currentUser } = useAppContext();
  const {
    templates,
    securityGroupMappings,
    loading,
    fetchTemplates,
    fetchMappings,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    updateMapping,
  } = usePermissionEngine();

  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [editForm, setEditForm] = React.useState<Partial<IPermissionTemplate> | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [showMappings, setShowMappings] = React.useState(false);
  const [envConfig, setEnvConfig] = React.useState<IEnvironmentConfig | null>(null);
  const [promoting, setPromoting] = React.useState(false);

  React.useEffect(() => {
    fetchTemplates().catch(console.error);
    fetchMappings().catch(console.error);
    dataService.getEnvironmentConfig().then(setEnvConfig).catch(() => setEnvConfig(null));
  }, [fetchTemplates, fetchMappings, dataService]);

  // Auto-select first template
  React.useEffect(() => {
    if (templates.length > 0 && selectedId === null) {
      setSelectedId(templates[0].id);
    }
  }, [templates, selectedId]);

  // Sync edit form when selection changes
  React.useEffect(() => {
    if (selectedId !== null) {
      const tpl = templates.find(t => t.id === selectedId);
      if (tpl) setEditForm({ ...tpl });
    }
  }, [selectedId, templates]);

  const logAudit = (action: AuditAction, entityId: string, details: string): void => {
    dataService.logAudit({
      Action: action,
      EntityType: EntityType.PermissionTemplate,
      EntityId: entityId,
      User: currentUser?.displayName || 'Unknown',
      UserId: currentUser?.id,
      Details: details,
    }).catch(console.error);
  };

  const handleCreate = async (): Promise<void> => {
    try {
      const created = await createTemplate({
        name: 'New Template',
        description: '',
        isGlobal: false,
        globalAccess: false,
        identityType: 'Internal',
        toolAccess: [],
        isDefault: false,
        isActive: true,
        createdBy: currentUser?.displayName || 'Unknown',
        createdDate: new Date().toISOString(),
        lastModifiedBy: currentUser?.displayName || 'Unknown',
        lastModifiedDate: new Date().toISOString(),
      });
      setSelectedId(created.id);
      logAudit(AuditAction.TemplateCreated, String(created.id), `Created template "${created.name}"`);
    } catch (err) {
      console.error('Failed to create template:', err);
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!editForm || selectedId === null) return;
    setSaving(true);
    try {
      await updateTemplate(selectedId, {
        ...editForm,
        lastModifiedBy: currentUser?.displayName || 'Unknown',
        lastModifiedDate: new Date().toISOString(),
      });
      logAudit(AuditAction.TemplateUpdated, String(selectedId), `Updated template "${editForm.name}"`);
    } catch (err) {
      console.error('Failed to save template:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (selectedId === null) return;
    const tpl = templates.find(t => t.id === selectedId);
    if (!tpl) return;
    if (tpl.isDefault) {
      window.alert('Cannot delete the default template.');
      return;
    }
    const confirmed = window.confirm(`Delete template "${tpl.name}"? This cannot be undone.`);
    if (!confirmed) return;
    try {
      await deleteTemplate(selectedId);
      logAudit(AuditAction.TemplateDeleted, String(selectedId), `Deleted template "${tpl.name}"`);
      setSelectedId(templates.find(t => t.id !== selectedId)?.id || null);
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  const handleToolAccessChange = (toolAccess: IToolAccess[]): void => {
    setEditForm(prev => prev ? { ...prev, toolAccess } : prev);
  };

  const handleMappingChange = async (mappingId: number, templateId: number): Promise<void> => {
    try {
      await updateMapping(mappingId, { defaultTemplateId: templateId });
      logAudit(AuditAction.SecurityGroupMappingChanged, String(mappingId), `Updated group mapping to template ${templateId}`);
    } catch (err) {
      console.error('Failed to update mapping:', err);
    }
  };

  const handlePromote = async (): Promise<void> => {
    if (!envConfig) return;
    const toTier = envConfig.currentTier === 'dev' ? 'vetting' : 'prod';
    const confirmed = window.confirm(
      `Promote all active templates from "${envConfig.currentTier}" to "${toTier}"?\n\nThis will increment template versions and copy current configurations to the ${toTier} tier.`
    );
    if (!confirmed) return;
    setPromoting(true);
    try {
      await dataService.promoteTemplates(envConfig.currentTier, toTier as 'vetting' | 'prod', currentUser?.displayName || 'Unknown');
      logAudit(AuditAction.TemplateUpdated, 'all', `Promoted templates from ${envConfig.currentTier} to ${toTier}`);
      await fetchTemplates();
      const updatedEnv = await dataService.getEnvironmentConfig();
      setEnvConfig(updatedEnv);
    } catch (err) {
      console.error('Failed to promote templates:', err);
    } finally {
      setPromoting(false);
    }
  };

  const selectedTemplate = templates.find(t => t.id === selectedId) || null;

  if (loading && templates.length === 0) {
    return <SkeletonLoader variant="card" />;
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: '6px',
    border: `1px solid ${HBC_COLORS.gray200}`, fontSize: '13px',
    color: HBC_COLORS.gray800, boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 600,
    color: HBC_COLORS.gray500, marginBottom: '4px',
  };

  // Security group mappings columns
  const mappingColumns: IDataTableColumn<ISecurityGroupMapping>[] = [
    { key: 'group', header: 'Security Group', render: (m) => (
      <span style={{ fontWeight: 500, color: HBC_COLORS.navy }}>{m.securityGroupName}</span>
    )},
    { key: 'template', header: 'Default Template', width: '220px', render: (m) => (
      <select
        value={m.defaultTemplateId}
        onChange={(e) => { handleMappingChange(m.id, Number(e.target.value)).catch(console.error); }}
        style={{ ...inputStyle, width: 'auto', minWidth: '180px' }}
      >
        {templates.filter(t => t.isActive).map(t => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
    )},
    { key: 'active', header: 'Active', width: '80px', render: (m) => (
      <span style={{
        display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%',
        backgroundColor: m.isActive ? HBC_COLORS.success : HBC_COLORS.gray300,
      }} />
    )},
  ];

  return (
    <div>
      {/* Environment info + section toggle */}
      {envConfig && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px',
          padding: '8px 12px', borderRadius: '6px',
          backgroundColor: envConfig.currentTier === 'prod' ? HBC_COLORS.successLight : envConfig.currentTier === 'vetting' ? HBC_COLORS.warningLight : HBC_COLORS.infoLight,
          border: `1px solid ${envConfig.currentTier === 'prod' ? HBC_COLORS.success : envConfig.currentTier === 'vetting' ? HBC_COLORS.warning : HBC_COLORS.info}`,
        }}>
          <span style={{
            fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
            color: envConfig.currentTier === 'vetting' ? '#92400E' : envConfig.currentTier === 'prod' ? '#065F46' : '#1E40AF',
          }}>
            {envConfig.label} Environment
          </span>
          {envConfig.isReadOnly && (
            <span style={{ fontSize: '11px', color: HBC_COLORS.gray500 }}>
              (Read-only — changes must be made in dev and promoted)
            </span>
          )}
          {envConfig.currentTier !== 'prod' && (
            <Button size="small" appearance="primary"
              style={{ marginLeft: 'auto', backgroundColor: HBC_COLORS.orange, fontSize: '12px' }}
              disabled={promoting}
              onClick={() => { handlePromote().catch(console.error); }}
            >
              {promoting ? 'Promoting...' : `Promote to ${envConfig.currentTier === 'dev' ? 'Vetting' : 'Production'}`}
            </Button>
          )}
        </div>
      )}

      {/* Section toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setShowMappings(false)}
          style={{
            padding: '6px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600,
            backgroundColor: !showMappings ? HBC_COLORS.navy : HBC_COLORS.gray100,
            color: !showMappings ? '#fff' : HBC_COLORS.gray600,
          }}
        >
          Templates
        </button>
        <button
          onClick={() => setShowMappings(true)}
          style={{
            padding: '6px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600,
            backgroundColor: showMappings ? HBC_COLORS.navy : HBC_COLORS.gray100,
            color: showMappings ? '#fff' : HBC_COLORS.gray600,
          }}
        >
          Group Mappings
        </button>
      </div>

      {/* Security Group Mappings section */}
      {showMappings && (
        <div>
          <p style={{ fontSize: '13px', color: HBC_COLORS.gray500, margin: '0 0 16px 0' }}>
            Map Entra ID security groups to default permission templates. When a user authenticates, their group membership determines their base template.
          </p>
          <DataTable<ISecurityGroupMapping>
            columns={mappingColumns}
            items={securityGroupMappings}
            keyExtractor={m => m.id}
            emptyTitle="No group mappings configured"
          />
        </div>
      )}

      {/* Templates two-panel layout */}
      {!showMappings && (
        <div style={{ display: 'flex', gap: SPACING.lg, minHeight: '500px' }}>
          {/* Left panel: Template list */}
          <div style={{ width: '280px', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Templates ({templates.length})
              </div>
              <Button size="small" appearance="primary" style={{ backgroundColor: HBC_COLORS.navy }} onClick={() => { handleCreate().catch(console.error); }}>
                + New
              </Button>
            </div>

            {templates.map(tpl => {
              const isSelected = tpl.id === selectedId;
              return (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedId(tpl.id)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginBottom: '8px',
                    backgroundColor: isSelected ? HBC_COLORS.gray50 : '#fff',
                    border: `1px solid ${isSelected ? HBC_COLORS.navy : HBC_COLORS.gray200}`,
                    borderLeft: isSelected ? `4px solid ${HBC_COLORS.navy}` : '4px solid transparent',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = HBC_COLORS.gray50; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#fff'; }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 600, color: HBC_COLORS.navy }}>
                    {tpl.name}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {tpl.globalAccess && (
                      <StatusBadge label="Global" color="#065F46" backgroundColor={HBC_COLORS.successLight} size="small" />
                    )}
                    {tpl.isDefault && (
                      <StatusBadge label="Default" color={HBC_COLORS.info} backgroundColor={HBC_COLORS.infoLight} size="small" />
                    )}
                    <StatusBadge
                      label={tpl.isActive ? 'Active' : 'Inactive'}
                      color={tpl.isActive ? '#065F46' : HBC_COLORS.gray500}
                      backgroundColor={tpl.isActive ? HBC_COLORS.successLight : HBC_COLORS.gray100}
                      size="small"
                    />
                  </div>
                  <div style={{ fontSize: '11px', color: HBC_COLORS.gray400, marginTop: '6px' }}>
                    {tpl.toolAccess.length} tool{tpl.toolAccess.length !== 1 ? 's' : ''} configured
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right panel: Template detail */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {editForm && selectedTemplate ? (
              <>
                {/* Header with save/delete */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.lg }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: HBC_COLORS.navy, margin: 0 }}>
                      {selectedTemplate.name}
                    </h3>
                    <p style={{ fontSize: '12px', color: HBC_COLORS.gray400, margin: '4px 0 0 0' }}>
                      Last modified by {selectedTemplate.lastModifiedBy} on {formatDateTime(selectedTemplate.lastModifiedDate)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button size="small" appearance="subtle" style={{ color: HBC_COLORS.error }}
                      onClick={() => { handleDelete().catch(console.error); }}>
                      Delete
                    </Button>
                    <Button size="small" appearance="primary" style={{ backgroundColor: HBC_COLORS.navy }}
                      disabled={saving}
                      onClick={() => { handleSave().catch(console.error); }}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>

                {/* Template form */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
                  padding: '20px', backgroundColor: HBC_COLORS.gray50,
                  borderRadius: '8px', marginBottom: '20px',
                  border: `1px solid ${HBC_COLORS.gray200}`,
                }}>
                  <div>
                    <label style={labelStyle}>Template Name</label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={e => setEditForm(prev => prev ? { ...prev, name: e.target.value } : prev)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Identity Type</label>
                    <select
                      value={editForm.identityType || 'Internal'}
                      onChange={e => setEditForm(prev => prev ? { ...prev, identityType: e.target.value as 'Internal' | 'External' } : prev)}
                      style={inputStyle}
                    >
                      <option value="Internal">Internal</option>
                      <option value="External">External</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Description</label>
                    <textarea
                      value={editForm.description || ''}
                      onChange={e => setEditForm(prev => prev ? { ...prev, description: e.target.value } : prev)}
                      rows={2}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '24px', gridColumn: '1 / -1' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={editForm.globalAccess || false}
                        onChange={e => setEditForm(prev => prev ? { ...prev, globalAccess: e.target.checked } : prev)}
                        style={{ accentColor: HBC_COLORS.navy }}
                      />
                      <span style={{ fontSize: '13px', color: HBC_COLORS.gray700 }}>Global Access</span>
                      <span style={{ fontSize: '11px', color: HBC_COLORS.gray400 }}>(Can view all projects cross-sector)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={editForm.isActive !== false}
                        onChange={e => setEditForm(prev => prev ? { ...prev, isActive: e.target.checked } : prev)}
                        style={{ accentColor: HBC_COLORS.navy }}
                      />
                      <span style={{ fontSize: '13px', color: HBC_COLORS.gray700 }}>Active</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={editForm.isDefault || false}
                        onChange={e => setEditForm(prev => prev ? { ...prev, isDefault: e.target.checked } : prev)}
                        style={{ accentColor: HBC_COLORS.navy }}
                      />
                      <span style={{ fontSize: '13px', color: HBC_COLORS.gray700 }}>Default Template</span>
                    </label>
                  </div>
                </div>

                {/* Tool Permission Matrix */}
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: HBC_COLORS.navy, margin: '0 0 12px 0' }}>
                    Tool Permissions
                  </h4>
                  <ToolPermissionMatrix
                    toolAccess={editForm.toolAccess || []}
                    onChange={handleToolAccessChange}
                  />
                </div>
              </>
            ) : (
              <div style={{ padding: '48px', textAlign: 'center', color: HBC_COLORS.gray400 }}>
                Select a template from the left panel or create a new one.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

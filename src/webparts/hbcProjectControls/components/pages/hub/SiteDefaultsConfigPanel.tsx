import * as React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS, SPACING, ELEVATION } from '../../../theme/tokens';
import type { ISiteProvisioningDefaults, IProjectFeatureFlagDefault, IRoleGroupMapping } from '@hbc/sp-services';

const sectionStyle: React.CSSProperties = {
  border: `1px solid ${HBC_COLORS.gray200}`,
  borderRadius: '8px',
  padding: SPACING.lg,
  marginBottom: SPACING.md,
  backgroundColor: HBC_COLORS.white,
  boxShadow: ELEVATION.level1,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 600,
  color: HBC_COLORS.navy,
  margin: `0 0 ${SPACING.sm} 0`,
};

const sectionDescStyle: React.CSSProperties = {
  fontSize: '13px',
  color: HBC_COLORS.gray500,
  margin: `0 0 ${SPACING.md} 0`,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 500,
  color: HBC_COLORS.gray500,
  marginBottom: '4px',
};

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '6px',
  border: `1px solid ${HBC_COLORS.gray200}`,
  fontSize: '13px',
  color: HBC_COLORS.gray800,
  width: '100%',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: '6px',
  border: `1px solid ${HBC_COLORS.gray200}`,
  fontSize: '13px',
  backgroundColor: HBC_COLORS.white,
  color: HBC_COLORS.gray800,
};

const toggleTrackStyle = (enabled: boolean): React.CSSProperties => ({
  width: '40px',
  height: '22px',
  borderRadius: '11px',
  border: 'none',
  cursor: 'pointer',
  backgroundColor: enabled ? HBC_COLORS.success : HBC_COLORS.gray300,
  position: 'relative',
  transition: 'background-color 0.2s',
  flexShrink: 0,
});

const toggleKnobStyle = (enabled: boolean): React.CSSProperties => ({
  display: 'block',
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  backgroundColor: HBC_COLORS.white,
  position: 'absolute',
  top: '3px',
  left: enabled ? '21px' : '3px',
  transition: 'left 0.2s',
});

const removeBtnStyle: React.CSSProperties = {
  border: 'none',
  background: 'none',
  color: HBC_COLORS.error,
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 600,
  padding: '4px 8px',
};

const addBtnStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: '6px',
  border: `1px dashed ${HBC_COLORS.gray300}`,
  backgroundColor: HBC_COLORS.gray50,
  color: HBC_COLORS.navy,
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 500,
  marginTop: SPACING.sm,
};

const actionBtnBase: React.CSSProperties = {
  padding: '10px 24px',
  borderRadius: '6px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 600,
  transition: 'background-color 0.2s, opacity 0.2s',
};

export const SiteDefaultsConfigPanel: React.FC = () => {
  const { dataService } = useAppContext();
  const [defaults, setDefaults] = React.useState<ISiteProvisioningDefaults | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  // Load defaults on mount
  React.useEffect(() => {
    let cancelled = false;
    dataService.getSiteProvisioningDefaults().then(data => {
      if (!cancelled) {
        setDefaults(data);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [dataService]);

  // Save handler
  const handleSave = async (): Promise<void> => {
    if (!defaults) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const updated = await dataService.updateSiteProvisioningDefaults(defaults);
      setDefaults(updated);
      setDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save site defaults:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to save site defaults');
    } finally {
      setSaving(false);
    }
  };

  // Reset handler (reload from server)
  const handleReset = async (): Promise<void> => {
    setLoading(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const data = await dataService.getSiteProvisioningDefaults();
      setDefaults(data);
      setDirty(false);
    } catch (err) {
      console.error('Failed to reload site defaults:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update helper
  const updateField = <K extends keyof ISiteProvisioningDefaults>(field: K, value: ISiteProvisioningDefaults[K]): void => {
    if (!defaults) return;
    setDefaults({ ...defaults, [field]: value });
    setDirty(true);
    setSaveSuccess(false);
  };

  // Role mapping helpers
  const addRoleMapping = (): void => {
    if (!defaults) return;
    const newMapping: IRoleGroupMapping = { roleName: '', spGroupType: 'Members' };
    updateField('roleToGroupMappings', [...defaults.roleToGroupMappings, newMapping]);
  };

  const removeRoleMapping = (index: number): void => {
    if (!defaults) return;
    const updated = defaults.roleToGroupMappings.filter((_, i) => i !== index);
    updateField('roleToGroupMappings', updated);
  };

  const updateRoleMapping = (index: number, field: keyof IRoleGroupMapping, value: string): void => {
    if (!defaults) return;
    const updated = defaults.roleToGroupMappings.map((m, i) =>
      i === index ? { ...m, [field]: value } : m
    );
    updateField('roleToGroupMappings', updated);
  };

  // Feature flag helpers
  const addFeatureFlag = (): void => {
    if (!defaults) return;
    const newFlag: IProjectFeatureFlagDefault = { featureName: '', enabled: false };
    updateField('defaultProjectFeatureFlags', [...defaults.defaultProjectFeatureFlags, newFlag]);
  };

  const removeFeatureFlag = (index: number): void => {
    if (!defaults) return;
    const updated = defaults.defaultProjectFeatureFlags.filter((_, i) => i !== index);
    updateField('defaultProjectFeatureFlags', updated);
  };

  const updateFeatureFlag = (index: number, field: keyof IProjectFeatureFlagDefault, value: string | boolean): void => {
    if (!defaults) return;
    const updated = defaults.defaultProjectFeatureFlags.map((f, i) =>
      i === index ? { ...f, [field]: value } : f
    );
    updateField('defaultProjectFeatureFlags', updated);
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: SPACING.xxl, textAlign: 'center', color: HBC_COLORS.gray500 }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: `3px solid ${HBC_COLORS.gray200}`,
          borderTopColor: HBC_COLORS.navy,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 12px',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Loading defaults...
      </div>
    );
  }

  if (!defaults) {
    return (
      <div style={{ padding: SPACING.xxl, textAlign: 'center', color: HBC_COLORS.gray400 }}>
        Failed to load site provisioning defaults.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: SPACING.lg }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: HBC_COLORS.navy, margin: 0 }}>
          Site Provisioning Defaults
        </h2>
        <p style={{ fontSize: '13px', color: HBC_COLORS.gray500, margin: `${SPACING.xs} 0 0 0` }}>
          Configure default settings applied when provisioning new project sites.
        </p>
      </div>

      {/* Section 1: Hub & Template */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Hub &amp; Template</h3>
        <p style={sectionDescStyle}>Hub site URL and template used for new project sites.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACING.md }}>
          <div>
            <label style={labelStyle}>Hub Site URL</label>
            <input
              type="text"
              value={defaults.hubSiteUrl}
              onChange={(e) => updateField('hubSiteUrl', e.target.value)}
              placeholder="https://tenant.sharepoint.com/sites/HBCentral"
              style={{ ...inputStyle, fontFamily: 'monospace' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Template ID</label>
            <input
              type="text"
              value={defaults.defaultTemplateId}
              onChange={(e) => updateField('defaultTemplateId', e.target.value)}
              placeholder="e.g., HBC-ProjectTemplate-v1"
              style={{ ...inputStyle, fontFamily: 'monospace' }}
            />
          </div>
        </div>
      </div>

      {/* Section 2: Auto-Assignment */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Auto-Assignment</h3>
        <p style={sectionDescStyle}>Toggle automatic team assignment and GitOps provisioning workflows.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: 500, color: HBC_COLORS.gray800 }}>
                Auto-assign team from mappings
              </span>
              <span style={{ display: 'block', fontSize: '12px', color: HBC_COLORS.gray400, marginTop: '2px' }}>
                Automatically assign team members based on region/sector mappings during provisioning.
              </span>
            </div>
            <button
              type="button"
              onClick={() => updateField('autoAssignTeamFromMappings', !defaults.autoAssignTeamFromMappings)}
              style={toggleTrackStyle(defaults.autoAssignTeamFromMappings)}
              aria-label="Toggle auto-assign team from mappings"
            >
              <span style={toggleKnobStyle(defaults.autoAssignTeamFromMappings)} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: 500, color: HBC_COLORS.gray800 }}>
                Use GitOps provisioning
              </span>
              <span style={{ display: 'block', fontSize: '12px', color: HBC_COLORS.gray400, marginTop: '2px' }}>
                Enable GitOps-based site provisioning workflow instead of direct PnP provisioning.
              </span>
            </div>
            <button
              type="button"
              onClick={() => updateField('useGitOpsProvisioning', !defaults.useGitOpsProvisioning)}
              style={toggleTrackStyle(defaults.useGitOpsProvisioning)}
              aria-label="Toggle GitOps provisioning"
            >
              <span style={toggleKnobStyle(defaults.useGitOpsProvisioning)} />
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Role Mappings */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Role Mappings</h3>
        <p style={sectionDescStyle}>Map application roles to SharePoint permission groups for new project sites.</p>
        <div style={{ border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: '6px', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 180px 60px',
            padding: '8px 12px',
            backgroundColor: HBC_COLORS.gray50,
            borderBottom: `1px solid ${HBC_COLORS.gray200}`,
            fontSize: '11px',
            fontWeight: 700,
            color: HBC_COLORS.gray500,
            textTransform: 'uppercase',
          }}>
            <span>Role Name</span>
            <span>SP Group Type</span>
            <span />
          </div>
          {/* Rows */}
          {defaults.roleToGroupMappings.length === 0 && (
            <div style={{ padding: SPACING.lg, textAlign: 'center', color: HBC_COLORS.gray400, fontSize: '13px' }}>
              No role mappings configured. Add one below.
            </div>
          )}
          {defaults.roleToGroupMappings.map((mapping, index) => (
            <div
              key={index}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 180px 60px',
                padding: '8px 12px',
                alignItems: 'center',
                borderBottom: `1px solid ${HBC_COLORS.gray100}`,
                fontSize: '13px',
              }}
            >
              <input
                type="text"
                value={mapping.roleName}
                onChange={(e) => updateRoleMapping(index, 'roleName', e.target.value)}
                placeholder="Role name..."
                style={{ ...inputStyle, width: 'auto' }}
              />
              <select
                value={mapping.spGroupType}
                onChange={(e) => updateRoleMapping(index, 'spGroupType', e.target.value)}
                style={selectStyle}
              >
                <option value="Owners">Owners</option>
                <option value="Members">Members</option>
                <option value="Visitors">Visitors</option>
              </select>
              <span style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => removeRoleMapping(index)}
                  style={removeBtnStyle}
                  aria-label={`Remove role mapping ${mapping.roleName || index}`}
                >
                  Remove
                </button>
              </span>
            </div>
          ))}
        </div>
        <button type="button" onClick={addRoleMapping} style={addBtnStyle}>
          + Add Role Mapping
        </button>
      </div>

      {/* Section 4: Default Feature Flags */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Default Feature Flags</h3>
        <p style={sectionDescStyle}>Feature flags enabled by default on newly provisioned project sites.</p>
        <div style={{ border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: '6px', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 80px 60px',
            padding: '8px 12px',
            backgroundColor: HBC_COLORS.gray50,
            borderBottom: `1px solid ${HBC_COLORS.gray200}`,
            fontSize: '11px',
            fontWeight: 700,
            color: HBC_COLORS.gray500,
            textTransform: 'uppercase',
          }}>
            <span>Feature Name</span>
            <span>Enabled</span>
            <span />
          </div>
          {/* Rows */}
          {defaults.defaultProjectFeatureFlags.length === 0 && (
            <div style={{ padding: SPACING.lg, textAlign: 'center', color: HBC_COLORS.gray400, fontSize: '13px' }}>
              No default feature flags configured. Add one below.
            </div>
          )}
          {defaults.defaultProjectFeatureFlags.map((flag, index) => (
            <div
              key={index}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 80px 60px',
                padding: '8px 12px',
                alignItems: 'center',
                borderBottom: `1px solid ${HBC_COLORS.gray100}`,
                fontSize: '13px',
              }}
            >
              <input
                type="text"
                value={flag.featureName}
                onChange={(e) => updateFeatureFlag(index, 'featureName', e.target.value)}
                placeholder="Feature name..."
                style={{ ...inputStyle, width: 'auto' }}
              />
              <button
                type="button"
                onClick={() => updateFeatureFlag(index, 'enabled', !flag.enabled)}
                style={toggleTrackStyle(flag.enabled)}
                aria-label={`Toggle ${flag.featureName || 'feature flag'}`}
              >
                <span style={toggleKnobStyle(flag.enabled)} />
              </button>
              <span style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => removeFeatureFlag(index)}
                  style={removeBtnStyle}
                  aria-label={`Remove feature flag ${flag.featureName || index}`}
                >
                  Remove
                </button>
              </span>
            </div>
          ))}
        </div>
        <button type="button" onClick={addFeatureFlag} style={addBtnStyle}>
          + Add Feature Flag
        </button>
      </div>

      {/* Section 5: SP Permission Levels */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>SP Permission Levels</h3>
        <p style={sectionDescStyle}>Default SharePoint permission levels assigned to the Owners, Members, and Visitors groups.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: SPACING.md }}>
          <div>
            <label style={labelStyle}>Owners Permission Level</label>
            <input
              type="text"
              value={defaults.defaultOwnerPermissionLevel}
              onChange={(e) => updateField('defaultOwnerPermissionLevel', e.target.value)}
              placeholder="Full Control"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Members Permission Level</label>
            <input
              type="text"
              value={defaults.defaultMemberPermissionLevel}
              onChange={(e) => updateField('defaultMemberPermissionLevel', e.target.value)}
              placeholder="Edit"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Visitors Permission Level</label>
            <input
              type="text"
              value={defaults.defaultVisitorPermissionLevel}
              onChange={(e) => updateField('defaultVisitorPermissionLevel', e.target.value)}
              placeholder="Read"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Section 6: Actions */}
      <div style={{
        display: 'flex',
        gap: SPACING.md,
        alignItems: 'center',
        padding: `${SPACING.lg} 0`,
        borderTop: `1px solid ${HBC_COLORS.gray200}`,
        marginTop: SPACING.sm,
      }}>
        <button
          type="button"
          onClick={() => { handleSave().catch(console.error); }}
          disabled={!dirty || saving}
          style={{
            ...actionBtnBase,
            backgroundColor: !dirty || saving ? HBC_COLORS.gray300 : HBC_COLORS.navy,
            color: HBC_COLORS.white,
            opacity: !dirty || saving ? 0.6 : 1,
            cursor: !dirty || saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving...' : 'Save Defaults'}
        </button>
        <button
          type="button"
          onClick={() => { handleReset().catch(console.error); }}
          disabled={saving}
          style={{
            ...actionBtnBase,
            backgroundColor: HBC_COLORS.gray100,
            color: HBC_COLORS.gray800,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          Reset
        </button>
        {dirty && (
          <span style={{ fontSize: '12px', color: HBC_COLORS.warning, fontWeight: 500 }}>
            Unsaved changes
          </span>
        )}
        {saveSuccess && (
          <span style={{
            fontSize: '13px',
            color: '#065F46',
            backgroundColor: HBC_COLORS.successLight,
            padding: '4px 12px',
            borderRadius: '6px',
            fontWeight: 500,
          }}>
            Saved successfully
          </span>
        )}
        {saveError && (
          <span style={{
            fontSize: '13px',
            color: '#991B1B',
            backgroundColor: HBC_COLORS.errorLight,
            padding: '4px 12px',
            borderRadius: '6px',
            fontWeight: 500,
          }}>
            {saveError}
          </span>
        )}
      </div>

      {/* Metadata footer */}
      {defaults.lastModifiedBy && (
        <div style={{
          fontSize: '11px',
          color: HBC_COLORS.gray400,
          paddingTop: SPACING.sm,
          borderTop: `1px solid ${HBC_COLORS.gray100}`,
        }}>
          Last modified by {defaults.lastModifiedBy} on {defaults.lastModifiedDate}
        </div>
      )}
    </div>
  );
};

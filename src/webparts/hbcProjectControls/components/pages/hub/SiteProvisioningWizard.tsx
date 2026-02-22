import * as React from 'react';
import {
  ILead,
  IProvisioningLog,
  IProvisioningInput,
  ISiteProvisioningDefaults,
  IProvisioningValidationResult,
  IRoleGroupMapping,
  IProjectFeatureFlagDefault,
  PERMISSIONS,
  GoNoGoDecision,
} from '@hbc/sp-services';
import { useAppContext } from '../../contexts/AppContext';
import { ProvisioningStatusView } from '../../shared';
import { HBC_COLORS, SPACING, ELEVATION } from '../../../theme/tokens';

export interface ISiteProvisioningWizardProps {
  onClose: () => void;
  onProvisioningStarted: (log: IProvisioningLog) => void;
}

type WizardStep = 1 | 2 | 3;

const STEP_LABELS: Record<WizardStep, string> = {
  1: 'Select Lead',
  2: 'Configure',
  3: 'Review',
};

export const SiteProvisioningWizard: React.FC<ISiteProvisioningWizardProps> = ({
  onClose,
  onProvisioningStarted,
}) => {
  const { dataService, currentUser, hasPermission, isFeatureEnabled } = useAppContext();

  // Wizard state
  const [step, setStep] = React.useState<WizardStep>(1);

  // Step 1 state
  const [leads, setLeads] = React.useState<ILead[]>([]);
  const [leadsLoading, setLeadsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedLead, setSelectedLead] = React.useState<ILead | null>(null);
  const [provisioningInput, setProvisioningInput] = React.useState<IProvisioningInput | null>(null);
  const [validation, setValidation] = React.useState<IProvisioningValidationResult | null>(null);
  const [validating, setValidating] = React.useState(false);

  // Step 2 state
  const [defaults, setDefaults] = React.useState<ISiteProvisioningDefaults | null>(null);
  const [defaultsLoading, setDefaultsLoading] = React.useState(false);
  const [siteAlias, setSiteAlias] = React.useState('');
  const [hubUrl, setHubUrl] = React.useState('');
  const [autoAssign, setAutoAssign] = React.useState(true);
  const [featureFlags, setFeatureFlags] = React.useState<IProjectFeatureFlagDefault[]>([]);

  // Step 3 state
  const [provisioning, setProvisioning] = React.useState(false);
  const [provisioningLog, setProvisioningLog] = React.useState<IProvisioningLog | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Keyboard: Escape closes
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Fetch eligible leads on mount
  React.useEffect(() => {
    setLeadsLoading(true);
    dataService.getLeads().then(result => {
      const eligible = result.items.filter(l =>
        (l.GoNoGoDecision === GoNoGoDecision.Go || l.GoNoGoDecision === GoNoGoDecision.ConditionalGo)
        && !l.ProjectSiteURL
      );
      setLeads(eligible);
    }).catch(err => {
      console.error('Failed to fetch leads:', err);
      setError('Failed to load eligible leads.');
    }).finally(() => {
      setLeadsLoading(false);
    });
  }, [dataService]);

  // Load defaults when entering step 2
  React.useEffect(() => {
    if (step !== 2 || defaults) return;
    setDefaultsLoading(true);
    dataService.getSiteProvisioningDefaults().then(d => {
      setDefaults(d);
      setHubUrl(d.hubSiteUrl);
      setAutoAssign(d.autoAssignTeamFromMappings);
      setFeatureFlags(d.defaultProjectFeatureFlags.map(f => ({ ...f })));
      // Generate default site alias from project code
      if (provisioningInput?.projectCode) {
        setSiteAlias(provisioningInput.projectCode.replace(/\s+/g, '-').toLowerCase());
      }
    }).catch(err => {
      console.error('Failed to load provisioning defaults:', err);
      setError('Failed to load provisioning defaults.');
    }).finally(() => {
      setDefaultsLoading(false);
    });
  }, [step, defaults, dataService, provisioningInput?.projectCode]);

  const handleLeadSelect = async (lead: ILead): Promise<void> => {
    setSelectedLead(lead);
    setError(null);
    const input: IProvisioningInput = {
      leadId: lead.id,
      projectCode: lead.ProjectCode || '',
      projectName: lead.Title,
      clientName: lead.ClientName || '',
      division: lead.Division || '',
      region: lead.Region || '',
      requestedBy: currentUser?.email || '',
    };
    setProvisioningInput(input);
    setValidating(true);
    try {
      const result = await dataService.validateProvisioningInput(input);
      setValidation(result);
    } catch (err) {
      console.error('Validation failed:', err);
      setValidation({ isValid: false, errors: ['Validation request failed.'], warnings: [] });
    } finally {
      setValidating(false);
    }
  };

  const handleStartProvisioning = async (): Promise<void> => {
    if (!provisioningInput || !defaults) return;
    setProvisioning(true);
    setError(null);
    try {
      // Apply overrides to defaults
      const finalDefaults: ISiteProvisioningDefaults = {
        ...defaults,
        hubSiteUrl: hubUrl,
        autoAssignTeamFromMappings: autoAssign,
        defaultProjectFeatureFlags: featureFlags,
      };
      // Apply site alias override if changed
      const finalInput: IProvisioningInput = {
        ...provisioningInput,
        siteNameOverride: siteAlias || undefined,
      };
      const log = await dataService.provisionSiteWithDefaults(finalInput, finalDefaults);
      setProvisioningLog(log);
      onProvisioningStarted(log);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setProvisioning(false);
    }
  };

  const filteredLeads = React.useMemo(() => {
    if (!searchTerm.trim()) return leads;
    const term = searchTerm.toLowerCase();
    return leads.filter(l =>
      l.Title.toLowerCase().includes(term) ||
      (l.ProjectCode || '').toLowerCase().includes(term) ||
      (l.ClientName || '').toLowerCase().includes(term)
    );
  }, [leads, searchTerm]);

  const canProceedToStep2 = selectedLead && validation?.isValid && !validating;
  const canProceedToStep3 = defaults && hubUrl.trim().length > 0;

  const handleNext = (): void => {
    if (step === 1 && canProceedToStep2) setStep(2);
    else if (step === 2 && canProceedToStep3) setStep(3);
  };

  const handleBack = (): void => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const handleFeatureFlagToggle = (featureName: string): void => {
    setFeatureFlags(prev =>
      prev.map(f => f.featureName === featureName ? { ...f, enabled: !f.enabled } : f)
    );
  };

  // --- Styles ---
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: HBC_COLORS.white,
    borderRadius: '12px',
    boxShadow: ELEVATION.level4,
    width: '680px',
    maxWidth: '90vw',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    padding: `${SPACING.lg} ${SPACING.lg} ${SPACING.md}`,
    borderBottom: `1px solid ${HBC_COLORS.gray200}`,
  };

  const bodyStyle: React.CSSProperties = {
    padding: SPACING.lg,
    flex: 1,
    overflowY: 'auto',
    minHeight: '300px',
  };

  const footerStyle: React.CSSProperties = {
    padding: `${SPACING.md} ${SPACING.lg}`,
    borderTop: `1px solid ${HBC_COLORS.gray200}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: `1px solid ${HBC_COLORS.gray200}`,
    fontSize: '13px',
    color: HBC_COLORS.gray800,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const btnPrimary: React.CSSProperties = {
    padding: '8px 20px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: HBC_COLORS.navy,
    color: HBC_COLORS.white,
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  };

  const btnSecondary: React.CSSProperties = {
    padding: '8px 20px',
    borderRadius: '6px',
    border: `1px solid ${HBC_COLORS.gray300}`,
    backgroundColor: HBC_COLORS.white,
    color: HBC_COLORS.gray800,
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  };

  const btnDisabled: React.CSSProperties = {
    opacity: 0.5,
    cursor: 'not-allowed',
  };

  // --- Step Indicator ---
  const renderStepIndicator = (): React.ReactElement => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: SPACING.md, marginBottom: SPACING.md }}>
      {([1, 2, 3] as WizardStep[]).map((s, idx) => (
        <React.Fragment key={s}>
          {idx > 0 && (
            <div style={{
              width: '40px',
              height: '2px',
              backgroundColor: step >= s ? HBC_COLORS.navy : HBC_COLORS.gray200,
              transition: 'background-color 0.2s',
            }} />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: step === s ? HBC_COLORS.navy : step > s ? HBC_COLORS.success : HBC_COLORS.gray200,
              color: step >= s ? HBC_COLORS.white : HBC_COLORS.gray500,
              transition: 'all 0.2s',
            }}>
              {step > s ? '\u2713' : s}
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: step === s ? 600 : 400,
              color: step === s ? HBC_COLORS.navy : HBC_COLORS.gray500,
            }}>
              {STEP_LABELS[s]}
            </span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );

  // --- Step 1: Select Lead ---
  const renderStep1 = (): React.ReactElement => (
    <div>
      <div style={{ marginBottom: SPACING.md }}>
        <input
          type="text"
          placeholder="Search by project name, code, or client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={inputStyle}
          autoFocus
        />
      </div>

      {leadsLoading ? (
        <div style={{ padding: SPACING.xl, textAlign: 'center', color: HBC_COLORS.gray400 }}>
          Loading eligible leads...
        </div>
      ) : filteredLeads.length === 0 ? (
        <div style={{ padding: SPACING.xl, textAlign: 'center', color: HBC_COLORS.gray400 }}>
          {leads.length === 0
            ? 'No eligible leads found. Leads must have a Go or Conditional Go decision and no existing site.'
            : 'No leads match your search.'}
        </div>
      ) : (
        <div style={{ maxHeight: '260px', overflowY: 'auto', border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: '6px' }}>
          {filteredLeads.map(lead => {
            const isSelected = selectedLead?.id === lead.id;
            return (
              <div
                key={lead.id}
                onClick={() => { handleLeadSelect(lead).catch(console.error); }}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  borderBottom: `1px solid ${HBC_COLORS.gray100}`,
                  backgroundColor: isSelected ? HBC_COLORS.infoLight : 'transparent',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = HBC_COLORS.gray50; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: HBC_COLORS.navy, fontSize: '14px' }}>
                      {lead.Title}
                    </span>
                    {lead.ProjectCode && (
                      <span style={{
                        marginLeft: SPACING.sm,
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        color: HBC_COLORS.gray500,
                        backgroundColor: HBC_COLORS.gray100,
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}>
                        {lead.ProjectCode}
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    color: lead.GoNoGoDecision === GoNoGoDecision.Go ? '#065F46' : '#92400E',
                    backgroundColor: lead.GoNoGoDecision === GoNoGoDecision.Go ? HBC_COLORS.successLight : HBC_COLORS.warningLight,
                  }}>
                    {lead.GoNoGoDecision}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: SPACING.md, marginTop: '4px', fontSize: '12px', color: HBC_COLORS.gray500 }}>
                  {lead.ClientName && <span>Client: {lead.ClientName}</span>}
                  {lead.Division && <span>Division: {lead.Division}</span>}
                  {lead.Region && <span>Region: {lead.Region}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected lead details */}
      {selectedLead && (
        <div style={{
          marginTop: SPACING.md,
          padding: SPACING.md,
          backgroundColor: HBC_COLORS.gray50,
          borderRadius: '8px',
          border: `1px solid ${HBC_COLORS.gray200}`,
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: HBC_COLORS.navy, marginBottom: SPACING.sm }}>
            Selected: {selectedLead.Title}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACING.sm, fontSize: '12px', color: HBC_COLORS.gray500 }}>
            <span>Project Code: <strong style={{ color: HBC_COLORS.gray800 }}>{selectedLead.ProjectCode || 'N/A'}</strong></span>
            <span>Client: <strong style={{ color: HBC_COLORS.gray800 }}>{selectedLead.ClientName || 'N/A'}</strong></span>
            <span>Division: <strong style={{ color: HBC_COLORS.gray800 }}>{selectedLead.Division || 'N/A'}</strong></span>
            <span>Region: <strong style={{ color: HBC_COLORS.gray800 }}>{selectedLead.Region || 'N/A'}</strong></span>
            <span>Decision: <strong style={{ color: HBC_COLORS.gray800 }}>{selectedLead.GoNoGoDecision || 'N/A'}</strong></span>
            <span>Sector: <strong style={{ color: HBC_COLORS.gray800 }}>{selectedLead.Sector || 'N/A'}</strong></span>
          </div>

          {/* Validation result */}
          {validating && (
            <div style={{ marginTop: SPACING.sm, fontSize: '12px', color: HBC_COLORS.info }}>
              Validating provisioning input...
            </div>
          )}
          {validation && !validating && (
            <div style={{ marginTop: SPACING.sm }}>
              {validation.isValid ? (
                <div style={{
                  padding: '6px 10px',
                  backgroundColor: HBC_COLORS.successLight,
                  color: '#065F46',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                }}>
                  Validation passed. Ready to proceed.
                </div>
              ) : (
                <div style={{
                  padding: '6px 10px',
                  backgroundColor: HBC_COLORS.errorLight,
                  color: '#991B1B',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}>
                  {validation.errors.map((e, i) => (
                    <div key={i}>{e}</div>
                  ))}
                </div>
              )}
              {validation.warnings.length > 0 && (
                <div style={{
                  marginTop: SPACING.xs,
                  padding: '6px 10px',
                  backgroundColor: HBC_COLORS.warningLight,
                  color: '#92400E',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}>
                  {validation.warnings.map((w, i) => (
                    <div key={i}>{w}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // --- Step 2: Configure ---
  const renderStep2 = (): React.ReactElement => {
    if (defaultsLoading) {
      return (
        <div style={{ padding: SPACING.xl, textAlign: 'center', color: HBC_COLORS.gray400 }}>
          Loading provisioning defaults...
        </div>
      );
    }

    if (!defaults) {
      return (
        <div style={{ padding: SPACING.xl, textAlign: 'center', color: HBC_COLORS.error }}>
          Failed to load provisioning defaults.
        </div>
      );
    }

    return (
      <div>
        {/* Site Alias */}
        <div style={{ marginBottom: SPACING.lg }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: HBC_COLORS.navy, marginBottom: '4px' }}>
            Site Alias
          </label>
          <p style={{ fontSize: '12px', color: HBC_COLORS.gray500, margin: '0 0 6px 0' }}>
            The URL-friendly name for the SharePoint site (e.g., project-code-name).
          </p>
          <input
            type="text"
            value={siteAlias}
            onChange={(e) => setSiteAlias(e.target.value)}
            style={inputStyle}
            placeholder="project-site-alias"
          />
        </div>

        {/* Hub URL */}
        <div style={{ marginBottom: SPACING.lg }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: HBC_COLORS.navy, marginBottom: '4px' }}>
            Hub Site URL
          </label>
          <input
            type="text"
            value={hubUrl}
            onChange={(e) => setHubUrl(e.target.value)}
            style={{ ...inputStyle, fontFamily: 'monospace' }}
            placeholder="https://tenant.sharepoint.com/sites/HBCentral"
          />
        </div>

        {/* Auto-assign toggle */}
        <div style={{ marginBottom: SPACING.lg, display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
          <button
            onClick={() => setAutoAssign(!autoAssign)}
            style={{
              width: '40px',
              height: '22px',
              borderRadius: '11px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: autoAssign ? HBC_COLORS.success : HBC_COLORS.gray300,
              position: 'relative',
              transition: 'background-color 0.2s',
              flexShrink: 0,
            }}
          >
            <span style={{
              display: 'block',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: HBC_COLORS.white,
              position: 'absolute',
              top: '3px',
              left: autoAssign ? '21px' : '3px',
              transition: 'left 0.2s',
            }} />
          </button>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: HBC_COLORS.navy }}>
              Auto-assign team from mappings
            </span>
            <p style={{ fontSize: '12px', color: HBC_COLORS.gray500, margin: '2px 0 0' }}>
              Automatically assign team members based on region/sector assignment mappings.
            </p>
          </div>
        </div>

        {/* Feature flag checklist */}
        <div style={{ marginBottom: SPACING.lg }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: HBC_COLORS.navy, marginBottom: SPACING.sm }}>
            Project Feature Flags
          </label>
          <div style={{ border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: '6px', overflow: 'hidden' }}>
            {featureFlags.map(flag => (
              <div
                key={flag.featureName}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderBottom: `1px solid ${HBC_COLORS.gray100}`,
                  fontSize: '13px',
                }}
              >
                <span style={{ color: HBC_COLORS.gray800 }}>{flag.featureName}</span>
                <button
                  onClick={() => handleFeatureFlagToggle(flag.featureName)}
                  style={{
                    width: '36px',
                    height: '20px',
                    borderRadius: '10px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: flag.enabled ? HBC_COLORS.success : HBC_COLORS.gray300,
                    position: 'relative',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <span style={{
                    display: 'block',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: HBC_COLORS.white,
                    position: 'absolute',
                    top: '3px',
                    left: flag.enabled ? '19px' : '3px',
                    transition: 'left 0.2s',
                  }} />
                </button>
              </div>
            ))}
            {featureFlags.length === 0 && (
              <div style={{ padding: SPACING.md, textAlign: 'center', color: HBC_COLORS.gray400, fontSize: '12px' }}>
                No default feature flags configured.
              </div>
            )}
          </div>
        </div>

        {/* Role-to-group mapping summary (read-only) */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: HBC_COLORS.navy, marginBottom: SPACING.sm }}>
            Role-to-Group Mapping
          </label>
          <div style={{
            border: `1px solid ${HBC_COLORS.gray200}`,
            borderRadius: '6px',
            overflow: 'hidden',
            backgroundColor: HBC_COLORS.gray50,
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              padding: '6px 12px',
              borderBottom: `1px solid ${HBC_COLORS.gray200}`,
              fontSize: '11px',
              fontWeight: 700,
              color: HBC_COLORS.gray500,
              textTransform: 'uppercase',
            }}>
              <span>Role</span>
              <span>SP Group</span>
            </div>
            {defaults.roleToGroupMappings.map((mapping: IRoleGroupMapping, idx: number) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  padding: '6px 12px',
                  borderBottom: `1px solid ${HBC_COLORS.gray100}`,
                  fontSize: '13px',
                }}
              >
                <span style={{ color: HBC_COLORS.gray800 }}>{mapping.roleName}</span>
                <span style={{ color: HBC_COLORS.gray500 }}>{mapping.spGroupType}</span>
              </div>
            ))}
            {defaults.roleToGroupMappings.length === 0 && (
              <div style={{ padding: SPACING.md, textAlign: 'center', color: HBC_COLORS.gray400, fontSize: '12px' }}>
                No role-to-group mappings configured.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- Step 3: Review & Provision ---
  const renderStep3 = (): React.ReactElement => {
    if (provisioningLog) {
      return (
        <div>
          <div style={{
            padding: SPACING.md,
            backgroundColor: HBC_COLORS.successLight,
            borderRadius: '8px',
            color: '#065F46',
            fontSize: '13px',
            fontWeight: 500,
            marginBottom: SPACING.lg,
          }}>
            Provisioning started successfully for {provisioningLog.projectCode}.
          </div>
          <ProvisioningStatusView
            projectCode={provisioningLog.projectCode}
            pollInterval={1000}
          />
        </div>
      );
    }

    return (
      <div>
        {/* Summary */}
        <div style={{
          padding: SPACING.md,
          backgroundColor: HBC_COLORS.gray50,
          borderRadius: '8px',
          border: `1px solid ${HBC_COLORS.gray200}`,
          marginBottom: SPACING.lg,
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: HBC_COLORS.navy }}>
            Provisioning Summary
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '8px', fontSize: '13px' }}>
            <span style={{ color: HBC_COLORS.gray500, fontWeight: 500 }}>Project Name:</span>
            <span style={{ color: HBC_COLORS.gray800, fontWeight: 600 }}>{provisioningInput?.projectName}</span>

            <span style={{ color: HBC_COLORS.gray500, fontWeight: 500 }}>Project Code:</span>
            <span style={{ color: HBC_COLORS.gray800, fontFamily: 'monospace' }}>{provisioningInput?.projectCode}</span>

            <span style={{ color: HBC_COLORS.gray500, fontWeight: 500 }}>Client:</span>
            <span style={{ color: HBC_COLORS.gray800 }}>{provisioningInput?.clientName || 'N/A'}</span>

            <span style={{ color: HBC_COLORS.gray500, fontWeight: 500 }}>Division:</span>
            <span style={{ color: HBC_COLORS.gray800 }}>{provisioningInput?.division || 'N/A'}</span>

            <span style={{ color: HBC_COLORS.gray500, fontWeight: 500 }}>Region:</span>
            <span style={{ color: HBC_COLORS.gray800 }}>{provisioningInput?.region || 'N/A'}</span>

            <span style={{ color: HBC_COLORS.gray500, fontWeight: 500 }}>Site Alias:</span>
            <span style={{ color: HBC_COLORS.gray800, fontFamily: 'monospace' }}>{siteAlias || '(auto-generated)'}</span>

            <span style={{ color: HBC_COLORS.gray500, fontWeight: 500 }}>Hub URL:</span>
            <span style={{ color: HBC_COLORS.gray800, fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>{hubUrl}</span>

            <span style={{ color: HBC_COLORS.gray500, fontWeight: 500 }}>Auto-Assign Team:</span>
            <span style={{ color: autoAssign ? '#065F46' : HBC_COLORS.gray500, fontWeight: 500 }}>
              {autoAssign ? 'Yes' : 'No'}
            </span>

            <span style={{ color: HBC_COLORS.gray500, fontWeight: 500 }}>Requested By:</span>
            <span style={{ color: HBC_COLORS.gray800 }}>{provisioningInput?.requestedBy}</span>
          </div>
        </div>

        {/* Feature flags summary */}
        {featureFlags.length > 0 && (
          <div style={{
            padding: SPACING.md,
            backgroundColor: HBC_COLORS.gray50,
            borderRadius: '8px',
            border: `1px solid ${HBC_COLORS.gray200}`,
            marginBottom: SPACING.lg,
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: HBC_COLORS.navy }}>
              Feature Flags ({featureFlags.filter(f => f.enabled).length} of {featureFlags.length} enabled)
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {featureFlags.map(f => (
                <span
                  key={f.featureName}
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 500,
                    backgroundColor: f.enabled ? HBC_COLORS.successLight : HBC_COLORS.gray100,
                    color: f.enabled ? '#065F46' : HBC_COLORS.gray500,
                  }}
                >
                  {f.featureName}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Validation warnings */}
        {validation && validation.warnings.length > 0 && (
          <div style={{
            padding: SPACING.md,
            backgroundColor: HBC_COLORS.warningLight,
            borderRadius: '8px',
            border: '1px solid #F59E0B',
            marginBottom: SPACING.lg,
            fontSize: '12px',
            color: '#92400E',
          }}>
            <strong>Warnings:</strong>
            {validation.warnings.map((w, i) => (
              <div key={i} style={{ marginTop: '4px' }}>{w}</div>
            ))}
          </div>
        )}

        {/* Error display */}
        {error && (
          <div style={{
            padding: SPACING.md,
            backgroundColor: HBC_COLORS.errorLight,
            borderRadius: '8px',
            color: '#991B1B',
            fontSize: '13px',
            marginBottom: SPACING.lg,
          }}>
            {error}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={overlayStyle}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Site Provisioning Wizard"
    >
      <div style={cardStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: HBC_COLORS.navy }}>
              Site Provisioning Wizard
            </h2>
            <button
              onClick={onClose}
              style={{
                border: 'none',
                background: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: HBC_COLORS.gray500,
                padding: '4px 8px',
                lineHeight: 1,
              }}
              aria-label="Close dialog"
            >
              {'\u00D7'}
            </button>
          </div>
          {renderStepIndicator()}
        </div>

        {/* Body */}
        <div style={bodyStyle}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {/* Global error */}
          {error && step !== 3 && (
            <div style={{
              marginTop: SPACING.md,
              padding: SPACING.md,
              backgroundColor: HBC_COLORS.errorLight,
              borderRadius: '8px',
              color: '#991B1B',
              fontSize: '13px',
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <div>
            {step > 1 && !provisioningLog && (
              <button
                onClick={handleBack}
                style={btnSecondary}
                disabled={provisioning}
              >
                Back
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: SPACING.sm }}>
            <button
              onClick={onClose}
              style={btnSecondary}
            >
              {provisioningLog ? 'Close' : 'Cancel'}
            </button>
            {step < 3 && !provisioningLog && (
              <button
                onClick={handleNext}
                disabled={
                  (step === 1 && !canProceedToStep2) ||
                  (step === 2 && !canProceedToStep3)
                }
                style={{
                  ...btnPrimary,
                  ...((step === 1 && !canProceedToStep2) || (step === 2 && !canProceedToStep3) ? btnDisabled : {}),
                }}
              >
                Next
              </button>
            )}
            {step === 3 && !provisioningLog && (
              <button
                onClick={() => { handleStartProvisioning().catch(console.error); }}
                disabled={provisioning || !provisioningInput || !defaults}
                style={{
                  ...btnPrimary,
                  backgroundColor: HBC_COLORS.success,
                  ...(provisioning || !provisioningInput || !defaults ? btnDisabled : {}),
                }}
              >
                {provisioning ? 'Starting...' : 'Start Provisioning'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HBC_COLORS } from '../../../theme/tokens';
import { useAppContext } from '../../contexts/AppContext';
import { useJobNumberRequest } from '../../hooks/useJobNumberRequest';
import { useLeads } from '../../hooks/useLeads';
import { IProjectType } from '../../../models/IProjectType';
import { IStandardCostCode } from '../../../models/IStandardCostCode';
import { NotificationEvent } from '../../../models/enums';
import { NotificationService } from '../../../services/NotificationService';
import { ProvisioningService } from '../../../services/ProvisioningService';

const ESTIMATING_DEFAULT_CODES = ['01-01-413', '01-01-025', '01-01-311', '01-01-302'];

export const JobNumberRequestForm: React.FC = () => {
  const { leadId: leadIdParam } = useParams<{ leadId: string }>();
  const leadId = Number(leadIdParam);
  const navigate = useNavigate();
  const { dataService, currentUser } = useAppContext();
  const { projectTypes, costCodes, fetchReferenceData, createRequest, fetchRequestByLeadId } = useJobNumberRequest();
  const { getLeadById } = useLeads();

  const [lead, setLead] = React.useState<{ Title: string; ClientName: string; ProjectCode?: string; Division: string; Region: string } | null>(null);
  const [existingRequest, setExistingRequest] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Form state
  const [requiredByDate, setRequiredByDate] = React.useState('');
  const [projectAddress, setProjectAddress] = React.useState('');
  const [projectExecutive, setProjectExecutive] = React.useState('');
  const [projectManager, setProjectManager] = React.useState('');
  const [selectedProjectType, setSelectedProjectType] = React.useState('');
  const [isEstimatingOnly, setIsEstimatingOnly] = React.useState(false);
  const [selectedCostCodes, setSelectedCostCodes] = React.useState<string[]>([]);
  const [notes, setNotes] = React.useState('');
  const [costCodeSearch, setCostCodeSearch] = React.useState('');
  const [projectTypeSearch, setProjectTypeSearch] = React.useState('');

  React.useEffect(() => {
    const init = async (): Promise<void> => {
      try {
        setIsLoading(true);
        await fetchReferenceData();
        const leadData = await getLeadById(leadId);
        if (leadData) {
          setLead({ Title: leadData.Title, ClientName: leadData.ClientName, ProjectCode: leadData.ProjectCode, Division: leadData.Division, Region: leadData.Region });
        }
        const existing = await fetchRequestByLeadId(leadId);
        if (existing && existing.RequestStatus === 'Pending') {
          setExistingRequest(true);
        }
      } finally {
        setIsLoading(false);
      }
    };
    init().catch(console.error);
  }, [leadId, fetchReferenceData, getLeadById, fetchRequestByLeadId]);

  // Auto-add estimating codes when toggle changes
  React.useEffect(() => {
    if (isEstimatingOnly) {
      setSelectedCostCodes(prev => {
        const merged = new Set(prev);
        ESTIMATING_DEFAULT_CODES.forEach(c => merged.add(c));
        return Array.from(merged);
      });
    }
  }, [isEstimatingOnly]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!requiredByDate) errs.requiredByDate = 'Required by date is required';
    if (!projectAddress.trim()) errs.projectAddress = 'Project address is required';
    if (!projectExecutive.trim()) errs.projectExecutive = 'Project executive is required';
    if (!selectedProjectType) errs.projectType = 'Project type is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (holdProvisioning: boolean): Promise<void> => {
    if (!validate() || !currentUser || !lead) return;

    try {
      setIsSaving(true);
      const typeObj = projectTypes.find(t => t.code === selectedProjectType);

      await createRequest({
        LeadID: leadId,
        RequestDate: new Date().toISOString().split('T')[0],
        Originator: currentUser.email,
        RequiredByDate: requiredByDate,
        ProjectAddress: projectAddress,
        ProjectExecutive: projectExecutive,
        ProjectManager: projectManager || undefined,
        ProjectType: selectedProjectType,
        ProjectTypeLabel: typeObj ? `${typeObj.code} ${typeObj.label}` : selectedProjectType,
        IsEstimatingOnly: isEstimatingOnly,
        RequestedCostCodes: selectedCostCodes,
        SiteProvisioningHeld: holdProvisioning,
        TempProjectCode: !holdProvisioning ? lead.ProjectCode : undefined,
        Notes: notes || undefined,
      });

      // Send notification to accounting
      const notificationService = new NotificationService(dataService);
      notificationService.notify(
        NotificationEvent.JobNumberRequested,
        {
          leadTitle: lead.Title,
          leadId,
          clientName: lead.ClientName,
          projectCode: lead.ProjectCode,
          dueDate: requiredByDate,
        },
        currentUser.email
      ).catch(console.error);

      // If not holding provisioning, trigger site creation
      if (!holdProvisioning && lead.ProjectCode) {
        const provisioningService = new ProvisioningService(dataService);
        provisioningService.provisionSite({
          leadId,
          projectCode: lead.ProjectCode,
          projectName: lead.Title,
          clientName: lead.ClientName,
          division: lead.Division,
          region: lead.Region,
          requestedBy: currentUser.email,
          siteNameOverride: lead.Title.replace(/[^a-zA-Z0-9-]/g, ''),
        }).catch(console.error);
      }

      setToastMessage(holdProvisioning
        ? 'Job number request submitted. Provisioning held until Accounting assigns official number.'
        : 'Job number request submitted. Site provisioning started with temporary code.');

      setTimeout(() => navigate(-1), 2000);
    } catch {
      setErrors({ submit: 'Failed to submit request. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCostCodeToggle = (codeId: string): void => {
    setSelectedCostCodes(prev =>
      prev.includes(codeId) ? prev.filter(c => c !== codeId) : [...prev, codeId]
    );
  };

  const filteredProjectTypes = projectTypes.filter(t =>
    !projectTypeSearch || t.label.toLowerCase().includes(projectTypeSearch.toLowerCase()) || t.code.includes(projectTypeSearch)
  );

  const filteredCostCodes = costCodes.filter(c =>
    !costCodeSearch || c.description.toLowerCase().includes(costCodeSearch.toLowerCase()) || c.id.includes(costCodeSearch)
  );

  // Group project types by office
  const groupedTypes: Record<string, IProjectType[]> = {};
  for (const pt of filteredProjectTypes) {
    if (!groupedTypes[pt.office]) groupedTypes[pt.office] = [];
    groupedTypes[pt.office].push(pt);
  }

  if (isLoading) {
    return <div style={{ padding: 40, textAlign: 'center', color: HBC_COLORS.gray500 }}>Loading...</div>;
  }

  if (!lead) {
    return <div style={{ padding: 40, textAlign: 'center', color: HBC_COLORS.gray500 }}>Lead not found.</div>;
  }

  if (existingRequest) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2 style={{ color: HBC_COLORS.navy }}>Request Already Submitted</h2>
        <p style={{ color: HBC_COLORS.gray600 }}>A pending job number request already exists for this lead. Please check the Accounting Queue for status.</p>
        <button onClick={() => navigate(-1)} style={btnSecondaryStyle}>Go Back</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: HBC_COLORS.navy, margin: 0 }}>New Job Number Request</h1>
        <p style={{ fontSize: 14, color: HBC_COLORS.gray500, marginTop: 4 }}>
          {lead.Title} — {lead.ClientName}
        </p>
      </div>

      {toastMessage && (
        <div style={{ padding: '12px 16px', background: '#DEF7EC', color: '#03543F', borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
          {toastMessage}
        </div>
      )}

      {errors.submit && (
        <div style={{ padding: '12px 16px', background: '#FDE8E8', color: '#9B1C1C', borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
          {errors.submit}
        </div>
      )}

      {/* Form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Required By Date */}
        <div>
          <label style={labelStyle}>Required By Date *</label>
          <input type="date" value={requiredByDate} onChange={e => setRequiredByDate(e.target.value)} style={inputStyle} />
          {errors.requiredByDate && <span style={errorStyle}>{errors.requiredByDate}</span>}
        </div>

        {/* Estimating Only Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 24 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
            <input
              type="checkbox"
              checked={isEstimatingOnly}
              onChange={e => setIsEstimatingOnly(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <span style={{ fontWeight: 600, color: HBC_COLORS.navy }}>Estimating / Bidding Only</span>
          </label>
        </div>

        {/* Project Address */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Project Address *</label>
          <input
            type="text"
            value={projectAddress}
            onChange={e => setProjectAddress(e.target.value)}
            placeholder="Full street address"
            style={inputStyle}
          />
          {errors.projectAddress && <span style={errorStyle}>{errors.projectAddress}</span>}
        </div>

        {/* Project Executive */}
        <div>
          <label style={labelStyle}>Project Executive *</label>
          <input
            type="email"
            value={projectExecutive}
            onChange={e => setProjectExecutive(e.target.value)}
            placeholder="email@hedrickbrothers.com"
            style={inputStyle}
          />
          {errors.projectExecutive && <span style={errorStyle}>{errors.projectExecutive}</span>}
        </div>

        {/* Project Manager */}
        <div>
          <label style={labelStyle}>Project Manager</label>
          <input
            type="email"
            value={projectManager}
            onChange={e => setProjectManager(e.target.value)}
            placeholder="email@hedrickbrothers.com (optional)"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Project Type Selection */}
      <div style={{ marginTop: 24 }}>
        <label style={labelStyle}>Project Type * <span style={{ fontWeight: 400, color: HBC_COLORS.gray400 }}>(select one)</span></label>
        <input
          type="text"
          placeholder="Search project types..."
          value={projectTypeSearch}
          onChange={e => setProjectTypeSearch(e.target.value)}
          style={{ ...inputStyle, marginBottom: 12 }}
        />
        {errors.projectType && <span style={errorStyle}>{errors.projectType}</span>}
        <div style={{ border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 6, maxHeight: 240, overflowY: 'auto', background: HBC_COLORS.white }}>
          {Object.entries(groupedTypes).map(([office, types]) => (
            <div key={office}>
              <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: HBC_COLORS.gray500, textTransform: 'uppercase', letterSpacing: 0.5, background: HBC_COLORS.gray50, borderBottom: `1px solid ${HBC_COLORS.gray200}`, position: 'sticky', top: 0 }}>
                {office}
              </div>
              {types.map(t => (
                <label
                  key={t.code}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                    cursor: 'pointer', fontSize: 13,
                    background: selectedProjectType === t.code ? '#EFF6FF' : 'transparent',
                    borderBottom: `1px solid ${HBC_COLORS.gray100}`,
                  }}
                >
                  <input
                    type="radio"
                    name="projectType"
                    checked={selectedProjectType === t.code}
                    onChange={() => setSelectedProjectType(t.code)}
                  />
                  <span style={{ fontWeight: 600, color: HBC_COLORS.navy, minWidth: 40 }}>{t.code}</span>
                  <span style={{ color: HBC_COLORS.gray600 }}>{t.label}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Cost Codes */}
      <div style={{ marginTop: 24 }}>
        <label style={labelStyle}>
          Requested Cost Codes
          {isEstimatingOnly && <span style={{ fontWeight: 400, fontSize: 12, color: HBC_COLORS.orange, marginLeft: 8 }}>Default estimating codes auto-added</span>}
        </label>
        <input
          type="text"
          placeholder="Search cost codes..."
          value={costCodeSearch}
          onChange={e => setCostCodeSearch(e.target.value)}
          style={{ ...inputStyle, marginBottom: 12 }}
        />
        {/* Selected codes summary */}
        {selectedCostCodes.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {selectedCostCodes.map(code => {
              const cc = costCodes.find(c => c.id === code);
              return (
                <span key={code} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: HBC_COLORS.gray100, borderRadius: 12, fontSize: 11, color: HBC_COLORS.navy }}>
                  {code} {cc ? `- ${cc.description}` : ''}
                  <button onClick={() => handleCostCodeToggle(code)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: HBC_COLORS.gray400, lineHeight: 1, padding: 0 }}>&times;</button>
                </span>
              );
            })}
          </div>
        )}
        <div style={{ border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 6, maxHeight: 200, overflowY: 'auto' }}>
          {filteredCostCodes.map((cc: IStandardCostCode) => (
            <label
              key={cc.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px',
                cursor: 'pointer', fontSize: 13,
                background: selectedCostCodes.includes(cc.id) ? '#EFF6FF' : 'transparent',
                borderBottom: `1px solid ${HBC_COLORS.gray100}`,
              }}
            >
              <input
                type="checkbox"
                checked={selectedCostCodes.includes(cc.id)}
                onChange={() => handleCostCodeToggle(cc.id)}
              />
              <span style={{ fontWeight: 600, color: HBC_COLORS.navy, minWidth: 70 }}>{cc.id}</span>
              <span style={{ color: HBC_COLORS.gray600 }}>{cc.description}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: HBC_COLORS.gray400 }}>Phase {cc.phase}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginTop: 24 }}>
        <label style={labelStyle}>Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Additional information for Accounting..."
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {/* Submit Buttons */}
      <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: `1px solid ${HBC_COLORS.gray200}`, paddingTop: 24 }}>
        <button onClick={() => navigate(-1)} style={btnSecondaryStyle} disabled={isSaving}>
          Cancel
        </button>
        <button onClick={() => handleSubmit(true)} style={btnPrimaryStyle} disabled={isSaving}>
          {isSaving ? 'Submitting...' : 'Submit Request (Recommended)'}
        </button>
        <button onClick={() => handleSubmit(false)} style={btnOutlineStyle} disabled={isSaving || !lead.ProjectCode}>
          {isSaving ? 'Submitting...' : 'Submit & Create Project Site'}
        </button>
      </div>

      <p style={{ fontSize: 11, color: HBC_COLORS.gray400, marginTop: 12, textAlign: 'right' }}>
        &ldquo;Submit Request&rdquo; holds site provisioning until Accounting assigns an official job number.<br />
        &ldquo;Submit &amp; Create Project Site&rdquo; provisions immediately using a temporary tracking code.
      </p>
    </div>
  );
};

// -- Styles --

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #D1D5DB',
  borderRadius: 6,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

const errorStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: '#DC2626',
  marginTop: 2,
};

const btnPrimaryStyle: React.CSSProperties = {
  padding: '10px 20px',
  background: '#1B2A4A',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

const btnSecondaryStyle: React.CSSProperties = {
  padding: '10px 20px',
  background: '#F3F4F6',
  color: '#374151',
  border: '1px solid #D1D5DB',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
};

const btnOutlineStyle: React.CSSProperties = {
  padding: '10px 20px',
  background: 'transparent',
  color: '#E87722',
  border: '2px solid #E87722',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

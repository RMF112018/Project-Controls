import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HBC_COLORS } from '../../../theme/tokens';
import { useEstimatingKickoff } from '../../hooks/useEstimatingKickoff';
import { useEstimating } from '../../hooks/useEstimating';
import { useLeads } from '../../hooks/useLeads';
import {
  IEstimatingKickoffItem,
  IKeyPersonnelEntry,
  IPersonAssignment,
  IEstimatingTracker,
  PERMISSIONS,
  RoleName
} from '@hbc/sp-services';
import { useAppContext } from '../../contexts/AppContext';
import { AzureADPeoplePicker } from '../../shared/AzureADPeoplePicker';
import { Breadcrumb } from '../../shared/Breadcrumb';
import { SkeletonLoader } from '../../shared/SkeletonLoader';

export const EstimatingKickoffPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { kickoff, fetchKickoff, createKickoff, updateKickoff, updateItem, addItem, removeItem, updateKeyPersonnel } = useEstimatingKickoff();
  const { getRecordById } = useEstimating();
  const { leads, fetchLeads, updateLead } = useLeads();
  const { hasPermission, currentUser, dataService } = useAppContext();
  const [isLoading, setIsLoading] = React.useState(true);
  const [estimatingRecord, setEstimatingRecord] = React.useState<IEstimatingTracker | null>(null);
  const [projectInfo, setProjectInfo] = React.useState<ProjectInfoState>({});

  const canEdit = hasPermission(PERMISSIONS.KICKOFF_EDIT);
  const canEditTemplate = hasPermission(PERMISSIONS.KICKOFF_TEMPLATE_EDIT);
  const isEC = currentUser?.roles.includes(RoleName.EstimatingCoordinator);

  const lead = React.useMemo(() => {
    if (!estimatingRecord) return undefined;
    return leads.find(l => l.id === estimatingRecord.LeadID) ?? leads.find(l => l.ProjectCode === estimatingRecord.ProjectCode);
  }, [leads, estimatingRecord]);

  // Load estimating record by route id, then fetch kickoff by ProjectCode
  React.useEffect(() => {
    const load = async (): Promise<void> => {
      if (!id) return;
      setIsLoading(true);
      await fetchLeads();
      const rec = await getRecordById(Number(id));
      setEstimatingRecord(rec);
      if (rec?.ProjectCode) {
        await fetchKickoff(rec.ProjectCode);
      }
      setIsLoading(false);
    };
    load().catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Auto-create kickoff if none exists
  React.useEffect(() => {
    if (!estimatingRecord?.ProjectCode) return;
    if (!kickoff && lead) {
      createKickoff(lead.id, estimatingRecord.ProjectCode).catch(console.error);
    }
  }, [kickoff, lead, estimatingRecord, createKickoff]);

  // Sync project info from kickoff/lead
  React.useEffect(() => {
    if (!kickoff && !lead) return;
    setProjectInfo({
      Architect: kickoff?.Architect ?? lead?.AE ?? '',
      ProposalDueDateTime: kickoff?.ProposalDueDateTime ?? lead?.ProposalBidDue ?? '',
      ProposalType: kickoff?.ProposalType ?? '',
      RFIFormat: kickoff?.RFIFormat ?? undefined,
      PrimaryOwnerContact: kickoff?.PrimaryOwnerContact ?? '',
      ProposalDeliveryMethod: kickoff?.ProposalDeliveryMethod ?? '',
      CopiesIfHandDelivered: kickoff?.CopiesIfHandDelivered ?? undefined,
      HBProposalDue: kickoff?.HBProposalDue ?? '',
      SubcontractorProposalsDue: kickoff?.SubcontractorProposalsDue ?? '',
      PreSubmissionReview: kickoff?.PreSubmissionReview ?? '',
      SubcontractorSiteWalkThru: kickoff?.SubcontractorSiteWalkThru ?? '',
      OwnerEstimateReview: kickoff?.OwnerEstimateReview ?? '',
    });
  }, [kickoff, lead]);

  const handleProjectInfoSave = async (): Promise<void> => {
    if (!kickoff || !canEdit) return;
    await updateKickoff(projectInfo);
    if (lead) {
      await updateLead(lead.id, {
        AE: projectInfo.Architect,
        ProposalBidDue: projectInfo.ProposalDueDateTime,
      });
    }
  };

  // Lead selector
  const handleLeadChange = async (leadId: number): Promise<void> => {
    if (!kickoff || !canEdit) return;
    await updateKickoff({ LeadID: leadId });
    dataService.logAudit({ Action: 'EstimateEdited' as never, EntityType: 'Estimate' as never, EntityId: String(kickoff.id), Details: `Linked lead changed to ${leadId}` }).catch(() => {});
  };

  // Key Personnel
  const keyPersonnel: IKeyPersonnelEntry[] = kickoff?.keyPersonnel ?? [];

  const handlePersonnelChange = (updated: IKeyPersonnelEntry[]): void => {
    if (!canEdit) return;
    updateKeyPersonnel(updated).catch(console.error);
  };

  const handleAddPersonnel = (): void => {
    const nextId = keyPersonnel.length > 0 ? Math.max(...keyPersonnel.map(p => p.id)) + 1 : 1;
    handlePersonnelChange([...keyPersonnel, { id: nextId, label: '', person: { userId: '', displayName: '', email: '' } }]);
  };

  const handleRemovePersonnel = (personnelId: number): void => {
    handlePersonnelChange(keyPersonnel.filter(p => p.id !== personnelId));
  };

  const handlePersonnelLabelChange = (personnelId: number, label: string): void => {
    handlePersonnelChange(keyPersonnel.map(p => p.id === personnelId ? { ...p, label } : p));
  };

  const handlePersonnelPersonChange = (personnelId: number, person: IPersonAssignment | null): void => {
    if (!person) return;
    handlePersonnelChange(keyPersonnel.map(p => p.id === personnelId ? { ...p, person } : p));
  };

  // Checklist items
  const handleItemChange = (itemId: number, data: Partial<IEstimatingKickoffItem>): void => {
    if (!canEdit) return;
    updateItem(itemId, data).catch(console.error);
  };

  const handleAddCustomItem = (): void => {
    if (!kickoff || !canEditTemplate) return;
    addItem({
      section: 'managing',
      task: 'Custom item',
      isCustom: true,
    }).catch(console.error);
  };

  const handleRemoveItem = (itemId: number): void => {
    if (!canEditTemplate) return;
    removeItem(itemId).catch(console.error);
  };

  // Pursuit Tools
  const allTools = [
    { label: 'Interview Prep', path: `/preconstruction/pursuit/${id}/interview` },
    { label: 'Deliverables', path: `/preconstruction/pursuit/${id}/deliverables` },
    { label: 'Win/Loss', path: `/preconstruction/pursuit/${id}/winloss` },
    { label: 'Turnover to Ops', path: `/preconstruction/pursuit/${id}/turnover` },
    { label: 'Loss Autopsy', path: `/preconstruction/pursuit/${id}/autopsy` },
  ];
  const EC_TOOLS = ['Deliverables', 'Win/Loss', 'Turnover to Ops', 'Loss Autopsy'];
  const visibleTools = isEC ? allTools.filter(t => EC_TOOLS.includes(t.label)) : allTools;

  if (isLoading) {
    return (
      <div style={{ padding: 24 }}>
        <SkeletonLoader variant="form" />
      </div>
    );
  }

  if (!id || !estimatingRecord) {
    return <div style={{ padding: 40, textAlign: 'center', color: HBC_COLORS.gray500 }}>Estimating record not found.</div>;
  }

  if (!kickoff) {
    return <div style={{ padding: 40, textAlign: 'center', color: HBC_COLORS.gray500 }}>Kick-off not found.</div>;
  }

  const projectCode = estimatingRecord.ProjectCode;

  return (
    <div style={{ padding: 24 }}>
      <Breadcrumb items={[
        { label: 'Estimating Dashboard', path: '/preconstruction' },
        { label: lead?.Title ?? projectCode, path: `/preconstruction/pursuit/${id}` },
        { label: 'Kick-Off' },
      ]} />

      <div style={{ marginBottom: 16, marginTop: 8 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: HBC_COLORS.navy, margin: 0 }}>Estimating Kick-Off</h1>
        <p style={{ fontSize: 13, color: HBC_COLORS.gray500, marginTop: 4 }}>
          {lead?.Title ?? projectCode} {lead?.ClientName ? `— ${lead.ClientName}` : ''}
        </p>
      </div>

      {/* Project Information */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Project Information</h2>
        <div style={gridStyle}>
          {/* Lead Selector */}
          <label style={fieldStyle}>
            <span style={labelStyle}>Linked to Originating Lead</span>
            <select
              value={kickoff.LeadID ?? ''}
              disabled={!canEdit}
              onChange={e => handleLeadChange(Number(e.target.value))}
              style={selectStyle}
            >
              <option value="">Select a lead...</option>
              {leads.map(l => (
                <option key={l.id} value={l.id}>{l.Title}</option>
              ))}
            </select>
          </label>
          <Field label="Architect" value={projectInfo.Architect ?? ''} disabled={!canEdit}
            onChange={v => setProjectInfo(prev => ({ ...prev, Architect: v }))}
            onBlur={handleProjectInfoSave} />
          <Field label="Proposal Due Date/Time" value={projectInfo.ProposalDueDateTime ?? ''} disabled={!canEdit}
            onChange={v => setProjectInfo(prev => ({ ...prev, ProposalDueDateTime: v }))}
            onBlur={handleProjectInfoSave} />
          <Field label="Type of Proposal" value={projectInfo.ProposalType ?? ''} disabled={!canEdit}
            onChange={v => setProjectInfo(prev => ({ ...prev, ProposalType: v }))}
            onBlur={handleProjectInfoSave} />
          <SelectField label="RFI Format" value={projectInfo.RFIFormat ?? ''} disabled={!canEdit}
            options={['', 'Excel', 'Procore']}
            onChange={v => setProjectInfo(prev => ({ ...prev, RFIFormat: v as 'Excel' | 'Procore' | undefined }))}
            onBlur={handleProjectInfoSave} />
          <Field label="Primary Owner Contact" value={projectInfo.PrimaryOwnerContact ?? ''} disabled={!canEdit}
            onChange={v => setProjectInfo(prev => ({ ...prev, PrimaryOwnerContact: v }))}
            onBlur={handleProjectInfoSave} />
          <Field label="Proposal Delivery Method" value={projectInfo.ProposalDeliveryMethod ?? ''} disabled={!canEdit}
            onChange={v => setProjectInfo(prev => ({ ...prev, ProposalDeliveryMethod: v }))}
            onBlur={handleProjectInfoSave} />
          <Field label="Copies (if hand delivered)" value={String(projectInfo.CopiesIfHandDelivered ?? '')} disabled={!canEdit}
            onChange={v => setProjectInfo(prev => ({ ...prev, CopiesIfHandDelivered: v ? Number(v) : undefined }))}
            onBlur={handleProjectInfoSave} />
        </div>
      </section>

      {/* Estimating Key Dates */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Estimating Key Dates</h2>
        <div style={gridStyle}>
          <DateField label="HB Proposal Due" value={projectInfo.HBProposalDue ?? ''} disabled={!canEdit}
            onChange={v => setProjectInfo(prev => ({ ...prev, HBProposalDue: v }))}
            onBlur={handleProjectInfoSave} />
          <DateField label="Subcontractor Proposals Due" value={projectInfo.SubcontractorProposalsDue ?? ''} disabled={!canEdit}
            onChange={v => setProjectInfo(prev => ({ ...prev, SubcontractorProposalsDue: v }))}
            onBlur={handleProjectInfoSave} />
          <DateField label="Pre-Submission Estimate Review" value={projectInfo.PreSubmissionReview ?? ''} disabled={!canEdit}
            onChange={v => setProjectInfo(prev => ({ ...prev, PreSubmissionReview: v }))}
            onBlur={handleProjectInfoSave} />
          <DateField label="Subcontractor Site Walk-Thru" value={projectInfo.SubcontractorSiteWalkThru ?? ''} disabled={!canEdit}
            onChange={v => setProjectInfo(prev => ({ ...prev, SubcontractorSiteWalkThru: v }))}
            onBlur={handleProjectInfoSave} />
          <DateField label="Owner Estimate Review" value={projectInfo.OwnerEstimateReview ?? ''} disabled={!canEdit}
            onChange={v => setProjectInfo(prev => ({ ...prev, OwnerEstimateReview: v }))}
            onBlur={handleProjectInfoSave} />
        </div>
      </section>

      {/* Key Personnel */}
      <section style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}>Key Personnel</h2>
          {canEdit && (
            <button onClick={handleAddPersonnel} style={addButtonStyle}>+ Add Personnel</button>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {keyPersonnel.map(entry => (
            <div key={entry.id} style={{ display: 'grid', gridTemplateColumns: '200px 1fr 32px', gap: 12, alignItems: 'end' }}>
              <label style={fieldStyle}>
                <span style={labelStyle}>Role</span>
                <input
                  type="text"
                  value={entry.label}
                  placeholder="e.g., Lead Estimator"
                  disabled={!canEdit}
                  onChange={e => handlePersonnelLabelChange(entry.id, e.target.value)}
                  style={inputStyle}
                />
              </label>
              <AzureADPeoplePicker
                label="Person"
                selectedUser={entry.person.userId ? entry.person : null}
                onSelect={person => handlePersonnelPersonChange(entry.id, person)}
                disabled={!canEdit}
              />
              {canEdit && (
                <button
                  onClick={() => handleRemovePersonnel(entry.id)}
                  style={{ ...removeButtonStyle, alignSelf: 'end', marginBottom: 4 }}
                  title="Remove"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
          {keyPersonnel.length === 0 && (
            <div style={{ padding: 16, textAlign: 'center', color: HBC_COLORS.gray400, fontSize: 13 }}>
              No key personnel assigned yet.
            </div>
          )}
        </div>
      </section>

      {/* Estimating Checklist */}
      <section style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}>Estimating Checklist</h2>
          {canEditTemplate && (
            <button onClick={handleAddCustomItem} style={addButtonStyle}>+ Add Custom Item</button>
          )}
        </div>
        <ChecklistTable
          items={kickoff.items}
          onChange={handleItemChange}
          onRemove={handleRemoveItem}
          canEdit={canEdit}
          canEditTemplate={canEditTemplate}
        />
      </section>

      {/* Pursuit Tools */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Pursuit Tools</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {visibleTools.map(tool => (
            <div
              key={tool.label}
              onClick={() => navigate(tool.path)}
              style={{
                padding: '16px',
                borderRadius: 8,
                border: `1px solid ${HBC_COLORS.gray200}`,
                cursor: 'pointer',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: 13,
                color: HBC_COLORS.navy,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = HBC_COLORS.orange;
                e.currentTarget.style.backgroundColor = HBC_COLORS.gray50;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = HBC_COLORS.gray200;
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {tool.label}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Checklist Table
// ---------------------------------------------------------------------------

const ChecklistTable: React.FC<{
  items: IEstimatingKickoffItem[];
  onChange: (itemId: number, data: Partial<IEstimatingKickoffItem>) => void;
  onRemove: (itemId: number) => void;
  canEdit: boolean;
  canEditTemplate: boolean;
}> = ({ items, onChange, onRemove, canEdit, canEditTemplate }) => {
  if (items.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: HBC_COLORS.gray400, fontSize: 13, border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 8 }}>
        No checklist items yet. Items will be populated when the kickoff is created from a template.
      </div>
    );
  }

  return (
    <div style={{ border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 100px 1fr 130px 2fr 40px',
        padding: '10px 16px',
        background: HBC_COLORS.gray50,
        borderBottom: `1px solid ${HBC_COLORS.gray200}`,
        fontSize: 11,
        fontWeight: 700,
        color: HBC_COLORS.gray500,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
      }}>
        <span>Task</span>
        <span>Status</span>
        <span>Assignees</span>
        <span>Deadline</span>
        <span>Notes</span>
        <span />
      </div>
      {items.map(item => (
        <ChecklistRow
          key={item.id}
          item={item}
          onChange={onChange}
          onRemove={onRemove}
          canEdit={canEdit}
          canEditTemplate={canEditTemplate}
        />
      ))}
    </div>
  );
};

const ChecklistRow: React.FC<{
  item: IEstimatingKickoffItem;
  onChange: (itemId: number, data: Partial<IEstimatingKickoffItem>) => void;
  onRemove: (itemId: number) => void;
  canEdit: boolean;
  canEditTemplate: boolean;
}> = React.memo(({ item, onChange, onRemove, canEdit, canEditTemplate }) => {
  const [showAssignees, setShowAssignees] = React.useState(false);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '2fr 100px 1fr 130px 2fr 40px',
      padding: '10px 16px',
      borderBottom: `1px solid ${HBC_COLORS.gray100}`,
      alignItems: 'center',
      gap: 8,
    }}>
      <div style={{ fontWeight: 600, color: HBC_COLORS.navy, fontSize: 13 }}>
        {item.task}
        {item.tabRequired && <span style={{ marginLeft: 6, fontSize: 11, color: HBC_COLORS.gray500 }}>(Tab Req&apos;d)</span>}
      </div>
      <select
        value={item.status ?? ''}
        onChange={e => onChange(item.id, { status: (e.target.value || null) as 'yes' | 'no' | 'na' | null })}
        disabled={!canEdit}
        style={selectStyle}
      >
        <option value="">—</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
        <option value="na">N/A</option>
      </select>
      <div style={{ position: 'relative' }}>
        <div
          onClick={() => canEdit && setShowAssignees(!showAssignees)}
          style={{
            padding: '4px 8px',
            borderRadius: 6,
            border: `1px solid ${HBC_COLORS.gray300}`,
            fontSize: 12,
            cursor: canEdit ? 'pointer' : 'default',
            minHeight: 28,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap' as const,
            gap: 2,
            backgroundColor: !canEdit ? HBC_COLORS.gray100 : '#fff',
          }}
        >
          {(item.assignees ?? []).length === 0 ? (
            <span style={{ color: HBC_COLORS.gray400, fontSize: 11 }}>Assign...</span>
          ) : (
            (item.assignees ?? []).map(a => (
              <span key={a.userId} style={{
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 10,
                backgroundColor: HBC_COLORS.gray100,
                color: HBC_COLORS.navy,
                fontWeight: 500,
              }}>
                {a.displayName.split(' ').map(n => n[0]).join('')}
              </span>
            ))
          )}
        </div>
        {showAssignees && canEdit && (
          <div style={{ position: 'absolute', zIndex: 100, top: '100%', left: 0, width: 260, marginTop: 2 }}>
            <AzureADPeoplePicker
              multiSelect
              selectedUsers={item.assignees ?? []}
              onSelectMulti={users => {
                onChange(item.id, { assignees: users });
              }}
            />
            <div style={{ marginTop: 4, textAlign: 'right' }}>
              <button
                onClick={() => setShowAssignees(false)}
                style={{ fontSize: 11, color: HBC_COLORS.navy, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
      <input
        type="date"
        value={item.deadline ?? ''}
        onChange={e => onChange(item.id, { deadline: e.target.value })}
        disabled={!canEdit}
        style={inputStyle}
      />
      <input
        type="text"
        value={item.notes ?? ''}
        onChange={e => onChange(item.id, { notes: e.target.value })}
        disabled={!canEdit}
        style={inputStyle}
        placeholder="Notes..."
      />
      <div style={{ textAlign: 'right' }}>
        {canEditTemplate && item.isCustom && (
          <button onClick={() => onRemove(item.id)} style={removeButtonStyle}>&times;</button>
        )}
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

type ProjectInfoState = {
  Architect?: string;
  ProposalDueDateTime?: string;
  ProposalType?: string;
  RFIFormat?: 'Excel' | 'Procore';
  PrimaryOwnerContact?: string;
  ProposalDeliveryMethod?: string;
  CopiesIfHandDelivered?: number;
  HBProposalDue?: string;
  SubcontractorProposalsDue?: string;
  PreSubmissionReview?: string;
  SubcontractorSiteWalkThru?: string;
  OwnerEstimateReview?: string;
};

const Field: React.FC<{ label: string; value: string; disabled?: boolean; onChange: (value: string) => void; onBlur: () => void }> = ({ label, value, disabled, onChange, onBlur }) => (
  <label style={fieldStyle}>
    <span style={labelStyle}>{label}</span>
    <input type="text" value={value} disabled={disabled} onChange={e => onChange(e.target.value)} onBlur={onBlur} style={inputStyle} />
  </label>
);

const DateField: React.FC<{ label: string; value: string; disabled?: boolean; onChange: (value: string) => void; onBlur: () => void }> = ({ label, value, disabled, onChange, onBlur }) => (
  <label style={fieldStyle}>
    <span style={labelStyle}>{label}</span>
    <input type="date" value={value} disabled={disabled} onChange={e => onChange(e.target.value)} onBlur={onBlur} style={inputStyle} />
  </label>
);

const SelectField: React.FC<{ label: string; value: string; disabled?: boolean; options: string[]; onChange: (value: string) => void; onBlur: () => void }> = ({ label, value, disabled, options, onChange, onBlur }) => (
  <label style={fieldStyle}>
    <span style={labelStyle}>{label}</span>
    <select value={value} disabled={disabled} onChange={e => onChange(e.target.value)} onBlur={onBlur} style={selectStyle}>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt || 'Select'}</option>
      ))}
    </select>
  </label>
);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const sectionStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 8,
  border: `1px solid ${HBC_COLORS.gray200}`,
  padding: 16,
  marginBottom: 16,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  marginBottom: 12,
  fontSize: 16,
  fontWeight: 700,
  color: HBC_COLORS.navy,
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 12,
};

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: HBC_COLORS.gray600,
};

const inputStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 6,
  border: `1px solid ${HBC_COLORS.gray300}`,
  fontSize: 13,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderRadius: 6,
  border: `1px solid ${HBC_COLORS.gray300}`,
  fontSize: 13,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  background: '#fff',
};

const addButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  background: HBC_COLORS.orange,
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};

const removeButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: HBC_COLORS.gray500,
  cursor: 'pointer',
  fontSize: 18,
  lineHeight: 1,
};

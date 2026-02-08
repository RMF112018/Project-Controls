import * as React from 'react';
import { useParams } from 'react-router-dom';
import { HBC_COLORS } from '../../../theme/tokens';
import { useEstimatingKickoff } from '../../hooks/useEstimatingKickoff';
import { useLeads } from '../../hooks/useLeads';
import { IEstimatingKickoffItem } from '../../../models/IEstimatingKickoff';
import { useAppContext } from '../../contexts/AppContext';
import { PERMISSIONS } from '../../../utils/permissions';

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

export const EstimatingKickoffPage: React.FC = () => {
  const { projectCode } = useParams<{ projectCode: string }>();
  const { kickoff, fetchKickoff, createKickoff, updateKickoff, updateItem, addItem, removeItem } = useEstimatingKickoff();
  const { leads, fetchLeads, updateLead } = useLeads();
  const { hasPermission } = useAppContext();
  const [isLoading, setIsLoading] = React.useState(true);
  const [projectInfo, setProjectInfo] = React.useState<ProjectInfoState>({});

  const canEdit = hasPermission(PERMISSIONS.KICKOFF_EDIT);
  const canEditTemplate = hasPermission(PERMISSIONS.KICKOFF_TEMPLATE_EDIT);

  const lead = leads.find(l => l.ProjectCode === projectCode);

  React.useEffect(() => {
    const load = async (): Promise<void> => {
      if (!projectCode) return;
      setIsLoading(true);
      await fetchLeads();
      await fetchKickoff(projectCode);
      setIsLoading(false);
    };
    load().catch(console.error);
  }, [projectCode, fetchLeads, fetchKickoff]);

  React.useEffect(() => {
    if (!projectCode) return;
    if (!kickoff && lead) {
      createKickoff(lead.id, projectCode).catch(console.error);
    }
  }, [kickoff, lead, projectCode, createKickoff]);

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

  const handleItemChange = (itemId: number, data: Partial<IEstimatingKickoffItem>): void => {
    if (!canEdit) return;
    updateItem(itemId, data).catch(console.error);
  };

  const handleAddCustom = (): void => {
    if (!kickoff || !canEditTemplate) return;
    addItem({
      section: 'deliverables_nonstandard',
      task: 'Custom item',
      isCustom: true,
    }).catch(console.error);
  };

  const handleRemoveItem = (itemId: number): void => {
    if (!canEditTemplate) return;
    removeItem(itemId).catch(console.error);
  };

  if (isLoading) {
    return <div style={{ padding: 40, textAlign: 'center', color: HBC_COLORS.gray500 }}>Loading kick-off...</div>;
  }

  if (!projectCode) {
    return <div style={{ padding: 40, textAlign: 'center', color: HBC_COLORS.gray500 }}>Missing project code.</div>;
  }

  if (!kickoff) {
    return <div style={{ padding: 40, textAlign: 'center', color: HBC_COLORS.gray500 }}>Kick-off not found.</div>;
  }

  const managingItems = kickoff.items.filter(i => i.section === 'managing');
  const standardItems = kickoff.items.filter(i => i.section === 'deliverables_standard');
  const nonstandardItems = kickoff.items.filter(i => i.section === 'deliverables_nonstandard');

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: HBC_COLORS.navy, margin: 0 }}>Estimating Kick-Off</h1>
        <p style={{ fontSize: 13, color: HBC_COLORS.gray500, marginTop: 4 }}>
          {lead?.Title ?? projectCode} {lead?.ClientName ? `— ${lead.ClientName}` : ''}
        </p>
      </div>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Project Information</h2>
        <div style={gridStyle}>
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

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Managing Information</h2>
        <ChecklistTable items={managingItems} onChange={handleItemChange} onRemove={handleRemoveItem} canEdit={canEdit} canEditTemplate={canEditTemplate} />
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Final Deliverables — Standard</h2>
        <ChecklistTable items={standardItems} onChange={handleItemChange} onRemove={handleRemoveItem} canEdit={canEdit} canEditTemplate={canEditTemplate} />
      </section>

      <section style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={sectionTitleStyle}>Final Deliverables — Non-Standard</h2>
          {canEditTemplate && (
            <button onClick={handleAddCustom} style={addButtonStyle}>Add Custom Item</button>
          )}
        </div>
        <ChecklistTable items={nonstandardItems} onChange={handleItemChange} onRemove={handleRemoveItem} canEdit={canEdit} canEditTemplate={canEditTemplate} />
      </section>
    </div>
  );
};

const ChecklistTable: React.FC<{
  items: IEstimatingKickoffItem[];
  onChange: (itemId: number, data: Partial<IEstimatingKickoffItem>) => void;
  onRemove: (itemId: number) => void;
  canEdit: boolean;
  canEditTemplate: boolean;
}> = ({ items, onChange, onRemove, canEdit, canEditTemplate }) => (
  <div style={{ border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 8, overflow: 'hidden' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 120px 1fr 140px 2fr 40px', padding: '10px 16px', background: HBC_COLORS.gray50, borderBottom: `1px solid ${HBC_COLORS.gray200}`, fontSize: 11, fontWeight: 700, color: HBC_COLORS.gray500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      <span>Task</span>
      <span>Status</span>
      <span>Responsible</span>
      <span>Deadline</span>
      <span>Notes</span>
      <span></span>
    </div>
    {items.map(item => (
      <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 120px 1fr 140px 2fr 40px', padding: '10px 16px', borderBottom: `1px solid ${HBC_COLORS.gray100}`, alignItems: 'center', gap: 8 }}>
        <div style={{ fontWeight: 600, color: HBC_COLORS.navy }}>
          {item.task}
          {item.tabRequired && <span style={{ marginLeft: 6, fontSize: 11, color: HBC_COLORS.gray500 }}>(Tab Req'd)</span>}
        </div>
        <select
          value={item.status ?? ''}
          onChange={e => onChange(item.id, { status: e.target.value as 'yes' | 'no' | 'na' | null })}
          disabled={!canEdit}
          style={selectStyle}
        >
          <option value="">—</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
          <option value="na">N/A</option>
        </select>
        <input
          type="text"
          value={item.responsibleParty ?? ''}
          onChange={e => onChange(item.id, { responsibleParty: e.target.value })}
          disabled={!canEdit}
          style={inputStyle}
        />
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
        />
        <div style={{ textAlign: 'right' }}>
          {canEditTemplate && item.isCustom && (
            <button onClick={() => onRemove(item.id)} style={removeButtonStyle}>×</button>
          )}
        </div>
      </div>
    ))}
  </div>
);

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
  padding: '6px 10px',
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
  fontSize: 16,
  lineHeight: 1,
};

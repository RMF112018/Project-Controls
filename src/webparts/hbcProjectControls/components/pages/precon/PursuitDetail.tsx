import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEstimating } from '../../hooks/useEstimating';
import { useLeads } from '../../hooks/useLeads';
import { useAppContext } from '../../contexts/AppContext';
import { PageHeader } from '../../shared/PageHeader';
import { ExportButtons } from '../../shared/ExportButtons';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { IEstimatingTracker, AwardStatus, EstimateSource, DeliverableType, WinLossDecision, AuditAction, EntityType } from '../../../models';
import { HBC_COLORS } from '../../../theme/tokens';
import { formatCurrency, formatDate, getDaysUntil, getUrgencyColor } from '../../../utils/formatters';
import { PERMISSIONS } from '../../../utils/permissions';

const AWARD_STATUS_OPTIONS: AwardStatus[] = [
  AwardStatus.Pending,
  AwardStatus.AwardedWithPrecon,
  AwardStatus.AwardedWithoutPrecon,
  AwardStatus.NotAwarded,
];
const SOURCE_OPTIONS: EstimateSource[] = [
  EstimateSource.ClientRequest,
  EstimateSource.RFP,
  EstimateSource.RFQ,
  EstimateSource.Referral,
  EstimateSource.Other,
];
const DELIVERABLE_OPTIONS: DeliverableType[] = [
  DeliverableType.GMP,
  DeliverableType.ConceptualEst,
  DeliverableType.LumpSumProposal,
  DeliverableType.Schematic,
  DeliverableType.DDEst,
  DeliverableType.ROM,
  DeliverableType.RFP,
  DeliverableType.HardBid,
  DeliverableType.Other,
];

const CHK_FIELDS: Array<{ key: keyof IEstimatingTracker; label: string }> = [
  { key: 'Chk_BidBond', label: 'Bid Bond (Wanda)' },
  { key: 'Chk_PPBond', label: 'PP Bond (Wanda)' },
  { key: 'Chk_Schedule', label: 'Schedule (Est.)' },
  { key: 'Chk_Logistics', label: 'Logistics (Est.)' },
  { key: 'Chk_BIMProposal', label: 'BIM (VDC)' },
  { key: 'Chk_PreconProposal', label: 'Precon Prop (Ryan)' },
  { key: 'Chk_ProposalTabs', label: 'Tabs (Wanda/Wendy)' },
  { key: 'Chk_CoordMarketing', label: 'Coord. Marketing' },
  { key: 'Chk_BusinessTerms', label: 'Bus. Terms (Legal)' },
];

export const PursuitDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, dataService } = useAppContext();
  const { getRecordById, updateRecord } = useEstimating();
  const { updateLead } = useLeads();

  const [record, setRecord] = React.useState<IEstimatingTracker | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [formData, setFormData] = React.useState<Partial<IEstimatingTracker>>({});

  const canEdit = currentUser?.permissions.has(PERMISSIONS.ESTIMATING_EDIT) ?? false;

  React.useEffect(() => {
    const load = async (): Promise<void> => {
      if (!id) return;
      setIsLoading(true);
      const rec = await getRecordById(parseInt(id, 10));
      if (rec) {
        setRecord(rec);
        setFormData({ ...rec });
      }
      setIsLoading(false);
    };
    load().catch(console.error);
  }, [id, getRecordById]);

  const handleFieldChange = (field: keyof IEstimatingTracker, value: unknown): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (): Promise<void> => {
    if (!record || !canEdit) return;
    setIsSaving(true);
    try {
      const updated = await updateRecord(record.id, formData);
      setRecord(updated);

      // Audit log for award status change
      if (formData.AwardStatus !== record.AwardStatus) {
        dataService.logAudit({
          Action: AuditAction.EstimateStatusChanged,
          EntityType: EntityType.Estimate,
          EntityId: String(record.id),
          ProjectCode: record.ProjectCode,
          FieldChanged: 'AwardStatus',
          PreviousValue: record.AwardStatus || 'Pending',
          NewValue: formData.AwardStatus || 'Pending',
          User: currentUser?.displayName || 'Unknown',
          UserId: currentUser?.id,
          Details: `Award status changed for "${record.Title}"`,
        }).catch(console.error);
      }

      // Award status sync to lead
      if (formData.AwardStatus !== record.AwardStatus && record.LeadID) {
        const awardStatus = formData.AwardStatus as AwardStatus;
        if (awardStatus === AwardStatus.AwardedWithPrecon || awardStatus === AwardStatus.AwardedWithoutPrecon) {
          await updateLead(record.LeadID, { WinLossDecision: WinLossDecision.Win });
        } else if (awardStatus === AwardStatus.NotAwarded) {
          await updateLead(record.LeadID, { WinLossDecision: WinLossDecision.Loss });
        }
      }
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingSpinner label="Loading pursuit details..." />;

  if (!record) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <h2 style={{ color: HBC_COLORS.gray500 }}>Record not found</h2>
        <button onClick={() => navigate('/')} style={{ marginTop: '12px', padding: '8px 16px', cursor: 'pointer' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#fff', borderRadius: '8px', padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px',
  };
  const gridStyle: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray500, marginBottom: '4px',
    display: 'block',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: '6px',
    border: `1px solid ${HBC_COLORS.gray200}`, fontSize: '13px',
    backgroundColor: canEdit ? '#fff' : HBC_COLORS.gray50,
    color: HBC_COLORS.gray800, boxSizing: 'border-box',
  };
  const sectionTitle = (text: string): React.ReactNode => (
    <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 600, color: HBC_COLORS.navy }}>{text}</h3>
  );

  const dateInputColor = (dateStr: string | undefined): string => {
    if (!dateStr) return HBC_COLORS.gray800;
    const days = getDaysUntil(dateStr);
    return getUrgencyColor(days);
  };

  const remaining = (formData.PreconFee || 0) - (formData.FeePaidToDate || 0);

  return (
    <div id="pursuit-detail-view">
      <PageHeader
        title={record.Title}
        subtitle={record.ProjectCode ? `Project Code: ${record.ProjectCode}` : 'No project code assigned'}
        breadcrumb={
          <span
            style={{ fontSize: '13px', color: HBC_COLORS.info, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            &larr; Back to Dashboard
          </span>
        }
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ExportButtons
              pdfElementId="pursuit-detail-view"
              filename={`pursuit-${record.ProjectCode || record.id}`}
              title={record.Title}
            />
            {canEdit && (
              <button
                onClick={() => { handleSave().catch(console.error); }}
                disabled={isSaving}
                style={{
                  padding: '8px 20px', borderRadius: '6px', border: 'none',
                  backgroundColor: HBC_COLORS.navy, color: '#fff', fontSize: '13px',
                  cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: 500,
                  opacity: isSaving ? 0.7 : 1,
                }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        }
      />

      {/* Pursuit Info */}
      <div style={cardStyle}>
        {sectionTitle('Pursuit Info')}
        <div style={gridStyle}>
          <div>
            <label style={labelStyle}>Title</label>
            <input style={inputStyle} value={formData.Title || ''} readOnly={!canEdit}
              onChange={e => handleFieldChange('Title', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Project Code</label>
            <input style={inputStyle} value={formData.ProjectCode || ''} readOnly={!canEdit}
              onChange={e => handleFieldChange('ProjectCode', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Source</label>
            <select style={inputStyle} value={formData.Source || ''} disabled={!canEdit}
              onChange={e => handleFieldChange('Source', e.target.value)}>
              <option value="">Select...</option>
              {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Deliverable Type</label>
            <select style={inputStyle} value={formData.DeliverableType || ''} disabled={!canEdit}
              onChange={e => handleFieldChange('DeliverableType', e.target.value)}>
              <option value="">Select...</option>
              {DELIVERABLE_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Linked Lead ID</label>
            <input style={inputStyle} type="number" value={formData.LeadID || ''} readOnly={!canEdit}
              onChange={e => handleFieldChange('LeadID', parseInt(e.target.value, 10) || 0)} />
          </div>
        </div>
      </div>

      {/* Key Dates */}
      <div style={cardStyle}>
        {sectionTitle('Key Dates')}
        <div style={gridStyle}>
          <div>
            <label style={labelStyle}>Sub Bids Due</label>
            <input style={{ ...inputStyle, color: dateInputColor(formData.SubBidsDue) }} type="date"
              value={formData.SubBidsDue || ''} readOnly={!canEdit}
              onChange={e => handleFieldChange('SubBidsDue', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Pre-Submission Review</label>
            <input style={{ ...inputStyle, color: dateInputColor(formData.PreSubmissionReview) }} type="date"
              value={formData.PreSubmissionReview || ''} readOnly={!canEdit}
              onChange={e => handleFieldChange('PreSubmissionReview', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Win Strategy Meeting</label>
            <input style={{ ...inputStyle, color: dateInputColor(formData.WinStrategyMeeting) }} type="date"
              value={formData.WinStrategyMeeting || ''} readOnly={!canEdit}
              onChange={e => handleFieldChange('WinStrategyMeeting', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Due Date (Out the Door)</label>
            <input style={{ ...inputStyle, color: dateInputColor(formData.DueDate_OutTheDoor) }} type="date"
              value={formData.DueDate_OutTheDoor || ''} readOnly={!canEdit}
              onChange={e => handleFieldChange('DueDate_OutTheDoor', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Key Personnel */}
      <div style={cardStyle}>
        {sectionTitle('Key Personnel')}
        <div style={gridStyle}>
          <div>
            <label style={labelStyle}>Lead Estimator</label>
            <input style={inputStyle} value={formData.LeadEstimator || ''} readOnly={!canEdit}
              onChange={e => handleFieldChange('LeadEstimator', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Contributors (comma-separated)</label>
            <input style={inputStyle} value={(formData.Contributors || []).join(', ')} readOnly={!canEdit}
              onChange={e => handleFieldChange('Contributors', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
          </div>
          <div>
            <label style={labelStyle}>PX (Project Executive)</label>
            <input style={inputStyle} value={formData.PX_ProjectExecutive || ''} readOnly={!canEdit}
              onChange={e => handleFieldChange('PX_ProjectExecutive', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Estimating Checklist */}
      <div style={cardStyle}>
        {sectionTitle('Estimating Checklist')}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          {CHK_FIELDS.map(chk => (
            <label key={chk.key as string} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px', borderRadius: '6px', backgroundColor: HBC_COLORS.gray50,
              cursor: canEdit ? 'pointer' : 'default', fontSize: '13px',
            }}>
              <input
                type="checkbox"
                checked={!!formData[chk.key]}
                disabled={!canEdit}
                onChange={() => handleFieldChange(chk.key, !formData[chk.key])}
                style={{ accentColor: HBC_COLORS.success }}
              />
              {chk.label}
            </label>
          ))}
        </div>
      </div>

      {/* Precon Fee Tracking */}
      <div style={cardStyle}>
        {sectionTitle('Precon Fee Tracking')}
        <div style={gridStyle}>
          <div>
            <label style={labelStyle}>Doc Set Stage</label>
            <input style={inputStyle} value={formData.DocSetStage || ''} readOnly={!canEdit}
              onChange={e => handleFieldChange('DocSetStage', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Precon Fee</label>
            <input style={inputStyle} type="number" value={formData.PreconFee ?? ''} readOnly={!canEdit}
              onChange={e => handleFieldChange('PreconFee', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label style={labelStyle}>Design Budget</label>
            <input style={inputStyle} type="number" value={formData.DesignBudget ?? ''} readOnly={!canEdit}
              onChange={e => handleFieldChange('DesignBudget', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label style={labelStyle}>Fee Paid to Date</label>
            <input style={inputStyle} type="number" value={formData.FeePaidToDate ?? ''} readOnly={!canEdit}
              onChange={e => handleFieldChange('FeePaidToDate', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label style={labelStyle}>Remaining</label>
            <div style={{
              ...inputStyle, backgroundColor: HBC_COLORS.gray50,
              color: remaining < 0 ? HBC_COLORS.error : HBC_COLORS.gray800,
              fontWeight: remaining < 0 ? 600 : 400,
            }}>
              {formatCurrency(remaining)}
            </div>
          </div>
        </div>
      </div>

      {/* Estimate Details */}
      <div style={cardStyle}>
        {sectionTitle('Estimate Details')}
        <div style={gridStyle}>
          <div>
            <label style={labelStyle}>Estimate Type</label>
            <select style={inputStyle} value={formData.EstimateType || ''} disabled={!canEdit}
              onChange={e => handleFieldChange('EstimateType', e.target.value)}>
              <option value="">Select...</option>
              {DELIVERABLE_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Estimated Cost Value</label>
            <input style={inputStyle} type="number" value={formData.EstimatedCostValue ?? ''} readOnly={!canEdit}
              onChange={e => handleFieldChange('EstimatedCostValue', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label style={labelStyle}>Cost Per GSF</label>
            <input style={inputStyle} type="number" value={formData.CostPerGSF ?? ''} readOnly={!canEdit}
              onChange={e => handleFieldChange('CostPerGSF', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label style={labelStyle}>Cost Per Unit</label>
            <input style={inputStyle} type="number" value={formData.CostPerUnit ?? ''} readOnly={!canEdit}
              onChange={e => handleFieldChange('CostPerUnit', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label style={labelStyle}>Submitted Date</label>
            <input style={inputStyle} type="date" value={formData.SubmittedDate || ''} readOnly={!canEdit}
              onChange={e => handleFieldChange('SubmittedDate', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Award Status</label>
            <select style={inputStyle} value={formData.AwardStatus || ''} disabled={!canEdit}
              onChange={e => handleFieldChange('AwardStatus', e.target.value)}>
              <option value="">Select...</option>
              {AWARD_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Notes / Feedback</label>
            <textarea
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              value={formData.NotesFeedback || ''}
              readOnly={!canEdit}
              onChange={e => handleFieldChange('NotesFeedback', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Last saved info */}
      {record.AwardStatus && (
        <div style={{ fontSize: '12px', color: HBC_COLORS.gray400, marginTop: '8px' }}>
          Current Award Status: {record.AwardStatus}
          {record.LeadID ? ` | Linked Lead: #${record.LeadID}` : ' | No linked lead'}
        </div>
      )}
    </div>
  );
};

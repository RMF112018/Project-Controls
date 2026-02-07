import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import { useLeads } from '../../hooks/useLeads';
import { useWorkflow } from '../../hooks/useWorkflow';
import { PageHeader } from '../../shared/PageHeader';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { RoleGate } from '../../guards/RoleGate';
import { ILead, RoleName, LossReason } from '../../../models';
import { HBC_COLORS } from '../../../theme/tokens';
import { formatCurrency } from '../../../utils/formatters';

const cardStyle: React.CSSProperties = {
  backgroundColor: '#fff', borderRadius: 8, padding: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: HBC_COLORS.gray600, marginBottom: 4 };
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: 14, borderRadius: 6,
  border: `1px solid ${HBC_COLORS.gray300}`, boxSizing: 'border-box' as const, outline: 'none',
};

const LOSS_REASONS = Object.values(LossReason);

export const WinLossRecorder: React.FC = () => {
  const navigate = useNavigate();
  const { siteContext } = useAppContext();
  const { leads, fetchLeads, isLoading: leadsLoading } = useLeads();
  const { recordWin, recordLoss } = useWorkflow();
  const [project, setProject] = React.useState<ILead | null>(null);
  const [mode, setMode] = React.useState<'choose' | 'win' | 'loss'>('choose');
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  // Win fields
  const [contractValue, setContractValue] = React.useState('');
  const [finalFeePct, setFinalFeePct] = React.useState('');
  const [awardDate, setAwardDate] = React.useState('');
  const [contractType, setContractType] = React.useState('');

  // Loss fields
  const [selectedReasons, setSelectedReasons] = React.useState<string[]>([]);
  const [competitor, setCompetitor] = React.useState('');
  const [autopsyNotes, setAutopsyNotes] = React.useState('');

  const projectCode = siteContext.projectCode ?? '';

  React.useEffect(() => { fetchLeads().catch(console.error); }, [fetchLeads]);
  React.useEffect(() => {
    if (leads.length > 0 && projectCode) {
      const found = leads.find(l => l.ProjectCode === projectCode) ?? null;
      setProject(found);
      if (found?.WinLossDecision) setSubmitted(true);
    }
  }, [leads, projectCode]);

  const handleWin = async (): Promise<void> => {
    if (!project) return;
    setSubmitting(true);
    try {
      await recordWin(project, {
        contractValue: contractValue ? parseFloat(contractValue) : undefined,
        finalFeePct: finalFeePct ? parseFloat(finalFeePct) : undefined,
        awardDate: awardDate || undefined,
        contractType: contractType || undefined,
      });
      setSubmitted(true);
      setToast('Win recorded successfully. Stage updated to Won - Contract Pending.');
    } catch (err) { setToast(err instanceof Error ? err.message : 'Failed to record win'); }
    finally { setSubmitting(false); }
  };

  const handleLoss = async (): Promise<void> => {
    if (!project || selectedReasons.length === 0) return;
    setSubmitting(true);
    try {
      await recordLoss(project, {
        lossReasons: selectedReasons,
        competitor: competitor || undefined,
        autopsyNotes: autopsyNotes || undefined,
      });
      setSubmitted(true);
      setToast('Loss recorded. Stage updated to Archived - Loss.');
    } catch (err) { setToast(err instanceof Error ? err.message : 'Failed to record loss'); }
    finally { setSubmitting(false); }
  };

  const toggleReason = (reason: string): void => {
    setSelectedReasons(prev => prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]);
  };

  if (leadsLoading) return <LoadingSpinner label="Loading..." />;
  if (!project) return <div style={{ padding: 48, textAlign: 'center', color: HBC_COLORS.gray500 }}><h2>Project not found</h2></div>;

  // Read-only summary if decision already recorded
  if (submitted || project.WinLossDecision) {
    const isWin = project.WinLossDecision === 'Win' || mode === 'win';
    return (
      <div>
        <PageHeader title="Win/Loss Recorder" subtitle={`${project.Title} — ${project.ClientName}`} />
        {toast && <div style={{ padding: '12px 16px', backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: 6, marginBottom: 16, fontSize: 14 }}>{toast}</div>}
        <div style={{ ...cardStyle, borderLeft: `4px solid ${isWin ? '#10B981' : '#EF4444'}` }}>
          <h3 style={{ margin: '0 0 16px', color: isWin ? '#10B981' : '#EF4444' }}>
            {isWin ? 'WIN' : 'LOSS'} Recorded
          </h3>
          <p style={{ fontSize: 14, color: HBC_COLORS.gray600 }}>Decision Date: {project.WinLossDate ?? new Date().toISOString().split('T')[0]}</p>
          {isWin && project.ProjectValue && <p style={{ fontSize: 14, color: HBC_COLORS.gray600 }}>Contract Value: {formatCurrency(project.ProjectValue)}</p>}
          {!isWin && project.LossReason && <p style={{ fontSize: 14, color: HBC_COLORS.gray600 }}>Reasons: {project.LossReason.join(', ')}</p>}
          {!isWin && project.LossCompetitor && <p style={{ fontSize: 14, color: HBC_COLORS.gray600 }}>Competitor: {project.LossCompetitor}</p>}
          {!isWin && (
            <button onClick={() => navigate('/autopsy')} style={{ marginTop: 16, padding: '10px 24px', backgroundColor: HBC_COLORS.navy, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              Go to Loss Autopsy
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Win/Loss Recorder" subtitle={`${project.Title} — ${project.ClientName}`} />

      <RoleGate allowedRoles={[RoleName.BDRepresentative, RoleName.ExecutiveLeadership]} fallback={
        <div style={cardStyle}><p style={{ color: HBC_COLORS.gray500 }}>You do not have permission to record win/loss decisions. Please contact BD or Executive Leadership.</p></div>
      }>
        {mode === 'choose' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div onClick={() => setMode('win')} style={{ ...cardStyle, cursor: 'pointer', border: '2px solid transparent', textAlign: 'center', transition: 'border 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#10B981')} onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>&#x2714;</div>
              <h2 style={{ color: '#10B981', margin: '0 0 8px' }}>Record Win</h2>
              <p style={{ color: HBC_COLORS.gray500, fontSize: 14 }}>Project has been awarded. Record contract details.</p>
            </div>
            <div onClick={() => setMode('loss')} style={{ ...cardStyle, cursor: 'pointer', border: '2px solid transparent', textAlign: 'center', transition: 'border 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#EF4444')} onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>&#x2718;</div>
              <h2 style={{ color: '#EF4444', margin: '0 0 8px' }}>Record Loss</h2>
              <p style={{ color: HBC_COLORS.gray500, fontSize: 14 }}>Project was not awarded. Record loss details.</p>
            </div>
          </div>
        )}

        {mode === 'win' && (
          <div style={{ ...cardStyle, borderLeft: '4px solid #10B981' }}>
            <h3 style={{ margin: '0 0 20px', color: '#10B981' }}>Record Win — Award Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div><label style={labelStyle}>Contract Value ($)</label><input type="number" value={contractValue} onChange={e => setContractValue(e.target.value)} placeholder="0" style={inputStyle} /></div>
              <div><label style={labelStyle}>Final Fee %</label><input type="number" step="0.1" value={finalFeePct} onChange={e => setFinalFeePct(e.target.value)} placeholder="0.0" style={inputStyle} /></div>
              <div><label style={labelStyle}>Award Date</label><input type="date" value={awardDate} onChange={e => setAwardDate(e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>Contract Type</label><input value={contractType} onChange={e => setContractType(e.target.value)} placeholder="GMP, Lump Sum, etc." style={inputStyle} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleWin} disabled={submitting} style={{ padding: '10px 24px', backgroundColor: '#10B981', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 14 }}>{submitting ? 'Submitting...' : 'Submit Win'}</button>
              <button onClick={() => setMode('choose')} style={{ padding: '10px 24px', backgroundColor: '#fff', color: HBC_COLORS.gray600, border: `1px solid ${HBC_COLORS.gray300}`, borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>Back</button>
            </div>
          </div>
        )}

        {mode === 'loss' && (
          <div style={{ ...cardStyle, borderLeft: '4px solid #EF4444' }}>
            <h3 style={{ margin: '0 0 20px', color: '#EF4444' }}>Record Loss — Details</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Loss Reasons (select all that apply) *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {LOSS_REASONS.map(reason => (
                  <label key={reason} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer', padding: '6px 12px', borderRadius: 6, border: `1px solid ${selectedReasons.includes(reason) ? '#EF4444' : HBC_COLORS.gray300}`, backgroundColor: selectedReasons.includes(reason) ? '#FEE2E2' : '#fff' }}>
                    <input type="checkbox" checked={selectedReasons.includes(reason)} onChange={() => toggleReason(reason)} style={{ accentColor: '#EF4444' }} />
                    {reason}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}><label style={labelStyle}>Competitor</label><input value={competitor} onChange={e => setCompetitor(e.target.value)} placeholder="Winning competitor" style={inputStyle} /></div>
            <div style={{ marginBottom: 16 }}><label style={labelStyle}>Preliminary Autopsy Notes</label><textarea value={autopsyNotes} onChange={e => setAutopsyNotes(e.target.value)} placeholder="Initial notes on the loss..." style={{ ...inputStyle, minHeight: 80, resize: 'vertical' as const }} /></div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleLoss} disabled={submitting || selectedReasons.length === 0} style={{ padding: '10px 24px', backgroundColor: selectedReasons.length === 0 ? HBC_COLORS.gray300 : '#EF4444', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: submitting || selectedReasons.length === 0 ? 'not-allowed' : 'pointer', fontSize: 14 }}>{submitting ? 'Submitting...' : 'Submit Loss'}</button>
              <button onClick={() => setMode('choose')} style={{ padding: '10px 24px', backgroundColor: '#fff', color: HBC_COLORS.gray600, border: `1px solid ${HBC_COLORS.gray300}`, borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>Back</button>
            </div>
          </div>
        )}
      </RoleGate>
    </div>
  );
};

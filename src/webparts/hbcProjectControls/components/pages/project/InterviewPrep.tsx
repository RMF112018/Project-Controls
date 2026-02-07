import * as React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useLeads } from '../../hooks/useLeads';
import { useWorkflow } from '../../hooks/useWorkflow';
import { PageHeader } from '../../shared/PageHeader';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { RoleGate } from '../../guards/RoleGate';
import { ILead, RoleName } from '../../../models';
import { HBC_COLORS } from '../../../theme/tokens';

const cardStyle: React.CSSProperties = {
  backgroundColor: '#fff', borderRadius: 8, padding: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 24,
};
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: HBC_COLORS.gray600, marginBottom: 4 };
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: 14, borderRadius: 6,
  border: `1px solid ${HBC_COLORS.gray300}`, boxSizing: 'border-box' as const, outline: 'none',
};
const textareaStyle: React.CSSProperties = { ...inputStyle, minHeight: 80, resize: 'vertical' as const };

export const InterviewPrep: React.FC = () => {
  const { siteContext } = useAppContext();
  const { leads, fetchLeads, isLoading: leadsLoading } = useLeads();
  const { interviewPrep, fetchInterviewPrep, saveInterviewPrep, scheduleRedTeamReview, teamMembers, fetchTeamMembers } = useWorkflow();
  const [project, setProject] = React.useState<ILead | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const [interviewDate, setInterviewDate] = React.useState('');
  const [interviewLocation, setInterviewLocation] = React.useState('');
  const [panelMembers, setPanelMembers] = React.useState('');
  const [presentationTheme, setPresentationTheme] = React.useState('');
  const [keyMessages, setKeyMessages] = React.useState('');
  const [teamAssignments, setTeamAssignments] = React.useState('');
  const [rehearsalDate, setRehearsalDate] = React.useState('');

  const projectCode = siteContext.projectCode ?? '';

  React.useEffect(() => { fetchLeads().catch(console.error); }, [fetchLeads]);
  React.useEffect(() => {
    if (leads.length > 0 && projectCode) setProject(leads.find(l => l.ProjectCode === projectCode) ?? null);
  }, [leads, projectCode]);
  React.useEffect(() => {
    if (project) fetchInterviewPrep(project.id).catch(console.error);
    if (projectCode) fetchTeamMembers(projectCode).catch(console.error);
  }, [project, projectCode, fetchInterviewPrep, fetchTeamMembers]);
  React.useEffect(() => {
    if (interviewPrep) {
      setInterviewDate(interviewPrep.interviewDate ?? '');
      setInterviewLocation(interviewPrep.interviewLocation ?? '');
      setPanelMembers(interviewPrep.panelMembers?.join(', ') ?? '');
      setPresentationTheme(interviewPrep.presentationTheme ?? '');
      setKeyMessages(interviewPrep.keyMessages ?? '');
      setTeamAssignments(interviewPrep.teamAssignments ?? '');
      setRehearsalDate(interviewPrep.rehearsalDate ?? '');
    }
  }, [interviewPrep]);
  React.useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); } return undefined; }, [toast]);

  const handleSave = async (): Promise<void> => {
    if (!project) return;
    setSaving(true);
    try {
      await saveInterviewPrep({
        leadId: project.id, projectCode,
        interviewDate: interviewDate || undefined, interviewLocation: interviewLocation || undefined,
        panelMembers: panelMembers ? panelMembers.split(',').map(s => s.trim()).filter(Boolean) : [],
        presentationTheme: presentationTheme || undefined, keyMessages: keyMessages || undefined,
        teamAssignments: teamAssignments || undefined, rehearsalDate: rehearsalDate || undefined,
      });
      setToast('Interview preparation saved.');
    } catch { setToast('Failed to save.'); }
    finally { setSaving(false); }
  };

  const handleRedTeam = async (): Promise<void> => {
    if (!project) return;
    const emails = teamMembers.map(tm => tm.email);
    await scheduleRedTeamReview(projectCode, project.id, emails);
    setToast('Red Team Review meeting scheduled.');
  };

  if (leadsLoading) return <LoadingSpinner label="Loading..." />;
  if (!project) return <div style={{ padding: 48, textAlign: 'center', color: HBC_COLORS.gray500 }}><h2>Project not found</h2></div>;

  return (
    <div>
      <PageHeader title="Interview Preparation" subtitle={`${project.Title} — ${project.ClientName}`} />
      {toast && <div style={{ padding: '12px 16px', backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: 6, marginBottom: 16, fontSize: 14 }}>{toast}</div>}

      <RoleGate allowedRoles={[RoleName.BDRepresentative, RoleName.Marketing]} fallback={
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 16px', color: HBC_COLORS.navy }}>Interview Details (Read Only)</h3>
          <p style={{ fontSize: 14, color: HBC_COLORS.gray600 }}>Interview Date: {interviewDate || '-'}</p>
          <p style={{ fontSize: 14, color: HBC_COLORS.gray600 }}>Location: {interviewLocation || '-'}</p>
          <p style={{ fontSize: 14, color: HBC_COLORS.gray600 }}>Panel: {panelMembers || '-'}</p>
          <p style={{ fontSize: 14, color: HBC_COLORS.gray600 }}>Theme: {presentationTheme || '-'}</p>
          <p style={{ fontSize: 14, color: HBC_COLORS.gray600 }}>Key Messages: {keyMessages || '-'}</p>
          <p style={{ fontSize: 14, color: HBC_COLORS.gray600 }}>Team Assignments: {teamAssignments || '-'}</p>
          <p style={{ fontSize: 14, color: HBC_COLORS.gray600 }}>Rehearsal: {rehearsalDate || '-'}</p>
        </div>
      }>
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 16px', color: HBC_COLORS.navy }}>Interview Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div><label style={labelStyle}>Interview Date</label><input type="date" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Interview Location</label><input value={interviewLocation} onChange={e => setInterviewLocation(e.target.value)} placeholder="Location" style={inputStyle} /></div>
            <div><label style={labelStyle}>Panel Members (comma-separated)</label><input value={panelMembers} onChange={e => setPanelMembers(e.target.value)} placeholder="Name 1, Name 2" style={inputStyle} /></div>
            <div><label style={labelStyle}>Rehearsal Date</label><input type="date" value={rehearsalDate} onChange={e => setRehearsalDate(e.target.value)} style={inputStyle} /></div>
          </div>
          <div style={{ marginBottom: 16 }}><label style={labelStyle}>Presentation Theme</label><input value={presentationTheme} onChange={e => setPresentationTheme(e.target.value)} placeholder="Theme" style={inputStyle} /></div>
          <div style={{ marginBottom: 16 }}><label style={labelStyle}>Key Messages</label><textarea value={keyMessages} onChange={e => setKeyMessages(e.target.value)} placeholder="Key messages for the presentation..." style={textareaStyle} /></div>
          <div style={{ marginBottom: 16 }}><label style={labelStyle}>Team Assignments (who presents which section)</label><textarea value={teamAssignments} onChange={e => setTeamAssignments(e.target.value)} placeholder="Section assignments..." style={textareaStyle} /></div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 16px', color: HBC_COLORS.navy }}>Documents</h3>
          <div style={{ border: `2px dashed ${HBC_COLORS.gray300}`, borderRadius: 8, padding: 32, textAlign: 'center', color: HBC_COLORS.gray500, fontSize: 14 }}>
            Documents linked to project site proposal folder
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleSave} disabled={saving} style={{ padding: '10px 24px', backgroundColor: HBC_COLORS.orange, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14 }}>{saving ? 'Saving...' : 'Save'}</button>
          <button onClick={handleRedTeam} style={{ padding: '10px 24px', backgroundColor: HBC_COLORS.navy, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>Schedule Red Team Review</button>
        </div>
      </RoleGate>
    </div>
  );
};

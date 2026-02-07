import * as React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useLeads } from '../../hooks/useLeads';
import { useWorkflow } from '../../hooks/useWorkflow';
import { PageHeader } from '../../shared/PageHeader';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { RoleGate } from '../../guards/RoleGate';
import { ILead, IActionItem, RoleName, AuditAction, EntityType, ActionItemStatus } from '../../../models';
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
const textareaStyle: React.CSSProperties = { ...inputStyle, minHeight: 100, resize: 'vertical' as const };

interface IActionItemDraft { description: string; assignee: string; dueDate: string; }
const emptyAction: IActionItemDraft = { description: '', assignee: '', dueDate: '' };

export const LossAutopsy: React.FC = () => {
  const { siteContext, dataService } = useAppContext();
  const { leads, fetchLeads, isLoading: leadsLoading } = useLeads();
  const { lossAutopsy, fetchLossAutopsy, saveLossAutopsy, scheduleAutopsyMeeting, teamMembers, fetchTeamMembers } = useWorkflow();
  const [project, setProject] = React.useState<ILead | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const [rootCause, setRootCause] = React.useState('');
  const [lessons, setLessons] = React.useState('');
  const [competitive, setCompetitive] = React.useState('');
  const [meetingNotes, setMeetingNotes] = React.useState('');
  const [actionItems, setActionItems] = React.useState<IActionItemDraft[]>([{ ...emptyAction }]);

  const projectCode = siteContext.projectCode ?? '';

  React.useEffect(() => { fetchLeads().catch(console.error); }, [fetchLeads]);
  React.useEffect(() => {
    if (leads.length > 0 && projectCode) setProject(leads.find(l => l.ProjectCode === projectCode) ?? null);
  }, [leads, projectCode]);
  React.useEffect(() => {
    if (project) fetchLossAutopsy(project.id).catch(console.error);
    if (projectCode) fetchTeamMembers(projectCode).catch(console.error);
  }, [project, projectCode, fetchLossAutopsy, fetchTeamMembers]);
  React.useEffect(() => {
    if (lossAutopsy) {
      setRootCause(lossAutopsy.rootCauseAnalysis ?? '');
      setLessons(lossAutopsy.lessonsLearned ?? '');
      setCompetitive(lossAutopsy.competitiveIntelligence ?? '');
      setMeetingNotes(lossAutopsy.meetingNotes ?? '');
      if (lossAutopsy.actionItems?.length) {
        setActionItems(lossAutopsy.actionItems.map(ai => ({ description: ai.description, assignee: ai.assignee, dueDate: ai.dueDate })));
      }
    }
  }, [lossAutopsy]);
  React.useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); } return undefined; }, [toast]);

  const updateAction = (idx: number, field: keyof IActionItemDraft, value: string): void => {
    setActionItems(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  };
  const addAction = (): void => setActionItems(prev => [...prev, { ...emptyAction }]);
  const removeAction = (idx: number): void => setActionItems(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async (): Promise<void> => {
    if (!project) return;
    setSaving(true);
    try {
      const items: IActionItem[] = actionItems.filter(a => a.description.trim()).map((a, i) => ({
        id: i + 1, description: a.description, assignee: a.assignee, dueDate: a.dueDate,
        status: ActionItemStatus.Open, projectCode,
      }));
      await saveLossAutopsy({
        leadId: project.id, projectCode,
        rootCauseAnalysis: rootCause || undefined, lessonsLearned: lessons || undefined,
        competitiveIntelligence: competitive || undefined, actionItems: items,
        meetingNotes: meetingNotes || undefined,
        completedDate: new Date().toISOString().split('T')[0], completedBy: 'kfoster@hedrickbrothers.com',
      });
      await dataService.logAudit({
        Action: AuditAction.AutopsyCompleted, EntityType: EntityType.Lead,
        EntityId: String(project.id), ProjectCode: projectCode,
        Details: `Loss autopsy completed for ${project.Title}`,
      });
      setToast('Loss autopsy saved.');
    } catch { setToast('Failed to save.'); }
    finally { setSaving(false); }
  };

  const handleSchedule = async (): Promise<void> => {
    if (!project) return;
    const emails = teamMembers.map(tm => tm.email);
    await scheduleAutopsyMeeting(projectCode, project.id, emails);
    setToast('Autopsy meeting scheduled.');
  };

  if (leadsLoading) return <LoadingSpinner label="Loading..." />;
  if (!project) return <div style={{ padding: 48, textAlign: 'center', color: HBC_COLORS.gray500 }}><h2>Project not found</h2></div>;

  return (
    <div>
      <PageHeader title="Loss Autopsy" subtitle={`${project.Title} — ${project.ClientName}`} />
      {toast && <div style={{ padding: '12px 16px', backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: 6, marginBottom: 16, fontSize: 14 }}>{toast}</div>}

      {/* Loss details from lead */}
      <div style={{ ...cardStyle, borderLeft: '4px solid #EF4444' }}>
        <h3 style={{ margin: '0 0 16px', color: '#EF4444' }}>Loss Details</h3>
        <p style={{ fontSize: 14, color: HBC_COLORS.gray600, marginBottom: 8 }}>Reasons: {project.LossReason?.join(', ') ?? '-'}</p>
        <p style={{ fontSize: 14, color: HBC_COLORS.gray600, marginBottom: 8 }}>Competitor: {project.LossCompetitor ?? '-'}</p>
        <p style={{ fontSize: 14, color: HBC_COLORS.gray600 }}>Preliminary Notes: {project.LossAutopsyNotes ?? '-'}</p>
      </div>

      <RoleGate allowedRoles={[RoleName.BDRepresentative, RoleName.ExecutiveLeadership]} fallback={
        <div style={cardStyle}><p style={{ color: HBC_COLORS.gray500 }}>Read-only access. Contact BD or Executive Leadership to edit.</p></div>
      }>
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 16px', color: HBC_COLORS.navy }}>Analysis</h3>
          <div style={{ marginBottom: 16 }}><label style={labelStyle}>Root Cause Analysis</label><textarea value={rootCause} onChange={e => setRootCause(e.target.value)} placeholder="What was the root cause of the loss?" style={textareaStyle} /></div>
          <div style={{ marginBottom: 16 }}><label style={labelStyle}>Lessons Learned</label><textarea value={lessons} onChange={e => setLessons(e.target.value)} placeholder="What can we learn from this?" style={textareaStyle} /></div>
          <div style={{ marginBottom: 16 }}><label style={labelStyle}>Competitive Intelligence</label><textarea value={competitive} onChange={e => setCompetitive(e.target.value)} placeholder="What did we learn about the winner?" style={textareaStyle} /></div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: HBC_COLORS.navy }}>Action Items for Future Pursuits</h3>
            <button onClick={addAction} style={{ padding: '6px 16px', backgroundColor: HBC_COLORS.orange, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>+ Add</button>
          </div>
          {actionItems.map((ai, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 12, marginBottom: 12, alignItems: 'end' }}>
              <div><label style={labelStyle}>Description</label><input value={ai.description} onChange={e => updateAction(idx, 'description', e.target.value)} placeholder="Action item" style={inputStyle} /></div>
              <div><label style={labelStyle}>Assignee</label><input value={ai.assignee} onChange={e => updateAction(idx, 'assignee', e.target.value)} placeholder="Name" style={inputStyle} /></div>
              <div><label style={labelStyle}>Due Date</label><input type="date" value={ai.dueDate} onChange={e => updateAction(idx, 'dueDate', e.target.value)} style={inputStyle} /></div>
              <button onClick={() => removeAction(idx)} style={{ padding: '8px 12px', backgroundColor: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, marginBottom: 1 }}>X</button>
            </div>
          ))}
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 16px', color: HBC_COLORS.navy }}>Meeting Notes</h3>
          <textarea value={meetingNotes} onChange={e => setMeetingNotes(e.target.value)} placeholder="Notes from the autopsy meeting..." style={textareaStyle} />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleSave} disabled={saving} style={{ padding: '10px 24px', backgroundColor: HBC_COLORS.orange, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14 }}>{saving ? 'Saving...' : 'Save'}</button>
          <button onClick={handleSchedule} style={{ padding: '10px 24px', backgroundColor: HBC_COLORS.navy, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>Schedule Autopsy Meeting</button>
        </div>
      </RoleGate>
    </div>
  );
};

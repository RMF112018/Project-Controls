import * as React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useLeads } from '../../hooks/useLeads';
import { useWorkflow } from '../../hooks/useWorkflow';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { RoleGate } from '../../guards/RoleGate';
import { ILead, ITurnoverItem, RoleName, Stage, TurnoverCategory, AuditAction, EntityType, NotificationType } from '../../../models';
import { HBC_COLORS } from '../../../theme/tokens';

const cardStyle: React.CSSProperties = {
  backgroundColor: '#fff', borderRadius: 8, padding: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 24,
};

const CATEGORIES = Object.values(TurnoverCategory);

export const TurnoverToOps: React.FC = () => {
  const { selectedProject, dataService } = useAppContext();
  const { leads, fetchLeads, isLoading: leadsLoading } = useLeads();
  const { turnoverItems, fetchTurnoverItems, updateTurnoverItem, teamMembers, fetchTeamMembers, transitionStage, scheduleTurnoverMeeting } = useWorkflow();
  const [project, setProject] = React.useState<ILead | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);
  const [completing, setCompleting] = React.useState(false);

  const projectCode = selectedProject?.projectCode ?? '';

  React.useEffect(() => { fetchLeads().catch(console.error); }, [fetchLeads]);
  React.useEffect(() => {
    if (leads.length > 0 && projectCode) setProject(leads.find(l => l.ProjectCode === projectCode) ?? null);
  }, [leads, projectCode]);
  React.useEffect(() => {
    if (projectCode) {
      fetchTurnoverItems(projectCode).catch(console.error);
      fetchTeamMembers(projectCode).catch(console.error);
    }
  }, [projectCode, fetchTurnoverItems, fetchTeamMembers]);
  React.useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); } return undefined; }, [toast]);

  const requiredItems = turnoverItems.filter(t => t.required);
  const requiredComplete = requiredItems.filter(t => t.status === 'Complete').length;
  const optionalItems = turnoverItems.filter(t => !t.required);
  const optionalComplete = optionalItems.filter(t => t.status === 'Complete').length;
  const totalComplete = turnoverItems.filter(t => t.status === 'Complete').length;
  const allRequiredDone = requiredItems.length > 0 && requiredComplete === requiredItems.length;
  const progressPct = requiredItems.length > 0 ? Math.round((requiredComplete / requiredItems.length) * 100) : 0;

  const handleStatusChange = async (item: ITurnoverItem, newStatus: string): Promise<void> => {
    const updates: Partial<ITurnoverItem> = { status: newStatus as ITurnoverItem['status'] };
    if (newStatus === 'Complete') updates.completedDate = new Date().toISOString().split('T')[0];
    await updateTurnoverItem(item.id, updates);
  };

  const handleCompleteTurnover = async (): Promise<void> => {
    if (!project || !allRequiredDone) return;
    setCompleting(true);
    try {
      await transitionStage(project, Stage.ActiveConstruction);
      await dataService.logAudit({
        Action: AuditAction.PermissionChanged, EntityType: EntityType.Permission,
        EntityId: projectCode, ProjectCode: projectCode,
        Details: 'Estimating Coordinator demoted to read-only. Operations Team granted read/write.',
      });
      await dataService.logAudit({
        Action: AuditAction.TurnoverInitiated, EntityType: EntityType.Project,
        EntityId: projectCode, ProjectCode: projectCode,
        Details: 'Turnover to operations completed.',
      });
      await dataService.sendNotification({
        type: NotificationType.Both,
        subject: `Turnover Completed: ${project.Title}`,
        body: `Turnover to operations has been completed for ${project.Title}. Operations team now has full access.`,
        recipients: teamMembers.map(tm => tm.email),
        projectCode,
      });
      setToast('Turnover completed. Operations Team now has full access. Estimating demoted to read-only.');
    } catch (err) { setToast(err instanceof Error ? err.message : 'Failed to complete turnover.'); }
    finally { setCompleting(false); }
  };

  const handleSchedule = async (): Promise<void> => {
    if (!project) return;
    const emails = teamMembers.map(tm => tm.email);
    await scheduleTurnoverMeeting(projectCode, project.id, emails);
    setToast('Turnover meeting scheduled.');
  };

  if (leadsLoading) return <LoadingSpinner label="Loading..." />;
  if (!project) return <div style={{ padding: 48, textAlign: 'center', color: HBC_COLORS.gray500 }}><h2>Project not found</h2></div>;

  const statusSelect = (item: ITurnoverItem): React.ReactNode => (
    <RoleGate allowedRoles={[RoleName.PreconstructionTeam, RoleName.OperationsTeam]} fallback={
      <span style={{ fontSize: 13, color: HBC_COLORS.gray600 }}>{item.status}</span>
    }>
      <select
        value={item.status}
        onChange={e => handleStatusChange(item, e.target.value).catch(console.error)}
        style={{ padding: '4px 8px', fontSize: 13, borderRadius: 4, border: `1px solid ${HBC_COLORS.gray300}`, cursor: 'pointer' }}
      >
        <option value="Not Started">Not Started</option>
        <option value="In Progress">In Progress</option>
        <option value="Complete">Complete</option>
      </select>
    </RoleGate>
  );

  return (
    <div>
      <PageHeader title="Turnover to Operations" subtitle={`${project.Title} — ${project.ClientName}`} />
      {toast && <div style={{ padding: '12px 16px', backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: 6, marginBottom: 16, fontSize: 14 }}>{toast}</div>}

      {/* Progress bar */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: HBC_COLORS.navy }}>Required Items Progress</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: HBC_COLORS.success }}>{progressPct}%</span>
        </div>
        <div style={{ width: '100%', height: 10, backgroundColor: HBC_COLORS.gray200, borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ width: `${progressPct}%`, height: '100%', backgroundColor: HBC_COLORS.success, borderRadius: 5, transition: 'width 0.4s' }} />
        </div>
        <div style={{ fontSize: 12, color: HBC_COLORS.gray500, marginTop: 6 }}>{requiredComplete} of {requiredItems.length} required items complete</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KPICard title="Total Items" value={turnoverItems.length} />
        <KPICard title="Required Complete" value={`${requiredComplete}/${requiredItems.length}`} />
        <KPICard title="Optional Complete" value={`${optionalComplete}/${optionalItems.length}`} />
        <KPICard title="Remaining" value={turnoverItems.length - totalComplete} />
      </div>

      {/* Items grouped by category */}
      {CATEGORIES.map(cat => {
        const catItems = turnoverItems.filter(t => t.category === cat);
        if (catItems.length === 0) return null;
        return (
          <div key={cat} style={cardStyle}>
            <h3 style={{ margin: '0 0 16px', color: HBC_COLORS.navy, display: 'flex', alignItems: 'center', gap: 8 }}>
              {cat}
              <span style={{ fontSize: 12, color: HBC_COLORS.gray500, fontWeight: 400 }}>
                ({catItems.filter(i => i.status === 'Complete').length}/{catItems.length})
              </span>
            </h3>
            {catItems.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: `1px solid ${HBC_COLORS.gray100}` }}>
                <div style={{ flex: 1, fontSize: 14, color: HBC_COLORS.gray800 }}>{item.description}</div>
                <div style={{ width: 120, fontSize: 13, color: HBC_COLORS.gray600 }}>{item.assignedTo}</div>
                <div style={{ width: 140 }}>{statusSelect(item)}</div>
                {item.required && <span style={{ fontSize: 11, padding: '2px 8px', backgroundColor: '#FFF7ED', color: HBC_COLORS.orange, borderRadius: 4, fontWeight: 600 }}>Required</span>}
              </div>
            ))}
          </div>
        );
      })}

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={handleCompleteTurnover} disabled={!allRequiredDone || completing}
          style={{ padding: '10px 24px', backgroundColor: allRequiredDone ? HBC_COLORS.success : HBC_COLORS.gray300, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: allRequiredDone && !completing ? 'pointer' : 'not-allowed', fontSize: 14 }}>
          {completing ? 'Completing...' : 'Complete Turnover'}
        </button>
        <button onClick={handleSchedule} style={{ padding: '10px 24px', backgroundColor: HBC_COLORS.navy, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>Schedule Turnover Meeting</button>
      </div>
    </div>
  );
};

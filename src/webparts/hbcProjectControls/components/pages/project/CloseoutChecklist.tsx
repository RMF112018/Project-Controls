import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import { useLeads } from '../../hooks/useLeads';
import { useWorkflow } from '../../hooks/useWorkflow';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import { KPICard } from '../../shared/KPICard';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { RoleGate } from '../../guards/RoleGate';
import { ILead, ICloseoutItem, RoleName, Stage, AuditAction, EntityType, buildBreadcrumbs } from '@hbc/sp-services';
import { HBC_COLORS, ELEVATION } from '../../../theme/tokens';

const cardStyle: React.CSSProperties = {
  backgroundColor: '#fff', borderRadius: 8, padding: 24,
  boxShadow: ELEVATION.level1, marginBottom: 24,
};

function formatCategory(cat: string): string {
  return cat.replace(/^\d+_/, '').replace(/_/g, ' ');
}

export const CloseoutChecklist: React.FC = () => {
  const location = useLocation();
  const breadcrumbs = buildBreadcrumbs(location.pathname);
  const { selectedProject, dataService } = useAppContext();
  const { leads, fetchLeads, isLoading: leadsLoading } = useLeads();
  const { closeoutItems, fetchCloseoutItems, updateCloseoutItem, transitionStage } = useWorkflow();
  const [project, setProject] = React.useState<ILead | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);
  const [completing, setCompleting] = React.useState(false);

  const projectCode = selectedProject?.projectCode ?? '';

  React.useEffect(() => { fetchLeads().catch(console.error); }, [fetchLeads]);
  React.useEffect(() => {
    if (leads.length > 0 && projectCode) setProject(leads.find(l => l.ProjectCode === projectCode) ?? null);
  }, [leads, projectCode]);
  React.useEffect(() => {
    if (projectCode) fetchCloseoutItems(projectCode).catch(console.error);
  }, [projectCode, fetchCloseoutItems]);
  React.useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); } return undefined; }, [toast]);

  const total = closeoutItems.length;
  const complete = closeoutItems.filter(c => c.status === 'Complete').length;
  const inProgress = closeoutItems.filter(c => c.status === 'In Progress').length;
  const notStarted = closeoutItems.filter(c => c.status === 'Not Started').length;
  const progressPct = total > 0 ? Math.round((complete / total) * 100) : 0;
  const allDone = total > 0 && complete === total;

  const categories = React.useMemo(() => {
    const cats: string[] = [];
    closeoutItems.forEach(item => { if (!cats.includes(item.category)) cats.push(item.category); });
    return cats.sort();
  }, [closeoutItems]);

  const handleStatusChange = async (item: ICloseoutItem, newStatus: string): Promise<void> => {
    const updates: Partial<ICloseoutItem> = { status: newStatus as ICloseoutItem['status'] };
    if (newStatus === 'Complete') updates.completedDate = new Date().toISOString().split('T')[0];
    await updateCloseoutItem(item.id, updates);
  };

  const handleCompleteCloseout = async (): Promise<void> => {
    if (!project || !allDone) return;
    setCompleting(true);
    try {
      if (project.Stage !== Stage.Closeout) {
        await transitionStage(project, Stage.Closeout);
      }
      await dataService.logAudit({
        Action: AuditAction.LeadEdited, EntityType: EntityType.Project,
        EntityId: projectCode, ProjectCode: projectCode,
        Details: 'Project closeout completed. Archive countdown: 365 days.',
      });
      setToast('Project closeout completed. Auto-archive countdown: 365 days of inactivity before archive.');
    } catch (err) { setToast(err instanceof Error ? err.message : 'Failed to complete closeout.'); }
    finally { setCompleting(false); }
  };

  if (leadsLoading) return <SkeletonLoader variant="table" rows={8} columns={4} />;
  if (!project) return <div style={{ padding: 48, textAlign: 'center', color: HBC_COLORS.gray500 }}><h2>Project not found</h2></div>;

  const statusSelect = (item: ICloseoutItem): React.ReactNode => (
    <RoleGate allowedRoles={[RoleName.OperationsTeam]} fallback={
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
      <PageHeader title="Project Closeout" subtitle={`${project.Title} — ${project.ClientName}`} breadcrumb={<Breadcrumb items={breadcrumbs} />} />
      {toast && <div style={{ padding: '12px 16px', backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: 6, marginBottom: 16, fontSize: 14 }}>{toast}</div>}

      {/* Progress bar */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: HBC_COLORS.navy }}>Overall Progress</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: HBC_COLORS.success }}>{progressPct}%</span>
        </div>
        <div style={{ width: '100%', height: 10, backgroundColor: HBC_COLORS.gray200, borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ width: `${progressPct}%`, height: '100%', backgroundColor: HBC_COLORS.success, borderRadius: 5, transition: 'width 0.4s' }} />
        </div>
        <div style={{ fontSize: 12, color: HBC_COLORS.gray500, marginTop: 6 }}>{complete} of {total} items complete</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KPICard title="Total" value={total} />
        <KPICard title="Complete" value={complete} />
        <KPICard title="In Progress" value={inProgress} />
        <KPICard title="Not Started" value={notStarted} />
      </div>

      {/* Items grouped by category */}
      {categories.map(cat => {
        const catItems = closeoutItems.filter(c => c.category === cat);
        return (
          <div key={cat} style={cardStyle}>
            <h3 style={{ margin: '0 0 16px', color: HBC_COLORS.navy, display: 'flex', alignItems: 'center', gap: 8 }}>
              {formatCategory(cat)}
              <span style={{ fontSize: 12, color: HBC_COLORS.gray500, fontWeight: 400 }}>
                ({catItems.filter(i => i.status === 'Complete').length}/{catItems.length})
              </span>
            </h3>
            {catItems.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: `1px solid ${HBC_COLORS.gray100}` }}>
                <div style={{ flex: 1, fontSize: 14, color: HBC_COLORS.gray800 }}>{item.description}</div>
                <div style={{ width: 120, fontSize: 13, color: HBC_COLORS.gray600 }}>{item.assignedTo}</div>
                <div style={{ width: 140 }}>{statusSelect(item)}</div>
                {item.completedDate && <span style={{ fontSize: 11, color: HBC_COLORS.gray500 }}>{item.completedDate}</span>}
              </div>
            ))}
          </div>
        );
      })}

      <RoleGate allowedRoles={[RoleName.OperationsTeam]}>
        <button onClick={handleCompleteCloseout} disabled={!allDone || completing}
          style={{ padding: '10px 24px', backgroundColor: allDone ? HBC_COLORS.success : HBC_COLORS.gray300, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: allDone && !completing ? 'pointer' : 'not-allowed', fontSize: 14 }}>
          {completing ? 'Completing...' : 'Complete Closeout'}
        </button>
      </RoleGate>
    </div>
  );
};

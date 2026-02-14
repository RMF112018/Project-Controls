import {
  ILead,
  ITurnoverItem,
  RoleName,
  Stage,
  TurnoverCategory,
  AuditAction,
  EntityType,
  NotificationType,
  TurnoverStatus,
  MeetingType,
  buildBreadcrumbs,
  PERMISSIONS
} from '@hbc/sp-services';
import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import { useLeads } from '../../hooks/useLeads';
import { useWorkflow } from '../../hooks/useWorkflow';
import { useTurnoverAgenda } from '../../hooks/useTurnoverAgenda';
import { useTabFromUrl } from '../../hooks/useTabFromUrl';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import { KPICard } from '../../shared/KPICard';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { RoleGate } from '../../guards/RoleGate';
import { PermissionGate } from '../../guards/PermissionGate';
import { MeetingScheduler } from '../../shared/MeetingScheduler';
import { HBC_COLORS, ELEVATION } from '../../../theme/tokens';
const cardStyle: React.CSSProperties = {
  backgroundColor: '#fff', borderRadius: 8, padding: 24,
  boxShadow: ELEVATION.level1, marginBottom: 24,
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '10px 24px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  border: 'none',
  borderBottom: active ? `3px solid ${HBC_COLORS.orange}` : '3px solid transparent',
  backgroundColor: 'transparent',
  color: active ? HBC_COLORS.navy : HBC_COLORS.gray500,
});

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: 16, fontWeight: 700, color: HBC_COLORS.navy, margin: '0 0 16px',
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: HBC_COLORS.gray600, marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: 14, border: `1px solid ${HBC_COLORS.gray300}`,
  borderRadius: 4, backgroundColor: '#fff',
};

const btnPrimary: React.CSSProperties = {
  padding: '8px 20px', backgroundColor: HBC_COLORS.navy, color: '#fff',
  border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13,
};

const btnSuccess: React.CSSProperties = {
  ...btnPrimary, backgroundColor: HBC_COLORS.success,
};

const btnDanger: React.CSSProperties = {
  ...btnPrimary, backgroundColor: HBC_COLORS.error,
};

const TURNOVER_STATUS_STEPS: TurnoverStatus[] = [
  TurnoverStatus.Draft, TurnoverStatus.PrerequisitesInProgress, TurnoverStatus.MeetingScheduled,
  TurnoverStatus.MeetingComplete, TurnoverStatus.PendingSignatures, TurnoverStatus.Signed, TurnoverStatus.Complete,
];

const CATEGORIES = Object.values(TurnoverCategory);

export const TurnoverToOps: React.FC = () => {
  const location = useLocation();
  const breadcrumbs = buildBreadcrumbs(location.pathname);
  const { selectedProject, dataService, hasPermission } = useAppContext();
  const { leads, fetchLeads, isLoading: leadsLoading } = useLeads();
  const workflow = useWorkflow();
  const turnoverHook = useTurnoverAgenda();
  const [activeTab, setActiveTab] = useTabFromUrl('agenda', ['agenda', 'checklist'] as const);
  const [project, setProject] = React.useState<ILead | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);
  const [showScheduler, setShowScheduler] = React.useState(false);

  const projectCode = selectedProject?.projectCode ?? '';
  const canEdit = hasPermission(PERMISSIONS.TURNOVER_AGENDA_EDIT);
  const canSign = hasPermission(PERMISSIONS.TURNOVER_SIGN);

  React.useEffect(() => { fetchLeads().catch(console.error); }, [fetchLeads]);
  React.useEffect(() => {
    if (leads.length > 0 && projectCode) setProject(leads.find(l => l.ProjectCode === projectCode) ?? null);
  }, [leads, projectCode]);
  React.useEffect(() => {
    if (projectCode) {
      turnoverHook.fetchAgenda(projectCode).catch(console.error);
      workflow.fetchTurnoverItems(projectCode).catch(console.error);
      workflow.fetchTeamMembers(projectCode).catch(console.error);
    }
  }, [projectCode, turnoverHook.fetchAgenda, workflow.fetchTurnoverItems, workflow.fetchTeamMembers]);
  React.useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); } return undefined; }, [toast]);

  const agenda = turnoverHook.agenda;

  const handleCreateAgenda = async (): Promise<void> => {
    if (!project) return;
    await turnoverHook.createAgenda(projectCode, project.id);
    dataService.logAudit({ Action: AuditAction.TurnoverAgendaCreated, EntityType: EntityType.TurnoverAgenda, EntityId: projectCode, ProjectCode: projectCode }).catch(() => {});
    setToast('Turnover agenda created.');
  };

  if (leadsLoading || turnoverHook.loading) return <SkeletonLoader variant="form" rows={8} />;
  if (!project) return <div style={{ padding: 48, textAlign: 'center', color: HBC_COLORS.gray500 }}><h2>Project not found</h2></div>;

  return (
    <div>
      <PageHeader title="Turnover to Operations" subtitle={`${project.Title} — ${project.ClientName}`} breadcrumb={<Breadcrumb items={breadcrumbs} />} />
      {toast && <div style={{ padding: '12px 16px', backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: 6, marginBottom: 16, fontSize: 14 }}>{toast}</div>}

      {/* Tab Bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${HBC_COLORS.gray200}`, marginBottom: 24 }}>
        <button style={tabStyle(activeTab === 'agenda')} onClick={() => setActiveTab('agenda')}>Meeting Agenda</button>
        <button style={tabStyle(activeTab === 'checklist')} onClick={() => setActiveTab('checklist')}>Follow-Up Checklist</button>
      </div>

      {activeTab === 'agenda' ? (
        <MeetingAgendaTab
          agenda={agenda}
          project={project}
          projectCode={projectCode}
          canEdit={canEdit}
          canSign={canSign}
          turnoverHook={turnoverHook}
          dataService={dataService}
          teamMembers={workflow.teamMembers}
          showScheduler={showScheduler}
          setShowScheduler={setShowScheduler}
          onCreateAgenda={handleCreateAgenda}
          setToast={setToast}
        />
      ) : (
        <FollowUpChecklistTab
          project={project}
          projectCode={projectCode}
          turnoverItems={workflow.turnoverItems}
          updateTurnoverItem={workflow.updateTurnoverItem}
          teamMembers={workflow.teamMembers}
          transitionStage={workflow.transitionStage}
          scheduleTurnoverMeeting={workflow.scheduleTurnoverMeeting}
          dataService={dataService}
          setToast={setToast}
        />
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   Tab 1: Meeting Agenda
   ═══════════════════════════════════════════════════════════════════ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MeetingAgendaTab: React.FC<any> = ({
  agenda, project, projectCode, canEdit, canSign,
  turnoverHook, dataService, teamMembers,
  showScheduler, setShowScheduler, onCreateAgenda, setToast,
}) => {
  const [expandedItem, setExpandedItem] = React.useState<number | null>(null);
  const [signConfirm, setSignConfirm] = React.useState<number | null>(null);
  const [newSubTrade, setNewSubTrade] = React.useState('');
  const [newSubName, setNewSubName] = React.useState('');

  if (!agenda) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', padding: 48 }}>
        <h3 style={{ color: HBC_COLORS.navy, marginBottom: 8 }}>No Turnover Agenda Yet</h3>
        <p style={{ color: HBC_COLORS.gray500, marginBottom: 24 }}>Create a turnover meeting agenda to begin the formal handoff from estimating to operations.</p>
        <PermissionGate permission={PERMISSIONS.TURNOVER_AGENDA_EDIT}>
          <button style={btnPrimary} onClick={onCreateAgenda}>Create Turnover Agenda</button>
        </PermissionGate>
      </div>
    );
  }

  const prereqsDone = turnoverHook.prerequisitesComplete;
  const locked = !prereqsDone;

  // Status Banner
  const currentStepIndex = TURNOVER_STATUS_STEPS.indexOf(agenda.status as TurnoverStatus);

  const handlePrereqToggle = async (prereqId: number, completed: boolean): Promise<void> => {
    await turnoverHook.togglePrerequisite(prereqId, completed);
    const action = completed ? AuditAction.TurnoverPrerequisiteCompleted : AuditAction.TurnoverPrerequisiteCompleted;
    dataService.logAudit({ Action: action, EntityType: EntityType.TurnoverAgenda, EntityId: projectCode, ProjectCode: projectCode }).catch(() => {});
  };

  const handleDiscussionToggle = async (itemId: number, discussed: boolean): Promise<void> => {
    await turnoverHook.updateDiscussionItem(itemId, { discussed });
    if (discussed) {
      dataService.logAudit({ Action: AuditAction.TurnoverItemDiscussed, EntityType: EntityType.TurnoverAgenda, EntityId: String(itemId), ProjectCode: projectCode }).catch(() => {});
    }
  };

  const handleNotesBlur = async (itemId: number, notes: string): Promise<void> => {
    await turnoverHook.updateDiscussionItem(itemId, { notes });
  };

  const handleHeaderBlur = async (field: string, value: string | number): Promise<void> => {
    await turnoverHook.updateAgenda(projectCode, { [field]: value } as Record<string, unknown> as Partial<typeof agenda>);
  };

  const handleEstimateBlur = async (field: string, value: number | string): Promise<void> => {
    await turnoverHook.updateEstimateOverview(projectCode, { [field]: value } as Record<string, unknown>);
  };

  const handleAddSub = async (): Promise<void> => {
    if (!newSubTrade && !newSubName) return;
    await turnoverHook.addSubcontractor(agenda.id, { trade: newSubTrade, subcontractorName: newSubName });
    dataService.logAudit({ Action: AuditAction.TurnoverSubcontractorAdded, EntityType: EntityType.TurnoverAgenda, EntityId: projectCode, ProjectCode: projectCode }).catch(() => {});
    setNewSubTrade('');
    setNewSubName('');
  };

  const handleRemoveSub = async (subId: number): Promise<void> => {
    await turnoverHook.removeSubcontractor(subId);
    dataService.logAudit({ Action: AuditAction.TurnoverSubcontractorRemoved, EntityType: EntityType.TurnoverAgenda, EntityId: projectCode, ProjectCode: projectCode }).catch(() => {});
  };

  const handleExhibitReview = async (exhibitId: number, reviewed: boolean): Promise<void> => {
    await turnoverHook.updateExhibit(exhibitId, {
      reviewed,
      reviewedBy: reviewed ? 'Current User' : undefined,
      reviewedDate: reviewed ? new Date().toISOString() : undefined,
    });
    if (reviewed) {
      dataService.logAudit({ Action: AuditAction.TurnoverExhibitReviewed, EntityType: EntityType.TurnoverAgenda, EntityId: String(exhibitId), ProjectCode: projectCode }).catch(() => {});
    }
  };

  const handleAddExhibit = async (): Promise<void> => {
    await turnoverHook.addExhibit(agenda.id, { label: 'Custom Exhibit' });
    dataService.logAudit({ Action: AuditAction.TurnoverExhibitAdded, EntityType: EntityType.TurnoverAgenda, EntityId: projectCode, ProjectCode: projectCode }).catch(() => {});
  };

  const handleRemoveExhibit = async (exhibitId: number): Promise<void> => {
    await turnoverHook.removeExhibit(exhibitId);
    dataService.logAudit({ Action: AuditAction.TurnoverExhibitRemoved, EntityType: EntityType.TurnoverAgenda, EntityId: projectCode, ProjectCode: projectCode }).catch(() => {});
  };

  const handleSign = async (sigId: number): Promise<void> => {
    await turnoverHook.sign(sigId);
    dataService.logAudit({ Action: AuditAction.TurnoverSigned, EntityType: EntityType.TurnoverAgenda, EntityId: String(sigId), ProjectCode: projectCode }).catch(() => {});
    setSignConfirm(null);
    setToast('Signature recorded.');
    // Check if all signed
    if (turnoverHook.allSignaturesSigned) {
      await turnoverHook.updateAgenda(projectCode, { status: TurnoverStatus.Complete });
      dataService.logAudit({ Action: AuditAction.TurnoverAgendaCompleted, EntityType: EntityType.TurnoverAgenda, EntityId: projectCode, ProjectCode: projectCode }).catch(() => {});
      setToast('All signatures collected. Turnover agenda complete.');
    }
  };

  const handleMeetingScheduled = (): void => {
    turnoverHook.updateAgenda(projectCode, { status: TurnoverStatus.MeetingScheduled }).catch(console.error);
    setShowScheduler(false);
    setToast('Turnover meeting scheduled.');
  };

  const prereqCount = agenda.prerequisites.filter((p: { completed: boolean }) => p.completed).length;
  const discussedCount = agenda.discussionItems.filter((d: { discussed: boolean }) => d.discussed).length;
  const exhibitCount = agenda.exhibits.filter((e: { reviewed: boolean }) => e.reviewed).length;
  const sigCount = agenda.signatures.filter((s: { signed: boolean }) => s.signed).length;

  const formatCurrency = (v: number): string => v ? `$${v.toLocaleString()}` : '$0';

  return (
    <div>
      {/* Status Step Indicator */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
          {TURNOVER_STATUS_STEPS.map((step, i) => {
            const isActive = i === currentStepIndex;
            const isDone = i < currentStepIndex;
            return (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: isDone ? HBC_COLORS.success : isActive ? HBC_COLORS.orange : HBC_COLORS.gray200,
                  color: isDone || isActive ? '#fff' : HBC_COLORS.gray500, fontSize: 12, fontWeight: 700,
                }}>
                  {isDone ? '\u2713' : i + 1}
                </div>
                <span style={{ fontSize: 11, color: isActive ? HBC_COLORS.navy : HBC_COLORS.gray500, fontWeight: isActive ? 700 : 400 }}>
                  {step.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                {i < TURNOVER_STATUS_STEPS.length - 1 && (
                  <div style={{ width: 20, height: 2, backgroundColor: isDone ? HBC_COLORS.success : HBC_COLORS.gray200, margin: '0 2px' }} />
                )}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12, fontSize: 13, color: HBC_COLORS.gray600 }}>
          Completion: <strong>{turnoverHook.completionPercentage}%</strong>
        </div>
      </div>

      {/* Meeting Logistics */}
      <div style={cardStyle}>
        <h3 style={sectionHeaderStyle}>Meeting Logistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <div style={fieldLabelStyle}>Meeting Date</div>
            <div style={{ fontSize: 14, color: HBC_COLORS.gray800 }}>
              {agenda.meetingDate ? new Date(agenda.meetingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Not scheduled'}
            </div>
          </div>
          <div>
            <div style={fieldLabelStyle}>Recording URL</div>
            {canEdit ? (
              <input style={inputStyle} defaultValue={agenda.recordingUrl || ''} placeholder="Paste recording link..."
                onBlur={(e) => handleHeaderBlur('recordingUrl', e.target.value)} />
            ) : (
              <div style={{ fontSize: 14 }}>{agenda.recordingUrl || '—'}</div>
            )}
          </div>
          <div>
            <div style={fieldLabelStyle}>Turnover Folder</div>
            {agenda.turnoverFolderUrl ? (
              <a href={agenda.turnoverFolderUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: HBC_COLORS.info }}>Open Folder</a>
            ) : <span style={{ fontSize: 14, color: HBC_COLORS.gray400 }}>—</span>}
          </div>
          {canEdit && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button style={btnPrimary} onClick={() => setShowScheduler(true)}>Schedule Meeting</button>
            </div>
          )}
        </div>
      </div>

      {showScheduler && (
        <div style={cardStyle}>
          <MeetingScheduler
            meetingType={MeetingType.Turnover}
            subject={`Turnover Meeting: ${project.Title}`}
            attendeeEmails={teamMembers.map((tm: { email: string }) => tm.email)}
            projectCode={projectCode}
            startDate={new Date().toISOString()}
            endDate={new Date(Date.now() + 14 * 86400000).toISOString()}
            onScheduled={handleMeetingScheduled}
            onCancel={() => setShowScheduler(false)}
          />
        </div>
      )}

      {/* Prerequisites */}
      <div style={cardStyle}>
        <h3 style={sectionHeaderStyle}>Prerequisites ({prereqCount}/{agenda.prerequisites.length})</h3>
        {prereqsDone && (
          <div style={{ padding: '8px 16px', backgroundColor: HBC_COLORS.successLight, color: '#065F46', borderRadius: 6, marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
            All prerequisites complete — agenda sections unlocked.
          </div>
        )}
        <div style={{ width: '100%', height: 8, backgroundColor: HBC_COLORS.gray200, borderRadius: 4, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ width: `${agenda.prerequisites.length > 0 ? (prereqCount / agenda.prerequisites.length) * 100 : 0}%`, height: '100%', backgroundColor: HBC_COLORS.success, borderRadius: 4, transition: 'width 0.3s' }} />
        </div>
        {agenda.prerequisites.map((prereq: { id: number; label: string; description: string; completed: boolean; completedBy?: string; completedDate?: string }) => (
          <div key={prereq.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${HBC_COLORS.gray100}` }}>
            <input type="checkbox" checked={prereq.completed} disabled={!canEdit}
              onChange={e => handlePrereqToggle(prereq.id, e.target.checked).catch(console.error)}
              style={{ width: 18, height: 18, cursor: canEdit ? 'pointer' : 'default' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: HBC_COLORS.gray800 }}>{prereq.label}</div>
              <div style={{ fontSize: 12, color: HBC_COLORS.gray500 }}>{prereq.description}</div>
            </div>
            {prereq.completed && prereq.completedBy && (
              <span style={{ fontSize: 11, color: HBC_COLORS.success }}>
                {prereq.completedBy} — {prereq.completedDate ? new Date(prereq.completedDate).toLocaleDateString() : ''}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Locked overlay for agenda sections */}
      <div style={{ opacity: locked ? 0.5 : 1, pointerEvents: locked ? 'none' : 'auto' }}>
        {locked && (
          <div style={{ padding: '12px 16px', backgroundColor: HBC_COLORS.warningLight, color: '#92400E', borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
            Complete all prerequisites to unlock the agenda sections below.
          </div>
        )}

        {/* Project Header */}
        <div style={cardStyle}>
          <h3 style={sectionHeaderStyle}>Project Header</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { label: 'Project Name', value: agenda.header?.projectName, field: 'projectName' },
              { label: 'Project Code', value: agenda.header?.projectCode, field: 'projectCode' },
              { label: 'Client', value: agenda.header?.clientName, field: 'clientName' },
              { label: 'Project Value', value: formatCurrency(agenda.header?.projectValue || 0), field: 'projectValue', type: 'currency' },
              { label: 'Delivery Method', value: agenda.header?.deliveryMethod, field: 'deliveryMethod' },
              { label: 'Project Executive', value: agenda.header?.projectExecutive, field: 'projectExecutive' },
              { label: 'Project Manager', value: agenda.header?.projectManager, field: 'projectManager' },
              { label: 'Lead Estimator', value: agenda.header?.leadEstimator, field: 'leadEstimator' },
            ].map(f => (
              <div key={f.field}>
                <div style={fieldLabelStyle}>{f.label} <span style={{ fontSize: 10, color: HBC_COLORS.gray400 }}>(auto-populated)</span></div>
                <div style={{ fontSize: 14, color: HBC_COLORS.gray800, padding: '8px 0' }}>{f.value || '—'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Estimate Overview */}
        <div style={cardStyle}>
          <h3 style={sectionHeaderStyle}>Estimate Overview</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { label: 'Contract Amount', field: 'contractAmount', value: agenda.estimateOverview?.contractAmount },
              { label: 'Original Estimate', field: 'originalEstimate', value: agenda.estimateOverview?.originalEstimate },
              { label: 'Buyout Target', field: 'buyoutTarget', value: agenda.estimateOverview?.buyoutTarget },
              { label: 'Estimated Fee', field: 'estimatedFee', value: agenda.estimateOverview?.estimatedFee },
              { label: 'Estimated Gross Margin', field: 'estimatedGrossMargin', value: agenda.estimateOverview?.estimatedGrossMargin },
              { label: 'Contingency', field: 'contingency', value: agenda.estimateOverview?.contingency },
            ].map(f => (
              <div key={f.field}>
                <div style={fieldLabelStyle}>{f.label}</div>
                {canEdit ? (
                  <input style={inputStyle} type="number" defaultValue={f.value || 0}
                    onBlur={e => handleEstimateBlur(f.field, parseFloat(e.target.value) || 0)} />
                ) : (
                  <div style={{ fontSize: 14, padding: '8px 0' }}>{formatCurrency(f.value || 0)}</div>
                )}
              </div>
            ))}
          </div>
          {canEdit && (
            <div style={{ marginTop: 16 }}>
              <div style={fieldLabelStyle}>Notes</div>
              <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} defaultValue={agenda.estimateOverview?.notes || ''}
                onBlur={e => handleEstimateBlur('notes', e.target.value)} />
            </div>
          )}
        </div>

        {/* Discussion Items */}
        <div style={cardStyle}>
          <h3 style={sectionHeaderStyle}>Discussion Items ({discussedCount}/{agenda.discussionItems.length})</h3>
          {agenda.discussionItems.map((item: { id: number; sortOrder: number; label: string; description: string; discussed: boolean; notes: string; attachments: { id: number; fileName: string }[] }) => {
            const isExpanded = expandedItem === item.id;
            return (
              <div key={item.id} style={{ border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', backgroundColor: item.discussed ? HBC_COLORS.gray50 : '#fff' }}
                  onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                >
                  <input type="checkbox" checked={item.discussed} disabled={!canEdit}
                    onClick={e => e.stopPropagation()}
                    onChange={e => handleDiscussionToggle(item.id, e.target.checked).catch(console.error)}
                    style={{ width: 18, height: 18, cursor: canEdit ? 'pointer' : 'default' }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: HBC_COLORS.navy }}>{item.sortOrder}. {item.label}</span>
                    <span style={{ fontSize: 12, color: HBC_COLORS.gray500, marginLeft: 8 }}>{item.description}</span>
                  </div>
                  <span style={{ fontSize: 12, color: HBC_COLORS.gray400 }}>{isExpanded ? '\u25B2' : '\u25BC'}</span>
                </div>
                {isExpanded && (
                  <div style={{ padding: '12px 16px', borderTop: `1px solid ${HBC_COLORS.gray200}`, backgroundColor: HBC_COLORS.gray50 }}>
                    <div style={fieldLabelStyle}>Notes</div>
                    {canEdit ? (
                      <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical', marginBottom: 12 }}
                        defaultValue={item.notes}
                        onBlur={e => handleNotesBlur(item.id, e.target.value).catch(console.error)} />
                    ) : (
                      <div style={{ fontSize: 14, color: HBC_COLORS.gray800, marginBottom: 12, whiteSpace: 'pre-wrap' }}>{item.notes || '(no notes)'}</div>
                    )}
                    {item.attachments.length > 0 && (
                      <div>
                        <div style={fieldLabelStyle}>Attachments</div>
                        {item.attachments.map((att: { id: number; fileName: string }) => (
                          <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '4px 0' }}>
                            <span style={{ color: HBC_COLORS.info }}>{att.fileName}</span>
                            {canEdit && (
                              <button style={{ ...btnDanger, padding: '2px 8px', fontSize: 11 }}
                                onClick={() => turnoverHook.removeDiscussionAttachment(att.id).catch(console.error)}>Remove</button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Subcontractors */}
        <div style={cardStyle}>
          <h3 style={sectionHeaderStyle}>Subcontractors ({agenda.subcontractors.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${HBC_COLORS.gray200}` }}>
                  {['Trade', 'Subcontractor', 'Contact', 'Phone', 'Q Score', 'Pref', 'Req', ''].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: HBC_COLORS.gray600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agenda.subcontractors.map((sub: { id: number; trade: string; subcontractorName: string; contactName: string; contactPhone: string; qScore: number | null; isPreferred: boolean; isRequired: boolean }) => (
                  <tr key={sub.id} style={{ borderBottom: `1px solid ${HBC_COLORS.gray100}` }}>
                    <td style={{ padding: '8px 12px' }}>{sub.trade}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{sub.subcontractorName}</td>
                    <td style={{ padding: '8px 12px' }}>{sub.contactName}</td>
                    <td style={{ padding: '8px 12px' }}>{sub.contactPhone}</td>
                    <td style={{ padding: '8px 12px' }}>
                      {sub.qScore !== null ? (
                        <span style={{ fontWeight: 600, color: sub.qScore >= 85 ? HBC_COLORS.success : sub.qScore >= 70 ? HBC_COLORS.warning : HBC_COLORS.error }}>{sub.qScore}</span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '8px 12px' }}>{sub.isPreferred ? '\u2713' : ''}</td>
                    <td style={{ padding: '8px 12px' }}>{sub.isRequired ? '\u2713' : ''}</td>
                    <td style={{ padding: '8px 12px' }}>
                      {canEdit && <button style={{ ...btnDanger, padding: '2px 8px', fontSize: 11 }} onClick={() => handleRemoveSub(sub.id).catch(console.error)}>Remove</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {canEdit && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
              <input style={{ ...inputStyle, width: 160 }} placeholder="Trade" value={newSubTrade} onChange={e => setNewSubTrade(e.target.value)} />
              <input style={{ ...inputStyle, width: 200 }} placeholder="Subcontractor Name" value={newSubName} onChange={e => setNewSubName(e.target.value)} />
              <button style={btnSuccess} onClick={() => handleAddSub().catch(console.error)}>Add</button>
            </div>
          )}
        </div>

        {/* Exhibits */}
        <div style={cardStyle}>
          <h3 style={sectionHeaderStyle}>Exhibits ({exhibitCount}/{agenda.exhibits.length})</h3>
          {agenda.exhibits.map((exhibit: { id: number; label: string; reviewed: boolean; isDefault: boolean; reviewedBy?: string; linkedDocumentUrl?: string; uploadedFileName?: string }) => (
            <div key={exhibit.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: `1px solid ${HBC_COLORS.gray100}` }}>
              <input type="checkbox" checked={exhibit.reviewed} disabled={!canEdit}
                onChange={e => handleExhibitReview(exhibit.id, e.target.checked).catch(console.error)}
                style={{ width: 18, height: 18, cursor: canEdit ? 'pointer' : 'default' }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 14, color: HBC_COLORS.gray800 }}>{exhibit.label}</span>
                {exhibit.linkedDocumentUrl && (
                  <a href={exhibit.linkedDocumentUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: HBC_COLORS.info, marginLeft: 8 }}>View</a>
                )}
                {exhibit.uploadedFileName && (
                  <span style={{ fontSize: 12, color: HBC_COLORS.gray500, marginLeft: 8 }}>{exhibit.uploadedFileName}</span>
                )}
              </div>
              {exhibit.reviewed && exhibit.reviewedBy && (
                <span style={{ fontSize: 11, color: HBC_COLORS.success }}>{exhibit.reviewedBy}</span>
              )}
              {canEdit && !exhibit.isDefault && (
                <button style={{ ...btnDanger, padding: '2px 8px', fontSize: 11 }} onClick={() => handleRemoveExhibit(exhibit.id).catch(console.error)}>Remove</button>
              )}
            </div>
          ))}
          {canEdit && (
            <button style={{ ...btnPrimary, marginTop: 12, fontSize: 12 }} onClick={() => handleAddExhibit().catch(console.error)}>+ Add Custom Exhibit</button>
          )}
        </div>

        {/* Post-Meeting Action */}
        <div style={cardStyle}>
          <h3 style={sectionHeaderStyle}>Post-Meeting Action</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={agenda.bcPublished || false} disabled={!canEdit}
                onChange={e => turnoverHook.updateAgenda(projectCode, { bcPublished: e.target.checked }).catch(console.error)}
                style={{ width: 18, height: 18 }} />
              <span style={{ fontSize: 14, color: HBC_COLORS.gray800 }}>Building Connected list published</span>
            </div>
            <div>
              <div style={fieldLabelStyle}>PM Name</div>
              {canEdit ? (
                <input style={inputStyle} defaultValue={agenda.pmName || ''} onBlur={e => handleHeaderBlur('pmName', e.target.value)} />
              ) : (
                <div style={{ fontSize: 14 }}>{agenda.pmName || '—'}</div>
              )}
            </div>
            <div>
              <div style={fieldLabelStyle}>APM Name</div>
              {canEdit ? (
                <input style={inputStyle} defaultValue={agenda.apmName || ''} onBlur={e => handleHeaderBlur('apmName', e.target.value)} />
              ) : (
                <div style={{ fontSize: 14 }}>{agenda.apmName || '—'}</div>
              )}
            </div>
          </div>
        </div>

        {/* Signature Block */}
        <div style={cardStyle}>
          <h3 style={sectionHeaderStyle}>Signatures ({sigCount}/{agenda.signatures.length})</h3>
          {!turnoverHook.allItemsDiscussed && (
            <div style={{ padding: '8px 16px', backgroundColor: HBC_COLORS.warningLight, color: '#92400E', borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
              All discussion items must be marked as discussed before signatures can be collected.
            </div>
          )}
          {agenda.signatures.map((sig: { id: number; role: string; signerName: string; signed: boolean; signedDate?: string; comment?: string; affidavitText: string }) => (
            <div key={sig.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderBottom: `1px solid ${HBC_COLORS.gray100}`,
              backgroundColor: sig.signed ? HBC_COLORS.successLight : '#fff',
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: HBC_COLORS.navy }}>{sig.role}</div>
                <div style={{ fontSize: 13, color: HBC_COLORS.gray600 }}>{sig.signerName || '(unassigned)'}</div>
              </div>
              {sig.signed ? (
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: HBC_COLORS.success }}>Signed</span>
                  <div style={{ fontSize: 11, color: HBC_COLORS.gray500 }}>
                    {sig.signedDate ? new Date(sig.signedDate).toLocaleDateString() : ''}
                    {sig.comment && ` — ${sig.comment}`}
                  </div>
                </div>
              ) : (
                <div>
                  {canSign && turnoverHook.allItemsDiscussed && sig.signerName ? (
                    signConfirm === sig.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 300 }}>
                        <div style={{ fontSize: 11, color: HBC_COLORS.gray600, fontStyle: 'italic' }}>{sig.affidavitText}</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button style={btnSuccess} onClick={() => handleSign(sig.id).catch(console.error)}>Confirm & Sign</button>
                          <button style={{ ...btnPrimary, backgroundColor: HBC_COLORS.gray400 }} onClick={() => setSignConfirm(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button style={btnPrimary} onClick={() => setSignConfirm(sig.id)}>Sign</button>
                    )
                  ) : (
                    <span style={{ fontSize: 12, color: HBC_COLORS.gray400 }}>Pending</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   Tab 2: Follow-Up Checklist (existing functionality preserved)
   ═══════════════════════════════════════════════════════════════════ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FollowUpChecklistTab: React.FC<any> = ({
  project, projectCode, turnoverItems, updateTurnoverItem,
  teamMembers, transitionStage, scheduleTurnoverMeeting,
  dataService, setToast,
}) => {
  const [completing, setCompleting] = React.useState(false);

  const requiredItems = turnoverItems.filter((t: ITurnoverItem) => t.required);
  const requiredComplete = requiredItems.filter((t: ITurnoverItem) => t.status === 'Complete').length;
  const optionalItems = turnoverItems.filter((t: ITurnoverItem) => !t.required);
  const optionalComplete = optionalItems.filter((t: ITurnoverItem) => t.status === 'Complete').length;
  const totalComplete = turnoverItems.filter((t: ITurnoverItem) => t.status === 'Complete').length;
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
        recipients: teamMembers.map((tm: { email: string }) => tm.email),
        projectCode,
      });
      setToast('Turnover completed. Operations Team now has full access. Estimating demoted to read-only.');
    } catch (err) { setToast(err instanceof Error ? err.message : 'Failed to complete turnover.'); }
    finally { setCompleting(false); }
  };

  const handleSchedule = async (): Promise<void> => {
    if (!project) return;
    const emails = teamMembers.map((tm: { email: string }) => tm.email);
    await scheduleTurnoverMeeting(projectCode, project.id, emails);
    setToast('Turnover meeting scheduled.');
  };

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
        const catItems = turnoverItems.filter((t: ITurnoverItem) => t.category === cat);
        if (catItems.length === 0) return null;
        return (
          <div key={cat} style={cardStyle}>
            <h3 style={{ margin: '0 0 16px', color: HBC_COLORS.navy, display: 'flex', alignItems: 'center', gap: 8 }}>
              {cat}
              <span style={{ fontSize: 12, color: HBC_COLORS.gray500, fontWeight: 400 }}>
                ({catItems.filter((i: ITurnoverItem) => i.status === 'Complete').length}/{catItems.length})
              </span>
            </h3>
            {catItems.map((item: ITurnoverItem) => (
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

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../../contexts/AppContext';
import { useProjectManagementPlan } from '../../../hooks/useProjectManagementPlan';
import { useRiskCostManagement } from '../../../hooks/useRiskCostManagement';
import { useQualityConcerns } from '../../../hooks/useQualityConcerns';
import { useSafetyConcerns } from '../../../hooks/useSafetyConcerns';
import { useProjectSchedule } from '../../../hooks/useProjectSchedule';
import { useSuperintendentPlan } from '../../../hooks/useSuperintendentPlan';
import { useLessonsLearned } from '../../../hooks/useLessonsLearned';
import { PageHeader } from '../../../shared/PageHeader';
import { LoadingSpinner } from '../../../shared/LoadingSpinner';
import { HBC_COLORS } from '../../../../theme/tokens';
import { PERMISSIONS } from '../../../../utils/permissions';
import { AuditAction, EntityType, Stage } from '../../../../models/enums';
import { PMP_SECTIONS } from '../../../../models/IProjectManagementPlan';
import { PMPSection } from './PMPSection';
import { PMPSignatureBlock } from './PMPSignatureBlock';
import { PMPApprovalPanel } from './PMPApprovalPanel';
import { useLeads } from '../../../hooks/useLeads';

export const ProjectManagementPlan: React.FC = () => {
  const navigate = useNavigate();
  const { selectedProject, hasPermission, dataService, currentUser } = useAppContext();
  const { pmp, boilerplate, isLoading, error, fetchPlan, updatePlan, submitForApproval, respondToApproval, signPlan, canSubmit } = useProjectManagementPlan();
  const riskCost = useRiskCostManagement();
  const quality = useQualityConcerns();
  const safety = useSafetyConcerns();
  const schedule = useProjectSchedule();
  const superPlan = useSuperintendentPlan();
  const lessons = useLessonsLearned();
  const { leads, fetchLeads } = useLeads();
  const projectCode = selectedProject?.projectCode ?? '';
  const canEdit = hasPermission(PERMISSIONS.PMP_EDIT);
  const canApprove = hasPermission(PERMISSIONS.PMP_APPROVE) || hasPermission(PERMISSIONS.PMP_FINAL_APPROVE);
  const canSign = hasPermission(PERMISSIONS.PMP_SIGN);

  React.useEffect(() => { fetchLeads().catch(console.error); }, [fetchLeads]);

  React.useEffect(() => {
    if (!projectCode) return;
    fetchPlan(projectCode).catch(console.error);
    riskCost.fetchData(projectCode).catch(console.error);
    quality.fetchConcerns(projectCode).catch(console.error);
    safety.fetchConcerns(projectCode).catch(console.error);
    schedule.fetchSchedule(projectCode).catch(console.error);
    superPlan.fetchPlan(projectCode).catch(console.error);
    lessons.fetchLessons(projectCode).catch(console.error);
  }, [projectCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const project = leads.find(l => l.ProjectCode === projectCode);
  const isCloseout = project?.Stage === Stage.Closeout;

  const handleSign = React.useCallback(async (signatureId: number, comment: string) => {
    await signPlan(projectCode, signatureId, comment);
    dataService.logAudit({ Action: AuditAction.PMPSigned, EntityType: EntityType.PMP, EntityId: projectCode, User: currentUser?.email ?? '', Details: `Signed signature ${signatureId}`, ProjectCode: projectCode }).catch(console.error);
  }, [projectCode, signPlan, dataService, currentUser]);

  const handleSubmit = React.useCallback(async () => {
    await submitForApproval(projectCode, currentUser?.email ?? '');
    dataService.logAudit({ Action: AuditAction.PMPSubmitted, EntityType: EntityType.PMP, EntityId: projectCode, User: currentUser?.email ?? '', Details: 'Submitted for approval', ProjectCode: projectCode }).catch(console.error);
  }, [projectCode, submitForApproval, dataService, currentUser]);

  const handleApprovalResponse = React.useCallback(async (stepId: number, approved: boolean, comment: string) => {
    await respondToApproval(projectCode, stepId, approved, comment);
    dataService.logAudit({ Action: approved ? AuditAction.PMPApproved : AuditAction.PMPReturned, EntityType: EntityType.PMP, EntityId: projectCode, User: currentUser?.email ?? '', Details: comment, ProjectCode: projectCode }).catch(console.error);
  }, [projectCode, respondToApproval, dataService, currentUser]);

  const handleFieldBlur = React.useCallback(async (field: string, value: string) => {
    if (!canEdit) return;
    await updatePlan(projectCode, { [field]: value });
  }, [canEdit, projectCode, updatePlan]);

  if (isLoading) return <LoadingSpinner label="Loading Project Management Plan..." />;
  if (error) return <div style={{ padding: 24, color: HBC_COLORS.error }}>{error}</div>;
  if (!pmp) return <div style={{ padding: 48, textAlign: 'center', color: HBC_COLORS.gray400 }}>No PMP found for this project.</div>;

  const getBoilerplate = (sn: string): string => boilerplate.find(b => b.sectionNumber === sn)?.content ?? '';
  const linkButton = (path: string, label: string): React.ReactElement => (
    <button onClick={() => navigate(path)} style={{ padding: '6px 12px', backgroundColor: HBC_COLORS.gray100, color: HBC_COLORS.navy, border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>{label} →</button>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
      {/* Main content */}
      <div>
        <PageHeader title="Project Management Plan" subtitle={`${pmp.projectName} — ${pmp.jobNumber}`} />

        {PMP_SECTIONS.map(sec => (
          <PMPSection key={sec.number} number={sec.number} title={sec.title} sourceType={sec.sourceType} isGrayed={(sec.number === 'XII' || sec.number === 'XIV') && !isCloseout}>
            {sec.number === 'I' && <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{getBoilerplate('I')}</div>}

            {sec.number === 'II' && (
              <div>
                <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>{linkButton('/responsibility', 'View Team Assignments')}</div>
                <h4 style={{ fontSize: 14, color: HBC_COLORS.navy, marginBottom: 8 }}>Startup Signatures</h4>
                {pmp.startupSignatures.map(sig => <PMPSignatureBlock key={sig.id} signature={sig} canSign={canSign} onSign={handleSign} />)}
              </div>
            )}

            {sec.number === 'III' && (
              <div>
                <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 16 }}>{getBoilerplate('III')}</div>
                <div style={{ backgroundColor: HBC_COLORS.gray50, borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: HBC_COLORS.navy, marginBottom: 8 }}>Quality Concerns ({quality.openCount} open)</div>
                  {linkButton('/quality-concerns', 'View/Edit Quality Concerns')}
                </div>
              </div>
            )}

            {sec.number === 'IV' && (
              <div>
                <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 16 }}>{getBoilerplate('IV')}</div>
                <div><label style={{ fontSize: 12, color: HBC_COLORS.gray500 }}>Preconstruction Meeting Notes</label></div>
                {canEdit ? <textarea defaultValue={pmp.preconMeetingNotes} onBlur={e => handleFieldBlur('preconMeetingNotes', e.target.value)} style={{ width: '100%', border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 4, padding: 8, fontSize: 13, minHeight: 80, resize: 'vertical', marginTop: 4 }} /> : <p style={{ fontSize: 13 }}>{pmp.preconMeetingNotes || 'No notes yet'}</p>}
              </div>
            )}

            {sec.number === 'V' && (
              <div>
                <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 16 }}>{getBoilerplate('V')}</div>
                <div style={{ backgroundColor: HBC_COLORS.gray50, borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: HBC_COLORS.navy, marginBottom: 4 }}>Safety Officer: {safety.safetyOfficer?.name ?? 'Not assigned'}</div>
                  <div style={{ fontSize: 12, marginBottom: 8 }}>Open Concerns: {safety.concerns.filter(c => c.status === 'Open').length}</div>
                  {linkButton('/safety-concerns', 'View/Edit Safety Concerns')}
                </div>
              </div>
            )}

            {sec.number === 'VI' && (
              <div>
                {riskCost.data && (
                  <div style={{ backgroundColor: HBC_COLORS.gray50, borderRadius: 8, padding: 12, marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: HBC_COLORS.gray500 }}>Contract: {riskCost.data.contractType} — ${riskCost.data.contractAmount.toLocaleString()}</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Buyout: {riskCost.data.buyoutOpportunities.length} items | Risks: {riskCost.data.potentialRisks.length} | Savings: {riskCost.data.potentialSavings.length}</div>
                    <div style={{ marginTop: 8 }}>{linkButton('/risk-cost', 'View/Edit Risk & Cost')}</div>
                  </div>
                )}
                <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{getBoilerplate('VI')}</div>
              </div>
            )}

            {sec.number === 'VII' && (
              <div>
                {schedule.schedule && (
                  <div style={{ backgroundColor: HBC_COLORS.gray50, borderRadius: 8, padding: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: HBC_COLORS.gray500 }}>Start: {schedule.schedule.startDate} | Completion: {schedule.schedule.substantialCompletionDate}</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Critical Path Items: {schedule.schedule.criticalPathConcerns.length} ({schedule.schedule.criticalPathConcerns.filter(c => c.status === 'Active').length} active)</div>
                    {schedule.daysToCompletion !== null && <div style={{ fontSize: 12, marginTop: 4, fontWeight: 600 }}>{schedule.daysToCompletion} days to completion</div>}
                    <div style={{ marginTop: 8 }}>{linkButton('/schedule-critical-path', 'View/Edit Schedule')}</div>
                  </div>
                )}
              </div>
            )}

            {sec.number === 'VIII' && <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{getBoilerplate('VIII')}</div>}

            {sec.number === 'IX' && (
              <div>
                <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 16 }}>{getBoilerplate('IX')}</div>
                <div><label style={{ fontSize: 12, color: HBC_COLORS.gray500 }}>Site Management Notes</label></div>
                {canEdit ? <textarea defaultValue={pmp.siteManagementNotes} onBlur={e => handleFieldBlur('siteManagementNotes', e.target.value)} style={{ width: '100%', border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 4, padding: 8, fontSize: 13, minHeight: 80, resize: 'vertical', marginTop: 4 }} /> : <p style={{ fontSize: 13 }}>{pmp.siteManagementNotes || 'No notes yet'}</p>}
              </div>
            )}

            {sec.number === 'X' && (
              <div>
                {superPlan.plan && (
                  <div style={{ backgroundColor: HBC_COLORS.gray50, borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>Completion: {superPlan.completionPercentage}%</div>
                    <div style={{ height: 6, backgroundColor: HBC_COLORS.gray200, borderRadius: 3, overflow: 'hidden', marginTop: 6 }}>
                      <div style={{ width: `${superPlan.completionPercentage}%`, height: '100%', backgroundColor: HBC_COLORS.success, borderRadius: 3 }} />
                    </div>
                    <div style={{ marginTop: 8 }}>{linkButton('/superintendent-plan', "View/Edit Superintendent's Plan")}</div>
                  </div>
                )}
              </div>
            )}

            {sec.number === 'XI' && (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: HBC_COLORS.gray500 }}>Buyout Target Date</label>
                  {canEdit ? <input type="date" defaultValue={pmp.projectAdminBuyoutDate ?? ''} onBlur={e => handleFieldBlur('projectAdminBuyoutDate', e.target.value)} style={{ display: 'block', border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 4, padding: '6px 8px', fontSize: 13, marginTop: 4 }} /> : <div style={{ fontSize: 13, marginTop: 4 }}>{pmp.projectAdminBuyoutDate ?? 'Not set'}</div>}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{getBoilerplate('XI')}</div>
              </div>
            )}

            {sec.number === 'XII' && (
              <div style={{ fontSize: 13, color: HBC_COLORS.gray500 }}>
                {isCloseout ? linkButton('/closeout', 'View Closeout Checklist') : 'Closeout section available after project enters Closeout stage.'}
              </div>
            )}

            {sec.number === 'XIII' && (
              <div>
                <div style={{ fontSize: 12, color: HBC_COLORS.gray500, marginBottom: 8 }}>Attachment URLs ({pmp.attachmentUrls.length} files)</div>
                {pmp.attachmentUrls.map((url, i) => (
                  <div key={i} style={{ fontSize: 12, marginBottom: 4 }}>
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#3B82F6' }}>{url.split('/').pop()}</a>
                  </div>
                ))}
              </div>
            )}

            {sec.number === 'XIV' && (
              <div style={{ fontSize: 13, color: HBC_COLORS.gray500 }}>
                {isCloseout ? (
                  <div>
                    <div>Lessons: {lessons.lessons.length} recorded ({lessons.lessons.filter(l => l.isIncludedInFinalRecord).length} for final record)</div>
                    <div style={{ marginTop: 8 }}>{linkButton('/lessons-learned', 'View/Edit Lessons Learned')}</div>
                  </div>
                ) : (
                  <div>{lessons.lessons.length} lessons recorded. {linkButton('/lessons-learned', 'View Lessons Learned')}</div>
                )}
              </div>
            )}

            {sec.number === 'XV' && <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{getBoilerplate('XV')}</div>}

            {sec.number === 'XVI' && (
              <div style={{ fontSize: 13 }}>
                {linkButton('/startup-checklist', 'View Startup Checklist')}
              </div>
            )}
          </PMPSection>
        ))}
      </div>

      {/* Sidebar */}
      <div style={{ position: 'sticky', top: 16, alignSelf: 'start' }}>
        <PMPApprovalPanel pmp={pmp} canSubmit={canSubmit && canEdit} canApprove={canApprove} onSubmit={handleSubmit} onApprovalResponse={handleApprovalResponse} />
      </div>
    </div>
  );
};

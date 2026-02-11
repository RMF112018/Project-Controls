import { IDataService, IListQueryOptions, IPagedResult, IActiveProjectsQueryOptions, IActiveProjectsFilter } from './IDataService';
import { ILead, ILeadFormData } from '../models/ILead';
import { IGoNoGoScorecard, IScorecardVersion } from '../models/IGoNoGoScorecard';
import { IEstimatingTracker } from '../models/IEstimatingTracker';
import { IRole, ICurrentUser } from '../models/IRole';
import { IFeatureFlag } from '../models/IFeatureFlag';
import { IMeeting, ICalendarAvailability } from '../models/IMeeting';
import { INotification } from '../models/INotification';
import { IAuditEntry } from '../models/IAuditEntry';
import { IProvisioningLog } from '../models/IProvisioningLog';
import { IStartupChecklistItem } from '../models/IStartupChecklist';
import { IInternalMatrixTask, ITeamRoleAssignment, IOwnerContractArticle, ISubContractClause } from '../models/IResponsibilityMatrix';
import { IMarketingProjectRecord } from '../models/IMarketingProjectRecord';
import { IRiskCostManagement, IRiskCostItem } from '../models/IRiskCostManagement';
import { IQualityConcern } from '../models/IQualityConcerns';
import { ISafetyConcern } from '../models/ISafetyConcerns';
import { IProjectScheduleCriticalPath, ICriticalPathItem } from '../models/IProjectScheduleCriticalPath';
import { ISuperintendentPlan, ISuperintendentPlanSection } from '../models/ISuperintendentPlan';
import { ILessonLearned } from '../models/ILessonsLearned';
import { IProjectManagementPlan, IDivisionApprover, IPMPBoilerplateSection } from '../models/IProjectManagementPlan';
import { IMonthlyProjectReview } from '../models/IMonthlyProjectReview';
import { IEstimatingKickoff, IEstimatingKickoffItem } from '../models/IEstimatingKickoff';
import { IJobNumberRequest, JobNumberRequestStatus } from '../models/IJobNumberRequest';
import { IProjectType } from '../models/IProjectType';
import { IStandardCostCode } from '../models/IStandardCostCode';
import { IBuyoutEntry, BuyoutStatus, EVerifyStatus } from '../models/IBuyoutEntry';
import { ICommitmentApproval, CommitmentStatus, WaiverType, ApprovalStep } from '../models/ICommitmentApproval';
import { IActiveProject, IPortfolioSummary, IPersonnelWorkload, ProjectStatus, SectorType, DEFAULT_ALERT_THRESHOLDS } from '../models/IActiveProject';
import { IComplianceEntry, IComplianceSummary, IComplianceLogFilter } from '../models/IComplianceSummary';
import { IWorkflowDefinition, IWorkflowStep, IConditionalAssignment, IWorkflowStepOverride, IResolvedWorkflowStep } from '../models/IWorkflowDefinition';
import { ITurnoverAgenda, ITurnoverPrerequisite, ITurnoverDiscussionItem, ITurnoverSubcontractor, ITurnoverExhibit, ITurnoverSignature, ITurnoverEstimateOverview, ITurnoverAttachment } from '../models/ITurnoverAgenda';
import { IActionInboxItem } from '../models/IActionInbox';
import { IPermissionTemplate, ISecurityGroupMapping, IProjectTeamAssignment, IResolvedPermissions } from '../models/IPermissionTemplate';
import { GoNoGoDecision, Stage, WorkflowKey } from '../models/enums';
import { LIST_NAMES } from '../utils/constants';
import { STANDARD_BUYOUT_DIVISIONS } from '../utils/buyoutTemplate';

/**
 * SharePoint Data Service — Live implementation using PnP JS.
 *
 * This is a stub. Each method will be implemented when connecting
 * to real SharePoint lists. For development, use MockDataService.
 */
export class SharePointDataService implements IDataService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sp: any; // SPFI instance

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialize(spInstance: any): void {
    this.sp = spInstance;
  }

  // --- Leads ---
  async getLeads(_options?: IListQueryOptions): Promise<IPagedResult<ILead>> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.LEADS_MASTER).items
      .top(_options?.top || 100)();
    return { items: items as ILead[], totalCount: items.length, hasMore: false };
  }

  async getLeadById(id: number): Promise<ILead | null> {
    try {
      const item = await this.sp.web.lists.getByTitle(LIST_NAMES.LEADS_MASTER).items.getById(id)();
      return item as ILead;
    } catch {
      return null;
    }
  }

  async getLeadsByStage(stage: Stage): Promise<ILead[]> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.LEADS_MASTER).items
      .filter(`Stage eq '${stage}'`)();
    return items as ILead[];
  }

  async createLead(data: ILeadFormData): Promise<ILead> {
    const result = await this.sp.web.lists.getByTitle(LIST_NAMES.LEADS_MASTER).items.add(data);
    return result as ILead;
  }

  async updateLead(id: number, data: Partial<ILead>): Promise<ILead> {
    await this.sp.web.lists.getByTitle(LIST_NAMES.LEADS_MASTER).items.getById(id).update(data);
    return this.getLeadById(id) as Promise<ILead>;
  }

  async deleteLead(id: number): Promise<void> {
    await this.sp.web.lists.getByTitle(LIST_NAMES.LEADS_MASTER).items.getById(id).delete();
  }

  async searchLeads(query: string): Promise<ILead[]> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.LEADS_MASTER).items
      .filter(`substringof('${query}', Title) or substringof('${query}', ClientName) or substringof('${query}', ProjectCode)`)();
    return items as ILead[];
  }

  // --- Scorecards ---
  async getScorecardByLeadId(leadId: number): Promise<IGoNoGoScorecard | null> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items
      .filter(`LeadID eq ${leadId}`)();
    return items.length > 0 ? items[0] as IGoNoGoScorecard : null;
  }

  async getScorecards(): Promise<IGoNoGoScorecard[]> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items();
    return items as IGoNoGoScorecard[];
  }

  async createScorecard(data: Partial<IGoNoGoScorecard>): Promise<IGoNoGoScorecard> {
    const result = await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items.add(data);
    return result as IGoNoGoScorecard;
  }

  async updateScorecard(id: number, data: Partial<IGoNoGoScorecard>): Promise<IGoNoGoScorecard> {
    await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items.getById(id).update(data);
    return { id, ...data } as IGoNoGoScorecard;
  }

  async submitGoNoGoDecision(scorecardId: number, decision: GoNoGoDecision, projectCode?: string): Promise<void> {
    await this.updateScorecard(scorecardId, {
      Decision: decision,
      DecisionDate: new Date().toISOString(),
      ProjectCode: projectCode,
    });
  }

  // --- Estimating ---
  async getEstimatingRecords(_options?: IListQueryOptions): Promise<IPagedResult<IEstimatingTracker>> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_TRACKER).items();
    return { items: items as IEstimatingTracker[], totalCount: items.length, hasMore: false };
  }

  async getEstimatingRecordById(id: number): Promise<IEstimatingTracker | null> {
    try {
      const item = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_TRACKER).items.getById(id)();
      return item as IEstimatingTracker;
    } catch {
      return null;
    }
  }

  async getEstimatingByLeadId(leadId: number): Promise<IEstimatingTracker | null> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_TRACKER).items
      .filter(`LeadID eq ${leadId}`)();
    return items.length > 0 ? items[0] as IEstimatingTracker : null;
  }

  async createEstimatingRecord(data: Partial<IEstimatingTracker>): Promise<IEstimatingTracker> {
    const result = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_TRACKER).items.add(data);
    return result as IEstimatingTracker;
  }

  async updateEstimatingRecord(id: number, data: Partial<IEstimatingTracker>): Promise<IEstimatingTracker> {
    await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_TRACKER).items.getById(id).update(data);
    return { id, ...data } as IEstimatingTracker;
  }

  async getCurrentPursuits(): Promise<IEstimatingTracker[]> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_TRACKER).items
      .filter(`AwardStatus eq 'Pending'`)();
    return items as IEstimatingTracker[];
  }

  async getPreconEngagements(): Promise<IEstimatingTracker[]> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_TRACKER).items
      .filter(`AwardStatus eq 'Awarded w/ Precon'`)();
    return items as IEstimatingTracker[];
  }

  async getEstimateLog(): Promise<IEstimatingTracker[]> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_TRACKER).items
      .filter(`SubmittedDate ne null`)();
    return items as IEstimatingTracker[];
  }

  // --- RBAC ---
  async getCurrentUser(): Promise<ICurrentUser> {
    // Will be populated from SPFx context + App_Roles
    throw new Error('Not implemented - use SPFx context');
  }

  async getRoles(): Promise<IRole[]> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.APP_ROLES).items();
    return items as IRole[];
  }

  async updateRole(id: number, data: Partial<IRole>): Promise<IRole> {
    await this.sp.web.lists.getByTitle(LIST_NAMES.APP_ROLES).items.getById(id).update(data);
    return { id, ...data } as IRole;
  }

  // --- Feature Flags ---
  async getFeatureFlags(): Promise<IFeatureFlag[]> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.FEATURE_FLAGS).items();
    return items as IFeatureFlag[];
  }

  async updateFeatureFlag(id: number, data: Partial<IFeatureFlag>): Promise<IFeatureFlag> {
    await this.sp.web.lists.getByTitle(LIST_NAMES.FEATURE_FLAGS).items.getById(id).update(data);
    return { id, ...data } as IFeatureFlag;
  }

  // --- Meetings ---
  async getCalendarAvailability(_emails: string[], _startDate: string, _endDate: string): Promise<ICalendarAvailability[]> {
    // Delegated to GraphService
    throw new Error('Use GraphService directly');
  }

  async createMeeting(_meeting: Partial<IMeeting>): Promise<IMeeting> {
    throw new Error('Use GraphService directly');
  }

  async getMeetings(_projectCode?: string): Promise<IMeeting[]> {
    return [];
  }

  // --- Notifications ---
  async sendNotification(_notification: Partial<INotification>): Promise<INotification> {
    throw new Error('Use PowerAutomateService directly');
  }

  async getNotifications(_projectCode?: string): Promise<INotification[]> {
    return [];
  }

  // --- Audit ---
  async logAudit(entry: Partial<IAuditEntry>): Promise<void> {
    await this.sp.web.lists.getByTitle(LIST_NAMES.AUDIT_LOG).items.add(entry);
  }

  async getAuditLog(entityType?: string, entityId?: string, startDate?: string, endDate?: string): Promise<IAuditEntry[]> {
    let query = this.sp.web.lists.getByTitle(LIST_NAMES.AUDIT_LOG).items;
    const filters: string[] = [];
    if (entityType) filters.push(`EntityType eq '${entityType}'`);
    if (entityId) filters.push(`EntityId eq '${entityId}'`);
    if (startDate) filters.push(`Timestamp ge datetime'${startDate}'`);
    if (endDate) filters.push(`Timestamp le datetime'${endDate}'`);
    if (filters.length > 0) query = query.filter(filters.join(' and '));
    const items = await query.orderBy('Timestamp', false).top(100)();
    return items as IAuditEntry[];
  }

  async purgeOldAuditEntries(_olderThanDays: number): Promise<number> {
    throw new Error('Not implemented — use Power Automate scheduled flow for production archive');
  }

  // --- Provisioning ---
  async triggerProvisioning(_leadId: number, _projectCode: string, _projectName: string, _requestedBy: string): Promise<IProvisioningLog> {
    // Delegated to PowerAutomateService
    throw new Error('Use PowerAutomateService directly');
  }

  async getProvisioningStatus(projectCode: string): Promise<IProvisioningLog | null> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.PROVISIONING_LOG).items
      .filter(`ProjectCode eq '${projectCode}'`)
      .orderBy('RequestedAt', false)
      .top(1)();
    if (items.length === 0) return null;
    return items[0] as IProvisioningLog;
  }

  async updateProvisioningLog(_projectCode: string, _data: Partial<IProvisioningLog>): Promise<IProvisioningLog> {
    throw new Error('Use PowerAutomateService directly');
  }

  async getProvisioningLogs(): Promise<IProvisioningLog[]> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.PROVISIONING_LOG).items
      .orderBy('RequestedAt', false)
      .top(100)();
    return items as IProvisioningLog[];
  }

  async retryProvisioning(_projectCode: string, _fromStep: number): Promise<IProvisioningLog> {
    // Delegated to PowerAutomateService
    throw new Error('Use PowerAutomateService directly');
  }

  // --- Phase 6: Workflow ---
  async getTeamMembers(_projectCode: string): Promise<import('../models').ITeamMember[]> {
    const items = await this.sp.web.lists.getByTitle('Team_Members').items.filter(`ProjectCode eq '${_projectCode}'`)();
    return items;
  }

  async getDeliverables(_projectCode: string): Promise<import('../models').IDeliverable[]> {
    const items = await this.sp.web.lists.getByTitle('Deliverables').items.filter(`ProjectCode eq '${_projectCode}'`)();
    return items;
  }

  async createDeliverable(data: Partial<import('../models').IDeliverable>): Promise<import('../models').IDeliverable> {
    const result = await this.sp.web.lists.getByTitle('Deliverables').items.add(data);
    return result as import('../models').IDeliverable;
  }

  async updateDeliverable(id: number, data: Partial<import('../models').IDeliverable>): Promise<import('../models').IDeliverable> {
    await this.sp.web.lists.getByTitle('Deliverables').items.getById(id).update(data);
    return { id, ...data } as import('../models').IDeliverable;
  }

  async getInterviewPrep(_leadId: number): Promise<import('../models').IInterviewPrep | null> {
    const items = await this.sp.web.lists.getByTitle('Interview_Prep').items.filter(`LeadID eq ${_leadId}`)();
    return items.length > 0 ? items[0] : null;
  }

  async saveInterviewPrep(data: Partial<import('../models').IInterviewPrep>): Promise<import('../models').IInterviewPrep> {
    const result = await this.sp.web.lists.getByTitle('Interview_Prep').items.add(data);
    return result as import('../models').IInterviewPrep;
  }

  async getContractInfo(_projectCode: string): Promise<import('../models').IContractInfo | null> {
    const items = await this.sp.web.lists.getByTitle('Contract_Info').items.filter(`ProjectCode eq '${_projectCode}'`)();
    return items.length > 0 ? items[0] : null;
  }

  async saveContractInfo(data: Partial<import('../models').IContractInfo>): Promise<import('../models').IContractInfo> {
    const result = await this.sp.web.lists.getByTitle('Contract_Info').items.add(data);
    return result as import('../models').IContractInfo;
  }

  async getTurnoverItems(_projectCode: string): Promise<import('../models').ITurnoverItem[]> {
    const items = await this.sp.web.lists.getByTitle('Turnover_Items').items.filter(`ProjectCode eq '${_projectCode}'`)();
    return items;
  }

  async updateTurnoverItem(id: number, data: Partial<import('../models').ITurnoverItem>): Promise<import('../models').ITurnoverItem> {
    await this.sp.web.lists.getByTitle('Turnover_Items').items.getById(id).update(data);
    return { id, ...data } as import('../models').ITurnoverItem;
  }

  async getCloseoutItems(_projectCode: string): Promise<import('../models').ICloseoutItem[]> {
    const items = await this.sp.web.lists.getByTitle('Closeout_Items').items.filter(`ProjectCode eq '${_projectCode}'`)();
    return items;
  }

  async updateCloseoutItem(id: number, data: Partial<import('../models').ICloseoutItem>): Promise<import('../models').ICloseoutItem> {
    await this.sp.web.lists.getByTitle('Closeout_Items').items.getById(id).update(data);
    return { id, ...data } as import('../models').ICloseoutItem;
  }

  async getLossAutopsy(_leadId: number): Promise<import('../models').ILossAutopsy | null> {
    const items = await this.sp.web.lists.getByTitle('Loss_Autopsy').items.filter(`LeadID eq ${_leadId}`)();
    return items.length > 0 ? items[0] : null;
  }

  async saveLossAutopsy(data: Partial<import('../models').ILossAutopsy>): Promise<import('../models').ILossAutopsy> {
    const result = await this.sp.web.lists.getByTitle('Loss_Autopsy').items.add(data);
    return result as import('../models').ILossAutopsy;
  }

  async finalizeLossAutopsy(leadId: number, data: Partial<import('../models').ILossAutopsy>): Promise<import('../models').ILossAutopsy> {
    const items = await this.sp.web.lists.getByTitle('Loss_Autopsy').items.filter(`LeadID eq ${leadId}`)();
    if (items.length === 0) throw new Error(`No autopsy found for lead ${leadId}`);
    await this.sp.web.lists.getByTitle('Loss_Autopsy').items.getById(items[0].Id).update({
      ...data,
      isFinalized: true,
      finalizedDate: new Date().toISOString(),
    });
    return { ...items[0], ...data, isFinalized: true } as import('../models').ILossAutopsy;
  }

  async isAutopsyFinalized(leadId: number): Promise<boolean> {
    const items = await this.sp.web.lists.getByTitle('Loss_Autopsy').items.filter(`LeadID eq ${leadId} and isFinalized eq 1`)();
    return items.length > 0;
  }

  async getAllLossAutopsies(): Promise<import('../models').ILossAutopsy[]> {
    return await this.sp.web.lists.getByTitle('Loss_Autopsy').items() as import('../models').ILossAutopsy[];
  }

  // --- App Context ---
  async getAppContextConfig(siteUrl: string): Promise<{ RenderMode: string; AppTitle: string; VisibleModules: string[] } | null> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.APP_CONTEXT_CONFIG).items
      .filter(`SiteURL eq '${siteUrl}'`)();
    if (items.length === 0) return null;
    return {
      RenderMode: items[0].RenderMode,
      AppTitle: items[0].AppTitle,
      VisibleModules: JSON.parse(items[0].VisibleModules || '[]'),
    };
  }

  async getTemplates(): Promise<Array<{ TemplateName: string; SourceURL: string; TargetFolder: string; Division: string; Active: boolean }>> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.TEMPLATE_REGISTRY).items();
    return items.map((i: Record<string, unknown>) => ({
      TemplateName: String(i.TemplateName || ''),
      SourceURL: String(i.SourceURL || ''),
      TargetFolder: String(i.TargetFolder || ''),
      Division: String(i.Division || ''),
      Active: Boolean(i.Active),
    }));
  }

  async getRegions(): Promise<string[]> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.REGIONS).items.select('Title')();
    return items.map((i: Record<string, unknown>) => String(i.Title || ''));
  }

  async getSectors(): Promise<string[]> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.SECTORS).items.select('Title')();
    return items.map((i: Record<string, unknown>) => String(i.Title || ''));
  }

  // --- Startup Checklist ---
  async getStartupChecklist(_projectCode: string): Promise<IStartupChecklistItem[]> { return []; }
  async updateChecklistItem(_projectCode: string, _itemId: number, _data: Partial<IStartupChecklistItem>): Promise<IStartupChecklistItem> { throw new Error('Not implemented'); }
  async addChecklistItem(_projectCode: string, _item: Partial<IStartupChecklistItem>): Promise<IStartupChecklistItem> { throw new Error('Not implemented'); }
  async removeChecklistItem(_projectCode: string, _itemId: number): Promise<void> { throw new Error('Not implemented'); }

  // --- Internal Matrix ---
  async getInternalMatrix(_projectCode: string): Promise<IInternalMatrixTask[]> { return []; }
  async updateInternalMatrixTask(_projectCode: string, _taskId: number, _data: Partial<IInternalMatrixTask>): Promise<IInternalMatrixTask> { throw new Error('Not implemented'); }
  async addInternalMatrixTask(_projectCode: string, _task: Partial<IInternalMatrixTask>): Promise<IInternalMatrixTask> { throw new Error('Not implemented'); }
  async removeInternalMatrixTask(_projectCode: string, _taskId: number): Promise<void> { throw new Error('Not implemented'); }

  // --- Team Assignments ---
  async getTeamRoleAssignments(_projectCode: string): Promise<ITeamRoleAssignment[]> { return []; }
  async updateTeamRoleAssignment(_projectCode: string, _role: string, _person: string, _email?: string): Promise<ITeamRoleAssignment> { throw new Error('Not implemented'); }

  // --- Owner Contract Matrix ---
  async getOwnerContractMatrix(_projectCode: string): Promise<IOwnerContractArticle[]> { return []; }
  async updateOwnerContractArticle(_projectCode: string, _itemId: number, _data: Partial<IOwnerContractArticle>): Promise<IOwnerContractArticle> { throw new Error('Not implemented'); }
  async addOwnerContractArticle(_projectCode: string, _item: Partial<IOwnerContractArticle>): Promise<IOwnerContractArticle> { throw new Error('Not implemented'); }
  async removeOwnerContractArticle(_projectCode: string, _itemId: number): Promise<void> { throw new Error('Not implemented'); }

  // --- Sub-Contract Matrix ---
  async getSubContractMatrix(_projectCode: string): Promise<ISubContractClause[]> { return []; }
  async updateSubContractClause(_projectCode: string, _itemId: number, _data: Partial<ISubContractClause>): Promise<ISubContractClause> { throw new Error('Not implemented'); }
  async addSubContractClause(_projectCode: string, _item: Partial<ISubContractClause>): Promise<ISubContractClause> { throw new Error('Not implemented'); }
  async removeSubContractClause(_projectCode: string, _itemId: number): Promise<void> { throw new Error('Not implemented'); }

  // --- Marketing Project Record ---
  async getMarketingProjectRecord(_projectCode: string): Promise<IMarketingProjectRecord | null> { return null; }
  async createMarketingProjectRecord(_data: Partial<IMarketingProjectRecord>): Promise<IMarketingProjectRecord> { throw new Error('Not implemented'); }
  async updateMarketingProjectRecord(_projectCode: string, _data: Partial<IMarketingProjectRecord>): Promise<IMarketingProjectRecord> { throw new Error('Not implemented'); }
  async getAllMarketingProjectRecords(): Promise<IMarketingProjectRecord[]> { return []; }

  // --- Risk & Cost ---
  async getRiskCostManagement(_projectCode: string): Promise<IRiskCostManagement | null> { return null; }
  async updateRiskCostManagement(_projectCode: string, _data: Partial<IRiskCostManagement>): Promise<IRiskCostManagement> { throw new Error('Not implemented'); }
  async addRiskCostItem(_projectCode: string, _item: Partial<IRiskCostItem>): Promise<IRiskCostItem> { throw new Error('Not implemented'); }
  async updateRiskCostItem(_projectCode: string, _itemId: number, _data: Partial<IRiskCostItem>): Promise<IRiskCostItem> { throw new Error('Not implemented'); }

  // --- Quality Concerns ---
  async getQualityConcerns(_projectCode: string): Promise<IQualityConcern[]> { return []; }
  async addQualityConcern(_projectCode: string, _concern: Partial<IQualityConcern>): Promise<IQualityConcern> { throw new Error('Not implemented'); }
  async updateQualityConcern(_projectCode: string, _concernId: number, _data: Partial<IQualityConcern>): Promise<IQualityConcern> { throw new Error('Not implemented'); }

  // --- Safety Concerns ---
  async getSafetyConcerns(_projectCode: string): Promise<ISafetyConcern[]> { return []; }
  async addSafetyConcern(_projectCode: string, _concern: Partial<ISafetyConcern>): Promise<ISafetyConcern> { throw new Error('Not implemented'); }
  async updateSafetyConcern(_projectCode: string, _concernId: number, _data: Partial<ISafetyConcern>): Promise<ISafetyConcern> { throw new Error('Not implemented'); }

  // --- Schedule & Critical Path ---
  async getProjectSchedule(_projectCode: string): Promise<IProjectScheduleCriticalPath | null> { return null; }
  async updateProjectSchedule(_projectCode: string, _data: Partial<IProjectScheduleCriticalPath>): Promise<IProjectScheduleCriticalPath> { throw new Error('Not implemented'); }
  async addCriticalPathItem(_projectCode: string, _item: Partial<ICriticalPathItem>): Promise<ICriticalPathItem> { throw new Error('Not implemented'); }

  // --- Superintendent Plan ---
  async getSuperintendentPlan(_projectCode: string): Promise<ISuperintendentPlan | null> { return null; }
  async updateSuperintendentPlanSection(_projectCode: string, _sectionId: number, _data: Partial<ISuperintendentPlanSection>): Promise<ISuperintendentPlanSection> { throw new Error('Not implemented'); }
  async createSuperintendentPlan(_projectCode: string, _data: Partial<ISuperintendentPlan>): Promise<ISuperintendentPlan> { throw new Error('Not implemented'); }

  // --- Lessons Learned ---
  async getLessonsLearned(_projectCode: string): Promise<ILessonLearned[]> { return []; }
  async addLessonLearned(_projectCode: string, _lesson: Partial<ILessonLearned>): Promise<ILessonLearned> { throw new Error('Not implemented'); }
  async updateLessonLearned(_projectCode: string, _lessonId: number, _data: Partial<ILessonLearned>): Promise<ILessonLearned> { throw new Error('Not implemented'); }

  // --- Project Management Plan ---
  async getProjectManagementPlan(_projectCode: string): Promise<IProjectManagementPlan | null> { return null; }
  async updateProjectManagementPlan(_projectCode: string, _data: Partial<IProjectManagementPlan>): Promise<IProjectManagementPlan> { throw new Error('Not implemented'); }
  async submitPMPForApproval(_projectCode: string, _submittedBy: string): Promise<IProjectManagementPlan> { throw new Error('Not implemented'); }
  async respondToPMPApproval(_projectCode: string, _stepId: number, _approved: boolean, _comment: string): Promise<IProjectManagementPlan> { throw new Error('Not implemented'); }
  async signPMP(_projectCode: string, _signatureId: number, _comment: string): Promise<IProjectManagementPlan> { throw new Error('Not implemented'); }
  async getDivisionApprovers(): Promise<IDivisionApprover[]> { return []; }
  async getPMPBoilerplate(): Promise<IPMPBoilerplateSection[]> { return []; }

  // --- Monthly Review ---
  async getMonthlyReviews(_projectCode: string): Promise<IMonthlyProjectReview[]> { return []; }
  async getMonthlyReview(_reviewId: number): Promise<IMonthlyProjectReview | null> { return null; }
  async updateMonthlyReview(_reviewId: number, _data: Partial<IMonthlyProjectReview>): Promise<IMonthlyProjectReview> { throw new Error('Not implemented'); }
  async createMonthlyReview(_data: Partial<IMonthlyProjectReview>): Promise<IMonthlyProjectReview> { throw new Error('Not implemented'); }

  // --- Estimating Kick-Off ---
  async getEstimatingKickoff(_projectCode: string): Promise<IEstimatingKickoff | null> { return null; }
  async getEstimatingKickoffByLeadId(_leadId: number): Promise<IEstimatingKickoff | null> { return null; }
  async createEstimatingKickoff(_data: Partial<IEstimatingKickoff>): Promise<IEstimatingKickoff> { throw new Error('Not implemented'); }
  async updateEstimatingKickoff(_id: number, _data: Partial<IEstimatingKickoff>): Promise<IEstimatingKickoff> { throw new Error('Not implemented'); }
  async updateKickoffItem(_kickoffId: number, _itemId: number, _data: Partial<IEstimatingKickoffItem>): Promise<IEstimatingKickoffItem> { throw new Error('Not implemented'); }
  async addKickoffItem(_kickoffId: number, _item: Partial<IEstimatingKickoffItem>): Promise<IEstimatingKickoffItem> { throw new Error('Not implemented'); }
  async removeKickoffItem(_kickoffId: number, _itemId: number): Promise<void> { throw new Error('Not implemented'); }
  async updateKickoffKeyPersonnel(_kickoffId: number, _personnel: import('../models/IEstimatingKickoff').IKeyPersonnelEntry[]): Promise<import('../models/IEstimatingKickoff').IEstimatingKickoff> { throw new Error('Not implemented'); }

  // --- Job Number Requests ---
  async getJobNumberRequests(_status?: JobNumberRequestStatus): Promise<IJobNumberRequest[]> { return []; }
  async getJobNumberRequestByLeadId(_leadId: number): Promise<IJobNumberRequest | null> { return null; }
  async createJobNumberRequest(_data: Partial<IJobNumberRequest>): Promise<IJobNumberRequest> { throw new Error('Not implemented'); }
  async finalizeJobNumber(_requestId: number, _jobNumber: string, _assignedBy: string): Promise<IJobNumberRequest> { throw new Error('Not implemented'); }

  // --- Reference Data ---
  async getProjectTypes(): Promise<IProjectType[]> { return []; }
  async getStandardCostCodes(): Promise<IStandardCostCode[]> { return []; }

  // --- Buyout Log ---

  async getBuyoutEntries(projectCode: string): Promise<IBuyoutEntry[]> {
    const items = await this.sp.web.lists
      .getByTitle(LIST_NAMES.BUYOUT_LOG)
      .items
      .filter(`ProjectCode eq '${projectCode}'`)
      .orderBy('Title', true)();
    return items.map((item: Record<string, unknown>) => this.mapToBuyoutEntry(item));
  }

  async initializeBuyoutLog(projectCode: string): Promise<IBuyoutEntry[]> {
    const existing = await this.getBuyoutEntries(projectCode);
    if (existing.length > 0) return existing;

    const batch = this.sp.web.createBatch();
    const list = this.sp.web.lists.getByTitle(LIST_NAMES.BUYOUT_LOG);

    for (const division of STANDARD_BUYOUT_DIVISIONS) {
      list.items.inBatch(batch).add({
        Title: division.divisionCode,
        ProjectCode: projectCode,
        DivisionDescription: division.divisionDescription,
        IsStandard: true,
        OriginalBudget: 0,
        EstimatedTax: 0,
        TotalBudget: 0,
        EnrolledInSDI: false,
        BondRequired: false,
        Status: 'Not Started',
      });
    }

    await batch.execute();
    return this.getBuyoutEntries(projectCode);
  }

  async addBuyoutEntry(projectCode: string, entry: Partial<IBuyoutEntry>): Promise<IBuyoutEntry> {
    const totalBudget = (entry.originalBudget || 0) + (entry.estimatedTax || 0);
    const overUnder = entry.contractValue != null ? totalBudget - entry.contractValue : undefined;

    const result = await this.sp.web.lists
      .getByTitle(LIST_NAMES.BUYOUT_LOG)
      .items
      .add({
        Title: entry.divisionCode,
        ProjectCode: projectCode,
        DivisionDescription: entry.divisionDescription,
        IsStandard: entry.isStandard ?? false,
        OriginalBudget: entry.originalBudget || 0,
        EstimatedTax: entry.estimatedTax || 0,
        TotalBudget: totalBudget,
        SubcontractorName: entry.subcontractorName,
        ContractValue: entry.contractValue,
        OverUnder: overUnder,
        EnrolledInSDI: entry.enrolledInSDI ?? false,
        BondRequired: entry.bondRequired ?? false,
        LOISentDate: entry.loiSentDate,
        LOIReturnedDate: entry.loiReturnedDate,
        ContractSentDate: entry.contractSentDate,
        ContractExecutedDate: entry.contractExecutedDate,
        InsuranceCOIReceivedDate: entry.insuranceCOIReceivedDate,
        Status: entry.status || 'Not Started',
        Notes: entry.notes,
      });

    return this.mapToBuyoutEntry(result.data);
  }

  async updateBuyoutEntry(projectCode: string, entryId: number, data: Partial<IBuyoutEntry>): Promise<IBuyoutEntry> {
    const current = await this.sp.web.lists
      .getByTitle(LIST_NAMES.BUYOUT_LOG)
      .items
      .getById(entryId)();

    const originalBudget = data.originalBudget ?? current.OriginalBudget ?? 0;
    const estimatedTax = data.estimatedTax ?? current.EstimatedTax ?? 0;
    const totalBudget = originalBudget + estimatedTax;
    const contractValue = data.contractValue ?? current.ContractValue;
    const overUnder = contractValue != null ? totalBudget - contractValue : undefined;

    const updateData: Record<string, unknown> = {};

    if (data.divisionCode !== undefined) updateData.Title = data.divisionCode;
    if (data.divisionDescription !== undefined) updateData.DivisionDescription = data.divisionDescription;
    if (data.originalBudget !== undefined) updateData.OriginalBudget = data.originalBudget;
    if (data.estimatedTax !== undefined) updateData.EstimatedTax = data.estimatedTax;
    if (data.subcontractorName !== undefined) updateData.SubcontractorName = data.subcontractorName;
    if (data.contractValue !== undefined) updateData.ContractValue = data.contractValue;
    if (data.enrolledInSDI !== undefined) updateData.EnrolledInSDI = data.enrolledInSDI;
    if (data.bondRequired !== undefined) updateData.BondRequired = data.bondRequired;
    if (data.loiSentDate !== undefined) updateData.LOISentDate = data.loiSentDate;
    if (data.loiReturnedDate !== undefined) updateData.LOIReturnedDate = data.loiReturnedDate;
    if (data.contractSentDate !== undefined) updateData.ContractSentDate = data.contractSentDate;
    if (data.contractExecutedDate !== undefined) updateData.ContractExecutedDate = data.contractExecutedDate;
    if (data.insuranceCOIReceivedDate !== undefined) updateData.InsuranceCOIReceivedDate = data.insuranceCOIReceivedDate;
    if (data.status !== undefined) updateData.Status = data.status;
    if (data.notes !== undefined) updateData.Notes = data.notes;
    if (data.compiledCommitmentPdfUrl !== undefined) updateData.CompiledCommitmentPdfUrl = data.compiledCommitmentPdfUrl;
    if (data.compiledCommitmentFileId !== undefined) updateData.CompiledCommitmentFileId = data.compiledCommitmentFileId;
    if (data.compiledCommitmentFileName !== undefined) updateData.CompiledCommitmentFileName = data.compiledCommitmentFileName;
    if (data.eVerifyContractNumber !== undefined) updateData.EVerifyContractNumber = data.eVerifyContractNumber;
    if (data.eVerifySentDate !== undefined) updateData.EVerifySentDate = data.eVerifySentDate;
    if (data.eVerifyReminderDate !== undefined) updateData.EVerifyReminderDate = data.eVerifyReminderDate;
    if (data.eVerifyReceivedDate !== undefined) updateData.EVerifyReceivedDate = data.eVerifyReceivedDate;
    if (data.eVerifyStatus !== undefined) updateData.EVerifyStatus = data.eVerifyStatus;

    updateData.TotalBudget = totalBudget;
    if (overUnder !== undefined) updateData.OverUnder = overUnder;

    await this.sp.web.lists
      .getByTitle(LIST_NAMES.BUYOUT_LOG)
      .items
      .getById(entryId)
      .update(updateData);

    const updated = await this.sp.web.lists
      .getByTitle(LIST_NAMES.BUYOUT_LOG)
      .items
      .getById(entryId)();

    return this.mapToBuyoutEntry(updated);
  }

  async removeBuyoutEntry(_projectCode: string, entryId: number): Promise<void> {
    await this.sp.web.lists
      .getByTitle(LIST_NAMES.BUYOUT_LOG)
      .items
      .getById(entryId)
      .delete();
  }

  private mapToBuyoutEntry(item: Record<string, unknown>): IBuyoutEntry {
    return {
      id: item.Id as number,
      projectCode: item.ProjectCode as string,
      divisionCode: item.Title as string,
      divisionDescription: item.DivisionDescription as string,
      isStandard: item.IsStandard as boolean,
      originalBudget: (item.OriginalBudget as number) || 0,
      estimatedTax: (item.EstimatedTax as number) || 0,
      totalBudget: (item.TotalBudget as number) || 0,
      subcontractorName: item.SubcontractorName as string | undefined,
      contractValue: item.ContractValue as number | undefined,
      overUnder: item.OverUnder as number | undefined,
      enrolledInSDI: (item.EnrolledInSDI as boolean) || false,
      bondRequired: (item.BondRequired as boolean) || false,
      qScore: item.QScore as number | undefined,
      compassPreQualStatus: item.CompassPreQualStatus as IBuyoutEntry['compassPreQualStatus'],
      scopeMatchesBudget: item.ScopeMatchesBudget as boolean | undefined,
      exhibitCInsuranceConfirmed: item.ExhibitCInsuranceConfirmed as boolean | undefined,
      exhibitDScheduleConfirmed: item.ExhibitDScheduleConfirmed as boolean | undefined,
      exhibitESafetyConfirmed: item.ExhibitESafetyConfirmed as boolean | undefined,
      commitmentStatus: (item.CommitmentStatus as CommitmentStatus) || 'Budgeted',
      waiverRequired: (item.WaiverRequired as boolean) || false,
      waiverType: item.WaiverType as WaiverType | undefined,
      waiverReason: item.WaiverReason as string | undefined,
      compiledCommitmentPdfUrl: item.CompiledCommitmentPdfUrl as string | undefined,
      compiledCommitmentFileId: item.CompiledCommitmentFileId as string | undefined,
      compiledCommitmentFileName: item.CompiledCommitmentFileName as string | undefined,
      eVerifyContractNumber: item.EVerifyContractNumber as string | undefined,
      eVerifySentDate: item.EVerifySentDate as string | undefined,
      eVerifyReminderDate: item.EVerifyReminderDate as string | undefined,
      eVerifyReceivedDate: item.EVerifyReceivedDate as string | undefined,
      eVerifyStatus: (item.EVerifyStatus as EVerifyStatus) || undefined,
      currentApprovalStep: item.CurrentApprovalStep as ApprovalStep | undefined,
      approvalHistory: [],
      loiSentDate: item.LOISentDate as string | undefined,
      loiReturnedDate: item.LOIReturnedDate as string | undefined,
      contractSentDate: item.ContractSentDate as string | undefined,
      contractExecutedDate: item.ContractExecutedDate as string | undefined,
      insuranceCOIReceivedDate: item.InsuranceCOIReceivedDate as string | undefined,
      status: item.Status as BuyoutStatus,
      notes: item.Notes as string | undefined,
      createdDate: item.Created as string,
      modifiedDate: item.Modified as string,
    };
  }

  // --- Commitment Approval ---

  async submitCommitmentForApproval(projectCode: string, entryId: number, _submittedBy: string): Promise<IBuyoutEntry> {
    const entry = (await this.getBuyoutEntries(projectCode)).find(e => e.id === entryId);
    if (!entry) throw new Error(`Buyout entry ${entryId} not found`);

    const { evaluateCommitmentRisk, determineWaiverType } = await import('../utils/riskEngine');
    const risk = evaluateCommitmentRisk(entry);
    const waiverType = risk.requiresWaiver ? determineWaiverType(entry) : undefined;

    await this.sp.web.lists
      .getByTitle(LIST_NAMES.BUYOUT_LOG)
      .items
      .getById(entryId)
      .update({
        CommitmentStatus: risk.requiresWaiver ? 'WaiverPending' : 'PendingReview',
        WaiverRequired: risk.requiresWaiver,
        WaiverType: waiverType,
        CurrentApprovalStep: 'PX',
      });

    // Create approval record
    await this.sp.web.lists
      .getByTitle(LIST_NAMES.COMMITMENT_APPROVALS)
      .items
      .add({
        BuyoutEntryId: entryId,
        ProjectCode: projectCode,
        Step: 'PX',
        ApproverName: 'Project Executive',
        ApproverEmail: '',
        Status: 'Pending',
        WaiverType: waiverType,
      });

    return (await this.getBuyoutEntries(projectCode)).find(e => e.id === entryId) as IBuyoutEntry;
  }

  async respondToCommitmentApproval(projectCode: string, entryId: number, approved: boolean, comment: string, escalate?: boolean): Promise<IBuyoutEntry> {
    const approvals = await this.getCommitmentApprovalHistory(projectCode, entryId);
    const pending = approvals.find(a => a.status === 'Pending');
    if (!pending) throw new Error('No pending approval step found');

    const entry = (await this.getBuyoutEntries(projectCode)).find(e => e.id === entryId);
    if (!entry) throw new Error(`Buyout entry ${entryId} not found`);

    // Update the pending approval record
    await this.sp.web.lists
      .getByTitle(LIST_NAMES.COMMITMENT_APPROVALS)
      .items
      .getById(pending.id)
      .update({
        Status: !approved ? 'Rejected' : escalate ? 'Escalated' : 'Approved',
        Comment: comment,
        ActionDate: new Date().toISOString(),
      });

    let newStatus: CommitmentStatus;
    let nextStep: ApprovalStep | undefined;

    if (!approved) {
      newStatus = 'Rejected';
      nextStep = undefined;
    } else if (escalate && pending.step === 'ComplianceManager') {
      newStatus = 'CFOReview';
      nextStep = 'CFO';
      await this.sp.web.lists.getByTitle(LIST_NAMES.COMMITMENT_APPROVALS).items.add({
        BuyoutEntryId: entryId, ProjectCode: projectCode, Step: 'CFO',
        ApproverName: 'CFO', ApproverEmail: '', Status: 'Pending', WaiverType: entry.waiverType,
      });
    } else if (pending.step === 'PX' && entry.waiverRequired && (entry.contractValue ?? 0) >= 250000) {
      newStatus = 'ComplianceReview';
      nextStep = 'ComplianceManager';
      await this.sp.web.lists.getByTitle(LIST_NAMES.COMMITMENT_APPROVALS).items.add({
        BuyoutEntryId: entryId, ProjectCode: projectCode, Step: 'ComplianceManager',
        ApproverName: 'Compliance Manager', ApproverEmail: '', Status: 'Pending', WaiverType: entry.waiverType,
      });
    } else {
      newStatus = 'Committed';
      nextStep = undefined;
    }

    const updateData: Record<string, unknown> = {
      CommitmentStatus: newStatus,
      CurrentApprovalStep: nextStep ?? null,
    };
    if (newStatus === 'Committed') updateData.Status = 'Executed';

    await this.sp.web.lists.getByTitle(LIST_NAMES.BUYOUT_LOG).items.getById(entryId).update(updateData);
    return (await this.getBuyoutEntries(projectCode)).find(e => e.id === entryId) as IBuyoutEntry;
  }

  async getCommitmentApprovalHistory(projectCode: string, entryId: number): Promise<ICommitmentApproval[]> {
    const items = await this.sp.web.lists
      .getByTitle(LIST_NAMES.COMMITMENT_APPROVALS)
      .items
      .filter(`ProjectCode eq '${projectCode}' and BuyoutEntryId eq ${entryId}`)
      .orderBy('Id', true)();

    return items.map((item: Record<string, unknown>) => ({
      id: item.Id as number,
      buyoutEntryId: item.BuyoutEntryId as number,
      projectCode: item.ProjectCode as string,
      step: item.Step as ApprovalStep,
      approverName: item.ApproverName as string,
      approverEmail: item.ApproverEmail as string,
      status: item.Status as ICommitmentApproval['status'],
      comment: item.Comment as string | undefined,
      actionDate: item.ActionDate as string | undefined,
      waiverType: item.WaiverType as WaiverType | undefined,
    }));
  }

  // --- File Upload ---
  async uploadCommitmentDocument(projectCode: string, entryId: number, file: File): Promise<{ fileId: string; fileName: string; fileUrl: string }> {
    const folderPath = `Shared Documents/Commitments`;

    // Ensure folder exists
    try {
      await this.sp.web.getFolderByServerRelativePath(folderPath).select('Exists')();
    } catch {
      await this.sp.web.folders.addUsingPath(folderPath);
    }

    const fileName = `${projectCode}_${entryId}_${file.name}`;
    const result = await this.sp.web
      .getFolderByServerRelativePath(folderPath)
      .files.addUsingPath(fileName, file, { Overwrite: true });

    const fileUrl = (result.data as Record<string, unknown>).ServerRelativeUrl as string;
    const fileId = (result.data as Record<string, unknown>).UniqueId as string || `file-${Date.now()}`;

    // Update the buyout entry with file reference
    await this.sp.web.lists
      .getByTitle(LIST_NAMES.BUYOUT_LOG)
      .items
      .getById(entryId)
      .update({
        CompiledCommitmentPdfUrl: fileUrl,
        CompiledCommitmentFileId: fileId,
        CompiledCommitmentFileName: fileName,
      });

    return { fileId, fileName, fileUrl };
  }

  // --- Compliance Log ---
  async getComplianceLog(filters?: IComplianceLogFilter): Promise<IComplianceEntry[]> {
    // Fetch all buyout entries that have a subcontractor assigned (active commitments)
    let filterStr = `SubcontractorName ne null`;
    if (filters?.projectCode) {
      filterStr += ` and ProjectCode eq '${filters.projectCode}'`;
    }
    if (filters?.commitmentStatus) {
      filterStr += ` and CommitmentStatus eq '${filters.commitmentStatus}'`;
    }
    if (filters?.eVerifyStatus) {
      filterStr += ` and EVerifyStatus eq '${filters.eVerifyStatus}'`;
    }

    const items = await this.sp.web.lists
      .getByTitle(LIST_NAMES.BUYOUT_LOG)
      .items
      .filter(filterStr)
      .orderBy('ProjectCode', true)
      .top(500)();

    let entries: IComplianceEntry[] = items.map((item: Record<string, unknown>) => {
      const buyout = this.mapToBuyoutEntry(item);
      return this.mapToComplianceEntry(buyout);
    });

    // Apply search filter in-memory
    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      entries = entries.filter((e: IComplianceEntry) =>
        e.subcontractorName.toLowerCase().includes(q) ||
        e.projectCode.toLowerCase().includes(q) ||
        e.divisionDescription.toLowerCase().includes(q)
      );
    }

    return entries;
  }

  async getComplianceSummary(): Promise<IComplianceSummary> {
    const entries = await this.getComplianceLog();

    return {
      totalCommitments: entries.length,
      fullyCompliant: entries.filter(e => e.overallCompliant).length,
      eVerifyPending: entries.filter(e => e.eVerifyStatus === 'Sent' || e.eVerifyStatus === 'Reminder Sent' || e.eVerifyStatus === 'Not Sent').length,
      eVerifyOverdue: entries.filter(e => e.eVerifyStatus === 'Overdue').length,
      waiversPending: entries.filter(e => e.commitmentStatus === 'WaiverPending').length,
      documentsMissing: entries.filter(e => !e.documentsCompliant).length,
    };
  }

  private mapToComplianceEntry(entry: IBuyoutEntry): IComplianceEntry {
    const riskCompliant = (entry.qScore != null && entry.qScore >= 70) &&
      (entry.compassPreQualStatus === 'Approved');

    const documentsCompliant =
      (entry.scopeMatchesBudget === true) &&
      (entry.exhibitCInsuranceConfirmed === true) &&
      (entry.exhibitDScheduleConfirmed === true) &&
      (entry.exhibitESafetyConfirmed === true);

    const hasDoc = !!(entry.compiledCommitmentPdfUrl || entry.compiledCommitmentFileId);

    const insuranceCompliant = entry.enrolledInSDI && !!entry.insuranceCOIReceivedDate;

    const eVerifyCompliant = entry.eVerifyStatus === 'Received';

    const overallCompliant = riskCompliant && documentsCompliant && hasDoc && insuranceCompliant && eVerifyCompliant;

    return {
      id: entry.id,
      projectCode: entry.projectCode,
      projectName: entry.projectCode, // Will be enriched by project lookup if available
      divisionCode: entry.divisionCode,
      divisionDescription: entry.divisionDescription,
      subcontractorName: entry.subcontractorName || '',
      contractValue: entry.contractValue || 0,
      riskCompliant,
      qScore: entry.qScore,
      compassStatus: entry.compassPreQualStatus,
      documentsCompliant,
      scopeMatch: entry.scopeMatchesBudget === true,
      exhibitC: entry.exhibitCInsuranceConfirmed === true,
      exhibitD: entry.exhibitDScheduleConfirmed === true,
      exhibitE: entry.exhibitESafetyConfirmed === true,
      hasCommitmentDocument: hasDoc,
      insuranceCompliant,
      sdiEnrolled: entry.enrolledInSDI,
      bondRequired: entry.bondRequired,
      coiReceived: !!entry.insuranceCOIReceivedDate,
      eVerifyCompliant,
      eVerifyStatus: entry.eVerifyStatus || 'Not Sent',
      eVerifyContractNumber: entry.eVerifyContractNumber,
      eVerifySentDate: entry.eVerifySentDate,
      eVerifyReminderDate: entry.eVerifyReminderDate,
      eVerifyReceivedDate: entry.eVerifyReceivedDate,
      commitmentStatus: entry.commitmentStatus,
      overallCompliant,
    };
  }

  // --- Re-Key ---
  async rekeyProjectCode(_oldCode: string, _newCode: string, _leadId: number): Promise<void> { throw new Error('Not implemented'); }

  // --- Active Projects Portfolio ---

  async getActiveProjects(options?: IActiveProjectsQueryOptions): Promise<IActiveProject[]> {
    let filterParts: string[] = [];

    if (options?.status) {
      filterParts.push(`Status eq '${options.status}'`);
    }
    if (options?.sector) {
      filterParts.push(`Sector eq '${options.sector}'`);
    }
    if (options?.projectExecutive) {
      filterParts.push(`ProjectExecutive eq '${options.projectExecutive}'`);
    }
    if (options?.projectManager) {
      filterParts.push(`LeadPM eq '${options.projectManager}'`);
    }
    if (options?.region) {
      filterParts.push(`Region eq '${options.region}'`);
    }

    let query = this.sp.web.lists
      .getByTitle(LIST_NAMES.ACTIVE_PROJECTS_PORTFOLIO)
      .items
      .top(options?.top || 500);

    if (filterParts.length > 0) {
      query = query.filter(filterParts.join(' and '));
    }

    if (options?.orderBy) {
      query = query.orderBy(options.orderBy, options.orderAscending !== false);
    }

    const items = await query();
    return items.map((item: Record<string, unknown>) => this.mapToActiveProject(item));
  }

  async getActiveProjectById(id: number): Promise<IActiveProject | null> {
    try {
      const item = await this.sp.web.lists
        .getByTitle(LIST_NAMES.ACTIVE_PROJECTS_PORTFOLIO)
        .items
        .getById(id)();
      return this.mapToActiveProject(item);
    } catch {
      return null;
    }
  }

  async syncActiveProject(projectCode: string): Promise<IActiveProject> {
    // Find the project in the portfolio list
    const items = await this.sp.web.lists
      .getByTitle(LIST_NAMES.ACTIVE_PROJECTS_PORTFOLIO)
      .items
      .filter(`ProjectCode eq '${projectCode}'`)();

    if (items.length === 0) {
      throw new Error(`Project ${projectCode} not found in portfolio`);
    }

    const projectId = items[0].Id;

    // Update last sync date
    await this.sp.web.lists
      .getByTitle(LIST_NAMES.ACTIVE_PROJECTS_PORTFOLIO)
      .items
      .getById(projectId)
      .update({ LastSyncDate: new Date().toISOString() });

    const updated = await this.sp.web.lists
      .getByTitle(LIST_NAMES.ACTIVE_PROJECTS_PORTFOLIO)
      .items
      .getById(projectId)();

    return this.mapToActiveProject(updated);
  }

  async updateActiveProject(id: number, data: Partial<IActiveProject>): Promise<IActiveProject> {
    const updateData: Record<string, unknown> = {};

    if (data.projectName !== undefined) updateData.Title = data.projectName;
    if (data.status !== undefined) updateData.Status = data.status;
    if (data.sector !== undefined) updateData.Sector = data.sector;
    if (data.region !== undefined) updateData.Region = data.region;
    if (data.statusComments !== undefined) updateData.StatusComments = data.statusComments;

    // Personnel
    if (data.personnel) {
      if (data.personnel.projectExecutive !== undefined) updateData.ProjectExecutive = data.personnel.projectExecutive;
      if (data.personnel.leadPM !== undefined) updateData.LeadPM = data.personnel.leadPM;
      if (data.personnel.additionalPM !== undefined) updateData.AdditionalPM = data.personnel.additionalPM;
      if (data.personnel.assistantPM !== undefined) updateData.AssistantPM = data.personnel.assistantPM;
      if (data.personnel.projectAccountant !== undefined) updateData.ProjectAccountant = data.personnel.projectAccountant;
      if (data.personnel.leadSuper !== undefined) updateData.LeadSuper = data.personnel.leadSuper;
    }

    // Financials
    if (data.financials) {
      if (data.financials.originalContract !== undefined) updateData.OriginalContract = data.financials.originalContract;
      if (data.financials.changeOrders !== undefined) updateData.ChangeOrders = data.financials.changeOrders;
      if (data.financials.currentContractValue !== undefined) updateData.CurrentContractValue = data.financials.currentContractValue;
      if (data.financials.billingsToDate !== undefined) updateData.BillingsToDate = data.financials.billingsToDate;
      if (data.financials.unbilled !== undefined) updateData.Unbilled = data.financials.unbilled;
      if (data.financials.projectedFee !== undefined) updateData.ProjectedFee = data.financials.projectedFee;
      if (data.financials.projectedFeePct !== undefined) updateData.ProjectedFeePct = data.financials.projectedFeePct;
    }

    // Schedule
    if (data.schedule) {
      if (data.schedule.startDate !== undefined) updateData.StartDate = data.schedule.startDate;
      if (data.schedule.substantialCompletionDate !== undefined) updateData.SubstantialCompletionDate = data.schedule.substantialCompletionDate;
      if (data.schedule.currentPhase !== undefined) updateData.CurrentPhase = data.schedule.currentPhase;
      if (data.schedule.percentComplete !== undefined) updateData.PercentComplete = data.schedule.percentComplete;
    }

    updateData.LastModified = new Date().toISOString();

    await this.sp.web.lists
      .getByTitle(LIST_NAMES.ACTIVE_PROJECTS_PORTFOLIO)
      .items
      .getById(id)
      .update(updateData);

    const updated = await this.sp.web.lists
      .getByTitle(LIST_NAMES.ACTIVE_PROJECTS_PORTFOLIO)
      .items
      .getById(id)();

    return this.mapToActiveProject(updated);
  }

  async getPortfolioSummary(filters?: IActiveProjectsFilter): Promise<IPortfolioSummary> {
    const projects = await this.getActiveProjects(filters as IActiveProjectsQueryOptions);

    const totalBacklog = projects.reduce((sum, p) => sum + (p.financials.remainingValue || 0), 0);
    const totalOriginalContract = projects.reduce((sum, p) => sum + (p.financials.originalContract || 0), 0);
    const totalBillingsToDate = projects.reduce((sum, p) => sum + (p.financials.billingsToDate || 0), 0);
    const totalUnbilled = projects.reduce((sum, p) => sum + (p.financials.unbilled || 0), 0);

    const projectsWithFee = projects.filter(p => p.financials.projectedFeePct != null);
    const averageFeePct = projectsWithFee.length > 0
      ? projectsWithFee.reduce((sum, p) => sum + (p.financials.projectedFeePct || 0), 0) / projectsWithFee.length
      : 0;

    const monthlyBurnRate = totalBillingsToDate / 12;

    const projectsByStatus: Record<ProjectStatus, number> = {
      'Precon': projects.filter(p => p.status === 'Precon').length,
      'Construction': projects.filter(p => p.status === 'Construction').length,
      'Final Payment': projects.filter(p => p.status === 'Final Payment').length,
    };

    const projectsBySector: Record<SectorType, number> = {
      'Commercial': projects.filter(p => p.sector === 'Commercial').length,
      'Residential': projects.filter(p => p.sector === 'Residential').length,
    };

    const projectsWithAlerts = projects.filter(
      p => p.hasUnbilledAlert || p.hasScheduleAlert || p.hasFeeErosionAlert
    ).length;

    return {
      totalBacklog,
      totalOriginalContract,
      totalBillingsToDate,
      totalUnbilled,
      averageFeePct,
      monthlyBurnRate,
      projectCount: projects.length,
      projectsByStatus,
      projectsBySector,
      projectsWithAlerts,
    };
  }

  async getPersonnelWorkload(role?: 'PX' | 'PM' | 'Super'): Promise<IPersonnelWorkload[]> {
    const projects = await this.getActiveProjects();
    const workloadMap = new Map<string, IPersonnelWorkload>();

    for (const project of projects) {
      if ((!role || role === 'PX') && project.personnel.projectExecutive) {
        const name = project.personnel.projectExecutive;
        const existing = workloadMap.get(`PX-${name}`) || {
          name,
          email: project.personnel.projectExecutiveEmail,
          role: 'PX' as const,
          projectCount: 0,
          totalContractValue: 0,
          projects: [],
        };
        existing.projectCount++;
        existing.totalContractValue += project.financials.currentContractValue || project.financials.originalContract || 0;
        existing.projects.push(project);
        workloadMap.set(`PX-${name}`, existing);
      }

      if ((!role || role === 'PM') && project.personnel.leadPM) {
        const name = project.personnel.leadPM;
        const existing = workloadMap.get(`PM-${name}`) || {
          name,
          email: project.personnel.leadPMEmail,
          role: 'PM' as const,
          projectCount: 0,
          totalContractValue: 0,
          projects: [],
        };
        existing.projectCount++;
        existing.totalContractValue += project.financials.currentContractValue || project.financials.originalContract || 0;
        existing.projects.push(project);
        workloadMap.set(`PM-${name}`, existing);
      }

      if ((!role || role === 'Super') && project.personnel.leadSuper) {
        const name = project.personnel.leadSuper;
        const existing = workloadMap.get(`Super-${name}`) || {
          name,
          role: 'Super' as const,
          projectCount: 0,
          totalContractValue: 0,
          projects: [],
        };
        existing.projectCount++;
        existing.totalContractValue += project.financials.currentContractValue || project.financials.originalContract || 0;
        existing.projects.push(project);
        workloadMap.set(`Super-${name}`, existing);
      }
    }

    return Array.from(workloadMap.values()).sort((a, b) => b.projectCount - a.projectCount);
  }

  async triggerPortfolioSync(): Promise<void> {
    // In a real implementation, this would trigger a Power Automate flow
    // or Azure Function to aggregate data from all project sites
    const now = new Date().toISOString();
    const items = await this.sp.web.lists
      .getByTitle(LIST_NAMES.ACTIVE_PROJECTS_PORTFOLIO)
      .items
      .select('Id')();

    // Batch update all projects' LastSyncDate
    const batch = this.sp.web.createBatch();
    for (const item of items) {
      this.sp.web.lists
        .getByTitle(LIST_NAMES.ACTIVE_PROJECTS_PORTFOLIO)
        .items
        .getById(item.Id)
        .inBatch(batch)
        .update({ LastSyncDate: now });
    }
    await batch.execute();
  }

  private mapToActiveProject(item: Record<string, unknown>): IActiveProject {
    const currentContractValue = (item.CurrentContractValue as number) || (item.OriginalContract as number) || 0;
    const unbilled = (item.Unbilled as number) || 0;
    const unbilledPct = currentContractValue > 0 ? (unbilled / currentContractValue) * 100 : 0;

    return {
      id: item.Id as number,
      jobNumber: item.JobNumber as string,
      projectCode: item.ProjectCode as string,
      projectName: item.Title as string,
      status: item.Status as ProjectStatus,
      sector: item.Sector as SectorType,
      region: item.Region as string,
      personnel: {
        projectExecutive: item.ProjectExecutive as string,
        projectExecutiveEmail: item.ProjectExecutiveEmail as string,
        leadPM: item.LeadPM as string,
        leadPMEmail: item.LeadPMEmail as string,
        additionalPM: item.AdditionalPM as string,
        assistantPM: item.AssistantPM as string,
        projectAccountant: item.ProjectAccountant as string,
        projectAssistant: item.ProjectAssistant as string,
        leadSuper: item.LeadSuper as string,
        superintendent: item.Superintendent as string,
        assistantSuper: item.AssistantSuper as string,
      },
      financials: {
        originalContract: item.OriginalContract as number,
        changeOrders: item.ChangeOrders as number,
        currentContractValue: currentContractValue,
        billingsToDate: item.BillingsToDate as number,
        unbilled: unbilled,
        projectedFee: item.ProjectedFee as number,
        projectedFeePct: item.ProjectedFeePct as number,
        projectedCost: item.ProjectedCost as number,
        remainingValue: item.RemainingValue as number,
      },
      schedule: {
        startDate: item.StartDate as string,
        substantialCompletionDate: item.SubstantialCompletionDate as string,
        nocExpiration: item.NOCExpiration as string,
        currentPhase: item.CurrentPhase as string,
        percentComplete: item.PercentComplete as number,
      },
      riskMetrics: {
        averageQScore: item.AverageQScore as number,
        openWaiverCount: item.OpenWaiverCount as number,
        pendingCommitments: item.PendingCommitments as number,
        complianceStatus: item.ComplianceStatus as 'Green' | 'Yellow' | 'Red',
      },
      statusComments: item.StatusComments as string,
      projectSiteUrl: item.ProjectSiteUrl as string,
      lastSyncDate: item.LastSyncDate as string,
      lastModified: item.Modified as string,
      hasUnbilledAlert: unbilledPct >= DEFAULT_ALERT_THRESHOLDS.unbilledWarningPct,
      hasScheduleAlert: item.HasScheduleAlert as boolean,
      hasFeeErosionAlert: item.HasFeeErosionAlert as boolean,
    };
  }

  // --- Data Integrity ---
  async syncDenormalizedFields(_leadId: number): Promise<void> {
    // TODO: Implement via batch update across SP lists when lead fields change
    throw new Error('Not implemented');
  }

  // --- Closeout Promotion ---
  async promoteToHub(_projectCode: string): Promise<void> {
    // TODO: Copy lessons learned to hub Lessons_Learned_Hub list, update PMP status
    throw new Error('Not implemented');
  }

  // --- Scorecard Workflow (Phase 16) ---
  async submitScorecard(): Promise<IGoNoGoScorecard> { throw new Error('SharePoint implementation pending'); }
  async respondToScorecardSubmission(): Promise<IGoNoGoScorecard> { throw new Error('SharePoint implementation pending'); }
  async enterCommitteeScores(): Promise<IGoNoGoScorecard> { throw new Error('SharePoint implementation pending'); }
  async recordFinalDecision(): Promise<IGoNoGoScorecard> { throw new Error('SharePoint implementation pending'); }
  async unlockScorecard(): Promise<IGoNoGoScorecard> { throw new Error('SharePoint implementation pending'); }
  async relockScorecard(): Promise<IGoNoGoScorecard> { throw new Error('SharePoint implementation pending'); }
  async getScorecardVersions(): Promise<IScorecardVersion[]> { throw new Error('SharePoint implementation pending'); }

  // --- Workflow Definitions ---
  async getWorkflowDefinitions(): Promise<IWorkflowDefinition[]> { return []; }
  async getWorkflowDefinition(_workflowKey: WorkflowKey): Promise<IWorkflowDefinition | null> { return null; }
  async updateWorkflowStep(_workflowId: number, _stepId: number, _data: Partial<IWorkflowStep>): Promise<IWorkflowStep> { throw new Error('Not implemented'); }
  async addConditionalAssignment(_stepId: number, _assignment: Partial<IConditionalAssignment>): Promise<IConditionalAssignment> { throw new Error('Not implemented'); }
  async updateConditionalAssignment(_assignmentId: number, _data: Partial<IConditionalAssignment>): Promise<IConditionalAssignment> { throw new Error('Not implemented'); }
  async removeConditionalAssignment(_assignmentId: number): Promise<void> { throw new Error('Not implemented'); }
  async getWorkflowOverrides(_projectCode: string): Promise<IWorkflowStepOverride[]> { return []; }
  async setWorkflowStepOverride(_override: Partial<IWorkflowStepOverride>): Promise<IWorkflowStepOverride> { throw new Error('Not implemented'); }
  async removeWorkflowStepOverride(_overrideId: number): Promise<void> { throw new Error('Not implemented'); }
  async resolveWorkflowChain(_workflowKey: WorkflowKey, _projectCode: string): Promise<IResolvedWorkflowStep[]> { return []; }

  // --- Turnover Agenda ---
  async getTurnoverAgenda(_projectCode: string): Promise<ITurnoverAgenda | null> { return null; }
  async createTurnoverAgenda(_projectCode: string, _leadId: number): Promise<ITurnoverAgenda> { throw new Error('Not implemented'); }
  async updateTurnoverAgenda(_projectCode: string, _data: Partial<ITurnoverAgenda>): Promise<ITurnoverAgenda> { throw new Error('Not implemented'); }
  async updateTurnoverPrerequisite(_prerequisiteId: number, _data: Partial<ITurnoverPrerequisite>): Promise<ITurnoverPrerequisite> { throw new Error('Not implemented'); }
  async updateTurnoverDiscussionItem(_itemId: number, _data: Partial<ITurnoverDiscussionItem>): Promise<ITurnoverDiscussionItem> { throw new Error('Not implemented'); }
  async addTurnoverDiscussionAttachment(_itemId: number, _file: File): Promise<ITurnoverAttachment> { throw new Error('Not implemented'); }
  async removeTurnoverDiscussionAttachment(_attachmentId: number): Promise<void> { throw new Error('Not implemented'); }
  async addTurnoverSubcontractor(_turnoverAgendaId: number, _data: Partial<ITurnoverSubcontractor>): Promise<ITurnoverSubcontractor> { throw new Error('Not implemented'); }
  async updateTurnoverSubcontractor(_subId: number, _data: Partial<ITurnoverSubcontractor>): Promise<ITurnoverSubcontractor> { throw new Error('Not implemented'); }
  async removeTurnoverSubcontractor(_subId: number): Promise<void> { throw new Error('Not implemented'); }
  async updateTurnoverExhibit(_exhibitId: number, _data: Partial<ITurnoverExhibit>): Promise<ITurnoverExhibit> { throw new Error('Not implemented'); }
  async addTurnoverExhibit(_turnoverAgendaId: number, _data: Partial<ITurnoverExhibit>): Promise<ITurnoverExhibit> { throw new Error('Not implemented'); }
  async removeTurnoverExhibit(_exhibitId: number): Promise<void> { throw new Error('Not implemented'); }
  async uploadTurnoverExhibitFile(_exhibitId: number, _file: File): Promise<{ fileUrl: string; fileName: string }> { throw new Error('Not implemented'); }
  async signTurnoverAgenda(_signatureId: number, _comment?: string): Promise<ITurnoverSignature> { throw new Error('Not implemented'); }
  async updateTurnoverEstimateOverview(_projectCode: string, _data: Partial<ITurnoverEstimateOverview>): Promise<ITurnoverEstimateOverview> { throw new Error('Not implemented'); }

  // --- Hub Site URL Configuration ---
  async getHubSiteUrl(): Promise<string> {
    if (!this.sp) return 'https://hedrickbrotherscom.sharepoint.com/sites/HBCentral';
    try {
      const items = await this.sp.web.lists.getByTitle('App_Context_Config')
        .items.filter("SiteURL eq 'HUB_SITE_URL'").select('AppTitle').top(1)();
      return items.length > 0 ? items[0].AppTitle : 'https://hedrickbrotherscom.sharepoint.com/sites/HBCentral';
    } catch {
      return 'https://hedrickbrotherscom.sharepoint.com/sites/HBCentral';
    }
  }
  async setHubSiteUrl(_url: string): Promise<void> { throw new Error('Not implemented'); }

  async getActionItems(_userEmail: string): Promise<IActionInboxItem[]> { return []; }

  // --- Permission Templates ---
  async getPermissionTemplates(): Promise<IPermissionTemplate[]> { return []; }
  async getPermissionTemplate(_id: number): Promise<IPermissionTemplate | null> { return null; }
  async createPermissionTemplate(_data: Partial<IPermissionTemplate>): Promise<IPermissionTemplate> { throw new Error('Not implemented'); }
  async updatePermissionTemplate(_id: number, _data: Partial<IPermissionTemplate>): Promise<IPermissionTemplate> { throw new Error('Not implemented'); }
  async deletePermissionTemplate(_id: number): Promise<void> { throw new Error('Not implemented'); }

  // --- Security Group Mappings ---
  async getSecurityGroupMappings(): Promise<ISecurityGroupMapping[]> { return []; }
  async createSecurityGroupMapping(_data: Partial<ISecurityGroupMapping>): Promise<ISecurityGroupMapping> { throw new Error('Not implemented'); }
  async updateSecurityGroupMapping(_id: number, _data: Partial<ISecurityGroupMapping>): Promise<ISecurityGroupMapping> { throw new Error('Not implemented'); }

  // --- Project Team Assignments ---
  async getProjectTeamAssignments(_projectCode: string): Promise<IProjectTeamAssignment[]> { return []; }
  async getMyProjectAssignments(_userEmail: string): Promise<IProjectTeamAssignment[]> { return []; }
  async createProjectTeamAssignment(_data: Partial<IProjectTeamAssignment>): Promise<IProjectTeamAssignment> { throw new Error('Not implemented'); }
  async updateProjectTeamAssignment(_id: number, _data: Partial<IProjectTeamAssignment>): Promise<IProjectTeamAssignment> { throw new Error('Not implemented'); }
  async removeProjectTeamAssignment(_id: number): Promise<void> { throw new Error('Not implemented'); }

  // --- Permission Resolution ---
  async resolveUserPermissions(_userEmail: string, _projectCode: string | null): Promise<IResolvedPermissions> { throw new Error('Not implemented'); }
  async getAccessibleProjects(_userEmail: string): Promise<string[]> { return []; }

  // --- Environment Configuration ---
  async getEnvironmentConfig(): Promise<import('../models/IEnvironmentConfig').IEnvironmentConfig> { throw new Error('Not implemented'); }
  async promoteTemplates(_fromTier: import('../models/IEnvironmentConfig').EnvironmentTier, _toTier: import('../models/IEnvironmentConfig').EnvironmentTier, _promotedBy: string): Promise<void> { throw new Error('Not implemented'); }

  // --- Sector Definitions ---
  async getSectorDefinitions(): Promise<import('../models/ISectorDefinition').ISectorDefinition[]> { return []; }
  async createSectorDefinition(_data: Partial<import('../models/ISectorDefinition').ISectorDefinition>): Promise<import('../models/ISectorDefinition').ISectorDefinition> { throw new Error('Not implemented'); }
  async updateSectorDefinition(_id: number, _data: Partial<import('../models/ISectorDefinition').ISectorDefinition>): Promise<import('../models/ISectorDefinition').ISectorDefinition> { throw new Error('Not implemented'); }

  // --- BD Leads Folder Operations ---
  async createBdLeadFolder(_leadTitle: string, _originatorName: string): Promise<void> { throw new Error('Not implemented'); }
  async checkFolderExists(_path: string): Promise<boolean> { throw new Error('Not implemented'); }
  async createFolder(_path: string): Promise<void> { throw new Error('Not implemented'); }
  async renameFolder(_oldPath: string, _newPath: string): Promise<void> { throw new Error('Not implemented'); }

  // --- Assignment Mappings ---
  async getAssignmentMappings(): Promise<import('../models/IAssignmentMapping').IAssignmentMapping[]> { return []; }
  async createAssignmentMapping(_data: Partial<import('../models/IAssignmentMapping').IAssignmentMapping>): Promise<import('../models/IAssignmentMapping').IAssignmentMapping> { throw new Error('Not implemented'); }
  async updateAssignmentMapping(_id: number, _data: Partial<import('../models/IAssignmentMapping').IAssignmentMapping>): Promise<import('../models/IAssignmentMapping').IAssignmentMapping> { throw new Error('Not implemented'); }
  async deleteAssignmentMapping(_id: number): Promise<void> { throw new Error('Not implemented'); }

  // --- Scorecard Reject / Archive ---
  async rejectScorecard(_scorecardId: number, _reason: string): Promise<IGoNoGoScorecard> { throw new Error('Not implemented'); }
  async archiveScorecard(_scorecardId: number, _archivedBy: string): Promise<IGoNoGoScorecard> { throw new Error('Not implemented'); }

  // --- Project Site URL Targeting ---
  private _projectSiteUrl: string | null = null;

  public setProjectSiteUrl(siteUrl: string | null): void {
    this._projectSiteUrl = siteUrl;
    // When PnP project-web methods are implemented, this will create
    // a new SPFI web instance: this._projectWeb = Web([this.sp.web, siteUrl])
  }
}

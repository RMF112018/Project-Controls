import { IDataService, IListQueryOptions, IPagedResult } from './IDataService';
import { ILead, ILeadFormData } from '../models/ILead';
import { IGoNoGoScorecard } from '../models/IGoNoGoScorecard';
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
import { GoNoGoDecision, Stage } from '../models/enums';
import { LIST_NAMES } from '../utils/constants';

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

  async getAuditLog(entityType?: string, entityId?: string): Promise<IAuditEntry[]> {
    let query = this.sp.web.lists.getByTitle(LIST_NAMES.AUDIT_LOG).items;
    const filters: string[] = [];
    if (entityType) filters.push(`EntityType eq '${entityType}'`);
    if (entityId) filters.push(`EntityId eq '${entityId}'`);
    if (filters.length > 0) query = query.filter(filters.join(' and '));
    const items = await query.orderBy('Timestamp', false).top(100)();
    return items as IAuditEntry[];
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
}

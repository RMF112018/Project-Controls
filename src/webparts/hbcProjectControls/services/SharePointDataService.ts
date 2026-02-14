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
import { IWorkflowDefinition, IWorkflowStep, IConditionalAssignment, IWorkflowStepOverride, IResolvedWorkflowStep, IPersonAssignment, IAssignmentCondition } from '../models/IWorkflowDefinition';
import { ITurnoverAgenda, ITurnoverPrerequisite, ITurnoverDiscussionItem, ITurnoverSubcontractor, ITurnoverExhibit, ITurnoverSignature, ITurnoverEstimateOverview, ITurnoverAttachment } from '../models/ITurnoverAgenda';
import { IActionInboxItem } from '../models/IActionInbox';
import { IPermissionTemplate, ISecurityGroupMapping, IProjectTeamAssignment, IResolvedPermissions, IToolAccess, IGranularFlagOverride } from '../models/IPermissionTemplate';
import { IEnvironmentConfig, EnvironmentTier } from '../models/IEnvironmentConfig';
import { GoNoGoDecision, Stage, RoleName, WorkflowKey, PermissionLevel, StepAssignmentType, ConditionField } from '../models/enums';
import { LIST_NAMES } from '../utils/constants';
import { ROLE_PERMISSIONS } from '../utils/permissions';
import { resolveToolPermissions, TOOL_DEFINITIONS } from '../utils/toolPermissionMap';
import { STANDARD_BUYOUT_DIVISIONS } from '../utils/buyoutTemplate';
import {
  PERMISSION_TEMPLATES_COLUMNS,
  SECURITY_GROUP_MAPPINGS_COLUMNS,
  PROJECT_TEAM_ASSIGNMENTS_COLUMNS,
  PROVISIONING_LOG_COLUMNS,
  WORKFLOW_DEFINITIONS_COLUMNS,
  WORKFLOW_STEPS_COLUMNS,
  WORKFLOW_CONDITIONAL_ASSIGNMENTS_COLUMNS,
  WORKFLOW_STEP_OVERRIDES_COLUMNS,
} from './columnMappings';
import { BD_LEADS_SITE_URL, BD_LEADS_LIBRARY, BD_LEADS_SUBFOLDERS } from '../utils/constants';

/**
 * SharePoint Data Service — Live implementation using PnP JS.
 *
 * Methods are progressively implemented. Unimplemented stubs log
 * console warnings (Pattern A: silent empty returns) or throw errors
 * (Pattern B: mutations). See docs/DEPLOYMENT_READINESS.md for status.
 */
export class SharePointDataService implements IDataService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sp: any; // SPFI instance

  // SPFx page context info, set via initializeContext()
  private _pageContextUser: {
    displayName: string;
    email: string;
    loginName: string;
    id: number;
  } | null = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialize(spInstance: any): void {
    this.sp = spInstance;
  }

  /**
   * Set SPFx page context user info for getCurrentUser().
   * Must be called from WebPart.onInit() before any data fetching.
   */
  initializeContext(pageContextUser: {
    displayName: string;
    email: string;
    loginName: string;
    id: number;
  }): void {
    this._pageContextUser = pageContextUser;
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
    if (!this._pageContextUser) {
      throw new Error('SharePointDataService.initializeContext() must be called before getCurrentUser()');
    }

    const { displayName, email, loginName, id } = this._pageContextUser;

    // Fetch roles from App_Roles list — match user email against UserOrGroup array
    const roles: RoleName[] = [];
    const allPermissions: string[] = [];
    try {
      const roleItems = await this.getRoles();
      const emailLower = email.toLowerCase();
      for (const role of roleItems) {
        if (!role.IsActive) continue;
        const isMatch = role.UserOrGroup?.some(
          (u: string) => u.toLowerCase() === emailLower
        );
        if (isMatch) {
          roles.push(role.Title);
          const rolePerms = ROLE_PERMISSIONS[role.Title] || [];
          allPermissions.push(...rolePerms);
        }
      }
    } catch {
      console.warn('[SP] Failed to fetch roles from App_Roles list, falling back to empty roles');
    }

    // If no roles matched, the user has no permissions (view-only)
    return {
      id,
      displayName,
      email,
      loginName,
      roles,
      permissions: new Set(allPermissions),
    };
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
  async triggerProvisioning(leadId: number, projectCode: string, projectName: string, requestedBy: string): Promise<IProvisioningLog> {
    const col = PROVISIONING_LOG_COLUMNS;
    const addData: Record<string, unknown> = {
      [col.projectCode]: projectCode,
      [col.projectName]: projectName,
      [col.leadId]: leadId,
      [col.status]: 'Queued',
      [col.currentStep]: 0,
      [col.completedSteps]: 0,
      [col.retryCount]: 0,
      [col.requestedBy]: requestedBy,
      [col.requestedAt]: new Date().toISOString(),
    };
    const result = await this.sp.web.lists.getByTitle(LIST_NAMES.PROVISIONING_LOG).items.add(addData);
    const newId = (result.data as Record<string, unknown>).Id as number;
    const item = await this.sp.web.lists.getByTitle(LIST_NAMES.PROVISIONING_LOG).items.getById(newId)();
    return item as IProvisioningLog;
  }

  async getProvisioningStatus(projectCode: string): Promise<IProvisioningLog | null> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.PROVISIONING_LOG).items
      .filter(`ProjectCode eq '${projectCode}'`)
      .orderBy('RequestedAt', false)
      .top(1)();
    if (items.length === 0) return null;
    return items[0] as IProvisioningLog;
  }

  async updateProvisioningLog(projectCode: string, data: Partial<IProvisioningLog>): Promise<IProvisioningLog> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.PROVISIONING_LOG).items
      .filter(`ProjectCode eq '${projectCode}'`).orderBy('RequestedAt', false).top(1)();
    if (items.length === 0) throw new Error(`Provisioning log for ${projectCode} not found`);

    const itemId = items[0].Id as number;
    const col = PROVISIONING_LOG_COLUMNS;
    const updateData: Record<string, unknown> = {};
    if (data.status !== undefined) updateData[col.status] = data.status;
    if (data.currentStep !== undefined) updateData[col.currentStep] = data.currentStep;
    if (data.completedSteps !== undefined) updateData[col.completedSteps] = data.completedSteps;
    if (data.failedStep !== undefined) updateData[col.failedStep] = data.failedStep;
    if (data.errorMessage !== undefined) updateData[col.errorMessage] = data.errorMessage;
    if (data.retryCount !== undefined) updateData[col.retryCount] = data.retryCount;
    if (data.siteUrl !== undefined) updateData[col.siteUrl] = data.siteUrl;
    if (data.completedAt !== undefined) updateData[col.completedAt] = data.completedAt;
    if (data.hubNavLinkStatus !== undefined) updateData[col.hubNavLinkStatus] = data.hubNavLinkStatus;

    await this.sp.web.lists.getByTitle(LIST_NAMES.PROVISIONING_LOG).items.getById(itemId).update(updateData);
    const updated = await this.sp.web.lists.getByTitle(LIST_NAMES.PROVISIONING_LOG).items.getById(itemId)();
    return updated as IProvisioningLog;
  }

  async getProvisioningLogs(): Promise<IProvisioningLog[]> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.PROVISIONING_LOG).items
      .orderBy('RequestedAt', false)
      .top(100)();
    return items as IProvisioningLog[];
  }

  async retryProvisioning(projectCode: string, fromStep: number): Promise<IProvisioningLog> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.PROVISIONING_LOG).items
      .filter(`ProjectCode eq '${projectCode}'`).orderBy('RequestedAt', false).top(1)();
    if (items.length === 0) throw new Error(`Provisioning log for ${projectCode} not found`);

    const itemId = items[0].Id as number;
    const currentRetryCount = (items[0].retryCount as number) || 0;
    const col = PROVISIONING_LOG_COLUMNS;

    await this.sp.web.lists.getByTitle(LIST_NAMES.PROVISIONING_LOG).items.getById(itemId).update({
      [col.status]: 'InProgress',
      [col.currentStep]: fromStep,
      [col.failedStep]: null,
      [col.errorMessage]: null,
      [col.retryCount]: currentRetryCount + 1,
    });

    const updated = await this.sp.web.lists.getByTitle(LIST_NAMES.PROVISIONING_LOG).items.getById(itemId)();
    return updated as IProvisioningLog;
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
  async getStartupChecklist(_projectCode: string): Promise<IStartupChecklistItem[]> { console.warn('[STUB] getStartupChecklist not implemented'); return []; }
  async updateChecklistItem(_projectCode: string, _itemId: number, _data: Partial<IStartupChecklistItem>): Promise<IStartupChecklistItem> { throw new Error('SharePoint implementation pending: updateChecklistItem'); }
  async addChecklistItem(_projectCode: string, _item: Partial<IStartupChecklistItem>): Promise<IStartupChecklistItem> { throw new Error('SharePoint implementation pending: addChecklistItem'); }
  async removeChecklistItem(_projectCode: string, _itemId: number): Promise<void> { throw new Error('SharePoint implementation pending: removeChecklistItem'); }

  // --- Internal Matrix ---
  async getInternalMatrix(_projectCode: string): Promise<IInternalMatrixTask[]> { console.warn('[STUB] getInternalMatrix not implemented'); return []; }
  async updateInternalMatrixTask(_projectCode: string, _taskId: number, _data: Partial<IInternalMatrixTask>): Promise<IInternalMatrixTask> { throw new Error('SharePoint implementation pending: updateInternalMatrixTask'); }
  async addInternalMatrixTask(_projectCode: string, _task: Partial<IInternalMatrixTask>): Promise<IInternalMatrixTask> { throw new Error('SharePoint implementation pending: addInternalMatrixTask'); }
  async removeInternalMatrixTask(_projectCode: string, _taskId: number): Promise<void> { throw new Error('SharePoint implementation pending: removeInternalMatrixTask'); }

  // --- Team Assignments ---
  async getTeamRoleAssignments(_projectCode: string): Promise<ITeamRoleAssignment[]> { console.warn('[STUB] getTeamRoleAssignments not implemented'); return []; }
  async updateTeamRoleAssignment(_projectCode: string, _role: string, _person: string, _email?: string): Promise<ITeamRoleAssignment> { throw new Error('SharePoint implementation pending: updateTeamRoleAssignment'); }

  // --- Owner Contract Matrix ---
  async getOwnerContractMatrix(_projectCode: string): Promise<IOwnerContractArticle[]> { console.warn('[STUB] getOwnerContractMatrix not implemented'); return []; }
  async updateOwnerContractArticle(_projectCode: string, _itemId: number, _data: Partial<IOwnerContractArticle>): Promise<IOwnerContractArticle> { throw new Error('SharePoint implementation pending: updateOwnerContractArticle'); }
  async addOwnerContractArticle(_projectCode: string, _item: Partial<IOwnerContractArticle>): Promise<IOwnerContractArticle> { throw new Error('SharePoint implementation pending: addOwnerContractArticle'); }
  async removeOwnerContractArticle(_projectCode: string, _itemId: number): Promise<void> { throw new Error('SharePoint implementation pending: removeOwnerContractArticle'); }

  // --- Sub-Contract Matrix ---
  async getSubContractMatrix(_projectCode: string): Promise<ISubContractClause[]> { console.warn('[STUB] getSubContractMatrix not implemented'); return []; }
  async updateSubContractClause(_projectCode: string, _itemId: number, _data: Partial<ISubContractClause>): Promise<ISubContractClause> { throw new Error('SharePoint implementation pending: updateSubContractClause'); }
  async addSubContractClause(_projectCode: string, _item: Partial<ISubContractClause>): Promise<ISubContractClause> { throw new Error('SharePoint implementation pending: addSubContractClause'); }
  async removeSubContractClause(_projectCode: string, _itemId: number): Promise<void> { throw new Error('SharePoint implementation pending: removeSubContractClause'); }

  // --- Marketing Project Record ---
  async getMarketingProjectRecord(_projectCode: string): Promise<IMarketingProjectRecord | null> { console.warn('[STUB] getMarketingProjectRecord not implemented'); return null; }
  async createMarketingProjectRecord(_data: Partial<IMarketingProjectRecord>): Promise<IMarketingProjectRecord> { throw new Error('SharePoint implementation pending: createMarketingProjectRecord'); }
  async updateMarketingProjectRecord(_projectCode: string, _data: Partial<IMarketingProjectRecord>): Promise<IMarketingProjectRecord> { throw new Error('SharePoint implementation pending: updateMarketingProjectRecord'); }
  async getAllMarketingProjectRecords(): Promise<IMarketingProjectRecord[]> { console.warn('[STUB] getAllMarketingProjectRecords not implemented'); return []; }

  // --- Risk & Cost ---
  async getRiskCostManagement(_projectCode: string): Promise<IRiskCostManagement | null> { console.warn('[STUB] getRiskCostManagement not implemented'); return null; }
  async updateRiskCostManagement(_projectCode: string, _data: Partial<IRiskCostManagement>): Promise<IRiskCostManagement> { throw new Error('SharePoint implementation pending: updateRiskCostManagement'); }
  async addRiskCostItem(_projectCode: string, _item: Partial<IRiskCostItem>): Promise<IRiskCostItem> { throw new Error('SharePoint implementation pending: addRiskCostItem'); }
  async updateRiskCostItem(_projectCode: string, _itemId: number, _data: Partial<IRiskCostItem>): Promise<IRiskCostItem> { throw new Error('SharePoint implementation pending: updateRiskCostItem'); }

  // --- Quality Concerns ---
  async getQualityConcerns(_projectCode: string): Promise<IQualityConcern[]> { console.warn('[STUB] getQualityConcerns not implemented'); return []; }
  async addQualityConcern(_projectCode: string, _concern: Partial<IQualityConcern>): Promise<IQualityConcern> { throw new Error('SharePoint implementation pending: addQualityConcern'); }
  async updateQualityConcern(_projectCode: string, _concernId: number, _data: Partial<IQualityConcern>): Promise<IQualityConcern> { throw new Error('SharePoint implementation pending: updateQualityConcern'); }

  // --- Safety Concerns ---
  async getSafetyConcerns(_projectCode: string): Promise<ISafetyConcern[]> { console.warn('[STUB] getSafetyConcerns not implemented'); return []; }
  async addSafetyConcern(_projectCode: string, _concern: Partial<ISafetyConcern>): Promise<ISafetyConcern> { throw new Error('SharePoint implementation pending: addSafetyConcern'); }
  async updateSafetyConcern(_projectCode: string, _concernId: number, _data: Partial<ISafetyConcern>): Promise<ISafetyConcern> { throw new Error('SharePoint implementation pending: updateSafetyConcern'); }

  // --- Schedule & Critical Path ---
  async getProjectSchedule(_projectCode: string): Promise<IProjectScheduleCriticalPath | null> { console.warn('[STUB] getProjectSchedule not implemented'); return null; }
  async updateProjectSchedule(_projectCode: string, _data: Partial<IProjectScheduleCriticalPath>): Promise<IProjectScheduleCriticalPath> { throw new Error('SharePoint implementation pending: updateProjectSchedule'); }
  async addCriticalPathItem(_projectCode: string, _item: Partial<ICriticalPathItem>): Promise<ICriticalPathItem> { throw new Error('SharePoint implementation pending: addCriticalPathItem'); }

  // --- Superintendent Plan ---
  async getSuperintendentPlan(_projectCode: string): Promise<ISuperintendentPlan | null> { console.warn('[STUB] getSuperintendentPlan not implemented'); return null; }
  async updateSuperintendentPlanSection(_projectCode: string, _sectionId: number, _data: Partial<ISuperintendentPlanSection>): Promise<ISuperintendentPlanSection> { throw new Error('SharePoint implementation pending: updateSuperintendentPlanSection'); }
  async createSuperintendentPlan(_projectCode: string, _data: Partial<ISuperintendentPlan>): Promise<ISuperintendentPlan> { throw new Error('SharePoint implementation pending: createSuperintendentPlan'); }

  // --- Lessons Learned ---
  async getLessonsLearned(_projectCode: string): Promise<ILessonLearned[]> { console.warn('[STUB] getLessonsLearned not implemented'); return []; }
  async addLessonLearned(_projectCode: string, _lesson: Partial<ILessonLearned>): Promise<ILessonLearned> { throw new Error('SharePoint implementation pending: addLessonLearned'); }
  async updateLessonLearned(_projectCode: string, _lessonId: number, _data: Partial<ILessonLearned>): Promise<ILessonLearned> { throw new Error('SharePoint implementation pending: updateLessonLearned'); }

  // --- Project Management Plan ---
  async getProjectManagementPlan(_projectCode: string): Promise<IProjectManagementPlan | null> { console.warn('[STUB] getProjectManagementPlan not implemented'); return null; }
  async updateProjectManagementPlan(_projectCode: string, _data: Partial<IProjectManagementPlan>): Promise<IProjectManagementPlan> { throw new Error('SharePoint implementation pending: updateProjectManagementPlan'); }
  async submitPMPForApproval(_projectCode: string, _submittedBy: string): Promise<IProjectManagementPlan> { throw new Error('SharePoint implementation pending: submitPMPForApproval'); }
  async respondToPMPApproval(_projectCode: string, _stepId: number, _approved: boolean, _comment: string): Promise<IProjectManagementPlan> { throw new Error('SharePoint implementation pending: respondToPMPApproval'); }
  async signPMP(_projectCode: string, _signatureId: number, _comment: string): Promise<IProjectManagementPlan> { throw new Error('SharePoint implementation pending: signPMP'); }
  async getDivisionApprovers(): Promise<IDivisionApprover[]> { console.warn('[STUB] getDivisionApprovers not implemented'); return []; }
  async getPMPBoilerplate(): Promise<IPMPBoilerplateSection[]> { console.warn('[STUB] getPMPBoilerplate not implemented'); return []; }

  // --- Monthly Review ---
  async getMonthlyReviews(_projectCode: string): Promise<IMonthlyProjectReview[]> { console.warn('[STUB] getMonthlyReviews not implemented'); return []; }
  async getMonthlyReview(_reviewId: number): Promise<IMonthlyProjectReview | null> { console.warn('[STUB] getMonthlyReview not implemented'); return null; }
  async updateMonthlyReview(_reviewId: number, _data: Partial<IMonthlyProjectReview>): Promise<IMonthlyProjectReview> { throw new Error('SharePoint implementation pending: updateMonthlyReview'); }
  async createMonthlyReview(_data: Partial<IMonthlyProjectReview>): Promise<IMonthlyProjectReview> { throw new Error('SharePoint implementation pending: createMonthlyReview'); }

  // --- Estimating Kick-Off ---
  async getEstimatingKickoff(_projectCode: string): Promise<IEstimatingKickoff | null> { console.warn('[STUB] getEstimatingKickoff not implemented'); return null; }
  async getEstimatingKickoffByLeadId(_leadId: number): Promise<IEstimatingKickoff | null> { console.warn('[STUB] getEstimatingKickoffByLeadId not implemented'); return null; }
  async createEstimatingKickoff(_data: Partial<IEstimatingKickoff>): Promise<IEstimatingKickoff> { throw new Error('SharePoint implementation pending: createEstimatingKickoff'); }
  async updateEstimatingKickoff(_id: number, _data: Partial<IEstimatingKickoff>): Promise<IEstimatingKickoff> { throw new Error('SharePoint implementation pending: updateEstimatingKickoff'); }
  async updateKickoffItem(_kickoffId: number, _itemId: number, _data: Partial<IEstimatingKickoffItem>): Promise<IEstimatingKickoffItem> { throw new Error('SharePoint implementation pending: updateKickoffItem'); }
  async addKickoffItem(_kickoffId: number, _item: Partial<IEstimatingKickoffItem>): Promise<IEstimatingKickoffItem> { throw new Error('SharePoint implementation pending: addKickoffItem'); }
  async removeKickoffItem(_kickoffId: number, _itemId: number): Promise<void> { throw new Error('SharePoint implementation pending: removeKickoffItem'); }
  async updateKickoffKeyPersonnel(_kickoffId: number, _personnel: import('../models/IEstimatingKickoff').IKeyPersonnelEntry[]): Promise<import('../models/IEstimatingKickoff').IEstimatingKickoff> { throw new Error('SharePoint implementation pending: updateKickoffKeyPersonnel'); }

  // --- Job Number Requests ---
  async getJobNumberRequests(_status?: JobNumberRequestStatus): Promise<IJobNumberRequest[]> { console.warn('[STUB] getJobNumberRequests not implemented'); return []; }
  async getJobNumberRequestByLeadId(_leadId: number): Promise<IJobNumberRequest | null> { console.warn('[STUB] getJobNumberRequestByLeadId not implemented'); return null; }
  async createJobNumberRequest(_data: Partial<IJobNumberRequest>): Promise<IJobNumberRequest> { throw new Error('SharePoint implementation pending: createJobNumberRequest'); }
  async finalizeJobNumber(_requestId: number, _jobNumber: string, _assignedBy: string): Promise<IJobNumberRequest> { throw new Error('SharePoint implementation pending: finalizeJobNumber'); }

  // --- Reference Data ---
  async getProjectTypes(): Promise<IProjectType[]> { console.warn('[STUB] getProjectTypes not implemented'); return []; }
  async getStandardCostCodes(): Promise<IStandardCostCode[]> { console.warn('[STUB] getStandardCostCodes not implemented'); return []; }

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

  private mapToPermissionTemplate(item: Record<string, unknown>): IPermissionTemplate {
    let toolAccess: IToolAccess[] = [];
    try {
      const raw = item[PERMISSION_TEMPLATES_COLUMNS.toolAccess];
      if (typeof raw === 'string' && raw) {
        toolAccess = JSON.parse(raw) as IToolAccess[];
      }
    } catch { /* default to empty array */ }

    return {
      id: item[PERMISSION_TEMPLATES_COLUMNS.id] as number || item.Id as number,
      name: item[PERMISSION_TEMPLATES_COLUMNS.name] as string || '',
      description: item[PERMISSION_TEMPLATES_COLUMNS.description] as string || '',
      isGlobal: !!(item[PERMISSION_TEMPLATES_COLUMNS.isGlobal]),
      globalAccess: !!(item[PERMISSION_TEMPLATES_COLUMNS.globalAccess]),
      identityType: (item[PERMISSION_TEMPLATES_COLUMNS.identityType] as 'Internal' | 'External') || 'Internal',
      toolAccess,
      isDefault: !!(item[PERMISSION_TEMPLATES_COLUMNS.isDefault]),
      isActive: !!(item[PERMISSION_TEMPLATES_COLUMNS.isActive]),
      version: (item.Version as number) || 1,
      promotedFromTier: item.PromotedFromTier as EnvironmentTier | undefined,
      createdBy: item[PERMISSION_TEMPLATES_COLUMNS.createdBy] as string || '',
      createdDate: item[PERMISSION_TEMPLATES_COLUMNS.createdDate] as string || '',
      lastModifiedBy: item[PERMISSION_TEMPLATES_COLUMNS.lastModifiedBy] as string || '',
      lastModifiedDate: item[PERMISSION_TEMPLATES_COLUMNS.lastModifiedDate] as string || '',
    };
  }

  private mapToSecurityGroupMapping(item: Record<string, unknown>): ISecurityGroupMapping {
    return {
      id: item[SECURITY_GROUP_MAPPINGS_COLUMNS.id] as number || item.Id as number,
      securityGroupId: item[SECURITY_GROUP_MAPPINGS_COLUMNS.securityGroupId] as string || '',
      securityGroupName: item[SECURITY_GROUP_MAPPINGS_COLUMNS.securityGroupName] as string || '',
      defaultTemplateId: item[SECURITY_GROUP_MAPPINGS_COLUMNS.defaultTemplateId] as number || 0,
      isActive: !!(item[SECURITY_GROUP_MAPPINGS_COLUMNS.isActive]),
    };
  }

  private mapToProjectTeamAssignment(item: Record<string, unknown>): IProjectTeamAssignment {
    let granularFlagOverrides: IGranularFlagOverride[] | undefined;
    try {
      const raw = item[PROJECT_TEAM_ASSIGNMENTS_COLUMNS.granularFlagOverrides];
      if (typeof raw === 'string' && raw) {
        granularFlagOverrides = JSON.parse(raw) as IGranularFlagOverride[];
      }
    } catch { /* default to undefined */ }

    return {
      id: item[PROJECT_TEAM_ASSIGNMENTS_COLUMNS.id] as number || item.Id as number,
      projectCode: item[PROJECT_TEAM_ASSIGNMENTS_COLUMNS.projectCode] as string || '',
      userId: item[PROJECT_TEAM_ASSIGNMENTS_COLUMNS.userId] as string || '',
      userDisplayName: item[PROJECT_TEAM_ASSIGNMENTS_COLUMNS.userDisplayName] as string || '',
      userEmail: item[PROJECT_TEAM_ASSIGNMENTS_COLUMNS.userEmail] as string || '',
      assignedRole: item[PROJECT_TEAM_ASSIGNMENTS_COLUMNS.assignedRole] as string || '',
      templateOverrideId: item[PROJECT_TEAM_ASSIGNMENTS_COLUMNS.templateOverrideId] as number | undefined,
      granularFlagOverrides,
      assignedBy: item[PROJECT_TEAM_ASSIGNMENTS_COLUMNS.assignedBy] as string || '',
      assignedDate: item[PROJECT_TEAM_ASSIGNMENTS_COLUMNS.assignedDate] as string || '',
      isActive: !!(item[PROJECT_TEAM_ASSIGNMENTS_COLUMNS.isActive]),
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
  async rekeyProjectCode(oldCode: string, newCode: string, leadId: number): Promise<void> {
    // 1. Update Leads_Master
    await this.sp.web.lists.getByTitle(LIST_NAMES.LEADS_MASTER)
      .items.getById(leadId).update({ ProjectCode: newCode, OfficialJobNumber: newCode });

    // Helper: batch-update all items in a list where column eq oldCode
    const batchRekey = async (listName: string, columnName: string): Promise<void> => {
      const items = await this.sp.web.lists.getByTitle(listName)
        .items.filter(`${columnName} eq '${oldCode}'`).select('Id')();
      if (items.length === 0) return;
      const batch = this.sp.web.createBatch();
      for (const item of items) {
        this.sp.web.lists.getByTitle(listName)
          .items.getById(item.Id).inBatch(batch).update({ [columnName]: newCode });
      }
      await batch.execute();
    };

    // 2-6. Hub lists with project code references
    await batchRekey(LIST_NAMES.ESTIMATING_TRACKER, 'ProjectCode');
    await batchRekey(LIST_NAMES.MARKETING_PROJECT_RECORDS, 'projectCode');
    await batchRekey(LIST_NAMES.PROVISIONING_LOG, 'ProjectCode');
    await batchRekey(LIST_NAMES.BUYOUT_LOG, 'ProjectCode');
    await batchRekey(LIST_NAMES.PROJECT_TEAM_ASSIGNMENTS, PROJECT_TEAM_ASSIGNMENTS_COLUMNS.projectCode);

    // Note: Project-site lists (17 lists) require manual admin re-key since
    // the site URL contains the project code. Use Web([sp.web, newSiteUrl])
    // to batch-update each project-level list when supported.
  }

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
  async syncDenormalizedFields(leadId: number): Promise<void> {
    const lead = await this.getLeadById(leadId);
    if (!lead) return;

    // 1. Estimating_Tracker — Title by LeadID
    const estItems = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_TRACKER)
      .items.filter(`LeadID eq ${leadId}`).select('Id')();
    if (estItems.length > 0) {
      const batch = this.sp.web.createBatch();
      for (const item of estItems) {
        this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_TRACKER)
          .items.getById(item.Id).inBatch(batch).update({ Title: lead.Title });
      }
      await batch.execute();
    }

    if (!lead.ProjectCode) return;

    // 2. Project_Management_Plans — projectName by projectCode
    const pmpItems = await this.sp.web.lists.getByTitle(LIST_NAMES.PMP)
      .items.filter(`projectCode eq '${lead.ProjectCode}'`).select('Id')();
    if (pmpItems.length > 0) {
      const b2 = this.sp.web.createBatch();
      for (const i of pmpItems) {
        this.sp.web.lists.getByTitle(LIST_NAMES.PMP)
          .items.getById(i.Id).inBatch(b2).update({ projectName: lead.Title });
      }
      await b2.execute();
    }

    // 3. Marketing_Project_Records — projectName by projectCode
    const mktItems = await this.sp.web.lists.getByTitle(LIST_NAMES.MARKETING_PROJECT_RECORDS)
      .items.filter(`projectCode eq '${lead.ProjectCode}'`).select('Id')();
    if (mktItems.length > 0) {
      const b3 = this.sp.web.createBatch();
      for (const i of mktItems) {
        this.sp.web.lists.getByTitle(LIST_NAMES.MARKETING_PROJECT_RECORDS)
          .items.getById(i.Id).inBatch(b3).update({ projectName: lead.Title });
      }
      await b3.execute();
    }

    // 4. Provisioning_Log — projectName by ProjectCode
    const provItems = await this.sp.web.lists.getByTitle(LIST_NAMES.PROVISIONING_LOG)
      .items.filter(`ProjectCode eq '${lead.ProjectCode}'`).select('Id')();
    if (provItems.length > 0) {
      const b4 = this.sp.web.createBatch();
      for (const i of provItems) {
        this.sp.web.lists.getByTitle(LIST_NAMES.PROVISIONING_LOG)
          .items.getById(i.Id).inBatch(b4).update({ projectName: lead.Title });
      }
      await b4.execute();
    }

    // 5. Job_Number_Requests — PE/PM by LeadID
    const jnrItems = await this.sp.web.lists.getByTitle(LIST_NAMES.JOB_NUMBER_REQUESTS)
      .items.filter(`LeadID eq ${leadId}`).select('Id')();
    if (jnrItems.length > 0) {
      const upd: Record<string, unknown> = {};
      if ((lead as unknown as Record<string, unknown>).ProjectExecutive) upd.ProjectExecutive = (lead as unknown as Record<string, unknown>).ProjectExecutive;
      if ((lead as unknown as Record<string, unknown>).ProjectManager) upd.ProjectManager = (lead as unknown as Record<string, unknown>).ProjectManager;
      if (Object.keys(upd).length > 0) {
        const b5 = this.sp.web.createBatch();
        for (const i of jnrItems) {
          this.sp.web.lists.getByTitle(LIST_NAMES.JOB_NUMBER_REQUESTS)
            .items.getById(i.Id).inBatch(b5).update(upd);
        }
        await b5.execute();
      }
    }
  }

  // --- Closeout Promotion ---
  async promoteToHub(projectCode: string): Promise<void> {
    // 1. Read lessons from project site (requires _projectSiteUrl)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let projectLessons: Record<string, any>[] = [];
    if (this._projectSiteUrl) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Web } = require('@pnp/sp/webs');
      const projectWeb = Web([this.sp.web, this._projectSiteUrl]);
      projectLessons = await projectWeb.lists.getByTitle('Lessons_Learned')
        .items.filter(`projectCode eq '${projectCode}' and isIncludedInFinalRecord eq 1`)();
    } else {
      console.warn('[SP] promoteToHub: _projectSiteUrl not set, skipping lessons copy');
    }

    // 2. Copy to hub Lessons_Learned_Hub (skip duplicates by projectCode + title)
    for (const lesson of projectLessons) {
      const title = String(lesson.title || '').replace(/'/g, "''");
      const existing = await this.sp.web.lists.getByTitle(LIST_NAMES.LESSONS_LEARNED_HUB)
        .items.filter(`projectCode eq '${projectCode}' and title eq '${title}'`).top(1)();
      if (existing.length === 0) {
        await this.sp.web.lists.getByTitle(LIST_NAMES.LESSONS_LEARNED_HUB).items.add({
          projectCode: lesson.projectCode,
          title: lesson.title,
          category: lesson.category,
          impact: lesson.impact,
          description: lesson.description,
          recommendation: lesson.recommendation,
          isIncludedInFinalRecord: true,
        });
      }
    }

    // 3. Close PMP on hub
    const pmpItems = await this.sp.web.lists.getByTitle(LIST_NAMES.PMP)
      .items.filter(`projectCode eq '${projectCode}'`).select('Id', 'status')();
    for (const pmp of pmpItems) {
      if (pmp.status !== 'Closed') {
        await this.sp.web.lists.getByTitle(LIST_NAMES.PMP)
          .items.getById(pmp.Id).update({ status: 'Closed', lastUpdatedAt: new Date().toISOString() });
      }
    }
  }

  // --- Scorecard Workflow (Phase 16) ---
  async submitScorecard(): Promise<IGoNoGoScorecard> { throw new Error('SharePoint implementation pending: submitScorecard'); }
  async respondToScorecardSubmission(): Promise<IGoNoGoScorecard> { throw new Error('SharePoint implementation pending: respondToScorecardSubmission'); }
  async enterCommitteeScores(): Promise<IGoNoGoScorecard> { throw new Error('SharePoint implementation pending: enterCommitteeScores'); }
  async recordFinalDecision(): Promise<IGoNoGoScorecard> { throw new Error('SharePoint implementation pending: recordFinalDecision'); }
  async unlockScorecard(): Promise<IGoNoGoScorecard> { throw new Error('SharePoint implementation pending: unlockScorecard'); }
  async relockScorecard(): Promise<IGoNoGoScorecard> { throw new Error('SharePoint implementation pending: relockScorecard'); }
  async getScorecardVersions(): Promise<IScorecardVersion[]> { throw new Error('SharePoint implementation pending: getScorecardVersions'); }

  // --- Workflow Definitions ---

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToWorkflowDefinition(item: Record<string, any>, steps: IWorkflowStep[]): IWorkflowDefinition {
    return {
      id: item[WORKFLOW_DEFINITIONS_COLUMNS.id] as number || item.Id as number,
      workflowKey: item[WORKFLOW_DEFINITIONS_COLUMNS.workflowKey] as WorkflowKey,
      name: item[WORKFLOW_DEFINITIONS_COLUMNS.name] as string || '',
      description: item[WORKFLOW_DEFINITIONS_COLUMNS.description] as string || '',
      steps,
      isActive: !!(item[WORKFLOW_DEFINITIONS_COLUMNS.isActive]),
      lastModifiedBy: item[WORKFLOW_DEFINITIONS_COLUMNS.lastModifiedBy] as string || '',
      lastModifiedDate: item[WORKFLOW_DEFINITIONS_COLUMNS.lastModifiedDate] as string || '',
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToWorkflowStep(item: Record<string, any>, conditionalAssignees: IConditionalAssignment[]): IWorkflowStep {
    let defaultAssignee: IPersonAssignment | undefined;
    try {
      const raw = item[WORKFLOW_STEPS_COLUMNS.defaultAssignee];
      if (typeof raw === 'string' && raw) {
        defaultAssignee = JSON.parse(raw) as IPersonAssignment;
      }
    } catch { /* default to undefined */ }

    return {
      id: item[WORKFLOW_STEPS_COLUMNS.id] as number || item.Id as number,
      workflowId: item[WORKFLOW_STEPS_COLUMNS.workflowId] as number || 0,
      stepOrder: item[WORKFLOW_STEPS_COLUMNS.stepOrder] as number || 0,
      name: item[WORKFLOW_STEPS_COLUMNS.name] as string || '',
      description: item[WORKFLOW_STEPS_COLUMNS.description] as string || undefined,
      assignmentType: item[WORKFLOW_STEPS_COLUMNS.assignmentType] as StepAssignmentType || StepAssignmentType.NamedPerson,
      projectRole: item[WORKFLOW_STEPS_COLUMNS.projectRole] as string || undefined,
      defaultAssignee,
      conditionalAssignees,
      isConditional: !!(item[WORKFLOW_STEPS_COLUMNS.isConditional]),
      conditionDescription: item[WORKFLOW_STEPS_COLUMNS.conditionDescription] as string || undefined,
      actionLabel: item[WORKFLOW_STEPS_COLUMNS.actionLabel] as string || '',
      canChairMeeting: !!(item[WORKFLOW_STEPS_COLUMNS.canChairMeeting]),
      featureFlagName: item[WORKFLOW_STEPS_COLUMNS.featureFlagName] as string || undefined,
      isSkippable: !!(item[WORKFLOW_STEPS_COLUMNS.isSkippable]),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToConditionalAssignment(item: Record<string, any>): IConditionalAssignment {
    let conditions: IAssignmentCondition[] = [];
    let assignee: IPersonAssignment = { userId: '', displayName: '', email: '' };
    try {
      const rawConds = item[WORKFLOW_CONDITIONAL_ASSIGNMENTS_COLUMNS.conditions];
      if (typeof rawConds === 'string' && rawConds) {
        conditions = JSON.parse(rawConds) as IAssignmentCondition[];
      }
    } catch { /* default to empty */ }
    try {
      const rawAssignee = item[WORKFLOW_CONDITIONAL_ASSIGNMENTS_COLUMNS.assignee];
      if (typeof rawAssignee === 'string' && rawAssignee) {
        assignee = JSON.parse(rawAssignee) as IPersonAssignment;
      }
    } catch { /* default to empty */ }

    return {
      id: item[WORKFLOW_CONDITIONAL_ASSIGNMENTS_COLUMNS.id] as number || item.Id as number,
      stepId: item[WORKFLOW_CONDITIONAL_ASSIGNMENTS_COLUMNS.stepId] as number || 0,
      conditions,
      assignee,
      priority: item[WORKFLOW_CONDITIONAL_ASSIGNMENTS_COLUMNS.priority] as number || 0,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToWorkflowStepOverride(item: Record<string, any>): IWorkflowStepOverride {
    let overrideAssignee: IPersonAssignment = { userId: '', displayName: '', email: '' };
    try {
      const raw = item[WORKFLOW_STEP_OVERRIDES_COLUMNS.overrideAssignee];
      if (typeof raw === 'string' && raw) {
        overrideAssignee = JSON.parse(raw) as IPersonAssignment;
      }
    } catch { /* default to empty */ }

    return {
      id: item[WORKFLOW_STEP_OVERRIDES_COLUMNS.id] as number || item.Id as number,
      projectCode: item[WORKFLOW_STEP_OVERRIDES_COLUMNS.projectCode] as string || '',
      workflowKey: item[WORKFLOW_STEP_OVERRIDES_COLUMNS.workflowKey] as WorkflowKey,
      stepId: item[WORKFLOW_STEP_OVERRIDES_COLUMNS.stepId] as number || 0,
      overrideAssignee,
      overrideReason: item[WORKFLOW_STEP_OVERRIDES_COLUMNS.overrideReason] as string || undefined,
      overriddenBy: item[WORKFLOW_STEP_OVERRIDES_COLUMNS.overriddenBy] as string || '',
      overriddenDate: item[WORKFLOW_STEP_OVERRIDES_COLUMNS.overriddenDate] as string || '',
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getLeadFieldValue(lead: Record<string, any>, field: ConditionField): string {
    switch (field) {
      case ConditionField.Division: return (lead.Division as string) || '';
      case ConditionField.Region: return (lead.Region as string) || '';
      case ConditionField.Sector: return (lead.Sector as string) || '';
      default: return '';
    }
  }

  /**
   * Reads all 3 workflow lists and assembles full hierarchy.
   * Used internally by getWorkflowDefinitions() and getWorkflowDefinition().
   */
  private async assembleAllWorkflowDefinitions(): Promise<IWorkflowDefinition[]> {
    // Read all 3 lists in parallel
    const [defItems, stepItems, caItems] = await Promise.all([
      this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_DEFINITIONS).items(),
      this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_STEPS).items(),
      this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_CONDITIONAL_ASSIGNMENTS).items(),
    ]);

    // Map conditional assignments and group by stepId
    const caByStepId = new Map<number, IConditionalAssignment[]>();
    for (const caItem of caItems) {
      const ca = this.mapToConditionalAssignment(caItem);
      const existing = caByStepId.get(ca.stepId) || [];
      existing.push(ca);
      caByStepId.set(ca.stepId, existing);
    }

    // Map steps and group by workflowId
    const stepsByWorkflowId = new Map<number, IWorkflowStep[]>();
    for (const stepItem of stepItems) {
      const stepId = stepItem[WORKFLOW_STEPS_COLUMNS.id] as number || stepItem.Id as number;
      const workflowId = stepItem[WORKFLOW_STEPS_COLUMNS.workflowId] as number || 0;
      const step = this.mapToWorkflowStep(stepItem, caByStepId.get(stepId) || []);
      const existing = stepsByWorkflowId.get(workflowId) || [];
      existing.push(step);
      stepsByWorkflowId.set(workflowId, existing);
    }

    // Sort steps by stepOrder within each workflow
    for (const [, steps] of stepsByWorkflowId) {
      steps.sort((a, b) => a.stepOrder - b.stepOrder);
    }

    // Map definitions with their steps
    return defItems.map((defItem: Record<string, unknown>) => {
      const defId = defItem[WORKFLOW_DEFINITIONS_COLUMNS.id] as number || defItem.Id as number;
      return this.mapToWorkflowDefinition(defItem, stepsByWorkflowId.get(defId) || []);
    });
  }

  async getWorkflowDefinitions(): Promise<IWorkflowDefinition[]> {
    return this.assembleAllWorkflowDefinitions();
  }

  async getWorkflowDefinition(workflowKey: WorkflowKey): Promise<IWorkflowDefinition | null> {
    // Filter definition by WorkflowKey, then read steps + conditionals for that definition
    const defItems = await this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_DEFINITIONS).items
      .filter(`${WORKFLOW_DEFINITIONS_COLUMNS.workflowKey} eq '${workflowKey}'`)();
    if (defItems.length === 0) return null;

    const defItem = defItems[0];
    const defId = defItem[WORKFLOW_DEFINITIONS_COLUMNS.id] as number || defItem.Id as number;

    // Read steps for this definition
    const stepItems = await this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_STEPS).items
      .filter(`${WORKFLOW_STEPS_COLUMNS.workflowId} eq ${defId}`)();

    // Collect step IDs for conditional assignment lookup
    const stepIds = stepItems.map((s: Record<string, unknown>) =>
      s[WORKFLOW_STEPS_COLUMNS.id] as number || s.Id as number
    );

    // Read conditional assignments for these steps
    let caItems: Record<string, unknown>[] = [];
    if (stepIds.length > 0) {
      // Build filter for all step IDs
      const caFilter = stepIds.map((id: number) => `${WORKFLOW_CONDITIONAL_ASSIGNMENTS_COLUMNS.stepId} eq ${id}`).join(' or ');
      caItems = await this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_CONDITIONAL_ASSIGNMENTS).items
        .filter(caFilter)();
    }

    // Group conditional assignments by stepId
    const caByStepId = new Map<number, IConditionalAssignment[]>();
    for (const caItem of caItems) {
      const ca = this.mapToConditionalAssignment(caItem);
      const existing = caByStepId.get(ca.stepId) || [];
      existing.push(ca);
      caByStepId.set(ca.stepId, existing);
    }

    // Map steps with their conditional assignees
    const steps = stepItems.map((stepItem: Record<string, unknown>) => {
      const stepId = stepItem[WORKFLOW_STEPS_COLUMNS.id] as number || stepItem.Id as number;
      return this.mapToWorkflowStep(stepItem, caByStepId.get(stepId) || []);
    }).sort((a: IWorkflowStep, b: IWorkflowStep) => a.stepOrder - b.stepOrder);

    return this.mapToWorkflowDefinition(defItem, steps);
  }

  async updateWorkflowStep(workflowId: number, stepId: number, data: Partial<IWorkflowStep>): Promise<IWorkflowStep> {
    // Build SP update payload with column mappings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData[WORKFLOW_STEPS_COLUMNS.name] = data.name;
    if (data.description !== undefined) updateData[WORKFLOW_STEPS_COLUMNS.description] = data.description;
    if (data.stepOrder !== undefined) updateData[WORKFLOW_STEPS_COLUMNS.stepOrder] = data.stepOrder;
    if (data.assignmentType !== undefined) updateData[WORKFLOW_STEPS_COLUMNS.assignmentType] = data.assignmentType;
    if (data.projectRole !== undefined) updateData[WORKFLOW_STEPS_COLUMNS.projectRole] = data.projectRole;
    if (data.defaultAssignee !== undefined) updateData[WORKFLOW_STEPS_COLUMNS.defaultAssignee] = JSON.stringify(data.defaultAssignee);
    if (data.isConditional !== undefined) updateData[WORKFLOW_STEPS_COLUMNS.isConditional] = data.isConditional;
    if (data.conditionDescription !== undefined) updateData[WORKFLOW_STEPS_COLUMNS.conditionDescription] = data.conditionDescription;
    if (data.actionLabel !== undefined) updateData[WORKFLOW_STEPS_COLUMNS.actionLabel] = data.actionLabel;
    if (data.canChairMeeting !== undefined) updateData[WORKFLOW_STEPS_COLUMNS.canChairMeeting] = data.canChairMeeting;
    if (data.featureFlagName !== undefined) updateData[WORKFLOW_STEPS_COLUMNS.featureFlagName] = data.featureFlagName;
    if (data.isSkippable !== undefined) updateData[WORKFLOW_STEPS_COLUMNS.isSkippable] = data.isSkippable;

    await this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_STEPS).items.getById(stepId).update(updateData);

    // Update parent definition's lastModifiedDate
    await this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_DEFINITIONS).items.getById(workflowId).update({
      [WORKFLOW_DEFINITIONS_COLUMNS.lastModifiedDate]: new Date().toISOString(),
    });

    // Re-read the updated step with its conditional assignees
    const updatedItem = await this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_STEPS).items.getById(stepId)();
    const caItems = await this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_CONDITIONAL_ASSIGNMENTS).items
      .filter(`${WORKFLOW_CONDITIONAL_ASSIGNMENTS_COLUMNS.stepId} eq ${stepId}`)();
    const cas = caItems.map((ca: Record<string, unknown>) => this.mapToConditionalAssignment(ca));
    return this.mapToWorkflowStep(updatedItem, cas);
  }

  async addConditionalAssignment(stepId: number, assignment: Partial<IConditionalAssignment>): Promise<IConditionalAssignment> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addData: Record<string, any> = {
      [WORKFLOW_CONDITIONAL_ASSIGNMENTS_COLUMNS.stepId]: stepId,
      [WORKFLOW_CONDITIONAL_ASSIGNMENTS_COLUMNS.conditions]: JSON.stringify(assignment.conditions || []),
      [WORKFLOW_CONDITIONAL_ASSIGNMENTS_COLUMNS.assignee]: JSON.stringify(assignment.assignee || { userId: '', displayName: '', email: '' }),
      [WORKFLOW_CONDITIONAL_ASSIGNMENTS_COLUMNS.priority]: assignment.priority || 1,
    };

    const result = await this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_CONDITIONAL_ASSIGNMENTS).items.add(addData);
    const newId = result.Id || result.data?.Id;

    // Update parent workflow definition's lastModifiedDate
    // Find the workflow that owns this step
    const stepItem = await this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_STEPS).items.getById(stepId)();
    const workflowId = stepItem[WORKFLOW_STEPS_COLUMNS.workflowId] as number;
    if (workflowId) {
      await this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_DEFINITIONS).items.getById(workflowId).update({
        [WORKFLOW_DEFINITIONS_COLUMNS.lastModifiedDate]: new Date().toISOString(),
      });
    }

    // Re-read the created item
    const createdItem = await this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_CONDITIONAL_ASSIGNMENTS).items.getById(newId)();
    return this.mapToConditionalAssignment(createdItem);
  }

  async updateConditionalAssignment(assignmentId: number, data: Partial<IConditionalAssignment>): Promise<IConditionalAssignment> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (data.conditions !== undefined) updateData[WORKFLOW_CONDITIONAL_ASSIGNMENTS_COLUMNS.conditions] = JSON.stringify(data.conditions);
    if (data.assignee !== undefined) updateData[WORKFLOW_CONDITIONAL_ASSIGNMENTS_COLUMNS.assignee] = JSON.stringify(data.assignee);
    if (data.priority !== undefined) updateData[WORKFLOW_CONDITIONAL_ASSIGNMENTS_COLUMNS.priority] = data.priority;

    await this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_CONDITIONAL_ASSIGNMENTS).items.getById(assignmentId).update(updateData);

    // Re-read to get current item for stepId lookup
    const updatedItem = await this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_CONDITIONAL_ASSIGNMENTS).items.getById(assignmentId)();
    const stepId = updatedItem[WORKFLOW_CONDITIONAL_ASSIGNMENTS_COLUMNS.stepId] as number;

    // Update parent workflow definition's lastModifiedDate
    if (stepId) {
      const stepItem = await this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_STEPS).items.getById(stepId)();
      const workflowId = stepItem[WORKFLOW_STEPS_COLUMNS.workflowId] as number;
      if (workflowId) {
        await this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_DEFINITIONS).items.getById(workflowId).update({
          [WORKFLOW_DEFINITIONS_COLUMNS.lastModifiedDate]: new Date().toISOString(),
        });
      }
    }

    return this.mapToConditionalAssignment(updatedItem);
  }

  async removeConditionalAssignment(assignmentId: number): Promise<void> {
    // Read item first to find parent workflow for lastModifiedDate update
    const item = await this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_CONDITIONAL_ASSIGNMENTS).items.getById(assignmentId)();
    const stepId = item[WORKFLOW_CONDITIONAL_ASSIGNMENTS_COLUMNS.stepId] as number;

    // Soft delete (recycle)
    await this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_CONDITIONAL_ASSIGNMENTS).items.getById(assignmentId).recycle();

    // Update parent workflow definition's lastModifiedDate
    if (stepId) {
      const stepItem = await this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_STEPS).items.getById(stepId)();
      const workflowId = stepItem[WORKFLOW_STEPS_COLUMNS.workflowId] as number;
      if (workflowId) {
        await this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_DEFINITIONS).items.getById(workflowId).update({
          [WORKFLOW_DEFINITIONS_COLUMNS.lastModifiedDate]: new Date().toISOString(),
        });
      }
    }
  }

  async getWorkflowOverrides(projectCode: string): Promise<IWorkflowStepOverride[]> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_STEP_OVERRIDES).items
      .filter(`${WORKFLOW_STEP_OVERRIDES_COLUMNS.projectCode} eq '${projectCode}'`)();
    return items.map((item: Record<string, unknown>) => this.mapToWorkflowStepOverride(item));
  }

  async setWorkflowStepOverride(override: Partial<IWorkflowStepOverride>): Promise<IWorkflowStepOverride> {
    // Upsert: delete existing override for same projectCode+stepId, then add new
    if (override.projectCode && override.stepId) {
      const existing = await this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_STEP_OVERRIDES).items
        .filter(`${WORKFLOW_STEP_OVERRIDES_COLUMNS.projectCode} eq '${override.projectCode}' and ${WORKFLOW_STEP_OVERRIDES_COLUMNS.stepId} eq ${override.stepId}`)();
      for (const ex of existing) {
        const exId = ex[WORKFLOW_STEP_OVERRIDES_COLUMNS.id] as number || ex.Id as number;
        await this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_STEP_OVERRIDES).items.getById(exId).recycle();
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addData: Record<string, any> = {
      [WORKFLOW_STEP_OVERRIDES_COLUMNS.projectCode]: override.projectCode || '',
      [WORKFLOW_STEP_OVERRIDES_COLUMNS.workflowKey]: override.workflowKey || WorkflowKey.GO_NO_GO,
      [WORKFLOW_STEP_OVERRIDES_COLUMNS.stepId]: override.stepId || 0,
      [WORKFLOW_STEP_OVERRIDES_COLUMNS.overrideAssignee]: JSON.stringify(override.overrideAssignee || { userId: '', displayName: '', email: '' }),
      [WORKFLOW_STEP_OVERRIDES_COLUMNS.overrideReason]: override.overrideReason || '',
      [WORKFLOW_STEP_OVERRIDES_COLUMNS.overriddenBy]: override.overriddenBy || '',
      [WORKFLOW_STEP_OVERRIDES_COLUMNS.overriddenDate]: new Date().toISOString(),
    };

    const result = await this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_STEP_OVERRIDES).items.add(addData);
    const newId = result.Id || result.data?.Id;
    const createdItem = await this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_STEP_OVERRIDES).items.getById(newId)();
    return this.mapToWorkflowStepOverride(createdItem);
  }

  async removeWorkflowStepOverride(overrideId: number): Promise<void> {
    await this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_STEP_OVERRIDES).items.getById(overrideId).recycle();
  }

  async resolveWorkflowChain(workflowKey: WorkflowKey, projectCode: string): Promise<IResolvedWorkflowStep[]> {
    // 1. Get the workflow definition (reuses getWorkflowDefinition)
    const workflow = await this.getWorkflowDefinition(workflowKey);
    if (!workflow) return [];

    // 2. Get overrides for this project+workflow
    const allOverrides = await this.getWorkflowOverrides(projectCode);
    const overrides = allOverrides.filter(o => o.workflowKey === workflowKey);

    // 3. Get team members for ProjectRole resolution
    const teamMembers = await this.getTeamMembers(projectCode);

    // 4. Get lead for condition evaluation
    const leadItems = await this.sp.web.lists.getByTitle(LIST_NAMES.LEADS_MASTER).items
      .filter(`ProjectCode eq '${projectCode}'`).top(1)();
    const lead = leadItems.length > 0 ? leadItems[0] : null;

    // 5. Get feature flags for flag gating
    const featureFlags = await this.getFeatureFlags();

    const resolved: IResolvedWorkflowStep[] = [];

    for (const step of workflow.steps) {
      // 0. Feature flag gating
      if (step.featureFlagName) {
        const flag = featureFlags.find(f => f.FeatureName === step.featureFlagName);
        const isEnabled = flag ? flag.Enabled : true; // Default enabled if flag not found
        if (!isEnabled) {
          if (step.isSkippable) {
            resolved.push({
              stepId: step.id,
              stepOrder: step.stepOrder,
              name: step.name,
              assignee: { userId: '', displayName: '(Skipped)', email: '' },
              assignmentSource: 'Default',
              isConditional: false,
              conditionMet: false,
              actionLabel: step.actionLabel,
              canChairMeeting: false,
              skipped: true,
              skipReason: `Feature flag '${step.featureFlagName}' is disabled`,
            });
          }
          continue; // Skip step (skippable → added as skipped; non-skippable → omitted)
        }
      }

      // 1. Check overrides first
      const override = overrides.find(o => o.stepId === step.id);
      if (override) {
        resolved.push({
          stepId: step.id,
          stepOrder: step.stepOrder,
          name: step.name,
          assignee: override.overrideAssignee,
          assignmentSource: 'Override',
          isConditional: step.isConditional,
          conditionMet: true,
          actionLabel: step.actionLabel,
          canChairMeeting: step.canChairMeeting || false,
        });
        continue;
      }

      // 2. ProjectRole: lookup from team members
      if (step.assignmentType === StepAssignmentType.ProjectRole && step.projectRole) {
        const member = teamMembers.find(tm => tm.role === step.projectRole);
        if (member) {
          resolved.push({
            stepId: step.id,
            stepOrder: step.stepOrder,
            name: step.name,
            assignee: { userId: String(member.id), displayName: member.name, email: member.email },
            assignmentSource: 'ProjectRole',
            isConditional: step.isConditional,
            conditionMet: true,
            actionLabel: step.actionLabel,
            canChairMeeting: step.canChairMeeting || false,
          });
        } else {
          resolved.push({
            stepId: step.id,
            stepOrder: step.stepOrder,
            name: step.name,
            assignee: { userId: '', displayName: `(No ${step.projectRole} assigned)`, email: '' },
            assignmentSource: 'ProjectRole',
            isConditional: step.isConditional,
            conditionMet: false,
            actionLabel: step.actionLabel,
            canChairMeeting: step.canChairMeeting || false,
          });
        }
        continue;
      }

      // 3. NamedPerson: evaluate conditional assignments
      if (step.assignmentType === StepAssignmentType.NamedPerson) {
        let assignee = step.defaultAssignee;
        let source: 'Condition' | 'Default' = 'Default';
        let conditionMet = !step.isConditional;

        if (step.conditionalAssignees.length > 0 && lead) {
          const sorted = [...step.conditionalAssignees].sort((a, b) => a.priority - b.priority);
          for (const ca of sorted) {
            const allMatch = ca.conditions.every(cond => {
              const fieldValue = this.getLeadFieldValue(lead, cond.field);
              return fieldValue === cond.value;
            });
            if (allMatch) {
              assignee = ca.assignee;
              source = 'Condition';
              conditionMet = true;
              break;
            }
          }
        }

        resolved.push({
          stepId: step.id,
          stepOrder: step.stepOrder,
          name: step.name,
          assignee: assignee || { userId: '', displayName: '(Unassigned)', email: '' },
          assignmentSource: source,
          isConditional: step.isConditional,
          conditionMet,
          actionLabel: step.actionLabel,
          canChairMeeting: step.canChairMeeting || false,
        });
        continue;
      }
    }

    return resolved;
  }

  // --- Turnover Agenda ---
  async getTurnoverAgenda(_projectCode: string): Promise<ITurnoverAgenda | null> { console.warn('[STUB] getTurnoverAgenda not implemented'); return null; }
  async createTurnoverAgenda(_projectCode: string, _leadId: number): Promise<ITurnoverAgenda> { throw new Error('SharePoint implementation pending: createTurnoverAgenda'); }
  async updateTurnoverAgenda(_projectCode: string, _data: Partial<ITurnoverAgenda>): Promise<ITurnoverAgenda> { throw new Error('SharePoint implementation pending: updateTurnoverAgenda'); }
  async updateTurnoverPrerequisite(_prerequisiteId: number, _data: Partial<ITurnoverPrerequisite>): Promise<ITurnoverPrerequisite> { throw new Error('SharePoint implementation pending: updateTurnoverPrerequisite'); }
  async updateTurnoverDiscussionItem(_itemId: number, _data: Partial<ITurnoverDiscussionItem>): Promise<ITurnoverDiscussionItem> { throw new Error('SharePoint implementation pending: updateTurnoverDiscussionItem'); }
  async addTurnoverDiscussionAttachment(_itemId: number, _file: File): Promise<ITurnoverAttachment> { throw new Error('SharePoint implementation pending: addTurnoverDiscussionAttachment'); }
  async removeTurnoverDiscussionAttachment(_attachmentId: number): Promise<void> { throw new Error('SharePoint implementation pending: removeTurnoverDiscussionAttachment'); }
  async addTurnoverSubcontractor(_turnoverAgendaId: number, _data: Partial<ITurnoverSubcontractor>): Promise<ITurnoverSubcontractor> { throw new Error('SharePoint implementation pending: addTurnoverSubcontractor'); }
  async updateTurnoverSubcontractor(_subId: number, _data: Partial<ITurnoverSubcontractor>): Promise<ITurnoverSubcontractor> { throw new Error('SharePoint implementation pending: updateTurnoverSubcontractor'); }
  async removeTurnoverSubcontractor(_subId: number): Promise<void> { throw new Error('SharePoint implementation pending: removeTurnoverSubcontractor'); }
  async updateTurnoverExhibit(_exhibitId: number, _data: Partial<ITurnoverExhibit>): Promise<ITurnoverExhibit> { throw new Error('SharePoint implementation pending: updateTurnoverExhibit'); }
  async addTurnoverExhibit(_turnoverAgendaId: number, _data: Partial<ITurnoverExhibit>): Promise<ITurnoverExhibit> { throw new Error('SharePoint implementation pending: addTurnoverExhibit'); }
  async removeTurnoverExhibit(_exhibitId: number): Promise<void> { throw new Error('SharePoint implementation pending: removeTurnoverExhibit'); }
  async uploadTurnoverExhibitFile(_exhibitId: number, _file: File): Promise<{ fileUrl: string; fileName: string }> { throw new Error('SharePoint implementation pending: uploadTurnoverExhibitFile'); }
  async signTurnoverAgenda(_signatureId: number, _comment?: string): Promise<ITurnoverSignature> { throw new Error('SharePoint implementation pending: signTurnoverAgenda'); }
  async updateTurnoverEstimateOverview(_projectCode: string, _data: Partial<ITurnoverEstimateOverview>): Promise<ITurnoverEstimateOverview> { throw new Error('SharePoint implementation pending: updateTurnoverEstimateOverview'); }

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
  async setHubSiteUrl(url: string): Promise<void> {
    try {
      const items = await this.sp.web.lists.getByTitle(LIST_NAMES.APP_CONTEXT_CONFIG)
        .items.filter("SiteURL eq 'HUB_SITE_URL'").top(1)();
      if (items.length > 0) {
        await this.sp.web.lists.getByTitle(LIST_NAMES.APP_CONTEXT_CONFIG)
          .items.getById(items[0].Id).update({ AppTitle: url });
      } else {
        await this.sp.web.lists.getByTitle(LIST_NAMES.APP_CONTEXT_CONFIG)
          .items.add({ SiteURL: 'HUB_SITE_URL', AppTitle: url });
      }
    } catch (err) {
      console.error('[SP] setHubSiteUrl failed:', err);
      throw err;
    }
  }

  async getActionItems(_userEmail: string): Promise<IActionInboxItem[]> { console.warn('[STUB] getActionItems not implemented'); return []; }

  // --- Permission Templates ---
  async getPermissionTemplates(): Promise<IPermissionTemplate[]> {
    const items = await this.sp.web.lists
      .getByTitle(LIST_NAMES.PERMISSION_TEMPLATES).items();
    return (items as Record<string, unknown>[]).map(i => this.mapToPermissionTemplate(i));
  }

  async getPermissionTemplate(id: number): Promise<IPermissionTemplate | null> {
    try {
      const item = await this.sp.web.lists
        .getByTitle(LIST_NAMES.PERMISSION_TEMPLATES).items.getById(id)();
      return this.mapToPermissionTemplate(item as Record<string, unknown>);
    } catch {
      return null;
    }
  }

  async createPermissionTemplate(data: Partial<IPermissionTemplate>): Promise<IPermissionTemplate> {
    const now = new Date().toISOString();
    const spItem: Record<string, unknown> = {
      [PERMISSION_TEMPLATES_COLUMNS.name]: data.name || '',
      [PERMISSION_TEMPLATES_COLUMNS.description]: data.description || '',
      [PERMISSION_TEMPLATES_COLUMNS.isGlobal]: data.isGlobal ?? false,
      [PERMISSION_TEMPLATES_COLUMNS.globalAccess]: data.globalAccess ?? false,
      [PERMISSION_TEMPLATES_COLUMNS.identityType]: data.identityType || 'Internal',
      [PERMISSION_TEMPLATES_COLUMNS.toolAccess]: JSON.stringify(data.toolAccess || []),
      [PERMISSION_TEMPLATES_COLUMNS.isDefault]: data.isDefault ?? false,
      [PERMISSION_TEMPLATES_COLUMNS.isActive]: data.isActive ?? true,
      [PERMISSION_TEMPLATES_COLUMNS.createdBy]: data.createdBy || '',
      [PERMISSION_TEMPLATES_COLUMNS.createdDate]: data.createdDate || now,
      [PERMISSION_TEMPLATES_COLUMNS.lastModifiedBy]: data.lastModifiedBy || data.createdBy || '',
      [PERMISSION_TEMPLATES_COLUMNS.lastModifiedDate]: data.lastModifiedDate || now,
    };
    const result = await this.sp.web.lists
      .getByTitle(LIST_NAMES.PERMISSION_TEMPLATES).items.add(spItem);
    return this.mapToPermissionTemplate(result as Record<string, unknown>);
  }

  async updatePermissionTemplate(id: number, data: Partial<IPermissionTemplate>): Promise<IPermissionTemplate> {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData[PERMISSION_TEMPLATES_COLUMNS.name] = data.name;
    if (data.description !== undefined) updateData[PERMISSION_TEMPLATES_COLUMNS.description] = data.description;
    if (data.isGlobal !== undefined) updateData[PERMISSION_TEMPLATES_COLUMNS.isGlobal] = data.isGlobal;
    if (data.globalAccess !== undefined) updateData[PERMISSION_TEMPLATES_COLUMNS.globalAccess] = data.globalAccess;
    if (data.identityType !== undefined) updateData[PERMISSION_TEMPLATES_COLUMNS.identityType] = data.identityType;
    if (data.toolAccess !== undefined) updateData[PERMISSION_TEMPLATES_COLUMNS.toolAccess] = JSON.stringify(data.toolAccess);
    if (data.isDefault !== undefined) updateData[PERMISSION_TEMPLATES_COLUMNS.isDefault] = data.isDefault;
    if (data.isActive !== undefined) updateData[PERMISSION_TEMPLATES_COLUMNS.isActive] = data.isActive;
    if (data.lastModifiedBy !== undefined) updateData[PERMISSION_TEMPLATES_COLUMNS.lastModifiedBy] = data.lastModifiedBy;
    updateData[PERMISSION_TEMPLATES_COLUMNS.lastModifiedDate] = new Date().toISOString();

    await this.sp.web.lists
      .getByTitle(LIST_NAMES.PERMISSION_TEMPLATES).items.getById(id).update(updateData);
    const updated = await this.sp.web.lists
      .getByTitle(LIST_NAMES.PERMISSION_TEMPLATES).items.getById(id)();
    return this.mapToPermissionTemplate(updated as Record<string, unknown>);
  }

  async deletePermissionTemplate(id: number): Promise<void> {
    await this.sp.web.lists
      .getByTitle(LIST_NAMES.PERMISSION_TEMPLATES).items.getById(id).delete();
  }

  // --- Security Group Mappings ---
  async getSecurityGroupMappings(): Promise<ISecurityGroupMapping[]> {
    const items = await this.sp.web.lists
      .getByTitle(LIST_NAMES.SECURITY_GROUP_MAPPINGS).items();
    return (items as Record<string, unknown>[]).map(i => this.mapToSecurityGroupMapping(i));
  }

  async createSecurityGroupMapping(data: Partial<ISecurityGroupMapping>): Promise<ISecurityGroupMapping> {
    const spItem: Record<string, unknown> = {
      [SECURITY_GROUP_MAPPINGS_COLUMNS.securityGroupId]: data.securityGroupId || '',
      [SECURITY_GROUP_MAPPINGS_COLUMNS.securityGroupName]: data.securityGroupName || '',
      [SECURITY_GROUP_MAPPINGS_COLUMNS.defaultTemplateId]: data.defaultTemplateId || 0,
      [SECURITY_GROUP_MAPPINGS_COLUMNS.isActive]: data.isActive ?? true,
    };
    const result = await this.sp.web.lists
      .getByTitle(LIST_NAMES.SECURITY_GROUP_MAPPINGS).items.add(spItem);
    return this.mapToSecurityGroupMapping(result as Record<string, unknown>);
  }

  async updateSecurityGroupMapping(id: number, data: Partial<ISecurityGroupMapping>): Promise<ISecurityGroupMapping> {
    const updateData: Record<string, unknown> = {};
    if (data.securityGroupId !== undefined) updateData[SECURITY_GROUP_MAPPINGS_COLUMNS.securityGroupId] = data.securityGroupId;
    if (data.securityGroupName !== undefined) updateData[SECURITY_GROUP_MAPPINGS_COLUMNS.securityGroupName] = data.securityGroupName;
    if (data.defaultTemplateId !== undefined) updateData[SECURITY_GROUP_MAPPINGS_COLUMNS.defaultTemplateId] = data.defaultTemplateId;
    if (data.isActive !== undefined) updateData[SECURITY_GROUP_MAPPINGS_COLUMNS.isActive] = data.isActive;

    await this.sp.web.lists
      .getByTitle(LIST_NAMES.SECURITY_GROUP_MAPPINGS).items.getById(id).update(updateData);
    const updated = await this.sp.web.lists
      .getByTitle(LIST_NAMES.SECURITY_GROUP_MAPPINGS).items.getById(id)();
    return this.mapToSecurityGroupMapping(updated as Record<string, unknown>);
  }

  // --- Project Team Assignments ---
  async getProjectTeamAssignments(projectCode: string): Promise<IProjectTeamAssignment[]> {
    const col = PROJECT_TEAM_ASSIGNMENTS_COLUMNS;
    const items = await this.sp.web.lists
      .getByTitle(LIST_NAMES.PROJECT_TEAM_ASSIGNMENTS)
      .items.filter(`${col.projectCode} eq '${projectCode}' and ${col.isActive} eq 1`)();
    return (items as Record<string, unknown>[]).map(i => this.mapToProjectTeamAssignment(i));
  }

  async getMyProjectAssignments(userEmail: string): Promise<IProjectTeamAssignment[]> {
    const col = PROJECT_TEAM_ASSIGNMENTS_COLUMNS;
    const emailLower = userEmail.toLowerCase();
    // OData tolower for case-insensitive email matching
    const items = await this.sp.web.lists
      .getByTitle(LIST_NAMES.PROJECT_TEAM_ASSIGNMENTS)
      .items.filter(`tolower(${col.userEmail}) eq '${emailLower}' and ${col.isActive} eq 1`)();
    return (items as Record<string, unknown>[]).map(i => this.mapToProjectTeamAssignment(i));
  }

  async createProjectTeamAssignment(data: Partial<IProjectTeamAssignment>): Promise<IProjectTeamAssignment> {
    const col = PROJECT_TEAM_ASSIGNMENTS_COLUMNS;
    const now = new Date().toISOString();
    const spItem: Record<string, unknown> = {
      [col.projectCode]: data.projectCode || '',
      [col.userId]: data.userId || '',
      [col.userDisplayName]: data.userDisplayName || '',
      [col.userEmail]: data.userEmail || '',
      [col.assignedRole]: data.assignedRole || '',
      [col.templateOverrideId]: data.templateOverrideId || null,
      [col.granularFlagOverrides]: data.granularFlagOverrides ? JSON.stringify(data.granularFlagOverrides) : null,
      [col.assignedBy]: data.assignedBy || '',
      [col.assignedDate]: data.assignedDate || now,
      [col.isActive]: data.isActive ?? true,
    };
    const result = await this.sp.web.lists
      .getByTitle(LIST_NAMES.PROJECT_TEAM_ASSIGNMENTS).items.add(spItem);
    return this.mapToProjectTeamAssignment(result as Record<string, unknown>);
  }

  async updateProjectTeamAssignment(id: number, data: Partial<IProjectTeamAssignment>): Promise<IProjectTeamAssignment> {
    const col = PROJECT_TEAM_ASSIGNMENTS_COLUMNS;
    const updateData: Record<string, unknown> = {};
    if (data.projectCode !== undefined) updateData[col.projectCode] = data.projectCode;
    if (data.userId !== undefined) updateData[col.userId] = data.userId;
    if (data.userDisplayName !== undefined) updateData[col.userDisplayName] = data.userDisplayName;
    if (data.userEmail !== undefined) updateData[col.userEmail] = data.userEmail;
    if (data.assignedRole !== undefined) updateData[col.assignedRole] = data.assignedRole;
    if (data.templateOverrideId !== undefined) updateData[col.templateOverrideId] = data.templateOverrideId;
    if (data.granularFlagOverrides !== undefined) updateData[col.granularFlagOverrides] = JSON.stringify(data.granularFlagOverrides);
    if (data.isActive !== undefined) updateData[col.isActive] = data.isActive;

    await this.sp.web.lists
      .getByTitle(LIST_NAMES.PROJECT_TEAM_ASSIGNMENTS).items.getById(id).update(updateData);
    const updated = await this.sp.web.lists
      .getByTitle(LIST_NAMES.PROJECT_TEAM_ASSIGNMENTS).items.getById(id)();
    return this.mapToProjectTeamAssignment(updated as Record<string, unknown>);
  }

  async removeProjectTeamAssignment(id: number): Promise<void> {
    // Soft delete: set isActive to false
    await this.sp.web.lists
      .getByTitle(LIST_NAMES.PROJECT_TEAM_ASSIGNMENTS)
      .items.getById(id).update({ [PROJECT_TEAM_ASSIGNMENTS_COLUMNS.isActive]: false });
  }

  async getAllProjectTeamAssignments(): Promise<IProjectTeamAssignment[]> {
    const items = await this.sp.web.lists
      .getByTitle(LIST_NAMES.PROJECT_TEAM_ASSIGNMENTS)
      .items.filter(`${PROJECT_TEAM_ASSIGNMENTS_COLUMNS.isActive} eq 1`)();
    return (items as Record<string, unknown>[]).map(i => this.mapToProjectTeamAssignment(i));
  }

  async inviteToProjectSiteGroup(projectCode: string, userEmail: string, role: string): Promise<void> {
    // Fire-and-forget: add user to the project site's SP group by convention
    try {
      // Derive SP group name from role: Owners for PX/Exec, Members for most, Visitors for read-only
      const ownerRoles = ['Executive Leadership', 'Department Director'];
      const visitorRoles = ['Legal', 'Risk Management', 'Marketing', 'Quality Control', 'Safety'];
      let groupSuffix = 'Members';
      if (ownerRoles.includes(role)) groupSuffix = 'Owners';
      else if (visitorRoles.includes(role)) groupSuffix = 'Visitors';

      const groupName = `${projectCode} ${groupSuffix}`;
      const siteGroup = this.sp.web.siteGroups.getByName(groupName);
      await siteGroup.users.add(userEmail);
    } catch (err) {
      // Non-blocking — log but do not throw
      console.warn(`[SP] inviteToProjectSiteGroup failed for ${userEmail} on ${projectCode}:`, err);
    }
  }

  // --- Permission Resolution ---
  async resolveUserPermissions(userEmail: string, projectCode: string | null): Promise<IResolvedPermissions> {
    const email = userEmail.toLowerCase();

    // Step 1: Determine the user's security group → default template
    // Map roles to Azure AD security group names (same convention as MockDataService)
    const roleToGroupMap: Record<string, string> = {
      'Executive Leadership': 'HBC - Executive Leadership',
      'Department Director': 'HBC - Project Executives',
      'Operations Team': 'HBC - Project Managers',
      'Preconstruction Team': 'HBC - Estimating',
      'BD Representative': 'HBC - Business Development',
      'Estimating Coordinator': 'HBC - Estimating',
      'Accounting Manager': 'HBC - Accounting',
      'Legal': 'HBC - Read Only',
      'Risk Management': 'HBC - Read Only',
      'Marketing': 'HBC - Read Only',
      'Quality Control': 'HBC - Read Only',
      'Safety': 'HBC - Read Only',
      'IDS': 'HBC - Read Only',
      'SharePoint Admin': 'HBC - SharePoint Admins',
    };

    // Get user's roles from getCurrentUser
    const currentUser = await this.getCurrentUser();
    const userRoles = currentUser.roles;

    // Find the first matching security group mapping
    const securityGroupMappings = await this.getSecurityGroupMappings();
    let defaultTemplateId = 0;
    for (const role of userRoles) {
      const groupName = roleToGroupMap[role];
      if (!groupName) continue;
      const mapping = securityGroupMappings.find(m => m.securityGroupName === groupName && m.isActive);
      if (mapping) {
        defaultTemplateId = mapping.defaultTemplateId;
        break;
      }
    }

    // Fallback: find the Read-Only mapping as default
    if (!defaultTemplateId) {
      const readOnlyMapping = securityGroupMappings.find(m => m.securityGroupName === 'HBC - Read Only' && m.isActive);
      defaultTemplateId = readOnlyMapping?.defaultTemplateId || 0;
    }

    let templateId = defaultTemplateId;
    let source: 'SecurityGroupDefault' | 'ProjectOverride' | 'DirectAssignment' = 'SecurityGroupDefault';

    // Step 2: Check for project-level template override
    if (projectCode) {
      const col = PROJECT_TEAM_ASSIGNMENTS_COLUMNS;
      const assignments = await this.sp.web.lists
        .getByTitle(LIST_NAMES.PROJECT_TEAM_ASSIGNMENTS)
        .items.filter(`tolower(${col.userEmail}) eq '${email}' and ${col.projectCode} eq '${projectCode}' and ${col.isActive} eq 1`)();
      const assignment = assignments.length > 0 ? this.mapToProjectTeamAssignment(assignments[0] as Record<string, unknown>) : null;
      if (assignment?.templateOverrideId) {
        templateId = assignment.templateOverrideId;
        source = 'ProjectOverride';
      }
    }

    // Step 3: Load template
    const template = templateId ? await this.getPermissionTemplate(templateId) : null;
    if (!template) {
      return {
        userId: email,
        projectCode,
        templateId: 0,
        templateName: 'Unknown',
        source,
        toolLevels: {},
        granularFlags: {},
        permissions: new Set<string>(),
        globalAccess: false,
      };
    }

    // Step 4: Merge granular flag overrides from project assignment
    const toolAccess: IToolAccess[] = [...template.toolAccess];
    if (projectCode) {
      const col = PROJECT_TEAM_ASSIGNMENTS_COLUMNS;
      const assignments = await this.sp.web.lists
        .getByTitle(LIST_NAMES.PROJECT_TEAM_ASSIGNMENTS)
        .items.filter(`tolower(${col.userEmail}) eq '${email}' and ${col.projectCode} eq '${projectCode}' and ${col.isActive} eq 1`)();
      if (assignments.length > 0) {
        const assignment = this.mapToProjectTeamAssignment(assignments[0] as Record<string, unknown>);
        if (assignment.granularFlagOverrides) {
          for (const override of assignment.granularFlagOverrides) {
            const existingTool = toolAccess.find(ta => ta.toolKey === override.toolKey);
            if (existingTool) {
              existingTool.granularFlags = [
                ...(existingTool.granularFlags || []),
                ...override.flags,
              ];
            }
          }
        }
      }
    }

    // Step 5: Flatten to permission strings
    const permissionStrings = resolveToolPermissions(toolAccess, TOOL_DEFINITIONS);
    const permissions = new Set<string>(permissionStrings);

    // Build toolLevels and granularFlags maps
    const toolLevels: Record<string, PermissionLevel> = {};
    const granularFlags: Record<string, string[]> = {};
    for (const ta of toolAccess) {
      toolLevels[ta.toolKey] = ta.level;
      if (ta.granularFlags && ta.granularFlags.length > 0) {
        granularFlags[ta.toolKey] = ta.granularFlags;
      }
    }

    return {
      userId: email,
      projectCode,
      templateId: template.id,
      templateName: template.name,
      source,
      toolLevels,
      granularFlags,
      permissions,
      globalAccess: template.globalAccess,
    };
  }

  async getAccessibleProjects(userEmail: string): Promise<string[]> {
    const email = userEmail.toLowerCase();

    // Check if user has globalAccess via their template
    const resolved = await this.resolveUserPermissions(email, null);
    if (resolved.globalAccess) {
      // Return all project codes from Leads_Master that have project codes
      const items = await this.sp.web.lists
        .getByTitle(LIST_NAMES.LEADS_MASTER)
        .items.filter("ProjectCode ne null").select('ProjectCode').top(5000)();
      const codes = (items as Record<string, unknown>[])
        .map(i => i.ProjectCode as string)
        .filter(Boolean);
      return [...new Set(codes)];
    }

    // Otherwise return only assigned project codes
    const col = PROJECT_TEAM_ASSIGNMENTS_COLUMNS;
    const assignments = await this.sp.web.lists
      .getByTitle(LIST_NAMES.PROJECT_TEAM_ASSIGNMENTS)
      .items.filter(`tolower(${col.userEmail}) eq '${email}' and ${col.isActive} eq 1`)
      .select(col.projectCode)();
    const codes = (assignments as Record<string, unknown>[])
      .map(i => i[col.projectCode] as string)
      .filter(Boolean);
    return [...new Set(codes)];
  }

  // --- Environment Configuration ---
  async getEnvironmentConfig(): Promise<IEnvironmentConfig> {
    try {
      const items = await this.sp.web.lists.getByTitle(LIST_NAMES.APP_CONTEXT_CONFIG)
        .items.filter("SiteURL eq 'ENVIRONMENT_CONFIG'").select('AppTitle').top(1)();
      if (items.length > 0 && items[0].AppTitle) {
        return JSON.parse(items[0].AppTitle) as IEnvironmentConfig;
      }
    } catch {
      // Fallback to default
    }
    return {
      currentTier: 'prod' as EnvironmentTier,
      label: 'Production',
      color: '#10B981',
      isReadOnly: false,
      promotionHistory: [],
    };
  }

  async promoteTemplates(fromTier: EnvironmentTier, toTier: EnvironmentTier, promotedBy: string): Promise<void> {
    // Fetch all active templates
    const templates = await this.getPermissionTemplates();
    const activeTemplates = templates.filter(t => t.isActive);
    const now = new Date().toISOString();

    // Batch update each template: increment version, set promotedFromTier
    for (const template of activeTemplates) {
      await this.sp.web.lists
        .getByTitle(LIST_NAMES.PERMISSION_TEMPLATES)
        .items.getById(template.id)
        .update({
          Version: (template.version || 0) + 1,
          PromotedFromTier: fromTier,
          [PERMISSION_TEMPLATES_COLUMNS.lastModifiedBy]: promotedBy,
          [PERMISSION_TEMPLATES_COLUMNS.lastModifiedDate]: now,
        });
    }

    // Update environment config with promotion record
    const envConfig = await this.getEnvironmentConfig();
    const promotionRecord = {
      fromTier,
      toTier,
      promotedBy,
      promotedDate: now,
      templateCount: activeTemplates.length,
    };
    envConfig.promotionHistory = [...(envConfig.promotionHistory || []), promotionRecord];
    envConfig.currentTier = toTier;

    // Write back config
    try {
      const items = await this.sp.web.lists.getByTitle(LIST_NAMES.APP_CONTEXT_CONFIG)
        .items.filter("SiteURL eq 'ENVIRONMENT_CONFIG'").top(1)();
      if (items.length > 0) {
        await this.sp.web.lists.getByTitle(LIST_NAMES.APP_CONTEXT_CONFIG)
          .items.getById(items[0].Id).update({ AppTitle: JSON.stringify(envConfig) });
      } else {
        await this.sp.web.lists.getByTitle(LIST_NAMES.APP_CONTEXT_CONFIG)
          .items.add({ SiteURL: 'ENVIRONMENT_CONFIG', AppTitle: JSON.stringify(envConfig) });
      }
    } catch (err) {
      console.error('[SP] Failed to update environment config after promotion:', err);
    }
  }

  // --- Sector Definitions ---
  async getSectorDefinitions(): Promise<import('../models/ISectorDefinition').ISectorDefinition[]> { console.warn('[STUB] getSectorDefinitions not implemented'); return []; }
  async createSectorDefinition(_data: Partial<import('../models/ISectorDefinition').ISectorDefinition>): Promise<import('../models/ISectorDefinition').ISectorDefinition> { throw new Error('SharePoint implementation pending: createSectorDefinition'); }
  async updateSectorDefinition(_id: number, _data: Partial<import('../models/ISectorDefinition').ISectorDefinition>): Promise<import('../models/ISectorDefinition').ISectorDefinition> { throw new Error('SharePoint implementation pending: updateSectorDefinition'); }

  // --- BD Leads Folder Operations ---

  /**
   * Creates a BD Leads folder structure on the PX Portfolio Dashboard site.
   * Folder hierarchy: BD Leads / {year} / {leadTitle} - {originatorName} / {9 subfolders}
   * Uses Web() factory for cross-site access (SPFx tokens are tenant-scoped).
   */
  async createBdLeadFolder(leadTitle: string, originatorName: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Web } = require('@pnp/sp/webs');
    const bdWeb = Web([this.sp.web, BD_LEADS_SITE_URL]);
    const libraryRoot = bdWeb.lists.getByTitle(BD_LEADS_LIBRARY).rootFolder;

    const year = new Date().getFullYear().toString();
    const leadFolderName = `${leadTitle} - ${originatorName}`;

    // Ensure year folder exists (ignore if already exists)
    try { await libraryRoot.folders.addUsingPath(year); } catch { /* already exists */ }
    // Create lead folder
    const yearFolder = libraryRoot.folders.getByUrl(year);
    await yearFolder.folders.addUsingPath(leadFolderName);
    // Create 9 subfolders
    const leadFolder = yearFolder.folders.getByUrl(leadFolderName);
    for (const sub of BD_LEADS_SUBFOLDERS) {
      try { await leadFolder.folders.addUsingPath(sub); } catch (err) {
        console.warn(`[SP] Failed to create subfolder "${sub}":`, err);
      }
    }
  }

  async checkFolderExists(path: string): Promise<boolean> {
    try {
      if (path.startsWith(BD_LEADS_LIBRARY)) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Web } = require('@pnp/sp/webs');
        const bdWeb = Web([this.sp.web, BD_LEADS_SITE_URL]);
        const relativePath = path.substring(BD_LEADS_LIBRARY.length + 1);
        await bdWeb.lists.getByTitle(BD_LEADS_LIBRARY).rootFolder
          .folders.getByUrl(relativePath).select('Exists')();
        return true;
      }
      await this.sp.web.getFolderByServerRelativePath(path).select('Exists')();
      return true;
    } catch { return false; }
  }

  async createFolder(path: string): Promise<void> {
    if (path.startsWith(BD_LEADS_LIBRARY)) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Web } = require('@pnp/sp/webs');
      const bdWeb = Web([this.sp.web, BD_LEADS_SITE_URL]);
      const relativePath = path.substring(BD_LEADS_LIBRARY.length + 1);
      const segments = relativePath.split('/');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let currentFolder: any = bdWeb.lists.getByTitle(BD_LEADS_LIBRARY).rootFolder;
      for (const segment of segments) {
        try { await currentFolder.folders.addUsingPath(segment); } catch { /* already exists */ }
        currentFolder = currentFolder.folders.getByUrl(segment);
      }
    } else {
      await this.sp.web.folders.addUsingPath(path);
    }
  }

  async renameFolder(oldPath: string, newPath: string): Promise<void> {
    if (oldPath.startsWith(BD_LEADS_LIBRARY)) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Web } = require('@pnp/sp/webs');
      const bdWeb = Web([this.sp.web, BD_LEADS_SITE_URL]);
      const siteInfo = await bdWeb.select('ServerRelativeUrl')();
      const oldServerPath = `${siteInfo.ServerRelativeUrl}/${oldPath}`;
      const newServerPath = `${siteInfo.ServerRelativeUrl}/${newPath}`;
      await bdWeb.getFolderByServerRelativePath(oldServerPath).moveByPath(newServerPath, false);
    } else {
      await this.sp.web.getFolderByServerRelativePath(oldPath).moveByPath(newPath, false);
    }
  }

  // --- Assignment Mappings ---
  async getAssignmentMappings(): Promise<import('../models/IAssignmentMapping').IAssignmentMapping[]> { console.warn('[STUB] getAssignmentMappings not implemented'); return []; }
  async createAssignmentMapping(_data: Partial<import('../models/IAssignmentMapping').IAssignmentMapping>): Promise<import('../models/IAssignmentMapping').IAssignmentMapping> { throw new Error('SharePoint implementation pending: createAssignmentMapping'); }
  async updateAssignmentMapping(_id: number, _data: Partial<import('../models/IAssignmentMapping').IAssignmentMapping>): Promise<import('../models/IAssignmentMapping').IAssignmentMapping> { throw new Error('SharePoint implementation pending: updateAssignmentMapping'); }
  async deleteAssignmentMapping(_id: number): Promise<void> { throw new Error('SharePoint implementation pending: deleteAssignmentMapping'); }

  // --- Scorecard Reject / Archive ---
  async rejectScorecard(_scorecardId: number, _reason: string): Promise<IGoNoGoScorecard> { throw new Error('SharePoint implementation pending: rejectScorecard'); }
  async archiveScorecard(_scorecardId: number, _archivedBy: string): Promise<IGoNoGoScorecard> { throw new Error('SharePoint implementation pending: archiveScorecard'); }

  // --- Project Site URL Targeting ---
  private _projectSiteUrl: string | null = null;

  public setProjectSiteUrl(siteUrl: string | null): void {
    this._projectSiteUrl = siteUrl;
    // When PnP project-web methods are implemented, this will create
    // a new SPFI web instance: this._projectWeb = Web([this.sp.web, siteUrl])
  }
}

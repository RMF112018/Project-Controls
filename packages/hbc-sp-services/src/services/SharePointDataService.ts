import { IDataService, IListQueryOptions, IPagedResult, IActiveProjectsQueryOptions, IActiveProjectsFilter } from './IDataService';
import { ILead, ILeadFormData } from '../models/ILead';
import { IGoNoGoScorecard, IScorecardApprovalCycle, IScorecardApprovalStep, IScorecardVersion } from '../models/IGoNoGoScorecard';
import { IEstimatingTracker } from '../models/IEstimatingTracker';
import { IRole, ICurrentUser } from '../models/IRole';
import { IFeatureFlag } from '../models/IFeatureFlag';
import { IMeeting, ICalendarAvailability } from '../models/IMeeting';
import { INotification } from '../models/INotification';
import { IAuditEntry } from '../models/IAuditEntry';
import { IProvisioningLog } from '../models/IProvisioningLog';
import { IStartupChecklistItem, IChecklistActivityEntry } from '../models/IStartupChecklist';
import { IInternalMatrixTask, ITeamRoleAssignment, IOwnerContractArticle, ISubContractClause } from '../models/IResponsibilityMatrix';
import { IMarketingProjectRecord } from '../models/IMarketingProjectRecord';
import { IRiskCostManagement, IRiskCostItem } from '../models/IRiskCostManagement';
import { IQualityConcern } from '../models/IQualityConcerns';
import { ISafetyConcern } from '../models/ISafetyConcerns';
import { IProjectScheduleCriticalPath, ICriticalPathItem } from '../models/IProjectScheduleCriticalPath';
import { ISuperintendentPlan, ISuperintendentPlanSection } from '../models/ISuperintendentPlan';
import { ILessonLearned } from '../models/ILessonsLearned';
import { IProjectManagementPlan, IPMPSignature, IPMPApprovalCycle, IPMPApprovalStep, IDivisionApprover, IPMPBoilerplateSection } from '../models/IProjectManagementPlan';
import { IMonthlyProjectReview, IMonthlyChecklistItem, IMonthlyFollowUp } from '../models/IMonthlyProjectReview';
import { IEstimatingKickoff, IEstimatingKickoffItem, IKeyPersonnelEntry } from '../models/IEstimatingKickoff';
import { IJobNumberRequest, JobNumberRequestStatus } from '../models/IJobNumberRequest';
import { IProjectType } from '../models/IProjectType';
import { IStandardCostCode } from '../models/IStandardCostCode';
import { IBuyoutEntry, BuyoutStatus, EVerifyStatus } from '../models/IBuyoutEntry';
import { ICommitmentApproval, CommitmentStatus, WaiverType, ApprovalStep } from '../models/ICommitmentApproval';
import { IActiveProject, IPortfolioSummary, IPersonnelWorkload, ProjectStatus, SectorType, DEFAULT_ALERT_THRESHOLDS } from '../models/IActiveProject';
import { IComplianceEntry, IComplianceSummary, IComplianceLogFilter } from '../models/IComplianceSummary';
import { IWorkflowDefinition, IWorkflowStep, IConditionalAssignment, IWorkflowStepOverride, IResolvedWorkflowStep, IPersonAssignment, IAssignmentCondition } from '../models/IWorkflowDefinition';
import { ITurnoverAgenda, ITurnoverProjectHeader, ITurnoverPrerequisite, ITurnoverDiscussionItem, ITurnoverSubcontractor, ITurnoverExhibit, ITurnoverSignature, ITurnoverEstimateOverview, ITurnoverAttachment } from '../models/ITurnoverAgenda';
import { IActionInboxItem } from '../models/IActionInbox';
import { ISectorDefinition } from '../models/ISectorDefinition';
import { IAssignmentMapping } from '../models/IAssignmentMapping';
import { IPermissionTemplate, ISecurityGroupMapping, IProjectTeamAssignment, IResolvedPermissions, IToolAccess, IGranularFlagOverride } from '../models/IPermissionTemplate';
import { IEnvironmentConfig, EnvironmentTier } from '../models/IEnvironmentConfig';
import { IPerformanceLog, IPerformanceQueryOptions, IPerformanceSummary } from '../models/IPerformanceLog';
import { IHelpGuide, ISupportConfig } from '../models/IHelpGuide';
import { GoNoGoDecision, Stage, RoleName, WorkflowKey, PermissionLevel, StepAssignmentType, ConditionField, TurnoverStatus, ScorecardStatus, WorkflowActionType, ActionPriority, AuditAction, EntityType } from '../models/enums';
import { LIST_NAMES } from '../utils/constants';
import { ROLE_PERMISSIONS } from '../utils/permissions';
import { resolveToolPermissions, TOOL_DEFINITIONS } from '../utils/toolPermissionMap';
import { STANDARD_BUYOUT_DIVISIONS } from '../utils/buyoutTemplate';
import { DEFAULT_PREREQUISITES, DEFAULT_DISCUSSION_ITEMS, DEFAULT_EXHIBITS, DEFAULT_SIGNATURES, TURNOVER_SIGNATURE_AFFIDAVIT } from '../utils/turnoverAgendaTemplate';
import { calculateTotalScore, getRecommendedDecision } from '../utils/scoreCalculator';
import {
  PERMISSION_TEMPLATES_COLUMNS,
  SECURITY_GROUP_MAPPINGS_COLUMNS,
  PROJECT_TEAM_ASSIGNMENTS_COLUMNS,
  PROVISIONING_LOG_COLUMNS,
  WORKFLOW_DEFINITIONS_COLUMNS,
  WORKFLOW_STEPS_COLUMNS,
  WORKFLOW_CONDITIONAL_ASSIGNMENTS_COLUMNS,
  WORKFLOW_STEP_OVERRIDES_COLUMNS,
  STARTUP_CHECKLIST_COLUMNS,
  CHECKLIST_ACTIVITY_LOG_COLUMNS,
  INTERNAL_MATRIX_COLUMNS,
  TEAM_ROLE_ASSIGNMENTS_COLUMNS,
  OWNER_CONTRACT_MATRIX_COLUMNS,
  SUB_CONTRACT_MATRIX_COLUMNS,
  MARKETING_PROJECT_RECORDS_COLUMNS,
  RISK_COST_MANAGEMENT_COLUMNS,
  RISK_COST_ITEMS_COLUMNS,
  QUALITY_CONCERNS_COLUMNS,
  SAFETY_CONCERNS_COLUMNS,
  PROJECT_SCHEDULE_COLUMNS,
  CRITICAL_PATH_ITEMS_COLUMNS,
  SUPERINTENDENT_PLAN_COLUMNS,
  SUPERINTENDENT_PLAN_SECTIONS_COLUMNS,
  LESSONS_LEARNED_COLUMNS,
  ESTIMATING_KICKOFFS_COLUMNS,
  ESTIMATING_KICKOFF_ITEMS_COLUMNS,
  JOB_NUMBER_REQUESTS_COLUMNS,
  PROJECT_TYPES_COLUMNS,
  STANDARD_COST_CODES_COLUMNS,
  SECTOR_DEFINITIONS_COLUMNS,
  ASSIGNMENT_MAPPINGS_COLUMNS,
  PMP_COLUMNS,
  PMP_SIGNATURES_COLUMNS,
  PMP_APPROVAL_CYCLES_COLUMNS,
  PMP_APPROVAL_STEPS_COLUMNS,
  DIVISION_APPROVERS_COLUMNS,
  PMP_BOILERPLATE_COLUMNS,
  MONTHLY_REVIEWS_COLUMNS,
  MONTHLY_CHECKLIST_ITEMS_COLUMNS,
  MONTHLY_FOLLOW_UPS_COLUMNS,
  TURNOVER_AGENDAS_COLUMNS,
  TURNOVER_PREREQUISITES_COLUMNS,
  TURNOVER_DISCUSSION_ITEMS_COLUMNS,
  TURNOVER_SUBCONTRACTORS_COLUMNS,
  TURNOVER_EXHIBITS_COLUMNS,
  TURNOVER_SIGNATURES_COLUMNS,
  TURNOVER_ATTACHMENTS_COLUMNS,
  TURNOVER_ESTIMATE_OVERVIEWS_COLUMNS,
  GONOGO_SCORECARD_COLUMNS,
  SCORECARD_APPROVAL_CYCLES_COLUMNS,
  SCORECARD_APPROVAL_STEPS_COLUMNS,
  SCORECARD_VERSIONS_COLUMNS,
  PERFORMANCE_LOGS_COLUMNS,
  HELP_GUIDES_COLUMNS,
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

  // ═══════════════════════════════════════════════════════════════════
  // ──── Startup Checklist (Project Site) ────
  // ═══════════════════════════════════════════════════════════════════

  async getStartupChecklist(projectCode: string): Promise<IStartupChecklistItem[]> {
    const web = this._getProjectWeb();
    const col = STARTUP_CHECKLIST_COLUMNS;
    const actCol = CHECKLIST_ACTIVITY_LOG_COLUMNS;

    // Read checklist items and activity log in parallel
    const [items, activityItems] = await Promise.all([
      web.lists.getByTitle(LIST_NAMES.STARTUP_CHECKLIST).items
        .filter(`${col.projectCode} eq '${projectCode}'`)
        .orderBy(col.sortOrder, true)
        .top(500)(),
      web.lists.getByTitle(LIST_NAMES.CHECKLIST_ACTIVITY_LOG).items
        .filter(`${actCol.projectCode} eq '${projectCode}'`)
        .top(5000)(),
    ]);

    // Group activity entries by checklistItemId
    const activityMap = new Map<number, IChecklistActivityEntry[]>();
    for (const a of activityItems) {
      const entry = this.mapToChecklistActivityEntry(a);
      const key = entry.checklistItemId || 0;
      if (!activityMap.has(key)) activityMap.set(key, []);
      activityMap.get(key)!.push(entry);
    }

    return items.map((item: Record<string, unknown>) => this.mapToStartupChecklistItem(item, activityMap.get(item.Id as number)));
  }

  async updateChecklistItem(projectCode: string, itemId: number, data: Partial<IStartupChecklistItem>): Promise<IStartupChecklistItem> {
    const web = this._getProjectWeb();
    const col = STARTUP_CHECKLIST_COLUMNS;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (data.response !== undefined) updateData[col.response] = data.response;
    if (data.status !== undefined) updateData[col.status] = data.status;
    if (data.respondedBy !== undefined) updateData[col.respondedBy] = data.respondedBy;
    if (data.respondedDate !== undefined) updateData[col.respondedDate] = data.respondedDate;
    if (data.assignedTo !== undefined) updateData[col.assignedTo] = data.assignedTo;
    if (data.assignedToName !== undefined) updateData[col.assignedToName] = data.assignedToName;
    if (data.comment !== undefined) updateData[col.comment] = data.comment;
    if (data.isHidden !== undefined) updateData[col.isHidden] = data.isHidden;
    if (data.label !== undefined) updateData[col.label] = data.label;
    if (data.sortOrder !== undefined) updateData[col.sortOrder] = data.sortOrder;

    await web.lists.getByTitle(LIST_NAMES.STARTUP_CHECKLIST).items.getById(itemId).update(updateData);

    // If there's activity log data to write, add it
    if (data.activityLog && data.activityLog.length > 0) {
      const actCol = CHECKLIST_ACTIVITY_LOG_COLUMNS;
      const latestEntry = data.activityLog[data.activityLog.length - 1];
      await web.lists.getByTitle(LIST_NAMES.CHECKLIST_ACTIVITY_LOG).items.add({
        [actCol.checklistItemId]: itemId,
        [actCol.projectCode]: projectCode,
        [actCol.timestamp]: latestEntry.timestamp,
        [actCol.user]: latestEntry.user,
        [actCol.previousValue]: latestEntry.previousValue,
        [actCol.newValue]: latestEntry.newValue,
        [actCol.comment]: latestEntry.comment || null,
      });
    }

    // Re-read the updated item
    const updated = await web.lists.getByTitle(LIST_NAMES.STARTUP_CHECKLIST).items.getById(itemId)();
    const actItems = await web.lists.getByTitle(LIST_NAMES.CHECKLIST_ACTIVITY_LOG).items
      .filter(`${CHECKLIST_ACTIVITY_LOG_COLUMNS.checklistItemId} eq ${itemId}`)();
    return this.mapToStartupChecklistItem(updated, actItems.map((a: Record<string, unknown>) => this.mapToChecklistActivityEntry(a)));
  }

  async addChecklistItem(projectCode: string, item: Partial<IStartupChecklistItem>): Promise<IStartupChecklistItem> {
    const web = this._getProjectWeb();
    const col = STARTUP_CHECKLIST_COLUMNS;
    const addData = {
      [col.projectCode]: projectCode,
      [col.sectionNumber]: item.sectionNumber || 0,
      [col.sectionName]: item.sectionName || '',
      [col.itemNumber]: item.itemNumber || '',
      [col.label]: item.label || '',
      [col.responseType]: item.responseType || 'yesNoNA',
      [col.response]: item.response ?? null,
      [col.status]: item.status || 'NoResponse',
      [col.respondedBy]: item.respondedBy || null,
      [col.respondedDate]: item.respondedDate || null,
      [col.assignedTo]: item.assignedTo || null,
      [col.assignedToName]: item.assignedToName || null,
      [col.comment]: item.comment || null,
      [col.isHidden]: item.isHidden || false,
      [col.isCustom]: item.isCustom ?? true,
      [col.sortOrder]: item.sortOrder || 0,
    };
    const result = await web.lists.getByTitle(LIST_NAMES.STARTUP_CHECKLIST).items.add(addData);
    return this.mapToStartupChecklistItem(result, []);
  }

  async removeChecklistItem(_projectCode: string, itemId: number): Promise<void> {
    const web = this._getProjectWeb();
    await web.lists.getByTitle(LIST_NAMES.STARTUP_CHECKLIST).items.getById(itemId).recycle();
  }

  // ═══════════════════════════════════════════════════════════════════
  // ──── Internal Matrix (Project Site) ────
  // ═══════════════════════════════════════════════════════════════════

  async getInternalMatrix(projectCode: string): Promise<IInternalMatrixTask[]> {
    const web = this._getProjectWeb();
    const col = INTERNAL_MATRIX_COLUMNS;
    const items = await web.lists.getByTitle(LIST_NAMES.INTERNAL_MATRIX).items
      .filter(`${col.projectCode} eq '${projectCode}'`)
      .orderBy(col.sortOrder, true)
      .top(500)();
    return items.map((item: Record<string, unknown>) => this.mapToInternalMatrixTask(item));
  }

  async updateInternalMatrixTask(projectCode: string, taskId: number, data: Partial<IInternalMatrixTask>): Promise<IInternalMatrixTask> {
    const web = this._getProjectWeb();
    const col = INTERNAL_MATRIX_COLUMNS;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (data.sortOrder !== undefined) updateData[col.sortOrder] = data.sortOrder;
    if (data.taskCategory !== undefined) updateData[col.taskCategory] = data.taskCategory;
    if (data.taskDescription !== undefined) updateData[col.taskDescription] = data.taskDescription;
    if (data.PX !== undefined) updateData[col.PX] = data.PX;
    if (data.SrPM !== undefined) updateData[col.SrPM] = data.SrPM;
    if (data.PM2 !== undefined) updateData[col.PM2] = data.PM2;
    if (data.PM1 !== undefined) updateData[col.PM1] = data.PM1;
    if (data.PA !== undefined) updateData[col.PA] = data.PA;
    if (data.QAQC !== undefined) updateData[col.QAQC] = data.QAQC;
    if (data.ProjAcct !== undefined) updateData[col.ProjAcct] = data.ProjAcct;
    if (data.isHidden !== undefined) updateData[col.isHidden] = data.isHidden;
    if (data.isCustom !== undefined) updateData[col.isCustom] = data.isCustom;

    await web.lists.getByTitle(LIST_NAMES.INTERNAL_MATRIX).items.getById(taskId).update(updateData);
    const updated = await web.lists.getByTitle(LIST_NAMES.INTERNAL_MATRIX).items.getById(taskId)();
    return this.mapToInternalMatrixTask(updated);
  }

  async addInternalMatrixTask(projectCode: string, task: Partial<IInternalMatrixTask>): Promise<IInternalMatrixTask> {
    const web = this._getProjectWeb();
    const col = INTERNAL_MATRIX_COLUMNS;
    const addData = {
      [col.projectCode]: projectCode,
      [col.sortOrder]: task.sortOrder || 0,
      [col.taskCategory]: task.taskCategory || '',
      [col.taskDescription]: task.taskDescription || '',
      [col.PX]: task.PX || '',
      [col.SrPM]: task.SrPM || '',
      [col.PM2]: task.PM2 || '',
      [col.PM1]: task.PM1 || '',
      [col.PA]: task.PA || '',
      [col.QAQC]: task.QAQC || '',
      [col.ProjAcct]: task.ProjAcct || '',
      [col.isHidden]: task.isHidden || false,
      [col.isCustom]: task.isCustom ?? true,
    };
    const result = await web.lists.getByTitle(LIST_NAMES.INTERNAL_MATRIX).items.add(addData);
    return this.mapToInternalMatrixTask(result);
  }

  async removeInternalMatrixTask(_projectCode: string, taskId: number): Promise<void> {
    const web = this._getProjectWeb();
    await web.lists.getByTitle(LIST_NAMES.INTERNAL_MATRIX).items.getById(taskId).recycle();
  }

  // ═══════════════════════════════════════════════════════════════════
  // ──── Team Role Assignments (Project Site) ────
  // ═══════════════════════════════════════════════════════════════════

  async getTeamRoleAssignments(projectCode: string): Promise<ITeamRoleAssignment[]> {
    const web = this._getProjectWeb();
    const col = TEAM_ROLE_ASSIGNMENTS_COLUMNS;
    const items = await web.lists.getByTitle(LIST_NAMES.TEAM_ROLE_ASSIGNMENTS).items
      .filter(`${col.projectCode} eq '${projectCode}'`)
      .top(100)();
    return items.map((item: Record<string, unknown>) => ({
      projectCode: (item[col.projectCode] as string) || '',
      roleAbbreviation: (item[col.roleAbbreviation] as string) || '',
      assignedPerson: (item[col.assignedPerson] as string) || '',
      assignedPersonEmail: (item[col.assignedPersonEmail] as string) || '',
    }));
  }

  async updateTeamRoleAssignment(projectCode: string, role: string, person: string, email?: string): Promise<ITeamRoleAssignment> {
    const web = this._getProjectWeb();
    const col = TEAM_ROLE_ASSIGNMENTS_COLUMNS;
    const listTitle = LIST_NAMES.TEAM_ROLE_ASSIGNMENTS;

    // Upsert: check if record exists for this projectCode + role
    const existing = await web.lists.getByTitle(listTitle).items
      .filter(`${col.projectCode} eq '${projectCode}' and ${col.roleAbbreviation} eq '${role}'`)
      .top(1)();

    if (existing.length > 0) {
      // Update existing
      const itemId = existing[0].Id as number;
      await web.lists.getByTitle(listTitle).items.getById(itemId).update({
        [col.assignedPerson]: person,
        [col.assignedPersonEmail]: email || '',
      });
    } else {
      // Create new
      await web.lists.getByTitle(listTitle).items.add({
        [col.projectCode]: projectCode,
        [col.roleAbbreviation]: role,
        [col.assignedPerson]: person,
        [col.assignedPersonEmail]: email || '',
      });
    }

    return { projectCode, roleAbbreviation: role, assignedPerson: person, assignedPersonEmail: email || '' };
  }

  // ═══════════════════════════════════════════════════════════════════
  // ──── Owner Contract Matrix (Project Site) ────
  // ═══════════════════════════════════════════════════════════════════

  async getOwnerContractMatrix(projectCode: string): Promise<IOwnerContractArticle[]> {
    const web = this._getProjectWeb();
    const col = OWNER_CONTRACT_MATRIX_COLUMNS;
    const items = await web.lists.getByTitle(LIST_NAMES.OWNER_CONTRACT_MATRIX).items
      .filter(`${col.projectCode} eq '${projectCode}'`)
      .orderBy(col.sortOrder, true)
      .top(500)();
    return items.map((item: Record<string, unknown>) => this.mapToOwnerContractArticle(item));
  }

  async updateOwnerContractArticle(projectCode: string, itemId: number, data: Partial<IOwnerContractArticle>): Promise<IOwnerContractArticle> {
    const web = this._getProjectWeb();
    const col = OWNER_CONTRACT_MATRIX_COLUMNS;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (data.sortOrder !== undefined) updateData[col.sortOrder] = data.sortOrder;
    if (data.articleNumber !== undefined) updateData[col.articleNumber] = data.articleNumber;
    if (data.pageNumber !== undefined) updateData[col.pageNumber] = data.pageNumber;
    if (data.responsibleParty !== undefined) updateData[col.responsibleParty] = data.responsibleParty;
    if (data.description !== undefined) updateData[col.description] = data.description;
    if (data.isHidden !== undefined) updateData[col.isHidden] = data.isHidden;
    if (data.isCustom !== undefined) updateData[col.isCustom] = data.isCustom;

    await web.lists.getByTitle(LIST_NAMES.OWNER_CONTRACT_MATRIX).items.getById(itemId).update(updateData);
    const updated = await web.lists.getByTitle(LIST_NAMES.OWNER_CONTRACT_MATRIX).items.getById(itemId)();
    return this.mapToOwnerContractArticle(updated);
  }

  async addOwnerContractArticle(projectCode: string, item: Partial<IOwnerContractArticle>): Promise<IOwnerContractArticle> {
    const web = this._getProjectWeb();
    const col = OWNER_CONTRACT_MATRIX_COLUMNS;
    const addData = {
      [col.projectCode]: projectCode,
      [col.sortOrder]: item.sortOrder || 0,
      [col.articleNumber]: item.articleNumber || '',
      [col.pageNumber]: item.pageNumber || '',
      [col.responsibleParty]: item.responsibleParty || '',
      [col.description]: item.description || '',
      [col.isHidden]: item.isHidden || false,
      [col.isCustom]: item.isCustom ?? true,
    };
    const result = await web.lists.getByTitle(LIST_NAMES.OWNER_CONTRACT_MATRIX).items.add(addData);
    return this.mapToOwnerContractArticle(result);
  }

  async removeOwnerContractArticle(_projectCode: string, itemId: number): Promise<void> {
    const web = this._getProjectWeb();
    await web.lists.getByTitle(LIST_NAMES.OWNER_CONTRACT_MATRIX).items.getById(itemId).recycle();
  }

  // ═══════════════════════════════════════════════════════════════════
  // ──── Sub-Contract Matrix (Project Site) ────
  // ═══════════════════════════════════════════════════════════════════

  async getSubContractMatrix(projectCode: string): Promise<ISubContractClause[]> {
    const web = this._getProjectWeb();
    const col = SUB_CONTRACT_MATRIX_COLUMNS;
    const items = await web.lists.getByTitle(LIST_NAMES.SUB_CONTRACT_MATRIX).items
      .filter(`${col.projectCode} eq '${projectCode}'`)
      .orderBy(col.sortOrder, true)
      .top(500)();
    return items.map((item: Record<string, unknown>) => this.mapToSubContractClause(item));
  }

  async updateSubContractClause(projectCode: string, itemId: number, data: Partial<ISubContractClause>): Promise<ISubContractClause> {
    const web = this._getProjectWeb();
    const col = SUB_CONTRACT_MATRIX_COLUMNS;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (data.sortOrder !== undefined) updateData[col.sortOrder] = data.sortOrder;
    if (data.refNumber !== undefined) updateData[col.refNumber] = data.refNumber;
    if (data.pageNumber !== undefined) updateData[col.pageNumber] = data.pageNumber;
    if (data.clauseDescription !== undefined) updateData[col.clauseDescription] = data.clauseDescription;
    if (data.ProjExec !== undefined) updateData[col.ProjExec] = data.ProjExec;
    if (data.ProjMgr !== undefined) updateData[col.ProjMgr] = data.ProjMgr;
    if (data.AsstPM !== undefined) updateData[col.AsstPM] = data.AsstPM;
    if (data.Super !== undefined) updateData[col.Super] = data.Super;
    if (data.ProjAdmin !== undefined) updateData[col.ProjAdmin] = data.ProjAdmin;
    if (data.isHidden !== undefined) updateData[col.isHidden] = data.isHidden;
    if (data.isCustom !== undefined) updateData[col.isCustom] = data.isCustom;

    await web.lists.getByTitle(LIST_NAMES.SUB_CONTRACT_MATRIX).items.getById(itemId).update(updateData);
    const updated = await web.lists.getByTitle(LIST_NAMES.SUB_CONTRACT_MATRIX).items.getById(itemId)();
    return this.mapToSubContractClause(updated);
  }

  async addSubContractClause(projectCode: string, item: Partial<ISubContractClause>): Promise<ISubContractClause> {
    const web = this._getProjectWeb();
    const col = SUB_CONTRACT_MATRIX_COLUMNS;
    const addData = {
      [col.projectCode]: projectCode,
      [col.sortOrder]: item.sortOrder || 0,
      [col.refNumber]: item.refNumber || '',
      [col.pageNumber]: item.pageNumber || '',
      [col.clauseDescription]: item.clauseDescription || '',
      [col.ProjExec]: item.ProjExec || '',
      [col.ProjMgr]: item.ProjMgr || '',
      [col.AsstPM]: item.AsstPM || '',
      [col.Super]: item.Super || '',
      [col.ProjAdmin]: item.ProjAdmin || '',
      [col.isHidden]: item.isHidden || false,
      [col.isCustom]: item.isCustom ?? true,
    };
    const result = await web.lists.getByTitle(LIST_NAMES.SUB_CONTRACT_MATRIX).items.add(addData);
    return this.mapToSubContractClause(result);
  }

  async removeSubContractClause(_projectCode: string, itemId: number): Promise<void> {
    const web = this._getProjectWeb();
    await web.lists.getByTitle(LIST_NAMES.SUB_CONTRACT_MATRIX).items.getById(itemId).recycle();
  }

  // ═══════════════════════════════════════════════════════════════════
  // ──── Marketing Project Records (Hub Site) ────
  // ═══════════════════════════════════════════════════════════════════

  async getMarketingProjectRecord(projectCode: string): Promise<IMarketingProjectRecord | null> {
    const col = MARKETING_PROJECT_RECORDS_COLUMNS;
    try {
      const items = await this.sp.web.lists.getByTitle(LIST_NAMES.MARKETING_PROJECT_RECORDS).items
        .filter(`${col.projectCode} eq '${projectCode}'`)
        .top(1)();
      if (items.length === 0) return null;
      return this.mapToMarketingProjectRecord(items[0]);
    } catch {
      return null;
    }
  }

  async createMarketingProjectRecord(data: Partial<IMarketingProjectRecord>): Promise<IMarketingProjectRecord> {
    const addData = this.buildMarketingUpdateData(data);
    const result = await this.sp.web.lists.getByTitle(LIST_NAMES.MARKETING_PROJECT_RECORDS).items.add(addData);
    return this.mapToMarketingProjectRecord(result);
  }

  async updateMarketingProjectRecord(projectCode: string, data: Partial<IMarketingProjectRecord>): Promise<IMarketingProjectRecord> {
    const col = MARKETING_PROJECT_RECORDS_COLUMNS;
    // Find existing item by projectCode
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.MARKETING_PROJECT_RECORDS).items
      .filter(`${col.projectCode} eq '${projectCode}'`)
      .top(1)();
    if (items.length === 0) throw new Error(`Marketing project record not found for projectCode: ${projectCode}`);
    const itemId = items[0].Id as number;

    const updateData = this.buildMarketingUpdateData(data);
    await this.sp.web.lists.getByTitle(LIST_NAMES.MARKETING_PROJECT_RECORDS).items.getById(itemId).update(updateData);
    const updated = await this.sp.web.lists.getByTitle(LIST_NAMES.MARKETING_PROJECT_RECORDS).items.getById(itemId)();
    return this.mapToMarketingProjectRecord(updated);
  }

  async getAllMarketingProjectRecords(): Promise<IMarketingProjectRecord[]> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.MARKETING_PROJECT_RECORDS).items
      .top(500)();
    return items.map((item: Record<string, unknown>) => this.mapToMarketingProjectRecord(item));
  }

  // --- Risk & Cost ---

  async getRiskCostManagement(projectCode: string): Promise<IRiskCostManagement | null> {
    const web = this._getProjectWeb();
    const col = RISK_COST_MANAGEMENT_COLUMNS;
    const itemCol = RISK_COST_ITEMS_COLUMNS;

    const [parents, items] = await Promise.all([
      web.lists.getByTitle(LIST_NAMES.RISK_COST_MANAGEMENT).items
        .filter(`${col.projectCode} eq '${projectCode}'`)
        .top(1)(),
      web.lists.getByTitle(LIST_NAMES.RISK_COST_ITEMS).items
        .filter(`${itemCol.projectCode} eq '${projectCode}'`)
        .top(500)(),
    ]);

    if (parents.length === 0) return null;

    const parent = this.mapToRiskCostManagement(parents[0]);
    const mappedItems = items.map((i: Record<string, unknown>) => this.mapToRiskCostItem(i));

    return {
      ...parent,
      buyoutOpportunities: mappedItems.filter((i: IRiskCostItem) => i.category === 'Buyout'),
      potentialRisks: mappedItems.filter((i: IRiskCostItem) => i.category === 'Risk'),
      potentialSavings: mappedItems.filter((i: IRiskCostItem) => i.category === 'Savings'),
    };
  }

  async updateRiskCostManagement(projectCode: string, data: Partial<IRiskCostManagement>): Promise<IRiskCostManagement> {
    const web = this._getProjectWeb();
    const col = RISK_COST_MANAGEMENT_COLUMNS;

    const parents = await web.lists.getByTitle(LIST_NAMES.RISK_COST_MANAGEMENT).items
      .filter(`${col.projectCode} eq '${projectCode}'`)
      .top(1)();

    if (parents.length === 0) throw new Error(`Risk/Cost record for ${projectCode} not found`);

    const updateData: Record<string, unknown> = {};
    if (data.contractType !== undefined) updateData[col.contractType] = data.contractType;
    if (data.contractAmount !== undefined) updateData[col.contractAmount] = data.contractAmount;
    if (data.lastUpdatedBy !== undefined) updateData[col.lastUpdatedBy] = data.lastUpdatedBy;
    updateData[col.lastUpdatedAt] = new Date().toISOString();

    const itemId = (parents[0] as Record<string, unknown>).Id as number;
    await web.lists.getByTitle(LIST_NAMES.RISK_COST_MANAGEMENT).items.getById(itemId).update(updateData);

    // Re-read and assemble
    return (await this.getRiskCostManagement(projectCode))!;
  }

  async addRiskCostItem(projectCode: string, item: Partial<IRiskCostItem>): Promise<IRiskCostItem> {
    const web = this._getProjectWeb();
    const col = RISK_COST_ITEMS_COLUMNS;
    const parentCol = RISK_COST_MANAGEMENT_COLUMNS;

    // Look up parent to get riskCostId
    const parents = await web.lists.getByTitle(LIST_NAMES.RISK_COST_MANAGEMENT).items
      .filter(`${parentCol.projectCode} eq '${projectCode}'`)
      .top(1)();

    const riskCostId = parents.length > 0 ? (parents[0] as Record<string, unknown>).Id as number : undefined;

    const now = new Date().toISOString();
    const addData: Record<string, unknown> = {
      [col.projectCode]: projectCode,
      [col.riskCostId]: riskCostId,
      [col.category]: item.category ?? 'Risk',
      [col.letter]: item.letter ?? '',
      [col.description]: item.description ?? '',
      [col.estimatedValue]: item.estimatedValue ?? 0,
      [col.status]: item.status ?? 'Open',
      [col.notes]: item.notes ?? '',
      [col.createdDate]: now,
      [col.updatedDate]: now,
    };

    const result = await web.lists.getByTitle(LIST_NAMES.RISK_COST_ITEMS).items.add(addData);
    return this.mapToRiskCostItem(result.data);
  }

  async updateRiskCostItem(projectCode: string, itemId: number, data: Partial<IRiskCostItem>): Promise<IRiskCostItem> {
    const web = this._getProjectWeb();
    const col = RISK_COST_ITEMS_COLUMNS;

    const updateData: Record<string, unknown> = {};
    if (data.category !== undefined) updateData[col.category] = data.category;
    if (data.letter !== undefined) updateData[col.letter] = data.letter;
    if (data.description !== undefined) updateData[col.description] = data.description;
    if (data.estimatedValue !== undefined) updateData[col.estimatedValue] = data.estimatedValue;
    if (data.status !== undefined) updateData[col.status] = data.status;
    if (data.notes !== undefined) updateData[col.notes] = data.notes;
    updateData[col.updatedDate] = new Date().toISOString();

    await web.lists.getByTitle(LIST_NAMES.RISK_COST_ITEMS).items.getById(itemId).update(updateData);

    const updated = await web.lists.getByTitle(LIST_NAMES.RISK_COST_ITEMS).items.getById(itemId)();
    return this.mapToRiskCostItem(updated);
  }

  // --- Quality Concerns ---

  async getQualityConcerns(projectCode: string): Promise<IQualityConcern[]> {
    const web = this._getProjectWeb();
    const col = QUALITY_CONCERNS_COLUMNS;

    const items = await web.lists.getByTitle(LIST_NAMES.QUALITY_CONCERNS).items
      .filter(`${col.projectCode} eq '${projectCode}'`)
      .orderBy(col.letter, true)
      .top(500)();

    return items.map((item: Record<string, unknown>) => this.mapToQualityConcern(item));
  }

  async addQualityConcern(projectCode: string, concern: Partial<IQualityConcern>): Promise<IQualityConcern> {
    const web = this._getProjectWeb();
    const col = QUALITY_CONCERNS_COLUMNS;

    const addData: Record<string, unknown> = {
      [col.projectCode]: projectCode,
      [col.letter]: concern.letter ?? '',
      [col.description]: concern.description ?? '',
      [col.raisedBy]: concern.raisedBy ?? '',
      [col.raisedDate]: concern.raisedDate ?? new Date().toISOString(),
      [col.status]: concern.status ?? 'Open',
      [col.resolution]: concern.resolution ?? '',
      [col.resolvedDate]: concern.resolvedDate ?? null,
      [col.notes]: concern.notes ?? '',
    };

    const result = await web.lists.getByTitle(LIST_NAMES.QUALITY_CONCERNS).items.add(addData);
    return this.mapToQualityConcern(result.data);
  }

  async updateQualityConcern(projectCode: string, concernId: number, data: Partial<IQualityConcern>): Promise<IQualityConcern> {
    const web = this._getProjectWeb();
    const col = QUALITY_CONCERNS_COLUMNS;

    const updateData: Record<string, unknown> = {};
    if (data.letter !== undefined) updateData[col.letter] = data.letter;
    if (data.description !== undefined) updateData[col.description] = data.description;
    if (data.raisedBy !== undefined) updateData[col.raisedBy] = data.raisedBy;
    if (data.raisedDate !== undefined) updateData[col.raisedDate] = data.raisedDate;
    if (data.status !== undefined) updateData[col.status] = data.status;
    if (data.resolution !== undefined) updateData[col.resolution] = data.resolution;
    if (data.resolvedDate !== undefined) updateData[col.resolvedDate] = data.resolvedDate;
    if (data.notes !== undefined) updateData[col.notes] = data.notes;

    await web.lists.getByTitle(LIST_NAMES.QUALITY_CONCERNS).items.getById(concernId).update(updateData);

    const updated = await web.lists.getByTitle(LIST_NAMES.QUALITY_CONCERNS).items.getById(concernId)();
    return this.mapToQualityConcern(updated);
  }

  // --- Safety Concerns ---

  async getSafetyConcerns(projectCode: string): Promise<ISafetyConcern[]> {
    const web = this._getProjectWeb();
    const col = SAFETY_CONCERNS_COLUMNS;

    const items = await web.lists.getByTitle(LIST_NAMES.SAFETY_CONCERNS).items
      .filter(`${col.projectCode} eq '${projectCode}'`)
      .orderBy(col.letter, true)
      .top(500)();

    return items.map((item: Record<string, unknown>) => this.mapToSafetyConcern(item));
  }

  async addSafetyConcern(projectCode: string, concern: Partial<ISafetyConcern>): Promise<ISafetyConcern> {
    const web = this._getProjectWeb();
    const col = SAFETY_CONCERNS_COLUMNS;

    const addData: Record<string, unknown> = {
      [col.projectCode]: projectCode,
      [col.safetyOfficerName]: concern.safetyOfficerName ?? '',
      [col.safetyOfficerEmail]: concern.safetyOfficerEmail ?? '',
      [col.letter]: concern.letter ?? '',
      [col.description]: concern.description ?? '',
      [col.severity]: concern.severity ?? 'Medium',
      [col.raisedBy]: concern.raisedBy ?? '',
      [col.raisedDate]: concern.raisedDate ?? new Date().toISOString(),
      [col.status]: concern.status ?? 'Open',
      [col.resolution]: concern.resolution ?? '',
      [col.resolvedDate]: concern.resolvedDate ?? null,
      [col.notes]: concern.notes ?? '',
    };

    const result = await web.lists.getByTitle(LIST_NAMES.SAFETY_CONCERNS).items.add(addData);
    return this.mapToSafetyConcern(result.data);
  }

  async updateSafetyConcern(projectCode: string, concernId: number, data: Partial<ISafetyConcern>): Promise<ISafetyConcern> {
    const web = this._getProjectWeb();
    const col = SAFETY_CONCERNS_COLUMNS;

    const updateData: Record<string, unknown> = {};
    if (data.safetyOfficerName !== undefined) updateData[col.safetyOfficerName] = data.safetyOfficerName;
    if (data.safetyOfficerEmail !== undefined) updateData[col.safetyOfficerEmail] = data.safetyOfficerEmail;
    if (data.letter !== undefined) updateData[col.letter] = data.letter;
    if (data.description !== undefined) updateData[col.description] = data.description;
    if (data.severity !== undefined) updateData[col.severity] = data.severity;
    if (data.raisedBy !== undefined) updateData[col.raisedBy] = data.raisedBy;
    if (data.raisedDate !== undefined) updateData[col.raisedDate] = data.raisedDate;
    if (data.status !== undefined) updateData[col.status] = data.status;
    if (data.resolution !== undefined) updateData[col.resolution] = data.resolution;
    if (data.resolvedDate !== undefined) updateData[col.resolvedDate] = data.resolvedDate;
    if (data.notes !== undefined) updateData[col.notes] = data.notes;

    await web.lists.getByTitle(LIST_NAMES.SAFETY_CONCERNS).items.getById(concernId).update(updateData);

    const updated = await web.lists.getByTitle(LIST_NAMES.SAFETY_CONCERNS).items.getById(concernId)();
    return this.mapToSafetyConcern(updated);
  }

  // --- Schedule & Critical Path ---

  async getProjectSchedule(projectCode: string): Promise<IProjectScheduleCriticalPath | null> {
    const web = this._getProjectWeb();
    const col = PROJECT_SCHEDULE_COLUMNS;
    const itemCol = CRITICAL_PATH_ITEMS_COLUMNS;

    const [parents, items] = await Promise.all([
      web.lists.getByTitle(LIST_NAMES.PROJECT_SCHEDULE).items
        .filter(`${col.projectCode} eq '${projectCode}'`)
        .top(1)(),
      web.lists.getByTitle(LIST_NAMES.CRITICAL_PATH_ITEMS).items
        .filter(`${itemCol.projectCode} eq '${projectCode}'`)
        .orderBy(itemCol.letter, true)
        .top(500)(),
    ]);

    if (parents.length === 0) return null;

    const schedule = this.mapToProjectSchedule(parents[0]);
    return {
      ...schedule,
      criticalPathConcerns: items.map((i: Record<string, unknown>) => this.mapToCriticalPathItem(i)),
    };
  }

  async updateProjectSchedule(projectCode: string, data: Partial<IProjectScheduleCriticalPath>): Promise<IProjectScheduleCriticalPath> {
    const web = this._getProjectWeb();
    const col = PROJECT_SCHEDULE_COLUMNS;

    const parents = await web.lists.getByTitle(LIST_NAMES.PROJECT_SCHEDULE).items
      .filter(`${col.projectCode} eq '${projectCode}'`)
      .top(1)();

    if (parents.length === 0) throw new Error(`Schedule record for ${projectCode} not found`);

    const updateData: Record<string, unknown> = {};
    if (data.startDate !== undefined) updateData[col.startDate] = data.startDate;
    if (data.substantialCompletionDate !== undefined) updateData[col.substantialCompletionDate] = data.substantialCompletionDate;
    if (data.ntpDate !== undefined) updateData[col.ntpDate] = data.ntpDate;
    if (data.nocDate !== undefined) updateData[col.nocDate] = data.nocDate;
    if (data.contractCalendarDays !== undefined) updateData[col.contractCalendarDays] = data.contractCalendarDays;
    if (data.contractBasisType !== undefined) updateData[col.contractBasisType] = data.contractBasisType;
    if (data.teamGoalDaysAhead !== undefined) updateData[col.teamGoalDaysAhead] = data.teamGoalDaysAhead;
    if (data.teamGoalDescription !== undefined) updateData[col.teamGoalDescription] = data.teamGoalDescription;
    if (data.hasLiquidatedDamages !== undefined) updateData[col.hasLiquidatedDamages] = data.hasLiquidatedDamages;
    if (data.liquidatedDamagesAmount !== undefined) updateData[col.liquidatedDamagesAmount] = data.liquidatedDamagesAmount;
    if (data.liquidatedDamagesTerms !== undefined) updateData[col.liquidatedDamagesTerms] = data.liquidatedDamagesTerms;
    if (data.lastUpdatedBy !== undefined) updateData[col.lastUpdatedBy] = data.lastUpdatedBy;
    updateData[col.lastUpdatedAt] = new Date().toISOString();

    const itemId = (parents[0] as Record<string, unknown>).Id as number;
    await web.lists.getByTitle(LIST_NAMES.PROJECT_SCHEDULE).items.getById(itemId).update(updateData);

    return (await this.getProjectSchedule(projectCode))!;
  }

  async addCriticalPathItem(projectCode: string, item: Partial<ICriticalPathItem>): Promise<ICriticalPathItem> {
    const web = this._getProjectWeb();
    const col = CRITICAL_PATH_ITEMS_COLUMNS;
    const parentCol = PROJECT_SCHEDULE_COLUMNS;

    // Look up parent to get scheduleId
    const parents = await web.lists.getByTitle(LIST_NAMES.PROJECT_SCHEDULE).items
      .filter(`${parentCol.projectCode} eq '${projectCode}'`)
      .top(1)();

    const scheduleId = parents.length > 0 ? (parents[0] as Record<string, unknown>).Id as number : undefined;

    const now = new Date().toISOString();
    const addData: Record<string, unknown> = {
      [col.projectCode]: projectCode,
      [col.scheduleId]: scheduleId,
      [col.letter]: item.letter ?? '',
      [col.description]: item.description ?? '',
      [col.impactDescription]: item.impactDescription ?? '',
      [col.status]: item.status ?? 'Active',
      [col.mitigationPlan]: item.mitigationPlan ?? '',
      [col.createdDate]: now,
      [col.updatedDate]: now,
    };

    const result = await web.lists.getByTitle(LIST_NAMES.CRITICAL_PATH_ITEMS).items.add(addData);
    return this.mapToCriticalPathItem(result.data);
  }

  // --- Superintendent Plan ---

  async getSuperintendentPlan(projectCode: string): Promise<ISuperintendentPlan | null> {
    const web = this._getProjectWeb();
    const col = SUPERINTENDENT_PLAN_COLUMNS;
    const secCol = SUPERINTENDENT_PLAN_SECTIONS_COLUMNS;

    const parents = await web.lists.getByTitle(LIST_NAMES.SUPERINTENDENT_PLAN).items
      .filter(`${col.projectCode} eq '${projectCode}'`)
      .top(1)();

    if (parents.length === 0) return null;

    const plan = this.mapToSuperintendentPlan(parents[0]);

    const sections = await web.lists.getByTitle(LIST_NAMES.SUPERINTENDENT_PLAN_SECTIONS).items
      .filter(`${secCol.superintendentPlanId} eq ${plan.id}`)
      .top(500)();

    return {
      ...plan,
      sections: sections.map((s: Record<string, unknown>) => this.mapToSuperintendentPlanSection(s)),
    };
  }

  async updateSuperintendentPlanSection(projectCode: string, sectionId: number, data: Partial<ISuperintendentPlanSection>): Promise<ISuperintendentPlanSection> {
    const web = this._getProjectWeb();
    const secCol = SUPERINTENDENT_PLAN_SECTIONS_COLUMNS;
    const col = SUPERINTENDENT_PLAN_COLUMNS;

    const updateData: Record<string, unknown> = {};
    if (data.sectionTitle !== undefined) updateData[secCol.sectionTitle] = data.sectionTitle;
    if (data.content !== undefined) updateData[secCol.content] = data.content;
    if (data.isComplete !== undefined) updateData[secCol.isComplete] = data.isComplete;
    if (data.attachmentUrls !== undefined) updateData[secCol.attachmentUrls] = JSON.stringify(data.attachmentUrls);

    await web.lists.getByTitle(LIST_NAMES.SUPERINTENDENT_PLAN_SECTIONS).items.getById(sectionId).update(updateData);

    // Update parent's lastUpdatedAt
    const parents = await web.lists.getByTitle(LIST_NAMES.SUPERINTENDENT_PLAN).items
      .filter(`${col.projectCode} eq '${projectCode}'`)
      .top(1)();
    if (parents.length > 0) {
      const parentId = (parents[0] as Record<string, unknown>).Id as number;
      await web.lists.getByTitle(LIST_NAMES.SUPERINTENDENT_PLAN).items.getById(parentId).update({
        [col.lastUpdatedAt]: new Date().toISOString(),
      });
    }

    const updated = await web.lists.getByTitle(LIST_NAMES.SUPERINTENDENT_PLAN_SECTIONS).items.getById(sectionId)();
    return this.mapToSuperintendentPlanSection(updated);
  }

  async createSuperintendentPlan(projectCode: string, data: Partial<ISuperintendentPlan>): Promise<ISuperintendentPlan> {
    const web = this._getProjectWeb();
    const col = SUPERINTENDENT_PLAN_COLUMNS;
    const secCol = SUPERINTENDENT_PLAN_SECTIONS_COLUMNS;

    const now = new Date().toISOString();
    const addData: Record<string, unknown> = {
      [col.projectCode]: projectCode,
      [col.superintendentName]: data.superintendentName ?? '',
      [col.createdBy]: data.createdBy ?? '',
      [col.createdAt]: now,
      [col.lastUpdatedBy]: data.lastUpdatedBy ?? data.createdBy ?? '',
      [col.lastUpdatedAt]: now,
    };

    const result = await web.lists.getByTitle(LIST_NAMES.SUPERINTENDENT_PLAN).items.add(addData);
    const planId = (result.data as Record<string, unknown>).Id as number;

    // Batch-create sections if provided
    if (data.sections && data.sections.length > 0) {
      for (const sec of data.sections) {
        const secData: Record<string, unknown> = {
          [secCol.superintendentPlanId]: planId,
          [secCol.projectCode]: projectCode,
          [secCol.sectionKey]: sec.sectionKey ?? '',
          [secCol.sectionTitle]: sec.sectionTitle ?? '',
          [secCol.content]: sec.content ?? '',
          [secCol.attachmentUrls]: JSON.stringify(sec.attachmentUrls ?? []),
          [secCol.isComplete]: sec.isComplete ?? false,
        };
        await web.lists.getByTitle(LIST_NAMES.SUPERINTENDENT_PLAN_SECTIONS).items.add(secData);
      }
    }

    // Re-read and assemble
    return (await this.getSuperintendentPlan(projectCode))!;
  }

  // --- Lessons Learned ---

  async getLessonsLearned(projectCode: string): Promise<ILessonLearned[]> {
    const web = this._getProjectWeb();
    const col = LESSONS_LEARNED_COLUMNS;

    const items = await web.lists.getByTitle(LIST_NAMES.LESSONS_LEARNED).items
      .filter(`${col.projectCode} eq '${projectCode}'`)
      .top(500)();

    return items.map((item: Record<string, unknown>) => this.mapToLessonLearned(item));
  }

  async addLessonLearned(projectCode: string, lesson: Partial<ILessonLearned>): Promise<ILessonLearned> {
    const web = this._getProjectWeb();
    const col = LESSONS_LEARNED_COLUMNS;

    const addData: Record<string, unknown> = {
      [col.projectCode]: projectCode,
      [col.title]: lesson.title ?? '',
      [col.category]: lesson.category ?? 'Other',
      [col.impact]: lesson.impact ?? 'Neutral',
      [col.description]: lesson.description ?? '',
      [col.recommendation]: lesson.recommendation ?? '',
      [col.raisedBy]: lesson.raisedBy ?? '',
      [col.raisedDate]: lesson.raisedDate ?? new Date().toISOString(),
      [col.phase]: lesson.phase ?? '',
      [col.isIncludedInFinalRecord]: lesson.isIncludedInFinalRecord ?? false,
      [col.tags]: JSON.stringify(lesson.tags ?? []),
    };

    const result = await web.lists.getByTitle(LIST_NAMES.LESSONS_LEARNED).items.add(addData);
    return this.mapToLessonLearned(result.data);
  }

  async updateLessonLearned(projectCode: string, lessonId: number, data: Partial<ILessonLearned>): Promise<ILessonLearned> {
    const web = this._getProjectWeb();
    const col = LESSONS_LEARNED_COLUMNS;

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData[col.title] = data.title;
    if (data.category !== undefined) updateData[col.category] = data.category;
    if (data.impact !== undefined) updateData[col.impact] = data.impact;
    if (data.description !== undefined) updateData[col.description] = data.description;
    if (data.recommendation !== undefined) updateData[col.recommendation] = data.recommendation;
    if (data.raisedBy !== undefined) updateData[col.raisedBy] = data.raisedBy;
    if (data.raisedDate !== undefined) updateData[col.raisedDate] = data.raisedDate;
    if (data.phase !== undefined) updateData[col.phase] = data.phase;
    if (data.isIncludedInFinalRecord !== undefined) updateData[col.isIncludedInFinalRecord] = data.isIncludedInFinalRecord;
    if (data.tags !== undefined) updateData[col.tags] = JSON.stringify(data.tags);

    await web.lists.getByTitle(LIST_NAMES.LESSONS_LEARNED).items.getById(lessonId).update(updateData);

    const updated = await web.lists.getByTitle(LIST_NAMES.LESSONS_LEARNED).items.getById(lessonId)();
    return this.mapToLessonLearned(updated);
  }

  // --- Project Management Plan ---

  async getProjectManagementPlan(projectCode: string): Promise<IProjectManagementPlan | null> {
    const web = this._getProjectWeb();
    const col = PMP_COLUMNS;

    // Read parent PMP
    const parents = await web.lists.getByTitle(LIST_NAMES.PMP).items
      .filter(`${col.projectCode} eq '${projectCode}'`)
      .top(1)();
    if (parents.length === 0) return null;

    const pmp = this.mapToPMP(parents[0]);

    // Read all 3 child lists in parallel
    const [sigItems, cycleItems, stepItems] = await Promise.all([
      web.lists.getByTitle(LIST_NAMES.PMP_SIGNATURES).items
        .filter(`${PMP_SIGNATURES_COLUMNS.pmpId} eq ${pmp.id}`)
        .top(500)(),
      web.lists.getByTitle(LIST_NAMES.PMP_APPROVAL_CYCLES).items
        .filter(`${PMP_APPROVAL_CYCLES_COLUMNS.pmpId} eq ${pmp.id}`)
        .top(500)(),
      web.lists.getByTitle(LIST_NAMES.PMP_APPROVAL_STEPS).items
        .filter(`${PMP_APPROVAL_STEPS_COLUMNS.projectCode} eq '${projectCode}'`)
        .top(500)(),
    ]);

    const signatures = sigItems.map((s: Record<string, unknown>) => this.mapToPMPSignature(s));
    const cycles = cycleItems.map((c: Record<string, unknown>) => this.mapToPMPApprovalCycle(c));
    const steps = stepItems.map((s: Record<string, unknown>) => this.mapToPMPApprovalStep(s));

    return this.assemblePMPFromParts(pmp, signatures, cycles, steps);
  }

  async updateProjectManagementPlan(projectCode: string, data: Partial<IProjectManagementPlan>): Promise<IProjectManagementPlan> {
    const web = this._getProjectWeb();
    const col = PMP_COLUMNS;

    // Find PMP by projectCode
    const parents = await web.lists.getByTitle(LIST_NAMES.PMP).items
      .filter(`${col.projectCode} eq '${projectCode}'`)
      .top(1)();
    if (parents.length === 0) throw new Error(`PMP for ${projectCode} not found`);

    const pmpId = (parents[0].ID as number) || (parents[0].Id as number);
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = { [col.lastUpdatedAt]: now };

    // Conditional partial update — string/number fields
    if (data.projectName !== undefined) updateData[col.projectName] = data.projectName;
    if (data.jobNumber !== undefined) updateData[col.jobNumber] = data.jobNumber;
    if (data.status !== undefined) updateData[col.status] = data.status;
    if (data.division !== undefined) updateData[col.division] = data.division;
    if (data.currentCycleNumber !== undefined) updateData[col.currentCycleNumber] = data.currentCycleNumber;
    if (data.superintendentPlan !== undefined) updateData[col.superintendentPlan] = data.superintendentPlan;
    if (data.preconMeetingNotes !== undefined) updateData[col.preconMeetingNotes] = data.preconMeetingNotes;
    if (data.siteManagementNotes !== undefined) updateData[col.siteManagementNotes] = data.siteManagementNotes;
    if (data.projectAdminBuyoutDate !== undefined) updateData[col.projectAdminBuyoutDate] = data.projectAdminBuyoutDate;
    if (data.lastUpdatedBy !== undefined) updateData[col.lastUpdatedBy] = data.lastUpdatedBy;

    // JSON array/object fields
    if (data.attachmentUrls !== undefined) updateData[col.attachmentUrls] = JSON.stringify(data.attachmentUrls);
    if (data.riskCostData !== undefined) updateData[col.riskCostData] = JSON.stringify(data.riskCostData);
    if (data.qualityConcerns !== undefined) updateData[col.qualityConcerns] = JSON.stringify(data.qualityConcerns);
    if (data.safetyConcerns !== undefined) updateData[col.safetyConcerns] = JSON.stringify(data.safetyConcerns);
    if (data.scheduleData !== undefined) updateData[col.scheduleData] = JSON.stringify(data.scheduleData);
    if (data.superintendentPlanData !== undefined) updateData[col.superintendentPlanData] = JSON.stringify(data.superintendentPlanData);
    if (data.lessonsLearned !== undefined) updateData[col.lessonsLearned] = JSON.stringify(data.lessonsLearned);
    if (data.teamAssignments !== undefined) updateData[col.teamAssignments] = JSON.stringify(data.teamAssignments);
    if (data.boilerplate !== undefined) updateData[col.boilerplate] = JSON.stringify(data.boilerplate);

    await web.lists.getByTitle(LIST_NAMES.PMP).items.getById(pmpId).update(updateData);

    // Re-read assembled
    const result = await this.getProjectManagementPlan(projectCode);
    if (!result) throw new Error(`PMP for ${projectCode} not found after update`);
    return result;
  }

  async submitPMPForApproval(projectCode: string, submittedBy: string): Promise<IProjectManagementPlan> {
    const web = this._getProjectWeb();
    const col = PMP_COLUMNS;
    const cycCol = PMP_APPROVAL_CYCLES_COLUMNS;
    const stepCol = PMP_APPROVAL_STEPS_COLUMNS;

    // Find PMP
    const parents = await web.lists.getByTitle(LIST_NAMES.PMP).items
      .filter(`${col.projectCode} eq '${projectCode}'`)
      .top(1)();
    if (parents.length === 0) throw new Error(`PMP for ${projectCode} not found`);

    const pmpId = (parents[0].ID as number) || (parents[0].Id as number);
    const currentCycle = (parents[0][col.currentCycleNumber] as number) || 0;
    const division = (parents[0][col.division] as string) || '';
    const newCycleNumber = currentCycle + 1;
    const now = new Date().toISOString();

    // Get division approvers from hub site
    const divisionApprovers = await this.getDivisionApprovers();
    const divApprover = divisionApprovers.find(d => d.division === division);

    // Create approval cycle
    const cycleResult = await web.lists.getByTitle(LIST_NAMES.PMP_APPROVAL_CYCLES).items.add({
      [cycCol.pmpId]: pmpId,
      [cycCol.projectCode]: projectCode,
      [cycCol.cycleNumber]: newCycleNumber,
      [cycCol.submittedBy]: submittedBy,
      [cycCol.submittedDate]: now,
      [cycCol.status]: 'InProgress',
      [cycCol.changesFromPrevious]: '[]',
    });
    const newCycleId = (cycleResult.Id as number) || (cycleResult.data?.Id as number);

    // Create Step 1: Project Executive (always)
    await web.lists.getByTitle(LIST_NAMES.PMP_APPROVAL_STEPS).items.add({
      [stepCol.approvalCycleId]: newCycleId,
      [stepCol.projectCode]: projectCode,
      [stepCol.stepOrder]: 1,
      [stepCol.approverRole]: 'Project Executive',
      [stepCol.approverName]: 'Kim Foster',
      [stepCol.approverEmail]: 'kfoster@hedrickbrothers.com',
      [stepCol.status]: 'Pending',
      [stepCol.comment]: '',
      [stepCol.actionDate]: null,
      [stepCol.approvalCycleNumber]: newCycleNumber,
    });

    // Create Step 2: Division Head (if division approver exists)
    if (divApprover) {
      await web.lists.getByTitle(LIST_NAMES.PMP_APPROVAL_STEPS).items.add({
        [stepCol.approvalCycleId]: newCycleId,
        [stepCol.projectCode]: projectCode,
        [stepCol.stepOrder]: 2,
        [stepCol.approverRole]: 'Division Head',
        [stepCol.approverName]: divApprover.approverName,
        [stepCol.approverEmail]: divApprover.approverEmail,
        [stepCol.status]: 'Pending',
        [stepCol.comment]: '',
        [stepCol.actionDate]: null,
        [stepCol.approvalCycleNumber]: newCycleNumber,
      });
    }

    // Update PMP parent status
    await web.lists.getByTitle(LIST_NAMES.PMP).items.getById(pmpId).update({
      [col.currentCycleNumber]: newCycleNumber,
      [col.status]: 'PendingApproval',
      [col.lastUpdatedAt]: now,
    });

    // Re-read assembled
    const result = await this.getProjectManagementPlan(projectCode);
    if (!result) throw new Error(`PMP for ${projectCode} not found after submission`);
    return result;
  }

  async respondToPMPApproval(projectCode: string, stepId: number, approved: boolean, comment: string): Promise<IProjectManagementPlan> {
    const web = this._getProjectWeb();
    const col = PMP_COLUMNS;
    const stepCol = PMP_APPROVAL_STEPS_COLUMNS;
    const cycCol = PMP_APPROVAL_CYCLES_COLUMNS;
    const now = new Date().toISOString();

    // Find PMP
    const parents = await web.lists.getByTitle(LIST_NAMES.PMP).items
      .filter(`${col.projectCode} eq '${projectCode}'`)
      .top(1)();
    if (parents.length === 0) throw new Error(`PMP for ${projectCode} not found`);
    const pmpId = (parents[0].ID as number) || (parents[0].Id as number);

    // Read the approval step to get its cycleId
    const step = await web.lists.getByTitle(LIST_NAMES.PMP_APPROVAL_STEPS).items.getById(stepId)();
    const cycleId = (step[stepCol.approvalCycleId] as number);

    // Update the step
    await web.lists.getByTitle(LIST_NAMES.PMP_APPROVAL_STEPS).items.getById(stepId).update({
      [stepCol.status]: approved ? 'Approved' : 'Returned',
      [stepCol.comment]: comment,
      [stepCol.actionDate]: now,
    });

    // Read all steps for this cycle to determine cascade
    const cycleSteps = await web.lists.getByTitle(LIST_NAMES.PMP_APPROVAL_STEPS).items
      .filter(`${stepCol.approvalCycleId} eq ${cycleId}`)
      .top(100)();

    if (!approved) {
      // Any rejection → cycle Returned, PMP Returned
      await web.lists.getByTitle(LIST_NAMES.PMP_APPROVAL_CYCLES).items.getById(cycleId).update({
        [cycCol.status]: 'Returned',
      });
      await web.lists.getByTitle(LIST_NAMES.PMP).items.getById(pmpId).update({
        [col.status]: 'Returned',
        [col.lastUpdatedAt]: now,
      });
    } else {
      // Check if ALL steps in cycle are Approved
      const allApproved = cycleSteps.every((s: Record<string, unknown>) => {
        const sid = (s.ID as number) || (s.Id as number);
        // The step we just updated may still show old status in the re-read, so check explicitly
        if (sid === stepId) return true; // we just approved this one
        return (s[stepCol.status] as string) === 'Approved';
      });

      if (allApproved) {
        await web.lists.getByTitle(LIST_NAMES.PMP_APPROVAL_CYCLES).items.getById(cycleId).update({
          [cycCol.status]: 'Approved',
        });
        await web.lists.getByTitle(LIST_NAMES.PMP).items.getById(pmpId).update({
          [col.status]: 'Approved',
          [col.lastUpdatedAt]: now,
        });
      } else {
        // Just update PMP timestamp
        await web.lists.getByTitle(LIST_NAMES.PMP).items.getById(pmpId).update({
          [col.lastUpdatedAt]: now,
        });
      }
    }

    // Re-read assembled
    const result = await this.getProjectManagementPlan(projectCode);
    if (!result) throw new Error(`PMP for ${projectCode} not found after approval response`);
    return result;
  }

  async signPMP(projectCode: string, signatureId: number, comment: string): Promise<IProjectManagementPlan> {
    const web = this._getProjectWeb();
    const col = PMP_COLUMNS;
    const sigCol = PMP_SIGNATURES_COLUMNS;
    const now = new Date().toISOString();

    // Find PMP
    const parents = await web.lists.getByTitle(LIST_NAMES.PMP).items
      .filter(`${col.projectCode} eq '${projectCode}'`)
      .top(1)();
    if (parents.length === 0) throw new Error(`PMP for ${projectCode} not found`);
    const pmpId = (parents[0].ID as number) || (parents[0].Id as number);

    // Read signature and verify it belongs to this PMP
    const sig = await web.lists.getByTitle(LIST_NAMES.PMP_SIGNATURES).items.getById(signatureId)();
    if ((sig[sigCol.pmpId] as number) !== pmpId) {
      throw new Error(`Signature ${signatureId} does not belong to PMP for ${projectCode}`);
    }

    // Update signature
    await web.lists.getByTitle(LIST_NAMES.PMP_SIGNATURES).items.getById(signatureId).update({
      [sigCol.status]: 'Signed',
      [sigCol.signedDate]: now,
      [sigCol.comment]: comment,
    });

    // Update PMP timestamp
    await web.lists.getByTitle(LIST_NAMES.PMP).items.getById(pmpId).update({
      [col.lastUpdatedAt]: now,
    });

    // Re-read assembled
    const result = await this.getProjectManagementPlan(projectCode);
    if (!result) throw new Error(`PMP for ${projectCode} not found after signing`);
    return result;
  }

  async getDivisionApprovers(): Promise<IDivisionApprover[]> {
    // Hub-site list — use this.sp.web, NOT _getProjectWeb()
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.DIVISION_APPROVERS).items
      .top(100)();
    return items.map((item: Record<string, unknown>) => this.mapToDivisionApprover(item));
  }

  async getPMPBoilerplate(): Promise<IPMPBoilerplateSection[]> {
    // Hub-site list — use this.sp.web, NOT _getProjectWeb()
    const col = PMP_BOILERPLATE_COLUMNS;
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.PMP_BOILERPLATE).items
      .orderBy(col.sectionNumber, true)
      .top(100)();
    return items.map((item: Record<string, unknown>) => this.mapToPMPBoilerplateSection(item));
  }

  // --- Monthly Review ---

  async getMonthlyReviews(projectCode: string): Promise<IMonthlyProjectReview[]> {
    const web = this._getProjectWeb();
    const col = MONTHLY_REVIEWS_COLUMNS;
    const ciCol = MONTHLY_CHECKLIST_ITEMS_COLUMNS;
    const fuCol = MONTHLY_FOLLOW_UPS_COLUMNS;

    // Read parent reviews for this project
    const parents = await web.lists.getByTitle(LIST_NAMES.MONTHLY_REVIEWS).items
      .filter(`${col.projectCode} eq '${projectCode}'`)
      .top(500)();
    if (parents.length === 0) return [];

    const reviews = parents.map((p: Record<string, unknown>) => this.mapToMonthlyReview(p));
    const reviewIds = reviews.map((r: IMonthlyProjectReview) => r.id);

    // Build OR filter for child lists
    const orFilter = reviewIds.map((id: number) => `${ciCol.reviewId} eq ${id}`).join(' or ');

    // Parallel-read both child lists
    const [checklistItems, followUpItems] = await Promise.all([
      web.lists.getByTitle(LIST_NAMES.MONTHLY_CHECKLIST_ITEMS).items
        .filter(orFilter)
        .top(5000)(),
      web.lists.getByTitle(LIST_NAMES.MONTHLY_FOLLOW_UPS).items
        .filter(reviewIds.map((id: number) => `${fuCol.reviewId} eq ${id}`).join(' or '))
        .top(5000)(),
    ]);

    const mappedChecklist = checklistItems.map((i: Record<string, unknown>) => this.mapToMonthlyChecklistItem(i));
    const mappedFollowUps = followUpItems.map((f: Record<string, unknown>) => this.mapToMonthlyFollowUp(f));

    // Assemble each review with its children and sort desc by reviewMonth
    return reviews
      .map((r: IMonthlyProjectReview) => this.assembleMonthlyReview(r, mappedChecklist, mappedFollowUps))
      .sort((a: IMonthlyProjectReview, b: IMonthlyProjectReview) => b.reviewMonth.localeCompare(a.reviewMonth));
  }

  async getMonthlyReview(reviewId: number): Promise<IMonthlyProjectReview | null> {
    const web = this._getProjectWeb();
    const ciCol = MONTHLY_CHECKLIST_ITEMS_COLUMNS;
    const fuCol = MONTHLY_FOLLOW_UPS_COLUMNS;

    let parentItem: Record<string, unknown>;
    try {
      parentItem = await web.lists.getByTitle(LIST_NAMES.MONTHLY_REVIEWS).items.getById(reviewId)();
    } catch {
      return null;
    }

    const review = this.mapToMonthlyReview(parentItem);

    // Parallel-read children by reviewId
    const [checklistItems, followUpItems] = await Promise.all([
      web.lists.getByTitle(LIST_NAMES.MONTHLY_CHECKLIST_ITEMS).items
        .filter(`${ciCol.reviewId} eq ${reviewId}`)
        .top(5000)(),
      web.lists.getByTitle(LIST_NAMES.MONTHLY_FOLLOW_UPS).items
        .filter(`${fuCol.reviewId} eq ${reviewId}`)
        .top(5000)(),
    ]);

    const mappedChecklist = checklistItems.map((i: Record<string, unknown>) => this.mapToMonthlyChecklistItem(i));
    const mappedFollowUps = followUpItems.map((f: Record<string, unknown>) => this.mapToMonthlyFollowUp(f));

    return this.assembleMonthlyReview(review, mappedChecklist, mappedFollowUps);
  }

  async updateMonthlyReview(reviewId: number, data: Partial<IMonthlyProjectReview>): Promise<IMonthlyProjectReview> {
    const web = this._getProjectWeb();
    const col = MONTHLY_REVIEWS_COLUMNS;
    const ciCol = MONTHLY_CHECKLIST_ITEMS_COLUMNS;
    const fuCol = MONTHLY_FOLLOW_UPS_COLUMNS;
    const now = new Date().toISOString();

    // Build conditional parent update
    const updateData: Record<string, unknown> = { [col.lastUpdatedAt]: now };

    if (data.status !== undefined) updateData[col.status] = data.status;
    if (data.reviewMonth !== undefined) updateData[col.reviewMonth] = data.reviewMonth;
    if (data.dueDate !== undefined) updateData[col.dueDate] = data.dueDate;
    if (data.meetingDate !== undefined) updateData[col.meetingDate] = data.meetingDate;
    if (data.pmSubmittedDate !== undefined) updateData[col.pmSubmittedDate] = data.pmSubmittedDate;
    if (data.pxReviewDate !== undefined) updateData[col.pxReviewDate] = data.pxReviewDate;
    if (data.pxValidationDate !== undefined) updateData[col.pxValidationDate] = data.pxValidationDate;
    if (data.leadershipSubmitDate !== undefined) updateData[col.leadershipSubmitDate] = data.leadershipSubmitDate;
    if (data.completedDate !== undefined) updateData[col.completedDate] = data.completedDate;
    if (data.reportDocumentUrls !== undefined) updateData[col.reportDocumentUrls] = JSON.stringify(data.reportDocumentUrls);
    if (data.lastUpdatedBy !== undefined) updateData[col.lastUpdatedBy] = data.lastUpdatedBy;

    await web.lists.getByTitle(LIST_NAMES.MONTHLY_REVIEWS).items.getById(reviewId).update(updateData);

    // If checklistItems provided: delete existing + re-add
    if (data.checklistItems) {
      const existingCI = await web.lists.getByTitle(LIST_NAMES.MONTHLY_CHECKLIST_ITEMS).items
        .filter(`${ciCol.reviewId} eq ${reviewId}`)
        .top(5000)();
      for (const ci of existingCI) {
        const ciId = (ci.ID as number) || (ci.Id as number);
        await web.lists.getByTitle(LIST_NAMES.MONTHLY_CHECKLIST_ITEMS).items.getById(ciId).delete();
      }
      for (const item of data.checklistItems) {
        await web.lists.getByTitle(LIST_NAMES.MONTHLY_CHECKLIST_ITEMS).items.add({
          [ciCol.reviewId]: reviewId,
          [ciCol.sectionKey]: item.sectionKey,
          [ciCol.sectionTitle]: item.sectionTitle,
          [ciCol.itemKey]: item.itemKey,
          [ciCol.itemDescription]: item.itemDescription,
          [ciCol.pmComment]: item.pmComment || '',
          [ciCol.pxComment]: item.pxComment || '',
          [ciCol.pxInitial]: item.pxInitial || '',
        });
      }
    }

    // If followUps provided: delete existing + re-add
    if (data.followUps) {
      const existingFU = await web.lists.getByTitle(LIST_NAMES.MONTHLY_FOLLOW_UPS).items
        .filter(`${fuCol.reviewId} eq ${reviewId}`)
        .top(5000)();
      for (const fu of existingFU) {
        const fuId = (fu.ID as number) || (fu.Id as number);
        await web.lists.getByTitle(LIST_NAMES.MONTHLY_FOLLOW_UPS).items.getById(fuId).delete();
      }
      for (const fu of data.followUps) {
        await web.lists.getByTitle(LIST_NAMES.MONTHLY_FOLLOW_UPS).items.add({
          [fuCol.reviewId]: reviewId,
          [fuCol.question]: fu.question || '',
          [fuCol.requestedBy]: fu.requestedBy || '',
          [fuCol.requestedDate]: fu.requestedDate || '',
          [fuCol.pmResponse]: fu.pmResponse || '',
          [fuCol.responseDate]: fu.responseDate || null,
          [fuCol.pxForwardedDate]: fu.pxForwardedDate || null,
          [fuCol.status]: fu.status || 'Open',
        });
      }
    }

    // Re-read assembled
    const result = await this.getMonthlyReview(reviewId);
    if (!result) throw new Error(`Monthly review ${reviewId} not found after update`);
    return result;
  }

  async createMonthlyReview(data: Partial<IMonthlyProjectReview>): Promise<IMonthlyProjectReview> {
    const web = this._getProjectWeb();
    const col = MONTHLY_REVIEWS_COLUMNS;
    const ciCol = MONTHLY_CHECKLIST_ITEMS_COLUMNS;
    const fuCol = MONTHLY_FOLLOW_UPS_COLUMNS;
    const now = new Date().toISOString();

    // Create parent review
    const addResult = await web.lists.getByTitle(LIST_NAMES.MONTHLY_REVIEWS).items.add({
      [col.projectCode]: data.projectCode ?? '',
      [col.reviewMonth]: data.reviewMonth ?? '',
      [col.status]: data.status ?? 'NotStarted',
      [col.dueDate]: data.dueDate ?? '',
      [col.meetingDate]: data.meetingDate ?? null,
      [col.pmSubmittedDate]: null,
      [col.pxReviewDate]: null,
      [col.pxValidationDate]: null,
      [col.leadershipSubmitDate]: null,
      [col.completedDate]: null,
      [col.reportDocumentUrls]: JSON.stringify(data.reportDocumentUrls ?? []),
      [col.createdBy]: data.createdBy ?? '',
      [col.createdAt]: now,
      [col.lastUpdatedBy]: data.lastUpdatedBy ?? data.createdBy ?? '',
      [col.lastUpdatedAt]: now,
    });

    const newId = (addResult.data?.ID as number) || (addResult.data?.Id as number);

    // Add checklist items with FK
    if (data.checklistItems) {
      for (const item of data.checklistItems) {
        await web.lists.getByTitle(LIST_NAMES.MONTHLY_CHECKLIST_ITEMS).items.add({
          [ciCol.reviewId]: newId,
          [ciCol.sectionKey]: item.sectionKey,
          [ciCol.sectionTitle]: item.sectionTitle,
          [ciCol.itemKey]: item.itemKey,
          [ciCol.itemDescription]: item.itemDescription,
          [ciCol.pmComment]: item.pmComment || '',
          [ciCol.pxComment]: item.pxComment || '',
          [ciCol.pxInitial]: item.pxInitial || '',
        });
      }
    }

    // Add follow-ups with FK
    if (data.followUps) {
      for (const fu of data.followUps) {
        await web.lists.getByTitle(LIST_NAMES.MONTHLY_FOLLOW_UPS).items.add({
          [fuCol.reviewId]: newId,
          [fuCol.question]: fu.question || '',
          [fuCol.requestedBy]: fu.requestedBy || '',
          [fuCol.requestedDate]: fu.requestedDate || '',
          [fuCol.pmResponse]: fu.pmResponse || '',
          [fuCol.responseDate]: fu.responseDate || null,
          [fuCol.pxForwardedDate]: fu.pxForwardedDate || null,
          [fuCol.status]: fu.status || 'Open',
        });
      }
    }

    // Re-read assembled
    const result = await this.getMonthlyReview(newId);
    if (!result) throw new Error(`Monthly review not found after create`);
    return result;
  }

  // --- Estimating Kick-Off ---

  async getEstimatingKickoff(projectCode: string): Promise<IEstimatingKickoff | null> {
    const col = ESTIMATING_KICKOFFS_COLUMNS;
    const itemCol = ESTIMATING_KICKOFF_ITEMS_COLUMNS;

    const parents = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFFS).items
      .filter(`${col.ProjectCode} eq '${projectCode}'`)
      .top(1)();
    if (!parents || parents.length === 0) return null;

    const parent = this.mapToEstimatingKickoff(parents[0]);

    const childItems = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFF_ITEMS).items
      .filter(`${itemCol.kickoffId} eq ${parent.id}`)
      .orderBy(itemCol.sortOrder, true)
      .top(500)();

    parent.items = childItems.map((i: Record<string, unknown>) => this.mapToEstimatingKickoffItem(i));
    return parent;
  }

  async getEstimatingKickoffByLeadId(leadId: number): Promise<IEstimatingKickoff | null> {
    const col = ESTIMATING_KICKOFFS_COLUMNS;
    const itemCol = ESTIMATING_KICKOFF_ITEMS_COLUMNS;

    const parents = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFFS).items
      .filter(`${col.LeadID} eq ${leadId}`)
      .top(1)();
    if (!parents || parents.length === 0) return null;

    const parent = this.mapToEstimatingKickoff(parents[0]);

    const childItems = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFF_ITEMS).items
      .filter(`${itemCol.kickoffId} eq ${parent.id}`)
      .orderBy(itemCol.sortOrder, true)
      .top(500)();

    parent.items = childItems.map((i: Record<string, unknown>) => this.mapToEstimatingKickoffItem(i));
    return parent;
  }

  async createEstimatingKickoff(data: Partial<IEstimatingKickoff>): Promise<IEstimatingKickoff> {
    const col = ESTIMATING_KICKOFFS_COLUMNS;
    const itemCol = ESTIMATING_KICKOFF_ITEMS_COLUMNS;
    const now = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parentData: Record<string, any> = {
      [col.LeadID]: data.LeadID ?? 0,
      [col.ProjectCode]: data.ProjectCode ?? '',
      [col.CreatedDate]: now,
      [col.CreatedBy]: data.CreatedBy ?? 'system',
      [col.ModifiedDate]: now,
    };
    if (data.Architect) parentData[col.Architect] = data.Architect;
    if (data.ProposalDueDateTime) parentData[col.ProposalDueDateTime] = data.ProposalDueDateTime;
    if (data.ProposalType) parentData[col.ProposalType] = data.ProposalType;
    if (data.RFIFormat) parentData[col.RFIFormat] = data.RFIFormat;
    if (data.PrimaryOwnerContact) parentData[col.PrimaryOwnerContact] = data.PrimaryOwnerContact;
    if (data.ProposalDeliveryMethod) parentData[col.ProposalDeliveryMethod] = data.ProposalDeliveryMethod;
    if (data.CopiesIfHandDelivered !== undefined) parentData[col.CopiesIfHandDelivered] = data.CopiesIfHandDelivered;
    if (data.HBProposalDue) parentData[col.HBProposalDue] = data.HBProposalDue;
    if (data.SubcontractorProposalsDue) parentData[col.SubcontractorProposalsDue] = data.SubcontractorProposalsDue;
    if (data.PreSubmissionReview) parentData[col.PreSubmissionReview] = data.PreSubmissionReview;
    if (data.SubcontractorSiteWalkThru) parentData[col.SubcontractorSiteWalkThru] = data.SubcontractorSiteWalkThru;
    if (data.OwnerEstimateReview) parentData[col.OwnerEstimateReview] = data.OwnerEstimateReview;
    if (data.keyPersonnel) parentData[col.KeyPersonnel] = JSON.stringify(data.keyPersonnel);
    if (data.KickoffMeetingId) parentData[col.KickoffMeetingId] = data.KickoffMeetingId;
    if (data.KickoffMeetingDate) parentData[col.KickoffMeetingDate] = data.KickoffMeetingDate;

    const result = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFFS).items.add(parentData);
    const newId = (result as Record<string, unknown>).Id as number || (result as Record<string, unknown>).id as number;

    // Create child items if provided
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const childData: Record<string, any> = {
          [itemCol.kickoffId]: newId,
          [itemCol.projectCode]: data.ProjectCode ?? '',
          [itemCol.section]: item.section || 'managing',
          [itemCol.task]: item.task || '',
          [itemCol.status]: item.status || null,
          [itemCol.sortOrder]: item.sortOrder ?? 0,
        };
        if (item.responsibleParty) childData[itemCol.responsibleParty] = item.responsibleParty;
        if (item.assignees) childData[itemCol.Assignees] = JSON.stringify(item.assignees);
        if (item.deadline) childData[itemCol.deadline] = item.deadline;
        if (item.frequency) childData[itemCol.frequency] = item.frequency;
        if (item.notes) childData[itemCol.notes] = item.notes;
        if (item.tabRequired !== undefined) childData[itemCol.tabRequired] = item.tabRequired;
        if (item.isCustom !== undefined) childData[itemCol.isCustom] = item.isCustom;
        await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFF_ITEMS).items.add(childData);
      }
    }

    // Re-read and assemble
    return (await this.getEstimatingKickoff(data.ProjectCode ?? ''))!;
  }

  async updateEstimatingKickoff(id: number, data: Partial<IEstimatingKickoff>): Promise<IEstimatingKickoff> {
    const col = ESTIMATING_KICKOFFS_COLUMNS;
    const itemCol = ESTIMATING_KICKOFF_ITEMS_COLUMNS;
    const now = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = { [col.ModifiedDate]: now };
    if (data.Architect !== undefined) updateData[col.Architect] = data.Architect;
    if (data.ProposalDueDateTime !== undefined) updateData[col.ProposalDueDateTime] = data.ProposalDueDateTime;
    if (data.ProposalType !== undefined) updateData[col.ProposalType] = data.ProposalType;
    if (data.RFIFormat !== undefined) updateData[col.RFIFormat] = data.RFIFormat;
    if (data.PrimaryOwnerContact !== undefined) updateData[col.PrimaryOwnerContact] = data.PrimaryOwnerContact;
    if (data.ProposalDeliveryMethod !== undefined) updateData[col.ProposalDeliveryMethod] = data.ProposalDeliveryMethod;
    if (data.CopiesIfHandDelivered !== undefined) updateData[col.CopiesIfHandDelivered] = data.CopiesIfHandDelivered;
    if (data.HBProposalDue !== undefined) updateData[col.HBProposalDue] = data.HBProposalDue;
    if (data.SubcontractorProposalsDue !== undefined) updateData[col.SubcontractorProposalsDue] = data.SubcontractorProposalsDue;
    if (data.PreSubmissionReview !== undefined) updateData[col.PreSubmissionReview] = data.PreSubmissionReview;
    if (data.SubcontractorSiteWalkThru !== undefined) updateData[col.SubcontractorSiteWalkThru] = data.SubcontractorSiteWalkThru;
    if (data.OwnerEstimateReview !== undefined) updateData[col.OwnerEstimateReview] = data.OwnerEstimateReview;
    if (data.keyPersonnel !== undefined) updateData[col.KeyPersonnel] = JSON.stringify(data.keyPersonnel);
    if (data.KickoffMeetingId !== undefined) updateData[col.KickoffMeetingId] = data.KickoffMeetingId;
    if (data.KickoffMeetingDate !== undefined) updateData[col.KickoffMeetingDate] = data.KickoffMeetingDate;
    if (data.ModifiedBy !== undefined) updateData[col.ModifiedBy] = data.ModifiedBy;

    await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFFS).items.getById(id).update(updateData);

    // If items provided, replace all existing items (delete + recreate)
    if (data.items) {
      // Read existing parent to get ProjectCode
      const parentItem = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFFS).items.getById(id)();
      const projectCode = (parentItem as Record<string, unknown>)[col.ProjectCode] as string || '';

      // Delete existing items for this kickoff
      const existingItems = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFF_ITEMS).items
        .filter(`${itemCol.kickoffId} eq ${id}`)
        .top(500)();
      for (const existing of existingItems) {
        await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFF_ITEMS).items
          .getById((existing as Record<string, unknown>).Id as number || (existing as Record<string, unknown>).ID as number).recycle();
      }

      // Create new items
      for (const item of data.items) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const childData: Record<string, any> = {
          [itemCol.kickoffId]: id,
          [itemCol.projectCode]: projectCode,
          [itemCol.section]: item.section || 'managing',
          [itemCol.task]: item.task || '',
          [itemCol.status]: item.status || null,
          [itemCol.sortOrder]: item.sortOrder ?? 0,
        };
        if (item.responsibleParty !== undefined) childData[itemCol.responsibleParty] = item.responsibleParty;
        if (item.assignees) childData[itemCol.Assignees] = JSON.stringify(item.assignees);
        if (item.deadline !== undefined) childData[itemCol.deadline] = item.deadline;
        if (item.frequency !== undefined) childData[itemCol.frequency] = item.frequency;
        if (item.notes !== undefined) childData[itemCol.notes] = item.notes;
        if (item.tabRequired !== undefined) childData[itemCol.tabRequired] = item.tabRequired;
        if (item.isCustom !== undefined) childData[itemCol.isCustom] = item.isCustom;
        await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFF_ITEMS).items.add(childData);
      }
    }

    // Re-read the parent to get ProjectCode for re-assembly
    const updated = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFFS).items.getById(id)();
    const projectCode = (updated as Record<string, unknown>)[col.ProjectCode] as string || '';
    return (await this.getEstimatingKickoff(projectCode))!;
  }

  async updateKickoffItem(kickoffId: number, itemId: number, data: Partial<IEstimatingKickoffItem>): Promise<IEstimatingKickoffItem> {
    const col = ESTIMATING_KICKOFF_ITEMS_COLUMNS;
    const parentCol = ESTIMATING_KICKOFFS_COLUMNS;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (data.section !== undefined) updateData[col.section] = data.section;
    if (data.task !== undefined) updateData[col.task] = data.task;
    if (data.status !== undefined) updateData[col.status] = data.status;
    if (data.responsibleParty !== undefined) updateData[col.responsibleParty] = data.responsibleParty;
    if (data.assignees !== undefined) updateData[col.Assignees] = JSON.stringify(data.assignees);
    if (data.deadline !== undefined) updateData[col.deadline] = data.deadline;
    if (data.frequency !== undefined) updateData[col.frequency] = data.frequency;
    if (data.notes !== undefined) updateData[col.notes] = data.notes;
    if (data.tabRequired !== undefined) updateData[col.tabRequired] = data.tabRequired;
    if (data.isCustom !== undefined) updateData[col.isCustom] = data.isCustom;
    if (data.sortOrder !== undefined) updateData[col.sortOrder] = data.sortOrder;

    await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFF_ITEMS).items.getById(itemId).update(updateData);

    // Update parent ModifiedDate
    await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFFS).items.getById(kickoffId).update({
      [parentCol.ModifiedDate]: new Date().toISOString(),
    });

    // Re-read the item
    const updated = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFF_ITEMS).items.getById(itemId)();
    return this.mapToEstimatingKickoffItem(updated);
  }

  async addKickoffItem(kickoffId: number, item: Partial<IEstimatingKickoffItem>): Promise<IEstimatingKickoffItem> {
    const col = ESTIMATING_KICKOFF_ITEMS_COLUMNS;
    const parentCol = ESTIMATING_KICKOFFS_COLUMNS;

    // Read parent to get ProjectCode
    const parent = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFFS).items.getById(kickoffId)();
    const projectCode = (parent as Record<string, unknown>)[parentCol.ProjectCode] as string || '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const childData: Record<string, any> = {
      [col.kickoffId]: kickoffId,
      [col.projectCode]: projectCode,
      [col.section]: item.section || 'managing',
      [col.task]: item.task || 'New Task',
      [col.status]: item.status || null,
      [col.sortOrder]: item.sortOrder ?? 0,
      [col.isCustom]: item.isCustom ?? true,
    };
    if (item.responsibleParty) childData[col.responsibleParty] = item.responsibleParty;
    if (item.assignees) childData[col.Assignees] = JSON.stringify(item.assignees);
    if (item.deadline) childData[col.deadline] = item.deadline;
    if (item.frequency) childData[col.frequency] = item.frequency;
    if (item.notes) childData[col.notes] = item.notes;
    if (item.tabRequired !== undefined) childData[col.tabRequired] = item.tabRequired;

    const result = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFF_ITEMS).items.add(childData);
    const newId = (result as Record<string, unknown>).Id as number || (result as Record<string, unknown>).id as number;

    // Update parent ModifiedDate
    await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFFS).items.getById(kickoffId).update({
      [parentCol.ModifiedDate]: new Date().toISOString(),
    });

    // Re-read the new item
    const created = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFF_ITEMS).items.getById(newId)();
    return this.mapToEstimatingKickoffItem(created);
  }

  async removeKickoffItem(kickoffId: number, itemId: number): Promise<void> {
    const parentCol = ESTIMATING_KICKOFFS_COLUMNS;

    await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFF_ITEMS).items.getById(itemId).recycle();

    // Update parent ModifiedDate
    await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFFS).items.getById(kickoffId).update({
      [parentCol.ModifiedDate]: new Date().toISOString(),
    });
  }

  async updateKickoffKeyPersonnel(kickoffId: number, personnel: IKeyPersonnelEntry[]): Promise<IEstimatingKickoff> {
    const col = ESTIMATING_KICKOFFS_COLUMNS;
    const now = new Date().toISOString();

    await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFFS).items.getById(kickoffId).update({
      [col.KeyPersonnel]: JSON.stringify(personnel),
      [col.ModifiedDate]: now,
    });

    // Re-read and assemble
    const updated = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFFS).items.getById(kickoffId)();
    const projectCode = (updated as Record<string, unknown>)[col.ProjectCode] as string || '';
    return (await this.getEstimatingKickoff(projectCode))!;
  }

  // --- Job Number Requests ---

  async getJobNumberRequests(status?: JobNumberRequestStatus): Promise<IJobNumberRequest[]> {
    const col = JOB_NUMBER_REQUESTS_COLUMNS;
    let query = this.sp.web.lists.getByTitle(LIST_NAMES.JOB_NUMBER_REQUESTS).items;
    if (status) {
      query = query.filter(`${col.RequestStatus} eq '${status}'`);
    }
    const items = await query.orderBy(col.RequestDate, false).top(500)();
    return items.map((item: Record<string, unknown>) => this.mapToJobNumberRequest(item));
  }

  async getJobNumberRequestByLeadId(leadId: number): Promise<IJobNumberRequest | null> {
    const col = JOB_NUMBER_REQUESTS_COLUMNS;
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.JOB_NUMBER_REQUESTS).items
      .filter(`${col.LeadID} eq ${leadId}`)
      .orderBy(col.RequestDate, false)
      .top(1)();
    if (!items || items.length === 0) return null;
    return this.mapToJobNumberRequest(items[0]);
  }

  async createJobNumberRequest(data: Partial<IJobNumberRequest>): Promise<IJobNumberRequest> {
    const col = JOB_NUMBER_REQUESTS_COLUMNS;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addData: Record<string, any> = {
      [col.LeadID]: data.LeadID ?? 0,
      [col.RequestDate]: data.RequestDate ?? new Date().toISOString().split('T')[0],
      [col.Originator]: data.Originator ?? '',
      [col.RequiredByDate]: data.RequiredByDate ?? '',
      [col.ProjectAddress]: data.ProjectAddress ?? '',
      [col.ProjectExecutive]: data.ProjectExecutive ?? '',
      [col.ProjectType]: data.ProjectType ?? '',
      [col.ProjectTypeLabel]: data.ProjectTypeLabel ?? '',
      [col.IsEstimatingOnly]: data.IsEstimatingOnly ?? false,
      [col.RequestedCostCodes]: JSON.stringify(data.RequestedCostCodes ?? []),
      [col.RequestStatus]: JobNumberRequestStatus.Pending,
      [col.SiteProvisioningHeld]: data.SiteProvisioningHeld ?? true,
    };
    if (data.ProjectManager) addData[col.ProjectManager] = data.ProjectManager;
    if (data.TempProjectCode) addData[col.TempProjectCode] = data.TempProjectCode;
    if (data.Notes) addData[col.Notes] = data.Notes;

    const result = await this.sp.web.lists.getByTitle(LIST_NAMES.JOB_NUMBER_REQUESTS).items.add(addData);
    const newId = (result as Record<string, unknown>).Id as number || (result as Record<string, unknown>).id as number;

    // Link the request to the lead
    if (data.LeadID) {
      try {
        await this.sp.web.lists.getByTitle(LIST_NAMES.LEADS_MASTER).items.getById(data.LeadID).update({
          JobNumberRequestId: newId,
        });
      } catch { /* non-critical: lead linkage */ }
    }

    const created = await this.sp.web.lists.getByTitle(LIST_NAMES.JOB_NUMBER_REQUESTS).items.getById(newId)();
    return this.mapToJobNumberRequest(created);
  }

  async finalizeJobNumber(requestId: number, jobNumber: string, assignedBy: string): Promise<IJobNumberRequest> {
    const col = JOB_NUMBER_REQUESTS_COLUMNS;
    const now = new Date().toISOString().split('T')[0];

    // Read the request first to get LeadID
    const existing = await this.sp.web.lists.getByTitle(LIST_NAMES.JOB_NUMBER_REQUESTS).items.getById(requestId)();
    const leadId = (existing as Record<string, unknown>)[col.LeadID] as number;

    // Update the request
    await this.sp.web.lists.getByTitle(LIST_NAMES.JOB_NUMBER_REQUESTS).items.getById(requestId).update({
      [col.RequestStatus]: JobNumberRequestStatus.Completed,
      [col.AssignedJobNumber]: jobNumber,
      [col.AssignedBy]: assignedBy,
      [col.AssignedDate]: now,
    });

    // Update the lead's ProjectCode
    if (leadId) {
      try {
        await this.sp.web.lists.getByTitle(LIST_NAMES.LEADS_MASTER).items.getById(leadId).update({
          ProjectCode: jobNumber,
          OfficialJobNumber: jobNumber,
        });
      } catch { /* non-critical: lead update */ }
    }

    // Re-read the request
    const updated = await this.sp.web.lists.getByTitle(LIST_NAMES.JOB_NUMBER_REQUESTS).items.getById(requestId)();
    return this.mapToJobNumberRequest(updated);
  }

  // --- Reference Data ---

  async getProjectTypes(): Promise<IProjectType[]> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.PROJECT_TYPES).items.top(500)();
    return items.map((item: Record<string, unknown>) => this.mapToProjectType(item));
  }

  async getStandardCostCodes(): Promise<IStandardCostCode[]> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.STANDARD_COST_CODES).items.top(500)();
    return items.map((item: Record<string, unknown>) => this.mapToStandardCostCode(item));
  }

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
    const filterParts: string[] = [];

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

  // --- Scorecard Workflow (Phase 16) — Private Helpers ---

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToScorecardApprovalCycle(item: Record<string, any>): IScorecardApprovalCycle {
    const col = SCORECARD_APPROVAL_CYCLES_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      scorecardId: item[col.scorecardId] as number,
      cycleNumber: item[col.cycleNumber] as number,
      version: item[col.version] as number || 1,
      steps: [], // populated by assembleScorecard
      startedDate: item[col.startedDate] as string || '',
      completedDate: item[col.completedDate] as string || undefined,
      status: item[col.status] as 'Active' | 'Completed' | 'Cancelled' || 'Active',
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToScorecardApprovalStep(item: Record<string, any>): IScorecardApprovalStep {
    const col = SCORECARD_APPROVAL_STEPS_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      cycleId: item[col.cycleId] as number,
      stepOrder: item[col.stepOrder] as number,
      name: item[col.name] as string || '',
      assigneeEmail: item[col.assigneeEmail] as string || '',
      assigneeName: item[col.assigneeName] as string || '',
      assignmentSource: item[col.assignmentSource] as IScorecardApprovalStep['assignmentSource'] || 'Default',
      status: item[col.status] as IScorecardApprovalStep['status'] || 'Pending',
      actionDate: item[col.actionDate] as string || undefined,
      comment: item[col.comment] as string || undefined,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToScorecardVersion(item: Record<string, any>): IScorecardVersion {
    const col = SCORECARD_VERSIONS_COLUMNS;
    let originalScores: Record<string, number> = {};
    let committeeScores: Record<string, number> = {};
    try { originalScores = JSON.parse(item[col.originalScores] as string || '{}'); } catch { /* fallback */ }
    try { committeeScores = JSON.parse(item[col.committeeScores] as string || '{}'); } catch { /* fallback */ }
    return {
      id: (item[col.id] as number) || (item.Id as number),
      scorecardId: item[col.scorecardId] as number,
      versionNumber: item[col.versionNumber] as number,
      createdDate: item[col.createdDate] as string || '',
      createdBy: item[col.createdBy] as string || '',
      reason: item[col.reason] as string || undefined,
      originalScores,
      committeeScores,
      totalOriginal: item[col.totalOriginal] as number || undefined,
      totalCommittee: item[col.totalCommittee] as number || undefined,
      decision: item[col.decision] as GoNoGoDecision || undefined,
      conditions: item[col.conditions] as string || undefined,
    };
  }

  private async assembleScorecard(scorecardId: number): Promise<IGoNoGoScorecard> {
    const col = GONOGO_SCORECARD_COLUMNS;

    // Read parent
    const raw = await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items.getById(scorecardId)();

    // Parse JSON fields
    let scores: IGoNoGoScorecard['scores'] = {};
    try { scores = JSON.parse(raw[col.scores] as string || '{}'); } catch { /* fallback */ }
    let scoredByCmte: string[] = [];
    try { scoredByCmte = JSON.parse(raw[col.ScoredBy_Cmte] as string || '[]'); } catch { /* fallback */ }

    // Read child: approval cycles
    const cycleItems = await this.sp.web.lists.getByTitle(LIST_NAMES.SCORECARD_APPROVAL_CYCLES).items
      .filter(`${SCORECARD_APPROVAL_CYCLES_COLUMNS.scorecardId} eq ${scorecardId}`)
      .orderBy(SCORECARD_APPROVAL_CYCLES_COLUMNS.cycleNumber, true)();
    const cycles = (cycleItems as Record<string, unknown>[]).map(c => this.mapToScorecardApprovalCycle(c));

    // Read child: all approval steps for this scorecard's cycles
    if (cycles.length > 0) {
      const cycleIds = cycles.map(c => c.id);
      const stepItems = await this.sp.web.lists.getByTitle(LIST_NAMES.SCORECARD_APPROVAL_STEPS).items
        .filter(cycleIds.map(cid => `${SCORECARD_APPROVAL_STEPS_COLUMNS.cycleId} eq ${cid}`).join(' or '))
        .orderBy(SCORECARD_APPROVAL_STEPS_COLUMNS.stepOrder, true)();
      const steps = (stepItems as Record<string, unknown>[]).map(s => this.mapToScorecardApprovalStep(s));
      for (const cycle of cycles) {
        cycle.steps = steps.filter(s => s.cycleId === cycle.id);
      }
    }

    // Read child: versions
    const versionItems = await this.sp.web.lists.getByTitle(LIST_NAMES.SCORECARD_VERSIONS).items
      .filter(`${SCORECARD_VERSIONS_COLUMNS.scorecardId} eq ${scorecardId}`)
      .orderBy(SCORECARD_VERSIONS_COLUMNS.versionNumber, true)();
    const versions = (versionItems as Record<string, unknown>[]).map(v => this.mapToScorecardVersion(v));

    return {
      id: (raw.ID as number) || (raw.Id as number),
      LeadID: raw[col.LeadID] as number,
      ProjectCode: raw[col.ProjectCode] as string || undefined,
      scores,
      TotalScore_Orig: raw[col.TotalScore_Orig] as number || undefined,
      TotalScore_Cmte: raw[col.TotalScore_Cmte] as number || undefined,
      OriginatorComments: raw[col.OriginatorComments] as string || undefined,
      CommitteeComments: raw[col.CommitteeComments] as string || undefined,
      ProposalMarketingComments: raw[col.ProposalMarketingComments] as string || undefined,
      ProposalMarketingResources: raw[col.ProposalMarketingResources] as string || undefined,
      ProposalMarketingHours: raw[col.ProposalMarketingHours] as number || undefined,
      EstimatingComments: raw[col.EstimatingComments] as string || undefined,
      EstimatingResources: raw[col.EstimatingResources] as string || undefined,
      EstimatingHours: raw[col.EstimatingHours] as number || undefined,
      DecisionMakingProcess: raw[col.DecisionMakingProcess] as string || undefined,
      HBDifferentiators: raw[col.HBDifferentiators] as string || undefined,
      WinStrategy: raw[col.WinStrategy] as string || undefined,
      StrategicPursuit: raw[col.StrategicPursuit] as string || undefined,
      DecisionMakerAdvocate: raw[col.DecisionMakerAdvocate] as string || undefined,
      Decision: raw[col.Decision] as GoNoGoDecision || undefined,
      DecisionDate: raw[col.DecisionDate] as string || undefined,
      ScoredBy_Orig: raw[col.ScoredBy_Orig] as string || undefined,
      ScoredBy_Cmte: scoredByCmte,
      scorecardStatus: raw[col.scorecardStatus] as ScorecardStatus || ScorecardStatus.BDDraft,
      currentApprovalStep: raw[col.currentApprovalStep] as number || undefined,
      approvalCycles: cycles,
      committeeScoresEnteredBy: raw[col.committeeScoresEnteredBy] as string || undefined,
      committeeScoresEnteredDate: raw[col.committeeScoresEnteredDate] as string || undefined,
      committeeMeetingDate: raw[col.committeeMeetingDate] as string || undefined,
      recommendedDecision: raw[col.recommendedDecision] as GoNoGoDecision || undefined,
      finalDecision: raw[col.finalDecision] as GoNoGoDecision || undefined,
      finalDecisionBy: raw[col.finalDecisionBy] as string || undefined,
      finalDecisionDate: raw[col.finalDecisionDate] as string || undefined,
      conditionalGoConditions: raw[col.conditionalGoConditions] as string || undefined,
      currentVersion: raw[col.currentVersion] as number || 1,
      versions,
      isLocked: !!(raw[col.isLocked]),
      unlockedBy: raw[col.unlockedBy] as string || undefined,
      unlockedDate: raw[col.unlockedDate] as string || undefined,
      unlockReason: raw[col.unlockReason] as string || undefined,
    };
  }

  private async createVersionSnapshot(scorecardId: number, reason: string, createdBy: string): Promise<IScorecardVersion> {
    const col = GONOGO_SCORECARD_COLUMNS;
    const vCol = SCORECARD_VERSIONS_COLUMNS;
    const raw = await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items.getById(scorecardId)();

    let scores: IGoNoGoScorecard['scores'] = {};
    try { scores = JSON.parse(raw[col.scores] as string || '{}'); } catch { /* fallback */ }

    const origScores: Record<string, number> = {};
    const cmteScores: Record<string, number> = {};
    for (const key of Object.keys(scores)) {
      if (scores[Number(key)]?.originator !== undefined) origScores[key] = scores[Number(key)].originator!;
      if (scores[Number(key)]?.committee !== undefined) cmteScores[key] = scores[Number(key)].committee!;
    }

    const currentVersion = (raw[col.currentVersion] as number) || 1;
    const now = new Date().toISOString();

    const result = await this.sp.web.lists.getByTitle(LIST_NAMES.SCORECARD_VERSIONS).items.add({
      [vCol.scorecardId]: scorecardId,
      [vCol.versionNumber]: currentVersion,
      [vCol.createdDate]: now,
      [vCol.createdBy]: createdBy,
      [vCol.reason]: reason,
      [vCol.originalScores]: JSON.stringify(origScores),
      [vCol.committeeScores]: JSON.stringify(cmteScores),
      [vCol.totalOriginal]: raw[col.TotalScore_Orig] as number || 0,
      [vCol.totalCommittee]: raw[col.TotalScore_Cmte] as number || 0,
      [vCol.decision]: raw[col.finalDecision] as string || raw[col.Decision] as string || '',
      [vCol.conditions]: raw[col.conditionalGoConditions] as string || '',
    });

    this.logAudit({
      Action: AuditAction.ScorecardVersionCreated,
      EntityType: EntityType.Scorecard,
      EntityId: String(scorecardId),
      User: createdBy,
      Details: `Version ${currentVersion} snapshot: ${reason}`,
    }).catch(() => { /* fire-and-forget */ });

    return this.mapToScorecardVersion(result);
  }

  // --- Scorecard Workflow (Phase 16) — Public Methods ---

  async submitScorecard(scorecardId: number, submittedBy: string, _approverOverride?: IPersonAssignment): Promise<IGoNoGoScorecard> {
    const col = GONOGO_SCORECARD_COLUMNS;
    const cycCol = SCORECARD_APPROVAL_CYCLES_COLUMNS;
    const stepCol = SCORECARD_APPROVAL_STEPS_COLUMNS;
    const now = new Date().toISOString();

    // Read current scorecard to determine cycle number
    const raw = await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items.getById(scorecardId)();
    const existingCycles = await this.sp.web.lists.getByTitle(LIST_NAMES.SCORECARD_APPROVAL_CYCLES).items
      .filter(`${cycCol.scorecardId} eq ${scorecardId}`)();
    const newCycleNumber = existingCycles.length + 1;
    const currentVersion = (raw[col.currentVersion] as number) || 1;

    // Create version snapshot for first submission
    if (newCycleNumber === 1) {
      await this.createVersionSnapshot(scorecardId, 'Initial submission', submittedBy);
    }

    // Create approval cycle
    const cycleResult = await this.sp.web.lists.getByTitle(LIST_NAMES.SCORECARD_APPROVAL_CYCLES).items.add({
      [cycCol.scorecardId]: scorecardId,
      [cycCol.cycleNumber]: newCycleNumber,
      [cycCol.version]: currentVersion,
      [cycCol.startedDate]: now,
      [cycCol.status]: 'Active',
    });
    const newCycleId = (cycleResult.Id as number) || (cycleResult.data?.Id as number);

    // Create step 1: BD Rep — auto-approved (submitter)
    await this.sp.web.lists.getByTitle(LIST_NAMES.SCORECARD_APPROVAL_STEPS).items.add({
      [stepCol.cycleId]: newCycleId,
      [stepCol.stepOrder]: 1,
      [stepCol.name]: 'BD Representative',
      [stepCol.assigneeEmail]: submittedBy,
      [stepCol.assigneeName]: submittedBy,
      [stepCol.assignmentSource]: 'Default',
      [stepCol.status]: 'Approved',
      [stepCol.actionDate]: now,
      [stepCol.comment]: 'Submitted for review',
    });

    // Create step 2: Director — pending
    await this.sp.web.lists.getByTitle(LIST_NAMES.SCORECARD_APPROVAL_STEPS).items.add({
      [stepCol.cycleId]: newCycleId,
      [stepCol.stepOrder]: 2,
      [stepCol.name]: 'Department Director',
      [stepCol.assigneeEmail]: '',
      [stepCol.assigneeName]: '',
      [stepCol.assignmentSource]: 'Default',
      [stepCol.status]: 'Pending',
    });

    // Update scorecard status
    await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items.getById(scorecardId).update({
      [col.scorecardStatus]: ScorecardStatus.AwaitingDirectorReview,
      [col.currentApprovalStep]: 2,
    });

    this.logAudit({
      Action: AuditAction.ScorecardSubmitted,
      EntityType: EntityType.Scorecard,
      EntityId: String(scorecardId),
      User: submittedBy,
      Details: `Scorecard submitted for director review (cycle ${newCycleNumber})`,
    }).catch(() => { /* fire-and-forget */ });

    return this.assembleScorecard(scorecardId);
  }

  async respondToScorecardSubmission(scorecardId: number, approved: boolean, comment: string): Promise<IGoNoGoScorecard> {
    const col = GONOGO_SCORECARD_COLUMNS;
    const cycCol = SCORECARD_APPROVAL_CYCLES_COLUMNS;
    const stepCol = SCORECARD_APPROVAL_STEPS_COLUMNS;
    const now = new Date().toISOString();

    // Find active cycle
    const activeCycles = await this.sp.web.lists.getByTitle(LIST_NAMES.SCORECARD_APPROVAL_CYCLES).items
      .filter(`${cycCol.scorecardId} eq ${scorecardId} and ${cycCol.status} eq 'Active'`)
      .top(1)();
    if (activeCycles.length === 0) throw new Error('No active approval cycle found');
    const cycleId = (activeCycles[0].ID as number) || (activeCycles[0].Id as number);

    // Find pending director step (stepOrder=2)
    const pendingSteps = await this.sp.web.lists.getByTitle(LIST_NAMES.SCORECARD_APPROVAL_STEPS).items
      .filter(`${stepCol.cycleId} eq ${cycleId} and ${stepCol.status} eq 'Pending'`)
      .top(1)();
    if (pendingSteps.length === 0) throw new Error('No pending approval step found');
    const stepId = (pendingSteps[0].ID as number) || (pendingSteps[0].Id as number);

    // Update step
    await this.sp.web.lists.getByTitle(LIST_NAMES.SCORECARD_APPROVAL_STEPS).items.getById(stepId).update({
      [stepCol.status]: approved ? 'Approved' : 'Returned',
      [stepCol.actionDate]: now,
      [stepCol.comment]: comment,
    });

    // Update scorecard status
    const newStatus = approved ? ScorecardStatus.AwaitingCommitteeScoring : ScorecardStatus.DirectorReturnedForRevision;
    await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items.getById(scorecardId).update({
      [col.scorecardStatus]: newStatus,
    });

    // If approved, complete cycle steps; if rejected, complete cycle
    if (!approved) {
      await this.sp.web.lists.getByTitle(LIST_NAMES.SCORECARD_APPROVAL_CYCLES).items.getById(cycleId).update({
        [cycCol.completedDate]: now,
        [cycCol.status]: 'Completed',
      });
    }

    this.logAudit({
      Action: approved ? AuditAction.ScorecardCommitteeScored : AuditAction.ScorecardReturned,
      EntityType: EntityType.Scorecard,
      EntityId: String(scorecardId),
      User: 'Director',
      Details: approved ? 'Director approved — advancing to committee scoring' : `Director returned for revision: ${comment}`,
    }).catch(() => { /* fire-and-forget */ });

    return this.assembleScorecard(scorecardId);
  }

  async enterCommitteeScores(scorecardId: number, scores: Record<string, number>, enteredBy: string): Promise<IGoNoGoScorecard> {
    const col = GONOGO_SCORECARD_COLUMNS;
    const now = new Date().toISOString();

    // Read current scorecard to merge scores
    const raw = await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items.getById(scorecardId)();
    let existingScores: IGoNoGoScorecard['scores'] = {};
    try { existingScores = JSON.parse(raw[col.scores] as string || '{}'); } catch { /* fallback */ }

    // Apply committee scores to each criterion
    for (const [criterionId, value] of Object.entries(scores)) {
      if (!existingScores[Number(criterionId)]) {
        existingScores[Number(criterionId)] = {};
      }
      existingScores[Number(criterionId)].committee = value;
    }

    // Calculate totals and recommended decision
    const totalCmte = calculateTotalScore(existingScores, 'committee');
    const recommended = getRecommendedDecision(totalCmte);

    // Update scorecard
    await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items.getById(scorecardId).update({
      [col.scores]: JSON.stringify(existingScores),
      [col.TotalScore_Cmte]: totalCmte,
      [col.recommendedDecision]: recommended.decision,
      [col.committeeScoresEnteredBy]: enteredBy,
      [col.committeeScoresEnteredDate]: now,
    });

    this.logAudit({
      Action: AuditAction.ScorecardCommitteeScored,
      EntityType: EntityType.Scorecard,
      EntityId: String(scorecardId),
      User: enteredBy,
      Details: `Committee scores entered. Total: ${totalCmte}. Recommended: ${recommended.decision}`,
    }).catch(() => { /* fire-and-forget */ });

    return this.assembleScorecard(scorecardId);
  }

  async recordFinalDecision(scorecardId: number, decision: GoNoGoDecision, conditions?: string, decidedBy?: string): Promise<IGoNoGoScorecard> {
    const col = GONOGO_SCORECARD_COLUMNS;
    const cycCol = SCORECARD_APPROVAL_CYCLES_COLUMNS;
    const now = new Date().toISOString();

    // Read current scorecard for Lead linkage
    const raw = await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items.getById(scorecardId)();
    const leadId = raw[col.LeadID] as number;

    // Determine status based on decision
    let newStatus: ScorecardStatus;
    if (decision === GoNoGoDecision.Go || decision === GoNoGoDecision.ConditionalGo) {
      newStatus = ScorecardStatus.Go;
    } else {
      newStatus = ScorecardStatus.NoGo;
    }

    // Update scorecard
    await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items.getById(scorecardId).update({
      [col.scorecardStatus]: newStatus,
      [col.finalDecision]: decision,
      [col.finalDecisionBy]: decidedBy || '',
      [col.finalDecisionDate]: now,
      [col.conditionalGoConditions]: conditions || '',
      [col.isLocked]: true,
    });

    // Complete active approval cycle
    const activeCycles = await this.sp.web.lists.getByTitle(LIST_NAMES.SCORECARD_APPROVAL_CYCLES).items
      .filter(`${cycCol.scorecardId} eq ${scorecardId} and ${cycCol.status} eq 'Active'`)();
    for (const cycle of activeCycles) {
      const cId = (cycle.ID as number) || (cycle.Id as number);
      await this.sp.web.lists.getByTitle(LIST_NAMES.SCORECARD_APPROVAL_CYCLES).items.getById(cId).update({
        [cycCol.completedDate]: now,
        [cycCol.status]: 'Completed',
      });
    }

    // Create version snapshot
    await this.createVersionSnapshot(scorecardId, `Final decision: ${decision}`, decidedBy || 'Committee');

    // Update linked Lead
    if (leadId) {
      const leadStage = (decision === GoNoGoDecision.Go || decision === GoNoGoDecision.ConditionalGo)
        ? Stage.Opportunity
        : Stage.ArchivedNoGo;
      await this.updateLead(leadId, {
        GoNoGoDecision: decision,
        GoNoGoDecisionDate: now,
        GoNoGoScore_Originator: raw[col.TotalScore_Orig] as number,
        GoNoGoScore_Committee: raw[col.TotalScore_Cmte] as number,
        Stage: leadStage,
      } as Partial<ILead>);
    }

    this.logAudit({
      Action: AuditAction.ScorecardDecisionMade,
      EntityType: EntityType.Scorecard,
      EntityId: String(scorecardId),
      User: decidedBy || 'Committee',
      Details: `Final decision: ${decision}${conditions ? '. Conditions: ' + conditions : ''}`,
    }).catch(() => { /* fire-and-forget */ });

    return this.assembleScorecard(scorecardId);
  }

  async unlockScorecard(scorecardId: number, reason: string): Promise<IGoNoGoScorecard> {
    const col = GONOGO_SCORECARD_COLUMNS;
    const now = new Date().toISOString();

    // Read current to get version + validate lock
    const raw = await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items.getById(scorecardId)();
    if (!raw[col.isLocked]) throw new Error('Scorecard is not currently locked');

    const currentVersion = (raw[col.currentVersion] as number) || 1;

    // Create version snapshot BEFORE unlock
    await this.createVersionSnapshot(scorecardId, `Pre-unlock snapshot: ${reason}`, raw[col.unlockedBy] as string || 'System');

    // Unlock
    await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items.getById(scorecardId).update({
      [col.isLocked]: false,
      [col.scorecardStatus]: ScorecardStatus.Unlocked,
      [col.currentVersion]: currentVersion + 1,
      [col.unlockedBy]: '',
      [col.unlockedDate]: now,
      [col.unlockReason]: reason,
    });

    this.logAudit({
      Action: AuditAction.ScorecardUnlocked,
      EntityType: EntityType.Scorecard,
      EntityId: String(scorecardId),
      User: 'Admin',
      Details: `Scorecard unlocked. Reason: ${reason}. Version incremented to ${currentVersion + 1}`,
    }).catch(() => { /* fire-and-forget */ });

    return this.assembleScorecard(scorecardId);
  }

  async relockScorecard(scorecardId: number, startNewCycle: boolean): Promise<IGoNoGoScorecard> {
    const col = GONOGO_SCORECARD_COLUMNS;
    const cycCol = SCORECARD_APPROVAL_CYCLES_COLUMNS;
    const stepCol = SCORECARD_APPROVAL_STEPS_COLUMNS;
    const now = new Date().toISOString();

    if (startNewCycle) {
      // Start a new approval cycle
      const existingCycles = await this.sp.web.lists.getByTitle(LIST_NAMES.SCORECARD_APPROVAL_CYCLES).items
        .filter(`${cycCol.scorecardId} eq ${scorecardId}`)();
      const newCycleNumber = existingCycles.length + 1;
      const raw = await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items.getById(scorecardId)();
      const currentVersion = (raw[col.currentVersion] as number) || 1;

      const cycleResult = await this.sp.web.lists.getByTitle(LIST_NAMES.SCORECARD_APPROVAL_CYCLES).items.add({
        [cycCol.scorecardId]: scorecardId,
        [cycCol.cycleNumber]: newCycleNumber,
        [cycCol.version]: currentVersion,
        [cycCol.startedDate]: now,
        [cycCol.status]: 'Active',
      });
      const newCycleId = (cycleResult.Id as number) || (cycleResult.data?.Id as number);

      // Step 1: BD Rep (auto-approved)
      await this.sp.web.lists.getByTitle(LIST_NAMES.SCORECARD_APPROVAL_STEPS).items.add({
        [stepCol.cycleId]: newCycleId,
        [stepCol.stepOrder]: 1,
        [stepCol.name]: 'BD Representative',
        [stepCol.assigneeEmail]: '',
        [stepCol.assigneeName]: '',
        [stepCol.assignmentSource]: 'Default',
        [stepCol.status]: 'Approved',
        [stepCol.actionDate]: now,
      });

      // Step 2: Director (pending)
      await this.sp.web.lists.getByTitle(LIST_NAMES.SCORECARD_APPROVAL_STEPS).items.add({
        [stepCol.cycleId]: newCycleId,
        [stepCol.stepOrder]: 2,
        [stepCol.name]: 'Department Director',
        [stepCol.assigneeEmail]: '',
        [stepCol.assigneeName]: '',
        [stepCol.assignmentSource]: 'Default',
        [stepCol.status]: 'Pending',
      });

      await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items.getById(scorecardId).update({
        [col.isLocked]: false,
        [col.scorecardStatus]: ScorecardStatus.AwaitingDirectorReview,
        [col.currentApprovalStep]: 2,
      });
    } else {
      // Simple relock without new cycle
      await this.createVersionSnapshot(scorecardId, 'Relocked', 'Admin');
      await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items.getById(scorecardId).update({
        [col.isLocked]: true,
        [col.scorecardStatus]: ScorecardStatus.Locked,
      });
    }

    this.logAudit({
      Action: AuditAction.ScorecardRelocked,
      EntityType: EntityType.Scorecard,
      EntityId: String(scorecardId),
      User: 'Admin',
      Details: startNewCycle ? 'Relocked with new approval cycle' : 'Relocked without new cycle',
    }).catch(() => { /* fire-and-forget */ });

    return this.assembleScorecard(scorecardId);
  }

  async getScorecardVersions(scorecardId: number): Promise<IScorecardVersion[]> {
    const col = SCORECARD_VERSIONS_COLUMNS;
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.SCORECARD_VERSIONS).items
      .filter(`${col.scorecardId} eq ${scorecardId}`)
      .orderBy(col.versionNumber, true)();
    return (items as Record<string, unknown>[]).map(i => this.mapToScorecardVersion(i));
  }

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

  async getTurnoverAgenda(projectCode: string): Promise<ITurnoverAgenda | null> {
    const web = this._getProjectWeb();
    const col = TURNOVER_AGENDAS_COLUMNS;

    // Read parent agenda
    const parents = await web.lists.getByTitle(LIST_NAMES.TURNOVER_AGENDAS).items
      .filter(`${col.projectCode} eq '${projectCode}'`)
      .top(1)();
    if (parents.length === 0) return null;

    const agenda = this.mapToTurnoverAgenda(parents[0]);

    // Read all 7 child lists + estimate overview in parallel
    const [prereqItems, discussionItemsRaw, attachmentItems, subItems, exhibitItems, sigItems, overviewItems] = await Promise.all([
      web.lists.getByTitle(LIST_NAMES.TURNOVER_PREREQUISITES).items
        .filter(`${TURNOVER_PREREQUISITES_COLUMNS.turnoverAgendaId} eq ${agenda.id}`)
        .top(500)(),
      web.lists.getByTitle(LIST_NAMES.TURNOVER_DISCUSSION_ITEMS).items
        .filter(`${TURNOVER_DISCUSSION_ITEMS_COLUMNS.turnoverAgendaId} eq ${agenda.id}`)
        .top(500)(),
      web.lists.getByTitle(LIST_NAMES.TURNOVER_ATTACHMENTS).items
        .top(5000)(),
      web.lists.getByTitle(LIST_NAMES.TURNOVER_SUBCONTRACTORS).items
        .filter(`${TURNOVER_SUBCONTRACTORS_COLUMNS.turnoverAgendaId} eq ${agenda.id}`)
        .top(500)(),
      web.lists.getByTitle(LIST_NAMES.TURNOVER_EXHIBITS).items
        .filter(`${TURNOVER_EXHIBITS_COLUMNS.turnoverAgendaId} eq ${agenda.id}`)
        .top(500)(),
      web.lists.getByTitle(LIST_NAMES.TURNOVER_SIGNATURES).items
        .filter(`${TURNOVER_SIGNATURES_COLUMNS.turnoverAgendaId} eq ${agenda.id}`)
        .top(500)(),
      web.lists.getByTitle(LIST_NAMES.TURNOVER_ESTIMATE_OVERVIEWS).items
        .filter(`${TURNOVER_ESTIMATE_OVERVIEWS_COLUMNS.turnoverAgendaId} eq ${agenda.id}`)
        .top(1)(),
    ]);

    // Get lead for header assembly
    const lead = agenda.leadId ? await this.getLeadById(agenda.leadId) : null;

    // Map all children
    const prereqs = prereqItems.map((i: Record<string, unknown>) => this.mapToTurnoverPrerequisite(i));
    const discussionItems = discussionItemsRaw.map((i: Record<string, unknown>) => this.mapToTurnoverDiscussionItem(i));
    const attachments = attachmentItems.map((i: Record<string, unknown>) => this.mapToTurnoverAttachment(i));
    const subs = subItems.map((i: Record<string, unknown>) => this.mapToTurnoverSubcontractor(i));
    const exhibits = exhibitItems.map((i: Record<string, unknown>) => this.mapToTurnoverExhibit(i));
    const sigs = sigItems.map((i: Record<string, unknown>) => this.mapToTurnoverSignature(i));
    const estimateOverview = overviewItems.length > 0
      ? this.mapToTurnoverEstimateOverview(overviewItems[0])
      : null;

    // Parse header overrides from agenda JSON column
    let headerOverrides: Record<string, boolean> = {};
    try {
      const raw = parents[0][col.headerOverrides];
      if (typeof raw === 'string' && raw) headerOverrides = JSON.parse(raw);
      else if (typeof raw === 'object' && raw !== null) headerOverrides = raw as Record<string, boolean>;
    } catch { /* safe fallback */ }

    return this.assembleTurnoverAgenda(agenda, lead, headerOverrides, estimateOverview, prereqs, discussionItems, attachments, subs, exhibits, sigs);
  }

  async createTurnoverAgenda(projectCode: string, leadId: number): Promise<ITurnoverAgenda> {
    const web = this._getProjectWeb();
    const col = TURNOVER_AGENDAS_COLUMNS;
    const now = new Date().toISOString();
    const createdBy = this._pageContextUser?.displayName || 'System';

    // Get lead for denormalized fields
    const lead = await this.getLeadById(leadId);

    // Create parent agenda
    const agendaData: Record<string, unknown> = {
      [col.projectCode]: projectCode,
      [col.leadId]: leadId,
      [col.status]: TurnoverStatus.Draft,
      [col.projectName]: lead?.Title || '',
      [col.createdBy]: createdBy,
      [col.createdDate]: now,
    };
    const agendaResult = await web.lists.getByTitle(LIST_NAMES.TURNOVER_AGENDAS).items.add(agendaData);
    const agendaId = (agendaResult as Record<string, unknown>).Id as number
      || ((agendaResult as Record<string, unknown>).data as Record<string, unknown>)?.Id as number
      || ((agendaResult as Record<string, unknown>).data as Record<string, unknown>)?.ID as number;

    // Seed defaults in parallel: prerequisites, discussion items, exhibits, signatures, estimate overview
    const prereqPromises = DEFAULT_PREREQUISITES.map(prereq =>
      web.lists.getByTitle(LIST_NAMES.TURNOVER_PREREQUISITES).items.add({
        [TURNOVER_PREREQUISITES_COLUMNS.turnoverAgendaId]: agendaId,
        [TURNOVER_PREREQUISITES_COLUMNS.sortOrder]: prereq.sortOrder,
        [TURNOVER_PREREQUISITES_COLUMNS.label]: prereq.label,
        [TURNOVER_PREREQUISITES_COLUMNS.description]: prereq.description,
        [TURNOVER_PREREQUISITES_COLUMNS.completed]: false,
      })
    );

    const discussionPromises = DEFAULT_DISCUSSION_ITEMS.map(item =>
      web.lists.getByTitle(LIST_NAMES.TURNOVER_DISCUSSION_ITEMS).items.add({
        [TURNOVER_DISCUSSION_ITEMS_COLUMNS.turnoverAgendaId]: agendaId,
        [TURNOVER_DISCUSSION_ITEMS_COLUMNS.sortOrder]: item.sortOrder,
        [TURNOVER_DISCUSSION_ITEMS_COLUMNS.label]: item.label,
        [TURNOVER_DISCUSSION_ITEMS_COLUMNS.description]: item.description,
        [TURNOVER_DISCUSSION_ITEMS_COLUMNS.discussed]: false,
        [TURNOVER_DISCUSSION_ITEMS_COLUMNS.notes]: '',
      })
    );

    const exhibitPromises = DEFAULT_EXHIBITS.map(exhibit =>
      web.lists.getByTitle(LIST_NAMES.TURNOVER_EXHIBITS).items.add({
        [TURNOVER_EXHIBITS_COLUMNS.turnoverAgendaId]: agendaId,
        [TURNOVER_EXHIBITS_COLUMNS.sortOrder]: exhibit.sortOrder,
        [TURNOVER_EXHIBITS_COLUMNS.label]: exhibit.label,
        [TURNOVER_EXHIBITS_COLUMNS.isDefault]: exhibit.isDefault,
        [TURNOVER_EXHIBITS_COLUMNS.reviewed]: false,
      })
    );

    const signaturePromises = DEFAULT_SIGNATURES.map(sig =>
      web.lists.getByTitle(LIST_NAMES.TURNOVER_SIGNATURES).items.add({
        [TURNOVER_SIGNATURES_COLUMNS.turnoverAgendaId]: agendaId,
        [TURNOVER_SIGNATURES_COLUMNS.sortOrder]: sig.sortOrder,
        [TURNOVER_SIGNATURES_COLUMNS.role]: sig.role,
        [TURNOVER_SIGNATURES_COLUMNS.signerName]: '',
        [TURNOVER_SIGNATURES_COLUMNS.signerEmail]: '',
        [TURNOVER_SIGNATURES_COLUMNS.affidavitText]: TURNOVER_SIGNATURE_AFFIDAVIT,
        [TURNOVER_SIGNATURES_COLUMNS.signed]: false,
      })
    );

    // Create estimate overview from lead data
    const projectValue = lead?.ProjectValue || 0;
    const feePct = lead?.AnticipatedFeePct || 5;
    const overviewPromise = web.lists.getByTitle(LIST_NAMES.TURNOVER_ESTIMATE_OVERVIEWS).items.add({
      [TURNOVER_ESTIMATE_OVERVIEWS_COLUMNS.turnoverAgendaId]: agendaId,
      [TURNOVER_ESTIMATE_OVERVIEWS_COLUMNS.contractAmount]: projectValue,
      [TURNOVER_ESTIMATE_OVERVIEWS_COLUMNS.originalEstimate]: projectValue,
      [TURNOVER_ESTIMATE_OVERVIEWS_COLUMNS.buyoutTarget]: Math.round(projectValue * 0.9),
      [TURNOVER_ESTIMATE_OVERVIEWS_COLUMNS.estimatedFee]: Math.round(projectValue * (feePct / 100)),
      [TURNOVER_ESTIMATE_OVERVIEWS_COLUMNS.estimatedGrossMargin]: lead?.AnticipatedGrossMargin || 0,
      [TURNOVER_ESTIMATE_OVERVIEWS_COLUMNS.contingency]: Math.round(projectValue * 0.015),
      [TURNOVER_ESTIMATE_OVERVIEWS_COLUMNS.notes]: '',
      [TURNOVER_ESTIMATE_OVERVIEWS_COLUMNS.overrides]: JSON.stringify({}),
    });

    await Promise.all([
      ...prereqPromises,
      ...discussionPromises,
      ...exhibitPromises,
      ...signaturePromises,
      overviewPromise,
    ]);

    // Re-read assembled
    const result = await this.getTurnoverAgenda(projectCode);
    if (!result) throw new Error(`Turnover agenda for ${projectCode} not found after creation`);
    return result;
  }

  async updateTurnoverAgenda(projectCode: string, data: Partial<ITurnoverAgenda>): Promise<ITurnoverAgenda> {
    const web = this._getProjectWeb();
    const col = TURNOVER_AGENDAS_COLUMNS;

    // Find agenda by projectCode
    const parents = await web.lists.getByTitle(LIST_NAMES.TURNOVER_AGENDAS).items
      .filter(`${col.projectCode} eq '${projectCode}'`)
      .top(1)();
    if (parents.length === 0) throw new Error(`Turnover agenda for ${projectCode} not found`);

    const agendaId = (parents[0].ID as number) || (parents[0].Id as number);
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      [col.lastModifiedDate]: now,
      [col.lastModifiedBy]: this._pageContextUser?.displayName || '',
    };

    // Conditional partial update
    if (data.status !== undefined) updateData[col.status] = data.status;
    if (data.meetingDate !== undefined) updateData[col.meetingDate] = data.meetingDate;
    if (data.recordingUrl !== undefined) updateData[col.recordingUrl] = data.recordingUrl;
    if (data.turnoverFolderUrl !== undefined) updateData[col.turnoverFolderUrl] = data.turnoverFolderUrl;
    if (data.bcPublished !== undefined) updateData[col.bcPublished] = data.bcPublished;
    if (data.pmName !== undefined) updateData[col.pmName] = data.pmName;
    if (data.apmName !== undefined) updateData[col.apmName] = data.apmName;
    if (data.projectName !== undefined) updateData[col.projectName] = data.projectName;

    await web.lists.getByTitle(LIST_NAMES.TURNOVER_AGENDAS).items.getById(agendaId).update(updateData);

    // Re-read assembled
    const result = await this.getTurnoverAgenda(projectCode);
    if (!result) throw new Error(`Turnover agenda for ${projectCode} not found after update`);
    return result;
  }
  async updateTurnoverPrerequisite(prerequisiteId: number, data: Partial<ITurnoverPrerequisite>): Promise<ITurnoverPrerequisite> {
    const web = this._getProjectWeb();
    const col = TURNOVER_PREREQUISITES_COLUMNS;
    const updateData: Record<string, unknown> = {};

    if (data.completed !== undefined) updateData[col.completed] = data.completed;
    if (data.completedBy !== undefined) updateData[col.completedBy] = data.completedBy;
    if (data.completedDate !== undefined) updateData[col.completedDate] = data.completedDate;
    if (data.label !== undefined) updateData[col.label] = data.label;
    if (data.description !== undefined) updateData[col.description] = data.description;
    if (data.sortOrder !== undefined) updateData[col.sortOrder] = data.sortOrder;

    await web.lists.getByTitle(LIST_NAMES.TURNOVER_PREREQUISITES).items.getById(prerequisiteId).update(updateData);

    const item = await web.lists.getByTitle(LIST_NAMES.TURNOVER_PREREQUISITES).items.getById(prerequisiteId)();
    return this.mapToTurnoverPrerequisite(item);
  }

  async updateTurnoverDiscussionItem(itemId: number, data: Partial<ITurnoverDiscussionItem>): Promise<ITurnoverDiscussionItem> {
    const web = this._getProjectWeb();
    const col = TURNOVER_DISCUSSION_ITEMS_COLUMNS;
    const updateData: Record<string, unknown> = {};

    if (data.discussed !== undefined) updateData[col.discussed] = data.discussed;
    if (data.notes !== undefined) updateData[col.notes] = data.notes;
    if (data.label !== undefined) updateData[col.label] = data.label;
    if (data.description !== undefined) updateData[col.description] = data.description;
    if (data.sortOrder !== undefined) updateData[col.sortOrder] = data.sortOrder;

    await web.lists.getByTitle(LIST_NAMES.TURNOVER_DISCUSSION_ITEMS).items.getById(itemId).update(updateData);

    const item = await web.lists.getByTitle(LIST_NAMES.TURNOVER_DISCUSSION_ITEMS).items.getById(itemId)();
    const mapped = this.mapToTurnoverDiscussionItem(item);

    // Load attachments for this discussion item
    const attachmentItems = await web.lists.getByTitle(LIST_NAMES.TURNOVER_ATTACHMENTS).items
      .filter(`${TURNOVER_ATTACHMENTS_COLUMNS.discussionItemId} eq ${itemId}`)
      .top(500)();
    mapped.attachments = attachmentItems.map((a: Record<string, unknown>) => this.mapToTurnoverAttachment(a));

    return mapped;
  }

  async addTurnoverDiscussionAttachment(itemId: number, file: File): Promise<ITurnoverAttachment> {
    const web = this._getProjectWeb();
    const col = TURNOVER_ATTACHMENTS_COLUMNS;
    const folderPath = 'Shared Documents/Turnover';

    // Ensure folder exists
    try {
      await web.getFolderByServerRelativePath(folderPath).select('Exists')();
    } catch {
      await web.folders.addUsingPath(folderPath);
    }

    // Upload file
    const fileName = `${Date.now()}_${file.name}`;
    const uploadResult = await web
      .getFolderByServerRelativePath(folderPath)
      .files.addUsingPath(fileName, file, { Overwrite: true });
    const fileUrl = (uploadResult.data as Record<string, unknown>).ServerRelativeUrl as string || `${folderPath}/${fileName}`;

    // Create attachment record
    const now = new Date().toISOString();
    const attachmentData: Record<string, unknown> = {
      [col.discussionItemId]: itemId,
      [col.fileName]: file.name,
      [col.fileUrl]: fileUrl,
      [col.uploadedBy]: this._pageContextUser?.displayName || '',
      [col.uploadedDate]: now,
    };
    const result = await web.lists.getByTitle(LIST_NAMES.TURNOVER_ATTACHMENTS).items.add(attachmentData);
    const newId = (result as Record<string, unknown>).Id as number
      || ((result as Record<string, unknown>).data as Record<string, unknown>)?.Id as number
      || ((result as Record<string, unknown>).data as Record<string, unknown>)?.ID as number;

    const item = await web.lists.getByTitle(LIST_NAMES.TURNOVER_ATTACHMENTS).items.getById(newId)();
    return this.mapToTurnoverAttachment(item);
  }

  async removeTurnoverDiscussionAttachment(attachmentId: number): Promise<void> {
    const web = this._getProjectWeb();
    await web.lists.getByTitle(LIST_NAMES.TURNOVER_ATTACHMENTS).items.getById(attachmentId).delete();
  }

  async addTurnoverSubcontractor(turnoverAgendaId: number, data: Partial<ITurnoverSubcontractor>): Promise<ITurnoverSubcontractor> {
    const web = this._getProjectWeb();
    const col = TURNOVER_SUBCONTRACTORS_COLUMNS;

    const addData: Record<string, unknown> = {
      [col.turnoverAgendaId]: turnoverAgendaId,
      [col.trade]: data.trade || '',
      [col.subcontractorName]: data.subcontractorName || '',
      [col.contactName]: data.contactName || '',
      [col.contactPhone]: data.contactPhone || '',
      [col.contactEmail]: data.contactEmail || '',
      [col.qScore]: data.qScore ?? null,
      [col.isPreferred]: data.isPreferred ?? false,
      [col.isRequired]: data.isRequired ?? false,
      [col.notes]: data.notes || '',
    };

    const result = await web.lists.getByTitle(LIST_NAMES.TURNOVER_SUBCONTRACTORS).items.add(addData);
    const newId = (result as Record<string, unknown>).Id as number
      || ((result as Record<string, unknown>).data as Record<string, unknown>)?.Id as number
      || ((result as Record<string, unknown>).data as Record<string, unknown>)?.ID as number;

    const item = await web.lists.getByTitle(LIST_NAMES.TURNOVER_SUBCONTRACTORS).items.getById(newId)();
    return this.mapToTurnoverSubcontractor(item);
  }

  async updateTurnoverSubcontractor(subId: number, data: Partial<ITurnoverSubcontractor>): Promise<ITurnoverSubcontractor> {
    const web = this._getProjectWeb();
    const col = TURNOVER_SUBCONTRACTORS_COLUMNS;
    const updateData: Record<string, unknown> = {};

    if (data.trade !== undefined) updateData[col.trade] = data.trade;
    if (data.subcontractorName !== undefined) updateData[col.subcontractorName] = data.subcontractorName;
    if (data.contactName !== undefined) updateData[col.contactName] = data.contactName;
    if (data.contactPhone !== undefined) updateData[col.contactPhone] = data.contactPhone;
    if (data.contactEmail !== undefined) updateData[col.contactEmail] = data.contactEmail;
    if (data.qScore !== undefined) updateData[col.qScore] = data.qScore;
    if (data.isPreferred !== undefined) updateData[col.isPreferred] = data.isPreferred;
    if (data.isRequired !== undefined) updateData[col.isRequired] = data.isRequired;
    if (data.notes !== undefined) updateData[col.notes] = data.notes;

    await web.lists.getByTitle(LIST_NAMES.TURNOVER_SUBCONTRACTORS).items.getById(subId).update(updateData);

    const item = await web.lists.getByTitle(LIST_NAMES.TURNOVER_SUBCONTRACTORS).items.getById(subId)();
    return this.mapToTurnoverSubcontractor(item);
  }

  async removeTurnoverSubcontractor(subId: number): Promise<void> {
    const web = this._getProjectWeb();
    await web.lists.getByTitle(LIST_NAMES.TURNOVER_SUBCONTRACTORS).items.getById(subId).delete();
  }

  async updateTurnoverExhibit(exhibitId: number, data: Partial<ITurnoverExhibit>): Promise<ITurnoverExhibit> {
    const web = this._getProjectWeb();
    const col = TURNOVER_EXHIBITS_COLUMNS;
    const updateData: Record<string, unknown> = {};

    if (data.label !== undefined) updateData[col.label] = data.label;
    if (data.sortOrder !== undefined) updateData[col.sortOrder] = data.sortOrder;
    if (data.reviewed !== undefined) updateData[col.reviewed] = data.reviewed;
    if (data.reviewedBy !== undefined) updateData[col.reviewedBy] = data.reviewedBy;
    if (data.reviewedDate !== undefined) updateData[col.reviewedDate] = data.reviewedDate;
    if (data.linkedDocumentUrl !== undefined) updateData[col.linkedDocumentUrl] = data.linkedDocumentUrl;
    if (data.uploadedFileName !== undefined) updateData[col.uploadedFileName] = data.uploadedFileName;
    if (data.uploadedFileUrl !== undefined) updateData[col.uploadedFileUrl] = data.uploadedFileUrl;

    await web.lists.getByTitle(LIST_NAMES.TURNOVER_EXHIBITS).items.getById(exhibitId).update(updateData);

    const item = await web.lists.getByTitle(LIST_NAMES.TURNOVER_EXHIBITS).items.getById(exhibitId)();
    return this.mapToTurnoverExhibit(item);
  }

  async addTurnoverExhibit(turnoverAgendaId: number, data: Partial<ITurnoverExhibit>): Promise<ITurnoverExhibit> {
    const web = this._getProjectWeb();
    const col = TURNOVER_EXHIBITS_COLUMNS;

    // Auto-calc sortOrder from existing exhibits
    const existingItems = await web.lists.getByTitle(LIST_NAMES.TURNOVER_EXHIBITS).items
      .filter(`${col.turnoverAgendaId} eq ${turnoverAgendaId}`)
      .select(col.sortOrder)
      .top(500)();
    const maxOrder = existingItems.length > 0
      ? Math.max(...existingItems.map((e: Record<string, unknown>) => (e[col.sortOrder] as number) || 0))
      : 0;

    const addData: Record<string, unknown> = {
      [col.turnoverAgendaId]: turnoverAgendaId,
      [col.sortOrder]: data.sortOrder || maxOrder + 1,
      [col.label]: data.label || 'Custom Exhibit',
      [col.isDefault]: false,
      [col.reviewed]: false,
    };

    const result = await web.lists.getByTitle(LIST_NAMES.TURNOVER_EXHIBITS).items.add(addData);
    const newId = (result as Record<string, unknown>).Id as number
      || ((result as Record<string, unknown>).data as Record<string, unknown>)?.Id as number
      || ((result as Record<string, unknown>).data as Record<string, unknown>)?.ID as number;

    const item = await web.lists.getByTitle(LIST_NAMES.TURNOVER_EXHIBITS).items.getById(newId)();
    return this.mapToTurnoverExhibit(item);
  }

  async removeTurnoverExhibit(exhibitId: number): Promise<void> {
    const web = this._getProjectWeb();
    await web.lists.getByTitle(LIST_NAMES.TURNOVER_EXHIBITS).items.getById(exhibitId).delete();
  }

  async uploadTurnoverExhibitFile(exhibitId: number, file: File): Promise<{ fileUrl: string; fileName: string }> {
    const web = this._getProjectWeb();
    const col = TURNOVER_EXHIBITS_COLUMNS;
    const folderPath = 'Shared Documents/Turnover';

    // Ensure folder exists
    try {
      await web.getFolderByServerRelativePath(folderPath).select('Exists')();
    } catch {
      await web.folders.addUsingPath(folderPath);
    }

    // Upload file
    const fileName = `exhibit_${exhibitId}_${file.name}`;
    const uploadResult = await web
      .getFolderByServerRelativePath(folderPath)
      .files.addUsingPath(fileName, file, { Overwrite: true });
    const fileUrl = (uploadResult.data as Record<string, unknown>).ServerRelativeUrl as string || `${folderPath}/${fileName}`;

    // Update exhibit with file reference
    await web.lists.getByTitle(LIST_NAMES.TURNOVER_EXHIBITS).items.getById(exhibitId).update({
      [col.uploadedFileName]: file.name,
      [col.uploadedFileUrl]: fileUrl,
    });

    return { fileUrl, fileName: file.name };
  }

  async signTurnoverAgenda(signatureId: number, comment?: string): Promise<ITurnoverSignature> {
    const web = this._getProjectWeb();
    const col = TURNOVER_SIGNATURES_COLUMNS;
    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = {
      [col.signed]: true,
      [col.signedDate]: now,
      [col.signerName]: this._pageContextUser?.displayName || '',
      [col.signerEmail]: this._pageContextUser?.email || '',
    };
    if (comment !== undefined) updateData[col.comment] = comment;

    await web.lists.getByTitle(LIST_NAMES.TURNOVER_SIGNATURES).items.getById(signatureId).update(updateData);

    const item = await web.lists.getByTitle(LIST_NAMES.TURNOVER_SIGNATURES).items.getById(signatureId)();
    return this.mapToTurnoverSignature(item);
  }

  async updateTurnoverEstimateOverview(projectCode: string, data: Partial<ITurnoverEstimateOverview>): Promise<ITurnoverEstimateOverview> {
    const web = this._getProjectWeb();
    const agendaCol = TURNOVER_AGENDAS_COLUMNS;
    const col = TURNOVER_ESTIMATE_OVERVIEWS_COLUMNS;

    // Find agenda by projectCode
    const agendas = await web.lists.getByTitle(LIST_NAMES.TURNOVER_AGENDAS).items
      .filter(`${agendaCol.projectCode} eq '${projectCode}'`)
      .select('ID', 'Id')
      .top(1)();
    if (agendas.length === 0) throw new Error(`Turnover agenda for ${projectCode} not found`);
    const agendaId = (agendas[0].ID as number) || (agendas[0].Id as number);

    // Find estimate overview for this agenda
    const overviews = await web.lists.getByTitle(LIST_NAMES.TURNOVER_ESTIMATE_OVERVIEWS).items
      .filter(`${col.turnoverAgendaId} eq ${agendaId}`)
      .top(1)();
    if (overviews.length === 0) throw new Error(`Estimate overview for agenda ${agendaId} not found`);
    const overviewId = (overviews[0].ID as number) || (overviews[0].Id as number);

    const updateData: Record<string, unknown> = {};
    if (data.contractAmount !== undefined) updateData[col.contractAmount] = data.contractAmount;
    if (data.originalEstimate !== undefined) updateData[col.originalEstimate] = data.originalEstimate;
    if (data.buyoutTarget !== undefined) updateData[col.buyoutTarget] = data.buyoutTarget;
    if (data.estimatedFee !== undefined) updateData[col.estimatedFee] = data.estimatedFee;
    if (data.estimatedGrossMargin !== undefined) updateData[col.estimatedGrossMargin] = data.estimatedGrossMargin;
    if (data.contingency !== undefined) updateData[col.contingency] = data.contingency;
    if (data.notes !== undefined) updateData[col.notes] = data.notes;
    if (data.overrides !== undefined) updateData[col.overrides] = JSON.stringify(data.overrides);

    await web.lists.getByTitle(LIST_NAMES.TURNOVER_ESTIMATE_OVERVIEWS).items.getById(overviewId).update(updateData);

    const item = await web.lists.getByTitle(LIST_NAMES.TURNOVER_ESTIMATE_OVERVIEWS).items.getById(overviewId)();
    return this.mapToTurnoverEstimateOverview(item);
  }

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

  async getActionItems(userEmail: string): Promise<IActionInboxItem[]> {
    const items: IActionInboxItem[] = [];
    const now = Date.now();
    const calcWaitingDays = (dateStr: string): number => Math.floor((now - new Date(dateStr).getTime()) / 86400000);
    const calcPriority = (days: number): ActionPriority => {
      if (days > 7) return ActionPriority.Urgent;
      if (days >= 1) return ActionPriority.Normal;
      return ActionPriority.New;
    };

    try {
      // 1. Scorecard approval steps — pending steps assigned to user
      const scorecardSteps = await this.sp.web.lists.getByTitle(LIST_NAMES.SCORECARD_APPROVAL_STEPS).items
        .filter(`${SCORECARD_APPROVAL_STEPS_COLUMNS.assigneeEmail} eq '${userEmail}' and ${SCORECARD_APPROVAL_STEPS_COLUMNS.status} eq 'Pending'`)
        .top(50)();

      for (const step of scorecardSteps) {
        const cycleId = step[SCORECARD_APPROVAL_STEPS_COLUMNS.cycleId] as number;
        // Look up cycle to get scorecardId
        try {
          const cycle = await this.sp.web.lists.getByTitle(LIST_NAMES.SCORECARD_APPROVAL_CYCLES).items.getById(cycleId)();
          const scorecardId = cycle[SCORECARD_APPROVAL_CYCLES_COLUMNS.scorecardId] as number;
          const startedDate = cycle[SCORECARD_APPROVAL_CYCLES_COLUMNS.startedDate] as string || new Date().toISOString();
          // Look up scorecard to get LeadID
          const scorecard = await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items.getById(scorecardId)();
          const leadId = scorecard[GONOGO_SCORECARD_COLUMNS.LeadID] as number;
          const waitingDays = calcWaitingDays(startedDate);

          items.push({
            id: `scorecard-step-${step.Id || step.ID}`,
            workflowType: WorkflowActionType.GoNoGoReview,
            actionLabel: `Review Go/No-Go Scorecard`,
            projectCode: scorecard[GONOGO_SCORECARD_COLUMNS.ProjectCode] as string || '',
            projectName: '',
            entityId: scorecardId,
            requestedBy: '',
            requestedByEmail: '',
            requestedDate: startedDate,
            waitingDays,
            routePath: `/lead/${leadId}/gonogo`,
            priority: calcPriority(waitingDays),
          });
        } catch { /* skip if cycle/scorecard not found */ }
      }
    } catch { /* scorecard query failed — continue */ }

    try {
      // 2. PMP approval steps — pending steps assigned to user
      const pmpSteps = await this.sp.web.lists.getByTitle(LIST_NAMES.PMP_APPROVAL_STEPS).items
        .filter(`${PMP_APPROVAL_STEPS_COLUMNS.approverEmail} eq '${userEmail}' and ${PMP_APPROVAL_STEPS_COLUMNS.status} eq 'Pending'`)
        .top(50)();

      for (const step of pmpSteps) {
        const projectCode = step[PMP_APPROVAL_STEPS_COLUMNS.projectCode] as string || '';
        const requestedDate = step[PMP_APPROVAL_STEPS_COLUMNS.actionDate] as string || new Date().toISOString();
        const waitingDays = calcWaitingDays(requestedDate);

        items.push({
          id: `pmp-step-${step.Id || step.ID}`,
          workflowType: WorkflowActionType.PMPApproval,
          actionLabel: `Approve Project Management Plan`,
          projectCode,
          projectName: '',
          entityId: step.Id || step.ID,
          requestedBy: '',
          requestedByEmail: '',
          requestedDate,
          waitingDays,
          routePath: `/operations/management-plan`,
          priority: calcPriority(waitingDays),
        });
      }
    } catch { /* pmp query failed — continue */ }

    try {
      // 3. PMP signatures — pending signatures assigned to user
      const pmpSigs = await this.sp.web.lists.getByTitle(LIST_NAMES.PMP_SIGNATURES).items
        .filter(`${PMP_SIGNATURES_COLUMNS.personEmail} eq '${userEmail}' and ${PMP_SIGNATURES_COLUMNS.status} eq 'Pending'`)
        .top(50)();

      for (const sig of pmpSigs) {
        const projectCode = sig[PMP_SIGNATURES_COLUMNS.projectCode] as string || '';
        const requestedDate = new Date().toISOString();
        const waitingDays = 0;

        items.push({
          id: `pmp-sig-${sig.Id || sig.ID}`,
          workflowType: WorkflowActionType.PMPSignature,
          actionLabel: `Sign Project Management Plan`,
          projectCode,
          projectName: '',
          entityId: sig.Id || sig.ID,
          requestedBy: '',
          requestedByEmail: '',
          requestedDate,
          waitingDays,
          routePath: `/operations/management-plan`,
          priority: calcPriority(waitingDays),
        });
      }
    } catch { /* pmp signature query failed — continue */ }

    try {
      // 4. Monthly reviews — reviews requiring PX action
      const reviews = await this.sp.web.lists.getByTitle(LIST_NAMES.MONTHLY_REVIEWS).items
        .filter(`${MONTHLY_REVIEWS_COLUMNS.status} eq 'PendingPXReview' or ${MONTHLY_REVIEWS_COLUMNS.status} eq 'PendingPXValidation'`)
        .top(50)();

      for (const review of reviews) {
        const projectCode = review[MONTHLY_REVIEWS_COLUMNS.projectCode] as string || '';
        const submittedDate = review[MONTHLY_REVIEWS_COLUMNS.pmSubmittedDate] as string || review[MONTHLY_REVIEWS_COLUMNS.lastUpdatedAt] as string || new Date().toISOString();
        const waitingDays = calcWaitingDays(submittedDate);

        items.push({
          id: `review-${review.Id || review.ID}`,
          workflowType: WorkflowActionType.MonthlyReviewValidation,
          actionLabel: `Review Monthly Project Review`,
          projectCode,
          projectName: '',
          entityId: review.Id || review.ID,
          requestedBy: '',
          requestedByEmail: '',
          requestedDate: submittedDate,
          waitingDays,
          routePath: `/operations/monthly-review`,
          priority: calcPriority(waitingDays),
        });
      }
    } catch { /* monthly review query failed — continue */ }

    // Sort by priority (Urgent first) then waiting days descending
    const priorityOrder: Record<string, number> = { Urgent: 3, Normal: 2, New: 1 };
    items.sort((a, b) => {
      const pDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return b.waitingDays - a.waitingDays;
    });

    return items;
  }

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

  async getSectorDefinitions(): Promise<ISectorDefinition[]> {
    const col = SECTOR_DEFINITIONS_COLUMNS;
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.SECTOR_DEFINITIONS).items
      .orderBy(col.sortOrder, true)
      .top(500)();
    return items.map((item: Record<string, unknown>) => this.mapToSectorDefinition(item));
  }

  async createSectorDefinition(data: Partial<ISectorDefinition>): Promise<ISectorDefinition> {
    const col = SECTOR_DEFINITIONS_COLUMNS;

    // Auto-generate code from label if not provided
    const code = data.code || data.label?.toUpperCase().replace(/[^A-Z0-9]/g, '_') || 'NEW';

    // Determine sortOrder: default to max+1
    let sortOrder = data.sortOrder;
    if (sortOrder === undefined) {
      const existing = await this.sp.web.lists.getByTitle(LIST_NAMES.SECTOR_DEFINITIONS).items
        .orderBy(col.sortOrder, false).top(1)();
      const maxSort = existing.length > 0 ? ((existing[0] as Record<string, unknown>)[col.sortOrder] as number || 0) : 0;
      sortOrder = maxSort + 1;
    }

    const result = await this.sp.web.lists.getByTitle(LIST_NAMES.SECTOR_DEFINITIONS).items.add({
      [col.code]: code,
      [col.label]: data.label || 'New Sector',
      [col.isActive]: data.isActive ?? true,
      [col.parentDivision]: data.parentDivision || null,
      [col.sortOrder]: sortOrder,
    });
    const newId = (result as Record<string, unknown>).Id as number || (result as Record<string, unknown>).id as number;

    const created = await this.sp.web.lists.getByTitle(LIST_NAMES.SECTOR_DEFINITIONS).items.getById(newId)();
    return this.mapToSectorDefinition(created);
  }

  async updateSectorDefinition(id: number, data: Partial<ISectorDefinition>): Promise<ISectorDefinition> {
    const col = SECTOR_DEFINITIONS_COLUMNS;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (data.code !== undefined) updateData[col.code] = data.code;
    if (data.label !== undefined) updateData[col.label] = data.label;
    if (data.isActive !== undefined) updateData[col.isActive] = data.isActive;
    if (data.parentDivision !== undefined) updateData[col.parentDivision] = data.parentDivision;
    if (data.sortOrder !== undefined) updateData[col.sortOrder] = data.sortOrder;

    await this.sp.web.lists.getByTitle(LIST_NAMES.SECTOR_DEFINITIONS).items.getById(id).update(updateData);

    const updated = await this.sp.web.lists.getByTitle(LIST_NAMES.SECTOR_DEFINITIONS).items.getById(id)();
    return this.mapToSectorDefinition(updated);
  }

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

  async getAssignmentMappings(): Promise<IAssignmentMapping[]> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.ASSIGNMENT_MAPPINGS).items.top(500)();
    return items.map((item: Record<string, unknown>) => this.mapToAssignmentMapping(item));
  }

  async createAssignmentMapping(data: Partial<IAssignmentMapping>): Promise<IAssignmentMapping> {
    const col = ASSIGNMENT_MAPPINGS_COLUMNS;

    const result = await this.sp.web.lists.getByTitle(LIST_NAMES.ASSIGNMENT_MAPPINGS).items.add({
      [col.region]: data.region || 'All Regions',
      [col.sector]: data.sector || 'All Sectors',
      [col.assignmentType]: data.assignmentType || 'Director',
      [col.assigneeUserId]: data.assignee?.userId || '',
      [col.assigneeDisplayName]: data.assignee?.displayName || '',
      [col.assigneeEmail]: data.assignee?.email || '',
    });
    const newId = (result as Record<string, unknown>).Id as number || (result as Record<string, unknown>).id as number;

    const created = await this.sp.web.lists.getByTitle(LIST_NAMES.ASSIGNMENT_MAPPINGS).items.getById(newId)();
    return this.mapToAssignmentMapping(created);
  }

  async updateAssignmentMapping(id: number, data: Partial<IAssignmentMapping>): Promise<IAssignmentMapping> {
    const col = ASSIGNMENT_MAPPINGS_COLUMNS;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (data.region !== undefined) updateData[col.region] = data.region;
    if (data.sector !== undefined) updateData[col.sector] = data.sector;
    if (data.assignmentType !== undefined) updateData[col.assignmentType] = data.assignmentType;
    if (data.assignee) {
      updateData[col.assigneeUserId] = data.assignee.userId;
      updateData[col.assigneeDisplayName] = data.assignee.displayName;
      updateData[col.assigneeEmail] = data.assignee.email;
    }

    await this.sp.web.lists.getByTitle(LIST_NAMES.ASSIGNMENT_MAPPINGS).items.getById(id).update(updateData);

    const updated = await this.sp.web.lists.getByTitle(LIST_NAMES.ASSIGNMENT_MAPPINGS).items.getById(id)();
    return this.mapToAssignmentMapping(updated);
  }

  async deleteAssignmentMapping(id: number): Promise<void> {
    await this.sp.web.lists.getByTitle(LIST_NAMES.ASSIGNMENT_MAPPINGS).items.getById(id).recycle();
  }

  // --- Scorecard Reject / Archive ---

  async rejectScorecard(scorecardId: number, reason: string): Promise<IGoNoGoScorecard> {
    const col = GONOGO_SCORECARD_COLUMNS;
    const cycCol = SCORECARD_APPROVAL_CYCLES_COLUMNS;
    const stepCol = SCORECARD_APPROVAL_STEPS_COLUMNS;
    const now = new Date().toISOString();

    // Set status to Rejected, lock, set finalDecision=NoGo
    await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items.getById(scorecardId).update({
      [col.scorecardStatus]: ScorecardStatus.Rejected,
      [col.isLocked]: true,
      [col.finalDecision]: GoNoGoDecision.NoGo,
      [col.finalDecisionDate]: now,
    });

    // Complete active cycle and mark pending steps as Returned
    const activeCycles = await this.sp.web.lists.getByTitle(LIST_NAMES.SCORECARD_APPROVAL_CYCLES).items
      .filter(`${cycCol.scorecardId} eq ${scorecardId} and ${cycCol.status} eq 'Active'`)();
    for (const cycle of activeCycles) {
      const cId = (cycle.ID as number) || (cycle.Id as number);
      // Mark pending steps as Returned
      const pendingSteps = await this.sp.web.lists.getByTitle(LIST_NAMES.SCORECARD_APPROVAL_STEPS).items
        .filter(`${stepCol.cycleId} eq ${cId} and ${stepCol.status} eq 'Pending'`)();
      for (const step of pendingSteps) {
        const sId = (step.ID as number) || (step.Id as number);
        await this.sp.web.lists.getByTitle(LIST_NAMES.SCORECARD_APPROVAL_STEPS).items.getById(sId).update({
          [stepCol.status]: 'Returned',
          [stepCol.actionDate]: now,
          [stepCol.comment]: reason,
        });
      }
      await this.sp.web.lists.getByTitle(LIST_NAMES.SCORECARD_APPROVAL_CYCLES).items.getById(cId).update({
        [cycCol.completedDate]: now,
        [cycCol.status]: 'Completed',
      });
    }

    // Create version snapshot
    await this.createVersionSnapshot(scorecardId, `Rejected: ${reason}`, 'Director');

    this.logAudit({
      Action: AuditAction.ScorecardReturned,
      EntityType: EntityType.Scorecard,
      EntityId: String(scorecardId),
      User: 'Director',
      Details: `Scorecard rejected. Reason: ${reason}`,
    }).catch(() => { /* fire-and-forget */ });

    return this.assembleScorecard(scorecardId);
  }

  async archiveScorecard(scorecardId: number, archivedBy: string): Promise<IGoNoGoScorecard> {
    const now = new Date().toISOString();

    await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items.getById(scorecardId).update({
      isArchived: true,
      archivedDate: now,
      archivedBy,
    });

    this.logAudit({
      Action: AuditAction.ScorecardArchived,
      EntityType: EntityType.Scorecard,
      EntityId: String(scorecardId),
      User: archivedBy,
      Details: 'Scorecard archived',
    }).catch(() => { /* fire-and-forget */ });

    return this.assembleScorecard(scorecardId);
  }

  // ═══════════════════════════════════════════════════════════════════
  // ──── Project Site URL Targeting & Web Factory ────
  // ═══════════════════════════════════════════════════════════════════

  private _projectSiteUrl: string | null = null;

  public setProjectSiteUrl(siteUrl: string | null): void {
    this._projectSiteUrl = siteUrl;
  }

  /**
   * Returns a PnP web instance for the project site.
   * Uses Web() factory for cross-site access when _projectSiteUrl is set,
   * otherwise falls back to the current web context.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _getProjectWeb(): any {
    if (this._projectSiteUrl) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Web } = require('@pnp/sp/webs');
      return Web([this.sp.web, this._projectSiteUrl]);
    }
    return this.sp.web;
  }

  // ═══════════════════════════════════════════════════════════════════
  // ──── Private Mapper Helpers — Chunk 4 ────
  // ═══════════════════════════════════════════════════════════════════

  private mapToStartupChecklistItem(
    item: Record<string, unknown>,
    activityLog?: IChecklistActivityEntry[]
  ): IStartupChecklistItem {
    const col = STARTUP_CHECKLIST_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      projectCode: (item[col.projectCode] as string) || '',
      sectionNumber: (item[col.sectionNumber] as number) || 0,
      sectionName: (item[col.sectionName] as string) || '',
      itemNumber: (item[col.itemNumber] as string) || '',
      label: (item[col.label] as string) || '',
      responseType: (item[col.responseType] as IStartupChecklistItem['responseType']) || 'yesNoNA',
      response: item[col.response] as string | number | null ?? null,
      status: (item[col.status] as IStartupChecklistItem['status']) || 'NoResponse',
      respondedBy: (item[col.respondedBy] as string) || null,
      respondedDate: (item[col.respondedDate] as string) || null,
      assignedTo: (item[col.assignedTo] as string) || null,
      assignedToName: (item[col.assignedToName] as string) || null,
      comment: (item[col.comment] as string) || null,
      isHidden: !!(item[col.isHidden]),
      isCustom: !!(item[col.isCustom]),
      sortOrder: (item[col.sortOrder] as number) || 0,
      activityLog: activityLog || [],
    };
  }

  private mapToChecklistActivityEntry(item: Record<string, unknown>): IChecklistActivityEntry {
    const col = CHECKLIST_ACTIVITY_LOG_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      checklistItemId: (item[col.checklistItemId] as number) || undefined,
      projectCode: (item[col.projectCode] as string) || undefined,
      timestamp: (item[col.timestamp] as string) || '',
      user: (item[col.user] as string) || '',
      previousValue: (item[col.previousValue] as string) || null,
      newValue: (item[col.newValue] as string) || null,
      comment: (item[col.comment] as string) || undefined,
    };
  }

  private mapToInternalMatrixTask(item: Record<string, unknown>): IInternalMatrixTask {
    const col = INTERNAL_MATRIX_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      projectCode: (item[col.projectCode] as string) || '',
      sortOrder: (item[col.sortOrder] as number) || 0,
      taskCategory: (item[col.taskCategory] as string) || '',
      taskDescription: (item[col.taskDescription] as string) || '',
      PX: (item[col.PX] as IInternalMatrixTask['PX']) || '',
      SrPM: (item[col.SrPM] as IInternalMatrixTask['SrPM']) || '',
      PM2: (item[col.PM2] as IInternalMatrixTask['PM2']) || '',
      PM1: (item[col.PM1] as IInternalMatrixTask['PM1']) || '',
      PA: (item[col.PA] as IInternalMatrixTask['PA']) || '',
      QAQC: (item[col.QAQC] as IInternalMatrixTask['QAQC']) || '',
      ProjAcct: (item[col.ProjAcct] as IInternalMatrixTask['ProjAcct']) || '',
      isHidden: !!(item[col.isHidden]),
      isCustom: !!(item[col.isCustom]),
    };
  }

  private mapToOwnerContractArticle(item: Record<string, unknown>): IOwnerContractArticle {
    const col = OWNER_CONTRACT_MATRIX_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      projectCode: (item[col.projectCode] as string) || '',
      sortOrder: (item[col.sortOrder] as number) || 0,
      articleNumber: (item[col.articleNumber] as string) || '',
      pageNumber: (item[col.pageNumber] as string) || '',
      responsibleParty: (item[col.responsibleParty] as IOwnerContractArticle['responsibleParty']) || '',
      description: (item[col.description] as string) || '',
      isHidden: !!(item[col.isHidden]),
      isCustom: !!(item[col.isCustom]),
    };
  }

  private mapToSubContractClause(item: Record<string, unknown>): ISubContractClause {
    const col = SUB_CONTRACT_MATRIX_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      projectCode: (item[col.projectCode] as string) || '',
      sortOrder: (item[col.sortOrder] as number) || 0,
      refNumber: (item[col.refNumber] as string) || '',
      pageNumber: (item[col.pageNumber] as string) || '',
      clauseDescription: (item[col.clauseDescription] as string) || '',
      ProjExec: (item[col.ProjExec] as ISubContractClause['ProjExec']) || '',
      ProjMgr: (item[col.ProjMgr] as ISubContractClause['ProjMgr']) || '',
      AsstPM: (item[col.AsstPM] as ISubContractClause['AsstPM']) || '',
      Super: (item[col.Super] as ISubContractClause['Super']) || '',
      ProjAdmin: (item[col.ProjAdmin] as ISubContractClause['ProjAdmin']) || '',
      isHidden: !!(item[col.isHidden]),
      isCustom: !!(item[col.isCustom]),
    };
  }

  private mapToMarketingProjectRecord(item: Record<string, unknown>): IMarketingProjectRecord {
    const col = MARKETING_PROJECT_RECORDS_COLUMNS;

    // Parse JSON arrays with safe fallbacks
    let contractType: string[] = [];
    try {
      const raw = item[col.contractType];
      if (typeof raw === 'string' && raw) contractType = JSON.parse(raw);
      else if (Array.isArray(raw)) contractType = raw as string[];
    } catch { /* default empty */ }

    let renderingUrls: string[] = [];
    try {
      const raw = item[col.renderingUrls];
      if (typeof raw === 'string' && raw) renderingUrls = JSON.parse(raw);
      else if (Array.isArray(raw)) renderingUrls = raw as string[];
    } catch { /* default empty */ }

    let finalPhotoUrls: string[] = [];
    try {
      const raw = item[col.finalPhotoUrls];
      if (typeof raw === 'string' && raw) finalPhotoUrls = JSON.parse(raw);
      else if (Array.isArray(raw)) finalPhotoUrls = raw as string[];
    } catch { /* default empty */ }

    let sectionCompletion: Record<string, number> = {};
    try {
      const raw = item[col.sectionCompletion];
      if (typeof raw === 'string' && raw) sectionCompletion = JSON.parse(raw);
      else if (raw && typeof raw === 'object') sectionCompletion = raw as Record<string, number>;
    } catch { /* default empty */ }

    return {
      projectName: (item[col.projectName] as string) || '',
      projectCode: (item[col.projectCode] as string) || '',
      leadId: (item[col.leadId] as number) || null,
      contractType,
      deliveryMethod: (item[col.deliveryMethod] as string) || '',
      architect: (item[col.architect] as string) || '',
      landscapeArchitect: (item[col.landscapeArchitect] as string) || '',
      interiorDesigner: (item[col.interiorDesigner] as string) || '',
      engineer: (item[col.engineer] as string) || '',
      buildingSystemType: (item[col.buildingSystemType] as string) || '',
      projectDescription: (item[col.projectDescription] as string) || '',
      uniqueCharacteristics: (item[col.uniqueCharacteristics] as string) || '',
      renderingUrls,
      finalPhotoUrls,
      contractBudget: (item[col.contractBudget] as number) || null,
      contractFinalCost: (item[col.contractFinalCost] as number) || null,
      totalCostPerGSF: (item[col.totalCostPerGSF] as number) || null,
      totalBudgetVariance: (item[col.totalBudgetVariance] as number) || null,
      budgetExplanation: (item[col.budgetExplanation] as string) || '',
      CO_OwnerDirected_Count: (item[col.CO_OwnerDirected_Count] as number) || null,
      CO_OwnerDirected_Value: (item[col.CO_OwnerDirected_Value] as number) || null,
      CO_MunicipalityDirected_Count: (item[col.CO_MunicipalityDirected_Count] as number) || null,
      CO_MunicipalityDirected_Value: (item[col.CO_MunicipalityDirected_Value] as number) || null,
      CO_EO_Count: (item[col.CO_EO_Count] as number) || null,
      CO_EO_Value: (item[col.CO_EO_Value] as number) || null,
      CO_ContractorDirected_Count: (item[col.CO_ContractorDirected_Count] as number) || null,
      savingsReturned: (item[col.savingsReturned] as number) || null,
      savingsReturnedPct: (item[col.savingsReturnedPct] as number) || null,
      scheduleStartAnticipated: (item[col.scheduleStartAnticipated] as string) || null,
      scheduleStartActual: (item[col.scheduleStartActual] as string) || null,
      scheduleEndAnticipated: (item[col.scheduleEndAnticipated] as string) || null,
      scheduleEndActual: (item[col.scheduleEndActual] as string) || null,
      onSchedule: (item[col.onSchedule] as string) || '',
      scheduleExplanation: (item[col.scheduleExplanation] as string) || '',
      substantialCompletionDate: (item[col.substantialCompletionDate] as string) || null,
      finalCompletionDate: (item[col.finalCompletionDate] as string) || null,
      punchListItems: (item[col.punchListItems] as number) || null,
      punchListDaysToComplete: (item[col.punchListDaysToComplete] as number) || null,
      innovativeSafetyPrograms: (item[col.innovativeSafetyPrograms] as string) || '',
      mwbeRequirement: (item[col.mwbeRequirement] as string) || '',
      mwbeAchievement: (item[col.mwbeAchievement] as string) || '',
      sbeRequirement: (item[col.sbeRequirement] as string) || '',
      sbeAchievement: (item[col.sbeAchievement] as string) || '',
      localRequirement: (item[col.localRequirement] as string) || '',
      localAchievement: (item[col.localAchievement] as string) || '',
      leedDesignation: (item[col.leedDesignation] as string) || '',
      sustainabilityFeatures: (item[col.sustainabilityFeatures] as string) || '',
      leedAdditionalCost: (item[col.leedAdditionalCost] as number) || null,
      CS_Conflicts: (item[col.CS_Conflicts] as string) || '',
      CS_CostControl: (item[col.CS_CostControl] as string) || '',
      CS_ValueEngineering: (item[col.CS_ValueEngineering] as string) || '',
      CS_QualityControl: (item[col.CS_QualityControl] as string) || '',
      CS_Schedule: (item[col.CS_Schedule] as string) || '',
      CS_Team: (item[col.CS_Team] as string) || '',
      CS_Safety: (item[col.CS_Safety] as string) || '',
      CS_LEED: (item[col.CS_LEED] as string) || '',
      CS_SupplierDiversity: (item[col.CS_SupplierDiversity] as string) || '',
      CS_Challenges: (item[col.CS_Challenges] as string) || '',
      CS_InnovativeSolutions: (item[col.CS_InnovativeSolutions] as string) || '',
      CS_ProductsSystems: (item[col.CS_ProductsSystems] as string) || '',
      CS_ClientService: (item[col.CS_ClientService] as string) || '',
      CS_LessonsLearned: (item[col.CS_LessonsLearned] as string) || '',
      sectionCompletion,
      overallCompletion: (item[col.overallCompletion] as number) || 0,
      lastUpdatedBy: (item[col.lastUpdatedBy] as string) || '',
      lastUpdatedAt: (item[col.lastUpdatedAt] as string) || '',
      createdBy: (item[col.createdBy] as string) || '',
      createdAt: (item[col.createdAt] as string) || '',
    };
  }

  /**
   * Reverse mapper: converts Partial<IMarketingProjectRecord> to SP column-keyed object.
   * Only includes fields that are present in the input data to avoid overwriting unchanged data.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildMarketingUpdateData(data: Partial<IMarketingProjectRecord>): Record<string, any> {
    const col = MARKETING_PROJECT_RECORDS_COLUMNS;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: Record<string, any> = {};

    // String fields — map if present
    const stringFields: (keyof IMarketingProjectRecord & keyof typeof col)[] = [
      'projectName', 'projectCode', 'deliveryMethod', 'architect',
      'landscapeArchitect', 'interiorDesigner', 'engineer',
      'buildingSystemType', 'projectDescription', 'uniqueCharacteristics',
      'budgetExplanation', 'onSchedule', 'scheduleExplanation',
      'innovativeSafetyPrograms', 'mwbeRequirement', 'mwbeAchievement',
      'sbeRequirement', 'sbeAchievement', 'localRequirement', 'localAchievement',
      'leedDesignation', 'sustainabilityFeatures',
      'CS_Conflicts', 'CS_CostControl', 'CS_ValueEngineering', 'CS_QualityControl',
      'CS_Schedule', 'CS_Team', 'CS_Safety', 'CS_LEED', 'CS_SupplierDiversity',
      'CS_Challenges', 'CS_InnovativeSolutions', 'CS_ProductsSystems',
      'CS_ClientService', 'CS_LessonsLearned',
      'lastUpdatedBy', 'lastUpdatedAt', 'createdBy', 'createdAt',
    ];
    for (const field of stringFields) {
      if (data[field] !== undefined) result[col[field]] = data[field];
    }

    // Number fields
    const numberFields: (keyof IMarketingProjectRecord & keyof typeof col)[] = [
      'leadId', 'contractBudget', 'contractFinalCost', 'totalCostPerGSF',
      'totalBudgetVariance', 'CO_OwnerDirected_Count', 'CO_OwnerDirected_Value',
      'CO_MunicipalityDirected_Count', 'CO_MunicipalityDirected_Value',
      'CO_EO_Count', 'CO_EO_Value', 'CO_ContractorDirected_Count',
      'savingsReturned', 'savingsReturnedPct', 'punchListItems',
      'punchListDaysToComplete', 'leedAdditionalCost', 'overallCompletion',
    ];
    for (const field of numberFields) {
      if (data[field] !== undefined) result[col[field]] = data[field];
    }

    // Date fields
    const dateFields: (keyof IMarketingProjectRecord & keyof typeof col)[] = [
      'scheduleStartAnticipated', 'scheduleStartActual',
      'scheduleEndAnticipated', 'scheduleEndActual',
      'substantialCompletionDate', 'finalCompletionDate',
    ];
    for (const field of dateFields) {
      if (data[field] !== undefined) result[col[field]] = data[field];
    }

    // JSON array fields
    if (data.contractType !== undefined) result[col.contractType] = JSON.stringify(data.contractType);
    if (data.renderingUrls !== undefined) result[col.renderingUrls] = JSON.stringify(data.renderingUrls);
    if (data.finalPhotoUrls !== undefined) result[col.finalPhotoUrls] = JSON.stringify(data.finalPhotoUrls);
    if (data.sectionCompletion !== undefined) result[col.sectionCompletion] = JSON.stringify(data.sectionCompletion);

    return result;
  }

  // ── Private Mapper Helpers: Project Controls Modules ─────────────────

  private mapToRiskCostManagement(item: Record<string, unknown>): IRiskCostManagement {
    const col = RISK_COST_MANAGEMENT_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      projectCode: (item[col.projectCode] as string) || '',
      contractType: (item[col.contractType] as string) || '',
      contractAmount: (item[col.contractAmount] as number) || 0,
      buyoutOpportunities: [],
      potentialRisks: [],
      potentialSavings: [],
      createdBy: (item[col.createdBy] as string) || '',
      createdAt: (item[col.createdAt] as string) || '',
      lastUpdatedBy: (item[col.lastUpdatedBy] as string) || '',
      lastUpdatedAt: (item[col.lastUpdatedAt] as string) || '',
    };
  }

  private mapToRiskCostItem(item: Record<string, unknown>): IRiskCostItem {
    const col = RISK_COST_ITEMS_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      projectCode: (item[col.projectCode] as string) || '',
      riskCostId: (item[col.riskCostId] as number) || undefined,
      category: (item[col.category] as IRiskCostItem['category']) || 'Risk',
      letter: (item[col.letter] as string) || '',
      description: (item[col.description] as string) || '',
      estimatedValue: (item[col.estimatedValue] as number) || 0,
      status: (item[col.status] as IRiskCostItem['status']) || 'Open',
      notes: (item[col.notes] as string) || '',
      createdDate: (item[col.createdDate] as string) || '',
      updatedDate: (item[col.updatedDate] as string) || '',
    };
  }

  private mapToQualityConcern(item: Record<string, unknown>): IQualityConcern {
    const col = QUALITY_CONCERNS_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      projectCode: (item[col.projectCode] as string) || '',
      letter: (item[col.letter] as string) || '',
      description: (item[col.description] as string) || '',
      raisedBy: (item[col.raisedBy] as string) || '',
      raisedDate: (item[col.raisedDate] as string) || '',
      status: (item[col.status] as IQualityConcern['status']) || 'Open',
      resolution: (item[col.resolution] as string) || '',
      resolvedDate: (item[col.resolvedDate] as string) || null,
      notes: (item[col.notes] as string) || '',
    };
  }

  private mapToSafetyConcern(item: Record<string, unknown>): ISafetyConcern {
    const col = SAFETY_CONCERNS_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      projectCode: (item[col.projectCode] as string) || '',
      safetyOfficerName: (item[col.safetyOfficerName] as string) || '',
      safetyOfficerEmail: (item[col.safetyOfficerEmail] as string) || '',
      letter: (item[col.letter] as string) || '',
      description: (item[col.description] as string) || '',
      severity: (item[col.severity] as ISafetyConcern['severity']) || 'Medium',
      raisedBy: (item[col.raisedBy] as string) || '',
      raisedDate: (item[col.raisedDate] as string) || '',
      status: (item[col.status] as ISafetyConcern['status']) || 'Open',
      resolution: (item[col.resolution] as string) || '',
      resolvedDate: (item[col.resolvedDate] as string) || null,
      notes: (item[col.notes] as string) || '',
    };
  }

  private mapToProjectSchedule(item: Record<string, unknown>): IProjectScheduleCriticalPath {
    const col = PROJECT_SCHEDULE_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      projectCode: (item[col.projectCode] as string) || '',
      startDate: (item[col.startDate] as string) || null,
      substantialCompletionDate: (item[col.substantialCompletionDate] as string) || null,
      ntpDate: (item[col.ntpDate] as string) || null,
      nocDate: (item[col.nocDate] as string) || null,
      contractCalendarDays: (item[col.contractCalendarDays] as number) ?? null,
      contractBasisType: (item[col.contractBasisType] as string) || '',
      teamGoalDaysAhead: (item[col.teamGoalDaysAhead] as number) ?? null,
      teamGoalDescription: (item[col.teamGoalDescription] as string) || '',
      hasLiquidatedDamages: !!(item[col.hasLiquidatedDamages]),
      liquidatedDamagesAmount: (item[col.liquidatedDamagesAmount] as number) ?? null,
      liquidatedDamagesTerms: (item[col.liquidatedDamagesTerms] as string) || '',
      criticalPathConcerns: [],
      createdBy: (item[col.createdBy] as string) || '',
      createdAt: (item[col.createdAt] as string) || '',
      lastUpdatedBy: (item[col.lastUpdatedBy] as string) || '',
      lastUpdatedAt: (item[col.lastUpdatedAt] as string) || '',
    };
  }

  private mapToCriticalPathItem(item: Record<string, unknown>): ICriticalPathItem {
    const col = CRITICAL_PATH_ITEMS_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      projectCode: (item[col.projectCode] as string) || '',
      scheduleId: (item[col.scheduleId] as number) || undefined,
      letter: (item[col.letter] as string) || '',
      description: (item[col.description] as string) || '',
      impactDescription: (item[col.impactDescription] as string) || '',
      status: (item[col.status] as ICriticalPathItem['status']) || 'Active',
      mitigationPlan: (item[col.mitigationPlan] as string) || '',
      createdDate: (item[col.createdDate] as string) || '',
      updatedDate: (item[col.updatedDate] as string) || '',
    };
  }

  private mapToSuperintendentPlan(item: Record<string, unknown>): ISuperintendentPlan {
    const col = SUPERINTENDENT_PLAN_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      projectCode: (item[col.projectCode] as string) || '',
      superintendentName: (item[col.superintendentName] as string) || '',
      sections: [],
      createdBy: (item[col.createdBy] as string) || '',
      createdAt: (item[col.createdAt] as string) || '',
      lastUpdatedBy: (item[col.lastUpdatedBy] as string) || '',
      lastUpdatedAt: (item[col.lastUpdatedAt] as string) || '',
    };
  }

  private mapToSuperintendentPlanSection(item: Record<string, unknown>): ISuperintendentPlanSection {
    const col = SUPERINTENDENT_PLAN_SECTIONS_COLUMNS;
    let attachmentUrls: string[] = [];
    try {
      const raw = item[col.attachmentUrls];
      if (typeof raw === 'string' && raw) attachmentUrls = JSON.parse(raw);
      else if (Array.isArray(raw)) attachmentUrls = raw as string[];
    } catch { /* safe fallback */ }

    return {
      id: (item[col.id] as number) || (item.Id as number),
      superintendentPlanId: (item[col.superintendentPlanId] as number) || undefined,
      projectCode: (item[col.projectCode] as string) || '',
      sectionKey: (item[col.sectionKey] as string) || '',
      sectionTitle: (item[col.sectionTitle] as string) || '',
      content: (item[col.content] as string) || '',
      attachmentUrls,
      isComplete: !!(item[col.isComplete]),
    };
  }

  private mapToLessonLearned(item: Record<string, unknown>): ILessonLearned {
    const col = LESSONS_LEARNED_COLUMNS;
    let tags: string[] = [];
    try {
      const raw = item[col.tags];
      if (typeof raw === 'string' && raw) tags = JSON.parse(raw);
      else if (Array.isArray(raw)) tags = raw as string[];
    } catch { /* safe fallback */ }

    return {
      id: (item[col.id] as number) || (item.Id as number),
      projectCode: (item[col.projectCode] as string) || '',
      title: (item[col.title] as string) || '',
      category: (item[col.category] as ILessonLearned['category']) || 'Other',
      impact: (item[col.impact] as ILessonLearned['impact']) || 'Neutral',
      description: (item[col.description] as string) || '',
      recommendation: (item[col.recommendation] as string) || '',
      raisedBy: (item[col.raisedBy] as string) || '',
      raisedDate: (item[col.raisedDate] as string) || '',
      phase: (item[col.phase] as string) || '',
      isIncludedInFinalRecord: !!(item[col.isIncludedInFinalRecord]),
      tags,
    };
  }

  // ── Estimating Kickoff Mappers ──────────────────────────────────────

  private mapToEstimatingKickoff(item: Record<string, unknown>): IEstimatingKickoff {
    const col = ESTIMATING_KICKOFFS_COLUMNS;
    let keyPersonnel: IKeyPersonnelEntry[] = [];
    try {
      const raw = item[col.KeyPersonnel];
      if (typeof raw === 'string' && raw) keyPersonnel = JSON.parse(raw);
      else if (Array.isArray(raw)) keyPersonnel = raw as IKeyPersonnelEntry[];
    } catch { /* safe fallback */ }

    return {
      id: (item[col.id] as number) || (item.Id as number),
      LeadID: (item[col.LeadID] as number) || 0,
      ProjectCode: (item[col.ProjectCode] as string) || '',
      Architect: (item[col.Architect] as string) || undefined,
      ProposalDueDateTime: (item[col.ProposalDueDateTime] as string) || undefined,
      ProposalType: (item[col.ProposalType] as string) || undefined,
      RFIFormat: (item[col.RFIFormat] as IEstimatingKickoff['RFIFormat']) || undefined,
      PrimaryOwnerContact: (item[col.PrimaryOwnerContact] as string) || undefined,
      ProposalDeliveryMethod: (item[col.ProposalDeliveryMethod] as string) || undefined,
      CopiesIfHandDelivered: (item[col.CopiesIfHandDelivered] as number) ?? undefined,
      HBProposalDue: (item[col.HBProposalDue] as string) || undefined,
      SubcontractorProposalsDue: (item[col.SubcontractorProposalsDue] as string) || undefined,
      PreSubmissionReview: (item[col.PreSubmissionReview] as string) || undefined,
      SubcontractorSiteWalkThru: (item[col.SubcontractorSiteWalkThru] as string) || undefined,
      OwnerEstimateReview: (item[col.OwnerEstimateReview] as string) || undefined,
      keyPersonnel: keyPersonnel.length > 0 ? keyPersonnel : undefined,
      items: [], // filled by assembly
      KickoffMeetingId: (item[col.KickoffMeetingId] as string) || undefined,
      KickoffMeetingDate: (item[col.KickoffMeetingDate] as string) || undefined,
      CreatedBy: (item[col.CreatedBy] as string) || '',
      CreatedDate: (item[col.CreatedDate] as string) || '',
      ModifiedBy: (item[col.ModifiedBy] as string) || undefined,
      ModifiedDate: (item[col.ModifiedDate] as string) || undefined,
    };
  }

  private mapToEstimatingKickoffItem(item: Record<string, unknown>): IEstimatingKickoffItem {
    const col = ESTIMATING_KICKOFF_ITEMS_COLUMNS;
    let assignees: import('../models/IWorkflowDefinition').IPersonAssignment[] | undefined;
    try {
      const raw = item[col.Assignees];
      if (typeof raw === 'string' && raw) assignees = JSON.parse(raw);
      else if (Array.isArray(raw)) assignees = raw as import('../models/IWorkflowDefinition').IPersonAssignment[];
    } catch { /* safe fallback */ }

    return {
      id: (item[col.id] as number) || (item.Id as number),
      kickoffId: (item[col.kickoffId] as number) || undefined,
      projectCode: (item[col.projectCode] as string) || undefined,
      section: (item[col.section] as IEstimatingKickoffItem['section']) || 'managing',
      task: (item[col.task] as string) || '',
      status: (item[col.status] as IEstimatingKickoffItem['status']) || null,
      responsibleParty: (item[col.responsibleParty] as string) || undefined,
      assignees,
      deadline: (item[col.deadline] as string) || undefined,
      frequency: (item[col.frequency] as string) || undefined,
      notes: (item[col.notes] as string) || undefined,
      tabRequired: item[col.tabRequired] !== undefined ? !!(item[col.tabRequired]) : undefined,
      isCustom: item[col.isCustom] !== undefined ? !!(item[col.isCustom]) : undefined,
      sortOrder: (item[col.sortOrder] as number) ?? 0,
    };
  }

  // ── Job Number Request Mapper ─────────────────────────────────────

  private mapToJobNumberRequest(item: Record<string, unknown>): IJobNumberRequest {
    const col = JOB_NUMBER_REQUESTS_COLUMNS;
    let requestedCostCodes: string[] = [];
    try {
      const raw = item[col.RequestedCostCodes];
      if (typeof raw === 'string' && raw) requestedCostCodes = JSON.parse(raw);
      else if (Array.isArray(raw)) requestedCostCodes = raw as string[];
    } catch { /* safe fallback */ }

    return {
      id: (item[col.id] as number) || (item.Id as number),
      LeadID: (item[col.LeadID] as number) || 0,
      RequestDate: (item[col.RequestDate] as string) || '',
      Originator: (item[col.Originator] as string) || '',
      RequiredByDate: (item[col.RequiredByDate] as string) || '',
      ProjectAddress: (item[col.ProjectAddress] as string) || '',
      ProjectExecutive: (item[col.ProjectExecutive] as string) || '',
      ProjectManager: (item[col.ProjectManager] as string) || undefined,
      ProjectType: (item[col.ProjectType] as string) || '',
      ProjectTypeLabel: (item[col.ProjectTypeLabel] as string) || '',
      IsEstimatingOnly: !!(item[col.IsEstimatingOnly]),
      RequestedCostCodes: requestedCostCodes,
      RequestStatus: (item[col.RequestStatus] as JobNumberRequestStatus) || JobNumberRequestStatus.Pending,
      AssignedJobNumber: (item[col.AssignedJobNumber] as string) || undefined,
      AssignedBy: (item[col.AssignedBy] as string) || undefined,
      AssignedDate: (item[col.AssignedDate] as string) || undefined,
      SiteProvisioningHeld: !!(item[col.SiteProvisioningHeld]),
      TempProjectCode: (item[col.TempProjectCode] as string) || undefined,
      Notes: (item[col.Notes] as string) || undefined,
    };
  }

  // ── Reference Data Mappers ────────────────────────────────────────

  private mapToProjectType(item: Record<string, unknown>): IProjectType {
    const col = PROJECT_TYPES_COLUMNS;
    return {
      code: (item[col.code] as string) || '',
      label: (item[col.label] as string) || '',
      office: (item[col.office] as string) || '',
    };
  }

  private mapToStandardCostCode(item: Record<string, unknown>): IStandardCostCode {
    const col = STANDARD_COST_CODES_COLUMNS;
    return {
      id: (item[col.id] as string) || '',
      description: (item[col.description] as string) || '',
      phase: (item[col.phase] as string) || '',
      division: (item[col.division] as string) || '',
      isDefault: !!(item[col.isDefault]),
    };
  }

  // ── Sector Definition Mapper ──────────────────────────────────────

  private mapToSectorDefinition(item: Record<string, unknown>): ISectorDefinition {
    const col = SECTOR_DEFINITIONS_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      code: (item[col.code] as string) || '',
      label: (item[col.label] as string) || '',
      isActive: !!(item[col.isActive]),
      parentDivision: (item[col.parentDivision] as string) || undefined,
      sortOrder: (item[col.sortOrder] as number) ?? 0,
    };
  }

  // ── Assignment Mapping Mapper ─────────────────────────────────────

  private mapToAssignmentMapping(item: Record<string, unknown>): IAssignmentMapping {
    const col = ASSIGNMENT_MAPPINGS_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      region: (item[col.region] as string) || 'All Regions',
      sector: (item[col.sector] as string) || 'All Sectors',
      assignmentType: (item[col.assignmentType] as IAssignmentMapping['assignmentType']) || 'Director',
      assignee: {
        userId: (item[col.assigneeUserId] as string) || '',
        displayName: (item[col.assigneeDisplayName] as string) || '',
        email: (item[col.assigneeEmail] as string) || '',
      },
    };
  }

  // ── PMP Mappers & Assembly ───────────────────────────────────────────

  private mapToPMP(item: Record<string, unknown>): IProjectManagementPlan {
    const col = PMP_COLUMNS;

    // Safe JSON parse helper
    const parseJson = (raw: unknown, fallback: unknown = null): unknown => {
      try {
        if (typeof raw === 'string' && raw) return JSON.parse(raw);
        if (Array.isArray(raw) || (typeof raw === 'object' && raw !== null)) return raw;
      } catch { /* safe fallback */ }
      return fallback;
    };

    return {
      id: (item[col.id] as number) || (item.Id as number),
      projectCode: (item[col.projectCode] as string) || '',
      projectName: (item[col.projectName] as string) || '',
      jobNumber: (item[col.jobNumber] as string) || '',
      status: (item[col.status] as IProjectManagementPlan['status']) || 'Draft',
      currentCycleNumber: (item[col.currentCycleNumber] as number) || 0,
      division: (item[col.division] as string) || '',
      superintendentPlan: (item[col.superintendentPlan] as string) || '',
      preconMeetingNotes: (item[col.preconMeetingNotes] as string) || '',
      siteManagementNotes: (item[col.siteManagementNotes] as string) || '',
      projectAdminBuyoutDate: (item[col.projectAdminBuyoutDate] as string) || null,
      attachmentUrls: parseJson(item[col.attachmentUrls], []) as string[],
      riskCostData: parseJson(item[col.riskCostData]) as IProjectManagementPlan['riskCostData'],
      qualityConcerns: parseJson(item[col.qualityConcerns], []) as string[],
      safetyConcerns: parseJson(item[col.safetyConcerns], []) as string[],
      scheduleData: parseJson(item[col.scheduleData]) as IProjectManagementPlan['scheduleData'],
      superintendentPlanData: parseJson(item[col.superintendentPlanData]) as IProjectManagementPlan['superintendentPlanData'],
      lessonsLearned: parseJson(item[col.lessonsLearned], []) as string[],
      teamAssignments: parseJson(item[col.teamAssignments], []) as string[],
      boilerplate: parseJson(item[col.boilerplate], []) as IPMPBoilerplateSection[],
      // Child arrays populated by assemblePMPFromParts
      startupSignatures: [],
      completionSignatures: [],
      approvalCycles: [],
      // Meta
      createdBy: (item[col.createdBy] as string) || '',
      createdAt: (item[col.createdAt] as string) || '',
      lastUpdatedBy: (item[col.lastUpdatedBy] as string) || '',
      lastUpdatedAt: (item[col.lastUpdatedAt] as string) || '',
    };
  }

  private mapToPMPSignature(item: Record<string, unknown>): IPMPSignature {
    const col = PMP_SIGNATURES_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      pmpId: (item[col.pmpId] as number) || undefined,
      projectCode: (item[col.projectCode] as string) || '',
      signatureType: (item[col.signatureType] as IPMPSignature['signatureType']) || 'Startup',
      role: (item[col.role] as string) || '',
      personName: (item[col.personName] as string) || '',
      personEmail: (item[col.personEmail] as string) || '',
      isRequired: !!(item[col.isRequired]),
      isLead: !!(item[col.isLead]),
      status: (item[col.status] as IPMPSignature['status']) || 'Pending',
      signedDate: (item[col.signedDate] as string) || null,
      affidavitText: (item[col.affidavitText] as string) || '',
      comment: (item[col.comment] as string) || '',
    };
  }

  private mapToPMPApprovalCycle(item: Record<string, unknown>): IPMPApprovalCycle {
    const col = PMP_APPROVAL_CYCLES_COLUMNS;
    let changesFromPrevious: string[] = [];
    try {
      const raw = item[col.changesFromPrevious];
      if (typeof raw === 'string' && raw) changesFromPrevious = JSON.parse(raw);
      else if (Array.isArray(raw)) changesFromPrevious = raw as string[];
    } catch { /* safe fallback */ }

    return {
      id: (item[col.id] as number) || (item.Id as number),
      pmpId: (item[col.pmpId] as number) || undefined,
      projectCode: (item[col.projectCode] as string) || undefined,
      cycleNumber: (item[col.cycleNumber] as number) || 0,
      submittedBy: (item[col.submittedBy] as string) || '',
      submittedDate: (item[col.submittedDate] as string) || '',
      status: (item[col.status] as IPMPApprovalCycle['status']) || 'InProgress',
      steps: [], // Populated by assemblePMPFromParts
      changesFromPrevious,
    };
  }

  private mapToPMPApprovalStep(item: Record<string, unknown>): IPMPApprovalStep {
    const col = PMP_APPROVAL_STEPS_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      approvalCycleId: (item[col.approvalCycleId] as number) || undefined,
      projectCode: (item[col.projectCode] as string) || '',
      stepOrder: (item[col.stepOrder] as number) || 0,
      approverRole: (item[col.approverRole] as string) || '',
      approverName: (item[col.approverName] as string) || '',
      approverEmail: (item[col.approverEmail] as string) || '',
      status: (item[col.status] as IPMPApprovalStep['status']) || 'Pending',
      comment: (item[col.comment] as string) || '',
      actionDate: (item[col.actionDate] as string) || null,
      approvalCycleNumber: (item[col.approvalCycleNumber] as number) || 0,
    };
  }

  private mapToDivisionApprover(item: Record<string, unknown>): IDivisionApprover {
    const col = DIVISION_APPROVERS_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      division: (item[col.division] as IDivisionApprover['division']) || 'Commercial',
      approverName: (item[col.approverName] as string) || '',
      approverEmail: (item[col.approverEmail] as string) || '',
      approverTitle: (item[col.approverTitle] as string) || '',
    };
  }

  private mapToPMPBoilerplateSection(item: Record<string, unknown>): IPMPBoilerplateSection {
    const col = PMP_BOILERPLATE_COLUMNS;
    return {
      sectionNumber: (item[col.sectionNumber] as string) || '',
      sectionTitle: (item[col.sectionTitle] as string) || '',
      content: (item[col.content] as string) || '',
      sourceDocumentUrl: (item[col.sourceDocumentUrl] as string) || '',
      lastSourceUpdate: (item[col.lastSourceUpdate] as string) || '',
    };
  }

  private assemblePMPFromParts(
    pmp: IProjectManagementPlan,
    signatures: IPMPSignature[],
    cycles: IPMPApprovalCycle[],
    steps: IPMPApprovalStep[]
  ): IProjectManagementPlan {
    return {
      ...pmp,
      startupSignatures: signatures.filter(s => s.signatureType === 'Startup'),
      completionSignatures: signatures.filter(s => s.signatureType === 'Completion'),
      approvalCycles: cycles.map(c => ({
        ...c,
        steps: steps.filter(s => s.approvalCycleId === c.id),
      })),
    };
  }

  // ── Monthly Review Mappers ──────────────────────────────────────────

  private mapToMonthlyReview(item: Record<string, unknown>): IMonthlyProjectReview {
    const col = MONTHLY_REVIEWS_COLUMNS;

    // Safe JSON parse helper
    const parseJson = (raw: unknown, fallback: unknown = null): unknown => {
      try {
        if (typeof raw === 'string' && raw) return JSON.parse(raw);
        if (Array.isArray(raw) || (typeof raw === 'object' && raw !== null)) return raw;
      } catch { /* safe fallback */ }
      return fallback;
    };

    return {
      id: (item[col.id] as number) || (item.Id as number),
      projectCode: (item[col.projectCode] as string) || '',
      reviewMonth: (item[col.reviewMonth] as string) || '',
      status: (item[col.status] as IMonthlyProjectReview['status']) || 'NotStarted',
      dueDate: (item[col.dueDate] as string) || '',
      meetingDate: (item[col.meetingDate] as string) || null,
      pmSubmittedDate: (item[col.pmSubmittedDate] as string) || null,
      pxReviewDate: (item[col.pxReviewDate] as string) || null,
      pxValidationDate: (item[col.pxValidationDate] as string) || null,
      leadershipSubmitDate: (item[col.leadershipSubmitDate] as string) || null,
      completedDate: (item[col.completedDate] as string) || null,
      // Child arrays populated by assembleMonthlyReview
      checklistItems: [],
      followUps: [],
      reportDocumentUrls: parseJson(item[col.reportDocumentUrls], []) as string[],
      createdBy: (item[col.createdBy] as string) || '',
      createdAt: (item[col.createdAt] as string) || '',
      lastUpdatedBy: (item[col.lastUpdatedBy] as string) || '',
      lastUpdatedAt: (item[col.lastUpdatedAt] as string) || '',
    };
  }

  private mapToMonthlyChecklistItem(item: Record<string, unknown>): IMonthlyChecklistItem {
    const col = MONTHLY_CHECKLIST_ITEMS_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      reviewId: (item[col.reviewId] as number) || undefined,
      sectionKey: (item[col.sectionKey] as string) || '',
      sectionTitle: (item[col.sectionTitle] as string) || '',
      itemKey: (item[col.itemKey] as string) || '',
      itemDescription: (item[col.itemDescription] as string) || '',
      pmComment: (item[col.pmComment] as string) || '',
      pxComment: (item[col.pxComment] as string) || '',
      pxInitial: (item[col.pxInitial] as string) || '',
    };
  }

  private mapToMonthlyFollowUp(item: Record<string, unknown>): IMonthlyFollowUp {
    const col = MONTHLY_FOLLOW_UPS_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      reviewId: (item[col.reviewId] as number) || undefined,
      question: (item[col.question] as string) || '',
      requestedBy: (item[col.requestedBy] as string) || '',
      requestedDate: (item[col.requestedDate] as string) || '',
      pmResponse: (item[col.pmResponse] as string) || '',
      responseDate: (item[col.responseDate] as string) || null,
      pxForwardedDate: (item[col.pxForwardedDate] as string) || null,
      status: (item[col.status] as IMonthlyFollowUp['status']) || 'Open',
    };
  }

  private assembleMonthlyReview(
    review: IMonthlyProjectReview,
    checklistItems: IMonthlyChecklistItem[],
    followUps: IMonthlyFollowUp[]
  ): IMonthlyProjectReview {
    return {
      ...review,
      checklistItems: checklistItems.filter(i => i.reviewId === review.id),
      followUps: followUps.filter(f => f.reviewId === review.id),
    };
  }

  // ── Turnover Agenda Mappers ──────────────────────────────────────────

  private mapToTurnoverAgenda(item: Record<string, unknown>): ITurnoverAgenda {
    const col = TURNOVER_AGENDAS_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      projectCode: (item[col.projectCode] as string) || '',
      leadId: (item[col.leadId] as number) || 0,
      status: (item[col.status] as TurnoverStatus) || TurnoverStatus.Draft,
      projectName: (item[col.projectName] as string) || '',
      header: {} as ITurnoverProjectHeader,
      estimateOverview: {} as ITurnoverEstimateOverview,
      prerequisites: [],
      discussionItems: [],
      subcontractors: [],
      exhibits: [],
      signatures: [],
      meetingDate: (item[col.meetingDate] as string) || undefined,
      recordingUrl: (item[col.recordingUrl] as string) || undefined,
      turnoverFolderUrl: (item[col.turnoverFolderUrl] as string) || undefined,
      bcPublished: !!(item[col.bcPublished]),
      pmName: (item[col.pmName] as string) || undefined,
      apmName: (item[col.apmName] as string) || undefined,
      createdBy: (item[col.createdBy] as string) || '',
      createdDate: (item[col.createdDate] as string) || '',
      lastModifiedBy: (item[col.lastModifiedBy] as string) || undefined,
      lastModifiedDate: (item[col.lastModifiedDate] as string) || undefined,
    };
  }

  private mapToTurnoverPrerequisite(item: Record<string, unknown>): ITurnoverPrerequisite {
    const col = TURNOVER_PREREQUISITES_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      turnoverAgendaId: (item[col.turnoverAgendaId] as number) || 0,
      sortOrder: (item[col.sortOrder] as number) || 0,
      label: (item[col.label] as string) || '',
      description: (item[col.description] as string) || '',
      completed: !!(item[col.completed]),
      completedBy: (item[col.completedBy] as string) || undefined,
      completedDate: (item[col.completedDate] as string) || undefined,
    };
  }

  private mapToTurnoverDiscussionItem(item: Record<string, unknown>): ITurnoverDiscussionItem {
    const col = TURNOVER_DISCUSSION_ITEMS_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      turnoverAgendaId: (item[col.turnoverAgendaId] as number) || 0,
      sortOrder: (item[col.sortOrder] as number) || 0,
      label: (item[col.label] as string) || '',
      description: (item[col.description] as string) || '',
      discussed: !!(item[col.discussed]),
      notes: (item[col.notes] as string) || '',
      attachments: [],
    };
  }

  private mapToTurnoverSubcontractor(item: Record<string, unknown>): ITurnoverSubcontractor {
    const col = TURNOVER_SUBCONTRACTORS_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      turnoverAgendaId: (item[col.turnoverAgendaId] as number) || 0,
      trade: (item[col.trade] as string) || '',
      subcontractorName: (item[col.subcontractorName] as string) || '',
      contactName: (item[col.contactName] as string) || '',
      contactPhone: (item[col.contactPhone] as string) || '',
      contactEmail: (item[col.contactEmail] as string) || '',
      qScore: (item[col.qScore] as number) ?? null,
      isPreferred: !!(item[col.isPreferred]),
      isRequired: !!(item[col.isRequired]),
      notes: (item[col.notes] as string) || '',
    };
  }

  private mapToTurnoverExhibit(item: Record<string, unknown>): ITurnoverExhibit {
    const col = TURNOVER_EXHIBITS_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      turnoverAgendaId: (item[col.turnoverAgendaId] as number) || 0,
      sortOrder: (item[col.sortOrder] as number) || 0,
      label: (item[col.label] as string) || '',
      isDefault: !!(item[col.isDefault]),
      reviewed: !!(item[col.reviewed]),
      reviewedBy: (item[col.reviewedBy] as string) || undefined,
      reviewedDate: (item[col.reviewedDate] as string) || undefined,
      linkedDocumentUrl: (item[col.linkedDocumentUrl] as string) || undefined,
      uploadedFileName: (item[col.uploadedFileName] as string) || undefined,
      uploadedFileUrl: (item[col.uploadedFileUrl] as string) || undefined,
    };
  }

  private mapToTurnoverSignature(item: Record<string, unknown>): ITurnoverSignature {
    const col = TURNOVER_SIGNATURES_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      turnoverAgendaId: (item[col.turnoverAgendaId] as number) || 0,
      sortOrder: (item[col.sortOrder] as number) || 0,
      role: (item[col.role] as string) || '',
      signerName: (item[col.signerName] as string) || '',
      signerEmail: (item[col.signerEmail] as string) || '',
      affidavitText: (item[col.affidavitText] as string) || '',
      signed: !!(item[col.signed]),
      signedDate: (item[col.signedDate] as string) || undefined,
      comment: (item[col.comment] as string) || undefined,
    };
  }

  private mapToTurnoverAttachment(item: Record<string, unknown>): ITurnoverAttachment {
    const col = TURNOVER_ATTACHMENTS_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      discussionItemId: (item[col.discussionItemId] as number) || 0,
      fileName: (item[col.fileName] as string) || '',
      fileUrl: (item[col.fileUrl] as string) || '',
      uploadedBy: (item[col.uploadedBy] as string) || '',
      uploadedDate: (item[col.uploadedDate] as string) || '',
    };
  }

  private mapToTurnoverEstimateOverview(item: Record<string, unknown>): ITurnoverEstimateOverview {
    const col = TURNOVER_ESTIMATE_OVERVIEWS_COLUMNS;
    let overrides: Record<string, boolean> = {};
    try {
      const raw = item[col.overrides];
      if (typeof raw === 'string' && raw) overrides = JSON.parse(raw);
      else if (typeof raw === 'object' && raw !== null) overrides = raw as Record<string, boolean>;
    } catch { /* safe fallback */ }

    return {
      id: (item[col.id] as number) || (item.Id as number),
      turnoverAgendaId: (item[col.turnoverAgendaId] as number) || 0,
      contractAmount: (item[col.contractAmount] as number) || 0,
      originalEstimate: (item[col.originalEstimate] as number) || 0,
      buyoutTarget: (item[col.buyoutTarget] as number) || 0,
      estimatedFee: (item[col.estimatedFee] as number) || 0,
      estimatedGrossMargin: (item[col.estimatedGrossMargin] as number) || 0,
      contingency: (item[col.contingency] as number) || 0,
      notes: (item[col.notes] as string) || '',
      overrides,
    };
  }

  private assembleTurnoverAgenda(
    agenda: ITurnoverAgenda,
    lead: ILead | null,
    headerOverrides: Record<string, boolean>,
    estimateOverview: ITurnoverEstimateOverview | null,
    prereqs: ITurnoverPrerequisite[],
    discussionItems: ITurnoverDiscussionItem[],
    attachments: ITurnoverAttachment[],
    subs: ITurnoverSubcontractor[],
    exhibits: ITurnoverExhibit[],
    sigs: ITurnoverSignature[]
  ): ITurnoverAgenda {
    // Build header from lead + agenda fields + overrides
    const header: ITurnoverProjectHeader = {
      id: agenda.id,
      turnoverAgendaId: agenda.id,
      projectName: lead?.Title || agenda.projectName || '',
      projectCode: agenda.projectCode,
      clientName: lead?.ClientName || '',
      projectValue: lead?.ProjectValue || 0,
      deliveryMethod: lead?.DeliveryMethod || '',
      projectExecutive: lead?.ProjectExecutive || '',
      projectManager: lead?.ProjectManager || '',
      leadEstimator: '',
      overrides: headerOverrides,
    };

    // Nest attachments into discussion items by discussionItemId
    const itemsWithAttachments = discussionItems.map(item => ({
      ...item,
      attachments: attachments.filter(a => a.discussionItemId === item.id),
    }));

    return {
      ...agenda,
      header,
      estimateOverview: estimateOverview || {} as ITurnoverEstimateOverview,
      prerequisites: prereqs.sort((a, b) => a.sortOrder - b.sortOrder),
      discussionItems: itemsWithAttachments.sort((a, b) => a.sortOrder - b.sortOrder),
      subcontractors: subs,
      exhibits: exhibits.sort((a, b) => a.sortOrder - b.sortOrder),
      signatures: sigs.sort((a, b) => a.sortOrder - b.sortOrder),
    };
  }

  // ── Performance Monitoring ──────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToPerformanceLog(item: Record<string, any>): IPerformanceLog {
    const col = PERFORMANCE_LOGS_COLUMNS;
    let marks: IPerformanceLog['Marks'] = [];
    try { marks = JSON.parse(item[col.Marks] as string || '[]'); } catch { /* fallback */ }
    return {
      id: (item[col.id] as number) || (item.Id as number),
      SessionId: item[col.SessionId] as string || '',
      Timestamp: item[col.Timestamp] as string || '',
      UserEmail: item[col.UserEmail] as string || '',
      SiteUrl: item[col.SiteUrl] as string || '',
      ProjectCode: item[col.ProjectCode] as string || undefined,
      IsProjectSite: !!(item[col.IsProjectSite]),
      WebPartLoadMs: item[col.WebPartLoadMs] as number || 0,
      AppInitMs: item[col.AppInitMs] as number || 0,
      DataFetchMs: item[col.DataFetchMs] as number || undefined,
      TotalLoadMs: item[col.TotalLoadMs] as number || 0,
      Marks: marks,
      UserAgent: item[col.UserAgent] as string || '',
      SpfxVersion: item[col.SpfxVersion] as string || '',
      Notes: item[col.Notes] as string || undefined,
    };
  }

  async logPerformanceEntry(entry: Partial<IPerformanceLog>): Promise<IPerformanceLog> {
    const col = PERFORMANCE_LOGS_COLUMNS;
    const addData: Record<string, unknown> = {
      [col.SessionId]: entry.SessionId || '',
      [col.Timestamp]: entry.Timestamp || new Date().toISOString(),
      [col.UserEmail]: entry.UserEmail || '',
      [col.SiteUrl]: entry.SiteUrl || '',
      [col.ProjectCode]: entry.ProjectCode || '',
      [col.IsProjectSite]: entry.IsProjectSite || false,
      [col.WebPartLoadMs]: entry.WebPartLoadMs || 0,
      [col.AppInitMs]: entry.AppInitMs || 0,
      [col.DataFetchMs]: entry.DataFetchMs || 0,
      [col.TotalLoadMs]: entry.TotalLoadMs || 0,
      [col.Marks]: JSON.stringify(entry.Marks || []),
      [col.UserAgent]: entry.UserAgent || '',
      [col.SpfxVersion]: entry.SpfxVersion || '',
      [col.Notes]: entry.Notes || '',
    };

    const result = await this.sp.web.lists.getByTitle(LIST_NAMES.PERFORMANCE_LOGS).items.add(addData);
    const newId = (result.Id as number) || (result.data?.Id as number) || 0;
    const reRead = await this.sp.web.lists.getByTitle(LIST_NAMES.PERFORMANCE_LOGS).items.getById(newId)();
    return this.mapToPerformanceLog(reRead);
  }

  async getPerformanceLogs(options?: IPerformanceQueryOptions): Promise<IPerformanceLog[]> {
    const col = PERFORMANCE_LOGS_COLUMNS;
    const filters: string[] = [];
    if (options?.startDate) filters.push(`${col.Timestamp} ge datetime'${options.startDate}'`);
    if (options?.endDate) filters.push(`${col.Timestamp} le datetime'${options.endDate}'`);
    if (options?.siteUrl) filters.push(`${col.SiteUrl} eq '${options.siteUrl}'`);
    if (options?.projectCode) filters.push(`${col.ProjectCode} eq '${options.projectCode}'`);

    let query = this.sp.web.lists.getByTitle(LIST_NAMES.PERFORMANCE_LOGS).items;
    if (filters.length > 0) query = query.filter(filters.join(' and '));
    query = query.orderBy(col.Timestamp, false).top(options?.limit || 500);

    const items = await query();
    return (items as Record<string, unknown>[]).map(i => this.mapToPerformanceLog(i));
  }

  async getPerformanceSummary(options?: IPerformanceQueryOptions): Promise<IPerformanceSummary> {
    const logs = await this.getPerformanceLogs(options);

    if (logs.length === 0) {
      return { avgTotalLoadMs: 0, avgWebPartLoadMs: 0, avgAppInitMs: 0, p95TotalLoadMs: 0, totalSessions: 0, slowSessionCount: 0, byDay: [] };
    }

    const totalSessions = logs.length;
    const sumTotal = logs.reduce((s, l) => s + l.TotalLoadMs, 0);
    const sumWP = logs.reduce((s, l) => s + l.WebPartLoadMs, 0);
    const sumInit = logs.reduce((s, l) => s + l.AppInitMs, 0);

    // P95: sort ascending, pick index at 95th percentile
    const sorted = [...logs].sort((a, b) => a.TotalLoadMs - b.TotalLoadMs);
    const p95Index = Math.min(Math.floor(sorted.length * 0.95), sorted.length - 1);
    const p95TotalLoadMs = sorted[p95Index].TotalLoadMs;

    const slowSessionCount = logs.filter(l => l.TotalLoadMs > 5000).length;

    // Group by day
    const dayMap = new Map<string, { sum: number; count: number }>();
    for (const log of logs) {
      const day = log.Timestamp.substring(0, 10); // YYYY-MM-DD
      const existing = dayMap.get(day) || { sum: 0, count: 0 };
      existing.sum += log.TotalLoadMs;
      existing.count += 1;
      dayMap.set(day, existing);
    }
    const byDay = Array.from(dayMap.entries())
      .map(([date, { sum, count }]) => ({ date, avgMs: Math.round(sum / count), count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      avgTotalLoadMs: Math.round(sumTotal / totalSessions),
      avgWebPartLoadMs: Math.round(sumWP / totalSessions),
      avgAppInitMs: Math.round(sumInit / totalSessions),
      p95TotalLoadMs,
      totalSessions,
      slowSessionCount,
      byDay,
    };
  }

  // ── Help & Support ──────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToHelpGuide(item: Record<string, any>): IHelpGuide {
    const col = HELP_GUIDES_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      moduleKey: item[col.moduleKey] as string || '',
      title: item[col.title] as string || '',
      content: item[col.content] as string || '',
      guideType: item[col.guideType] as IHelpGuide['guideType'] || 'article',
      sortOrder: item[col.sortOrder] as number || 0,
      targetSelector: item[col.targetSelector] as string || undefined,
      videoUrl: item[col.videoUrl] as string || undefined,
      isActive: !!(item[col.isActive]),
      lastModifiedBy: item[col.lastModifiedBy] as string || undefined,
      lastModifiedDate: item[col.lastModifiedDate] as string || undefined,
    };
  }

  async getHelpGuides(moduleKey?: string): Promise<IHelpGuide[]> {
    const col = HELP_GUIDES_COLUMNS;
    const filters: string[] = [`${col.isActive} eq 1`];
    if (moduleKey) filters.push(`${col.moduleKey} eq '${moduleKey}'`);

    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.HELP_GUIDES).items
      .filter(filters.join(' and '))
      .orderBy(col.sortOrder, true)();
    return (items as Record<string, unknown>[]).map(i => this.mapToHelpGuide(i));
  }

  async getHelpGuideById(id: number): Promise<IHelpGuide | null> {
    try {
      const item = await this.sp.web.lists.getByTitle(LIST_NAMES.HELP_GUIDES).items.getById(id)();
      return this.mapToHelpGuide(item);
    } catch {
      return null;
    }
  }

  async getSupportConfig(): Promise<ISupportConfig> {
    const defaultConfig: ISupportConfig = { supportEmail: 'support@hedrickbrothers.com' };
    try {
      const items = await this.sp.web.lists.getByTitle(LIST_NAMES.APP_CONTEXT_CONFIG)
        .items.filter("SiteURL eq 'SUPPORT_CONFIG'").top(1)();
      if (items.length > 0 && items[0].AppTitle) {
        const parsed = JSON.parse(items[0].AppTitle as string) as ISupportConfig;
        return { ...defaultConfig, ...parsed };
      }
      return defaultConfig;
    } catch {
      return defaultConfig;
    }
  }

  async updateHelpGuide(id: number, data: Partial<IHelpGuide>): Promise<IHelpGuide> {
    const col = HELP_GUIDES_COLUMNS;
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {};

    if (data.moduleKey !== undefined) updateData[col.moduleKey] = data.moduleKey;
    if (data.title !== undefined) updateData[col.title] = data.title;
    if (data.content !== undefined) updateData[col.content] = data.content;
    if (data.guideType !== undefined) updateData[col.guideType] = data.guideType;
    if (data.sortOrder !== undefined) updateData[col.sortOrder] = data.sortOrder;
    if (data.targetSelector !== undefined) updateData[col.targetSelector] = data.targetSelector;
    if (data.videoUrl !== undefined) updateData[col.videoUrl] = data.videoUrl;
    if (data.isActive !== undefined) updateData[col.isActive] = data.isActive;
    updateData[col.lastModifiedDate] = now;
    if (data.lastModifiedBy) updateData[col.lastModifiedBy] = data.lastModifiedBy;

    await this.sp.web.lists.getByTitle(LIST_NAMES.HELP_GUIDES).items.getById(id).update(updateData);
    const reRead = await this.sp.web.lists.getByTitle(LIST_NAMES.HELP_GUIDES).items.getById(id)();
    return this.mapToHelpGuide(reRead);
  }

  async sendSupportEmail(_to: string, _subject: string, _htmlBody: string, _fromUserEmail: string): Promise<void> {
    // Graph API delegation — cannot implement via SP REST alone.
    // Will be fully implemented when GraphService is added.
    console.warn('[SP] sendSupportEmail requires Microsoft Graph API — not available via SP REST. No-op.');
  }

  async updateSupportConfig(config: Partial<ISupportConfig>): Promise<ISupportConfig> {
    // Read existing
    const existing = await this.getSupportConfig();
    const merged: ISupportConfig = { ...existing, ...config };
    const jsonStr = JSON.stringify(merged);

    // Upsert in App_Context_Config
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.APP_CONTEXT_CONFIG)
      .items.filter("SiteURL eq 'SUPPORT_CONFIG'").top(1)();

    if (items.length > 0) {
      await this.sp.web.lists.getByTitle(LIST_NAMES.APP_CONTEXT_CONFIG)
        .items.getById(items[0].Id).update({ AppTitle: jsonStr });
    } else {
      await this.sp.web.lists.getByTitle(LIST_NAMES.APP_CONTEXT_CONFIG)
        .items.add({ SiteURL: 'SUPPORT_CONFIG', AppTitle: jsonStr });
    }

    this.logAudit({
      Action: AuditAction.SupportConfigUpdated,
      EntityType: EntityType.SupportRequest,
      EntityId: 'SUPPORT_CONFIG',
      User: 'Admin',
      Details: 'Support configuration updated',
    }).catch(() => { /* fire-and-forget */ });

    return merged;
  }
}

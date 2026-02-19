import {
  IDataService,
  IListQueryOptions,
  IPagedResult,
  ICursorPageRequest,
  ICursorPageResult,
  ICursorToken,
  IActiveProjectsQueryOptions,
  IActiveProjectsFilter
} from './IDataService';
import { ILead, ILeadFormData } from '../models/ILead';
import { IGoNoGoScorecard, IScorecardApprovalCycle, IScorecardApprovalStep, IScorecardVersion } from '../models/IGoNoGoScorecard';
import { IEstimatingTracker } from '../models/IEstimatingTracker';
import { IRole, ICurrentUser } from '../models/IRole';
import { IFeatureFlag } from '../models/IFeatureFlag';
import { IMeeting, ICalendarAvailability } from '../models/IMeeting';
import { INotification } from '../models/INotification';
import { IAuditEntry } from '../models/IAuditEntry';
import { IProvisioningLog, IFieldDefinition } from '../models/IProvisioningLog';
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
import { IContractTrackingApproval, ContractTrackingStep, ContractTrackingStatus } from '../models/IContractTrackingApproval';
import { IActiveProject, IPortfolioSummary, IPersonnelWorkload, ProjectStatus, SectorType, DEFAULT_ALERT_THRESHOLDS } from '../models/IActiveProject';
import { IProjectDataMart, IDataMartSyncResult, IDataMartFilter, DataMartHealthStatus } from '../models/IProjectDataMart';
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
import {
  IScheduleActivity,
  IScheduleImport,
  IScheduleMetrics,
  IScheduleRelationship,
  ActivityStatus,
  RelationshipType,
  IScheduleFieldLink,
  IScheduleImportReconciliationResult,
  IScheduleConflict,
} from '../models/IScheduleActivity';
import {
  IScheduleCpmResult,
  IScheduleQualityReport,
  IForensicWindow,
  IForensicAnalysisResult,
  IMonteCarloConfig,
  IMonteCarloResult,
  IResourceLevelingResult,
  IScheduleScenario,
  IScheduleScenarioDiff,
  IScheduleEvmResult,
  IPortfolioScheduleHealth,
  IFieldReadinessScore,
  IScheduleEngineRuntimeInfo,
} from '../models/IScheduleEngine';
import { IConstraintLog } from '../models/IConstraintLog';
import { IPermit } from '../models/IPermit';
import { ITemplateRegistry, ITemplateSiteConfig, ITemplateManifestLog } from '../models/ITemplateManifest';
import { ITemplateFileMetadata } from './IDataService';
import { GoNoGoDecision, Stage, RoleName, WorkflowKey, PermissionLevel, StepAssignmentType, ConditionField, TurnoverStatus, ScorecardStatus, WorkflowActionType, ActionPriority, AuditAction, EntityType } from '../models/enums';
import { DataServiceError } from './DataServiceError';
import { performanceService } from './PerformanceService';
import { LIST_NAMES, CACHE_KEYS, CACHE_TTL_MS, HUB_LISTS } from '../utils/constants';
import { ROLE_PERMISSIONS } from '../utils/permissions';
import { resolveToolPermissions, TOOL_DEFINITIONS } from '../utils/toolPermissionMap';
import { STANDARD_BUYOUT_DIVISIONS } from '../utils/buyoutTemplate';
import { DEFAULT_PREREQUISITES, DEFAULT_DISCUSSION_ITEMS, DEFAULT_EXHIBITS, DEFAULT_SIGNATURES, TURNOVER_SIGNATURE_AFFIDAVIT } from '../utils/turnoverAgendaTemplate';
import { calculateTotalScore, getRecommendedDecision } from '../utils/scoreCalculator';
import { computeScheduleMetrics } from '../utils/scheduleMetrics';
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
  TEMPLATE_REGISTRY_COLUMNS,
  PROJECT_DATA_MART_COLUMNS,
  CLOSEOUT_ITEMS_COLUMNS,
  SCHEDULE_ACTIVITIES_COLUMNS,
  SCHEDULE_IMPORTS_COLUMNS,
  SCHEDULE_FIELD_LINKS_COLUMNS,
  CONSTRAINTS_LOG_COLUMNS,
  PERMITS_LOG_COLUMNS,
  TEMPLATE_SITE_CONFIG_COLUMNS,
  TEMPLATE_MANIFEST_LOG_COLUMNS,
} from './columnMappings';
import { BD_LEADS_SITE_URL, BD_LEADS_LIBRARY, BD_LEADS_SUBFOLDERS } from '../utils/constants';
import { cacheService } from './CacheService';
import { getProjectListSchemas } from '../utils/projectListSchemas';
import { ScheduleEngine, getScheduleEngineRuntimeInfo as resolveScheduleEngineRuntime } from '../engine';

/** Build a deterministic cache key suffix from query parameters. */
function buildCacheKeySuffix(params: Record<string, unknown> | undefined): string {
  if (!params) return '';
  const filtered = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b));
  if (filtered.length === 0) return '';
  const obj: Record<string, unknown> = {};
  for (const [k, v] of filtered) {
    obj[k] = v;
  }
  return '_' + JSON.stringify(obj);
}

async function computeSha256Hex(input: ArrayBuffer): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', input);
  const bytes = new Uint8Array(digest);
  let hex = '';
  for (const b of bytes) {
    hex += b.toString(16).padStart(2, '0');
  }
  return hex;
}

const USER_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes for user-scoped data
const DATA_MART_SYNC_BATCH_SIZE = 5; // Concurrent syncToDataMart calls in triggerDataMartSync

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
  private scheduleConflictsByProject: Record<string, IScheduleConflict[]> = {};
  private scheduleBaselinesByProject: Record<string, Array<{ baselineId: string; name: string; createdBy: string; createdAt: string }>> = {};
  private scheduleScenariosByProject: Record<string, IScheduleScenario[]> = {};
  private scheduleScenarioActivities: Record<string, IScheduleActivity[]> = {};
  private readonly scheduleEngine = new ScheduleEngine();

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

  private paginateArray<T extends { id?: number }>(
    rows: T[],
    request: ICursorPageRequest
  ): ICursorPageResult<T> {
    const pageSize = Math.max(1, request.pageSize || 100);
    const offset = request.token?.lastId && request.token.lastId > 0 ? request.token.lastId : 0;
    const items = rows.slice(offset, offset + pageSize);
    const nextOffset = offset + items.length;
    const hasMore = nextOffset < rows.length;
    const last = items[items.length - 1];
    const nextToken: ICursorToken | null = hasMore
      ? {
          lastId: nextOffset,
          lastModified: (last as { modifiedDate?: string })?.modifiedDate,
        }
      : null;

    return {
      items,
      nextToken,
      hasMore,
      totalApprox: rows.length,
    };
  }

  // --- Leads ---
  // LOAD-TEST: Expected 100-500 leads over time. Default top(100). At 500+ items, consider server-side paging.
  async getLeads(_options?: IListQueryOptions): Promise<IPagedResult<ILead>> {
    performanceService.startMark('sp:getLeads');
    try {
      const items = await this.sp.web.lists.getByTitle(LIST_NAMES.LEADS_MASTER).items
        .top(_options?.top || 100)();
      performanceService.endMark('sp:getLeads');
      return { items: items as ILead[], totalCount: items.length, hasMore: false };
    } catch (err) {
      performanceService.endMark('sp:getLeads');
      throw this.handleError('getLeads', err, { entityType: 'Lead' });
    }
  }

  async getLeadById(id: number): Promise<ILead | null> {
    performanceService.startMark('sp:getLeadById');
    try {
      const item = await this.sp.web.lists.getByTitle(LIST_NAMES.LEADS_MASTER).items.getById(id)();
      performanceService.endMark('sp:getLeadById');
      return item as ILead;
    } catch {
      performanceService.endMark('sp:getLeadById');
      return null;
    }
  }

  // SP-INDEX-REQUIRED: Leads_Master → Stage
  async getLeadsByStage(stage: Stage): Promise<ILead[]> {
    performanceService.startMark('sp:getLeadsByStage');
    try {
      const items = await this.sp.web.lists.getByTitle(LIST_NAMES.LEADS_MASTER).items
        .filter(`Stage eq '${stage}'`)
        .top(5000)();
      performanceService.endMark('sp:getLeadsByStage');
      return items as ILead[];
    } catch (err) {
      performanceService.endMark('sp:getLeadsByStage');
      throw this.handleError('getLeadsByStage', err, { entityType: 'Lead' });
    }
  }

  async createLead(data: ILeadFormData): Promise<ILead> {
    performanceService.startMark('sp:createLead');
    try {
      const result = await this.sp.web.lists.getByTitle(LIST_NAMES.LEADS_MASTER).items.add(data);
      performanceService.endMark('sp:createLead');
      return result as ILead;
    } catch (err) {
      performanceService.endMark('sp:createLead');
      throw this.handleError('createLead', err, { entityType: 'Lead' });
    }
  }

  async updateLead(id: number, data: Partial<ILead>): Promise<ILead> {
    performanceService.startMark('sp:updateLead');
    try {
      await this.sp.web.lists.getByTitle(LIST_NAMES.LEADS_MASTER).items.getById(id).update(data);
      performanceService.endMark('sp:updateLead');
      return this.getLeadById(id) as Promise<ILead>;
    } catch (err) {
      performanceService.endMark('sp:updateLead');
      throw this.handleError('updateLead', err, { entityType: 'Lead', entityId: String(id) });
    }
  }

  async deleteLead(id: number): Promise<void> {
    performanceService.startMark('sp:deleteLead');
    try {
      await this.sp.web.lists.getByTitle(LIST_NAMES.LEADS_MASTER).items.getById(id).delete();
      performanceService.endMark('sp:deleteLead');
    } catch (err) {
      performanceService.endMark('sp:deleteLead');
      throw this.handleError('deleteLead', err, { entityType: 'Lead', entityId: String(id) });
    }
  }

  // LOAD-TEST: substringof() prevents SP index usage — full table scan. Consider SP Search API at >1000 leads.
  async searchLeads(query: string): Promise<ILead[]> {
    performanceService.startMark('sp:searchLeads');
    try {
      const items = await this.sp.web.lists.getByTitle(LIST_NAMES.LEADS_MASTER).items
        .filter(`substringof('${query}', Title) or substringof('${query}', ClientName) or substringof('${query}', ProjectCode)`)
        .top(5000)();
      performanceService.endMark('sp:searchLeads');
      return items as ILead[];
    } catch (err) {
      performanceService.endMark('sp:searchLeads');
      throw this.handleError('searchLeads', err, { entityType: 'Lead' });
    }
  }

  // --- Scorecards ---
  // SP-INDEX-REQUIRED: GoNoGo_Scorecard → LeadID
  async getScorecardByLeadId(leadId: number): Promise<IGoNoGoScorecard | null> {
    performanceService.startMark('sp:getScorecardByLeadId');
    try {
      const items = await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items
        .filter(`LeadID eq ${leadId}`)
        .top(1)();
      performanceService.endMark('sp:getScorecardByLeadId');
      return items.length > 0 ? items[0] as IGoNoGoScorecard : null;
    } catch (err) {
      performanceService.endMark('sp:getScorecardByLeadId');
      throw this.handleError('getScorecardByLeadId', err, { entityType: 'Scorecard' });
    }
  }

  // LOAD-TEST: Returns all scorecards. Expected <500. Added top(5000) safety.
  async getScorecards(): Promise<IGoNoGoScorecard[]> {
    performanceService.startMark('sp:getScorecards');
    try {
      const items = await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items
        .top(5000)();
      performanceService.endMark('sp:getScorecards');
      return items as IGoNoGoScorecard[];
    } catch (err) {
      performanceService.endMark('sp:getScorecards');
      throw this.handleError('getScorecards', err, { entityType: 'Scorecard' });
    }
  }

  async createScorecard(data: Partial<IGoNoGoScorecard>): Promise<IGoNoGoScorecard> {
    performanceService.startMark('sp:createScorecard');
    try {
      const result = await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items.add(data);
      performanceService.endMark('sp:createScorecard');
      return result as IGoNoGoScorecard;
    } catch (err) {
      performanceService.endMark('sp:createScorecard');
      throw this.handleError('createScorecard', err, { entityType: 'Scorecard' });
    }
  }

  async updateScorecard(id: number, data: Partial<IGoNoGoScorecard>): Promise<IGoNoGoScorecard> {
    performanceService.startMark('sp:updateScorecard');
    try {
      await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items.getById(id).update(data);
      performanceService.endMark('sp:updateScorecard');
      return { id, ...data } as IGoNoGoScorecard;
    } catch (err) {
      performanceService.endMark('sp:updateScorecard');
      throw this.handleError('updateScorecard', err, { entityType: 'Scorecard', entityId: String(id) });
    }
  }

  async submitGoNoGoDecision(scorecardId: number, decision: GoNoGoDecision, projectCode?: string): Promise<void> {
    performanceService.startMark('sp:submitGoNoGoDecision');
    try {
      await this.updateScorecard(scorecardId, {
        Decision: decision,
        DecisionDate: new Date().toISOString(),
        ProjectCode: projectCode,
      });
      performanceService.endMark('sp:submitGoNoGoDecision');
    } catch (err) {
      performanceService.endMark('sp:submitGoNoGoDecision');
      throw this.handleError('submitGoNoGoDecision', err, { entityType: 'Scorecard', entityId: String(scorecardId) });
    }
  }

  // --- Estimating ---
  // LOAD-TEST: Returns all estimating records. Expected <500. Added top(5000) safety.
  async getEstimatingRecords(_options?: IListQueryOptions): Promise<IPagedResult<IEstimatingTracker>> {
    performanceService.startMark('sp:getEstimatingRecords');
    try {
      const items = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_TRACKER).items
        .top(5000)();
      performanceService.endMark('sp:getEstimatingRecords');
      return { items: items as IEstimatingTracker[], totalCount: items.length, hasMore: false };
    } catch (err) {
      performanceService.endMark('sp:getEstimatingRecords');
      throw this.handleError('getEstimatingRecords', err, { entityType: 'EstimatingTracker' });
    }
  }

  async getEstimatingRecordById(id: number): Promise<IEstimatingTracker | null> {
    performanceService.startMark('sp:getEstimatingRecordById');
    try {
      const item = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_TRACKER).items.getById(id)();
      performanceService.endMark('sp:getEstimatingRecordById');
      return item as IEstimatingTracker;
    } catch {
      performanceService.endMark('sp:getEstimatingRecordById');
      return null;
    }
  }

  // SP-INDEX-REQUIRED: Estimating_Tracker → LeadID
  async getEstimatingByLeadId(leadId: number): Promise<IEstimatingTracker | null> {
    performanceService.startMark('sp:getEstimatingByLeadId');
    try {
      const items = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_TRACKER).items
        .filter(`LeadID eq ${leadId}`)
        .top(1)();
      performanceService.endMark('sp:getEstimatingByLeadId');
      return items.length > 0 ? items[0] as IEstimatingTracker : null;
    } catch (err) {
      performanceService.endMark('sp:getEstimatingByLeadId');
      throw this.handleError('getEstimatingByLeadId', err, { entityType: 'EstimatingTracker' });
    }
  }

  async createEstimatingRecord(data: Partial<IEstimatingTracker>): Promise<IEstimatingTracker> {
    performanceService.startMark('sp:createEstimatingRecord');
    try {
      const result = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_TRACKER).items.add(data);
      performanceService.endMark('sp:createEstimatingRecord');
      return result as IEstimatingTracker;
    } catch (err) {
      performanceService.endMark('sp:createEstimatingRecord');
      throw this.handleError('createEstimatingRecord', err, { entityType: 'EstimatingTracker' });
    }
  }

  async updateEstimatingRecord(id: number, data: Partial<IEstimatingTracker>): Promise<IEstimatingTracker> {
    performanceService.startMark('sp:updateEstimatingRecord');
    try {
      await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_TRACKER).items.getById(id).update(data);
      performanceService.endMark('sp:updateEstimatingRecord');
      return { id, ...data } as IEstimatingTracker;
    } catch (err) {
      performanceService.endMark('sp:updateEstimatingRecord');
      throw this.handleError('updateEstimatingRecord', err, { entityType: 'EstimatingTracker', entityId: String(id) });
    }
  }

  // SP-INDEX-REQUIRED: Estimating_Tracker → AwardStatus
  async getCurrentPursuits(): Promise<IEstimatingTracker[]> {
    performanceService.startMark('sp:getCurrentPursuits');
    try {
      const items = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_TRACKER).items
        .filter(`AwardStatus eq 'Pending'`)
        .top(5000)();
      performanceService.endMark('sp:getCurrentPursuits');
      return items as IEstimatingTracker[];
    } catch (err) {
      performanceService.endMark('sp:getCurrentPursuits');
      throw this.handleError('getCurrentPursuits', err, { entityType: 'EstimatingTracker' });
    }
  }

  // SP-INDEX-REQUIRED: Estimating_Tracker → AwardStatus
  async getPreconEngagements(): Promise<IEstimatingTracker[]> {
    performanceService.startMark('sp:getPreconEngagements');
    try {
      const items = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_TRACKER).items
        .filter(`AwardStatus eq 'Awarded w/ Precon'`)
        .top(5000)();
      performanceService.endMark('sp:getPreconEngagements');
      return items as IEstimatingTracker[];
    } catch (err) {
      performanceService.endMark('sp:getPreconEngagements');
      throw this.handleError('getPreconEngagements', err, { entityType: 'EstimatingTracker' });
    }
  }

  // SP-INDEX-REQUIRED: Estimating_Tracker → SubmittedDate
  async getEstimateLog(): Promise<IEstimatingTracker[]> {
    performanceService.startMark('sp:getEstimateLog');
    try {
      const items = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_TRACKER).items
        .filter(`SubmittedDate ne null`)
        .top(5000)();
      performanceService.endMark('sp:getEstimateLog');
      return items as IEstimatingTracker[];
    } catch (err) {
      performanceService.endMark('sp:getEstimateLog');
      throw this.handleError('getEstimateLog', err, { entityType: 'EstimatingTracker' });
    }
  }

  // --- RBAC ---
  // LOAD-TEST: Reads App_Roles list (expected <20 roles). Called once on app init. Fast.
  async getCurrentUser(): Promise<ICurrentUser> {
    performanceService.startMark('sp:getCurrentUser');
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
    performanceService.endMark('sp:getCurrentUser');
  }

  // LOAD-TEST: Hub-site reference list. Expected <20 roles. Unbounded but small.
  async getRoles(): Promise<IRole[]> {
    performanceService.startMark('sp:getRoles');
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.APP_ROLES).items();
    performanceService.endMark('sp:getRoles');
    return items as IRole[];
  }

  async updateRole(id: number, data: Partial<IRole>): Promise<IRole> {
    performanceService.startMark('sp:updateRole');
    await this.sp.web.lists.getByTitle(LIST_NAMES.APP_ROLES).items.getById(id).update(data);
    performanceService.endMark('sp:updateRole');
    return { id, ...data } as IRole;
  }

  // --- Feature Flags ---
  async getFeatureFlags(): Promise<IFeatureFlag[]> {
    performanceService.startMark('sp:getFeatureFlags');
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.FEATURE_FLAGS).items();
    performanceService.endMark('sp:getFeatureFlags');
    return items as IFeatureFlag[];
  }

  async updateFeatureFlag(id: number, data: Partial<IFeatureFlag>): Promise<IFeatureFlag> {
    performanceService.startMark('sp:updateFeatureFlag');
    await this.sp.web.lists.getByTitle(LIST_NAMES.FEATURE_FLAGS).items.getById(id).update(data);
    performanceService.endMark('sp:updateFeatureFlag');
    return { id, ...data } as IFeatureFlag;
  }

  // --- Meetings ---
  async getCalendarAvailability(_emails: string[], _startDate: string, _endDate: string): Promise<ICalendarAvailability[]> {
    performanceService.startMark('sp:getCalendarAvailability');
    // Delegated to GraphService
    throw new Error('Use GraphService directly');
    performanceService.endMark('sp:getCalendarAvailability');
  }

  async createMeeting(_meeting: Partial<IMeeting>): Promise<IMeeting> {
    performanceService.startMark('sp:createMeeting');
    throw new Error('Use GraphService directly');
    performanceService.endMark('sp:createMeeting');
  }

  async getMeetings(_projectCode?: string): Promise<IMeeting[]> {
    performanceService.startMark('sp:getMeetings');
    performanceService.endMark('sp:getMeetings');
    return [];
  }

  // --- Notifications ---
  async sendNotification(_notification: Partial<INotification>): Promise<INotification> {
    performanceService.startMark('sp:sendNotification');
    throw new Error('Use PowerAutomateService directly');
    performanceService.endMark('sp:sendNotification');
  }

  async getNotifications(_projectCode?: string): Promise<INotification[]> {
    performanceService.startMark('sp:getNotifications');
    performanceService.endMark('sp:getNotifications');
    return [];
  }

  // --- Audit ---
  async logAudit(entry: Partial<IAuditEntry>): Promise<void> {
    performanceService.startMark('sp:logAudit');
    await this.sp.web.lists.getByTitle(LIST_NAMES.AUDIT_LOG).items.add(entry);
    performanceService.endMark('sp:logAudit');
  }

  private handleError(
    method: string,
    err: unknown,
    options?: { entityType?: string; entityId?: string; rethrow?: boolean }
  ): DataServiceError {
    const dsError = err instanceof DataServiceError
      ? err
      : new DataServiceError(method, 'Operation failed', {
          entityType: options?.entityType,
          entityId: options?.entityId,
          innerError: err,
        });

    this.logAudit({
      Action: AuditAction.ServiceError,
      EntityType: (dsError.entityType as EntityType) || EntityType.Project,
      EntityId: dsError.entityId || '',
      User: this._pageContextUser?.displayName || 'System',
      Details: dsError.message,
    }).catch(() => { /* fire-and-forget */ });

    if (options?.rethrow !== false) {
      throw dsError;
    }
    return dsError;
  }

  // SP-INDEX-REQUIRED: Audit_Log → EntityType, EntityId, Timestamp
  // LOAD-TEST: Dynamic multi-column filter. Bounded at top(100). Timestamp index critical for date range queries.
  async getAuditLog(entityType?: string, entityId?: string, startDate?: string, endDate?: string): Promise<IAuditEntry[]> {
    performanceService.startMark('sp:getAuditLog');
    let query = this.sp.web.lists.getByTitle(LIST_NAMES.AUDIT_LOG).items;
    const filters: string[] = [];
    if (entityType) filters.push(`EntityType eq '${entityType}'`);
    if (entityId) filters.push(`EntityId eq '${entityId}'`);
    if (startDate) filters.push(`Timestamp ge datetime'${startDate}'`);
    if (endDate) filters.push(`Timestamp le datetime'${endDate}'`);
    if (filters.length > 0) query = query.filter(filters.join(' and '));
    const items = await query.orderBy('Timestamp', false).top(100)();
    performanceService.endMark('sp:getAuditLog');
    return items as IAuditEntry[];
  }

  async getAuditLogPage(request: ICursorPageRequest): Promise<ICursorPageResult<IAuditEntry>> {
    const filters = request.filters ?? {};
    const entityType = typeof filters.entityType === 'string' ? filters.entityType : undefined;
    const entityId = typeof filters.entityId === 'string' ? filters.entityId : undefined;
    const startDate = typeof filters.startDate === 'string' ? filters.startDate : undefined;
    const endDate = typeof filters.endDate === 'string' ? filters.endDate : undefined;
    const rows = await this.getAuditLog(entityType, entityId, startDate, endDate);
    return this.paginateArray(rows, request);
  }

  async purgeOldAuditEntries(_olderThanDays: number): Promise<number> {
    performanceService.startMark('sp:purgeOldAuditEntries');
    throw new Error('Not implemented — use Power Automate scheduled flow for production archive');
    performanceService.endMark('sp:purgeOldAuditEntries');
  }

  // --- Provisioning ---
  // LOAD-TEST: 2 SP calls: add + re-read. Fast.
  async triggerProvisioning(leadId: number, projectCode: string, projectName: string, requestedBy: string, metadata?: {
    division?: string; region?: string; clientName?: string }): Promise<IProvisioningLog> {
    performanceService.startMark('sp:triggerProvisioning');
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
    if (metadata?.division) addData[col.division] = metadata.division;
    if (metadata?.region) addData[col.region] = metadata.region;
    if (metadata?.clientName) addData[col.clientName] = metadata.clientName;
    const result = await this.sp.web.lists.getByTitle(LIST_NAMES.PROVISIONING_LOG).items.add(addData);
    const newId = (result.data as Record<string, unknown>).Id as number;
    const item = await this.sp.web.lists.getByTitle(LIST_NAMES.PROVISIONING_LOG).items.getById(newId)();
    performanceService.endMark('sp:triggerProvisioning');
    return item as IProvisioningLog;
  }

  // SP-INDEX-REQUIRED: Provisioning_Log → ProjectCode
  async getProvisioningStatus(projectCode: string): Promise<IProvisioningLog | null> {
    performanceService.startMark('sp:getProvisioningStatus');
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.PROVISIONING_LOG).items
      .filter(`ProjectCode eq '${projectCode}'`)
      .orderBy('RequestedAt', false)
      .top(1)();
    if (items.length === 0) return null;
    performanceService.endMark('sp:getProvisioningStatus');
    return items[0] as IProvisioningLog;
  }

  // SP-INDEX-REQUIRED: Provisioning_Log → ProjectCode
  async updateProvisioningLog(projectCode: string, data: Partial<IProvisioningLog>): Promise<IProvisioningLog> {
    performanceService.startMark('sp:updateProvisioningLog');
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
    performanceService.endMark('sp:updateProvisioningLog');
    return updated as IProvisioningLog;
  }

  // LOAD-TEST: Hub-wide query. Expected <200 provisioning records. Bounded at top(100).
  async getProvisioningLogs(): Promise<IProvisioningLog[]> {
    performanceService.startMark('sp:getProvisioningLogs');
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.PROVISIONING_LOG).items
      .orderBy('RequestedAt', false)
      .top(100)();
    performanceService.endMark('sp:getProvisioningLogs');
    return items as IProvisioningLog[];
  }

  // SP-INDEX-REQUIRED: Provisioning_Log → ProjectCode
  async retryProvisioning(projectCode: string, fromStep: number): Promise<IProvisioningLog> {
    performanceService.startMark('sp:retryProvisioning');
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
    performanceService.endMark('sp:retryProvisioning');
    return updated as IProvisioningLog;
  }

  // --- Provisioning Operations ---

  // LOAD-TEST: External REST call to SP Site Manager API. Slow (5-30s). One-time per project.
  async createProjectSite(projectCode: string, projectName: string, siteAlias: string): Promise<{
    siteUrl: string }> {
    performanceService.startMark('sp:createProjectSite');
    const siteUrl = `https://hedrickbrotherscom.sharepoint.com/sites/${siteAlias}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (this.sp.web as any).fetchRaw(
      'https://hedrickbrotherscom.sharepoint.com/_api/SPSiteManager/create',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json;odata=verbose', 'Accept': 'application/json;odata=verbose' },
        body: JSON.stringify({
          request: {
            Title: `${projectCode} — ${projectName}`,
            Url: siteUrl,
            Lcid: 1033,
            ShareByEmailEnabled: false,
            Description: `HBC Project Site: ${projectCode}`,
            WebTemplate: 'STS#3',
            Owner: '',
          },
        }),
      }
    );
    if (!response.ok) throw new Error(`Site creation failed (${response.status}): ${response.statusText}`);
    this.logAudit({ Action: AuditAction.SiteCreated, EntityType: EntityType.Project, EntityId: projectCode, ProjectCode: projectCode, Details: `Project site created: ${siteUrl}`, User: 'system' }).catch(console.error);
    performanceService.endMark('sp:createProjectSite');
    return { siteUrl };
  }

  // LOAD-TEST: CRITICAL: Creates 41 lists with fields. Batched by 5. Expected 30-60s per project. One-time.
  async provisionProjectLists(siteUrl: string, projectCode: string): Promise<void> {
    performanceService.startMark('sp:provisionProjectLists');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Web } = require('@pnp/sp/webs');
    const web = Web([this.sp.web, siteUrl]);
    const schemas = getProjectListSchemas();

    // Create lists in batches of 5 to avoid throttling
    const BATCH_SIZE = 5;
    for (let i = 0; i < schemas.length; i += BATCH_SIZE) {
      const batch = schemas.slice(i, i + BATCH_SIZE);
      const [batchedWeb, execute] = web.batched();
      for (const schema of batch) {
        batchedWeb.lists.add(schema.listName, schema.description, schema.templateType);
      }
      await execute();

      // Add fields sequentially per list (field XML cannot be batched reliably)
      for (const schema of batch) {
        const list = web.lists.getByTitle(schema.listName);
        for (const field of schema.fields) {
          try {
            const xml = this._buildFieldXml(field);
            await list.fields.createFieldAsXml(xml);
          } catch { /* field may already exist */ }
        }
      }
    }
    this.logAudit({ Action: AuditAction.SiteListsProvisioned, EntityType: EntityType.Project, EntityId: projectCode, ProjectCode: projectCode, Details: `Provisioned ${schemas.length} lists on ${siteUrl}`, User: 'system' }).catch(console.error);
    performanceService.endMark('sp:provisionProjectLists');
  }

  async associateWithHubSite(siteUrl: string, hubSiteUrl: string): Promise<void> {
    performanceService.startMark('sp:associateWithHubSite');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Web } = require('@pnp/sp/webs');
    const hubWeb = Web([this.sp.web, hubSiteUrl]);
    const hubSiteInfo = await hubWeb.site();
    const hubSiteId = hubSiteInfo.Id;
    const projectWeb = Web([this.sp.web, siteUrl]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (projectWeb.site as any).joinHubSite(hubSiteId);
    this.logAudit({ Action: AuditAction.SiteHubAssociated, EntityType: EntityType.Project, EntityId: siteUrl, Details: `Associated ${siteUrl} with hub ${hubSiteUrl}`, User: 'system' }).catch(console.error);
    performanceService.endMark('sp:associateWithHubSite');
  }

  async createProjectSecurityGroups(siteUrl: string, projectCode: string, _division: string): Promise<void> {
    performanceService.startMark('sp:createProjectSecurityGroups');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Web } = require('@pnp/sp/webs');
    const web = Web([this.sp.web, siteUrl]);
    const suffixes = ['Owners', 'Members', 'Visitors'];
    for (const suffix of suffixes) {
      try {
        const groups = await web.siteGroups();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const group = (groups as any[]).find((g: any) => g.Title?.endsWith(suffix));
        if (group) {
          await web.siteGroups.getById(group.Id).update({ Title: `${projectCode} ${suffix}` });
        }
      } catch { /* group rename non-blocking */ }
    }
    // Read active security group mappings and invite to default template roles
    const mappings = await this.getSecurityGroupMappings();
    const activeGroups = mappings.filter(m => m.isActive);
    for (const sg of activeGroups) {
      try {
        // Invite security group to project site as Members by default
        await this.inviteToProjectSiteGroup(projectCode, sg.securityGroupName, 'Members');
      } catch { /* non-blocking */ }
    }
    this.logAudit({ Action: AuditAction.SiteSecurityGroupsCreated, EntityType: EntityType.Project, EntityId: projectCode, ProjectCode: projectCode, Details: `Security groups created for ${projectCode} on ${siteUrl}`, User: 'system' }).catch(console.error);
    performanceService.endMark('sp:createProjectSecurityGroups');
  }

  // SP-INDEX-REQUIRED: Template_Registry → Active+Division
  // LOAD-TEST: N file copy operations. Expected <20 templates per division. Serial file copies can be slow.
  async copyTemplateFiles(siteUrl: string, projectCode: string, division: string): Promise<void> {
    performanceService.startMark('sp:copyTemplateFiles');
    const col = TEMPLATE_REGISTRY_COLUMNS;
    const templates = await this.sp.web.lists.getByTitle(LIST_NAMES.TEMPLATE_REGISTRY).items
      .filter(`${col.Active} eq 1 and (${col.Division} eq '${division}' or ${col.Division} eq 'All')`)();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Web } = require('@pnp/sp/webs');
    const projectWeb = Web([this.sp.web, siteUrl]);
    for (const tmpl of templates) {
      const sourceUrl = String(tmpl[col.SourceURL] || '');
      const targetFolder = String(tmpl[col.TargetFolder] || 'Shared Documents');
      if (!sourceUrl) continue;
      try {
        const fileName = sourceUrl.split('/').pop() || '';
        const fileBuffer = await this.sp.web.getFileByServerRelativePath(sourceUrl).getBuffer();
        await projectWeb.getFolderByServerRelativePath(targetFolder).files.addUsingPath(fileName, fileBuffer, { Overwrite: true });
      } catch (err) { console.warn(`[SP] Template copy failed ${sourceUrl}:`, err); }
    }
    this.logAudit({ Action: AuditAction.SiteTemplatesCopied, EntityType: EntityType.Project, EntityId: projectCode, ProjectCode: projectCode, Details: `Copied ${templates.length} templates to ${siteUrl}`, User: 'system' }).catch(console.error);
    performanceService.endMark('sp:copyTemplateFiles');
  }

  async copyLeadDataToProjectSite(siteUrl: string, leadId: number, projectCode: string): Promise<void> {
    performanceService.startMark('sp:copyLeadDataToProjectSite');
    const lead = await this.getLeadById(leadId);
    if (!lead) throw new Error(`Lead ${leadId} not found`);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Web } = require('@pnp/sp/webs');
    const projectWeb = Web([this.sp.web, siteUrl]);
    // Seed Project_Info
    await projectWeb.lists.getByTitle('Project_Info').items.add({
      Title: lead.Title, ProjectCode: projectCode, LeadID: leadId, ProjectSiteURL: siteUrl,
    });
    // Seed Contract_Info
    await projectWeb.lists.getByTitle('Contract_Info').items.add({
      projectCode, leadId,
    });
    this.logAudit({ Action: AuditAction.SiteLeadDataCopied, EntityType: EntityType.Project, EntityId: projectCode, ProjectCode: projectCode, Details: `Lead data (ID: ${leadId}) copied to ${siteUrl}`, User: 'system' }).catch(console.error);
    performanceService.endMark('sp:copyLeadDataToProjectSite');
  }

  async updateSiteProperties(siteUrl: string, properties: Record<string, string>): Promise<void> {
    performanceService.startMark('sp:updateSiteProperties');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Web } = require('@pnp/sp/webs');
    const web = Web([this.sp.web, siteUrl]);
    await web.update(properties);
    performanceService.endMark('sp:updateSiteProperties');
  }

  async createList(siteUrl: string, listName: string, templateType: number, fields: IFieldDefinition[]): Promise<void> {
    performanceService.startMark('sp:createList');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Web } = require('@pnp/sp/webs');
    const web = Web([this.sp.web, siteUrl]);
    await web.lists.add(listName, '', templateType);
    const list = web.lists.getByTitle(listName);
    for (const field of fields) {
      const xml = this._buildFieldXml(field);
      await list.fields.createFieldAsXml(xml);
    performanceService.endMark('sp:createList');
    }
  }

  private _buildFieldXml(field: IFieldDefinition): string {
    const req = field.required ? ' Required="TRUE"' : '';
    const idx = field.indexed ? ' Indexed="TRUE"' : '';
    return `<Field Type="${field.fieldType}" DisplayName="${field.displayName}" Name="${field.internalName}"${req}${idx}/>`;
  }

  // --- GitOps Template Provisioning ---

  async getTemplateSiteConfig(): Promise<ITemplateSiteConfig | null> {
    try {
      const cached = cacheService.get<ITemplateSiteConfig>(CACHE_KEYS.TEMPLATE_SITE_CONFIG);
      if (cached) return cached;
      const items = await this.sp.web.lists.getByTitle(HUB_LISTS.TEMPLATE_SITE_CONFIG)
        .items.filter('Active eq 1').orderBy('ID', false).top(1)();
      if (items.length === 0) return null;
      const item = items[0] as Record<string, unknown>;
      const config: ITemplateSiteConfig = {
        id: item[TEMPLATE_SITE_CONFIG_COLUMNS.id] as number,
        templateSiteUrl: item[TEMPLATE_SITE_CONFIG_COLUMNS.TemplateSiteUrl] as string,
        lastSnapshotHash: (item[TEMPLATE_SITE_CONFIG_COLUMNS.LastSnapshotHash] as string) ?? '',
        lastSnapshotDate: (item[TEMPLATE_SITE_CONFIG_COLUMNS.LastSnapshotDate] as string) ?? '',
        githubRepoOwner: (item[TEMPLATE_SITE_CONFIG_COLUMNS.GitHubRepoOwner] as string) ?? '',
        githubRepoName: (item[TEMPLATE_SITE_CONFIG_COLUMNS.GitHubRepoName] as string) ?? '',
        githubBranch: (item[TEMPLATE_SITE_CONFIG_COLUMNS.GitHubBranch] as string) ?? 'main',
        active: item[TEMPLATE_SITE_CONFIG_COLUMNS.Active] as boolean,
      };
      cacheService.set(CACHE_KEYS.TEMPLATE_SITE_CONFIG, config);
      return config;
    } catch (e) {
      throw this.handleError('getTemplateSiteConfig', e, { entityType: 'TemplateSiteConfig' });
    }
  }

  async updateTemplateSiteConfig(data: Partial<ITemplateSiteConfig>): Promise<ITemplateSiteConfig> {
    const current = await this.getTemplateSiteConfig();
    if (!current) throw new Error('Template_Site_Config entry not found');
    await this.sp.web.lists.getByTitle(HUB_LISTS.TEMPLATE_SITE_CONFIG)
      .items.getById(current.id).update({
        [TEMPLATE_SITE_CONFIG_COLUMNS.LastSnapshotHash]: data.lastSnapshotHash ?? current.lastSnapshotHash,
        [TEMPLATE_SITE_CONFIG_COLUMNS.LastSnapshotDate]: data.lastSnapshotDate ?? current.lastSnapshotDate,
        [TEMPLATE_SITE_CONFIG_COLUMNS.Active]: data.active ?? current.active,
      });
    cacheService.remove(CACHE_KEYS.TEMPLATE_SITE_CONFIG);
    this.logAudit({
      Action: AuditAction.TemplateSiteConfigUpdated,
      EntityType: EntityType.TemplateSiteConfig,
      EntityId: String(current.id),
      User: this._pageContextUser?.email ?? 'unknown',
      Details: 'Template site config updated',
    }).catch(console.error);
    return { ...current, ...data };
  }

  async getCommittedTemplateRegistry(): Promise<ITemplateRegistry> {
    try {
      const cached = cacheService.get<ITemplateRegistry>(CACHE_KEYS.TEMPLATE_REGISTRY);
      if (cached) return cached;
      const config = await this.getTemplateSiteConfig();
      const owner = config?.githubRepoOwner ?? 'RMF112018';
      const repo = config?.githubRepoName ?? 'Project-Controls';
      const branch = config?.githubBranch ?? 'main';
      const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/templates/template-registry.json`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Failed to fetch template registry: HTTP ${resp.status}`);
      const registry = (await resp.json()) as ITemplateRegistry;
      cacheService.set(CACHE_KEYS.TEMPLATE_REGISTRY, registry, 5 * 60 * 1000); // 5-min TTL
      return registry;
    } catch (e) {
      throw this.handleError('getCommittedTemplateRegistry', e, { entityType: 'TemplateRegistry' });
    }
  }

  async getTemplateSiteFiles(): Promise<ITemplateFileMetadata[]> {
    try {
      const config = await this.getTemplateSiteConfig();
      if (!config) return [];
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Web } = require('@pnp/sp/webs');
      const templateWeb = Web([this.sp.web, config.templateSiteUrl]);
      const templateSiteRelUrl = new URL(config.templateSiteUrl).pathname;
      const folders = await templateWeb.getFolderByServerRelativePath(templateSiteRelUrl + '/Shared Documents').folders();
      const results: ITemplateFileMetadata[] = [];
      for (const folder of folders) {
        const files = await templateWeb.getFolderByServerRelativePath(folder.ServerRelativeUrl).files();
        for (const file of files) {
          const buf = await templateWeb.getFileByServerRelativePath(file.ServerRelativeUrl).getBuffer();
          const fileHash = `sha256:${await computeSha256Hex(buf as ArrayBuffer)}`;
          results.push({
            sourcePath: file.ServerRelativeUrl as string,
            fileName: file.Name as string,
            fileHash,
            fileSize: (file.Length as number) ?? 0,
            lastModified: file.TimeLastModified as string,
            division: 'Both', // Template Site doesn't tag division; registry mapping determines this
          });
        }
      }
      return results;
    } catch (e) {
      throw this.handleError('getTemplateSiteFiles', e, { entityType: 'TemplateRegistry' });
    }
  }

  async applyGitOpsTemplates(siteUrl: string, division: string, registry: ITemplateRegistry): Promise<{ appliedCount: number }> {
    const applicable = registry.templates.filter(
      t => t.active && (t.division === 'Both' || t.division === division)
    );
    let appliedCount = 0;
    const config = await this.getTemplateSiteConfig();
    if (!config) throw new Error('Template_Site_Config not found — cannot apply GitOps templates');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Web } = require('@pnp/sp/webs');
    for (const entry of applicable) {
      try {
        const buf = await Web([this.sp.web, config.templateSiteUrl])
          .getFileByServerRelativePath(entry.sourcePath)
          .getBuffer();
        await Web([this.sp.web, siteUrl])
          .getFolderByServerRelativePath(entry.targetFolder)
          .files.addUsingPath(entry.fileName, buf, { Overwrite: true });
        appliedCount++;
      } catch (err) {
        console.warn(`[GitOps] Failed to copy ${entry.fileName}:`, err);
        // Continue — do not fail the entire provisioning for a single file error
      }
    }
    this.logAudit({
      Action: AuditAction.TemplateAppliedFromGitOps,
      EntityType: EntityType.TemplateRegistry,
      EntityId: siteUrl,
      User: this._pageContextUser?.email ?? 'unknown',
      Details: `Applied ${appliedCount}/${applicable.length} templates to ${siteUrl} (division: ${division})`,
    }).catch(console.error);
    return { appliedCount };
  }

  async logTemplateSyncPR(entry: Omit<ITemplateManifestLog, 'id'>): Promise<ITemplateManifestLog> {
    const created = await this.sp.web.lists.getByTitle(HUB_LISTS.TEMPLATE_MANIFEST_LOG)
      .items.add({
        [TEMPLATE_MANIFEST_LOG_COLUMNS.SyncDate]: entry.syncDate,
        [TEMPLATE_MANIFEST_LOG_COLUMNS.TriggeredBy]: entry.triggeredBy,
        [TEMPLATE_MANIFEST_LOG_COLUMNS.DiffSummary]: JSON.stringify(entry.diffSummary),
        [TEMPLATE_MANIFEST_LOG_COLUMNS.PRNumber]: entry.prNumber,
        [TEMPLATE_MANIFEST_LOG_COLUMNS.PRUrl]: entry.prUrl,
        [TEMPLATE_MANIFEST_LOG_COLUMNS.Status]: entry.status,
      });
    this.logAudit({
      Action: AuditAction.TemplateSyncPRCreated,
      EntityType: EntityType.TemplateRegistry,
      EntityId: String((created.data as Record<string, unknown>)?.['ID'] ?? 0),
      User: this._pageContextUser?.email ?? 'unknown',
      Details: `Template sync PR #${entry.prNumber} logged`,
    }).catch(console.error);
    return { id: ((created.data as Record<string, unknown>)?.['ID'] as number) ?? 0, ...entry };
  }

  // --- Phase 6: Workflow ---
  // SP-INDEX-REQUIRED: Team_Members → ProjectCode
  async getTeamMembers(_projectCode: string): Promise<import('../models').ITeamMember[]> {
    performanceService.startMark('sp:getTeamMembers');
    const items = await this.sp.web.lists.getByTitle('Team_Members').items.filter(`ProjectCode eq '${_projectCode}'`)();
    performanceService.endMark('sp:getTeamMembers');
    return items;
  }

  // SP-INDEX-REQUIRED: Deliverables → ProjectCode
  async getDeliverables(_projectCode: string): Promise<import('../models').IDeliverable[]> {
    performanceService.startMark('sp:getDeliverables');
    const items = await this.sp.web.lists.getByTitle('Deliverables').items.filter(`ProjectCode eq '${_projectCode}'`)();
    performanceService.endMark('sp:getDeliverables');
    return items;
  }

  async createDeliverable(data: Partial<import('../models').IDeliverable>): Promise<import('../models').IDeliverable> {
    performanceService.startMark('sp:createDeliverable');
    const result = await this.sp.web.lists.getByTitle('Deliverables').items.add(data);
    performanceService.endMark('sp:createDeliverable');
    return result as import('../models').IDeliverable;
  }

  async updateDeliverable(id: number, data: Partial<import('../models').IDeliverable>): Promise<import('../models').IDeliverable> {
    performanceService.startMark('sp:updateDeliverable');
    await this.sp.web.lists.getByTitle('Deliverables').items.getById(id).update(data);
    performanceService.endMark('sp:updateDeliverable');
    return { id, ...data } as import('../models').IDeliverable;
  }

  // SP-INDEX-REQUIRED: Interview_Prep → LeadID
  async getInterviewPrep(_leadId: number): Promise<import('../models').IInterviewPrep | null> {
    performanceService.startMark('sp:getInterviewPrep');
    const items = await this.sp.web.lists.getByTitle('Interview_Prep').items.filter(`LeadID eq ${_leadId}`)();
    performanceService.endMark('sp:getInterviewPrep');
    return items.length > 0 ? items[0] : null;
  }

  async saveInterviewPrep(data: Partial<import('../models').IInterviewPrep>): Promise<import('../models').IInterviewPrep> {
    performanceService.startMark('sp:saveInterviewPrep');
    const result = await this.sp.web.lists.getByTitle('Interview_Prep').items.add(data);
    performanceService.endMark('sp:saveInterviewPrep');
    return result as import('../models').IInterviewPrep;
  }

  // SP-INDEX-REQUIRED: Contract_Info → ProjectCode
  async getContractInfo(_projectCode: string): Promise<import('../models').IContractInfo | null> {
    performanceService.startMark('sp:getContractInfo');
    const items = await this.sp.web.lists.getByTitle('Contract_Info').items.filter(`ProjectCode eq '${_projectCode}'`)();
    performanceService.endMark('sp:getContractInfo');
    return items.length > 0 ? items[0] : null;
  }

  async saveContractInfo(data: Partial<import('../models').IContractInfo>): Promise<import('../models').IContractInfo> {
    performanceService.startMark('sp:saveContractInfo');
    const result = await this.sp.web.lists.getByTitle('Contract_Info').items.add(data);
    performanceService.endMark('sp:saveContractInfo');
    return result as import('../models').IContractInfo;
  }

  // SP-INDEX-REQUIRED: Turnover_Items → ProjectCode
  async getTurnoverItems(_projectCode: string): Promise<import('../models').ITurnoverItem[]> {
    performanceService.startMark('sp:getTurnoverItems');
    const items = await this.sp.web.lists.getByTitle('Turnover_Items').items.filter(`ProjectCode eq '${_projectCode}'`)();
    performanceService.endMark('sp:getTurnoverItems');
    return items;
  }

  async updateTurnoverItem(id: number, data: Partial<import('../models').ITurnoverItem>): Promise<import('../models').ITurnoverItem> {
    performanceService.startMark('sp:updateTurnoverItem');
    await this.sp.web.lists.getByTitle('Turnover_Items').items.getById(id).update(data);
    performanceService.endMark('sp:updateTurnoverItem');
    return { id, ...data } as import('../models').ITurnoverItem;
  }

  // SP-INDEX-REQUIRED: Closeout_Items → ProjectCode
  async getCloseoutItems(_projectCode: string): Promise<import('../models').ICloseoutItem[]> {
    performanceService.startMark('sp:getCloseoutItems');
    const web = this._getProjectWeb();
    const col = CLOSEOUT_ITEMS_COLUMNS;
    const items = await web.lists.getByTitle('Closeout_Items').items
      .filter(`${col.projectCode} eq '${_projectCode}' and ${col.isHidden} ne 1`)
      .orderBy(col.sortOrder, true)
      .top(500)();
    const result = items.map((item: Record<string, unknown>) => this.mapToCloseoutItem(item));
    performanceService.endMark('sp:getCloseoutItems');
    return result;
  }

  async updateCloseoutItem(id: number, data: Partial<import('../models').ICloseoutItem>): Promise<import('../models').ICloseoutItem> {
    performanceService.startMark('sp:updateCloseoutItem');
    const web = this._getProjectWeb();
    const col = CLOSEOUT_ITEMS_COLUMNS;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (data.response !== undefined) updateData[col.response] = data.response;
    if (data.status !== undefined) updateData[col.status] = data.status;
    if (data.respondedBy !== undefined) updateData[col.respondedBy] = data.respondedBy;
    if (data.respondedDate !== undefined) updateData[col.respondedDate] = data.respondedDate;
    if (data.comment !== undefined) updateData[col.comment] = data.comment;
    if (data.isHidden !== undefined) updateData[col.isHidden] = data.isHidden;
    if (data.label !== undefined) updateData[col.label] = data.label;
    if (data.sortOrder !== undefined) updateData[col.sortOrder] = data.sortOrder;
    if (data.dateValue !== undefined) updateData[col.dateValue] = data.dateValue;
    if (data.details !== undefined) updateData[col.details] = data.details;
    if (data.assignedTo !== undefined) updateData[col.assignedTo] = data.assignedTo;
    if (data.notes !== undefined) updateData[col.notes] = data.notes;
    await web.lists.getByTitle('Closeout_Items').items.getById(id).update(updateData);
    const updated = await web.lists.getByTitle('Closeout_Items').items.getById(id)();
    performanceService.endMark('sp:updateCloseoutItem');
    return this.mapToCloseoutItem(updated);
  }

  async addCloseoutItem(projectCode: string, item: Partial<import('../models').ICloseoutItem>): Promise<import('../models').ICloseoutItem> {
    performanceService.startMark('sp:addCloseoutItem');
    const web = this._getProjectWeb();
    const col = CLOSEOUT_ITEMS_COLUMNS;
    const addData = {
      [col.projectCode]: projectCode,
      [col.sectionNumber]: item.sectionNumber || 0,
      [col.sectionName]: item.sectionName || '',
      [col.itemNumber]: item.itemNumber || '',
      [col.label]: item.label || '',
      [col.category]: item.sectionName || item.category || '',
      [col.description]: item.label || item.description || '',
      [col.responseType]: item.responseType || 'yesNoNA',
      [col.response]: item.response ?? null,
      [col.status]: item.status || 'NoResponse',
      [col.assignedTo]: item.assignedTo || '',
      [col.comment]: item.comment || null,
      [col.isHidden]: item.isHidden || false,
      [col.isCustom]: true,
      [col.sortOrder]: item.sortOrder || 0,
      [col.dateValue]: item.dateValue ?? null,
      [col.calculatedFrom]: item.calculatedFrom ?? null,
      [col.placeholder]: item.placeholder ?? null,
      [col.details]: item.details ?? null,
    };
    const spResult = await web.lists.getByTitle('Closeout_Items').items.add(addData);
    performanceService.endMark('sp:addCloseoutItem');
    return this.mapToCloseoutItem(spResult);
  }

  async removeCloseoutItem(_projectCode: string, itemId: number): Promise<void> {
    performanceService.startMark('sp:removeCloseoutItem');
    const web = this._getProjectWeb();
    await web.lists.getByTitle('Closeout_Items').items.getById(itemId).recycle();
    performanceService.endMark('sp:removeCloseoutItem');
  }

  // SP-INDEX-REQUIRED: Loss_Autopsy → LeadID
  async getLossAutopsy(_leadId: number): Promise<import('../models').ILossAutopsy | null> {
    performanceService.startMark('sp:getLossAutopsy');
    const items = await this.sp.web.lists.getByTitle('Loss_Autopsy').items.filter(`LeadID eq ${_leadId}`)();
    performanceService.endMark('sp:getLossAutopsy');
    return items.length > 0 ? items[0] : null;
  }

  async saveLossAutopsy(data: Partial<import('../models').ILossAutopsy>): Promise<import('../models').ILossAutopsy> {
    performanceService.startMark('sp:saveLossAutopsy');
    const result = await this.sp.web.lists.getByTitle('Loss_Autopsy').items.add(data);
    performanceService.endMark('sp:saveLossAutopsy');
    return result as import('../models').ILossAutopsy;
  }

  // SP-INDEX-REQUIRED: Loss_Autopsy → LeadID
  async finalizeLossAutopsy(leadId: number, data: Partial<import('../models').ILossAutopsy>): Promise<import('../models').ILossAutopsy> {
    performanceService.startMark('sp:finalizeLossAutopsy');
    const items = await this.sp.web.lists.getByTitle('Loss_Autopsy').items.filter(`LeadID eq ${leadId}`)();
    if (items.length === 0) throw new Error(`No autopsy found for lead ${leadId}`);
    await this.sp.web.lists.getByTitle('Loss_Autopsy').items.getById(items[0].Id).update({
      ...data,
      isFinalized: true,
      finalizedDate: new Date().toISOString(),
    });
    performanceService.endMark('sp:finalizeLossAutopsy');
    return { ...items[0], ...data, isFinalized: true } as import('../models').ILossAutopsy;
  }

  // SP-INDEX-REQUIRED: Loss_Autopsy → LeadID+isFinalized (compound filter)
  async isAutopsyFinalized(leadId: number): Promise<boolean> {
    performanceService.startMark('sp:isAutopsyFinalized');
    const items = await this.sp.web.lists.getByTitle('Loss_Autopsy').items.filter(`LeadID eq ${leadId} and isFinalized eq 1`)();
    performanceService.endMark('sp:isAutopsyFinalized');
    return items.length > 0;
  }

  // LOAD-TEST: Hub-wide unfiltered query. Expected <200 autopsies. UNBOUNDED — add top(5000) safety.
  async getAllLossAutopsies(): Promise<import('../models').ILossAutopsy[]> {
    performanceService.startMark('sp:getAllLossAutopsies');
    performanceService.endMark('sp:getAllLossAutopsies');
    return await this.sp.web.lists.getByTitle('Loss_Autopsy').items() as import('../models').ILossAutopsy[];
  }

  // --- App Context ---
  // SP-INDEX-REQUIRED: App_Context_Config → SiteURL
  async getAppContextConfig(siteUrl: string): Promise<{
    RenderMode: string; AppTitle: string; VisibleModules: string[] } | null> {
    performanceService.startMark('sp:getAppContextConfig');
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.APP_CONTEXT_CONFIG).items
      .filter(`SiteURL eq '${siteUrl}'`)();
    performanceService.endMark('sp:getAppContextConfig');
    if (items.length === 0) return null;
    return {
      RenderMode: items[0].RenderMode,
      AppTitle: items[0].AppTitle,
      VisibleModules: JSON.parse(items[0].VisibleModules || '[]'),
    };
  }

  // LOAD-TEST: Hub-site reference list. Expected <50 templates. Unbounded.
  async getTemplates(): Promise<Array<{
    TemplateName: string; SourceURL: string; TargetFolder: string; Division: string; Active: boolean }>> {
    performanceService.startMark('sp:getTemplates');
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.TEMPLATE_REGISTRY).items();
    performanceService.endMark('sp:getTemplates');
    return items.map((i: Record<string, unknown>) => ({
      TemplateName: String(i.TemplateName || ''),
      SourceURL: String(i.SourceURL || ''),
      TargetFolder: String(i.TargetFolder || ''),
      Division: String(i.Division || ''),
      Active: Boolean(i.Active),
    }));
  }

  async getRegions(): Promise<string[]> {
    performanceService.startMark('sp:getRegions');
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.REGIONS).items.select('Title')();
    performanceService.endMark('sp:getRegions');
    return items.map((i: Record<string, unknown>) => String(i.Title || ''));
  }

  async getSectors(): Promise<string[]> {
    performanceService.startMark('sp:getSectors');
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.SECTORS).items.select('Title')();
    performanceService.endMark('sp:getSectors');
    return items.map((i: Record<string, unknown>) => String(i.Title || ''));
  }

  // ═══════════════════════════════════════════════════════════════════
  // ──── Startup Checklist (Project Site) ────
  // ═══════════════════════════════════════════════════════════════════

  // SP-INDEX-REQUIRED: Startup_Checklist → ProjectCode, Checklist_Activity_Log → ProjectCode
  // LOAD-TEST: 2 parallel SP calls. Expected <100 checklist items + <500 activity entries per project.
  async getStartupChecklist(projectCode: string): Promise<IStartupChecklistItem[]> {
    performanceService.startMark('sp:getStartupChecklist');
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

    const result = items.map((item: Record<string, unknown>) => this.mapToStartupChecklistItem(item, activityMap.get(item.Id as number)));
    performanceService.endMark('sp:getStartupChecklist');
    return result;
  }

  async getStartupChecklistPage(request: ICursorPageRequest): Promise<ICursorPageResult<IStartupChecklistItem>> {
    const projectCode = request.projectCode ?? String(request.filters?.projectCode ?? '');
    const rows = await this.getStartupChecklist(projectCode);
    return this.paginateArray(rows, request);
  }

  async updateChecklistItem(projectCode: string, itemId: number, data: Partial<IStartupChecklistItem>): Promise<IStartupChecklistItem> {
    performanceService.startMark('sp:updateChecklistItem');
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
    if (data.hbShare !== undefined) updateData[col.hbShare] = data.hbShare;
    if (data.amount !== undefined) updateData[col.amount] = data.amount;
    if (data.period !== undefined) updateData[col.period] = data.period;
    if (data.dateValue !== undefined) updateData[col.dateValue] = data.dateValue;
    if (data.details !== undefined) updateData[col.details] = data.details;
    if (data.placeholder !== undefined) updateData[col.placeholder] = data.placeholder;

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
    const mapped = this.mapToStartupChecklistItem(updated, actItems.map((a: Record<string, unknown>) => this.mapToChecklistActivityEntry(a)));
    performanceService.endMark('sp:updateChecklistItem');
    return mapped;
  }

  async addChecklistItem(projectCode: string, item: Partial<IStartupChecklistItem>): Promise<IStartupChecklistItem> {
    performanceService.startMark('sp:addChecklistItem');
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
      [col.hbShare]: item.hbShare ?? null,
      [col.amount]: item.amount ?? null,
      [col.period]: item.period ?? null,
      [col.dateValue]: item.dateValue ?? null,
      [col.calculatedFrom]: item.calculatedFrom ?? null,
      [col.placeholder]: item.placeholder ?? null,
      [col.details]: item.details ?? null,
    };
    const spResult = await web.lists.getByTitle(LIST_NAMES.STARTUP_CHECKLIST).items.add(addData);
    performanceService.endMark('sp:addChecklistItem');
    return this.mapToStartupChecklistItem(spResult, []);
  }

  async removeChecklistItem(_projectCode: string, itemId: number): Promise<void> {
    performanceService.startMark('sp:removeChecklistItem');
    const web = this._getProjectWeb();
    await web.lists.getByTitle(LIST_NAMES.STARTUP_CHECKLIST).items.getById(itemId).recycle();
    performanceService.endMark('sp:removeChecklistItem');
  }

  // ═══════════════════════════════════════════════════════════════════
  // ──── Internal Matrix (Project Site) ────
  // ═══════════════════════════════════════════════════════════════════

  // SP-INDEX-REQUIRED: Internal_Matrix → ProjectCode
  // LOAD-TEST: Expected <200 tasks per project. Bounded at top(500).
  async getInternalMatrix(projectCode: string): Promise<IInternalMatrixTask[]> {
    performanceService.startMark('sp:getInternalMatrix');
    const web = this._getProjectWeb();
    const col = INTERNAL_MATRIX_COLUMNS;
    const items = await web.lists.getByTitle(LIST_NAMES.INTERNAL_MATRIX).items
      .filter(`${col.projectCode} eq '${projectCode}'`)
      .orderBy(col.sortOrder, true)
      .top(500)();
    performanceService.endMark('sp:getInternalMatrix');
    return items.map((item: Record<string, unknown>) => this.mapToInternalMatrixTask(item));
  }

  async updateInternalMatrixTask(projectCode: string, taskId: number, data: Partial<IInternalMatrixTask>): Promise<IInternalMatrixTask> {
    performanceService.startMark('sp:updateInternalMatrixTask');
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
    performanceService.endMark('sp:updateInternalMatrixTask');
    return this.mapToInternalMatrixTask(updated);
  }

  async addInternalMatrixTask(projectCode: string, task: Partial<IInternalMatrixTask>): Promise<IInternalMatrixTask> {
    performanceService.startMark('sp:addInternalMatrixTask');
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
    performanceService.endMark('sp:addInternalMatrixTask');
    return this.mapToInternalMatrixTask(result);
  }

  async removeInternalMatrixTask(_projectCode: string, taskId: number): Promise<void> {
    performanceService.startMark('sp:removeInternalMatrixTask');
    const web = this._getProjectWeb();
    await web.lists.getByTitle(LIST_NAMES.INTERNAL_MATRIX).items.getById(taskId).recycle();
    performanceService.endMark('sp:removeInternalMatrixTask');
  }

  // ═══════════════════════════════════════════════════════════════════
  // ──── Team Role Assignments (Project Site) ────
  // ═══════════════════════════════════════════════════════════════════

  // SP-INDEX-REQUIRED: Team_Role_Assignments → ProjectCode, RoleAbbreviation (composite for upsert)
  // LOAD-TEST: Expected <30 roles per project. Bounded at top(100).
  async getTeamRoleAssignments(projectCode: string): Promise<ITeamRoleAssignment[]> {
    performanceService.startMark('sp:getTeamRoleAssignments');
    const web = this._getProjectWeb();
    const col = TEAM_ROLE_ASSIGNMENTS_COLUMNS;
    const items = await web.lists.getByTitle(LIST_NAMES.TEAM_ROLE_ASSIGNMENTS).items
      .filter(`${col.projectCode} eq '${projectCode}'`)
      .top(100)();
    performanceService.endMark('sp:getTeamRoleAssignments');
    return items.map((item: Record<string, unknown>) => ({
      projectCode: (item[col.projectCode] as string) || '',
      roleAbbreviation: (item[col.roleAbbreviation] as string) || '',
      assignedPerson: (item[col.assignedPerson] as string) || '',
      assignedPersonEmail: (item[col.assignedPersonEmail] as string) || '',
    }));
  }

  // SP-INDEX-REQUIRED: Team_Role_Assignments → ProjectCode+RoleAbbreviation (compound filter for upsert)
  async updateTeamRoleAssignment(projectCode: string, role: string, person: string, email?: string): Promise<ITeamRoleAssignment> {
    performanceService.startMark('sp:updateTeamRoleAssignment');
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

    performanceService.endMark('sp:updateTeamRoleAssignment');
    return { projectCode, roleAbbreviation: role, assignedPerson: person, assignedPersonEmail: email || '' };
  }

  // ═══════════════════════════════════════════════════════════════════
  // ──── Owner Contract Matrix (Project Site) ────
  // ═══════════════════════════════════════════════════════════════════

  // SP-INDEX-REQUIRED: Owner_Contract_Matrix → ProjectCode
  // LOAD-TEST: Expected <100 articles per project. Bounded at top(500).
  async getOwnerContractMatrix(projectCode: string): Promise<IOwnerContractArticle[]> {
    performanceService.startMark('sp:getOwnerContractMatrix');
    const web = this._getProjectWeb();
    const col = OWNER_CONTRACT_MATRIX_COLUMNS;
    const items = await web.lists.getByTitle(LIST_NAMES.OWNER_CONTRACT_MATRIX).items
      .filter(`${col.projectCode} eq '${projectCode}'`)
      .orderBy(col.sortOrder, true)
      .top(500)();
    performanceService.endMark('sp:getOwnerContractMatrix');
    return items.map((item: Record<string, unknown>) => this.mapToOwnerContractArticle(item));
  }

  async updateOwnerContractArticle(projectCode: string, itemId: number, data: Partial<IOwnerContractArticle>): Promise<IOwnerContractArticle> {
    performanceService.startMark('sp:updateOwnerContractArticle');
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
    performanceService.endMark('sp:updateOwnerContractArticle');
    return this.mapToOwnerContractArticle(updated);
  }

  async addOwnerContractArticle(projectCode: string, item: Partial<IOwnerContractArticle>): Promise<IOwnerContractArticle> {
    performanceService.startMark('sp:addOwnerContractArticle');
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
    performanceService.endMark('sp:addOwnerContractArticle');
    return this.mapToOwnerContractArticle(result);
  }

  async removeOwnerContractArticle(_projectCode: string, itemId: number): Promise<void> {
    performanceService.startMark('sp:removeOwnerContractArticle');
    const web = this._getProjectWeb();
    await web.lists.getByTitle(LIST_NAMES.OWNER_CONTRACT_MATRIX).items.getById(itemId).recycle();
    performanceService.endMark('sp:removeOwnerContractArticle');
  }

  // ═══════════════════════════════════════════════════════════════════
  // ──── Sub-Contract Matrix (Project Site) ────
  // ═══════════════════════════════════════════════════════════════════

  // SP-INDEX-REQUIRED: Sub_Contract_Matrix → ProjectCode
  // LOAD-TEST: Expected 30-150 clauses per project. Bounded at top(500).
  async getSubContractMatrix(projectCode: string): Promise<ISubContractClause[]> {
    performanceService.startMark('sp:getSubContractMatrix');
    const web = this._getProjectWeb();
    const col = SUB_CONTRACT_MATRIX_COLUMNS;
    const items = await web.lists.getByTitle(LIST_NAMES.SUB_CONTRACT_MATRIX).items
      .filter(`${col.projectCode} eq '${projectCode}'`)
      .orderBy(col.sortOrder, true)
      .top(500)();
    performanceService.endMark('sp:getSubContractMatrix');
    return items.map((item: Record<string, unknown>) => this.mapToSubContractClause(item));
  }

  async updateSubContractClause(projectCode: string, itemId: number, data: Partial<ISubContractClause>): Promise<ISubContractClause> {
    performanceService.startMark('sp:updateSubContractClause');
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
    performanceService.endMark('sp:updateSubContractClause');
    return this.mapToSubContractClause(updated);
  }

  async addSubContractClause(projectCode: string, item: Partial<ISubContractClause>): Promise<ISubContractClause> {
    performanceService.startMark('sp:addSubContractClause');
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
    performanceService.endMark('sp:addSubContractClause');
    return this.mapToSubContractClause(result);
  }

  async removeSubContractClause(_projectCode: string, itemId: number): Promise<void> {
    performanceService.startMark('sp:removeSubContractClause');
    const web = this._getProjectWeb();
    await web.lists.getByTitle(LIST_NAMES.SUB_CONTRACT_MATRIX).items.getById(itemId).recycle();
    performanceService.endMark('sp:removeSubContractClause');
  }

  // ═══════════════════════════════════════════════════════════════════
  // ──── Marketing Project Records (Hub Site) ────
  // ═══════════════════════════════════════════════════════════════════

  // SP-INDEX-REQUIRED: Marketing_Project_Records → ProjectCode
  // LOAD-TEST: Single-item lookup via filter+top(1). Fast if indexed.
  async getMarketingProjectRecord(projectCode: string): Promise<IMarketingProjectRecord | null> {
    performanceService.startMark('sp:getMarketingProjectRecord');
    const col = MARKETING_PROJECT_RECORDS_COLUMNS;
    try {
      const items = await this.sp.web.lists.getByTitle(LIST_NAMES.MARKETING_PROJECT_RECORDS).items
        .filter(`${col.projectCode} eq '${projectCode}'`)
        .top(1)();
      if (items.length === 0) return null;
      return this.mapToMarketingProjectRecord(items[0]);
    } catch {
    performanceService.endMark('sp:getMarketingProjectRecord');
      return null;
    }
  }

  async createMarketingProjectRecord(data: Partial<IMarketingProjectRecord>): Promise<IMarketingProjectRecord> {
    performanceService.startMark('sp:createMarketingProjectRecord');
    const addData = this.buildMarketingUpdateData(data);
    const result = await this.sp.web.lists.getByTitle(LIST_NAMES.MARKETING_PROJECT_RECORDS).items.add(addData);
    performanceService.endMark('sp:createMarketingProjectRecord');
    return this.mapToMarketingProjectRecord(result);
  }

  // SP-INDEX-REQUIRED: Marketing_Project_Records → ProjectCode
  async updateMarketingProjectRecord(projectCode: string, data: Partial<IMarketingProjectRecord>): Promise<IMarketingProjectRecord> {
    performanceService.startMark('sp:updateMarketingProjectRecord');
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
    performanceService.endMark('sp:updateMarketingProjectRecord');
    return this.mapToMarketingProjectRecord(updated);
  }

  // LOAD-TEST: Hub-wide unfiltered query. Expected 500+ records over time. Bounded at top(500). Consider paging at scale.
  async getAllMarketingProjectRecords(): Promise<IMarketingProjectRecord[]> {
    performanceService.startMark('sp:getAllMarketingProjectRecords');
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.MARKETING_PROJECT_RECORDS).items
      .top(500)();
    performanceService.endMark('sp:getAllMarketingProjectRecords');
    return items.map((item: Record<string, unknown>) => this.mapToMarketingProjectRecord(item));
  }

  // --- Risk & Cost ---

  // SP-INDEX-REQUIRED: Risk_Cost_Management → ProjectCode, Risk_Cost_Items → ProjectCode
  // LOAD-TEST: 2 parallel SP calls. Expected <50 risk items per project.
  async getRiskCostManagement(projectCode: string): Promise<IRiskCostManagement | null> {
    performanceService.startMark('sp:getRiskCostManagement');
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

    performanceService.endMark('sp:getRiskCostManagement');
    return {
      ...parent,
      buyoutOpportunities: mappedItems.filter((i: IRiskCostItem) => i.category === 'Buyout'),
      potentialRisks: mappedItems.filter((i: IRiskCostItem) => i.category === 'Risk'),
      potentialSavings: mappedItems.filter((i: IRiskCostItem) => i.category === 'Savings'),
    };
  }

  // SP-INDEX-REQUIRED: Risk_Cost_Management → ProjectCode
  async updateRiskCostManagement(projectCode: string, data: Partial<IRiskCostManagement>): Promise<IRiskCostManagement> {
    performanceService.startMark('sp:updateRiskCostManagement');
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
    performanceService.endMark('sp:updateRiskCostManagement');
    return (await this.getRiskCostManagement(projectCode))!;
  }

  // SP-INDEX-REQUIRED: Risk_Cost_Management → ProjectCode (parent lookup)
  async addRiskCostItem(projectCode: string, item: Partial<IRiskCostItem>): Promise<IRiskCostItem> {
    performanceService.startMark('sp:addRiskCostItem');
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
    performanceService.endMark('sp:addRiskCostItem');
    return this.mapToRiskCostItem(result.data);
  }

  async updateRiskCostItem(projectCode: string, itemId: number, data: Partial<IRiskCostItem>): Promise<IRiskCostItem> {
    performanceService.startMark('sp:updateRiskCostItem');
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
    performanceService.endMark('sp:updateRiskCostItem');
    return this.mapToRiskCostItem(updated);
  }

  // --- Quality Concerns ---

  // SP-INDEX-REQUIRED: Quality_Concerns → ProjectCode
  // LOAD-TEST: Expected <30 concerns per project. Bounded at top(500).
  async getQualityConcerns(projectCode: string): Promise<IQualityConcern[]> {
    performanceService.startMark('sp:getQualityConcerns');
    const web = this._getProjectWeb();
    const col = QUALITY_CONCERNS_COLUMNS;

    const items = await web.lists.getByTitle(LIST_NAMES.QUALITY_CONCERNS).items
      .filter(`${col.projectCode} eq '${projectCode}'`)
      .orderBy(col.letter, true)
      .top(500)();

    performanceService.endMark('sp:getQualityConcerns');
    return items.map((item: Record<string, unknown>) => this.mapToQualityConcern(item));
  }

  async addQualityConcern(projectCode: string, concern: Partial<IQualityConcern>): Promise<IQualityConcern> {
    performanceService.startMark('sp:addQualityConcern');
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
    performanceService.endMark('sp:addQualityConcern');
    return this.mapToQualityConcern(result.data);
  }

  async updateQualityConcern(projectCode: string, concernId: number, data: Partial<IQualityConcern>): Promise<IQualityConcern> {
    performanceService.startMark('sp:updateQualityConcern');
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
    performanceService.endMark('sp:updateQualityConcern');
    return this.mapToQualityConcern(updated);
  }

  // --- Safety Concerns ---

  // SP-INDEX-REQUIRED: Safety_Concerns → ProjectCode
  // LOAD-TEST: Expected <30 concerns per project. Bounded at top(500).
  async getSafetyConcerns(projectCode: string): Promise<ISafetyConcern[]> {
    performanceService.startMark('sp:getSafetyConcerns');
    const web = this._getProjectWeb();
    const col = SAFETY_CONCERNS_COLUMNS;

    const items = await web.lists.getByTitle(LIST_NAMES.SAFETY_CONCERNS).items
      .filter(`${col.projectCode} eq '${projectCode}'`)
      .orderBy(col.letter, true)
      .top(500)();

    performanceService.endMark('sp:getSafetyConcerns');
    return items.map((item: Record<string, unknown>) => this.mapToSafetyConcern(item));
  }

  async addSafetyConcern(projectCode: string, concern: Partial<ISafetyConcern>): Promise<ISafetyConcern> {
    performanceService.startMark('sp:addSafetyConcern');
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
    performanceService.endMark('sp:addSafetyConcern');
    return this.mapToSafetyConcern(result.data);
  }

  async updateSafetyConcern(projectCode: string, concernId: number, data: Partial<ISafetyConcern>): Promise<ISafetyConcern> {
    performanceService.startMark('sp:updateSafetyConcern');
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
    performanceService.endMark('sp:updateSafetyConcern');
    return this.mapToSafetyConcern(updated);
  }

  // --- Schedule & Critical Path ---

  // SP-INDEX-REQUIRED: Project_Schedule → ProjectCode, Critical_Path_Items → ProjectCode
  // LOAD-TEST: 2 parallel SP calls. Expected 5-20 critical path items per project.
  async getProjectSchedule(projectCode: string): Promise<IProjectScheduleCriticalPath | null> {
    performanceService.startMark('sp:getProjectSchedule');
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
    performanceService.endMark('sp:getProjectSchedule');
    return {
      ...schedule,
      criticalPathConcerns: items.map((i: Record<string, unknown>) => this.mapToCriticalPathItem(i)),
    };
  }

  // SP-INDEX-REQUIRED: Project_Schedule → ProjectCode
  async updateProjectSchedule(projectCode: string, data: Partial<IProjectScheduleCriticalPath>): Promise<IProjectScheduleCriticalPath> {
    performanceService.startMark('sp:updateProjectSchedule');
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

    performanceService.endMark('sp:updateProjectSchedule');
    return (await this.getProjectSchedule(projectCode))!;
  }

  // SP-INDEX-REQUIRED: Project_Schedule → ProjectCode (parent lookup)
  async addCriticalPathItem(projectCode: string, item: Partial<ICriticalPathItem>): Promise<ICriticalPathItem> {
    performanceService.startMark('sp:addCriticalPathItem');
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
    performanceService.endMark('sp:addCriticalPathItem');
    return this.mapToCriticalPathItem(result.data);
  }

  // --- Superintendent Plan ---

  // SP-INDEX-REQUIRED: Superintendent_Plan → ProjectCode, Superintendent_Plan_Sections → SuperintendentPlanId
  // LOAD-TEST: 2 sequential SP calls. Expected 8-15 sections per plan.
  async getSuperintendentPlan(projectCode: string): Promise<ISuperintendentPlan | null> {
    performanceService.startMark('sp:getSuperintendentPlan');
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

    performanceService.endMark('sp:getSuperintendentPlan');
    return {
      ...plan,
      sections: sections.map((s: Record<string, unknown>) => this.mapToSuperintendentPlanSection(s)),
    };
  }

  // SP-INDEX-REQUIRED: Superintendent_Plan → ProjectCode (parent status update)
  async updateSuperintendentPlanSection(projectCode: string, sectionId: number, data: Partial<ISuperintendentPlanSection>): Promise<ISuperintendentPlanSection> {
    performanceService.startMark('sp:updateSuperintendentPlanSection');
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
    performanceService.endMark('sp:updateSuperintendentPlanSection');
    return this.mapToSuperintendentPlanSection(updated);
  }

  async createSuperintendentPlan(projectCode: string, data: Partial<ISuperintendentPlan>): Promise<ISuperintendentPlan> {
    performanceService.startMark('sp:createSuperintendentPlan');
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
    performanceService.endMark('sp:createSuperintendentPlan');
    return (await this.getSuperintendentPlan(projectCode))!;
  }

  // --- Lessons Learned ---

  // SP-INDEX-REQUIRED: Lessons_Learned → ProjectCode
  // LOAD-TEST: Expected 10-50 lessons per project. Bounded at top(500).
  async getLessonsLearned(projectCode: string): Promise<ILessonLearned[]> {
    performanceService.startMark('sp:getLessonsLearned');
    const web = this._getProjectWeb();
    const col = LESSONS_LEARNED_COLUMNS;

    const items = await web.lists.getByTitle(LIST_NAMES.LESSONS_LEARNED).items
      .filter(`${col.projectCode} eq '${projectCode}'`)
      .top(500)();

    performanceService.endMark('sp:getLessonsLearned');
    return items.map((item: Record<string, unknown>) => this.mapToLessonLearned(item));
  }

  async addLessonLearned(projectCode: string, lesson: Partial<ILessonLearned>): Promise<ILessonLearned> {
    performanceService.startMark('sp:addLessonLearned');
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
    performanceService.endMark('sp:addLessonLearned');
    return this.mapToLessonLearned(result.data);
  }

  async updateLessonLearned(projectCode: string, lessonId: number, data: Partial<ILessonLearned>): Promise<ILessonLearned> {
    performanceService.startMark('sp:updateLessonLearned');
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
    performanceService.endMark('sp:updateLessonLearned');
    return this.mapToLessonLearned(updated);
  }

  // --- Project Management Plan ---

  // SP-INDEX-REQUIRED: PMP → ProjectCode, PMP_Signatures → PmpId, PMP_Approval_Cycles → PmpId, PMP_Approval_Steps → ProjectCode
  // LOAD-TEST: 4 parallel SP calls (parent + 3 child lists). Expected <10 cycles, <20 steps, <10 signatures per PMP.
  async getProjectManagementPlan(projectCode: string): Promise<IProjectManagementPlan | null> {
    performanceService.startMark('sp:getProjectManagementPlan');
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

    performanceService.endMark('sp:getProjectManagementPlan');
    return this.assemblePMPFromParts(pmp, signatures, cycles, steps);
  }

  // SP-INDEX-REQUIRED: PMP → ProjectCode
  async updateProjectManagementPlan(projectCode: string, data: Partial<IProjectManagementPlan>): Promise<IProjectManagementPlan> {
    performanceService.startMark('sp:updateProjectManagementPlan');
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
    performanceService.endMark('sp:updateProjectManagementPlan');
    return result;
  }

  // SP-INDEX-REQUIRED: PMP → ProjectCode
  // LOAD-TEST: 5-6 SP calls: read PMP, read approvers, create cycle, create 1-2 steps, update PMP.
  async submitPMPForApproval(projectCode: string, submittedBy: string): Promise<IProjectManagementPlan> {
    performanceService.startMark('sp:submitPMPForApproval');
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
    performanceService.endMark('sp:submitPMPForApproval');
    return result;
  }

  // SP-INDEX-REQUIRED: PMP → ProjectCode, PMP_Approval_Steps → ApprovalCycleId
  // LOAD-TEST: 5-7 SP calls: read PMP, read step, update step, read cycle steps, update cycle, update PMP, re-read.
  async respondToPMPApproval(projectCode: string, stepId: number, approved: boolean, comment: string): Promise<IProjectManagementPlan> {
    performanceService.startMark('sp:respondToPMPApproval');
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
    performanceService.endMark('sp:respondToPMPApproval');
    return result;
  }

  // SP-INDEX-REQUIRED: PMP → ProjectCode, PMP_Signatures → PmpId
  async signPMP(projectCode: string, signatureId: number, comment: string): Promise<IProjectManagementPlan> {
    performanceService.startMark('sp:signPMP');
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
    performanceService.endMark('sp:signPMP');
    return result;
  }

  // LOAD-TEST: Hub-site reference list. Expected <20 division approvers. Bounded at top(100).
  async getDivisionApprovers(): Promise<IDivisionApprover[]> {
    performanceService.startMark('sp:getDivisionApprovers');
    // Hub-site list — use this.sp.web, NOT _getProjectWeb()
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.DIVISION_APPROVERS).items
      .top(100)();
    performanceService.endMark('sp:getDivisionApprovers');
    return items.map((item: Record<string, unknown>) => this.mapToDivisionApprover(item));
  }

  // LOAD-TEST: Hub-site reference list. Expected <50 boilerplate sections. Bounded at top(100).
  async getPMPBoilerplate(): Promise<IPMPBoilerplateSection[]> {
    performanceService.startMark('sp:getPMPBoilerplate');
    // Hub-site list — use this.sp.web, NOT _getProjectWeb()
    const col = PMP_BOILERPLATE_COLUMNS;
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.PMP_BOILERPLATE).items
      .orderBy(col.sectionNumber, true)
      .top(100)();
    performanceService.endMark('sp:getPMPBoilerplate');
    return items.map((item: Record<string, unknown>) => this.mapToPMPBoilerplateSection(item));
  }

  // --- Monthly Review ---

  // SP-INDEX-REQUIRED: Monthly_Reviews → ProjectCode, Monthly_Checklist_Items → ReviewId, Monthly_Follow_Ups → ReviewId
  // LOAD-TEST: 3 SP calls (parent + 2 child OR-filters). Expected <12 reviews per project per year. Child items can grow large.
  async getMonthlyReviews(projectCode: string): Promise<IMonthlyProjectReview[]> {
    performanceService.startMark('sp:getMonthlyReviews');
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
    performanceService.endMark('sp:getMonthlyReviews');
  }

  // SP-INDEX-REQUIRED: Monthly_Checklist_Items → ReviewId, Monthly_Follow_Ups → ReviewId
  // LOAD-TEST: 3 SP calls (parent by ID + 2 child filters). Expected <100 checklist items + <20 follow-ups per review.
  async getMonthlyReview(reviewId: number): Promise<IMonthlyProjectReview | null> {
    performanceService.startMark('sp:getMonthlyReview');
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

    performanceService.endMark('sp:getMonthlyReview');
    return this.assembleMonthlyReview(review, mappedChecklist, mappedFollowUps);
  }

  // SP-INDEX-REQUIRED: Monthly_Checklist_Items → ReviewId, Monthly_Follow_Ups → ReviewId
  // LOAD-TEST: N+1 for child re-creation: delete-all + serial add. At 100 checklist items, this is 200+ SP calls. Consider batching.
  async updateMonthlyReview(reviewId: number, data: Partial<IMonthlyProjectReview>): Promise<IMonthlyProjectReview> {
    performanceService.startMark('sp:updateMonthlyReview');
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
    performanceService.endMark('sp:updateMonthlyReview');
    return result;
  }

  // LOAD-TEST: N+1 for child creation: serial add for checklist items + follow-ups. Consider batching at scale.
  async createMonthlyReview(data: Partial<IMonthlyProjectReview>): Promise<IMonthlyProjectReview> {
    performanceService.startMark('sp:createMonthlyReview');
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
    performanceService.endMark('sp:createMonthlyReview');
    return result;
  }

  // --- Estimating Kick-Off ---

  // SP-INDEX-REQUIRED: Estimating_Kickoffs → ProjectCode, Estimating_Kickoff_Items → KickoffId
  // LOAD-TEST: 2 SP calls per kickoff (parent + items). Items expected <50 per kickoff.
  async getEstimatingKickoff(projectCode: string): Promise<IEstimatingKickoff | null> {
    performanceService.startMark('sp:getEstimatingKickoff');
    const col = ESTIMATING_KICKOFFS_COLUMNS;
    const itemCol = ESTIMATING_KICKOFF_ITEMS_COLUMNS;

    try {
      const parents = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFFS).items
        .filter(`${col.ProjectCode} eq '${projectCode}'`)
        .top(1)();
      if (!parents || parents.length === 0) {
        performanceService.endMark('sp:getEstimatingKickoff');
        return null;
      }

      const parent = this.mapToEstimatingKickoff(parents[0]);

      const childItems = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFF_ITEMS).items
        .filter(`${itemCol.kickoffId} eq ${parent.id}`)
        .orderBy(itemCol.sortOrder, true)
        .top(500)();

      parent.items = childItems.map((i: Record<string, unknown>) => this.mapToEstimatingKickoffItem(i));
      performanceService.endMark('sp:getEstimatingKickoff');
      return parent;
    } catch (err) {
      performanceService.endMark('sp:getEstimatingKickoff');
      throw this.handleError('getEstimatingKickoff', err, { entityType: 'EstimatingKickoff', entityId: projectCode });
    }
  }

  // SP-INDEX-REQUIRED: Estimating_Kickoffs → LeadID
  async getEstimatingKickoffByLeadId(leadId: number): Promise<IEstimatingKickoff | null> {
    performanceService.startMark('sp:getEstimatingKickoffByLeadId');
    const col = ESTIMATING_KICKOFFS_COLUMNS;
    const itemCol = ESTIMATING_KICKOFF_ITEMS_COLUMNS;

    try {
      const parents = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFFS).items
        .filter(`${col.LeadID} eq ${leadId}`)
        .top(1)();
      if (!parents || parents.length === 0) {
        performanceService.endMark('sp:getEstimatingKickoffByLeadId');
        return null;
      }

      const parent = this.mapToEstimatingKickoff(parents[0]);

      const childItems = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFF_ITEMS).items
        .filter(`${itemCol.kickoffId} eq ${parent.id}`)
        .orderBy(itemCol.sortOrder, true)
        .top(500)();

      parent.items = childItems.map((i: Record<string, unknown>) => this.mapToEstimatingKickoffItem(i));
      performanceService.endMark('sp:getEstimatingKickoffByLeadId');
      return parent;
    } catch (err) {
      performanceService.endMark('sp:getEstimatingKickoffByLeadId');
      throw this.handleError('getEstimatingKickoffByLeadId', err, { entityType: 'EstimatingKickoff' });
    }
  }

  // LOAD-TEST: N+1 for child items — serial add. Expected <50 items per kickoff, acceptable.
  async createEstimatingKickoff(data: Partial<IEstimatingKickoff>): Promise<IEstimatingKickoff> {
    performanceService.startMark('sp:createEstimatingKickoff');
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
    const assembled = (await this.getEstimatingKickoff(data.ProjectCode ?? ''))!;
    performanceService.endMark('sp:createEstimatingKickoff');
    return assembled;
  }

  async updateEstimatingKickoff(id: number, data: Partial<IEstimatingKickoff>): Promise<IEstimatingKickoff> {
    performanceService.startMark('sp:updateEstimatingKickoff');
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
    const result = (await this.getEstimatingKickoff(projectCode))!;
    performanceService.endMark('sp:updateEstimatingKickoff');
    return result;
  }

  async updateKickoffItem(kickoffId: number, itemId: number, data: Partial<IEstimatingKickoffItem>): Promise<IEstimatingKickoffItem> {
    performanceService.startMark('sp:updateKickoffItem');
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
    performanceService.endMark('sp:updateKickoffItem');
    return this.mapToEstimatingKickoffItem(updated);
  }

  async addKickoffItem(kickoffId: number, item: Partial<IEstimatingKickoffItem>): Promise<IEstimatingKickoffItem> {
    performanceService.startMark('sp:addKickoffItem');
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
    performanceService.endMark('sp:addKickoffItem');
    return this.mapToEstimatingKickoffItem(created);
  }

  async removeKickoffItem(kickoffId: number, itemId: number): Promise<void> {
    performanceService.startMark('sp:removeKickoffItem');
    const parentCol = ESTIMATING_KICKOFFS_COLUMNS;

    await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFF_ITEMS).items.getById(itemId).recycle();

    // Update parent ModifiedDate
    await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFFS).items.getById(kickoffId).update({
      [parentCol.ModifiedDate]: new Date().toISOString(),
    });
    performanceService.endMark('sp:removeKickoffItem');
  }

  async updateKickoffKeyPersonnel(kickoffId: number, personnel: IKeyPersonnelEntry[]): Promise<IEstimatingKickoff> {
    performanceService.startMark('sp:updateKickoffKeyPersonnel');
    const col = ESTIMATING_KICKOFFS_COLUMNS;
    const now = new Date().toISOString();

    await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFFS).items.getById(kickoffId).update({
      [col.KeyPersonnel]: JSON.stringify(personnel),
      [col.ModifiedDate]: now,
    });

    // Re-read and assemble
    const updated = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_KICKOFFS).items.getById(kickoffId)();
    const projectCode = (updated as Record<string, unknown>)[col.ProjectCode] as string || '';
    const result = (await this.getEstimatingKickoff(projectCode))!;
    performanceService.endMark('sp:updateKickoffKeyPersonnel');
    return result;
  }

  // --- Job Number Requests ---

  // SP-INDEX-REQUIRED: Job_Number_Requests → RequestStatus
  async getJobNumberRequests(status?: JobNumberRequestStatus): Promise<IJobNumberRequest[]> {
    performanceService.startMark('sp:getJobNumberRequests');
    try {
      const col = JOB_NUMBER_REQUESTS_COLUMNS;
      let query = this.sp.web.lists.getByTitle(LIST_NAMES.JOB_NUMBER_REQUESTS).items;
      if (status) {
        query = query.filter(`${col.RequestStatus} eq '${status}'`);
      }
      const items = await query.orderBy(col.RequestDate, false).top(500)();
      performanceService.endMark('sp:getJobNumberRequests');
      return items.map((item: Record<string, unknown>) => this.mapToJobNumberRequest(item));
    } catch (err) {
      performanceService.endMark('sp:getJobNumberRequests');
      throw this.handleError('getJobNumberRequests', err, { entityType: 'JobNumberRequest' });
    }
  }

  // SP-INDEX-REQUIRED: Job_Number_Requests → LeadID
  async getJobNumberRequestByLeadId(leadId: number): Promise<IJobNumberRequest | null> {
    performanceService.startMark('sp:getJobNumberRequestByLeadId');
    try {
      const col = JOB_NUMBER_REQUESTS_COLUMNS;
      const items = await this.sp.web.lists.getByTitle(LIST_NAMES.JOB_NUMBER_REQUESTS).items
        .filter(`${col.LeadID} eq ${leadId}`)
        .orderBy(col.RequestDate, false)
        .top(1)();
      performanceService.endMark('sp:getJobNumberRequestByLeadId');
      if (!items || items.length === 0) return null;
      return this.mapToJobNumberRequest(items[0]);
    } catch (err) {
      performanceService.endMark('sp:getJobNumberRequestByLeadId');
      throw this.handleError('getJobNumberRequestByLeadId', err, { entityType: 'JobNumberRequest' });
    }
  }

  async createJobNumberRequest(data: Partial<IJobNumberRequest>): Promise<IJobNumberRequest> {
    performanceService.startMark('sp:createJobNumberRequest');
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
    performanceService.endMark('sp:createJobNumberRequest');
    return this.mapToJobNumberRequest(created);
  }

  async finalizeJobNumber(requestId: number, jobNumber: string, assignedBy: string): Promise<IJobNumberRequest> {
    performanceService.startMark('sp:finalizeJobNumber');
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
    performanceService.endMark('sp:finalizeJobNumber');
    return this.mapToJobNumberRequest(updated);
  }

  // --- Reference Data ---

  async getProjectTypes(): Promise<IProjectType[]> {
    performanceService.startMark('sp:getProjectTypes');
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.PROJECT_TYPES).items.top(500)();
    performanceService.endMark('sp:getProjectTypes');
    return items.map((item: Record<string, unknown>) => this.mapToProjectType(item));
  }

  async getStandardCostCodes(): Promise<IStandardCostCode[]> {
    performanceService.startMark('sp:getStandardCostCodes');
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.STANDARD_COST_CODES).items.top(500)();
    performanceService.endMark('sp:getStandardCostCodes');
    return items.map((item: Record<string, unknown>) => this.mapToStandardCostCode(item));
  }

  // --- Buyout Log ---

  // SP-INDEX-REQUIRED: Buyout_Log → ProjectCode (CRITICAL — unbounded query, add top(5000) safety)
  // LOAD-TEST: Expected 30-50 divisions per project. Currently UNBOUNDED — add top(5000).
  async getBuyoutEntries(projectCode: string): Promise<IBuyoutEntry[]> {
    performanceService.startMark('sp:getBuyoutEntries');
    const items = await this.sp.web.lists
      .getByTitle(LIST_NAMES.BUYOUT_LOG)
      .items
      .filter(`ProjectCode eq '${projectCode}'`)
      .orderBy('Title', true)();
    performanceService.endMark('sp:getBuyoutEntries');
    return items.map((item: Record<string, unknown>) => this.mapToBuyoutEntry(item));
  }

  async getBuyoutEntriesPage(request: ICursorPageRequest): Promise<ICursorPageResult<IBuyoutEntry>> {
    const projectCode = request.projectCode ?? String(request.filters?.projectCode ?? '');
    const rows = await this.getBuyoutEntries(projectCode);
    return this.paginateArray(rows, request);
  }

  // LOAD-TEST: Batch-adds standard CSI divisions. Calls getBuyoutEntries first to check existing.
  async initializeBuyoutLog(projectCode: string): Promise<IBuyoutEntry[]> {
    performanceService.startMark('sp:initializeBuyoutLog');
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
    performanceService.endMark('sp:initializeBuyoutLog');
    return this.getBuyoutEntries(projectCode);
  }

  async addBuyoutEntry(projectCode: string, entry: Partial<IBuyoutEntry>): Promise<IBuyoutEntry> {
    performanceService.startMark('sp:addBuyoutEntry');
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

    performanceService.endMark('sp:addBuyoutEntry');
    return this.mapToBuyoutEntry(result.data);
  }

  async updateBuyoutEntry(projectCode: string, entryId: number, data: Partial<IBuyoutEntry>): Promise<IBuyoutEntry> {
    performanceService.startMark('sp:updateBuyoutEntry');
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

    performanceService.endMark('sp:updateBuyoutEntry');
    return this.mapToBuyoutEntry(updated);
  }

  async removeBuyoutEntry(_projectCode: string, entryId: number): Promise<void> {
    performanceService.startMark('sp:removeBuyoutEntry');
    await this.sp.web.lists
      .getByTitle(LIST_NAMES.BUYOUT_LOG)
      .items
      .getById(entryId)
      .delete();
    performanceService.endMark('sp:removeBuyoutEntry');
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
      contractTrackingStatus: (item.ContractTrackingStatus as ContractTrackingStatus) || undefined,
      currentContractTrackingStep: item.CurrentContractTrackingStep as ContractTrackingStep | undefined,
      contractTrackingHistory: [],
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

  // LOAD-TEST: Multi-step workflow: getBuyoutEntries + create approval + update entry. 3-4 SP calls.
  async submitCommitmentForApproval(projectCode: string, entryId: number, _submittedBy: string): Promise<IBuyoutEntry> {
    performanceService.startMark('sp:submitCommitmentForApproval');
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

    performanceService.endMark('sp:submitCommitmentForApproval');
    return (await this.getBuyoutEntries(projectCode)).find(e => e.id === entryId) as IBuyoutEntry;
  }

  // LOAD-TEST: Multi-step: getHistory + update approval + update entry. 3-4 SP calls.
  async respondToCommitmentApproval(projectCode: string, entryId: number, approved: boolean, comment: string, escalate?: boolean): Promise<IBuyoutEntry> {
    performanceService.startMark('sp:respondToCommitmentApproval');
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
    performanceService.endMark('sp:respondToCommitmentApproval');
    return (await this.getBuyoutEntries(projectCode)).find(e => e.id === entryId) as IBuyoutEntry;
  }

  // SP-INDEX-REQUIRED: Commitment_Approvals → ProjectCode+BuyoutEntryId (compound filter, UNBOUNDED)
  // LOAD-TEST: Expected 3-10 approval steps per entry. Currently UNBOUNDED — add top(500).
  async getCommitmentApprovalHistory(projectCode: string, entryId: number): Promise<ICommitmentApproval[]> {
    performanceService.startMark('sp:getCommitmentApprovalHistory');
    const items = await this.sp.web.lists
      .getByTitle(LIST_NAMES.COMMITMENT_APPROVALS)
      .items
      .filter(`ProjectCode eq '${projectCode}' and BuyoutEntryId eq ${entryId}`)
      .orderBy('Id', true)();

    performanceService.endMark('sp:getCommitmentApprovalHistory');
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

  // --- Contract Tracking Workflow ---

  private static readonly TRACKING_STEP_ORDER: ContractTrackingStep[] = ['APM_PA', 'ProjectManager', 'RiskManager', 'ProjectExecutive'];
  private static readonly TRACKING_STEP_STATUS: Record<ContractTrackingStep, ContractTrackingStatus> = {
    APM_PA: 'PendingAPM', ProjectManager: 'PendingPM', RiskManager: 'PendingRiskMgr', ProjectExecutive: 'PendingPX',
  };

  private static readonly TRACKING_STEP_TO_ORDER: Record<ContractTrackingStep, number> = {
    APM_PA: 1, ProjectManager: 2, RiskManager: 3, ProjectExecutive: 4,
  };

  private getNextTrackingStep(current: ContractTrackingStep): ContractTrackingStep | null {
    const steps = SharePointDataService.TRACKING_STEP_ORDER;
    const idx = steps.indexOf(current);
    return idx < steps.length - 1 ? steps[idx + 1] : null;
  }

  private resolveTrackingStepApprover(
    chain: IResolvedWorkflowStep[],
    step: ContractTrackingStep
  ): { name: string; email: string } {
    const stepOrder = SharePointDataService.TRACKING_STEP_TO_ORDER[step];
    const resolved = chain.find(s => s.stepOrder === stepOrder);
    if (resolved?.assignee?.email) {
      return { name: resolved.assignee.displayName, email: resolved.assignee.email };
    }
    return { name: 'Approver', email: '' }; // fallback
  }

  // LOAD-TEST: Multi-step workflow: getBuyoutEntries + resolve chain + create approval + update entry. 3-5 SP calls.
  async submitContractTracking(projectCode: string, entryId: number, _submittedBy: string): Promise<IBuyoutEntry> {
    performanceService.startMark('sp:submitContractTracking');
    const entry = (await this.getBuyoutEntries(projectCode)).find(e => e.id === entryId);
    if (!entry) throw new Error(`Buyout entry ${entryId} not found`);

    let firstStep: ContractTrackingStep = 'APM_PA';
    let chain: IResolvedWorkflowStep[] | null = null;
    try {
      chain = await this.resolveWorkflowChain(WorkflowKey.CONTRACT_TRACKING, projectCode);
      const apmStep = chain.find(s => s.stepOrder === 1);
      if (apmStep?.skipped) {
        firstStep = 'ProjectManager';
        // Create Skipped record for APM_PA
        await this._getProjectWeb().lists.getByTitle(LIST_NAMES.CONTRACT_TRACKING_APPROVALS).items.add({
          BuyoutEntryId: entryId, ProjectCode: projectCode, Step: 'APM_PA',
          ApproverName: apmStep.assignee?.displayName ?? 'APM/PA', ApproverEmail: apmStep.assignee?.email ?? '',
          Status: 'Skipped', ActionDate: new Date().toISOString(), SkippedReason: 'No APM/PA assigned for this project',
        });
      }
    } catch { /* default to APM_PA */ }

    // Create the first Pending record with resolved assignee
    const approver = chain
      ? this.resolveTrackingStepApprover(chain, firstStep)
      : { name: 'Approver', email: '' };
    await this._getProjectWeb().lists.getByTitle(LIST_NAMES.CONTRACT_TRACKING_APPROVALS).items.add({
      BuyoutEntryId: entryId, ProjectCode: projectCode, Step: firstStep,
      ApproverName: approver.name, ApproverEmail: approver.email, Status: 'Pending',
    });

    // Update buyout entry
    await this._getProjectWeb().lists.getByTitle(LIST_NAMES.BUYOUT_LOG).items.getById(entryId).update({
      ContractTrackingStatus: SharePointDataService.TRACKING_STEP_STATUS[firstStep],
      CurrentContractTrackingStep: firstStep,
    });

    this.logAudit({ Action: AuditAction.ContractTrackingSubmitted, EntityType: EntityType.ContractTracking, EntityId: String(entryId), Details: `Contract tracking submitted for ${entry.divisionDescription}` });
    performanceService.endMark('sp:submitContractTracking');
    return (await this.getBuyoutEntries(projectCode)).find(e => e.id === entryId) as IBuyoutEntry;
  }

  // LOAD-TEST: Multi-step: getHistory + update approval + update entry. 3-4 SP calls.
  async respondToContractTracking(projectCode: string, entryId: number, approved: boolean, comment: string): Promise<IBuyoutEntry> {
    performanceService.startMark('sp:respondToContractTracking');
    const approvals = await this.getContractTrackingHistory(projectCode, entryId);
    const pending = approvals.find(a => a.status === 'Pending');
    if (!pending) throw new Error('No pending contract tracking step found');

    await this._getProjectWeb().lists.getByTitle(LIST_NAMES.CONTRACT_TRACKING_APPROVALS)
      .items.getById(pending.id).update({
        Status: approved ? 'Approved' : 'Rejected',
        Comment: comment,
        ActionDate: new Date().toISOString(),
      });

    let newStatus: ContractTrackingStatus;
    let nextStep: ContractTrackingStep | undefined;

    if (!approved) {
      newStatus = 'Rejected';
      nextStep = undefined;
      this.logAudit({ Action: AuditAction.ContractTrackingRejected, EntityType: EntityType.ContractTracking, EntityId: String(entryId), Details: `Contract tracking rejected at ${pending.step}` });
    } else {
      const next = this.getNextTrackingStep(pending.step);
      if (next) {
        newStatus = SharePointDataService.TRACKING_STEP_STATUS[next];
        nextStep = next;
        // Resolve chain to get the correct assignee for the next step
        let approver = { name: 'Approver', email: '' };
        try {
          const chain = await this.resolveWorkflowChain(WorkflowKey.CONTRACT_TRACKING, projectCode);
          approver = this.resolveTrackingStepApprover(chain, next);
        } catch { /* fallback */ }
        await this._getProjectWeb().lists.getByTitle(LIST_NAMES.CONTRACT_TRACKING_APPROVALS).items.add({
          BuyoutEntryId: entryId, ProjectCode: projectCode, Step: next,
          ApproverName: approver.name, ApproverEmail: approver.email, Status: 'Pending',
        });
        this.logAudit({ Action: AuditAction.ContractTrackingApproved, EntityType: EntityType.ContractTracking, EntityId: String(entryId), Details: `Contract tracking approved at ${pending.step}, advancing to ${next}` });
      } else {
        newStatus = 'Tracked';
        nextStep = undefined;
        this.logAudit({ Action: AuditAction.ContractTrackingApproved, EntityType: EntityType.ContractTracking, EntityId: String(entryId), Details: `Contract tracking fully approved — status: Tracked` });
      }
    }

    await this._getProjectWeb().lists.getByTitle(LIST_NAMES.BUYOUT_LOG).items.getById(entryId).update({
      ContractTrackingStatus: newStatus,
      CurrentContractTrackingStep: nextStep ?? null,
    });

    performanceService.endMark('sp:respondToContractTracking');
    return (await this.getBuyoutEntries(projectCode)).find(e => e.id === entryId) as IBuyoutEntry;
  }

  // SP-INDEX-REQUIRED: Contract_Tracking_Approvals → ProjectCode+BuyoutEntryId (compound filter)
  async getContractTrackingHistory(projectCode: string, entryId: number): Promise<IContractTrackingApproval[]> {
    performanceService.startMark('sp:getContractTrackingHistory');
    const items = await this._getProjectWeb().lists
      .getByTitle(LIST_NAMES.CONTRACT_TRACKING_APPROVALS)
      .items
      .filter(`ProjectCode eq '${projectCode}' and BuyoutEntryId eq ${entryId}`)
      .orderBy('Id', true)();

    performanceService.endMark('sp:getContractTrackingHistory');
    return items.map((item: Record<string, unknown>) => ({
      id: item.Id as number,
      buyoutEntryId: item.BuyoutEntryId as number,
      projectCode: item.ProjectCode as string,
      step: item.Step as ContractTrackingStep,
      approverName: item.ApproverName as string,
      approverEmail: item.ApproverEmail as string,
      status: item.Status as IContractTrackingApproval['status'],
      comment: item.Comment as string | undefined,
      actionDate: item.ActionDate as string | undefined,
      skippedReason: item.SkippedReason as string | undefined,
    }));
  }

  // --- File Upload ---
  async uploadCommitmentDocument(projectCode: string, entryId: number, file: File): Promise<{ fileId: string; fileName: string; fileUrl: string }> {
    performanceService.startMark('sp:uploadCommitmentDocument');
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

    performanceService.endMark('sp:uploadCommitmentDocument');
    return { fileId, fileName, fileUrl };
  }

  // --- Compliance Log ---
  // SP-INDEX-REQUIRED: Buyout_Log → ProjectCode, CommitmentStatus, EVerifyStatus, SubcontractorName
  // LOAD-TEST: Dynamic multi-column filter. Expected 500+ active commitments hub-wide. Bounded at top(500).
  async getComplianceLog(filters?: IComplianceLogFilter): Promise<IComplianceEntry[]> {
    performanceService.startMark('sp:getComplianceLog');
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

    performanceService.endMark('sp:getComplianceLog');
    return entries;
  }

  async getComplianceLogPage(request: ICursorPageRequest): Promise<ICursorPageResult<IComplianceEntry>> {
    const filters = (request.filters ?? {}) as Partial<IComplianceLogFilter>;
    const rows = await this.getComplianceLog({
      projectCode: request.projectCode ?? filters.projectCode,
      commitmentStatus: filters.commitmentStatus,
      eVerifyStatus: filters.eVerifyStatus,
      searchQuery: filters.searchQuery,
    });
    return this.paginateArray(rows, request);
  }

  // LOAD-TEST: Delegates to getComplianceLog. Client-side aggregation.
  async getComplianceSummary(): Promise<IComplianceSummary> {
    performanceService.startMark('sp:getComplianceSummary');
    const entries = await this.getComplianceLog();

    performanceService.endMark('sp:getComplianceSummary');
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
  // SP-INDEX-REQUIRED: Estimating_Tracker/Marketing_Project_Records/Provisioning_Log/Buyout_Log/Project_Team_Assignments → ProjectCode
  // LOAD-TEST: CRITICAL batch operation: 1 lead update + 5 list batch-rekeys. Each batch reads + updates all matching items. Use sparingly.
  async rekeyProjectCode(oldCode: string, newCode: string, leadId: number): Promise<void> {
    performanceService.startMark('sp:rekeyProjectCode');
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
    performanceService.endMark('sp:rekeyProjectCode');
  }

  // --- Active Projects Portfolio ---

  // SP-INDEX-REQUIRED: Active_Projects_Portfolio → Status, Sector, ProjectExecutive, LeadPM, Region
  // LOAD-TEST: Expected 50-200 projects. Default top(500). At 200+ items, consider server-side paging.
  async getActiveProjects(options?: IActiveProjectsQueryOptions): Promise<IActiveProject[]> {
    const cacheKey = CACHE_KEYS.ACTIVE_PROJECTS + buildCacheKeySuffix(options as unknown as Record<string, unknown>);
    const cached = cacheService.get<IActiveProject[]>(cacheKey);
    if (cached) return cached;

    performanceService.startMark('sp:getActiveProjects');
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

    try {
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
      const result = items.map((item: Record<string, unknown>) => this.mapToActiveProject(item));
      cacheService.set(cacheKey, result, CACHE_TTL_MS);
      performanceService.endMark('sp:getActiveProjects');
      return result;
    } catch (err) {
      performanceService.endMark('sp:getActiveProjects');
      throw this.handleError('getActiveProjects', err, { entityType: 'Project' });
    }
  }

  async getActiveProjectById(id: number): Promise<IActiveProject | null> {
    const cacheKey = CACHE_KEYS.ACTIVE_PROJECTS + '_id_' + id;
    const cached = cacheService.get<IActiveProject>(cacheKey);
    if (cached) return cached;

    performanceService.startMark('sp:getActiveProjectById');
    try {
      const item = await this.sp.web.lists
        .getByTitle(LIST_NAMES.ACTIVE_PROJECTS_PORTFOLIO)
        .items
        .getById(id)();
      const result = this.mapToActiveProject(item);
      cacheService.set(cacheKey, result, CACHE_TTL_MS);
      performanceService.endMark('sp:getActiveProjectById');
      return result;
    } catch (err) {
      performanceService.endMark('sp:getActiveProjectById');
      this.handleError('getActiveProjectById', err, {
        entityType: 'Project',
        entityId: String(id),
        rethrow: false,
      });
      return null;
    }
  }

  // SP-INDEX-REQUIRED: Active_Projects_Portfolio → ProjectCode
  async syncActiveProject(projectCode: string): Promise<IActiveProject> {
    performanceService.startMark('sp:syncActiveProject');
    try {
      // Find the project in the portfolio list
      const items = await this.sp.web.lists
        .getByTitle(LIST_NAMES.ACTIVE_PROJECTS_PORTFOLIO)
        .items
        .filter(`ProjectCode eq '${projectCode}'`)();

      if (items.length === 0) {
        performanceService.endMark('sp:syncActiveProject');
        throw new DataServiceError('syncActiveProject', `Project ${projectCode} not found in portfolio`, {
          entityType: 'Project',
          entityId: projectCode,
        });
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

      cacheService.removeByPrefix(CACHE_KEYS.ACTIVE_PROJECTS);
      cacheService.removeByPrefix(CACHE_KEYS.PORTFOLIO_SUMMARY);
      cacheService.removeByPrefix(CACHE_KEYS.PERSONNEL_WORKLOAD);

      performanceService.endMark('sp:syncActiveProject');
      return this.mapToActiveProject(updated);
    } catch (err) {
      performanceService.endMark('sp:syncActiveProject');
      throw this.handleError('syncActiveProject', err, {
        entityType: 'Project',
        entityId: projectCode,
      });
    }
  }

  async updateActiveProject(id: number, data: Partial<IActiveProject>): Promise<IActiveProject> {
    performanceService.startMark('sp:updateActiveProject');
    try {
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

      cacheService.removeByPrefix(CACHE_KEYS.ACTIVE_PROJECTS);
      cacheService.removeByPrefix(CACHE_KEYS.PORTFOLIO_SUMMARY);
      cacheService.removeByPrefix(CACHE_KEYS.PERSONNEL_WORKLOAD);

      performanceService.endMark('sp:updateActiveProject');
      return this.mapToActiveProject(updated);
    } catch (err) {
      performanceService.endMark('sp:updateActiveProject');
      throw this.handleError('updateActiveProject', err, {
        entityType: 'Project',
        entityId: String(id),
      });
    }
  }

  // LOAD-TEST: Delegates to getActiveProjects. Client-side aggregation over 200 items is <10ms.
  async getPortfolioSummary(filters?: IActiveProjectsFilter): Promise<IPortfolioSummary> {
    const cacheKey = CACHE_KEYS.PORTFOLIO_SUMMARY + buildCacheKeySuffix(filters as unknown as Record<string, unknown>);
    const cached = cacheService.get<IPortfolioSummary>(cacheKey);
    if (cached) return cached;

    performanceService.startMark('sp:getPortfolioSummary');
    try {
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

      const result: IPortfolioSummary = {
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
      cacheService.set(cacheKey, result, CACHE_TTL_MS);
      performanceService.endMark('sp:getPortfolioSummary');
      return result;
    } catch (err) {
      performanceService.endMark('sp:getPortfolioSummary');
      throw this.handleError('getPortfolioSummary', err, { entityType: 'Project' });
    }
  }

  // LOAD-TEST: Delegates to getActiveProjects. In-memory Map over 200 items is <5ms.
  async getPersonnelWorkload(role?: 'PX' | 'PM' | 'Super'): Promise<IPersonnelWorkload[]> {
    const cacheKey = CACHE_KEYS.PERSONNEL_WORKLOAD + (role ? '_' + role : '');
    const cached = cacheService.get<IPersonnelWorkload[]>(cacheKey);
    if (cached) return cached;

    performanceService.startMark('sp:getPersonnelWorkload');
    try {
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

      const result = Array.from(workloadMap.values()).sort((a, b) => b.projectCount - a.projectCount);
      cacheService.set(cacheKey, result, CACHE_TTL_MS);
      performanceService.endMark('sp:getPersonnelWorkload');
      return result;
    } catch (err) {
      performanceService.endMark('sp:getPersonnelWorkload');
      throw this.handleError('getPersonnelWorkload', err, { entityType: 'Project' });
    }
  }

  // LOAD-TEST: Batch-updates all items. SP batch limit ~100 ops; chunk if >100.
  async triggerPortfolioSync(): Promise<void> {
    performanceService.startMark('sp:triggerPortfolioSync');
    try {
      // In a real implementation, this would trigger a Power Automate flow
      // or Azure Function to aggregate data from all project sites
      const now = new Date().toISOString();
      const items = await this.sp.web.lists
        .getByTitle(LIST_NAMES.ACTIVE_PROJECTS_PORTFOLIO)
        .items
        .select('Id')
        .top(5000)();

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

      cacheService.removeByPrefix(CACHE_KEYS.ACTIVE_PROJECTS);
      cacheService.removeByPrefix(CACHE_KEYS.PORTFOLIO_SUMMARY);
      cacheService.removeByPrefix(CACHE_KEYS.PERSONNEL_WORKLOAD);
      performanceService.endMark('sp:triggerPortfolioSync');
    } catch (err) {
      performanceService.endMark('sp:triggerPortfolioSync');
      throw this.handleError('triggerPortfolioSync', err, { entityType: 'Project' });
    }
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
  // SP-INDEX-REQUIRED: Estimating_Tracker → LeadID, PMP/Marketing_Project_Records/Provisioning_Log → ProjectCode, Job_Number_Requests → LeadID
  // LOAD-TEST: 5 sequential batch updates across hub lists. Each reads + batch-updates matching items. Expect <10 items per list per lead.
  async syncDenormalizedFields(leadId: number): Promise<void> {
    performanceService.startMark('sp:syncDenormalizedFields');
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
    performanceService.endMark('sp:syncDenormalizedFields');
      }
    }
  }

  // --- Closeout Promotion ---
  // SP-INDEX-REQUIRED: Lessons_Learned (project) → ProjectCode+isIncludedInFinalRecord, Lessons_Learned_Hub → ProjectCode+title, PMP → ProjectCode
  // LOAD-TEST: N+1 for lesson copy (serial duplicate check + add). Expected <50 lessons per project. PMP batch close is fast.
  async promoteToHub(projectCode: string): Promise<void> {
    performanceService.startMark('sp:promoteToHub');
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
    performanceService.endMark('sp:promoteToHub');
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

  // SP-INDEX-REQUIRED: Scorecard_Approval_Cycles → ScorecardId, Scorecard_Approval_Steps → CycleId, Scorecard_Versions → ScorecardId
  // LOAD-TEST: 4 SP calls (parent by ID + 3 child filters). Expected <5 cycles, <10 steps, <5 versions per scorecard.
  private async assembleScorecard(scorecardId: number): Promise<IGoNoGoScorecard> {
    performanceService.startMark('sp:assembleScorecard');
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
    performanceService.endMark('sp:assembleScorecard');
  }

  // LOAD-TEST: 2 SP calls: read scorecard + add version. Fast.
  private async createVersionSnapshot(scorecardId: number, reason: string, createdBy: string): Promise<IScorecardVersion> {
    performanceService.startMark('sp:createVersionSnapshot');
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

    performanceService.endMark('sp:createVersionSnapshot');
    return this.mapToScorecardVersion(result);
  }

  // --- Scorecard Workflow (Phase 16) — Public Methods ---

  // SP-INDEX-REQUIRED: Scorecard_Approval_Cycles → ScorecardId
  // LOAD-TEST: 4-5 SP calls per submission (read scorecard, read cycles, create cycle, create 2 steps, update scorecard).
  async submitScorecard(scorecardId: number, submittedBy: string, _approverOverride?: IPersonAssignment): Promise<IGoNoGoScorecard> {
    performanceService.startMark('sp:submitScorecard');
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

    const result = await this.assembleScorecard(scorecardId);
    performanceService.endMark('sp:submitScorecard');
    return result;
  }

  // SP-INDEX-REQUIRED: Scorecard_Approval_Cycles → ScorecardId+Status, Scorecard_Approval_Steps → CycleId+Status
  async respondToScorecardSubmission(scorecardId: number, approved: boolean, comment: string): Promise<IGoNoGoScorecard> {
    performanceService.startMark('sp:respondToScorecardSubmission');
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

    const result = await this.assembleScorecard(scorecardId);
    performanceService.endMark('sp:respondToScorecardSubmission');
    return result;
  }

  async enterCommitteeScores(scorecardId: number, scores: Record<string, number>, enteredBy: string): Promise<IGoNoGoScorecard> {
    performanceService.startMark('sp:enterCommitteeScores');
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

    const result = await this.assembleScorecard(scorecardId);
    performanceService.endMark('sp:enterCommitteeScores');
    return result;
  }

  // SP-INDEX-REQUIRED: Scorecard_Approval_Cycles → ScorecardId+Status
  async recordFinalDecision(scorecardId: number, decision: GoNoGoDecision, conditions?: string, decidedBy?: string): Promise<IGoNoGoScorecard> {
    performanceService.startMark('sp:recordFinalDecision');
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

    const result = await this.assembleScorecard(scorecardId);
    performanceService.endMark('sp:recordFinalDecision');
    return result;
  }

  async unlockScorecard(scorecardId: number, reason: string): Promise<IGoNoGoScorecard> {
    performanceService.startMark('sp:unlockScorecard');
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

    const result = await this.assembleScorecard(scorecardId);
    performanceService.endMark('sp:unlockScorecard');
    return result;
  }

  // SP-INDEX-REQUIRED: Scorecard_Approval_Cycles → ScorecardId
  async relockScorecard(scorecardId: number, startNewCycle: boolean): Promise<IGoNoGoScorecard> {
    performanceService.startMark('sp:relockScorecard');
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

    const result = await this.assembleScorecard(scorecardId);
    performanceService.endMark('sp:relockScorecard');
    return result;
  }

  // SP-INDEX-REQUIRED: Scorecard_Versions → ScorecardId
  async getScorecardVersions(scorecardId: number): Promise<IScorecardVersion[]> {
    performanceService.startMark('sp:getScorecardVersions');
    try {
      const col = SCORECARD_VERSIONS_COLUMNS;
      const items = await this.sp.web.lists.getByTitle(LIST_NAMES.SCORECARD_VERSIONS).items
        .filter(`${col.scorecardId} eq ${scorecardId}`)
        .orderBy(col.versionNumber, true)
        .top(500)();
      performanceService.endMark('sp:getScorecardVersions');
      return (items as Record<string, unknown>[]).map(i => this.mapToScorecardVersion(i));
    } catch (err) {
      performanceService.endMark('sp:getScorecardVersions');
      throw this.handleError('getScorecardVersions', err, { entityType: 'ScorecardVersion' });
    }
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
  // LOAD-TEST: 3 parallel SP calls (all definitions + all steps + all conditionals). Expected <10 workflows, <100 total steps. Unbounded queries.
  private async assembleAllWorkflowDefinitions(): Promise<IWorkflowDefinition[]> {
    performanceService.startMark('sp:assembleAllWorkflowDefinitions');
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
    performanceService.endMark('sp:assembleAllWorkflowDefinitions');
  }

  async getWorkflowDefinitions(): Promise<IWorkflowDefinition[]> {
    performanceService.startMark('sp:getWorkflowDefinitions');
    performanceService.endMark('sp:getWorkflowDefinitions');
    return this.assembleAllWorkflowDefinitions();
  }

  // SP-INDEX-REQUIRED: Workflow_Definitions → WorkflowKey, Workflow_Steps → WorkflowId, Workflow_Conditional_Assignments → StepId
  // LOAD-TEST: 3 sequential SP calls (def + steps + conditionals OR-filter). Expected <15 steps per workflow.
  async getWorkflowDefinition(workflowKey: WorkflowKey): Promise<IWorkflowDefinition | null> {
    performanceService.startMark('sp:getWorkflowDefinition');
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

    performanceService.endMark('sp:getWorkflowDefinition');
    return this.mapToWorkflowDefinition(defItem, steps);
  }

  // SP-INDEX-REQUIRED: Workflow_Conditional_Assignments → StepId (for re-read after update)
  async updateWorkflowStep(workflowId: number, stepId: number, data: Partial<IWorkflowStep>): Promise<IWorkflowStep> {
    performanceService.startMark('sp:updateWorkflowStep');
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
    performanceService.endMark('sp:updateWorkflowStep');
    return this.mapToWorkflowStep(updatedItem, cas);
  }

  // LOAD-TEST: 4 SP calls: add assignment, read step (for workflowId), update definition timestamp, re-read.
  async addConditionalAssignment(stepId: number, assignment: Partial<IConditionalAssignment>): Promise<IConditionalAssignment> {
    performanceService.startMark('sp:addConditionalAssignment');
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
    performanceService.endMark('sp:addConditionalAssignment');
    return this.mapToConditionalAssignment(createdItem);
  }

  // LOAD-TEST: 4-5 SP calls: update, re-read, find step, find workflow, update timestamp.
  async updateConditionalAssignment(assignmentId: number, data: Partial<IConditionalAssignment>): Promise<IConditionalAssignment> {
    performanceService.startMark('sp:updateConditionalAssignment');
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

    performanceService.endMark('sp:updateConditionalAssignment');
    return this.mapToConditionalAssignment(updatedItem);
  }

  // LOAD-TEST: 3-4 SP calls: read item (for stepId), recycle, find workflow, update timestamp.
  async removeConditionalAssignment(assignmentId: number): Promise<void> {
    performanceService.startMark('sp:removeConditionalAssignment');
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
    performanceService.endMark('sp:removeConditionalAssignment');
      }
    }
  }

  // SP-INDEX-REQUIRED: Workflow_Step_Overrides → ProjectCode
  async getWorkflowOverrides(projectCode: string): Promise<IWorkflowStepOverride[]> {
    performanceService.startMark('sp:getWorkflowOverrides');
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_STEP_OVERRIDES).items
      .filter(`${WORKFLOW_STEP_OVERRIDES_COLUMNS.projectCode} eq '${projectCode}'`)();
    performanceService.endMark('sp:getWorkflowOverrides');
    return items.map((item: Record<string, unknown>) => this.mapToWorkflowStepOverride(item));
  }

  // SP-INDEX-REQUIRED: Workflow_Step_Overrides → ProjectCode+StepId (compound filter for upsert)
  async setWorkflowStepOverride(override: Partial<IWorkflowStepOverride>): Promise<IWorkflowStepOverride> {
    performanceService.startMark('sp:setWorkflowStepOverride');
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
    performanceService.endMark('sp:setWorkflowStepOverride');
    return this.mapToWorkflowStepOverride(createdItem);
  }

  async removeWorkflowStepOverride(overrideId: number): Promise<void> {
    performanceService.startMark('sp:removeWorkflowStepOverride');
    await this.sp.web.lists.getByTitle(LIST_NAMES.WORKFLOW_STEP_OVERRIDES).items.getById(overrideId).recycle();
    performanceService.endMark('sp:removeWorkflowStepOverride');
  }

  // SP-INDEX-REQUIRED: Leads_Master → ProjectCode (for lead condition eval)
  // LOAD-TEST: 5+ SP calls: getWorkflowDefinition + getWorkflowOverrides + getTeamMembers + lead lookup + getFeatureFlags. Heavy read-only method.
  async resolveWorkflowChain(workflowKey: WorkflowKey, projectCode: string): Promise<IResolvedWorkflowStep[]> {
    performanceService.startMark('sp:resolveWorkflowChain');
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

    performanceService.endMark('sp:resolveWorkflowChain');
    return resolved;
  }

  // --- Turnover Agenda ---

  // SP-INDEX-REQUIRED: Turnover_Agendas → ProjectCode, Turnover_Prerequisites/Discussion_Items/Subcontractors/Exhibits/Signatures → TurnoverAgendaId, Turnover_Estimate_Overviews → TurnoverAgendaId
  // LOAD-TEST: 8 parallel SP calls (parent + 7 child lists). CRITICAL: Turnover_Attachments has no agendaId filter — full table scan.
  async getTurnoverAgenda(projectCode: string): Promise<ITurnoverAgenda | null> {
    performanceService.startMark('sp:getTurnoverAgenda');
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

    performanceService.endMark('sp:getTurnoverAgenda');
    return this.assembleTurnoverAgenda(agenda, lead, headerOverrides, estimateOverview, prereqs, discussionItems, attachments, subs, exhibits, sigs);
  }

  // LOAD-TEST: ~30+ SP calls: 1 lead read + 1 parent add + ~25 child seeds (prereqs + discussion + exhibits + sigs + overview) in parallel.
  async createTurnoverAgenda(projectCode: string, leadId: number): Promise<ITurnoverAgenda> {
    performanceService.startMark('sp:createTurnoverAgenda');
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
    performanceService.endMark('sp:createTurnoverAgenda');
    return result;
  }

  // SP-INDEX-REQUIRED: Turnover_Agendas → ProjectCode
  async updateTurnoverAgenda(projectCode: string, data: Partial<ITurnoverAgenda>): Promise<ITurnoverAgenda> {
    performanceService.startMark('sp:updateTurnoverAgenda');
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
    performanceService.endMark('sp:updateTurnoverAgenda');
    return result;
  }
  async updateTurnoverPrerequisite(prerequisiteId: number, data: Partial<ITurnoverPrerequisite>): Promise<ITurnoverPrerequisite> {
    performanceService.startMark('sp:updateTurnoverPrerequisite');
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
    performanceService.endMark('sp:updateTurnoverPrerequisite');
    return this.mapToTurnoverPrerequisite(item);
  }

  // SP-INDEX-REQUIRED: Turnover_Attachments → DiscussionItemId
  async updateTurnoverDiscussionItem(itemId: number, data: Partial<ITurnoverDiscussionItem>): Promise<ITurnoverDiscussionItem> {
    performanceService.startMark('sp:updateTurnoverDiscussionItem');
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

    performanceService.endMark('sp:updateTurnoverDiscussionItem');
    return mapped;
  }

  async addTurnoverDiscussionAttachment(itemId: number, file: File): Promise<ITurnoverAttachment> {
    performanceService.startMark('sp:addTurnoverDiscussionAttachment');
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
    performanceService.endMark('sp:addTurnoverDiscussionAttachment');
    return this.mapToTurnoverAttachment(item);
  }

  async removeTurnoverDiscussionAttachment(attachmentId: number): Promise<void> {
    performanceService.startMark('sp:removeTurnoverDiscussionAttachment');
    const web = this._getProjectWeb();
    await web.lists.getByTitle(LIST_NAMES.TURNOVER_ATTACHMENTS).items.getById(attachmentId).delete();
    performanceService.endMark('sp:removeTurnoverDiscussionAttachment');
  }

  async addTurnoverSubcontractor(turnoverAgendaId: number, data: Partial<ITurnoverSubcontractor>): Promise<ITurnoverSubcontractor> {
    performanceService.startMark('sp:addTurnoverSubcontractor');
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
    performanceService.endMark('sp:addTurnoverSubcontractor');
    return this.mapToTurnoverSubcontractor(item);
  }

  async updateTurnoverSubcontractor(subId: number, data: Partial<ITurnoverSubcontractor>): Promise<ITurnoverSubcontractor> {
    performanceService.startMark('sp:updateTurnoverSubcontractor');
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
    performanceService.endMark('sp:updateTurnoverSubcontractor');
    return this.mapToTurnoverSubcontractor(item);
  }

  async removeTurnoverSubcontractor(subId: number): Promise<void> {
    performanceService.startMark('sp:removeTurnoverSubcontractor');
    const web = this._getProjectWeb();
    await web.lists.getByTitle(LIST_NAMES.TURNOVER_SUBCONTRACTORS).items.getById(subId).delete();
    performanceService.endMark('sp:removeTurnoverSubcontractor');
  }

  async updateTurnoverExhibit(exhibitId: number, data: Partial<ITurnoverExhibit>): Promise<ITurnoverExhibit> {
    performanceService.startMark('sp:updateTurnoverExhibit');
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
    performanceService.endMark('sp:updateTurnoverExhibit');
    return this.mapToTurnoverExhibit(item);
  }

  // SP-INDEX-REQUIRED: Turnover_Exhibits → TurnoverAgendaId (for sortOrder calc)
  async addTurnoverExhibit(turnoverAgendaId: number, data: Partial<ITurnoverExhibit>): Promise<ITurnoverExhibit> {
    performanceService.startMark('sp:addTurnoverExhibit');
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
    performanceService.endMark('sp:addTurnoverExhibit');
    return this.mapToTurnoverExhibit(item);
  }

  async removeTurnoverExhibit(exhibitId: number): Promise<void> {
    performanceService.startMark('sp:removeTurnoverExhibit');
    const web = this._getProjectWeb();
    await web.lists.getByTitle(LIST_NAMES.TURNOVER_EXHIBITS).items.getById(exhibitId).delete();
    performanceService.endMark('sp:removeTurnoverExhibit');
  }

  async uploadTurnoverExhibitFile(exhibitId: number, file: File): Promise<{ fileUrl: string; fileName: string }> {
    performanceService.startMark('sp:uploadTurnoverExhibitFile');
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

    performanceService.endMark('sp:uploadTurnoverExhibitFile');
    return { fileUrl, fileName: file.name };
  }

  async signTurnoverAgenda(signatureId: number, comment?: string): Promise<ITurnoverSignature> {
    performanceService.startMark('sp:signTurnoverAgenda');
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
    performanceService.endMark('sp:signTurnoverAgenda');
    return this.mapToTurnoverSignature(item);
  }

  // SP-INDEX-REQUIRED: Turnover_Agendas → ProjectCode, Turnover_Estimate_Overviews → TurnoverAgendaId
  async updateTurnoverEstimateOverview(projectCode: string, data: Partial<ITurnoverEstimateOverview>): Promise<ITurnoverEstimateOverview> {
    performanceService.startMark('sp:updateTurnoverEstimateOverview');
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
    performanceService.endMark('sp:updateTurnoverEstimateOverview');
    return this.mapToTurnoverEstimateOverview(item);
  }

  // --- Hub Site URL Configuration ---
  // SP-INDEX-REQUIRED: App_Context_Config → SiteURL
  async getHubSiteUrl(): Promise<string> {
    performanceService.startMark('sp:getHubSiteUrl');
    if (!this.sp) return 'https://hedrickbrotherscom.sharepoint.com/sites/HBCentral';
    try {
      const items = await this.sp.web.lists.getByTitle('App_Context_Config')
        .items.filter("SiteURL eq 'HUB_SITE_URL'").select('AppTitle').top(1)();
      return items.length > 0 ? items[0].AppTitle : 'https://hedrickbrotherscom.sharepoint.com/sites/HBCentral';
    } catch {
    performanceService.endMark('sp:getHubSiteUrl');
      return 'https://hedrickbrotherscom.sharepoint.com/sites/HBCentral';
    }
  }
  // SP-INDEX-REQUIRED: App_Context_Config → SiteURL
  async setHubSiteUrl(url: string): Promise<void> {
    performanceService.startMark('sp:setHubSiteUrl');
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
    performanceService.endMark('sp:setHubSiteUrl');
    }
  }

  // SP-INDEX-REQUIRED: Scorecard_Approval_Steps → AssigneeEmail+Status, PMP_Approval_Steps → ApproverEmail+Status, PMP_Signatures → PersonEmail+Status, Monthly_Reviews → Status
  // LOAD-TEST: 4+ parallel SP calls across different lists. Each bounded at top(50). Heavy read-only aggregation.
  async getActionItems(userEmail: string): Promise<IActionInboxItem[]> {
    performanceService.startMark('sp:getActionItems');
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

    performanceService.endMark('sp:getActionItems');
    return items;
  }

  // --- Permission Templates ---
  async getPermissionTemplates(): Promise<IPermissionTemplate[]> {
    performanceService.startMark('sp:getPermissionTemplates');
    const items = await this.sp.web.lists
      .getByTitle(LIST_NAMES.PERMISSION_TEMPLATES).items();
    performanceService.endMark('sp:getPermissionTemplates');
    return (items as Record<string, unknown>[]).map(i => this.mapToPermissionTemplate(i));
  }

  async getPermissionTemplate(id: number): Promise<IPermissionTemplate | null> {
    performanceService.startMark('sp:getPermissionTemplate');
    try {
      const item = await this.sp.web.lists
        .getByTitle(LIST_NAMES.PERMISSION_TEMPLATES).items.getById(id)();
      return this.mapToPermissionTemplate(item as Record<string, unknown>);
    } catch {
    performanceService.endMark('sp:getPermissionTemplate');
      return null;
    }
  }

  async createPermissionTemplate(data: Partial<IPermissionTemplate>): Promise<IPermissionTemplate> {
    performanceService.startMark('sp:createPermissionTemplate');
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
    performanceService.endMark('sp:createPermissionTemplate');
    return this.mapToPermissionTemplate(result as Record<string, unknown>);
  }

  async updatePermissionTemplate(id: number, data: Partial<IPermissionTemplate>): Promise<IPermissionTemplate> {
    performanceService.startMark('sp:updatePermissionTemplate');
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
    performanceService.endMark('sp:updatePermissionTemplate');
    return this.mapToPermissionTemplate(updated as Record<string, unknown>);
  }

  async deletePermissionTemplate(id: number): Promise<void> {
    performanceService.startMark('sp:deletePermissionTemplate');
    await this.sp.web.lists
      .getByTitle(LIST_NAMES.PERMISSION_TEMPLATES).items.getById(id).delete();
    performanceService.endMark('sp:deletePermissionTemplate');
  }

  // --- Security Group Mappings ---
  async getSecurityGroupMappings(): Promise<ISecurityGroupMapping[]> {
    performanceService.startMark('sp:getSecurityGroupMappings');
    const items = await this.sp.web.lists
      .getByTitle(LIST_NAMES.SECURITY_GROUP_MAPPINGS).items();
    performanceService.endMark('sp:getSecurityGroupMappings');
    return (items as Record<string, unknown>[]).map(i => this.mapToSecurityGroupMapping(i));
  }

  async createSecurityGroupMapping(data: Partial<ISecurityGroupMapping>): Promise<ISecurityGroupMapping> {
    performanceService.startMark('sp:createSecurityGroupMapping');
    const spItem: Record<string, unknown> = {
      [SECURITY_GROUP_MAPPINGS_COLUMNS.securityGroupId]: data.securityGroupId || '',
      [SECURITY_GROUP_MAPPINGS_COLUMNS.securityGroupName]: data.securityGroupName || '',
      [SECURITY_GROUP_MAPPINGS_COLUMNS.defaultTemplateId]: data.defaultTemplateId || 0,
      [SECURITY_GROUP_MAPPINGS_COLUMNS.isActive]: data.isActive ?? true,
    };
    const result = await this.sp.web.lists
      .getByTitle(LIST_NAMES.SECURITY_GROUP_MAPPINGS).items.add(spItem);
    performanceService.endMark('sp:createSecurityGroupMapping');
    return this.mapToSecurityGroupMapping(result as Record<string, unknown>);
  }

  async updateSecurityGroupMapping(id: number, data: Partial<ISecurityGroupMapping>): Promise<ISecurityGroupMapping> {
    performanceService.startMark('sp:updateSecurityGroupMapping');
    const updateData: Record<string, unknown> = {};
    if (data.securityGroupId !== undefined) updateData[SECURITY_GROUP_MAPPINGS_COLUMNS.securityGroupId] = data.securityGroupId;
    if (data.securityGroupName !== undefined) updateData[SECURITY_GROUP_MAPPINGS_COLUMNS.securityGroupName] = data.securityGroupName;
    if (data.defaultTemplateId !== undefined) updateData[SECURITY_GROUP_MAPPINGS_COLUMNS.defaultTemplateId] = data.defaultTemplateId;
    if (data.isActive !== undefined) updateData[SECURITY_GROUP_MAPPINGS_COLUMNS.isActive] = data.isActive;

    await this.sp.web.lists
      .getByTitle(LIST_NAMES.SECURITY_GROUP_MAPPINGS).items.getById(id).update(updateData);
    const updated = await this.sp.web.lists
      .getByTitle(LIST_NAMES.SECURITY_GROUP_MAPPINGS).items.getById(id)();
    performanceService.endMark('sp:updateSecurityGroupMapping');
    return this.mapToSecurityGroupMapping(updated as Record<string, unknown>);
  }

  // --- Project Team Assignments ---
  // SP-INDEX-REQUIRED: Project_Team_Assignments → ProjectCode+IsActive (compound filter)
  async getProjectTeamAssignments(projectCode: string): Promise<IProjectTeamAssignment[]> {
    performanceService.startMark('sp:getProjectTeamAssignments');
    const col = PROJECT_TEAM_ASSIGNMENTS_COLUMNS;
    const items = await this.sp.web.lists
      .getByTitle(LIST_NAMES.PROJECT_TEAM_ASSIGNMENTS)
      .items.filter(`${col.projectCode} eq '${projectCode}' and ${col.isActive} eq 1`)();
    performanceService.endMark('sp:getProjectTeamAssignments');
    return (items as Record<string, unknown>[]).map(i => this.mapToProjectTeamAssignment(i));
  }

  // SP-INDEX-REQUIRED: Project_Team_Assignments → UserEmail, IsActive
  // Note: tolower() in OData filter prevents SP index usage. Consider pre-lowered column for >5000 items.
  // LOAD-TEST: Expected <50 per user. tolower() prevents SP index — consider pre-lowered column at scale.
  async getMyProjectAssignments(userEmail: string): Promise<IProjectTeamAssignment[]> {
    const emailLower = userEmail.toLowerCase();
    const cacheKey = CACHE_KEYS.ASSIGNMENTS + '_user_' + emailLower;
    const cached = cacheService.get<IProjectTeamAssignment[]>(cacheKey);
    if (cached) return cached;

    performanceService.startMark('sp:getMyProjectAssignments');
    try {
      const col = PROJECT_TEAM_ASSIGNMENTS_COLUMNS;
      // OData tolower for case-insensitive email matching
      const items = await this.sp.web.lists
        .getByTitle(LIST_NAMES.PROJECT_TEAM_ASSIGNMENTS)
        .items.filter(`tolower(${col.userEmail}) eq '${emailLower}' and ${col.isActive} eq 1`)();
      const result = (items as Record<string, unknown>[]).map(i => this.mapToProjectTeamAssignment(i));
      cacheService.set(cacheKey, result, USER_CACHE_TTL_MS);
      performanceService.endMark('sp:getMyProjectAssignments');
      return result;
    } catch (err) {
      performanceService.endMark('sp:getMyProjectAssignments');
      throw this.handleError('getMyProjectAssignments', err, {
        entityType: 'ProjectTeamAssignment',
        entityId: emailLower,
      });
    }
  }

  async createProjectTeamAssignment(data: Partial<IProjectTeamAssignment>): Promise<IProjectTeamAssignment> {
    performanceService.startMark('sp:createProjectTeamAssignment');
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

    cacheService.removeByPrefix(CACHE_KEYS.ASSIGNMENTS);
    cacheService.removeByPrefix(CACHE_KEYS.ACCESSIBLE_PROJECTS);

    performanceService.endMark('sp:createProjectTeamAssignment');
    return this.mapToProjectTeamAssignment(result as Record<string, unknown>);
  }

  async updateProjectTeamAssignment(id: number, data: Partial<IProjectTeamAssignment>): Promise<IProjectTeamAssignment> {
    performanceService.startMark('sp:updateProjectTeamAssignment');
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

    cacheService.removeByPrefix(CACHE_KEYS.ASSIGNMENTS);
    cacheService.removeByPrefix(CACHE_KEYS.ACCESSIBLE_PROJECTS);

    performanceService.endMark('sp:updateProjectTeamAssignment');
    return this.mapToProjectTeamAssignment(updated as Record<string, unknown>);
  }

  async removeProjectTeamAssignment(id: number): Promise<void> {
    performanceService.startMark('sp:removeProjectTeamAssignment');
    // Soft delete: set isActive to false
    await this.sp.web.lists
      .getByTitle(LIST_NAMES.PROJECT_TEAM_ASSIGNMENTS)
      .items.getById(id).update({ [PROJECT_TEAM_ASSIGNMENTS_COLUMNS.isActive]: false });

    cacheService.removeByPrefix(CACHE_KEYS.ASSIGNMENTS);
    cacheService.removeByPrefix(CACHE_KEYS.ACCESSIBLE_PROJECTS);
    performanceService.endMark('sp:removeProjectTeamAssignment');
  }

  async getAllProjectTeamAssignments(): Promise<IProjectTeamAssignment[]> {
    performanceService.startMark('sp:getAllProjectTeamAssignments');
    const items = await this.sp.web.lists
      .getByTitle(LIST_NAMES.PROJECT_TEAM_ASSIGNMENTS)
      .items.filter(`${PROJECT_TEAM_ASSIGNMENTS_COLUMNS.isActive} eq 1`)();
    performanceService.endMark('sp:getAllProjectTeamAssignments');
    return (items as Record<string, unknown>[]).map(i => this.mapToProjectTeamAssignment(i));
  }

  async inviteToProjectSiteGroup(projectCode: string, userEmail: string, role: string): Promise<void> {
    performanceService.startMark('sp:inviteToProjectSiteGroup');
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
    performanceService.endMark('sp:inviteToProjectSiteGroup');
    }
  }

  // --- Permission Resolution ---
  // LOAD-TEST: 3-5 SP calls: getSecurityGroupMappings + getPermissionTemplates + getProjectTeamAssignments. Critical auth path — cached upstream.
  async resolveUserPermissions(userEmail: string, projectCode: string | null): Promise<IResolvedPermissions> {
    performanceService.startMark('sp:resolveUserPermissions');
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
    performanceService.endMark('sp:resolveUserPermissions');
  }

  // SP-INDEX-REQUIRED: Leads_Master → ProjectCode, Project_Team_Assignments → UserEmail, IsActive
  // LOAD-TEST: GlobalAccess: top(5000) from Leads_Master. Per-user: same tolower() concern as getMyProjectAssignments.
  async getAccessibleProjects(userEmail: string): Promise<string[]> {
    const email = userEmail.toLowerCase();
    const cacheKey = CACHE_KEYS.ACCESSIBLE_PROJECTS + '_' + email;
    const cached = cacheService.get<string[]>(cacheKey);
    if (cached) return cached;

    performanceService.startMark('sp:getAccessibleProjects');
    try {
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
        const result = [...new Set(codes)];
        cacheService.set(cacheKey, result, USER_CACHE_TTL_MS);
        performanceService.endMark('sp:getAccessibleProjects');
        return result;
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
      const result = [...new Set(codes)];
      cacheService.set(cacheKey, result, USER_CACHE_TTL_MS);
      performanceService.endMark('sp:getAccessibleProjects');
      return result;
    } catch (err) {
      performanceService.endMark('sp:getAccessibleProjects');
      throw this.handleError('getAccessibleProjects', err, {
        entityType: 'ProjectTeamAssignment',
        entityId: email,
      });
    }
  }

  // --- Environment Configuration ---
  // SP-INDEX-REQUIRED: App_Context_Config → SiteURL (hardcoded ENVIRONMENT_CONFIG filter)
  async getEnvironmentConfig(): Promise<IEnvironmentConfig> {
    performanceService.startMark('sp:getEnvironmentConfig');
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
    performanceService.endMark('sp:getEnvironmentConfig');
  }

  // LOAD-TEST: N+1: serial update of all active templates + config write. Expected <20 templates.
  async promoteTemplates(fromTier: EnvironmentTier, toTier: EnvironmentTier, promotedBy: string): Promise<void> {
    performanceService.startMark('sp:promoteTemplates');
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
    performanceService.endMark('sp:promoteTemplates');
    }
  }

  // --- Sector Definitions ---

  // LOAD-TEST: Hub-site reference list. Expected <30 sectors. Bounded at top(500).
  async getSectorDefinitions(): Promise<ISectorDefinition[]> {
    performanceService.startMark('sp:getSectorDefinitions');
    const col = SECTOR_DEFINITIONS_COLUMNS;
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.SECTOR_DEFINITIONS).items
      .orderBy(col.sortOrder, true)
      .top(500)();
    performanceService.endMark('sp:getSectorDefinitions');
    return items.map((item: Record<string, unknown>) => this.mapToSectorDefinition(item));
  }

  async createSectorDefinition(data: Partial<ISectorDefinition>): Promise<ISectorDefinition> {
    performanceService.startMark('sp:createSectorDefinition');
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
    performanceService.endMark('sp:createSectorDefinition');
    return this.mapToSectorDefinition(created);
  }

  async updateSectorDefinition(id: number, data: Partial<ISectorDefinition>): Promise<ISectorDefinition> {
    performanceService.startMark('sp:updateSectorDefinition');
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
    performanceService.endMark('sp:updateSectorDefinition');
    return this.mapToSectorDefinition(updated);
  }

  // --- BD Leads Folder Operations ---

  /**
   * Creates a BD Leads folder structure on the PX Portfolio Dashboard site.
   * Folder hierarchy: BD Leads / {year} / {leadTitle} - {originatorName} / {9 subfolders}
   * Uses Web() factory for cross-site access (SPFx tokens are tenant-scoped).
   */
  async createBdLeadFolder(leadTitle: string, originatorName: string): Promise<void> {
    performanceService.startMark('sp:createBdLeadFolder');
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
    performanceService.endMark('sp:createBdLeadFolder');
      }
    }
  }

  async checkFolderExists(path: string): Promise<boolean> {
    performanceService.startMark('sp:checkFolderExists');
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
    performanceService.endMark('sp:checkFolderExists');
  }

  async createFolder(path: string): Promise<void> {
    performanceService.startMark('sp:createFolder');
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
    performanceService.endMark('sp:createFolder');
    }
  }

  async renameFolder(oldPath: string, newPath: string): Promise<void> {
    performanceService.startMark('sp:renameFolder');
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
    performanceService.endMark('sp:renameFolder');
    }
  }

  // --- Assignment Mappings ---

  // LOAD-TEST: Hub-site reference list. Expected <50 mappings. Unbounded.
  async getAssignmentMappings(): Promise<IAssignmentMapping[]> {
    performanceService.startMark('sp:getAssignmentMappings');
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.ASSIGNMENT_MAPPINGS).items.top(500)();
    performanceService.endMark('sp:getAssignmentMappings');
    return items.map((item: Record<string, unknown>) => this.mapToAssignmentMapping(item));
  }

  async createAssignmentMapping(data: Partial<IAssignmentMapping>): Promise<IAssignmentMapping> {
    performanceService.startMark('sp:createAssignmentMapping');
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
    performanceService.endMark('sp:createAssignmentMapping');
    return this.mapToAssignmentMapping(created);
  }

  async updateAssignmentMapping(id: number, data: Partial<IAssignmentMapping>): Promise<IAssignmentMapping> {
    performanceService.startMark('sp:updateAssignmentMapping');
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
    performanceService.endMark('sp:updateAssignmentMapping');
    return this.mapToAssignmentMapping(updated);
  }

  // SP-INDEX-REQUIRED: Assignment_Mappings → WorkflowKey+StepId (compound filter for delete lookup)
  async deleteAssignmentMapping(id: number): Promise<void> {
    performanceService.startMark('sp:deleteAssignmentMapping');
    await this.sp.web.lists.getByTitle(LIST_NAMES.ASSIGNMENT_MAPPINGS).items.getById(id).recycle();
    performanceService.endMark('sp:deleteAssignmentMapping');
  }

  // --- Scorecard Reject / Archive ---

  // SP-INDEX-REQUIRED: Scorecard_Approval_Cycles → ScorecardId+Status, Scorecard_Approval_Steps → CycleId+Status
  async rejectScorecard(scorecardId: number, reason: string): Promise<IGoNoGoScorecard> {
    performanceService.startMark('sp:rejectScorecard');
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

    const result = await this.assembleScorecard(scorecardId);
    performanceService.endMark('sp:rejectScorecard');
    return result;
  }

  async archiveScorecard(scorecardId: number, archivedBy: string): Promise<IGoNoGoScorecard> {
    performanceService.startMark('sp:archiveScorecard');
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

    const result = await this.assembleScorecard(scorecardId);
    performanceService.endMark('sp:archiveScorecard');
    return result;
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
      hbShare: item[col.hbShare] as number | undefined,
      amount: item[col.amount] as number | undefined,
      period: item[col.period] as string | undefined,
      dateValue: item[col.dateValue] as string | undefined,
      calculatedFrom: item[col.calculatedFrom] as string | undefined,
      placeholder: item[col.placeholder] as string | undefined,
      details: item[col.details] as string | undefined,
    };
  }

  private mapToCloseoutItem(item: Record<string, unknown>): import('../models').ICloseoutItem {
    const col = CLOSEOUT_ITEMS_COLUMNS;
    return {
      id: (item[col.id] as number) || (item.Id as number),
      projectCode: (item[col.projectCode] as string) || '',
      category: (item[col.category] as string) || '',
      description: (item[col.description] as string) || '',
      status: (item[col.status] as import('../models').ICloseoutItem['status']) || 'NoResponse',
      assignedTo: (item[col.assignedTo] as string) || '',
      assignedToId: item[col.assignedToId] as number | undefined,
      completedDate: item[col.completedDate] as string | undefined,
      notes: item[col.notes] as string | undefined,
      sectionNumber: (item[col.sectionNumber] as number) || 0,
      sectionName: (item[col.sectionName] as string) || '',
      itemNumber: (item[col.itemNumber] as string) || '',
      label: (item[col.label] as string) || '',
      responseType: (item[col.responseType] as import('../models').ICloseoutItem['responseType']) || 'yesNoNA',
      response: item[col.response] as string | number | null ?? null,
      respondedBy: item[col.respondedBy] as string | undefined,
      respondedDate: item[col.respondedDate] as string | undefined,
      comment: item[col.comment] as string | undefined,
      isHidden: !!(item[col.isHidden]),
      isCustom: !!(item[col.isCustom]),
      sortOrder: (item[col.sortOrder] as number) || 0,
      dateValue: item[col.dateValue] as string | undefined,
      calculatedFrom: item[col.calculatedFrom] as string | undefined,
      placeholder: item[col.placeholder] as string | undefined,
      details: item[col.details] as string | undefined,
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

  // LOAD-TEST: 2 SP calls: add + re-read. Fast. Called once per page load.
  async logPerformanceEntry(entry: Partial<IPerformanceLog>): Promise<IPerformanceLog> {
    performanceService.startMark('sp:logPerformanceEntry');
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
    performanceService.endMark('sp:logPerformanceEntry');
    return this.mapToPerformanceLog(reRead);
  }

  // SP-INDEX-REQUIRED: Performance_Logs → Timestamp, SiteUrl, ProjectCode
  // LOAD-TEST: Dynamic multi-column filter. Bounded at top(500). Timestamp index critical.
  async getPerformanceLogs(options?: IPerformanceQueryOptions): Promise<IPerformanceLog[]> {
    performanceService.startMark('sp:getPerformanceLogs');
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
    performanceService.endMark('sp:getPerformanceLogs');
    return (items as Record<string, unknown>[]).map(i => this.mapToPerformanceLog(i));
  }

  // LOAD-TEST: Delegates to getPerformanceLogs. Client-side P95 + aggregation.
  async getPerformanceSummary(options?: IPerformanceQueryOptions): Promise<IPerformanceSummary> {
    performanceService.startMark('sp:getPerformanceSummary');
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
    performanceService.endMark('sp:getPerformanceSummary');
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

  // SP-INDEX-REQUIRED: Help_Guides → IsActive, ModuleKey
  async getHelpGuides(moduleKey?: string): Promise<IHelpGuide[]> {
    performanceService.startMark('sp:getHelpGuides');
    const col = HELP_GUIDES_COLUMNS;
    const filters: string[] = [`${col.isActive} eq 1`];
    if (moduleKey) filters.push(`${col.moduleKey} eq '${moduleKey}'`);

    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.HELP_GUIDES).items
      .filter(filters.join(' and '))
      .orderBy(col.sortOrder, true)();
    performanceService.endMark('sp:getHelpGuides');
    return (items as Record<string, unknown>[]).map(i => this.mapToHelpGuide(i));
  }

  async getHelpGuideById(id: number): Promise<IHelpGuide | null> {
    performanceService.startMark('sp:getHelpGuideById');
    try {
      const item = await this.sp.web.lists.getByTitle(LIST_NAMES.HELP_GUIDES).items.getById(id)();
      return this.mapToHelpGuide(item);
    } catch {
    performanceService.endMark('sp:getHelpGuideById');
      return null;
    }
  }

  // SP-INDEX-REQUIRED: App_Context_Config → SiteURL
  async getSupportConfig(): Promise<ISupportConfig> {
    performanceService.startMark('sp:getSupportConfig');
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
    performanceService.endMark('sp:getSupportConfig');
      return defaultConfig;
    }
  }

  async updateHelpGuide(id: number, data: Partial<IHelpGuide>): Promise<IHelpGuide> {
    performanceService.startMark('sp:updateHelpGuide');
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
    performanceService.endMark('sp:updateHelpGuide');
    return this.mapToHelpGuide(reRead);
  }

  // ═══════════════════════════════════════════════════════════════════
  // ──── Project Data Mart ────
  // ═══════════════════════════════════════════════════════════════════

  // SP-INDEX-REQUIRED: Active_Projects_Portfolio → ProjectCode, Project_Data_Mart → ProjectCode, Critical_Path_Items → Status
  // LOAD-TEST: 11 SP REST calls per project sync. ~2-4s per project. .select() cuts payload ~90%.
  async syncToDataMart(projectCode: string): Promise<IDataMartSyncResult> {
    const now = new Date().toISOString();
    performanceService.startMark('sp:syncToDataMart');
    try {
      // 1. Get project site URL from Active_Projects_Portfolio
      const portfolioItems = await this.sp.web.lists
        .getByTitle(LIST_NAMES.ACTIVE_PROJECTS_PORTFOLIO)
        .items.filter(`ProjectCode eq '${projectCode}'`).top(1)();
      if (portfolioItems.length === 0) {
        performanceService.endMark('sp:syncToDataMart');
        return { projectCode, success: false, syncedAt: now, error: `Project ${projectCode} not found in portfolio` };
      }
      const portfolio = portfolioItems[0];

      // 2. Read from project-site lists via _getProjectWeb()
      const web = this._getProjectWeb();

      const [
        buyoutItems,
        qualityItems,
        safetyItems,
        scheduleItems,
        criticalPathItems,
        reviewItems,
        turnoverItems,
        pmpItems,
        teamRoles,
      ] = await Promise.all([
        web.lists.getByTitle(LIST_NAMES.BUYOUT_LOG).items.select('Id', 'Status', 'ContractValue', 'QScore', 'WaiverRequired', 'CommitmentStatus').top(5000)().catch(() => []),
        web.lists.getByTitle(LIST_NAMES.QUALITY_CONCERNS).items.select('Id', 'Status').top(5000)().catch(() => []),
        web.lists.getByTitle(LIST_NAMES.SAFETY_CONCERNS).items.select('Id', 'Status').top(5000)().catch(() => []),
        web.lists.getByTitle(LIST_NAMES.PROJECT_SCHEDULE).items.select('Id', 'StartDate', 'SubstantialCompletionDate', 'PercentComplete').top(1)().catch(() => []),
        web.lists.getByTitle(LIST_NAMES.CRITICAL_PATH_ITEMS).items.select('Id').filter("Status eq 'Active'").top(5000)().catch(() => []),
        web.lists.getByTitle(LIST_NAMES.MONTHLY_REVIEWS).items.select('Id', 'Status', 'MeetingDate').orderBy('MeetingDate', false).top(1)().catch(() => []),
        web.lists.getByTitle(LIST_NAMES.TURNOVER_AGENDAS).items.select('Id', 'Status').top(1)().catch(() => []),
        web.lists.getByTitle(LIST_NAMES.PMP).items.select('Id', 'Status').top(1)().catch(() => []),
        web.lists.getByTitle(LIST_NAMES.TEAM_ROLE_ASSIGNMENTS).items.select('Id', 'Role', 'PersonName', 'PersonEmail').top(5000)().catch(() => []),
      ]);

      // 3. Aggregate buyout data
      const executedBuyouts = buyoutItems.filter((b: Record<string, unknown>) => b.Status === 'Executed');
      const buyoutCommittedTotal = executedBuyouts.reduce((sum: number, b: Record<string, unknown>) => sum + ((b.ContractValue as number) || 0), 0);
      const buyoutExecutedCount = executedBuyouts.length;
      const buyoutOpenCount = buyoutItems.length - executedBuyouts.length;
      const qScores = buyoutItems.filter((b: Record<string, unknown>) => b.QScore != null).map((b: Record<string, unknown>) => b.QScore as number);
      const averageQScore = qScores.length > 0 ? qScores.reduce((s: number, v: number) => s + v, 0) / qScores.length : 0;
      const openWaiverCount = buyoutItems.filter((b: Record<string, unknown>) => b.WaiverRequired && b.CommitmentStatus !== 'Committed').length;
      const pendingCommitments = buyoutItems.filter((b: Record<string, unknown>) => b.CommitmentStatus !== 'Committed').length;

      // 4. Quality/Safety counts
      const openQualityConcerns = qualityItems.filter((c: Record<string, unknown>) => c.Status === 'Open' || c.Status === 'Monitoring').length;
      const openSafetyConcerns = safetyItems.filter((c: Record<string, unknown>) => c.Status === 'Open' || c.Status === 'Monitoring').length;

      // 5. Schedule data
      const schedule = scheduleItems[0] as Record<string, unknown> | undefined;
      const startDate = (schedule?.StartDate as string) || (portfolio.StartDate as string) || null;
      const substantialCompletionDate = (schedule?.SubstantialCompletionDate as string) || (portfolio.SubstantialCompletionDate as string) || null;
      const percentComplete = (schedule?.PercentComplete as number) || (portfolio.PercentComplete as number) || 0;
      const criticalPathItemCount = criticalPathItems.length;
      const scheduleDaysVariance = substantialCompletionDate
        ? Math.round((new Date(substantialCompletionDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;

      // 6. Latest monthly review
      const latestReview = reviewItems[0] as Record<string, unknown> | undefined;
      const monthlyReviewStatus = (latestReview?.Status as string) || '';
      const lastMonthlyReviewDate = (latestReview?.MeetingDate as string) || null;

      // 7. Turnover & PMP status
      const turnover = turnoverItems[0] as Record<string, unknown> | undefined;
      const turnoverStatus = (turnover?.Status as string) || '';
      const pmp = pmpItems[0] as Record<string, unknown> | undefined;
      const pmpStatus = (pmp?.Status as string) || '';

      // 8. Team data
      const findTeamMember = (role: string): { name: string; email: string } => {
        const member = teamRoles.find((t: Record<string, unknown>) => t.Role === role);
        return {
          name: (member?.PersonName as string) || (portfolio[`Personnel${role}`] as string) || '',
          email: (member?.PersonEmail as string) || (portfolio[`Personnel${role}Email`] as string) || '',
        };
      };
      const px = findTeamMember('PX');
      const pm = findTeamMember('PM');
      const superRole = findTeamMember('Super');

      // 9. Compute financials
      const originalContract = (portfolio.OriginalContract as number) || 0;
      const changeOrders = (portfolio.ChangeOrders as number) || 0;
      const currentContractValue = (portfolio.CurrentContractValue as number) || (originalContract + changeOrders);
      const billingsToDate = (portfolio.BillingsToDate as number) || 0;
      const unbilledAmount = currentContractValue - billingsToDate;
      const projectedFee = (portfolio.ProjectedFee as number) || 0;
      const projectedFeePct = (portfolio.ProjectedFeePct as number) || 0;

      // 10. Compute alerts
      const unbilledPct = currentContractValue > 0 ? (unbilledAmount / currentContractValue) * 100 : 0;
      const hasUnbilledAlert = unbilledPct >= DEFAULT_ALERT_THRESHOLDS.unbilledWarningPct;
      const hasScheduleAlert = scheduleDaysVariance < -DEFAULT_ALERT_THRESHOLDS.scheduleDelayDays;
      const hasFeeErosionAlert = projectedFeePct < DEFAULT_ALERT_THRESHOLDS.feeErosionPct;

      // 11. Compute compliance status
      const complianceStatus: DataMartHealthStatus =
        openWaiverCount > 3 || averageQScore < 60 ? 'Red' :
        openWaiverCount > 1 || averageQScore < 75 ? 'Yellow' : 'Green';

      // 12. Compute overall health (worst-of-dimensions)
      const dimensions: DataMartHealthStatus[] = [complianceStatus];
      if (hasUnbilledAlert) dimensions.push('Red');
      if (hasScheduleAlert) dimensions.push('Red');
      if (hasFeeErosionAlert) dimensions.push('Yellow');
      if (openQualityConcerns > 5 || openSafetyConcerns > 3) dimensions.push('Red');
      else if (openQualityConcerns > 2 || openSafetyConcerns > 1) dimensions.push('Yellow');

      const overallHealth: DataMartHealthStatus =
        dimensions.includes('Red') ? 'Red' :
        dimensions.includes('Yellow') ? 'Yellow' : 'Green';

      // 13. Build SP item data
      const col = PROJECT_DATA_MART_COLUMNS;
      const spData: Record<string, unknown> = {
        [col.projectCode]: projectCode,
        [col.jobNumber]: (portfolio.JobNumber as string) || '',
        [col.projectName]: (portfolio.Title as string) || '',
        [col.status]: (portfolio.Status as string) || '',
        [col.sector]: (portfolio.Sector as string) || '',
        [col.region]: (portfolio.Region as string) || '',
        [col.projectExecutive]: px.name,
        [col.projectExecutiveEmail]: px.email,
        [col.leadPM]: pm.name,
        [col.leadPMEmail]: pm.email,
        [col.leadSuperintendent]: superRole.name,
        [col.leadSuperintendentEmail]: superRole.email,
        [col.originalContract]: originalContract,
        [col.changeOrders]: changeOrders,
        [col.currentContractValue]: currentContractValue,
        [col.billingsToDate]: billingsToDate,
        [col.unbilledAmount]: unbilledAmount,
        [col.projectedFee]: projectedFee,
        [col.projectedFeePct]: projectedFeePct,
        [col.buyoutCommittedTotal]: buyoutCommittedTotal,
        [col.buyoutExecutedCount]: buyoutExecutedCount,
        [col.buyoutOpenCount]: buyoutOpenCount,
        [col.startDate]: startDate,
        [col.substantialCompletionDate]: substantialCompletionDate,
        [col.percentComplete]: percentComplete,
        [col.criticalPathItemCount]: criticalPathItemCount,
        [col.scheduleDaysVariance]: scheduleDaysVariance,
        [col.openQualityConcerns]: openQualityConcerns,
        [col.openSafetyConcerns]: openSafetyConcerns,
        [col.averageQScore]: Math.round(averageQScore * 10) / 10,
        [col.openWaiverCount]: openWaiverCount,
        [col.pendingCommitments]: pendingCommitments,
        [col.complianceStatus]: complianceStatus,
        [col.overallHealth]: overallHealth,
        [col.hasUnbilledAlert]: hasUnbilledAlert,
        [col.hasScheduleAlert]: hasScheduleAlert,
        [col.hasFeeErosionAlert]: hasFeeErosionAlert,
        [col.monthlyReviewStatus]: monthlyReviewStatus,
        [col.lastMonthlyReviewDate]: lastMonthlyReviewDate,
        [col.turnoverStatus]: turnoverStatus,
        [col.pmpStatus]: pmpStatus,
        [col.lastSyncDate]: now,
        [col.lastSyncBy]: this._pageContextUser?.displayName || 'System',
      };

      // 14. Upsert — filter by projectCode, update or add
      const existing = await this.sp.web.lists
        .getByTitle(LIST_NAMES.PROJECT_DATA_MART)
        .items.filter(`ProjectCode eq '${projectCode}'`).top(1)();

      if (existing.length > 0) {
        await this.sp.web.lists
          .getByTitle(LIST_NAMES.PROJECT_DATA_MART)
          .items.getById(existing[0].Id).update(spData);
      } else {
        await this.sp.web.lists
          .getByTitle(LIST_NAMES.PROJECT_DATA_MART)
          .items.add(spData);
      }

      // 15. Audit
      this.logAudit({
        Action: AuditAction.DataMartSynced,
        EntityType: EntityType.DataMart,
        EntityId: projectCode,
        User: this._pageContextUser?.displayName || 'System',
        Details: `Data Mart synced for ${projectCode}`,
      }).catch(() => { /* fire-and-forget */ });

      cacheService.removeByPrefix(CACHE_KEYS.DATA_MART);

      performanceService.endMark('sp:syncToDataMart');
      return { projectCode, success: true, syncedAt: now };
    } catch (err) {
      performanceService.endMark('sp:syncToDataMart');
      const dsError = new DataServiceError('syncToDataMart', 'Sync failed', {
        entityType: 'DataMart',
        entityId: projectCode,
        innerError: err,
      });
      this.logAudit({
        Action: AuditAction.DataMartSyncFailed,
        EntityType: EntityType.DataMart,
        EntityId: projectCode,
        User: this._pageContextUser?.displayName || 'System',
        Details: dsError.message,
      }).catch(() => { /* fire-and-forget */ });
      return { projectCode, success: false, syncedAt: now, error: dsError.message };
    }
  }

  // SP-INDEX-REQUIRED: Project_Data_Mart → Status, Sector, Region, ProjectExecutive, OverallHealth
  async getDataMartRecords(filters?: IDataMartFilter): Promise<IProjectDataMart[]> {
    const cacheKey = CACHE_KEYS.DATA_MART + buildCacheKeySuffix(filters as unknown as Record<string, unknown>);
    const cached = cacheService.get<IProjectDataMart[]>(cacheKey);
    if (cached) return cached;

    performanceService.startMark('sp:getDataMartRecords');
    try {
      const filterParts: string[] = [];

      if (filters?.status) filterParts.push(`Status eq '${filters.status}'`);
      if (filters?.sector) filterParts.push(`Sector eq '${filters.sector}'`);
      if (filters?.region) filterParts.push(`Region eq '${filters.region}'`);
      if (filters?.projectExecutive) filterParts.push(`ProjectExecutive eq '${filters.projectExecutive}'`);
      if (filters?.overallHealth) filterParts.push(`OverallHealth eq '${filters.overallHealth}'`);
      if (filters?.hasAlerts) {
        filterParts.push('(HasUnbilledAlert eq true or HasScheduleAlert eq true or HasFeeErosionAlert eq true)');
      }

      let query = this.sp.web.lists
        .getByTitle(LIST_NAMES.PROJECT_DATA_MART)
        .items.top(5000);

      if (filterParts.length > 0) {
        query = query.filter(filterParts.join(' and '));
      }

      const items = await query();
      const result = items.map((item: Record<string, unknown>) => this.mapToDataMartRecord(item));
      cacheService.set(cacheKey, result, CACHE_TTL_MS);
      performanceService.endMark('sp:getDataMartRecords');
      return result;
    } catch (err) {
      performanceService.endMark('sp:getDataMartRecords');
      throw this.handleError('getDataMartRecords', err, { entityType: 'DataMart' });
    }
  }

  // SP-INDEX-REQUIRED: Project_Data_Mart → ProjectCode
  async getDataMartRecord(projectCode: string): Promise<IProjectDataMart | null> {
    const cacheKey = CACHE_KEYS.DATA_MART + '_' + projectCode;
    const cached = cacheService.get<IProjectDataMart>(cacheKey);
    if (cached) return cached;

    performanceService.startMark('sp:getDataMartRecord');
    try {
      const items = await this.sp.web.lists
        .getByTitle(LIST_NAMES.PROJECT_DATA_MART)
        .items.filter(`ProjectCode eq '${projectCode}'`).top(1)();

      if (items.length === 0) {
        performanceService.endMark('sp:getDataMartRecord');
        return null;
      }
      const result = this.mapToDataMartRecord(items[0] as Record<string, unknown>);
      cacheService.set(cacheKey, result, CACHE_TTL_MS);
      performanceService.endMark('sp:getDataMartRecord');
      return result;
    } catch (err) {
      performanceService.endMark('sp:getDataMartRecord');
      this.handleError('getDataMartRecord', err, {
        entityType: 'DataMart',
        entityId: projectCode,
        rethrow: false,
      });
      return null;
    }
  }

  // SP-INDEX-REQUIRED: Active_Projects_Portfolio → ProjectCode (inherited from syncToDataMart)
  // LOAD-TEST: CRITICAL N+1 resolved — was serial loop. At 200 projects × ~3s = ~10min.
  //   Batched to DATA_MART_SYNC_BATCH_SIZE-concurrent → ~2min at 200 projects.
  async triggerDataMartSync(): Promise<IDataMartSyncResult[]> {
    performanceService.startMark('sp:triggerDataMartSync');
    try {
      // Get all active project codes from portfolio
      const portfolioItems = await this.sp.web.lists
        .getByTitle(LIST_NAMES.ACTIVE_PROJECTS_PORTFOLIO)
        .items.select('ProjectCode').top(5000)();

      const projectCodes = portfolioItems
        .map((item: Record<string, unknown>) => item.ProjectCode as string)
        .filter(Boolean);

      const results: IDataMartSyncResult[] = [];
      for (let i = 0; i < projectCodes.length; i += DATA_MART_SYNC_BATCH_SIZE) {
        const batch = projectCodes.slice(i, i + DATA_MART_SYNC_BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map((code: string) => this.syncToDataMart(code))
        );
        results.push(...batchResults);
      }

      cacheService.removeByPrefix(CACHE_KEYS.DATA_MART);

      performanceService.endMark('sp:triggerDataMartSync');
      return results;
    } catch (err) {
      performanceService.endMark('sp:triggerDataMartSync');
      throw this.handleError('triggerDataMartSync', err, { entityType: 'DataMart' });
    }
  }

  private mapToDataMartRecord(item: Record<string, unknown>): IProjectDataMart {
    const col = PROJECT_DATA_MART_COLUMNS;
    return {
      id: (item.Id as number) || (item[col.id] as number) || 0,
      projectCode: (item[col.projectCode] as string) || '',
      jobNumber: (item[col.jobNumber] as string) || '',
      projectName: (item[col.projectName] as string) || '',
      status: (item[col.status] as ProjectStatus) || 'Construction',
      sector: (item[col.sector] as SectorType) || 'Commercial',
      region: (item[col.region] as string) || '',
      projectExecutive: (item[col.projectExecutive] as string) || '',
      projectExecutiveEmail: (item[col.projectExecutiveEmail] as string) || '',
      leadPM: (item[col.leadPM] as string) || '',
      leadPMEmail: (item[col.leadPMEmail] as string) || '',
      leadSuperintendent: (item[col.leadSuperintendent] as string) || '',
      leadSuperintendentEmail: (item[col.leadSuperintendentEmail] as string) || '',
      originalContract: (item[col.originalContract] as number) || 0,
      changeOrders: (item[col.changeOrders] as number) || 0,
      currentContractValue: (item[col.currentContractValue] as number) || 0,
      billingsToDate: (item[col.billingsToDate] as number) || 0,
      unbilledAmount: (item[col.unbilledAmount] as number) || 0,
      projectedFee: (item[col.projectedFee] as number) || 0,
      projectedFeePct: (item[col.projectedFeePct] as number) || 0,
      buyoutCommittedTotal: (item[col.buyoutCommittedTotal] as number) || 0,
      buyoutExecutedCount: (item[col.buyoutExecutedCount] as number) || 0,
      buyoutOpenCount: (item[col.buyoutOpenCount] as number) || 0,
      startDate: (item[col.startDate] as string) || null,
      substantialCompletionDate: (item[col.substantialCompletionDate] as string) || null,
      percentComplete: (item[col.percentComplete] as number) || 0,
      criticalPathItemCount: (item[col.criticalPathItemCount] as number) || 0,
      scheduleDaysVariance: (item[col.scheduleDaysVariance] as number) || 0,
      openQualityConcerns: (item[col.openQualityConcerns] as number) || 0,
      openSafetyConcerns: (item[col.openSafetyConcerns] as number) || 0,
      averageQScore: (item[col.averageQScore] as number) || 0,
      openWaiverCount: (item[col.openWaiverCount] as number) || 0,
      pendingCommitments: (item[col.pendingCommitments] as number) || 0,
      complianceStatus: (item[col.complianceStatus] as DataMartHealthStatus) || 'Green',
      overallHealth: (item[col.overallHealth] as DataMartHealthStatus) || 'Green',
      hasUnbilledAlert: !!(item[col.hasUnbilledAlert]),
      hasScheduleAlert: !!(item[col.hasScheduleAlert]),
      hasFeeErosionAlert: !!(item[col.hasFeeErosionAlert]),
      monthlyReviewStatus: (item[col.monthlyReviewStatus] as string) || '',
      lastMonthlyReviewDate: (item[col.lastMonthlyReviewDate] as string) || null,
      turnoverStatus: (item[col.turnoverStatus] as string) || '',
      pmpStatus: (item[col.pmpStatus] as string) || '',
      lastSyncDate: (item[col.lastSyncDate] as string) || '',
      lastSyncBy: (item[col.lastSyncBy] as string) || '',
    };
  }

  async sendSupportEmail(_to: string, _subject: string, _htmlBody: string, _fromUserEmail: string): Promise<void> {
    performanceService.startMark('sp:sendSupportEmail');
    // Graph API delegation — cannot implement via SP REST alone.
    // Will be fully implemented when GraphService is added.
    console.warn('[SP] sendSupportEmail requires Microsoft Graph API — not available via SP REST. No-op.');
    performanceService.endMark('sp:sendSupportEmail');
  }

  // SP-INDEX-REQUIRED: App_Context_Config → SiteURL
  async updateSupportConfig(config: Partial<ISupportConfig>): Promise<ISupportConfig> {
    performanceService.startMark('sp:updateSupportConfig');
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

    performanceService.endMark('sp:updateSupportConfig');
    return merged;
  }

  // ═══════════════════════════════════════════════════════════════════
  // ──── Schedule Module ────
  // ═══════════════════════════════════════════════════════════════════

  async getScheduleActivities(projectCode: string): Promise<IScheduleActivity[]> {
    performanceService.startMark('sp:getScheduleActivities');
    try {
      const web = this._getProjectWeb();
      const items = await web.lists
        .getByTitle(LIST_NAMES.SCHEDULE_ACTIVITIES)
        .items
        .filter(`ProjectCode eq '${projectCode}'`)
        .top(5000)();
      performanceService.endMark('sp:getScheduleActivities');
      return items.map((item: Record<string, unknown>) => this.mapToScheduleActivity(item));
    } catch (err) {
      performanceService.endMark('sp:getScheduleActivities');
      throw this.handleError('getScheduleActivities', err, { entityType: 'ScheduleActivity' });
    }
  }

  async importScheduleActivities(
    projectCode: string,
    activities: IScheduleActivity[],
    importMeta: Partial<IScheduleImport>
  ): Promise<IScheduleActivity[]> {
    performanceService.startMark('sp:importScheduleActivities');
    try {
      const web = this._getProjectWeb();
      const now = new Date().toISOString();
      const col = SCHEDULE_ACTIVITIES_COLUMNS;
      const icol = SCHEDULE_IMPORTS_COLUMNS;

      // Create import record
      const importResult = await web.lists
        .getByTitle(LIST_NAMES.SCHEDULE_IMPORTS)
        .items.add({
          [icol.projectCode]: projectCode,
          Title: importMeta.fileName || 'import.csv',
          [icol.format]: importMeta.format || 'P6-CSV',
          [icol.importDate]: now,
          [icol.importedBy]: importMeta.importedBy || 'Unknown',
          [icol.activityCount]: activities.length,
          [icol.matchedCount]: 0,
          [icol.ambiguousCount]: 0,
          [icol.newCount]: activities.length,
          [icol.orphanedFieldLinkCount]: 0,
          [icol.notes]: importMeta.notes || '',
        });
      const importId = (importResult as Record<string, unknown>).Id as number ||
        (importResult as Record<string, unknown>).id as number ||
        ((importResult as { data?: Record<string, unknown> }).data?.Id as number) || 0;

      // Batch-add activities in groups of 100
      const batchSize = 100;
      for (let i = 0; i < activities.length; i += batchSize) {
        const batch = web.createBatch();
        const list = web.lists.getByTitle(LIST_NAMES.SCHEDULE_ACTIVITIES);
        const chunk = activities.slice(i, i + batchSize);

        for (const a of chunk) {
          const externalActivityKey = a.externalActivityKey || `${projectCode}:${a.taskCode}`;
          const importFingerprint = a.importFingerprint || `${a.taskCode}|${a.activityName}|${a.wbsCode}`;
          list.items.inBatch(batch).add({
            Title: a.taskCode,
            [col.projectCode]: projectCode,
            [col.importId]: importId,
            [col.externalActivityKey]: externalActivityKey,
            [col.importFingerprint]: importFingerprint,
            [col.lineageStatus]: a.lineageStatus || 'unmatched',
            [col.wbsCode]: a.wbsCode,
            [col.activityName]: a.activityName,
            [col.activityType]: a.activityType,
            [col.status]: a.status,
            [col.originalDuration]: a.originalDuration,
            [col.remainingDuration]: a.remainingDuration,
            [col.actualDuration]: a.actualDuration,
            [col.baselineStartDate]: a.baselineStartDate,
            [col.baselineFinishDate]: a.baselineFinishDate,
            [col.plannedStartDate]: a.plannedStartDate,
            [col.plannedFinishDate]: a.plannedFinishDate,
            [col.actualStartDate]: a.actualStartDate,
            [col.actualFinishDate]: a.actualFinishDate,
            [col.remainingFloat]: a.remainingFloat,
            [col.freeFloat]: a.freeFloat,
            [col.predecessors]: JSON.stringify(a.predecessors),
            [col.successors]: JSON.stringify(a.successors),
            [col.successorDetails]: JSON.stringify(a.successorDetails),
            [col.resources]: a.resources,
            [col.calendarName]: a.calendarName,
            [col.primaryConstraint]: a.primaryConstraint,
            [col.secondaryConstraint]: a.secondaryConstraint,
            [col.isCritical]: a.isCritical,
            [col.percentComplete]: a.percentComplete,
            [col.startVarianceDays]: a.startVarianceDays,
            [col.finishVarianceDays]: a.finishVarianceDays,
            [col.deleteFlag]: a.deleteFlag,
          });
        }

        await batch.execute();
      }

      this.logAudit({
        Action: AuditAction.ScheduleActivitiesImported,
        EntityType: EntityType.ScheduleActivity,
        EntityId: String(importId),
        Details: `Imported ${activities.length} activities for ${projectCode}`,
      }).catch(() => { /* fire-and-forget */ });

      performanceService.endMark('sp:importScheduleActivities');
      return this.getScheduleActivities(projectCode);
    } catch (err) {
      performanceService.endMark('sp:importScheduleActivities');
      throw this.handleError('importScheduleActivities', err, { entityType: 'ScheduleActivity' });
    }
  }

  async updateScheduleActivity(
    projectCode: string,
    activityId: number,
    data: Partial<IScheduleActivity>
  ): Promise<IScheduleActivity> {
    performanceService.startMark('sp:updateScheduleActivity');
    try {
      const web = this._getProjectWeb();
      const col = SCHEDULE_ACTIVITIES_COLUMNS;
      const updateData: Record<string, unknown> = {};

      if (data.activityName !== undefined) updateData[col.activityName] = data.activityName;
      if (data.status !== undefined) updateData[col.status] = data.status;
      if (data.remainingDuration !== undefined) updateData[col.remainingDuration] = data.remainingDuration;
      if (data.actualDuration !== undefined) updateData[col.actualDuration] = data.actualDuration;
      if (data.actualStartDate !== undefined) updateData[col.actualStartDate] = data.actualStartDate;
      if (data.actualFinishDate !== undefined) updateData[col.actualFinishDate] = data.actualFinishDate;
      if (data.remainingFloat !== undefined) updateData[col.remainingFloat] = data.remainingFloat;
      if (data.freeFloat !== undefined) updateData[col.freeFloat] = data.freeFloat;
      if (data.isCritical !== undefined) updateData[col.isCritical] = data.isCritical;
      if (data.percentComplete !== undefined) updateData[col.percentComplete] = data.percentComplete;

      await web.lists
        .getByTitle(LIST_NAMES.SCHEDULE_ACTIVITIES)
        .items.getById(activityId)
        .update(updateData);

      const updated = await web.lists
        .getByTitle(LIST_NAMES.SCHEDULE_ACTIVITIES)
        .items.getById(activityId)();

      this.logAudit({
        Action: AuditAction.ScheduleActivityUpdated,
        EntityType: EntityType.ScheduleActivity,
        EntityId: String(activityId),
        Details: `Updated schedule activity ${data.activityName || activityId}`,
      }).catch(() => { /* fire-and-forget */ });

      performanceService.endMark('sp:updateScheduleActivity');
      return this.mapToScheduleActivity(updated);
    } catch (err) {
      performanceService.endMark('sp:updateScheduleActivity');
      throw this.handleError('updateScheduleActivity', err, { entityType: 'ScheduleActivity' });
    }
  }

  async deleteScheduleActivity(_projectCode: string, activityId: number): Promise<void> {
    performanceService.startMark('sp:deleteScheduleActivity');
    try {
      const web = this._getProjectWeb();
      await web.lists
        .getByTitle(LIST_NAMES.SCHEDULE_ACTIVITIES)
        .items.getById(activityId)
        .delete();

      this.logAudit({
        Action: AuditAction.ScheduleActivityDeleted,
        EntityType: EntityType.ScheduleActivity,
        EntityId: String(activityId),
        Details: `Deleted schedule activity ${activityId}`,
      }).catch(() => { /* fire-and-forget */ });

      performanceService.endMark('sp:deleteScheduleActivity');
    } catch (err) {
      performanceService.endMark('sp:deleteScheduleActivity');
      throw this.handleError('deleteScheduleActivity', err, { entityType: 'ScheduleActivity' });
    }
  }

  async getScheduleImports(projectCode: string): Promise<IScheduleImport[]> {
    performanceService.startMark('sp:getScheduleImports');
    try {
      const web = this._getProjectWeb();
      const items = await web.lists
        .getByTitle(LIST_NAMES.SCHEDULE_IMPORTS)
        .items
        .filter(`ProjectCode eq '${projectCode}'`)
        .orderBy('ImportDate', false)();
      performanceService.endMark('sp:getScheduleImports');
      return items.map((item: Record<string, unknown>) => this.mapToScheduleImport(item));
    } catch (err) {
      performanceService.endMark('sp:getScheduleImports');
      throw this.handleError('getScheduleImports', err, { entityType: 'ScheduleActivity' });
    }
  }

  async getScheduleMetrics(projectCode: string): Promise<IScheduleMetrics> {
    performanceService.startMark('sp:getScheduleMetrics');
    try {
      const activities = await this.getScheduleActivities(projectCode);
      const metrics = computeScheduleMetrics(activities);
      performanceService.endMark('sp:getScheduleMetrics');
      return metrics;
    } catch (err) {
      performanceService.endMark('sp:getScheduleMetrics');
      throw this.handleError('getScheduleMetrics', err, { entityType: 'ScheduleActivity' });
    }
  }

  async previewScheduleImportReconciliation(
    projectCode: string,
    activities: IScheduleActivity[],
    importMeta: Partial<IScheduleImport>
  ): Promise<IScheduleImportReconciliationResult> {
    const existing = await this.getScheduleActivities(projectCode);
    const existingByExternalKey = new Map(
      existing
        .filter(a => !!a.externalActivityKey)
        .map(a => [a.externalActivityKey as string, a]),
    );

    const previewItems = activities.map(a => {
      const externalKey = a.externalActivityKey || `${projectCode}:${a.taskCode}`;
      const matched = existingByExternalKey.get(externalKey);
      if (matched) {
        return {
          incomingExternalActivityKey: externalKey,
          incomingTaskCode: a.taskCode,
          incomingActivityName: a.activityName,
          confidenceScore: 1,
          reason: 'ExternalActivityKey match',
          existingActivityId: matched.id,
          existingExternalActivityKey: matched.externalActivityKey,
          action: 'matched' as const,
        };
      }
      return {
        incomingExternalActivityKey: externalKey,
        incomingTaskCode: a.taskCode,
        incomingActivityName: a.activityName,
        confidenceScore: 0.6,
        reason: 'No ExternalActivityKey match (new candidate)',
        action: 'new' as const,
      };
    });

    const matchedCount = previewItems.filter(i => i.action === 'matched').length;
    const newCount = previewItems.filter(i => i.action === 'new').length;
    return {
      projectCode,
      importId: importMeta.id || 0,
      matchedCount,
      ambiguousCount: 0,
      newCount,
      orphanedFieldLinkCount: 0,
      previewItems,
    };
  }

  async applyScheduleImportReconciliation(
    projectCode: string,
    activities: IScheduleActivity[],
    importMeta: Partial<IScheduleImport>,
    _approvedBy: string
  ): Promise<IScheduleImportReconciliationResult> {
    const preview = await this.previewScheduleImportReconciliation(projectCode, activities, importMeta);
    await this.importScheduleActivities(projectCode, activities, importMeta);
    return preview;
  }

  async getScheduleFieldLinks(projectCode: string): Promise<IScheduleFieldLink[]> {
    performanceService.startMark('sp:getScheduleFieldLinks');
    try {
      const web = this._getProjectWeb();
      const col = SCHEDULE_FIELD_LINKS_COLUMNS;
      const items = await web.lists
        .getByTitle(LIST_NAMES.SCHEDULE_FIELD_LINKS)
        .items
        .filter(`${col.projectCode} eq '${projectCode}'`)
        .top(5000)();
      performanceService.endMark('sp:getScheduleFieldLinks');
      return items.map((item: Record<string, unknown>) => ({
        id: item.Id as number,
        projectCode: (item[col.projectCode] as string) || '',
        externalActivityKey: (item[col.externalActivityKey] as string) || '',
        scheduleActivityId: item[col.scheduleActivityId] as number | undefined,
        fieldTaskId: (item[col.fieldTaskId] as string) || '',
        fieldTaskType: (item[col.fieldTaskType] as string) || '',
        confidenceScore: Number(item[col.confidenceScore] || 0),
        isManual: !!item[col.isManual],
        createdBy: (item[col.createdBy] as string) || '',
        createdAt: (item[col.createdAt] as string) || '',
        modifiedBy: (item[col.modifiedBy] as string) || '',
        modifiedAt: (item[col.modifiedAt] as string) || '',
      }));
    } catch (err) {
      performanceService.endMark('sp:getScheduleFieldLinks');
      throw this.handleError('getScheduleFieldLinks', err, { entityType: 'ScheduleFieldLink' });
    }
  }

  async createScheduleFieldLink(projectCode: string, data: Partial<IScheduleFieldLink>): Promise<IScheduleFieldLink> {
    performanceService.startMark('sp:createScheduleFieldLink');
    try {
      const web = this._getProjectWeb();
      const col = SCHEDULE_FIELD_LINKS_COLUMNS;
      const now = new Date().toISOString();
      const result = await web.lists
        .getByTitle(LIST_NAMES.SCHEDULE_FIELD_LINKS)
        .items.add({
          Title: data.externalActivityKey || 'Schedule Link',
          [col.projectCode]: projectCode,
          [col.externalActivityKey]: data.externalActivityKey || '',
          [col.scheduleActivityId]: data.scheduleActivityId ?? null,
          [col.fieldTaskId]: data.fieldTaskId || '',
          [col.fieldTaskType]: data.fieldTaskType || 'Unknown',
          [col.confidenceScore]: data.confidenceScore ?? 1,
          [col.isManual]: data.isManual ?? true,
          [col.createdBy]: data.createdBy || this._pageContextUser?.email || 'system',
          [col.createdAt]: now,
          [col.modifiedBy]: data.modifiedBy || this._pageContextUser?.email || 'system',
          [col.modifiedAt]: now,
        });
      const id = (result as Record<string, unknown>).Id as number ||
        (result as Record<string, unknown>).id as number ||
        ((result as { data?: Record<string, unknown> }).data?.Id as number) || 0;
      const createdItem = await web.lists
        .getByTitle(LIST_NAMES.SCHEDULE_FIELD_LINKS)
        .items.getById(id)();
      const created: IScheduleFieldLink = {
        id: createdItem.Id as number,
        projectCode: (createdItem[col.projectCode] as string) || projectCode,
        externalActivityKey: (createdItem[col.externalActivityKey] as string) || '',
        scheduleActivityId: createdItem[col.scheduleActivityId] as number | undefined,
        fieldTaskId: (createdItem[col.fieldTaskId] as string) || '',
        fieldTaskType: (createdItem[col.fieldTaskType] as string) || '',
        confidenceScore: Number(createdItem[col.confidenceScore] || 0),
        isManual: !!createdItem[col.isManual],
        createdBy: (createdItem[col.createdBy] as string) || '',
        createdAt: (createdItem[col.createdAt] as string) || '',
        modifiedBy: (createdItem[col.modifiedBy] as string) || '',
        modifiedAt: (createdItem[col.modifiedAt] as string) || '',
      };
      performanceService.endMark('sp:createScheduleFieldLink');
      return created;
    } catch (err) {
      performanceService.endMark('sp:createScheduleFieldLink');
      throw this.handleError('createScheduleFieldLink', err, { entityType: 'ScheduleFieldLink' });
    }
  }

  async updateScheduleFieldLink(projectCode: string, linkId: number, data: Partial<IScheduleFieldLink>): Promise<IScheduleFieldLink> {
    performanceService.startMark('sp:updateScheduleFieldLink');
    try {
      const web = this._getProjectWeb();
      const col = SCHEDULE_FIELD_LINKS_COLUMNS;
      const updateData: Record<string, unknown> = {};
      if (data.externalActivityKey !== undefined) updateData[col.externalActivityKey] = data.externalActivityKey;
      if (data.scheduleActivityId !== undefined) updateData[col.scheduleActivityId] = data.scheduleActivityId;
      if (data.fieldTaskId !== undefined) updateData[col.fieldTaskId] = data.fieldTaskId;
      if (data.fieldTaskType !== undefined) updateData[col.fieldTaskType] = data.fieldTaskType;
      if (data.confidenceScore !== undefined) updateData[col.confidenceScore] = data.confidenceScore;
      if (data.isManual !== undefined) updateData[col.isManual] = data.isManual;
      updateData[col.modifiedBy] = data.modifiedBy || this._pageContextUser?.email || 'system';
      updateData[col.modifiedAt] = new Date().toISOString();

      await web.lists.getByTitle(LIST_NAMES.SCHEDULE_FIELD_LINKS).items.getById(linkId).update(updateData);
      const updatedItem = await web.lists
        .getByTitle(LIST_NAMES.SCHEDULE_FIELD_LINKS)
        .items.getById(linkId)();
      const updated: IScheduleFieldLink = {
        id: updatedItem.Id as number,
        projectCode: (updatedItem[col.projectCode] as string) || projectCode,
        externalActivityKey: (updatedItem[col.externalActivityKey] as string) || '',
        scheduleActivityId: updatedItem[col.scheduleActivityId] as number | undefined,
        fieldTaskId: (updatedItem[col.fieldTaskId] as string) || '',
        fieldTaskType: (updatedItem[col.fieldTaskType] as string) || '',
        confidenceScore: Number(updatedItem[col.confidenceScore] || 0),
        isManual: !!updatedItem[col.isManual],
        createdBy: (updatedItem[col.createdBy] as string) || '',
        createdAt: (updatedItem[col.createdAt] as string) || '',
        modifiedBy: (updatedItem[col.modifiedBy] as string) || '',
        modifiedAt: (updatedItem[col.modifiedAt] as string) || '',
      };
      performanceService.endMark('sp:updateScheduleFieldLink');
      return updated;
    } catch (err) {
      performanceService.endMark('sp:updateScheduleFieldLink');
      throw this.handleError('updateScheduleFieldLink', err, { entityType: 'ScheduleFieldLink' });
    }
  }

  async deleteScheduleFieldLink(_projectCode: string, linkId: number): Promise<void> {
    performanceService.startMark('sp:deleteScheduleFieldLink');
    try {
      const web = this._getProjectWeb();
      await web.lists.getByTitle(LIST_NAMES.SCHEDULE_FIELD_LINKS).items.getById(linkId).delete();
      performanceService.endMark('sp:deleteScheduleFieldLink');
    } catch (err) {
      performanceService.endMark('sp:deleteScheduleFieldLink');
      throw this.handleError('deleteScheduleFieldLink', err, { entityType: 'ScheduleFieldLink' });
    }
  }

  async getPendingScheduleOps(projectCode: string): Promise<IScheduleConflict[]> {
    return [...(this.scheduleConflictsByProject[projectCode] || [])];
  }

  async replayPendingScheduleOps(projectCode: string, replayedBy: string): Promise<IScheduleConflict[]> {
    const now = new Date().toISOString();
    const updated = (this.scheduleConflictsByProject[projectCode] || []).map(c => ({
      ...c,
      resolvedAt: now,
      resolvedBy: replayedBy,
      resolution: c.resolution || 'replayed',
    }));
    this.scheduleConflictsByProject[projectCode] = updated;
    return [...updated];
  }

  async resolveScheduleConflict(projectCode: string, conflictId: string, resolution: string, resolvedBy: string): Promise<IScheduleConflict> {
    const conflicts = this.scheduleConflictsByProject[projectCode] || [];
    const idx = conflicts.findIndex(c => c.id === conflictId);
    if (idx === -1) {
      throw new Error(`Schedule conflict ${conflictId} not found`);
    }
    const resolved: IScheduleConflict = {
      ...conflicts[idx],
      resolution,
      resolvedBy,
      resolvedAt: new Date().toISOString(),
    };
    conflicts[idx] = resolved;
    this.scheduleConflictsByProject[projectCode] = conflicts;
    return resolved;
  }

  async createScheduleBaseline(projectCode: string, name: string, createdBy: string): Promise<{ baselineId: string; createdAt: string }> {
    const createdAt = new Date().toISOString();
    const baselineId = `bl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const existing = this.scheduleBaselinesByProject[projectCode] || [];
    this.scheduleBaselinesByProject[projectCode] = [...existing, { baselineId, name, createdBy, createdAt }];
    return { baselineId, createdAt };
  }

  async getScheduleBaselines(projectCode: string): Promise<Array<{ baselineId: string; name: string; createdBy: string; createdAt: string }>> {
    return [...(this.scheduleBaselinesByProject[projectCode] || [])];
  }

  async compareScheduleBaselines(
    projectCode: string,
    leftBaselineId: string,
    rightBaselineId: string
  ): Promise<{
    projectCode: string;
    leftBaselineId: string;
    rightBaselineId: string;
    changedActivities: number;
    addedActivities: number;
    removedActivities: number;
  }> {
    return {
      projectCode,
      leftBaselineId,
      rightBaselineId,
      changedActivities: 0,
      addedActivities: 0,
      removedActivities: 0,
    };
  }

  async runScheduleEngine(projectCode: string, activities: IScheduleActivity[]): Promise<IScheduleCpmResult> {
    return this.scheduleEngine.runCpm(projectCode, activities);
  }

  async runScheduleQualityChecks(projectCode: string, activities: IScheduleActivity[]): Promise<IScheduleQualityReport> {
    return this.scheduleEngine.runScheduleQualityChecks(projectCode, activities);
  }

  async runForensicAnalysis(projectCode: string, windows: IForensicWindow[]): Promise<IForensicAnalysisResult> {
    return this.scheduleEngine.runForensicAnalysis(projectCode, windows);
  }

  async runMonteCarlo(projectCode: string, config: IMonteCarloConfig): Promise<IMonteCarloResult> {
    const activities = await this.getScheduleActivities(projectCode);
    return this.scheduleEngine.runMonteCarlo(projectCode, activities, config);
  }

  async runResourceLeveling(projectCode: string, activities: IScheduleActivity[]): Promise<IResourceLevelingResult> {
    return this.scheduleEngine.runResourceLeveling(projectCode, activities);
  }

  async createScheduleScenario(projectCode: string, name: string, createdBy: string): Promise<IScheduleScenario> {
    const now = new Date().toISOString();
    const scenario: IScheduleScenario = {
      id: `sc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      projectCode,
      name,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };
    const current = this.scheduleScenariosByProject[projectCode] || [];
    this.scheduleScenariosByProject[projectCode] = [...current, scenario];
    this.scheduleScenarioActivities[`${projectCode}:${scenario.id}`] = (await this.getScheduleActivities(projectCode)).map(a => ({ ...a }));
    return { ...scenario };
  }

  async listScheduleScenarios(projectCode: string): Promise<IScheduleScenario[]> {
    return [...(this.scheduleScenariosByProject[projectCode] || [])];
  }

  async getScheduleScenario(projectCode: string, scenarioId: string): Promise<IScheduleScenario | null> {
    return (this.scheduleScenariosByProject[projectCode] || []).find(s => s.id === scenarioId) || null;
  }

  async saveScheduleScenarioActivities(projectCode: string, scenarioId: string, activities: IScheduleActivity[]): Promise<void> {
    this.scheduleScenarioActivities[`${projectCode}:${scenarioId}`] = activities.map(a => ({ ...a }));
    const scenarios = this.scheduleScenariosByProject[projectCode] || [];
    const idx = scenarios.findIndex(s => s.id === scenarioId);
    if (idx >= 0) {
      scenarios[idx] = { ...scenarios[idx], updatedAt: new Date().toISOString() };
      this.scheduleScenariosByProject[projectCode] = scenarios;
    }
  }

  async compareScheduleScenarios(projectCode: string, leftScenarioId: string, rightScenarioId: string): Promise<IScheduleScenarioDiff> {
    const left = this.scheduleScenarioActivities[`${projectCode}:${leftScenarioId}`] || [];
    const right = this.scheduleScenarioActivities[`${projectCode}:${rightScenarioId}`] || [];
    const leftKeys = new Set(left.map(a => a.externalActivityKey).filter(Boolean) as string[]);
    const rightKeys = new Set(right.map(a => a.externalActivityKey).filter(Boolean) as string[]);
    let changed = 0;
    right.forEach(r => {
      const l = left.find(a => a.externalActivityKey === r.externalActivityKey);
      if (l && (l.originalDuration !== r.originalDuration || l.remainingFloat !== r.remainingFloat || l.status !== r.status)) {
        changed++;
      }
    });
    const added = Array.from(rightKeys).filter(k => !leftKeys.has(k)).length;
    const removed = Array.from(leftKeys).filter(k => !rightKeys.has(k)).length;
    return {
      projectCode,
      leftScenarioId,
      rightScenarioId,
      changedActivities: changed,
      addedActivities: added,
      removedActivities: removed,
    };
  }

  async applyScheduleScenario(projectCode: string, scenarioId: string, approvedBy: string): Promise<{ importId: number }> {
    const activities = this.scheduleScenarioActivities[`${projectCode}:${scenarioId}`];
    if (!activities) throw new Error(`Scenario ${scenarioId} has no activities`);
    await this.importScheduleActivities(projectCode, activities, {
      fileName: `scenario-${scenarioId}.json`,
      importedBy: approvedBy,
      format: 'P6-CSV',
      notes: 'Applied from What-If scenario',
    });
    const imports = await this.getScheduleImports(projectCode);
    const lastImport = imports.sort((a, b) => b.id - a.id)[0];
    return { importId: lastImport?.id || 0 };
  }

  async computeScheduleEvm(projectCode: string): Promise<IScheduleEvmResult> {
    const activities = await this.getScheduleActivities(projectCode);
    const metrics = computeScheduleMetrics(activities);
    return this.scheduleEngine.computeEvm(projectCode, metrics);
  }

  async getPortfolioScheduleHealth(filters?: IDataMartFilter): Promise<IPortfolioScheduleHealth[]> {
    const records = await this.getDataMartRecords(filters);
    return Promise.all(records.map(async record => {
      const activities = await this.getScheduleActivities(record.projectCode);
      const metrics = computeScheduleMetrics(activities);
      const evm = this.scheduleEngine.computeEvm(record.projectCode, metrics);
      const fr = await this.computeFieldReadinessScore(record.projectCode);
      return {
        projectCode: record.projectCode,
        projectName: record.projectName,
        scheduleHealthScore: Math.max(0, Math.min(100, Math.round((metrics.percentComplete * 0.4 + (metrics.negativeFloatPercent ? 100 - metrics.negativeFloatPercent : 100) * 0.3 + (fr.score * 0.3)) * 10) / 10)),
        spi: evm.spi,
        cpi: evm.cpi,
        criticalCount: metrics.criticalActivityCount,
        negativeFloatCount: metrics.negativeFloatCount,
        fieldReadinessScore: fr.score,
      };
    }));
  }

  async computeFieldReadinessScore(projectCode: string): Promise<IFieldReadinessScore> {
    const [activities, links, constraints, permits] = await Promise.all([
      this.getScheduleActivities(projectCode),
      this.getScheduleFieldLinks(projectCode),
      this.getConstraints(projectCode),
      this.getPermits(projectCode),
    ]);
    return this.scheduleEngine.computeFieldReadinessScore(projectCode, activities, links, constraints, permits);
  }

  async getPortfolioFieldReadiness(filters?: IDataMartFilter): Promise<IFieldReadinessScore[]> {
    const records = await this.getDataMartRecords(filters);
    return Promise.all(records.map(r => this.computeFieldReadinessScore(r.projectCode)));
  }

  async getScheduleEngineRuntimeInfo(): Promise<IScheduleEngineRuntimeInfo> {
    return resolveScheduleEngineRuntime();
  }

  private mapToScheduleActivity(item: Record<string, unknown>): IScheduleActivity {
    const col = SCHEDULE_ACTIVITIES_COLUMNS;

    let predecessors: string[] = [];
    let successors: string[] = [];
    let successorDetails: IScheduleRelationship[] = [];
    try {
      const predRaw = item[col.predecessors];
      if (typeof predRaw === 'string' && predRaw) predecessors = JSON.parse(predRaw);
    } catch { /* default empty */ }
    try {
      const succRaw = item[col.successors];
      if (typeof succRaw === 'string' && succRaw) successors = JSON.parse(succRaw);
    } catch { /* default empty */ }
    try {
      const detailsRaw = item[col.successorDetails];
      if (typeof detailsRaw === 'string' && detailsRaw) successorDetails = JSON.parse(detailsRaw);
    } catch { /* default empty */ }

    return {
      id: item.Id as number,
      projectCode: item[col.projectCode] as string || '',
      importId: item[col.importId] as number | undefined,
      externalActivityKey: item[col.externalActivityKey] as string | undefined,
      importFingerprint: item[col.importFingerprint] as string | undefined,
      lineageStatus: item[col.lineageStatus] as IScheduleActivity['lineageStatus'] | undefined,
      taskCode: item[col.taskCode] as string || '',
      wbsCode: item[col.wbsCode] as string || '',
      activityName: item[col.activityName] as string || '',
      activityType: item[col.activityType] as string || 'Task Dependent',
      status: (item[col.status] as ActivityStatus) || 'Not Started',
      originalDuration: (item[col.originalDuration] as number) || 0,
      remainingDuration: (item[col.remainingDuration] as number) || 0,
      actualDuration: (item[col.actualDuration] as number) || 0,
      baselineStartDate: item[col.baselineStartDate] as string | null,
      baselineFinishDate: item[col.baselineFinishDate] as string | null,
      plannedStartDate: item[col.plannedStartDate] as string | null,
      plannedFinishDate: item[col.plannedFinishDate] as string | null,
      actualStartDate: item[col.actualStartDate] as string | null,
      actualFinishDate: item[col.actualFinishDate] as string | null,
      remainingFloat: item[col.remainingFloat] as number | null,
      freeFloat: item[col.freeFloat] as number | null,
      predecessors,
      successors,
      successorDetails,
      resources: item[col.resources] as string || '',
      calendarName: item[col.calendarName] as string || '',
      primaryConstraint: item[col.primaryConstraint] as string || '',
      secondaryConstraint: item[col.secondaryConstraint] as string || '',
      isCritical: !!(item[col.isCritical]),
      percentComplete: (item[col.percentComplete] as number) || 0,
      startVarianceDays: item[col.startVarianceDays] as number | null,
      finishVarianceDays: item[col.finishVarianceDays] as number | null,
      deleteFlag: !!(item[col.deleteFlag]),
      createdDate: item.Created as string || '',
      modifiedDate: item.Modified as string || '',
    };
  }

  private mapToScheduleImport(item: Record<string, unknown>): IScheduleImport {
    const col = SCHEDULE_IMPORTS_COLUMNS;
    return {
      id: item.Id as number,
      projectCode: item[col.projectCode] as string || '',
      fileName: item[col.fileName] as string || '',
      format: (item[col.format] as IScheduleImport['format']) || 'P6-CSV',
      importDate: item[col.importDate] as string || '',
      importedBy: item[col.importedBy] as string || '',
      activityCount: (item[col.activityCount] as number) || 0,
      matchedCount: (item[col.matchedCount] as number) || 0,
      ambiguousCount: (item[col.ambiguousCount] as number) || 0,
      newCount: (item[col.newCount] as number) || 0,
      orphanedFieldLinkCount: (item[col.orphanedFieldLinkCount] as number) || 0,
      notes: item[col.notes] as string || '',
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // ──── Constraints Log ────
  // ═══════════════════════════════════════════════════════════════════

  async getAllConstraints(): Promise<IConstraintLog[]> {
    const cacheKey = CACHE_KEYS.CONSTRAINTS + '_all';
    const cached = cacheService.get<IConstraintLog[]>(cacheKey);
    if (cached) return cached;

    performanceService.startMark('sp:getAllConstraints');
    try {
      // Get active project codes from Data Mart
      const dmItems = await this.sp.web.lists
        .getByTitle(LIST_NAMES.PROJECT_DATA_MART)
        .items.select('ProjectCode').top(500)();
      const projectCodes = dmItems
        .map((i: Record<string, unknown>) => i.ProjectCode as string)
        .filter(Boolean);

      // Batch-fetch constraints per project (groups of 5)
      const allConstraints: IConstraintLog[] = [];
      for (let i = 0; i < projectCodes.length; i += 5) {
        const batch = projectCodes.slice(i, i + 5);
        const results = await Promise.all(
          batch.map((code: string) => this.getConstraints(code).catch(() => [] as IConstraintLog[]))
        );
        results.forEach(r => allConstraints.push(...r));
      }

      cacheService.set(cacheKey, allConstraints, CACHE_TTL_MS);
      performanceService.endMark('sp:getAllConstraints');
      return allConstraints;
    } catch (err) {
      performanceService.endMark('sp:getAllConstraints');
      throw this.handleError('getAllConstraints', err, { entityType: 'Constraint' });
    }
  }

  async getConstraints(projectCode: string): Promise<IConstraintLog[]> {
    performanceService.startMark('sp:getConstraints');
    try {
      const web = this._getProjectWeb();
      const items = await web.lists
        .getByTitle(LIST_NAMES.CONSTRAINTS_LOG)
        .items
        .filter(`ProjectCode eq '${projectCode}'`)
        .top(5000)();
      performanceService.endMark('sp:getConstraints');
      return items.map((item: Record<string, unknown>) => this.mapToConstraintLog(item));
    } catch (err) {
      performanceService.endMark('sp:getConstraints');
      throw this.handleError('getConstraints', err, { entityType: 'Constraint' });
    }
  }

  async getConstraintsPage(request: ICursorPageRequest): Promise<ICursorPageResult<IConstraintLog>> {
    const projectCode = request.projectCode ?? String(request.filters?.projectCode ?? '');
    const rows = await this.getConstraints(projectCode);
    return this.paginateArray(rows, request);
  }

  async addConstraint(projectCode: string, constraint: Partial<IConstraintLog>): Promise<IConstraintLog> {
    performanceService.startMark('sp:addConstraint');
    try {
      const web = this._getProjectWeb();
      const col = CONSTRAINTS_LOG_COLUMNS;

      // Get next constraint number
      const existing = await web.lists
        .getByTitle(LIST_NAMES.CONSTRAINTS_LOG)
        .items
        .filter(`ProjectCode eq '${projectCode}'`)
        .orderBy('ConstraintNumber', false)
        .top(1)();
      const nextNumber = existing.length > 0 ? ((existing[0] as Record<string, unknown>).ConstraintNumber as number || 0) + 1 : 1;

      const result = await web.lists
        .getByTitle(LIST_NAMES.CONSTRAINTS_LOG)
        .items.add({
          [col.projectCode]: projectCode,
          [col.constraintNumber]: nextNumber,
          [col.category]: constraint.category || 'Other',
          [col.description]: constraint.description || '',
          [col.status]: constraint.status || 'Open',
          [col.assignedTo]: constraint.assignedTo || '',
          [col.dateIdentified]: constraint.dateIdentified || new Date().toISOString(),
          [col.dueDate]: constraint.dueDate || null,
          [col.dateClosed]: constraint.dateClosed || null,
          [col.reference]: constraint.reference || '',
          [col.closureDocument]: constraint.closureDocument || '',
          [col.budgetImpactCost]: constraint.budgetImpactCost || 0,
          [col.comments]: constraint.comments || '',
        });

      this.logAudit({
        Action: AuditAction.ConstraintUpdated,
        EntityType: EntityType.Constraint,
        EntityId: String((result as Record<string, unknown>).Id || (result as Record<string, unknown>).id || 0),
        Details: `Added constraint #${nextNumber} for ${projectCode}`,
      });

      performanceService.endMark('sp:addConstraint');
      return this.mapToConstraintLog(result as Record<string, unknown>);
    } catch (err) {
      performanceService.endMark('sp:addConstraint');
      throw this.handleError('addConstraint', err, { entityType: 'Constraint' });
    }
  }

  async updateConstraint(projectCode: string, constraintId: number, data: Partial<IConstraintLog>): Promise<IConstraintLog> {
    performanceService.startMark('sp:updateConstraint');
    try {
      const web = this._getProjectWeb();
      const col = CONSTRAINTS_LOG_COLUMNS;
      const updates: Record<string, unknown> = {};

      if (data.category !== undefined) updates[col.category] = data.category;
      if (data.description !== undefined) updates[col.description] = data.description;
      if (data.status !== undefined) updates[col.status] = data.status;
      if (data.assignedTo !== undefined) updates[col.assignedTo] = data.assignedTo;
      if (data.dateIdentified !== undefined) updates[col.dateIdentified] = data.dateIdentified;
      if (data.dueDate !== undefined) updates[col.dueDate] = data.dueDate;
      if (data.dateClosed !== undefined) updates[col.dateClosed] = data.dateClosed;
      if (data.reference !== undefined) updates[col.reference] = data.reference;
      if (data.closureDocument !== undefined) updates[col.closureDocument] = data.closureDocument;
      if (data.budgetImpactCost !== undefined) updates[col.budgetImpactCost] = data.budgetImpactCost;
      if (data.comments !== undefined) updates[col.comments] = data.comments;

      await web.lists
        .getByTitle(LIST_NAMES.CONSTRAINTS_LOG)
        .items.getById(constraintId)
        .update(updates);

      this.logAudit({
        Action: AuditAction.ConstraintUpdated,
        EntityType: EntityType.Constraint,
        EntityId: String(constraintId),
        Details: `Updated constraint ${constraintId} for ${projectCode}`,
      });

      // Re-read the updated item
      const item = await web.lists
        .getByTitle(LIST_NAMES.CONSTRAINTS_LOG)
        .items.getById(constraintId)();

      performanceService.endMark('sp:updateConstraint');
      return this.mapToConstraintLog(item as unknown as Record<string, unknown>);
    } catch (err) {
      performanceService.endMark('sp:updateConstraint');
      throw this.handleError('updateConstraint', err, { entityType: 'Constraint' });
    }
  }

  async removeConstraint(projectCode: string, constraintId: number): Promise<void> {
    performanceService.startMark('sp:removeConstraint');
    try {
      const web = this._getProjectWeb();
      await web.lists
        .getByTitle(LIST_NAMES.CONSTRAINTS_LOG)
        .items.getById(constraintId)
        .delete();

      this.logAudit({
        Action: AuditAction.ConstraintUpdated,
        EntityType: EntityType.Constraint,
        EntityId: String(constraintId),
        Details: `Removed constraint ${constraintId} from ${projectCode}`,
      });

      performanceService.endMark('sp:removeConstraint');
    } catch (err) {
      performanceService.endMark('sp:removeConstraint');
      throw this.handleError('removeConstraint', err, { entityType: 'Constraint' });
    }
  }

  private mapToConstraintLog(item: Record<string, unknown>): IConstraintLog {
    const col = CONSTRAINTS_LOG_COLUMNS;
    return {
      id: (item.Id as number) || (item.id as number) || 0,
      projectCode: item[col.projectCode] as string || '',
      constraintNumber: (item[col.constraintNumber] as number) || 0,
      category: (item[col.category] as IConstraintLog['category']) || 'Other',
      description: item[col.description] as string || '',
      status: (item[col.status] as IConstraintLog['status']) || 'Open',
      assignedTo: item[col.assignedTo] as string || '',
      dateIdentified: item[col.dateIdentified] as string || '',
      dueDate: item[col.dueDate] as string || '',
      dateClosed: item[col.dateClosed] as string || undefined,
      reference: item[col.reference] as string || undefined,
      closureDocument: item[col.closureDocument] as string || undefined,
      budgetImpactCost: item[col.budgetImpactCost] as number || undefined,
      comments: item[col.comments] as string || undefined,
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // ──── Permits Log ────
  // ═══════════════════════════════════════════════════════════════════

  async getPermits(projectCode: string): Promise<IPermit[]> {
    performanceService.startMark('sp:getPermits');
    try {
      const web = this._getProjectWeb();
      const items = await web.lists
        .getByTitle(LIST_NAMES.PERMITS_LOG)
        .items
        .filter(`ProjectCode eq '${projectCode}'`)
        .top(5000)();
      performanceService.endMark('sp:getPermits');
      return items.map((item: Record<string, unknown>) => this.mapToPermit(item));
    } catch (err) {
      performanceService.endMark('sp:getPermits');
      throw this.handleError('getPermits', err, { entityType: 'Permit' });
    }
  }

  async getPermitsPage(request: ICursorPageRequest): Promise<ICursorPageResult<IPermit>> {
    const projectCode = request.projectCode ?? String(request.filters?.projectCode ?? '');
    const rows = await this.getPermits(projectCode);
    return this.paginateArray(rows, request);
  }

  async addPermit(projectCode: string, permit: Partial<IPermit>): Promise<IPermit> {
    performanceService.startMark('sp:addPermit');
    try {
      const web = this._getProjectWeb();
      const col = PERMITS_LOG_COLUMNS;

      const result = await web.lists
        .getByTitle(LIST_NAMES.PERMITS_LOG)
        .items.add({
          [col.projectCode]: projectCode,
          [col.refNumber]: permit.refNumber || '',
          [col.parentRefNumber]: permit.parentRefNumber || '',
          [col.location]: permit.location || '',
          [col.type]: permit.type || 'PRIMARY',
          [col.permitNumber]: permit.permitNumber || 'Not Issued',
          [col.description]: permit.description || '',
          [col.responsibleContractor]: permit.responsibleContractor || '',
          [col.address]: permit.address || '',
          [col.dateRequired]: permit.dateRequired || null,
          [col.dateSubmitted]: permit.dateSubmitted || null,
          [col.dateReceived]: permit.dateReceived || null,
          [col.dateExpires]: permit.dateExpires || null,
          [col.status]: permit.status || 'Pending Application',
          [col.ahj]: permit.ahj || '',
          [col.comments]: permit.comments || '',
        });

      this.logAudit({
        Action: AuditAction.PermitUpdated,
        EntityType: EntityType.Permit,
        EntityId: String((result as Record<string, unknown>).Id || (result as Record<string, unknown>).id || 0),
        Details: `Added permit ${permit.refNumber || 'new'} for ${projectCode}`,
      });

      performanceService.endMark('sp:addPermit');
      return this.mapToPermit(result as Record<string, unknown>);
    } catch (err) {
      performanceService.endMark('sp:addPermit');
      throw this.handleError('addPermit', err, { entityType: 'Permit' });
    }
  }

  async updatePermit(projectCode: string, permitId: number, data: Partial<IPermit>): Promise<IPermit> {
    performanceService.startMark('sp:updatePermit');
    try {
      const web = this._getProjectWeb();
      const col = PERMITS_LOG_COLUMNS;
      const updates: Record<string, unknown> = {};

      if (data.refNumber !== undefined) updates[col.refNumber] = data.refNumber;
      if (data.parentRefNumber !== undefined) updates[col.parentRefNumber] = data.parentRefNumber;
      if (data.location !== undefined) updates[col.location] = data.location;
      if (data.type !== undefined) updates[col.type] = data.type;
      if (data.permitNumber !== undefined) updates[col.permitNumber] = data.permitNumber;
      if (data.description !== undefined) updates[col.description] = data.description;
      if (data.responsibleContractor !== undefined) updates[col.responsibleContractor] = data.responsibleContractor;
      if (data.address !== undefined) updates[col.address] = data.address;
      if (data.dateRequired !== undefined) updates[col.dateRequired] = data.dateRequired;
      if (data.dateSubmitted !== undefined) updates[col.dateSubmitted] = data.dateSubmitted;
      if (data.dateReceived !== undefined) updates[col.dateReceived] = data.dateReceived;
      if (data.dateExpires !== undefined) updates[col.dateExpires] = data.dateExpires;
      if (data.status !== undefined) updates[col.status] = data.status;
      if (data.ahj !== undefined) updates[col.ahj] = data.ahj;
      if (data.comments !== undefined) updates[col.comments] = data.comments;

      await web.lists
        .getByTitle(LIST_NAMES.PERMITS_LOG)
        .items.getById(permitId)
        .update(updates);

      this.logAudit({
        Action: AuditAction.PermitUpdated,
        EntityType: EntityType.Permit,
        EntityId: String(permitId),
        Details: `Updated permit ${permitId} for ${projectCode}`,
      });

      // Re-read the updated item
      const item = await web.lists
        .getByTitle(LIST_NAMES.PERMITS_LOG)
        .items.getById(permitId)();

      performanceService.endMark('sp:updatePermit');
      return this.mapToPermit(item as unknown as Record<string, unknown>);
    } catch (err) {
      performanceService.endMark('sp:updatePermit');
      throw this.handleError('updatePermit', err, { entityType: 'Permit' });
    }
  }

  async removePermit(projectCode: string, permitId: number): Promise<void> {
    performanceService.startMark('sp:removePermit');
    try {
      const web = this._getProjectWeb();
      await web.lists
        .getByTitle(LIST_NAMES.PERMITS_LOG)
        .items.getById(permitId)
        .delete();

      this.logAudit({
        Action: AuditAction.PermitUpdated,
        EntityType: EntityType.Permit,
        EntityId: String(permitId),
        Details: `Removed permit ${permitId} from ${projectCode}`,
      });

      performanceService.endMark('sp:removePermit');
    } catch (err) {
      performanceService.endMark('sp:removePermit');
      throw this.handleError('removePermit', err, { entityType: 'Permit' });
    }
  }

  private mapToPermit(item: Record<string, unknown>): IPermit {
    const col = PERMITS_LOG_COLUMNS;
    return {
      id: (item.Id as number) || (item.id as number) || 0,
      projectCode: item[col.projectCode] as string || '',
      refNumber: item[col.refNumber] as string || '',
      parentRefNumber: item[col.parentRefNumber] as string || undefined,
      location: item[col.location] as string || '',
      type: (item[col.type] as IPermit['type']) || 'PRIMARY',
      permitNumber: item[col.permitNumber] as string || '',
      description: item[col.description] as string || '',
      responsibleContractor: item[col.responsibleContractor] as string || '',
      address: item[col.address] as string || '',
      dateRequired: item[col.dateRequired] as string || undefined,
      dateSubmitted: item[col.dateSubmitted] as string || undefined,
      dateReceived: item[col.dateReceived] as string || undefined,
      dateExpires: item[col.dateExpires] as string || undefined,
      status: (item[col.status] as IPermit['status']) || 'Pending Application',
      ahj: item[col.ahj] as string || '',
      comments: item[col.comments] as string || undefined,
    };
  }
}

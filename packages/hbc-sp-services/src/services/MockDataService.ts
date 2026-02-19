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

import {
  ILead,
  ILeadFormData,
  IGoNoGoScorecard,
  IScorecardApprovalCycle,
  IScorecardApprovalStep,
  IScorecardVersion,
  IPersonAssignment,
  IEstimatingTracker,
  IRole,
  ICurrentUser,
  IFeatureFlag,
  IMeeting,
  ICalendarAvailability,
  INotification,
  IAuditEntry,
  IProvisioningLog,
  IFieldDefinition,
  IDeliverable,
  ITeamMember,
  IInterviewPrep,
  IContractInfo,
  ITurnoverItem,
  ICloseoutItem,
  ILossAutopsy,
  IStartupChecklistItem,
  IInternalMatrixTask,
  ITeamRoleAssignment,
  IOwnerContractArticle,
  ISubContractClause,
  IMarketingProjectRecord,
  IRiskCostManagement,
  IRiskCostItem,
  IQualityConcern,
  ISafetyConcern,
  IProjectScheduleCriticalPath,
  ICriticalPathItem,
  ISuperintendentPlan,
  ISuperintendentPlanSection,
  ILessonLearned,
  IProjectManagementPlan,
  IDivisionApprover,
  IPMPBoilerplateSection,
  IMonthlyProjectReview,
  IMonthlyChecklistItem,
  IMonthlyFollowUp,
  IChecklistActivityEntry,
  IPMPSignature,
  IPMPApprovalCycle,
  IPMPApprovalStep,
  GoNoGoDecision,
  ScorecardStatus,
  Stage,
  RoleName,
  AuditAction,
  EntityType,
  NotificationType,
  MeetingType,
  ProvisioningStatus,
  JobNumberRequestStatus,
  ICommitmentApproval,
  IContractTrackingApproval,
  ContractTrackingStep,
  ContractTrackingStatus,
  IActiveProject,
  IPortfolioSummary,
  IPersonnelWorkload,
  ProjectStatus,
  SectorType,
  DEFAULT_ALERT_THRESHOLDS,
  IProjectDataMart,
  IDataMartSyncResult,
  IDataMartFilter,
  DataMartHealthStatus,
  IScheduleActivity,
  IScheduleImport,
  IScheduleMetrics,
} from '../models';

import { IJobNumberRequest } from '../models/IJobNumberRequest';
import { IProjectType } from '../models/IProjectType';
import { IStandardCostCode } from '../models/IStandardCostCode';

import { ROLE_PERMISSIONS } from '../utils/permissions';
import { getRecommendedDecision, calculateTotalScore } from '../utils/scoreCalculator';
import { computeScheduleMetrics } from '../utils/scheduleMetrics';

import mockLeads from '../mock/leads.json';
import mockScorecards from '../mock/scorecards.json';
import mockEstimating from '../mock/estimating.json';
import mockUsers from '../mock/users.json';
import mockFeatureFlags from '../mock/featureFlags.json';
import mockCalendarAvailability from '../mock/calendarAvailability.json';
import mockTeamMembers from '../mock/teamMembers.json';
import mockDeliverables from '../mock/deliverables.json';
import mockTurnoverItems from '../mock/turnoverItems.json';
import mockCloseoutItems from '../mock/closeoutItems.json';
import mockStartupChecklist from '../mock/startupChecklist.json';
import mockInternalMatrix from '../mock/internalMatrix.json';
import mockOwnerContractMatrix from '../mock/ownerContractMatrix.json';
import mockSubContractMatrix from '../mock/subContractMatrix.json';
import mockMarketingRecords from '../mock/marketingProjectRecords.json';
import mockRiskCost from '../mock/riskCostManagement.json';
import mockQualityConcerns from '../mock/qualityConcerns.json';
import mockSafetyConcerns from '../mock/safetyConcerns.json';
import mockSchedules from '../mock/projectScheduleCriticalPath.json';
import mockSuperPlan from '../mock/superintendentPlan.json';
import mockLessonsLearned from '../mock/lessonsLearned.json';
import mockPMPs from '../mock/projectManagementPlans.json';
import mockDivisionApprovers from '../mock/divisionApprovers.json';
import mockMonthlyReviews from '../mock/monthlyProjectReviews.json';
import mockBoilerplate from '../mock/pmpBoilerplate.json';
import mockJobNumberRequests from '../mock/jobNumberRequests.json';
import mockProjectTypes from '../mock/projectTypes.json';
import mockStandardCostCodes from '../mock/standardCostCodes.json';
import mockEstimatingKickoffs from '../mock/estimatingKickoffs.json';
import mockLossAutopsies from '../mock/lossAutopsies.json';
import mockBuyoutEntries from '../mock/buyoutEntries.json';
import mockScheduleActivities from '../mock/scheduleActivities.json';
import mockScheduleImports from '../mock/scheduleImports.json';
import mockConstraintLogs from '../mock/constraintLogs.json';
import mockPermits from '../mock/permits.json';
import templateSiteConfigData from '../mock/templateSiteConfig.json';
import templateRegistryData from '../mock/templateRegistry.json';
import { createEstimatingKickoffTemplate } from '../utils/estimatingKickoffTemplate';
import { STANDARD_BUYOUT_DIVISIONS } from '../utils/buyoutTemplate';
import { DEFAULT_HUB_SITE_URL } from '../utils/constants';
import { IEstimatingKickoff, IEstimatingKickoffItem, IKeyPersonnelEntry } from '../models/IEstimatingKickoff';
import { IBuyoutEntry, EVerifyStatus } from '../models/IBuyoutEntry';
import { IConstraintLog } from '../models/IConstraintLog';
import { IPermit } from '../models/IPermit';
import { ITemplateRegistry, ITemplateSiteConfig, ITemplateManifestLog } from '../models/ITemplateManifest';
import { ITemplateFileMetadata } from './IDataService';
import { IComplianceEntry, IComplianceSummary, IComplianceLogFilter } from '../models/IComplianceSummary';
import { IWorkflowDefinition, IWorkflowStep, IConditionalAssignment, IWorkflowStepOverride, IResolvedWorkflowStep } from '../models/IWorkflowDefinition';
import { ITurnoverAgenda, ITurnoverProjectHeader, ITurnoverPrerequisite, ITurnoverEstimateOverview, ITurnoverDiscussionItem, ITurnoverSubcontractor, ITurnoverExhibit, ITurnoverSignature, ITurnoverAttachment } from '../models/ITurnoverAgenda';
import { IActionInboxItem } from '../models/IActionInbox';
import { IPermissionTemplate, ISecurityGroupMapping, IProjectTeamAssignment, IResolvedPermissions } from '../models/IPermissionTemplate';
import { PermissionLevel, WorkflowKey, StepAssignmentType, ConditionField, TurnoverStatus, WorkflowActionType, ActionPriority } from '../models/enums';
import { resolveToolPermissions, TOOL_DEFINITIONS } from '../utils/toolPermissionMap';
import mockWorkflowDefinitions from '../mock/workflowDefinitions.json';
import mockWorkflowStepOverrides from '../mock/workflowStepOverrides.json';
import mockTurnoverAgendas from '../mock/turnoverAgendas.json';
import { IEnvironmentConfig, EnvironmentTier } from '../models/IEnvironmentConfig';
import { ISectorDefinition } from '../models/ISectorDefinition';
import mockPermissionTemplates from '../mock/permissionTemplates.json';
import mockSecurityGroupMappings from '../mock/securityGroupMappings.json';
import mockProjectTeamAssignments from '../mock/projectTeamAssignments.json';
import mockEnvironmentConfig from '../mock/environmentConfig.json';
import mockSectorDefinitions from '../mock/sectorDefinitions.json';
import mockAssignmentMappings from '../mock/assignmentMappings.json';
import { IAssignmentMapping } from '../models/IAssignmentMapping';
import { IPerformanceLog, IPerformanceQueryOptions, IPerformanceSummary } from '../models/IPerformanceLog';
import { IHelpGuide, ISupportConfig } from '../models/IHelpGuide';
import mockHelpGuides from '../mock/helpGuides.json';
import { DEFAULT_PREREQUISITES, DEFAULT_DISCUSSION_ITEMS, DEFAULT_EXHIBITS, DEFAULT_SIGNATURES, TURNOVER_SIGNATURE_AFFIDAVIT } from '../utils/turnoverAgendaTemplate';

const delay = (): Promise<void> => new Promise(r => setTimeout(r, 50));

export class MockDataService implements IDataService {
  private leads: ILead[];
  private scorecards: IGoNoGoScorecard[];
  private estimatingRecords: IEstimatingTracker[];
  private users: typeof mockUsers;
  private featureFlags: IFeatureFlag[];
  private calendarAvailability: ICalendarAvailability[];
  private meetings: IMeeting[];
  private notifications: INotification[];
  private auditLog: IAuditEntry[];
  private provisioningLogs: IProvisioningLog[];
  private teamMembers: ITeamMember[];
  private deliverables: IDeliverable[];
  private interviewPreps: IInterviewPrep[];
  private contractInfos: IContractInfo[];
  private turnoverItems: ITurnoverItem[];
  private closeoutItems: ICloseoutItem[];
  private lossAutopsies: ILossAutopsy[];
  private checklistItems: IStartupChecklistItem[];
  private internalMatrixTasks: IInternalMatrixTask[];
  private teamRoleAssignments: ITeamRoleAssignment[];
  private ownerContractArticles: IOwnerContractArticle[];
  private subContractClauses: ISubContractClause[];
  private marketingRecords: IMarketingProjectRecord[];
  private riskCostRecords: IRiskCostManagement[];
  private riskCostItems: IRiskCostItem[];
  private qualityConcerns: IQualityConcern[];
  private safetyConcerns: ISafetyConcern[];
  private scheduleRecords: IProjectScheduleCriticalPath[];
  private criticalPathItems: ICriticalPathItem[];
  private superintendentPlans: ISuperintendentPlan[];
  private superintendentPlanSections: ISuperintendentPlanSection[];
  private lessonsLearned: ILessonLearned[];
  private lessonsLearnedHub: ILessonLearned[];
  private pmps: IProjectManagementPlan[];
  private pmpSignatures: IPMPSignature[];
  private pmpApprovalCycles: IPMPApprovalCycle[];
  private pmpApprovalSteps: IPMPApprovalStep[];
  private divisionApprovers: IDivisionApprover[];
  private monthlyReviews: IMonthlyProjectReview[];
  private monthlyChecklistItems: IMonthlyChecklistItem[];
  private monthlyFollowUps: IMonthlyFollowUp[];
  private boilerplate: IPMPBoilerplateSection[];
  private jobNumberRequests: IJobNumberRequest[];
  private estimatingKickoffs: IEstimatingKickoff[];
  private estimatingKickoffItems: IEstimatingKickoffItem[];
  private checklistActivityLog: IChecklistActivityEntry[];
  private buyoutEntries: IBuyoutEntry[];
  private scheduleActivities: IScheduleActivity[];
  private scheduleImports: IScheduleImport[];
  private activeProjects: IActiveProject[];
  private scorecardApprovalCycles: IScorecardApprovalCycle[];
  private scorecardApprovalSteps: IScorecardApprovalStep[];
  private scorecardVersions: IScorecardVersion[];
  private workflowDefinitions: IWorkflowDefinition[];
  private workflowStepOverrides: IWorkflowStepOverride[];
  private turnoverAgendas: ITurnoverAgenda[];
  private turnoverHeaders: ITurnoverProjectHeader[];
  private turnoverEstimateOverviews: ITurnoverEstimateOverview[];
  private turnoverPrerequisites: ITurnoverPrerequisite[];
  private turnoverDiscussionItems: ITurnoverDiscussionItem[];
  private turnoverSubcontractors: ITurnoverSubcontractor[];
  private turnoverExhibits: ITurnoverExhibit[];
  private turnoverSignatures: ITurnoverSignature[];
  private turnoverAttachments: ITurnoverAttachment[];
  private hubSiteUrl: string;
  private permissionTemplates: IPermissionTemplate[];
  private securityGroupMappings: ISecurityGroupMapping[];
  private projectTeamAssignments: IProjectTeamAssignment[];
  private performanceLogs: IPerformanceLog[];
  private helpGuides: IHelpGuide[];
  private dataMartRecords: IProjectDataMart[];
  private constraintLogs: IConstraintLog[];
  private permits: IPermit[];
  private nextId: number;

  // Dev-only: overridable role for the RoleSwitcher toolbar
  private _currentRole: RoleName = RoleName.ExecutiveLeadership;
  private _isDevSuperAdmin: boolean = false;

  /** Set the mock user role (called by the dev RoleSwitcher). */
  public setCurrentUserRole(role: RoleName): void {
    this._currentRole = role;
  }

  /** Enable/disable dev super-admin mode (union of ALL role permissions). */
  public setDevSuperAdminMode(enabled: boolean): void {
    this._isDevSuperAdmin = enabled;
  }

  /** Get all mock users (dev-only). */
  public getMockUsers(): Array<{ id: number; displayName: string; email: string; roles: string[]; region: string; department: string }> {
    return this.users;
  }

  /** Update a mock user's roles (dev-only). */
  public updateMockUserRoles(userId: number, roles: string[]): void {
    const user = this.users.find(u => u.id === userId);
    if (user) user.roles = roles;
  }

  constructor() {
    this.leads = JSON.parse(JSON.stringify(mockLeads)) as ILead[];
    // Scorecards — new Phase 16 format with flat child arrays
    const rawScorecardsData = JSON.parse(JSON.stringify(mockScorecards)) as {
      scorecards: IGoNoGoScorecard[];
      scorecardApprovalCycles: IScorecardApprovalCycle[];
      scorecardApprovalSteps: IScorecardApprovalStep[];
      scorecardVersions: IScorecardVersion[];
    };
    this.scorecardApprovalCycles = rawScorecardsData.scorecardApprovalCycles || [];
    this.scorecardApprovalSteps = rawScorecardsData.scorecardApprovalSteps || [];
    this.scorecardVersions = rawScorecardsData.scorecardVersions || [];
    // Assemble nested objects onto each scorecard
    this.scorecards = rawScorecardsData.scorecards.map(sc => this.assembleScorecard(sc));
    this.estimatingRecords = JSON.parse(JSON.stringify(mockEstimating)) as IEstimatingTracker[];
    this.users = JSON.parse(JSON.stringify(mockUsers));
    this.featureFlags = JSON.parse(JSON.stringify(mockFeatureFlags)) as IFeatureFlag[];
    this.calendarAvailability = JSON.parse(JSON.stringify(mockCalendarAvailability)) as ICalendarAvailability[];
    this.teamMembers = JSON.parse(JSON.stringify(mockTeamMembers)) as ITeamMember[];
    this.deliverables = JSON.parse(JSON.stringify(mockDeliverables)) as IDeliverable[];
    this.turnoverItems = JSON.parse(JSON.stringify(mockTurnoverItems)) as ITurnoverItem[];
    this.closeoutItems = JSON.parse(JSON.stringify(mockCloseoutItems)) as ICloseoutItem[];
    this.meetings = [];
    this.notifications = [];
    this.auditLog = [];
    this.provisioningLogs = [];
    this.hubSiteUrl = DEFAULT_HUB_SITE_URL;
    this.interviewPreps = [];
    this.contractInfos = [];
    this.lossAutopsies = JSON.parse(JSON.stringify(mockLossAutopsies)) as ILossAutopsy[];
    this.checklistItems = JSON.parse(JSON.stringify(mockStartupChecklist)) as IStartupChecklistItem[];
    const matrixData = JSON.parse(JSON.stringify(mockInternalMatrix)) as { tasks: IInternalMatrixTask[]; recurringItems: unknown[]; teamAssignments: ITeamRoleAssignment[] };
    this.internalMatrixTasks = matrixData.tasks;
    this.teamRoleAssignments = matrixData.teamAssignments;
    this.ownerContractArticles = JSON.parse(JSON.stringify(mockOwnerContractMatrix)) as IOwnerContractArticle[];
    this.subContractClauses = JSON.parse(JSON.stringify(mockSubContractMatrix)) as ISubContractClause[];
    this.marketingRecords = JSON.parse(JSON.stringify(mockMarketingRecords)) as IMarketingProjectRecord[];
    // Risk Cost — flatten items from parent records
    const rawRiskCost = JSON.parse(JSON.stringify(mockRiskCost)) as IRiskCostManagement[];
    this.riskCostItems = [];
    for (const rc of rawRiskCost) {
      for (const item of [...rc.buyoutOpportunities, ...rc.potentialRisks, ...rc.potentialSavings]) {
        this.riskCostItems.push({ ...item, projectCode: rc.projectCode, riskCostId: rc.id });
      }
    }
    this.riskCostRecords = rawRiskCost;

    this.qualityConcerns = JSON.parse(JSON.stringify(mockQualityConcerns)) as IQualityConcern[];
    this.safetyConcerns = JSON.parse(JSON.stringify(mockSafetyConcerns)) as ISafetyConcern[];

    // Schedule — flatten critical path items
    const rawSchedules = JSON.parse(JSON.stringify(mockSchedules)) as IProjectScheduleCriticalPath[];
    this.criticalPathItems = [];
    for (const s of rawSchedules) {
      for (const item of s.criticalPathConcerns) {
        this.criticalPathItems.push({ ...item, projectCode: s.projectCode, scheduleId: s.id });
      }
    }
    this.scheduleRecords = rawSchedules;

    // Superintendent Plan — flatten sections
    const rawSuperPlans = JSON.parse(JSON.stringify(mockSuperPlan)) as ISuperintendentPlan[];
    this.superintendentPlanSections = [];
    for (const p of rawSuperPlans) {
      for (const sec of p.sections) {
        this.superintendentPlanSections.push({ ...sec, superintendentPlanId: p.id, projectCode: p.projectCode });
      }
    }
    this.superintendentPlans = rawSuperPlans;

    this.lessonsLearned = JSON.parse(JSON.stringify(mockLessonsLearned)) as ILessonLearned[];
    this.lessonsLearnedHub = [];

    // PMP — flatten signatures, approval cycles, approval steps
    const rawPMPs = JSON.parse(JSON.stringify(mockPMPs)) as IProjectManagementPlan[];
    this.pmpSignatures = [];
    this.pmpApprovalCycles = [];
    this.pmpApprovalSteps = [];
    for (const pmp of rawPMPs) {
      for (const sig of [...pmp.startupSignatures, ...pmp.completionSignatures]) {
        this.pmpSignatures.push({ ...sig, pmpId: pmp.id });
      }
      for (const cycle of pmp.approvalCycles) {
        const cycleId = cycle.id ?? pmp.id * 100 + cycle.cycleNumber;
        this.pmpApprovalCycles.push({ ...cycle, id: cycleId, pmpId: pmp.id, projectCode: pmp.projectCode });
        for (const step of cycle.steps) {
          this.pmpApprovalSteps.push({ ...step, approvalCycleId: cycleId });
        }
      }
    }
    this.pmps = rawPMPs;

    this.divisionApprovers = JSON.parse(JSON.stringify(mockDivisionApprovers)) as IDivisionApprover[];

    // Monthly Reviews — flatten checklist items and follow-ups
    const rawMonthlyReviews = JSON.parse(JSON.stringify(mockMonthlyReviews)) as IMonthlyProjectReview[];
    this.monthlyChecklistItems = [];
    this.monthlyFollowUps = [];
    for (const r of rawMonthlyReviews) {
      for (const item of r.checklistItems) {
        this.monthlyChecklistItems.push({ ...item, reviewId: r.id });
      }
      for (const fu of r.followUps) {
        this.monthlyFollowUps.push({ ...fu, reviewId: r.id });
      }
    }
    this.monthlyReviews = rawMonthlyReviews;

    this.boilerplate = JSON.parse(JSON.stringify(mockBoilerplate)) as IPMPBoilerplateSection[];
    this.jobNumberRequests = JSON.parse(JSON.stringify(mockJobNumberRequests)) as IJobNumberRequest[];
    // Estimating Kickoff — flatten items
    const kickoffData = JSON.parse(JSON.stringify(mockEstimatingKickoffs)) as IEstimatingKickoff[];
    this.estimatingKickoffItems = [];
    this.estimatingKickoffs = kickoffData.map(k => {
      const items = k.items && k.items.length > 0 ? k.items : createEstimatingKickoffTemplate();
      for (const item of items) {
        this.estimatingKickoffItems.push({ ...item, kickoffId: k.id, projectCode: k.ProjectCode });
      }
      return { ...k, items };
    });

    // Checklist activity log — flatten from checklist items
    this.checklistActivityLog = [];
    let activityLogId = 5000;
    for (const ci of this.checklistItems) {
      for (const entry of ci.activityLog) {
        this.checklistActivityLog.push({ ...entry, id: activityLogId++, checklistItemId: ci.id, projectCode: ci.projectCode });
      }
    }
    this.buyoutEntries = this.enrichBuyoutEntriesWithEVerify(
      JSON.parse(JSON.stringify(mockBuyoutEntries)) as IBuyoutEntry[]
    );
    this.scheduleActivities = JSON.parse(JSON.stringify(mockScheduleActivities)) as IScheduleActivity[];
    this.scheduleImports = JSON.parse(JSON.stringify(mockScheduleImports)) as IScheduleImport[];
    this.constraintLogs = JSON.parse(JSON.stringify(mockConstraintLogs)) as IConstraintLog[];
    this.permits = JSON.parse(JSON.stringify(mockPermits)) as IPermit[];
    this.activeProjects = this.generateMockActiveProjects();
    this.workflowDefinitions = JSON.parse(JSON.stringify(mockWorkflowDefinitions)) as IWorkflowDefinition[];
    this.workflowStepOverrides = JSON.parse(JSON.stringify(mockWorkflowStepOverrides)) as IWorkflowStepOverride[];

    // Turnover Agendas — flatten child collections
    const rawTurnoverData = JSON.parse(JSON.stringify(mockTurnoverAgendas));
    this.turnoverAgendas = rawTurnoverData.agendas as ITurnoverAgenda[];
    this.turnoverHeaders = rawTurnoverData.headers as ITurnoverProjectHeader[];
    this.turnoverEstimateOverviews = rawTurnoverData.estimateOverviews as ITurnoverEstimateOverview[];
    this.turnoverPrerequisites = rawTurnoverData.prerequisites as ITurnoverPrerequisite[];
    this.turnoverDiscussionItems = rawTurnoverData.discussionItems as ITurnoverDiscussionItem[];
    this.turnoverSubcontractors = rawTurnoverData.subcontractors as ITurnoverSubcontractor[];
    this.turnoverExhibits = rawTurnoverData.exhibits as ITurnoverExhibit[];
    this.turnoverSignatures = rawTurnoverData.signatures as ITurnoverSignature[];
    this.turnoverAttachments = rawTurnoverData.attachments as ITurnoverAttachment[];

    this.permissionTemplates = JSON.parse(JSON.stringify(mockPermissionTemplates)) as IPermissionTemplate[];
    this.securityGroupMappings = JSON.parse(JSON.stringify(mockSecurityGroupMappings)) as ISecurityGroupMapping[];
    this.projectTeamAssignments = JSON.parse(JSON.stringify(mockProjectTeamAssignments)) as IProjectTeamAssignment[];
    this.performanceLogs = [];
    this.helpGuides = JSON.parse(JSON.stringify(mockHelpGuides)) as IHelpGuide[];
    this.dataMartRecords = [];

    this.nextId = 1000;
  }

  /**
   * Generate mock active projects data based on the Excel template
   */
  private generateMockActiveProjects(): IActiveProject[] {
    const mockData: IActiveProject[] = [
      {
        id: 1,
        jobNumber: '22-140-01',
        projectCode: '22-140-01',
        projectName: 'Caretta',
        status: 'Construction',
        sector: 'Commercial',
        region: 'West Palm Beach',
        personnel: {
          projectExecutive: 'Bob Cashin',
          leadPM: 'Matt Cox',
          additionalPM: 'Ashlie Larson, Pawan Wadhwani',
          projectAccountant: 'Tacara Hickman',
          projectAssistant: 'Yolanda Donado',
          leadSuper: 'JT Torres',
          superintendent: 'Ronnie Poliseo, Chris Carr, Francois DePreist',
          assistantSuper: 'Mardiel Cuesta',
        },
        financials: {
          originalContract: 45000000,
          changeOrders: 2500000,
          currentContractValue: 47500000,
          billingsToDate: 32000000,
          unbilled: 4500000,
          projectedFee: 2375000,
          projectedFeePct: 5.0,
          remainingValue: 15500000,
        },
        schedule: {
          startDate: '2024-02-01',
          substantialCompletionDate: '2026-08-31',
          nocExpiration: '2026-06-28',
          currentPhase: 'Vertical Construction',
          percentComplete: 67,
        },
        riskMetrics: {
          averageQScore: 85,
          openWaiverCount: 1,
          pendingCommitments: 3,
          complianceStatus: 'Green',
        },
        statusComments: 'On track for August completion',
        hasUnbilledAlert: false,
        hasScheduleAlert: false,
        hasFeeErosionAlert: false,
        lastSyncDate: new Date().toISOString(),
      },
      {
        id: 2,
        jobNumber: '20-174-01',
        projectCode: '20-174-01',
        projectName: 'P&W Olympus',
        status: 'Construction',
        sector: 'Commercial',
        region: 'Orlando',
        personnel: {
          projectExecutive: 'Arthur Miller',
          leadPM: 'Shligton Estime',
          projectAccountant: 'Tyler Everett',
          projectAssistant: 'Monica Crowley',
          leadSuper: 'Eric Carlson Jr.',
        },
        financials: {
          originalContract: 78000000,
          changeOrders: 5200000,
          currentContractValue: 83200000,
          billingsToDate: 71000000,
          unbilled: 8500000,
          projectedFee: 4160000,
          projectedFeePct: 5.0,
          remainingValue: 12200000,
        },
        schedule: {
          startDate: '2022-03-01',
          substantialCompletionDate: '2025-11-30',
          nocExpiration: '2026-12-31',
          currentPhase: 'Final Finishes',
          percentComplete: 85,
        },
        riskMetrics: {
          averageQScore: 78,
          openWaiverCount: 0,
          pendingCommitments: 1,
          complianceStatus: 'Yellow',
        },
        statusComments: 'Nearing completion, punch list in progress',
        hasUnbilledAlert: true,
        hasScheduleAlert: false,
        hasFeeErosionAlert: false,
        lastSyncDate: new Date().toISOString(),
      },
      {
        id: 3,
        jobNumber: '23-435-01',
        projectCode: '23-435-01',
        projectName: 'Tropical World Nursery',
        status: 'Construction',
        sector: 'Commercial',
        region: 'Miami',
        personnel: {
          projectExecutive: 'Bobby Fetting',
          leadPM: 'James Jackson',
          assistantPM: 'Milan Mistry',
          projectAccountant: 'Betty Jo Yorio',
          leadSuper: 'Fred Mangum',
          superintendent: 'Jesus Avila, Anthony Lilly, Mike Morris',
          assistantSuper: 'Rameau Morency',
        },
        financials: {
          originalContract: 12500000,
          changeOrders: 850000,
          currentContractValue: 13350000,
          billingsToDate: 6200000,
          unbilled: 1200000,
          projectedFee: 667500,
          projectedFeePct: 5.0,
          remainingValue: 7150000,
        },
        schedule: {
          startDate: '2024-10-01',
          substantialCompletionDate: '2026-05-31',
          nocExpiration: '2026-10-15',
          currentPhase: 'Structural',
          percentComplete: 46,
        },
        riskMetrics: {
          averageQScore: 92,
          openWaiverCount: 0,
          pendingCommitments: 5,
          complianceStatus: 'Green',
        },
        statusComments: 'Progressing well',
        hasUnbilledAlert: false,
        hasScheduleAlert: false,
        hasFeeErosionAlert: false,
        lastSyncDate: new Date().toISOString(),
      },
      {
        id: 4,
        jobNumber: '25-745-01',
        projectCode: '25-745-01',
        projectName: 'Rybovich Safe Harbor',
        status: 'Construction',
        sector: 'Commercial',
        region: 'West Palm Beach',
        personnel: {
          projectExecutive: 'Paul Fulks',
          leadPM: 'Bob Joy',
          assistantPM: 'Justin Molina',
          projectAccountant: 'Michelle Carlson',
          projectAssistant: 'Ashley Kronshage',
          leadSuper: 'Rene Fernandez',
          superintendent: 'Kevin Watterud, Adam Headrick',
        },
        financials: {
          originalContract: 8500000,
          changeOrders: 320000,
          currentContractValue: 8820000,
          billingsToDate: 2100000,
          unbilled: 650000,
          projectedFee: 441000,
          projectedFeePct: 5.0,
          remainingValue: 6720000,
        },
        schedule: {
          startDate: '2025-06-01',
          substantialCompletionDate: '2026-03-31',
          nocExpiration: '2026-12-31',
          currentPhase: 'Foundation',
          percentComplete: 24,
        },
        riskMetrics: {
          averageQScore: 88,
          openWaiverCount: 0,
          pendingCommitments: 8,
          complianceStatus: 'Green',
        },
        statusComments: 'Early stage, on schedule',
        hasUnbilledAlert: false,
        hasScheduleAlert: false,
        hasFeeErosionAlert: false,
        lastSyncDate: new Date().toISOString(),
      },
      {
        id: 5,
        jobNumber: '21-456-01',
        projectCode: '21-456-01',
        projectName: 'Hanging Moss',
        status: 'Construction',
        sector: 'Residential',
        region: 'Orlando',
        personnel: {
          projectExecutive: 'Jay Monaghan',
          leadPM: 'Dan Miller',
          additionalPM: 'Jim Pearce',
          assistantPM: 'Clayton Kolar',
          projectAccountant: 'Lori Shanks',
          leadSuper: 'Chris Lineberger',
          superintendent: 'Lucio Salcedo',
        },
        financials: {
          originalContract: 35000000,
          changeOrders: 1800000,
          currentContractValue: 36800000,
          billingsToDate: 8500000,
          unbilled: 2100000,
          projectedFee: 1840000,
          projectedFeePct: 5.0,
          remainingValue: 28300000,
        },
        schedule: {
          startDate: '2025-06-01',
          substantialCompletionDate: '2027-03-31',
          currentPhase: 'Site Work',
          percentComplete: 23,
        },
        riskMetrics: {
          averageQScore: 82,
          openWaiverCount: 2,
          pendingCommitments: 12,
          complianceStatus: 'Yellow',
        },
        statusComments: 'In Permitting phase',
        hasUnbilledAlert: false,
        hasScheduleAlert: false,
        hasFeeErosionAlert: false,
        lastSyncDate: new Date().toISOString(),
      },
      {
        id: 6,
        jobNumber: '23-145-01',
        projectCode: '23-145-01',
        projectName: 'Perla',
        status: 'Construction',
        sector: 'Residential',
        region: 'Miami',
        personnel: {
          projectExecutive: 'Jay Monaghan',
          leadPM: 'Jeff Malone',
          additionalPM: 'Steve Wackes, Fred Young',
          assistantPM: 'Kim Spivey, Patrick Rapport',
          projectAccountant: 'Lori Shanks',
          leadSuper: 'Joe Caliendo',
          superintendent: 'Frank Bobko, Jake Cowan, Michele Wortham',
          assistantSuper: 'Matthew Balkom',
        },
        financials: {
          originalContract: 125000000,
          changeOrders: 8500000,
          currentContractValue: 133500000,
          billingsToDate: 15000000,
          unbilled: 5200000,
          projectedFee: 6675000,
          projectedFeePct: 5.0,
          remainingValue: 118500000,
        },
        schedule: {
          startDate: '2026-07-01',
          substantialCompletionDate: '2028-09-01',
          nocExpiration: '2026-09-01',
          currentPhase: 'Pre-Construction',
          percentComplete: 11,
        },
        riskMetrics: {
          averageQScore: 90,
          openWaiverCount: 0,
          pendingCommitments: 4,
          complianceStatus: 'Green',
        },
        statusComments: 'Mobilizing for start',
        hasUnbilledAlert: false,
        hasScheduleAlert: false,
        hasFeeErosionAlert: false,
        lastSyncDate: new Date().toISOString(),
      },
      {
        id: 7,
        jobNumber: '20-535-01',
        projectCode: '20-535-01',
        projectName: 'PBC MDC PH IV West Tower',
        status: 'Construction',
        sector: 'Commercial',
        region: 'West Palm Beach',
        personnel: {
          projectExecutive: 'Jack Ullrich',
          leadPM: 'John Richardson',
          assistantPM: 'Yasser Ghareeb',
          projectAccountant: 'Monica Crowley',
          leadSuper: 'John Varney',
        },
        financials: {
          originalContract: 95000000,
          changeOrders: 12000000,
          currentContractValue: 107000000,
          billingsToDate: 28000000,
          unbilled: 9500000,
          projectedFee: 5350000,
          projectedFeePct: 5.0,
          remainingValue: 79000000,
        },
        schedule: {
          startDate: '2025-04-01',
          substantialCompletionDate: '2029-04-30',
          currentPhase: 'Foundation',
          percentComplete: 26,
        },
        riskMetrics: {
          averageQScore: 75,
          openWaiverCount: 3,
          pendingCommitments: 6,
          complianceStatus: 'Yellow',
        },
        statusComments: 'Long-term project, progressing',
        hasUnbilledAlert: false,
        hasScheduleAlert: false,
        hasFeeErosionAlert: false,
        lastSyncDate: new Date().toISOString(),
      },
      {
        id: 8,
        jobNumber: '24-183-01',
        projectCode: '24-183-01',
        projectName: "El's Rec & Aquatics",
        status: 'Construction',
        sector: 'Commercial',
        region: 'West Palm Beach',
        personnel: {
          projectExecutive: 'Bob Cashin',
          leadPM: 'Amber Wangle',
          additionalPM: 'Andrew Covel',
          projectAccountant: 'Craig Nelson',
          leadSuper: 'Andy Gutierrez',
        },
        financials: {
          originalContract: 18500000,
          changeOrders: 950000,
          currentContractValue: 19450000,
          billingsToDate: 4200000,
          unbilled: 1800000,
          projectedFee: 972500,
          projectedFeePct: 5.0,
          remainingValue: 15250000,
        },
        schedule: {
          startDate: '2025-10-01',
          substantialCompletionDate: '2026-12-31',
          nocExpiration: '2026-06-26',
          currentPhase: 'Site Work',
          percentComplete: 22,
        },
        riskMetrics: {
          averageQScore: 86,
          openWaiverCount: 0,
          pendingCommitments: 7,
          complianceStatus: 'Green',
        },
        statusComments: 'New project, ramping up',
        hasUnbilledAlert: false,
        hasScheduleAlert: false,
        hasFeeErosionAlert: false,
        lastSyncDate: new Date().toISOString(),
      },
      {
        id: 9,
        jobNumber: '21-801-01',
        projectCode: '21-801-01',
        projectName: 'NoRa',
        status: 'Construction',
        sector: 'Residential',
        region: 'Miami',
        personnel: {
          projectExecutive: 'Bob Cashin',
          leadPM: 'Bill West',
          additionalPM: 'Laura Ratliff',
          assistantPM: 'Jill Voorhees',
          projectAccountant: 'Brad Harrison',
          leadSuper: 'Eric Hudson',
        },
        financials: {
          originalContract: 52000000,
          changeOrders: 3800000,
          currentContractValue: 55800000,
          billingsToDate: 48500000,
          unbilled: 3200000,
          projectedFee: 2790000,
          projectedFeePct: 5.0,
          remainingValue: 7300000,
        },
        schedule: {
          startDate: '2023-07-01',
          substantialCompletionDate: '2025-08-31',
          nocExpiration: '2026-06-06',
          currentPhase: 'Final Finishes',
          percentComplete: 87,
        },
        riskMetrics: {
          averageQScore: 81,
          openWaiverCount: 1,
          pendingCommitments: 2,
          complianceStatus: 'Green',
        },
        statusComments: 'Nearing substantial completion',
        hasUnbilledAlert: false,
        hasScheduleAlert: false,
        hasFeeErosionAlert: false,
        lastSyncDate: new Date().toISOString(),
      },
      {
        id: 10,
        jobNumber: '24-011-01',
        projectCode: '24-011-01',
        projectName: 'Family Church',
        status: 'Construction',
        sector: 'Commercial',
        region: 'West Palm Beach',
        personnel: {
          projectExecutive: 'Paul Fulks',
          leadPM: 'Boris Lopez',
          assistantPM: 'Jill Voorhees',
          leadSuper: 'Vinny Viaggio',
          superintendent: 'Sam Platovsky',
        },
        financials: {
          originalContract: 6200000,
          changeOrders: 280000,
          currentContractValue: 6480000,
          billingsToDate: 4800000,
          unbilled: 850000,
          projectedFee: 324000,
          projectedFeePct: 5.0,
          remainingValue: 1680000,
        },
        schedule: {
          startDate: '2025-06-01',
          substantialCompletionDate: '2025-12-31',
          nocExpiration: '2026-05-30',
          currentPhase: 'Interior Finishes',
          percentComplete: 74,
        },
        riskMetrics: {
          averageQScore: 94,
          openWaiverCount: 0,
          pendingCommitments: 1,
          complianceStatus: 'Green',
        },
        statusComments: 'On track for year-end completion',
        hasUnbilledAlert: false,
        hasScheduleAlert: false,
        hasFeeErosionAlert: false,
        lastSyncDate: new Date().toISOString(),
      },
      // Precon projects
      {
        id: 11,
        jobNumber: '24-606-01',
        projectCode: '24-606-01',
        projectName: 'Hilltop Gardens',
        status: 'Precon',
        sector: 'Residential',
        region: 'West Palm Beach',
        personnel: {
          projectExecutive: 'Bobby Fetting',
        },
        financials: {
          originalContract: 28000000,
          projectedFee: 1400000,
          projectedFeePct: 5.0,
        },
        schedule: {
          currentPhase: 'Estimating',
          percentComplete: 0,
        },
        riskMetrics: {
          complianceStatus: 'Green',
        },
        statusComments: 'In preconstruction',
        hasUnbilledAlert: false,
        hasScheduleAlert: false,
        hasFeeErosionAlert: false,
        lastSyncDate: new Date().toISOString(),
      },
      {
        id: 12,
        jobNumber: '25-445-01',
        projectCode: '25-445-01',
        projectName: 'Keiser Student Housing',
        status: 'Precon',
        sector: 'Commercial',
        region: 'West Palm Beach',
        personnel: {
          projectExecutive: 'Joe Keating',
          leadPM: 'Bill West',
          additionalPM: 'Tony Mish, Ben Coats',
          projectAccountant: 'Betty Jo Yorio',
          projectAssistant: 'Stacey Helmes',
          leadSuper: 'Ronnie Poliseo',
        },
        financials: {
          originalContract: 42000000,
          projectedFee: 2100000,
          projectedFeePct: 5.0,
        },
        schedule: {
          currentPhase: 'GMP Development',
          percentComplete: 0,
        },
        riskMetrics: {
          complianceStatus: 'Green',
        },
        statusComments: 'GMP in development',
        hasUnbilledAlert: false,
        hasScheduleAlert: false,
        hasFeeErosionAlert: false,
        lastSyncDate: new Date().toISOString(),
      },
      // Final Payment projects
      {
        id: 13,
        jobNumber: '21-575-01',
        projectCode: '21-575-01',
        projectName: 'Stuart Middle School - Phase 1',
        status: 'Final Payment',
        sector: 'Commercial',
        region: 'Martin County',
        personnel: {
          projectExecutive: 'Joe Keating',
          leadPM: 'Ben Coats',
          projectAccountant: 'Tacara Hickman',
        },
        financials: {
          originalContract: 15800000,
          changeOrders: 1200000,
          currentContractValue: 17000000,
          billingsToDate: 16850000,
          unbilled: 150000,
          projectedFee: 850000,
          projectedFeePct: 5.0,
          remainingValue: 150000,
        },
        schedule: {
          startDate: '2022-06-01',
          substantialCompletionDate: '2024-08-31',
          currentPhase: 'Closeout',
          percentComplete: 99,
        },
        riskMetrics: {
          averageQScore: 88,
          openWaiverCount: 0,
          pendingCommitments: 0,
          complianceStatus: 'Green',
        },
        statusComments: 'Awaiting final payment',
        hasUnbilledAlert: false,
        hasScheduleAlert: false,
        hasFeeErosionAlert: false,
        lastSyncDate: new Date().toISOString(),
      },
      {
        id: 14,
        jobNumber: '18-789-01',
        projectCode: '18-789-01',
        projectName: 'YMCA of the Palm Beaches',
        status: 'Construction',
        sector: 'Commercial',
        region: 'West Palm Beach',
        personnel: {
          projectExecutive: 'Joe Keating',
          leadPM: 'Dave Rawdon',
          projectAccountant: 'Tanya Stiles',
          leadSuper: 'Tom Holt',
        },
        financials: {
          originalContract: 22000000,
          changeOrders: 1500000,
          currentContractValue: 23500000,
          billingsToDate: 5200000,
          unbilled: 1800000,
          projectedFee: 1175000,
          projectedFeePct: 5.0,
          remainingValue: 18300000,
        },
        schedule: {
          startDate: '2025-07-01',
          nocExpiration: '2026-12-31',
          currentPhase: 'Foundation',
          percentComplete: 22,
        },
        riskMetrics: {
          averageQScore: 83,
          openWaiverCount: 1,
          pendingCommitments: 9,
          complianceStatus: 'Green',
        },
        statusComments: 'New construction underway',
        hasUnbilledAlert: false,
        hasScheduleAlert: false,
        hasFeeErosionAlert: false,
        lastSyncDate: new Date().toISOString(),
      },
    ];

    // Apply alert thresholds
    return mockData.map(project => {
      const unbilledPct = project.financials.currentContractValue
        ? ((project.financials.unbilled || 0) / project.financials.currentContractValue) * 100
        : 0;
      
      return {
        ...project,
        hasUnbilledAlert: unbilledPct >= DEFAULT_ALERT_THRESHOLDS.unbilledWarningPct,
      };
    });
  }

  private getNextId(): number {
    return ++this.nextId;
  }

  // ---------------------------------------------------------------------------
  // Leads
  // ---------------------------------------------------------------------------

  private paginateArray<T extends { id?: number }>(
    items: T[],
    request: ICursorPageRequest
  ): ICursorPageResult<T> {
    const pageSize = Math.max(1, request.pageSize || 100);
    const start = request.token?.lastId && request.token.lastId > 0 ? request.token.lastId : 0;
    const pageItems = items.slice(start, start + pageSize);
    const nextOffset = start + pageItems.length;
    const hasMore = nextOffset < items.length;
    const last = pageItems[pageItems.length - 1];
    const nextToken: ICursorToken | null = hasMore
      ? {
          lastId: nextOffset,
          lastModified: (last as { modifiedDate?: string })?.modifiedDate,
        }
      : null;

    return {
      items: pageItems,
      nextToken,
      hasMore,
      totalApprox: items.length,
    };
  }

  public async getLeads(options?: IListQueryOptions): Promise<IPagedResult<ILead>> {
    await delay();

    let filtered = [...this.leads];

    // Support filter by Stage field via simple string match
    if (options?.filter) {
      const filterStr = options.filter;
      // Check for "Stage eq 'value'" pattern
      const stageMatch = filterStr.match(/Stage\s+eq\s+'([^']+)'/i);
      if (stageMatch) {
        const stageValue = stageMatch[1];
        filtered = filtered.filter(l => l.Stage === stageValue);
      } else {
        // Fallback: generic field match pattern "FieldName eq 'value'"
        const genericMatch = filterStr.match(/(\w+)\s+eq\s+'([^']+)'/i);
        if (genericMatch) {
          const fieldName = genericMatch[1] as keyof ILead;
          const fieldValue = genericMatch[2];
          filtered = filtered.filter(l => {
            const val = l[fieldName];
            return val !== undefined && val !== null && String(val) === fieldValue;
          });
        }
      }
    }

    // Sort
    if (options?.orderBy) {
      const key = options.orderBy as keyof ILead;
      const asc = options.orderAscending !== false;
      filtered.sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;
        if (aVal < bVal) return asc ? -1 : 1;
        if (aVal > bVal) return asc ? 1 : -1;
        return 0;
      });
    }

    const totalCount = filtered.length;
    const skip = options?.skip ?? 0;
    const top = options?.top ?? filtered.length;
    const paged = filtered.slice(skip, skip + top);

    return {
      items: paged,
      totalCount,
      hasMore: skip + top < totalCount
    };
  }

  public async getLeadById(id: number): Promise<ILead | null> {
    await delay();
    return this.leads.find(l => l.id === id) ?? null;
  }

  public async getLeadsByStage(stage: Stage): Promise<ILead[]> {
    await delay();
    return this.leads.filter(l => l.Stage === stage);
  }

  public async createLead(data: ILeadFormData): Promise<ILead> {
    await delay();

    const newLead: ILead = {
      ...data,
      id: this.getNextId(),
      DateOfEvaluation: new Date().toISOString().split('T')[0],
      Originator: 'kfoster@hedrickbrothers.com',
      OriginatorId: 5,
      Stage: data.Stage ?? Stage.LeadDiscovery
    };

    this.leads.push(newLead);
    return { ...newLead };
  }

  public async updateLead(id: number, data: Partial<ILead>): Promise<ILead> {
    await delay();

    const index = this.leads.findIndex(l => l.id === id);
    if (index === -1) {
      throw new Error(`Lead with id ${id} not found`);
    }

    this.leads[index] = { ...this.leads[index], ...data };
    return { ...this.leads[index] };
  }

  public async deleteLead(id: number): Promise<void> {
    await delay();

    const index = this.leads.findIndex(l => l.id === id);
    if (index === -1) {
      throw new Error(`Lead with id ${id} not found`);
    }

    this.leads.splice(index, 1);
  }

  public async searchLeads(query: string): Promise<ILead[]> {
    await delay();

    const q = query.toLowerCase();
    return this.leads.filter(l => {
      const title = (l.Title ?? '').toLowerCase();
      const client = (l.ClientName ?? '').toLowerCase();
      const code = (l.ProjectCode ?? '').toLowerCase();
      return title.includes(q) || client.includes(q) || code.includes(q);
    });
  }

  // ---------------------------------------------------------------------------
  // Go/No-Go Scorecards — Helpers
  // ---------------------------------------------------------------------------

  private assembleScorecard(sc: IGoNoGoScorecard): IGoNoGoScorecard {
    const cycles = this.scorecardApprovalCycles
      .filter(c => c.scorecardId === sc.id)
      .map(c => ({
        ...c,
        steps: this.scorecardApprovalSteps.filter(s => s.cycleId === c.id),
      }));
    const versions = this.scorecardVersions.filter(v => v.scorecardId === sc.id);
    return {
      ...sc,
      scorecardStatus: (sc.scorecardStatus as ScorecardStatus) || ScorecardStatus.BDDraft,
      approvalCycles: cycles,
      versions,
      currentVersion: sc.currentVersion || 1,
      isLocked: sc.isLocked ?? false,
    };
  }

  private findScorecardOrThrow(id: number): { scorecard: IGoNoGoScorecard; index: number } {
    const index = this.scorecards.findIndex(s => s.id === id);
    if (index === -1) throw new Error(`Scorecard with id ${id} not found`);
    return { scorecard: this.scorecards[index], index };
  }

  private createVersionSnapshot(sc: IGoNoGoScorecard, reason: string, createdBy: string): IScorecardVersion {
    const origScores: Record<string, number> = {};
    const cmteScores: Record<string, number> = {};
    for (const [key, val] of Object.entries(sc.scores)) {
      if (val.originator !== undefined) origScores[key] = val.originator;
      if (val.committee !== undefined) cmteScores[key] = val.committee;
    }
    const version: IScorecardVersion = {
      id: this.getNextId(),
      scorecardId: sc.id,
      versionNumber: sc.currentVersion,
      createdDate: new Date().toISOString().split('T')[0],
      createdBy,
      reason,
      originalScores: origScores,
      committeeScores: cmteScores,
      totalOriginal: sc.TotalScore_Orig,
      totalCommittee: sc.TotalScore_Cmte,
      decision: sc.finalDecision,
      conditions: sc.conditionalGoConditions,
    };
    this.scorecardVersions.push(version);
    sc.versions.push(version);
    return version;
  }

  // ---------------------------------------------------------------------------
  // Go/No-Go Scorecards
  // ---------------------------------------------------------------------------

  public async getScorecardByLeadId(leadId: number): Promise<IGoNoGoScorecard | null> {
    await delay();
    const sc = this.scorecards.find(s => s.LeadID === leadId);
    return sc ? this.assembleScorecard(sc) : null;
  }

  public async getScorecards(): Promise<IGoNoGoScorecard[]> {
    await delay();
    return this.scorecards.map(sc => this.assembleScorecard(sc));
  }

  public async createScorecard(data: Partial<IGoNoGoScorecard>): Promise<IGoNoGoScorecard> {
    await delay();

    const newScorecard: IGoNoGoScorecard = {
      id: this.getNextId(),
      LeadID: data.LeadID ?? 0,
      ProjectCode: data.ProjectCode,
      scores: data.scores ?? {},
      TotalScore_Orig: data.TotalScore_Orig,
      TotalScore_Cmte: data.TotalScore_Cmte,
      OriginatorComments: data.OriginatorComments,
      CommitteeComments: data.CommitteeComments,
      ProposalMarketingComments: data.ProposalMarketingComments,
      ProposalMarketingResources: data.ProposalMarketingResources,
      ProposalMarketingHours: data.ProposalMarketingHours,
      EstimatingComments: data.EstimatingComments,
      EstimatingResources: data.EstimatingResources,
      EstimatingHours: data.EstimatingHours,
      DecisionMakingProcess: data.DecisionMakingProcess,
      HBDifferentiators: data.HBDifferentiators,
      WinStrategy: data.WinStrategy,
      StrategicPursuit: data.StrategicPursuit,
      DecisionMakerAdvocate: data.DecisionMakerAdvocate,
      Decision: data.Decision,
      DecisionDate: data.DecisionDate,
      ScoredBy_Orig: data.ScoredBy_Orig,
      ScoredBy_Cmte: data.ScoredBy_Cmte,
      // Phase 16 fields
      scorecardStatus: ScorecardStatus.BDDraft,
      approvalCycles: [],
      currentVersion: 1,
      versions: [],
      isLocked: false,
    };

    this.scorecards.push(newScorecard);
    return { ...newScorecard };
  }

  public async updateScorecard(id: number, data: Partial<IGoNoGoScorecard>): Promise<IGoNoGoScorecard> {
    await delay();

    const index = this.scorecards.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error(`Scorecard with id ${id} not found`);
    }

    const existing = this.scorecards[index];
    // Preserve workflow state fields — callers should use dedicated methods to modify these
    const preserved = {
      approvalCycles: existing.approvalCycles,
      versions: existing.versions,
      scorecardStatus: existing.scorecardStatus,
      isLocked: existing.isLocked,
      currentVersion: existing.currentVersion,
      currentApprovalStep: existing.currentApprovalStep,
    };
    this.scorecards[index] = { ...existing, ...data, ...preserved };
    return { ...this.scorecards[index] };
  }

  public async submitGoNoGoDecision(
    scorecardId: number,
    decision: GoNoGoDecision,
    projectCode?: string
  ): Promise<void> {
    await delay();

    const scIndex = this.scorecards.findIndex(s => s.id === scorecardId);
    if (scIndex === -1) {
      throw new Error(`Scorecard with id ${scorecardId} not found`);
    }

    const scorecard = this.scorecards[scIndex];
    scorecard.Decision = decision;
    scorecard.DecisionDate = new Date().toISOString().split('T')[0];

    if (projectCode) {
      scorecard.ProjectCode = projectCode;
    }

    // Update the associated lead's stage based on the decision
    const leadIndex = this.leads.findIndex(l => l.id === scorecard.LeadID);
    if (leadIndex !== -1) {
      const lead = this.leads[leadIndex];
      lead.GoNoGoDecision = decision;
      lead.GoNoGoDecisionDate = scorecard.DecisionDate;

      switch (decision) {
        case GoNoGoDecision.Go:
          lead.Stage = Stage.Opportunity;
          if (projectCode) {
            lead.ProjectCode = projectCode;
          }
          break;
        case GoNoGoDecision.NoGo:
          lead.Stage = Stage.ArchivedNoGo;
          break;
        case GoNoGoDecision.ConditionalGo:
          lead.Stage = Stage.Opportunity;
          break;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Scorecard Workflow (Phase 16)
  // ---------------------------------------------------------------------------

  public async submitScorecard(
    scorecardId: number,
    submittedBy: string,
    approverOverride?: IPersonAssignment
  ): Promise<IGoNoGoScorecard> {
    await delay();
    const { scorecard, index } = this.findScorecardOrThrow(scorecardId);

    // Default 2-step approval chain
    const directorAssignee = approverOverride || {
      displayName: 'David Park',
      email: 'dpark@hedrickbrothers.com',
    };

    const cycleId = this.getNextId();
    const cycle: IScorecardApprovalCycle = {
      id: cycleId,
      scorecardId,
      cycleNumber: (scorecard.approvalCycles?.length ?? 0) + 1,
      version: scorecard.currentVersion,
      steps: [],
      startedDate: new Date().toISOString().split('T')[0],
      status: 'Active',
    };

    // Look up the submitter's display name from users list
    const submitterUser = this.users.find(
      (u: { email: string }) => u.email.toLowerCase() === submittedBy.toLowerCase()
    );

    const step1: IScorecardApprovalStep = {
      id: this.getNextId(),
      cycleId,
      stepOrder: 1,
      name: 'BD Rep Submission',
      assigneeEmail: submittedBy,
      assigneeName: submitterUser?.displayName ?? submittedBy,
      assignmentSource: 'Default',
      status: 'Approved',
      actionDate: new Date().toISOString().split('T')[0],
    };

    const step2: IScorecardApprovalStep = {
      id: this.getNextId(),
      cycleId,
      stepOrder: 2,
      name: 'Director of Precon Review',
      assigneeEmail: directorAssignee.email,
      assigneeName: directorAssignee.displayName,
      assignmentSource: approverOverride ? 'Override' : 'Default',
      status: 'Pending',
    };

    cycle.steps = [step1, step2];
    this.scorecardApprovalCycles.push(cycle);
    this.scorecardApprovalSteps.push(step1, step2);

    scorecard.scorecardStatus = ScorecardStatus.AwaitingDirectorReview;
    scorecard.currentApprovalStep = 1;
    scorecard.approvalCycles = [...(scorecard.approvalCycles || []), cycle];

    // Create initial version snapshot if version 1 and no versions exist
    if (scorecard.currentVersion === 1 && scorecard.versions.length === 0) {
      this.createVersionSnapshot(scorecard, 'Submitted for review', submittedBy);
    }

    this.scorecards[index] = scorecard;
    return { ...scorecard };
  }

  public async respondToScorecardSubmission(
    scorecardId: number,
    approved: boolean,
    comment: string
  ): Promise<IGoNoGoScorecard> {
    await delay();
    const { scorecard, index } = this.findScorecardOrThrow(scorecardId);

    if (scorecard.scorecardStatus !== ScorecardStatus.AwaitingDirectorReview) {
      throw new Error(`Cannot respond: scorecard is in ${scorecard.scorecardStatus} state`);
    }

    // Reassemble approval cycles from flat arrays if missing (defensive)
    if (!scorecard.approvalCycles || scorecard.approvalCycles.length === 0) {
      const reassembled = this.assembleScorecard(scorecard);
      scorecard.approvalCycles = reassembled.approvalCycles;
    }

    const activeCycle = scorecard.approvalCycles?.find(c => c.status === 'Active');
    if (!activeCycle) throw new Error('No active approval cycle found');

    const pendingStep = activeCycle.steps?.find(s => s.status === 'Pending');
    if (!pendingStep) throw new Error('No pending approval step found');

    if (approved) {
      pendingStep.status = 'Approved';
      pendingStep.actionDate = new Date().toISOString().split('T')[0];
      pendingStep.comment = comment || undefined;
      scorecard.scorecardStatus = ScorecardStatus.AwaitingCommitteeScoring;
      scorecard.currentApprovalStep = 2;
    } else {
      pendingStep.status = 'Returned';
      pendingStep.actionDate = new Date().toISOString().split('T')[0];
      pendingStep.comment = comment;
      scorecard.scorecardStatus = ScorecardStatus.DirectorReturnedForRevision;
    }

    // Update flat arrays
    const stepIdx = this.scorecardApprovalSteps.findIndex(s => s.id === pendingStep.id);
    if (stepIdx !== -1) this.scorecardApprovalSteps[stepIdx] = pendingStep;

    this.scorecards[index] = scorecard;
    return { ...scorecard };
  }

  public async enterCommitteeScores(
    scorecardId: number,
    scores: Record<string, number>,
    enteredBy: string
  ): Promise<IGoNoGoScorecard> {
    await delay();
    const { scorecard, index } = this.findScorecardOrThrow(scorecardId);

    if (scorecard.scorecardStatus !== ScorecardStatus.AwaitingCommitteeScoring) {
      throw new Error(`Cannot enter committee scores: scorecard is in ${scorecard.scorecardStatus} state`);
    }

    // Apply committee scores
    for (const [criterionId, value] of Object.entries(scores)) {
      if (!scorecard.scores[Number(criterionId)]) {
        scorecard.scores[Number(criterionId)] = {};
      }
      scorecard.scores[Number(criterionId)].committee = value;
    }

    scorecard.TotalScore_Cmte = calculateTotalScore(scorecard.scores, 'committee');
    scorecard.committeeScoresEnteredBy = enteredBy;
    scorecard.committeeScoresEnteredDate = new Date().toISOString().split('T')[0];

    // Compute recommended decision
    if (scorecard.TotalScore_Cmte) {
      const rec = getRecommendedDecision(scorecard.TotalScore_Cmte);
      scorecard.recommendedDecision = rec.decision;
    }

    // Stay in AwaitingCommitteeScoring — committee decides from this state
    this.scorecards[index] = scorecard;
    return { ...scorecard };
  }

  public async recordFinalDecision(
    scorecardId: number,
    decision: GoNoGoDecision,
    conditions?: string,
    decidedBy?: string
  ): Promise<IGoNoGoScorecard> {
    await delay();
    const { scorecard, index } = this.findScorecardOrThrow(scorecardId);

    if (scorecard.scorecardStatus !== ScorecardStatus.AwaitingCommitteeScoring) {
      throw new Error(`Cannot record decision: scorecard is in ${scorecard.scorecardStatus} state`);
    }

    const now = new Date().toISOString().split('T')[0];
    scorecard.finalDecision = decision;
    scorecard.finalDecisionBy = decidedBy;
    scorecard.finalDecisionDate = now;
    scorecard.Decision = decision;
    scorecard.DecisionDate = now;

    if (decision === GoNoGoDecision.ConditionalGo && conditions) {
      scorecard.conditionalGoConditions = conditions;
    }

    // Set status based on decision
    if (decision === GoNoGoDecision.Go || decision === GoNoGoDecision.ConditionalGo) {
      scorecard.scorecardStatus = ScorecardStatus.Go;
    } else {
      scorecard.scorecardStatus = ScorecardStatus.NoGo;
    }
    scorecard.isLocked = true;

    // Complete active approval cycle
    const activeCycle = scorecard.approvalCycles?.find(c => c.status === 'Active');
    if (activeCycle) {
      activeCycle.status = 'Completed';
      activeCycle.completedDate = now;
    }

    // Create version snapshot
    this.createVersionSnapshot(scorecard, `Decision recorded: ${decision}`, decidedBy || 'system');

    // Update lead stage
    const leadIndex = this.leads.findIndex(l => l.id === scorecard.LeadID);
    if (leadIndex !== -1) {
      const lead = this.leads[leadIndex];
      lead.GoNoGoDecision = decision;
      lead.GoNoGoDecisionDate = now;
      lead.GoNoGoScore_Originator = scorecard.TotalScore_Orig;
      lead.GoNoGoScore_Committee = scorecard.TotalScore_Cmte;

      switch (decision) {
        case GoNoGoDecision.Go:
        case GoNoGoDecision.ConditionalGo:
          lead.Stage = Stage.Opportunity;
          break;
        case GoNoGoDecision.NoGo:
          lead.Stage = Stage.ArchivedNoGo;
          break;
      }
    }

    this.scorecards[index] = scorecard;
    return { ...scorecard };
  }

  public async unlockScorecard(
    scorecardId: number,
    reason: string
  ): Promise<IGoNoGoScorecard> {
    await delay();
    const { scorecard, index } = this.findScorecardOrThrow(scorecardId);

    if (!scorecard.isLocked) {
      throw new Error('Cannot unlock: scorecard is not locked');
    }

    // Create version snapshot before unlock
    this.createVersionSnapshot(scorecard, `Unlocked: ${reason}`, scorecard.finalDecisionBy || 'system');

    scorecard.isLocked = false;
    scorecard.scorecardStatus = ScorecardStatus.Unlocked;
    scorecard.currentVersion = (scorecard.currentVersion || 1) + 1;
    scorecard.unlockedBy = scorecard.finalDecisionBy;
    scorecard.unlockedDate = new Date().toISOString().split('T')[0];
    scorecard.unlockReason = reason;

    this.scorecards[index] = scorecard;
    return { ...scorecard };
  }

  public async relockScorecard(
    scorecardId: number,
    startNewCycle: boolean
  ): Promise<IGoNoGoScorecard> {
    await delay();
    const { scorecard, index } = this.findScorecardOrThrow(scorecardId);

    if (startNewCycle) {
      // Create new 2-step approval cycle (same pattern as submitScorecard)
      const directorAssignee = { displayName: 'David Park', email: 'dpark@hedrickbrothers.com' };
      const cycleId = this.getNextId();
      const cycle: IScorecardApprovalCycle = {
        id: cycleId,
        scorecardId,
        cycleNumber: (scorecard.approvalCycles?.length ?? 0) + 1,
        version: scorecard.currentVersion,
        steps: [],
        startedDate: new Date().toISOString().split('T')[0],
        status: 'Active',
      };

      const submitterEmail = scorecard.unlockedBy || scorecard.finalDecisionBy || 'system';
      const submitterUser = this.users.find(
        (u: { email: string }) => u.email?.toLowerCase() === submitterEmail.toLowerCase()
      );

      const step1: IScorecardApprovalStep = {
        id: this.getNextId(),
        cycleId,
        stepOrder: 1,
        name: 'BD Rep Resubmission',
        assigneeEmail: submitterEmail,
        assigneeName: submitterUser?.displayName ?? submitterEmail,
        assignmentSource: 'Default',
        status: 'Approved',
        actionDate: new Date().toISOString().split('T')[0],
      };

      const step2: IScorecardApprovalStep = {
        id: this.getNextId(),
        cycleId,
        stepOrder: 2,
        name: 'Director of Precon Review',
        assigneeEmail: directorAssignee.email,
        assigneeName: directorAssignee.displayName,
        assignmentSource: 'Default',
        status: 'Pending',
      };

      cycle.steps = [step1, step2];
      this.scorecardApprovalCycles.push(cycle);
      this.scorecardApprovalSteps.push(step1, step2);

      scorecard.approvalCycles = [...(scorecard.approvalCycles || []), cycle];
      scorecard.scorecardStatus = ScorecardStatus.AwaitingDirectorReview;
      scorecard.currentApprovalStep = 1;
    } else {
      scorecard.scorecardStatus = ScorecardStatus.Locked;
      scorecard.isLocked = true;
      this.createVersionSnapshot(scorecard, 'Re-locked without re-approval', scorecard.finalDecisionBy || 'system');
    }

    this.scorecards[index] = scorecard;
    return { ...scorecard };
  }

  public async getScorecardVersions(scorecardId: number): Promise<IScorecardVersion[]> {
    await delay();
    return this.scorecardVersions.filter(v => v.scorecardId === scorecardId);
  }

  // ---------------------------------------------------------------------------
  // Estimating Tracker
  // ---------------------------------------------------------------------------

  public async getEstimatingRecords(options?: IListQueryOptions): Promise<IPagedResult<IEstimatingTracker>> {
    await delay();

    let filtered = [...this.estimatingRecords];

    if (options?.filter) {
      const filterStr = options.filter;
      const match = filterStr.match(/(\w+)\s+eq\s+'([^']+)'/i);
      if (match) {
        const fieldName = match[1] as keyof IEstimatingTracker;
        const fieldValue = match[2];
        filtered = filtered.filter(r => {
          const val = r[fieldName];
          return val !== undefined && val !== null && String(val) === fieldValue;
        });
      }
    }

    if (options?.orderBy) {
      const key = options.orderBy as keyof IEstimatingTracker;
      const asc = options.orderAscending !== false;
      filtered.sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;
        if (aVal < bVal) return asc ? -1 : 1;
        if (aVal > bVal) return asc ? 1 : -1;
        return 0;
      });
    }

    const totalCount = filtered.length;
    const skip = options?.skip ?? 0;
    const top = options?.top ?? filtered.length;
    const paged = filtered.slice(skip, skip + top);

    return {
      items: paged,
      totalCount,
      hasMore: skip + top < totalCount
    };
  }

  public async getEstimatingRecordById(id: number): Promise<IEstimatingTracker | null> {
    await delay();
    return this.estimatingRecords.find(r => r.id === id) ?? null;
  }

  public async getEstimatingByLeadId(leadId: number): Promise<IEstimatingTracker | null> {
    await delay();
    return this.estimatingRecords.find(r => r.LeadID === leadId) ?? null;
  }

  public async createEstimatingRecord(data: Partial<IEstimatingTracker>): Promise<IEstimatingTracker> {
    await delay();

    const newRecord: IEstimatingTracker = {
      id: this.getNextId(),
      Title: data.Title ?? '',
      LeadID: data.LeadID ?? 0,
      ProjectCode: data.ProjectCode ?? '',
      Source: data.Source,
      DeliverableType: data.DeliverableType,
      SubBidsDue: data.SubBidsDue,
      PreSubmissionReview: data.PreSubmissionReview,
      WinStrategyMeeting: data.WinStrategyMeeting,
      DueDate_OutTheDoor: data.DueDate_OutTheDoor,
      LeadEstimator: data.LeadEstimator,
      LeadEstimatorId: data.LeadEstimatorId,
      Contributors: data.Contributors,
      ContributorIds: data.ContributorIds,
      PX_ProjectExecutive: data.PX_ProjectExecutive,
      PX_ProjectExecutiveId: data.PX_ProjectExecutiveId,
      Chk_BidBond: data.Chk_BidBond,
      Chk_PPBond: data.Chk_PPBond,
      Chk_Schedule: data.Chk_Schedule,
      Chk_Logistics: data.Chk_Logistics,
      Chk_BIMProposal: data.Chk_BIMProposal,
      Chk_PreconProposal: data.Chk_PreconProposal,
      Chk_ProposalTabs: data.Chk_ProposalTabs,
      Chk_CoordMarketing: data.Chk_CoordMarketing,
      Chk_BusinessTerms: data.Chk_BusinessTerms,
      DocSetStage: data.DocSetStage,
      PreconFee: data.PreconFee,
      FeePaidToDate: data.FeePaidToDate,
      DesignBudget: data.DesignBudget,
      EstimateType: data.EstimateType,
      EstimatedCostValue: data.EstimatedCostValue,
      CostPerGSF: data.CostPerGSF,
      CostPerUnit: data.CostPerUnit,
      SubmittedDate: data.SubmittedDate,
      AwardStatus: data.AwardStatus,
      NotesFeedback: data.NotesFeedback
    };

    this.estimatingRecords.push(newRecord);
    return { ...newRecord };
  }

  public async updateEstimatingRecord(id: number, data: Partial<IEstimatingTracker>): Promise<IEstimatingTracker> {
    await delay();

    const index = this.estimatingRecords.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error(`Estimating record with id ${id} not found`);
    }

    this.estimatingRecords[index] = { ...this.estimatingRecords[index], ...data };
    return { ...this.estimatingRecords[index] };
  }

  public async getCurrentPursuits(): Promise<IEstimatingTracker[]> {
    await delay();
    return this.estimatingRecords.filter(
      r => (!r.AwardStatus || r.AwardStatus === 'Pending') && !r.SubmittedDate
    );
  }

  public async getPreconEngagements(): Promise<IEstimatingTracker[]> {
    await delay();
    // Records that have a PreconFee set indicate precon engagement activity
    return this.estimatingRecords.filter(r => r.PreconFee !== undefined && r.PreconFee !== null && r.PreconFee > 0);
  }

  public async getEstimateLog(): Promise<IEstimatingTracker[]> {
    await delay();
    // Estimate log contains records that have been submitted (have a SubmittedDate)
    return this.estimatingRecords.filter(r => r.SubmittedDate !== undefined && r.SubmittedDate !== null);
  }

  // ---------------------------------------------------------------------------
  // RBAC
  // ---------------------------------------------------------------------------

  public async getCurrentUser(): Promise<ICurrentUser> {
    await delay();

    // Dev super-admin: union of ALL role permissions
    if (this._isDevSuperAdmin) {
      const allPerms = new Set<string>();
      for (const perms of Object.values(ROLE_PERMISSIONS)) {
        for (const p of perms) allPerms.add(p);
      }
      return {
        id: 0,
        displayName: 'Dev Super-Admin',
        email: 'superadmin@hedrickbrothers.dev',
        loginName: 'i:0#.f|membership|superadmin@hedrickbrothers.dev',
        roles: [RoleName.ExecutiveLeadership],
        permissions: allPerms,
        photoUrl: undefined,
      };
    }

    const roleName = this._currentRole;
    const perms = ROLE_PERMISSIONS[roleName] ?? [];

    // Return the first real user from users.json that matches the selected role.
    // This ensures the mock user's email aligns with workflow step assignee emails.
    const matchingUser = this.users.find(
      (u: { roles: string[] }) => u.roles.includes(roleName)
    );

    const email = matchingUser?.email ?? 'devuser@hedrickbrothers.com';

    return {
      id: matchingUser?.id ?? 999,
      displayName: matchingUser?.displayName ?? 'Dev User',
      email,
      loginName: `i:0#.f|membership|${email}`,
      roles: [roleName],
      permissions: new Set<string>(perms),
      photoUrl: undefined
    };
  }

  public async getRoles(): Promise<IRole[]> {
    await delay();

    const roles: IRole[] = Object.values(RoleName).map((name, idx) => {
      const matchingUsers = this.users.filter(
        (u: { roles: string[] }) => u.roles.includes(name)
      );
      return {
        id: idx + 1,
        Title: name as RoleName,
        UserOrGroup: matchingUsers.map((u: { email: string }) => u.email),
        UserOrGroupIds: matchingUsers.map((u: { id: number }) => u.id),
        Permissions: ROLE_PERMISSIONS[name] ?? [],
        IsActive: true
      };
    });

    return roles;
  }

  public async updateRole(id: number, data: Partial<IRole>): Promise<IRole> {
    await delay();

    const roles = await this.getRoles();
    const role = roles.find(r => r.id === id);
    if (!role) {
      throw new Error(`Role with id ${id} not found`);
    }

    return { ...role, ...data };
  }

  // ---------------------------------------------------------------------------
  // Feature Flags
  // ---------------------------------------------------------------------------

  public async getFeatureFlags(): Promise<IFeatureFlag[]> {
    await delay();
    return [...this.featureFlags];
  }

  public async updateFeatureFlag(id: number, data: Partial<IFeatureFlag>): Promise<IFeatureFlag> {
    await delay();

    const index = this.featureFlags.findIndex(f => f.id === id);
    if (index === -1) {
      throw new Error(`Feature flag with id ${id} not found`);
    }

    this.featureFlags[index] = { ...this.featureFlags[index], ...data };
    return { ...this.featureFlags[index] };
  }

  // ---------------------------------------------------------------------------
  // Meetings / Calendar
  // ---------------------------------------------------------------------------

  public async getCalendarAvailability(
    emails: string[],
    _startDate: string,
    _endDate: string
  ): Promise<ICalendarAvailability[]> {
    await delay();

    return this.calendarAvailability.filter(ca => emails.includes(ca.email));
  }

  public async createMeeting(meeting: Partial<IMeeting>): Promise<IMeeting> {
    await delay();

    const newMeeting: IMeeting = {
      id: `meeting-${this.getNextId()}`,
      subject: meeting.subject ?? 'Untitled Meeting',
      type: meeting.type ?? MeetingType.Other,
      startTime: meeting.startTime ?? new Date().toISOString(),
      endTime: meeting.endTime ?? new Date().toISOString(),
      attendees: meeting.attendees ?? [],
      location: meeting.location,
      teamsLink: meeting.teamsLink ?? `https://teams.microsoft.com/l/meetup-join/${this.getNextId()}`,
      projectCode: meeting.projectCode,
      leadId: meeting.leadId,
      createdBy: meeting.createdBy ?? 'kfoster@hedrickbrothers.com',
      createdAt: new Date().toISOString()
    };

    this.meetings.push(newMeeting);
    return { ...newMeeting };
  }

  public async getMeetings(projectCode?: string): Promise<IMeeting[]> {
    await delay();

    if (projectCode) {
      return this.meetings.filter(m => m.projectCode === projectCode);
    }
    return [...this.meetings];
  }

  // ---------------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------------

  public async sendNotification(notification: Partial<INotification>): Promise<INotification> {
    await delay();

    const newNotification: INotification = {
      id: `notif-${this.getNextId()}`,
      type: notification.type ?? NotificationType.Email,
      subject: notification.subject ?? '',
      body: notification.body ?? '',
      recipients: notification.recipients ?? [],
      sentAt: new Date().toISOString(),
      sentBy: notification.sentBy ?? 'kfoster@hedrickbrothers.com',
      relatedEntityType: notification.relatedEntityType,
      relatedEntityId: notification.relatedEntityId,
      projectCode: notification.projectCode,
      status: 'sent'
    };

    this.notifications.push(newNotification);
    return { ...newNotification };
  }

  public async getNotifications(projectCode?: string): Promise<INotification[]> {
    await delay();

    if (projectCode) {
      return this.notifications.filter(n => n.projectCode === projectCode);
    }
    return [...this.notifications];
  }

  // ---------------------------------------------------------------------------
  // Audit Log
  // ---------------------------------------------------------------------------

  public async logAudit(entry: Partial<IAuditEntry>): Promise<void> {
    await delay();

    const auditEntry: IAuditEntry = {
      id: this.getNextId(),
      Timestamp: entry.Timestamp ?? new Date().toISOString(),
      User: entry.User ?? 'kfoster@hedrickbrothers.com',
      UserId: entry.UserId ?? 5,
      Action: entry.Action ?? AuditAction.LeadEdited,
      EntityType: entry.EntityType ?? EntityType.Lead,
      EntityId: entry.EntityId ?? '',
      ProjectCode: entry.ProjectCode,
      FieldChanged: entry.FieldChanged,
      PreviousValue: entry.PreviousValue,
      NewValue: entry.NewValue,
      Details: entry.Details ?? ''
    };

    this.auditLog.push(auditEntry);
  }

  public async getAuditLog(entityType?: string, entityId?: string, startDate?: string, endDate?: string): Promise<IAuditEntry[]> {
    await delay();

    let results = [...this.auditLog];

    if (entityType) {
      results = results.filter(e => e.EntityType === entityType);
    }
    if (entityId) {
      results = results.filter(e => e.EntityId === entityId);
    }
    if (startDate) {
      const start = new Date(startDate).getTime();
      results = results.filter(e => new Date(e.Timestamp).getTime() >= start);
    }
    if (endDate) {
      const end = new Date(endDate).getTime();
      results = results.filter(e => new Date(e.Timestamp).getTime() <= end);
    }

    // Return in reverse chronological order
    return results.sort((a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime());
  }

  public async getAuditLogPage(request: ICursorPageRequest): Promise<ICursorPageResult<IAuditEntry>> {
    const filters = request.filters ?? {};
    const entityType = typeof filters.entityType === 'string' ? filters.entityType : undefined;
    const entityId = typeof filters.entityId === 'string' ? filters.entityId : undefined;
    const startDate = typeof filters.startDate === 'string' ? filters.startDate : undefined;
    const endDate = typeof filters.endDate === 'string' ? filters.endDate : undefined;
    const all = await this.getAuditLog(entityType, entityId, startDate, endDate);
    return this.paginateArray(all, request);
  }

  // ---------------------------------------------------------------------------
  // Provisioning
  // ---------------------------------------------------------------------------

  public async triggerProvisioning(
    leadId: number,
    projectCode: string,
    projectName: string,
    requestedBy: string,
    metadata?: { division?: string; region?: string; clientName?: string }
  ): Promise<IProvisioningLog> {
    await delay();

    const log: IProvisioningLog = {
      id: this.getNextId(),
      projectCode,
      projectName,
      leadId,
      status: ProvisioningStatus.Queued,
      currentStep: 0,
      completedSteps: 0,
      retryCount: 0,
      requestedBy,
      requestedAt: new Date().toISOString(),
      division: metadata?.division,
      region: metadata?.region,
      clientName: metadata?.clientName,
    };

    this.provisioningLogs.push(log);
    return { ...log };
  }

  public async getProvisioningStatus(projectCode: string): Promise<IProvisioningLog | null> {
    await delay();
    const log = this.provisioningLogs.find(l => l.projectCode === projectCode);
    return log ? { ...log } : null;
  }

  public async updateProvisioningLog(
    projectCode: string,
    data: Partial<IProvisioningLog>
  ): Promise<IProvisioningLog> {
    await delay();

    const index = this.provisioningLogs.findIndex(l => l.projectCode === projectCode);
    if (index === -1) {
      throw new Error(`Provisioning log for ${projectCode} not found`);
    }

    this.provisioningLogs[index] = { ...this.provisioningLogs[index], ...data };
    return { ...this.provisioningLogs[index] };
  }

  public async getProvisioningLogs(): Promise<IProvisioningLog[]> {
    await delay();
    return [...this.provisioningLogs].sort(
      (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );
  }

  public async retryProvisioning(projectCode: string, fromStep: number): Promise<IProvisioningLog> {
    await delay();

    const index = this.provisioningLogs.findIndex(l => l.projectCode === projectCode);
    if (index === -1) {
      throw new Error(`Provisioning log for ${projectCode} not found`);
    }

    const log = this.provisioningLogs[index];
    log.status = ProvisioningStatus.InProgress;
    log.currentStep = fromStep;
    log.failedStep = undefined;
    log.errorMessage = undefined;
    log.retryCount += 1;

    return { ...log };
  }

  // ---------------------------------------------------------------------------
  // Provisioning Operations
  // ---------------------------------------------------------------------------

  public async createProjectSite(projectCode: string, _projectName: string, siteAlias: string): Promise<{ siteUrl: string }> {
    await delay();
    const siteUrl = `https://hedrickbrotherscom.sharepoint.com/sites/${siteAlias}`;
    console.log(`[Mock] Created project site: ${siteUrl} for ${projectCode}`);
    return { siteUrl };
  }

  public async provisionProjectLists(siteUrl: string, projectCode: string): Promise<void> {
    await delay();
    console.log(`[Mock] Provisioned 42 lists on ${siteUrl} for ${projectCode}`);
  }

  public async associateWithHubSite(siteUrl: string, hubSiteUrl: string): Promise<void> {
    await delay();
    console.log(`[Mock] Associated ${siteUrl} with hub ${hubSiteUrl}`);
  }

  public async createProjectSecurityGroups(siteUrl: string, projectCode: string, division: string): Promise<void> {
    await delay();
    console.log(`[Mock] Created security groups for ${projectCode} (${division}) on ${siteUrl}`);
  }

  public async copyTemplateFiles(siteUrl: string, projectCode: string, division: string): Promise<void> {
    await delay();
    console.log(`[Mock] Copied template files (${division}) to ${siteUrl} for ${projectCode}`);
  }

  public async copyLeadDataToProjectSite(siteUrl: string, leadId: number, projectCode: string): Promise<void> {
    await delay();
    console.log(`[Mock] Copied lead data (ID: ${leadId}) to ${siteUrl} for ${projectCode}`);
  }

  public async updateSiteProperties(siteUrl: string, properties: Record<string, string>): Promise<void> {
    await delay();
    console.log(`[Mock] Updated site properties on ${siteUrl}:`, Object.keys(properties));
  }

  public async createList(siteUrl: string, listName: string, _templateType: number, fields: IFieldDefinition[]): Promise<void> {
    await delay();
    console.log(`[Mock] Created list "${listName}" with ${fields.length} fields on ${siteUrl}`);
  }

  // ---------------------------------------------------------------------------
  // GitOps Template Provisioning
  // ---------------------------------------------------------------------------

  async getTemplateSiteConfig(): Promise<ITemplateSiteConfig | null> {
    await delay();
    console.log('[Mock] getTemplateSiteConfig');
    const raw = templateSiteConfigData as unknown as Record<string, unknown>;
    return {
      id: raw['id'] as number,
      templateSiteUrl: raw['TemplateSiteUrl'] as string,
      lastSnapshotHash: raw['LastSnapshotHash'] as string,
      lastSnapshotDate: raw['LastSnapshotDate'] as string,
      githubRepoOwner: raw['GitHubRepoOwner'] as string,
      githubRepoName: raw['GitHubRepoName'] as string,
      githubBranch: raw['GitHubBranch'] as string,
      active: raw['Active'] as boolean,
    };
  }

  async updateTemplateSiteConfig(data: Partial<ITemplateSiteConfig>): Promise<ITemplateSiteConfig> {
    await delay();
    console.log('[Mock] updateTemplateSiteConfig', data);
    const current = await this.getTemplateSiteConfig();
    return { ...current!, ...data };
  }

  async getCommittedTemplateRegistry(): Promise<ITemplateRegistry> {
    await delay();
    console.log('[Mock] getCommittedTemplateRegistry');
    const raw = templateRegistryData as unknown as Array<Record<string, unknown>>;
    return {
      version: '1.0.0',
      lastModified: new Date().toISOString(),
      lastModifiedBy: 'mock@hedrickbrothers.com',
      templates: raw.map(r => ({
        id: String(r['id']),
        templateName: r['TemplateName'] as string,
        sourcePath: r['SourceURL'] as string,
        targetFolder: r['TargetFolder'] as string,
        fileName: (r['SourceURL'] as string).split('/').pop() ?? '',
        division: r['Division'] as 'Both' | 'Commercial' | 'Luxury Residential',
        active: r['Active'] as boolean,
        fileHash: `sha256:mock-hash-${r['id']}`,
        fileSize: 50000,
        lastModifiedInTemplateSite: '2026-01-15T10:00:00Z',
      })),
    };
  }

  async getTemplateSiteFiles(): Promise<ITemplateFileMetadata[]> {
    await delay();
    console.log('[Mock] getTemplateSiteFiles');
    // In mock mode, return same entries as registry (zero-diff by default)
    const registry = await this.getCommittedTemplateRegistry();
    return registry.templates.map(t => ({
      sourcePath: t.sourcePath,
      fileName: t.fileName,
      fileHash: t.fileHash,
      fileSize: t.fileSize,
      lastModified: t.lastModifiedInTemplateSite,
      division: t.division,
    }));
  }

  async applyGitOpsTemplates(siteUrl: string, division: string, registry: ITemplateRegistry): Promise<{ appliedCount: number }> {
    await delay();
    const applicable = registry.templates.filter(
      t => t.active && (t.division === 'Both' || t.division === division)
    );
    console.log(`[Mock] applyGitOpsTemplates → siteUrl=${siteUrl}, division=${division}, appliedCount=${applicable.length}`);
    return { appliedCount: applicable.length };
  }

  async logTemplateSyncPR(entry: Omit<ITemplateManifestLog, 'id'>): Promise<ITemplateManifestLog> {
    await delay();
    const id = this.getNextId();
    const log: ITemplateManifestLog = { id, ...entry };
    console.log('[Mock] logTemplateSyncPR', log);
    return log;
  }

  // ---------------------------------------------------------------------------
  // Phase 6 — Workflow
  // ---------------------------------------------------------------------------

  public async getTeamMembers(projectCode: string): Promise<ITeamMember[]> {
    await delay();
    return this.teamMembers.filter(tm => tm.projectCode === projectCode);
  }

  public async getDeliverables(projectCode: string): Promise<IDeliverable[]> {
    await delay();
    return this.deliverables.filter(d => d.projectCode === projectCode);
  }

  public async createDeliverable(data: Partial<IDeliverable>): Promise<IDeliverable> {
    await delay();
    const newItem: IDeliverable = {
      id: this.getNextId(),
      projectCode: data.projectCode ?? '',
      name: data.name ?? '',
      department: data.department ?? 'BD',
      assignedTo: data.assignedTo ?? '',
      assignedToId: data.assignedToId,
      status: data.status ?? 'Not Started' as IDeliverable['status'],
      dueDate: data.dueDate ?? new Date().toISOString().split('T')[0],
      completedDate: data.completedDate,
      notes: data.notes,
    };
    this.deliverables.push(newItem);
    return { ...newItem };
  }

  public async updateDeliverable(id: number, data: Partial<IDeliverable>): Promise<IDeliverable> {
    await delay();
    const index = this.deliverables.findIndex(d => d.id === id);
    if (index === -1) throw new Error(`Deliverable with id ${id} not found`);
    this.deliverables[index] = { ...this.deliverables[index], ...data };
    return { ...this.deliverables[index] };
  }

  public async getInterviewPrep(leadId: number): Promise<IInterviewPrep | null> {
    await delay();
    return this.interviewPreps.find(ip => ip.leadId === leadId) ?? null;
  }

  public async saveInterviewPrep(data: Partial<IInterviewPrep>): Promise<IInterviewPrep> {
    await delay();
    const existing = this.interviewPreps.findIndex(ip => ip.leadId === data.leadId);
    if (existing >= 0) {
      this.interviewPreps[existing] = { ...this.interviewPreps[existing], ...data };
      return { ...this.interviewPreps[existing] };
    }
    const newItem: IInterviewPrep = {
      id: this.getNextId(),
      leadId: data.leadId ?? 0,
      projectCode: data.projectCode ?? '',
      interviewDate: data.interviewDate,
      interviewLocation: data.interviewLocation,
      panelMembers: data.panelMembers ?? [],
      presentationTheme: data.presentationTheme,
      keyMessages: data.keyMessages,
      teamAssignments: data.teamAssignments,
      rehearsalDate: data.rehearsalDate,
      documents: data.documents,
    };
    this.interviewPreps.push(newItem);
    return { ...newItem };
  }

  public async getContractInfo(projectCode: string): Promise<IContractInfo | null> {
    await delay();
    return this.contractInfos.find(c => c.projectCode === projectCode) ?? null;
  }

  public async saveContractInfo(data: Partial<IContractInfo>): Promise<IContractInfo> {
    await delay();
    const existing = this.contractInfos.findIndex(c => c.projectCode === data.projectCode);
    if (existing >= 0) {
      this.contractInfos[existing] = { ...this.contractInfos[existing], ...data };
      return { ...this.contractInfos[existing] };
    }
    const newItem: IContractInfo = {
      id: this.getNextId(),
      leadId: data.leadId ?? 0,
      projectCode: data.projectCode ?? '',
      contractStatus: data.contractStatus ?? 'Draft',
      contractType: data.contractType,
      contractValue: data.contractValue,
      insuranceRequirements: data.insuranceRequirements,
      bondRequirements: data.bondRequirements,
      executionDate: data.executionDate,
      noticeToProceed: data.noticeToProceed,
      substantialCompletion: data.substantialCompletion,
      finalCompletion: data.finalCompletion,
      documents: data.documents,
    };
    this.contractInfos.push(newItem);
    return { ...newItem };
  }

  public async getTurnoverItems(projectCode: string): Promise<ITurnoverItem[]> {
    await delay();
    return this.turnoverItems.filter(t => t.projectCode === projectCode);
  }

  public async updateTurnoverItem(id: number, data: Partial<ITurnoverItem>): Promise<ITurnoverItem> {
    await delay();
    const index = this.turnoverItems.findIndex(t => t.id === id);
    if (index === -1) throw new Error(`Turnover item with id ${id} not found`);
    this.turnoverItems[index] = { ...this.turnoverItems[index], ...data };
    return { ...this.turnoverItems[index] };
  }

  public async getCloseoutItems(projectCode: string): Promise<ICloseoutItem[]> {
    await delay();
    return this.closeoutItems.filter(c => c.projectCode === projectCode && !c.isHidden);
  }

  public async updateCloseoutItem(id: number, data: Partial<ICloseoutItem>): Promise<ICloseoutItem> {
    await delay();
    const index = this.closeoutItems.findIndex(c => c.id === id);
    if (index === -1) throw new Error(`Closeout item with id ${id} not found`);
    this.closeoutItems[index] = { ...this.closeoutItems[index], ...data };
    return { ...this.closeoutItems[index] };
  }

  public async addCloseoutItem(projectCode: string, item: Partial<ICloseoutItem>): Promise<ICloseoutItem> {
    await delay();
    const newItem: ICloseoutItem = {
      id: this.getNextId(),
      projectCode,
      category: item.sectionName ?? item.category ?? '',
      description: item.label ?? item.description ?? 'Custom item',
      status: 'NoResponse',
      assignedTo: item.assignedTo ?? '',
      assignedToId: item.assignedToId,
      completedDate: undefined,
      notes: undefined,
      sectionNumber: item.sectionNumber ?? 1,
      sectionName: item.sectionName ?? 'Tasks',
      itemNumber: item.itemNumber ?? 'C.1',
      label: item.label ?? 'Custom item',
      responseType: item.responseType ?? 'yesNoNA',
      response: null,
      respondedBy: undefined,
      respondedDate: undefined,
      comment: undefined,
      isHidden: false,
      isCustom: true,
      sortOrder: item.sortOrder ?? 100,
    };
    this.closeoutItems.push(newItem);
    return { ...newItem };
  }

  public async removeCloseoutItem(projectCode: string, itemId: number): Promise<void> {
    await delay();
    const index = this.closeoutItems.findIndex(c => c.id === itemId && c.projectCode === projectCode);
    if (index === -1) throw new Error(`Closeout item with id ${itemId} not found`);
    this.closeoutItems[index].isHidden = true;
  }

  public async getLossAutopsy(leadId: number): Promise<ILossAutopsy | null> {
    await delay();
    return this.lossAutopsies.find(la => la.leadId === leadId) ?? null;
  }

  public async saveLossAutopsy(data: Partial<ILossAutopsy>): Promise<ILossAutopsy> {
    await delay();
    const existing = this.lossAutopsies.findIndex(la => la.leadId === data.leadId);
    if (existing >= 0) {
      this.lossAutopsies[existing] = { ...this.lossAutopsies[existing], ...data };
      return { ...this.lossAutopsies[existing] };
    }
    const newItem: ILossAutopsy = {
      id: this.getNextId(),
      leadId: data.leadId ?? 0,
      projectCode: data.projectCode,
      rootCauseAnalysis: data.rootCauseAnalysis,
      lessonsLearned: data.lessonsLearned,
      competitiveIntelligence: data.competitiveIntelligence,
      actionItems: data.actionItems ?? [],
      meetingNotes: data.meetingNotes,
      completedDate: data.completedDate,
      completedBy: data.completedBy,
      // Estimating process questions
      realisticTimeline: data.realisticTimeline ?? null,
      scopesBeforeProposals: data.scopesBeforeProposals ?? null,
      threeBidsPerTrade: data.threeBidsPerTrade ?? null,
      reasonableITBTime: data.reasonableITBTime ?? null,
      bidsSavedProperly: data.bidsSavedProperly ?? null,
      multipleSubCommunications: data.multipleSubCommunications ?? null,
      vettedProposals: data.vettedProposals ?? null,
      reasonableSpread: data.reasonableSpread ?? null,
      pricesMatchHistorical: data.pricesMatchHistorical ?? null,
      veOptionsOffered: data.veOptionsOffered ?? null,
      deliverablesOnTime: data.deliverablesOnTime ?? null,
      // Scoring & discussion
      processScore: data.processScore ?? 0,
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      opportunities: data.opportunities,
      challenges: data.challenges,
      overallRating: data.overallRating ?? 0,
      // Meeting & status
      meetingScheduledDate: data.meetingScheduledDate,
      meetingAttendees: data.meetingAttendees ?? [],
      isFinalized: data.isFinalized ?? false,
      finalizedDate: data.finalizedDate,
      finalizedBy: data.finalizedBy,
    };
    this.lossAutopsies.push(newItem);
    return { ...newItem };
  }

  public async finalizeLossAutopsy(leadId: number, data: Partial<ILossAutopsy>): Promise<ILossAutopsy> {
    await delay();
    const index = this.lossAutopsies.findIndex(la => la.leadId === leadId);
    if (index === -1) throw new Error(`No autopsy found for lead ${leadId}`);
    this.lossAutopsies[index] = {
      ...this.lossAutopsies[index],
      ...data,
      isFinalized: true,
      finalizedDate: new Date().toISOString(),
      finalizedBy: data.finalizedBy ?? 'system',
    };
    return { ...this.lossAutopsies[index] };
  }

  public async isAutopsyFinalized(leadId: number): Promise<boolean> {
    await delay();
    const autopsy = this.lossAutopsies.find(la => la.leadId === leadId);
    return autopsy?.isFinalized ?? false;
  }

  public async getAllLossAutopsies(): Promise<ILossAutopsy[]> {
    await delay();
    return this.lossAutopsies.map(a => ({ ...a }));
  }

  // ---------------------------------------------------------------------------
  // Startup Checklist
  // ---------------------------------------------------------------------------

  public async getStartupChecklist(projectCode: string): Promise<IStartupChecklistItem[]> {
    await delay();
    return this.checklistItems.filter(i => i.projectCode === projectCode && !i.isHidden);
  }

  public async getStartupChecklistPage(request: ICursorPageRequest): Promise<ICursorPageResult<IStartupChecklistItem>> {
    await delay();
    const projectCode = request.projectCode ?? String(request.filters?.projectCode ?? '');
    const items = this.checklistItems
      .filter(i => i.projectCode === projectCode && !i.isHidden)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return this.paginateArray(items, request);
  }

  public async updateChecklistItem(projectCode: string, itemId: number, data: Partial<IStartupChecklistItem>): Promise<IStartupChecklistItem> {
    await delay();
    const index = this.checklistItems.findIndex(i => i.id === itemId && i.projectCode === projectCode);
    if (index === -1) throw new Error(`Checklist item ${itemId} not found`);
    this.checklistItems[index] = { ...this.checklistItems[index], ...data };
    return { ...this.checklistItems[index] };
  }

  public async addChecklistItem(projectCode: string, item: Partial<IStartupChecklistItem>): Promise<IStartupChecklistItem> {
    await delay();
    const newItem: IStartupChecklistItem = {
      id: this.getNextId(),
      projectCode,
      sectionNumber: item.sectionNumber ?? 2,
      sectionName: item.sectionName ?? 'Job Start-up',
      itemNumber: item.itemNumber ?? 'C.1',
      label: item.label ?? 'Custom item',
      responseType: item.responseType ?? 'yesNoNA',
      response: null,
      status: 'NoResponse',
      respondedBy: null,
      respondedDate: null,
      assignedTo: null,
      assignedToName: null,
      comment: null,
      isHidden: false,
      isCustom: true,
      sortOrder: item.sortOrder ?? 100,
      activityLog: [],
    };
    this.checklistItems.push(newItem);
    return { ...newItem };
  }

  public async removeChecklistItem(projectCode: string, itemId: number): Promise<void> {
    await delay();
    const index = this.checklistItems.findIndex(i => i.id === itemId && i.projectCode === projectCode);
    if (index === -1) throw new Error(`Checklist item ${itemId} not found`);
    this.checklistItems[index].isHidden = true;
  }

  // ---------------------------------------------------------------------------
  // Internal Responsibility Matrix
  // ---------------------------------------------------------------------------

  public async getInternalMatrix(projectCode: string): Promise<IInternalMatrixTask[]> {
    await delay();
    return this.internalMatrixTasks.filter(t => t.projectCode === projectCode && !t.isHidden);
  }

  public async updateInternalMatrixTask(projectCode: string, taskId: number, data: Partial<IInternalMatrixTask>): Promise<IInternalMatrixTask> {
    await delay();
    const index = this.internalMatrixTasks.findIndex(t => t.id === taskId && t.projectCode === projectCode);
    if (index === -1) throw new Error(`Matrix task ${taskId} not found`);
    this.internalMatrixTasks[index] = { ...this.internalMatrixTasks[index], ...data };
    return { ...this.internalMatrixTasks[index] };
  }

  public async addInternalMatrixTask(projectCode: string, task: Partial<IInternalMatrixTask>): Promise<IInternalMatrixTask> {
    await delay();
    const newTask: IInternalMatrixTask = {
      id: this.getNextId(),
      projectCode,
      sortOrder: task.sortOrder ?? 100,
      taskCategory: task.taskCategory ?? 'All',
      taskDescription: task.taskDescription ?? 'Custom task',
      PX: task.PX ?? '',
      SrPM: task.SrPM ?? '',
      PM2: task.PM2 ?? '',
      PM1: task.PM1 ?? '',
      PA: task.PA ?? '',
      QAQC: task.QAQC ?? '',
      ProjAcct: task.ProjAcct ?? '',
      isHidden: false,
      isCustom: true,
    };
    this.internalMatrixTasks.push(newTask);
    return { ...newTask };
  }

  public async removeInternalMatrixTask(projectCode: string, taskId: number): Promise<void> {
    await delay();
    const index = this.internalMatrixTasks.findIndex(t => t.id === taskId && t.projectCode === projectCode);
    if (index === -1) throw new Error(`Matrix task ${taskId} not found`);
    this.internalMatrixTasks[index].isHidden = true;
  }

  // ---------------------------------------------------------------------------
  // Team Role Assignments
  // ---------------------------------------------------------------------------

  public async getTeamRoleAssignments(projectCode: string): Promise<ITeamRoleAssignment[]> {
    await delay();
    return this.teamRoleAssignments.filter(a => a.projectCode === projectCode);
  }

  public async updateTeamRoleAssignment(projectCode: string, role: string, person: string, email?: string): Promise<ITeamRoleAssignment> {
    await delay();
    const index = this.teamRoleAssignments.findIndex(a => a.projectCode === projectCode && a.roleAbbreviation === role);
    if (index !== -1) {
      this.teamRoleAssignments[index].assignedPerson = person;
      this.teamRoleAssignments[index].assignedPersonEmail = email ?? '';
      return { ...this.teamRoleAssignments[index] };
    }
    const newAssignment: ITeamRoleAssignment = { projectCode, roleAbbreviation: role, assignedPerson: person, assignedPersonEmail: email ?? '' };
    this.teamRoleAssignments.push(newAssignment);
    return { ...newAssignment };
  }

  // ---------------------------------------------------------------------------
  // Owner Contract Matrix
  // ---------------------------------------------------------------------------

  public async getOwnerContractMatrix(projectCode: string): Promise<IOwnerContractArticle[]> {
    await delay();
    return this.ownerContractArticles.filter(a => a.projectCode === projectCode && !a.isHidden);
  }

  public async updateOwnerContractArticle(projectCode: string, itemId: number, data: Partial<IOwnerContractArticle>): Promise<IOwnerContractArticle> {
    await delay();
    const index = this.ownerContractArticles.findIndex(a => a.id === itemId && a.projectCode === projectCode);
    if (index === -1) throw new Error(`Owner contract article ${itemId} not found`);
    this.ownerContractArticles[index] = { ...this.ownerContractArticles[index], ...data };
    return { ...this.ownerContractArticles[index] };
  }

  public async addOwnerContractArticle(projectCode: string, item: Partial<IOwnerContractArticle>): Promise<IOwnerContractArticle> {
    await delay();
    const newArticle: IOwnerContractArticle = {
      id: this.getNextId(),
      projectCode,
      sortOrder: item.sortOrder ?? 100,
      articleNumber: item.articleNumber ?? '',
      pageNumber: item.pageNumber ?? '',
      responsibleParty: item.responsibleParty ?? '',
      description: item.description ?? 'Custom article',
      isHidden: false,
      isCustom: true,
    };
    this.ownerContractArticles.push(newArticle);
    return { ...newArticle };
  }

  public async removeOwnerContractArticle(projectCode: string, itemId: number): Promise<void> {
    await delay();
    const index = this.ownerContractArticles.findIndex(a => a.id === itemId && a.projectCode === projectCode);
    if (index === -1) throw new Error(`Owner contract article ${itemId} not found`);
    this.ownerContractArticles[index].isHidden = true;
  }

  // ---------------------------------------------------------------------------
  // Sub-Contract Matrix
  // ---------------------------------------------------------------------------

  public async getSubContractMatrix(projectCode: string): Promise<ISubContractClause[]> {
    await delay();
    return this.subContractClauses.filter(c => c.projectCode === projectCode && !c.isHidden);
  }

  public async updateSubContractClause(projectCode: string, itemId: number, data: Partial<ISubContractClause>): Promise<ISubContractClause> {
    await delay();
    const index = this.subContractClauses.findIndex(c => c.id === itemId && c.projectCode === projectCode);
    if (index === -1) throw new Error(`Subcontract clause ${itemId} not found`);
    this.subContractClauses[index] = { ...this.subContractClauses[index], ...data };
    return { ...this.subContractClauses[index] };
  }

  public async addSubContractClause(projectCode: string, item: Partial<ISubContractClause>): Promise<ISubContractClause> {
    await delay();
    const newClause: ISubContractClause = {
      id: this.getNextId(),
      projectCode,
      sortOrder: item.sortOrder ?? 100,
      refNumber: item.refNumber ?? '',
      pageNumber: item.pageNumber ?? '',
      clauseDescription: item.clauseDescription ?? 'Custom clause',
      ProjExec: item.ProjExec ?? '',
      ProjMgr: item.ProjMgr ?? '',
      AsstPM: item.AsstPM ?? '',
      Super: item.Super ?? '',
      ProjAdmin: item.ProjAdmin ?? '',
      isHidden: false,
      isCustom: true,
    };
    this.subContractClauses.push(newClause);
    return { ...newClause };
  }

  public async removeSubContractClause(projectCode: string, itemId: number): Promise<void> {
    await delay();
    const index = this.subContractClauses.findIndex(c => c.id === itemId && c.projectCode === projectCode);
    if (index === -1) throw new Error(`Subcontract clause ${itemId} not found`);
    this.subContractClauses[index].isHidden = true;
  }

  // ---------------------------------------------------------------------------
  // Marketing Project Record
  // ---------------------------------------------------------------------------

  public async getMarketingProjectRecord(projectCode: string): Promise<IMarketingProjectRecord | null> {
    await delay();
    return this.marketingRecords.find(r => r.projectCode === projectCode) ?? null;
  }

  public async createMarketingProjectRecord(data: Partial<IMarketingProjectRecord>): Promise<IMarketingProjectRecord> {
    await delay();
    const newRecord: IMarketingProjectRecord = {
      projectName: data.projectName ?? '',
      projectCode: data.projectCode ?? '',
      leadId: data.leadId ?? null,
      contractType: data.contractType ?? [],
      deliveryMethod: data.deliveryMethod ?? '',
      architect: data.architect ?? '',
      landscapeArchitect: data.landscapeArchitect ?? '',
      interiorDesigner: data.interiorDesigner ?? '',
      engineer: data.engineer ?? '',
      buildingSystemType: data.buildingSystemType ?? '',
      projectDescription: data.projectDescription ?? '',
      uniqueCharacteristics: data.uniqueCharacteristics ?? '',
      renderingUrls: data.renderingUrls ?? [],
      finalPhotoUrls: data.finalPhotoUrls ?? [],
      contractBudget: data.contractBudget ?? null,
      contractFinalCost: data.contractFinalCost ?? null,
      totalCostPerGSF: data.totalCostPerGSF ?? null,
      totalBudgetVariance: data.totalBudgetVariance ?? null,
      budgetExplanation: data.budgetExplanation ?? '',
      CO_OwnerDirected_Count: data.CO_OwnerDirected_Count ?? null,
      CO_OwnerDirected_Value: data.CO_OwnerDirected_Value ?? null,
      CO_MunicipalityDirected_Count: data.CO_MunicipalityDirected_Count ?? null,
      CO_MunicipalityDirected_Value: data.CO_MunicipalityDirected_Value ?? null,
      CO_EO_Count: data.CO_EO_Count ?? null,
      CO_EO_Value: data.CO_EO_Value ?? null,
      CO_ContractorDirected_Count: data.CO_ContractorDirected_Count ?? null,
      savingsReturned: data.savingsReturned ?? null,
      savingsReturnedPct: data.savingsReturnedPct ?? null,
      scheduleStartAnticipated: data.scheduleStartAnticipated ?? null,
      scheduleStartActual: data.scheduleStartActual ?? null,
      scheduleEndAnticipated: data.scheduleEndAnticipated ?? null,
      scheduleEndActual: data.scheduleEndActual ?? null,
      onSchedule: data.onSchedule ?? '',
      scheduleExplanation: data.scheduleExplanation ?? '',
      substantialCompletionDate: data.substantialCompletionDate ?? null,
      finalCompletionDate: data.finalCompletionDate ?? null,
      punchListItems: data.punchListItems ?? null,
      punchListDaysToComplete: data.punchListDaysToComplete ?? null,
      innovativeSafetyPrograms: data.innovativeSafetyPrograms ?? '',
      mwbeRequirement: data.mwbeRequirement ?? '',
      mwbeAchievement: data.mwbeAchievement ?? '',
      sbeRequirement: data.sbeRequirement ?? '',
      sbeAchievement: data.sbeAchievement ?? '',
      localRequirement: data.localRequirement ?? '',
      localAchievement: data.localAchievement ?? '',
      leedDesignation: data.leedDesignation ?? '',
      sustainabilityFeatures: data.sustainabilityFeatures ?? '',
      leedAdditionalCost: data.leedAdditionalCost ?? null,
      CS_Conflicts: data.CS_Conflicts ?? '',
      CS_CostControl: data.CS_CostControl ?? '',
      CS_ValueEngineering: data.CS_ValueEngineering ?? '',
      CS_QualityControl: data.CS_QualityControl ?? '',
      CS_Schedule: data.CS_Schedule ?? '',
      CS_Team: data.CS_Team ?? '',
      CS_Safety: data.CS_Safety ?? '',
      CS_LEED: data.CS_LEED ?? '',
      CS_SupplierDiversity: data.CS_SupplierDiversity ?? '',
      CS_Challenges: data.CS_Challenges ?? '',
      CS_InnovativeSolutions: data.CS_InnovativeSolutions ?? '',
      CS_ProductsSystems: data.CS_ProductsSystems ?? '',
      CS_ClientService: data.CS_ClientService ?? '',
      CS_LessonsLearned: data.CS_LessonsLearned ?? '',
      sectionCompletion: data.sectionCompletion ?? {},
      overallCompletion: data.overallCompletion ?? 0,
      lastUpdatedBy: 'kfoster@hedrickbrothers.com',
      lastUpdatedAt: new Date().toISOString(),
      createdBy: 'kfoster@hedrickbrothers.com',
      createdAt: new Date().toISOString(),
    };
    this.marketingRecords.push(newRecord);
    return { ...newRecord };
  }

  public async updateMarketingProjectRecord(projectCode: string, data: Partial<IMarketingProjectRecord>): Promise<IMarketingProjectRecord> {
    await delay();
    const index = this.marketingRecords.findIndex(r => r.projectCode === projectCode);
    if (index === -1) throw new Error(`Marketing record for ${projectCode} not found`);
    this.marketingRecords[index] = { ...this.marketingRecords[index], ...data, lastUpdatedAt: new Date().toISOString() };
    return { ...this.marketingRecords[index] };
  }

  public async getAllMarketingProjectRecords(): Promise<IMarketingProjectRecord[]> {
    await delay();
    return [...this.marketingRecords];
  }

  // ---------------------------------------------------------------------------
  // Risk & Cost Management
  // ---------------------------------------------------------------------------

  private assembleRiskCostRecord(record: IRiskCostManagement): IRiskCostManagement {
    const items = this.riskCostItems.filter(i => i.projectCode === record.projectCode);
    return {
      ...record,
      buyoutOpportunities: items.filter(i => i.category === 'Buyout'),
      potentialRisks: items.filter(i => i.category === 'Risk'),
      potentialSavings: items.filter(i => i.category === 'Savings'),
    };
  }

  public async getRiskCostManagement(projectCode: string): Promise<IRiskCostManagement | null> {
    await delay();
    const record = this.riskCostRecords.find(r => r.projectCode === projectCode);
    return record ? this.assembleRiskCostRecord(record) : null;
  }

  public async updateRiskCostManagement(projectCode: string, data: Partial<IRiskCostManagement>): Promise<IRiskCostManagement> {
    await delay();
    const index = this.riskCostRecords.findIndex(r => r.projectCode === projectCode);
    if (index === -1) throw new Error(`Risk/Cost record for ${projectCode} not found`);
    this.riskCostRecords[index] = { ...this.riskCostRecords[index], ...data, lastUpdatedAt: new Date().toISOString() };
    return this.assembleRiskCostRecord(this.riskCostRecords[index]);
  }

  public async addRiskCostItem(projectCode: string, item: Partial<IRiskCostItem>): Promise<IRiskCostItem> {
    await delay();
    const record = this.riskCostRecords.find(r => r.projectCode === projectCode);
    if (!record) throw new Error(`Risk/Cost record for ${projectCode} not found`);
    const newItem: IRiskCostItem = {
      id: this.getNextId(),
      projectCode,
      riskCostId: record.id,
      category: item.category ?? 'Risk',
      letter: item.letter ?? 'A',
      description: item.description ?? '',
      estimatedValue: item.estimatedValue ?? 0,
      status: item.status ?? 'Open',
      notes: item.notes ?? '',
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0],
    };
    this.riskCostItems.push(newItem);
    record.lastUpdatedAt = new Date().toISOString();
    return { ...newItem };
  }

  public async updateRiskCostItem(projectCode: string, itemId: number, data: Partial<IRiskCostItem>): Promise<IRiskCostItem> {
    await delay();
    const record = this.riskCostRecords.find(r => r.projectCode === projectCode);
    if (!record) throw new Error(`Risk/Cost record for ${projectCode} not found`);
    const idx = this.riskCostItems.findIndex(i => i.id === itemId);
    if (idx === -1) throw new Error(`Risk/Cost item ${itemId} not found`);
    this.riskCostItems[idx] = { ...this.riskCostItems[idx], ...data, updatedDate: new Date().toISOString().split('T')[0] };
    record.lastUpdatedAt = new Date().toISOString();
    return { ...this.riskCostItems[idx] };
  }

  // ---------------------------------------------------------------------------
  // Quality Concerns
  // ---------------------------------------------------------------------------

  public async getQualityConcerns(projectCode: string): Promise<IQualityConcern[]> {
    await delay();
    return this.qualityConcerns.filter(c => c.projectCode === projectCode);
  }

  public async addQualityConcern(projectCode: string, concern: Partial<IQualityConcern>): Promise<IQualityConcern> {
    await delay();
    const newConcern: IQualityConcern = {
      id: this.getNextId(),
      projectCode,
      letter: concern.letter ?? 'A',
      description: concern.description ?? '',
      raisedBy: concern.raisedBy ?? '',
      raisedDate: concern.raisedDate ?? new Date().toISOString().split('T')[0],
      status: concern.status ?? 'Open',
      resolution: concern.resolution ?? '',
      resolvedDate: null,
      notes: concern.notes ?? '',
    };
    this.qualityConcerns.push(newConcern);
    return { ...newConcern };
  }

  public async updateQualityConcern(projectCode: string, concernId: number, data: Partial<IQualityConcern>): Promise<IQualityConcern> {
    await delay();
    const index = this.qualityConcerns.findIndex(c => c.id === concernId && c.projectCode === projectCode);
    if (index === -1) throw new Error(`Quality concern ${concernId} not found`);
    this.qualityConcerns[index] = { ...this.qualityConcerns[index], ...data };
    return { ...this.qualityConcerns[index] };
  }

  // ---------------------------------------------------------------------------
  // Safety Concerns
  // ---------------------------------------------------------------------------

  public async getSafetyConcerns(projectCode: string): Promise<ISafetyConcern[]> {
    await delay();
    return this.safetyConcerns.filter(c => c.projectCode === projectCode);
  }

  public async addSafetyConcern(projectCode: string, concern: Partial<ISafetyConcern>): Promise<ISafetyConcern> {
    await delay();
    const newConcern: ISafetyConcern = {
      id: this.getNextId(),
      projectCode,
      safetyOfficerName: concern.safetyOfficerName ?? '',
      safetyOfficerEmail: concern.safetyOfficerEmail ?? '',
      letter: concern.letter ?? 'A',
      description: concern.description ?? '',
      severity: concern.severity ?? 'Medium',
      raisedBy: concern.raisedBy ?? '',
      raisedDate: concern.raisedDate ?? new Date().toISOString().split('T')[0],
      status: concern.status ?? 'Open',
      resolution: concern.resolution ?? '',
      resolvedDate: null,
      notes: concern.notes ?? '',
    };
    this.safetyConcerns.push(newConcern);
    return { ...newConcern };
  }

  public async updateSafetyConcern(projectCode: string, concernId: number, data: Partial<ISafetyConcern>): Promise<ISafetyConcern> {
    await delay();
    const index = this.safetyConcerns.findIndex(c => c.id === concernId && c.projectCode === projectCode);
    if (index === -1) throw new Error(`Safety concern ${concernId} not found`);
    this.safetyConcerns[index] = { ...this.safetyConcerns[index], ...data };
    return { ...this.safetyConcerns[index] };
  }

  // ---------------------------------------------------------------------------
  // Project Schedule & Critical Path
  // ---------------------------------------------------------------------------

  private assembleScheduleRecord(record: IProjectScheduleCriticalPath): IProjectScheduleCriticalPath {
    return {
      ...record,
      criticalPathConcerns: this.criticalPathItems.filter(i => i.projectCode === record.projectCode),
    };
  }

  public async getProjectSchedule(projectCode: string): Promise<IProjectScheduleCriticalPath | null> {
    await delay();
    const record = this.scheduleRecords.find(s => s.projectCode === projectCode);
    return record ? this.assembleScheduleRecord(record) : null;
  }

  public async updateProjectSchedule(projectCode: string, data: Partial<IProjectScheduleCriticalPath>): Promise<IProjectScheduleCriticalPath> {
    await delay();
    const index = this.scheduleRecords.findIndex(s => s.projectCode === projectCode);
    if (index === -1) throw new Error(`Schedule for ${projectCode} not found`);
    this.scheduleRecords[index] = { ...this.scheduleRecords[index], ...data, lastUpdatedAt: new Date().toISOString() };
    return this.assembleScheduleRecord(this.scheduleRecords[index]);
  }

  public async addCriticalPathItem(projectCode: string, item: Partial<ICriticalPathItem>): Promise<ICriticalPathItem> {
    await delay();
    const record = this.scheduleRecords.find(s => s.projectCode === projectCode);
    if (!record) throw new Error(`Schedule for ${projectCode} not found`);
    const newItem: ICriticalPathItem = {
      id: this.getNextId(),
      projectCode,
      scheduleId: record.id,
      letter: item.letter ?? 'A',
      description: item.description ?? '',
      impactDescription: item.impactDescription ?? '',
      status: item.status ?? 'Active',
      mitigationPlan: item.mitigationPlan ?? '',
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0],
    };
    this.criticalPathItems.push(newItem);
    record.lastUpdatedAt = new Date().toISOString();
    return { ...newItem };
  }

  // ---------------------------------------------------------------------------
  // Superintendent Plan
  // ---------------------------------------------------------------------------

  private assembleSuperintendentPlan(plan: ISuperintendentPlan): ISuperintendentPlan {
    return {
      ...plan,
      sections: this.superintendentPlanSections.filter(s => s.superintendentPlanId === plan.id),
    };
  }

  public async getSuperintendentPlan(projectCode: string): Promise<ISuperintendentPlan | null> {
    await delay();
    const plan = this.superintendentPlans.find(p => p.projectCode === projectCode);
    return plan ? this.assembleSuperintendentPlan(plan) : null;
  }

  public async updateSuperintendentPlanSection(projectCode: string, sectionId: number, data: Partial<ISuperintendentPlanSection>): Promise<ISuperintendentPlanSection> {
    await delay();
    const plan = this.superintendentPlans.find(p => p.projectCode === projectCode);
    if (!plan) throw new Error(`Superintendent plan for ${projectCode} not found`);
    const idx = this.superintendentPlanSections.findIndex(s => s.id === sectionId && s.superintendentPlanId === plan.id);
    if (idx === -1) throw new Error(`Section ${sectionId} not found`);
    this.superintendentPlanSections[idx] = { ...this.superintendentPlanSections[idx], ...data };
    plan.lastUpdatedAt = new Date().toISOString();
    return { ...this.superintendentPlanSections[idx] };
  }

  public async createSuperintendentPlan(projectCode: string, data: Partial<ISuperintendentPlan>): Promise<ISuperintendentPlan> {
    await delay();
    const planId = this.getNextId();
    const newPlan: ISuperintendentPlan = {
      id: planId,
      projectCode,
      superintendentName: data.superintendentName ?? '',
      sections: [],
      createdBy: 'kfoster@hedrickbrothers.com',
      createdAt: new Date().toISOString(),
      lastUpdatedBy: 'kfoster@hedrickbrothers.com',
      lastUpdatedAt: new Date().toISOString(),
    };
    // Flatten sections into the flat array
    if (data.sections) {
      for (const sec of data.sections) {
        this.superintendentPlanSections.push({ ...sec, superintendentPlanId: planId, projectCode });
      }
    }
    this.superintendentPlans.push(newPlan);
    return this.assembleSuperintendentPlan(newPlan);
  }

  // ---------------------------------------------------------------------------
  // Lessons Learned
  // ---------------------------------------------------------------------------

  public async getLessonsLearned(projectCode: string): Promise<ILessonLearned[]> {
    await delay();
    return this.lessonsLearned.filter(l => l.projectCode === projectCode);
  }

  public async addLessonLearned(projectCode: string, lesson: Partial<ILessonLearned>): Promise<ILessonLearned> {
    await delay();
    const newLesson: ILessonLearned = {
      id: this.getNextId(),
      projectCode,
      title: lesson.title ?? '',
      category: lesson.category ?? 'Other',
      impact: lesson.impact ?? 'Neutral',
      description: lesson.description ?? '',
      recommendation: lesson.recommendation ?? '',
      raisedBy: lesson.raisedBy ?? '',
      raisedDate: lesson.raisedDate ?? new Date().toISOString().split('T')[0],
      phase: lesson.phase ?? 'Construction',
      isIncludedInFinalRecord: lesson.isIncludedInFinalRecord ?? false,
      tags: lesson.tags ?? [],
    };
    this.lessonsLearned.push(newLesson);
    return { ...newLesson };
  }

  public async updateLessonLearned(projectCode: string, lessonId: number, data: Partial<ILessonLearned>): Promise<ILessonLearned> {
    await delay();
    const index = this.lessonsLearned.findIndex(l => l.id === lessonId && l.projectCode === projectCode);
    if (index === -1) throw new Error(`Lesson ${lessonId} not found`);
    this.lessonsLearned[index] = { ...this.lessonsLearned[index], ...data };
    return { ...this.lessonsLearned[index] };
  }

  // ---------------------------------------------------------------------------
  // Project Management Plan
  // ---------------------------------------------------------------------------

  private assemblePMP(pmp: IProjectManagementPlan): IProjectManagementPlan {
    const sigs = this.pmpSignatures.filter(s => s.pmpId === pmp.id);
    const cycles = this.pmpApprovalCycles
      .filter(c => c.pmpId === pmp.id)
      .map(c => ({
        ...c,
        steps: this.pmpApprovalSteps.filter(s => s.approvalCycleId === c.id),
      }));
    return {
      ...pmp,
      startupSignatures: sigs.filter(s => s.signatureType === 'Startup'),
      completionSignatures: sigs.filter(s => s.signatureType === 'Completion'),
      approvalCycles: cycles,
    };
  }

  public async getProjectManagementPlan(projectCode: string): Promise<IProjectManagementPlan | null> {
    await delay();
    const pmp = this.pmps.find(p => p.projectCode === projectCode);
    return pmp ? this.assemblePMP(pmp) : null;
  }

  public async updateProjectManagementPlan(projectCode: string, data: Partial<IProjectManagementPlan>): Promise<IProjectManagementPlan> {
    await delay();
    const index = this.pmps.findIndex(p => p.projectCode === projectCode);
    if (index === -1) throw new Error(`PMP for ${projectCode} not found`);
    this.pmps[index] = { ...this.pmps[index], ...data, lastUpdatedAt: new Date().toISOString() };
    return this.assemblePMP(this.pmps[index]);
  }

  public async submitPMPForApproval(projectCode: string, submittedBy: string): Promise<IProjectManagementPlan> {
    await delay();
    const pmp = this.pmps.find(p => p.projectCode === projectCode);
    if (!pmp) throw new Error(`PMP for ${projectCode} not found`);
    const newCycle = pmp.currentCycleNumber + 1;
    const divApprover = this.divisionApprovers.find(d => d.division === pmp.division);
    const cycleId = this.getNextId();
    const steps: IPMPApprovalStep[] = [
      { id: this.getNextId(), approvalCycleId: cycleId, projectCode, stepOrder: 1, approverRole: 'Project Executive', approverName: 'Kim Foster', approverEmail: 'kfoster@hedrickbrothers.com', status: 'Pending' as const, comment: '', actionDate: null, approvalCycleNumber: newCycle },
      ...(divApprover ? [{ id: this.getNextId(), approvalCycleId: cycleId, projectCode, stepOrder: 2, approverRole: 'Division Head', approverName: divApprover.approverName, approverEmail: divApprover.approverEmail, status: 'Pending' as const, comment: '', actionDate: null, approvalCycleNumber: newCycle } as IPMPApprovalStep] : []),
    ];
    const cycle: IPMPApprovalCycle = { id: cycleId, pmpId: pmp.id, projectCode, cycleNumber: newCycle, submittedBy, submittedDate: new Date().toISOString(), status: 'InProgress' as const, steps, changesFromPrevious: [] as string[] };
    this.pmpApprovalCycles.push(cycle);
    for (const step of steps) { this.pmpApprovalSteps.push(step); }
    pmp.currentCycleNumber = newCycle;
    pmp.status = 'PendingApproval';
    pmp.lastUpdatedAt = new Date().toISOString();
    return this.assemblePMP(pmp);
  }

  public async respondToPMPApproval(projectCode: string, stepId: number, approved: boolean, comment: string): Promise<IProjectManagementPlan> {
    await delay();
    const pmp = this.pmps.find(p => p.projectCode === projectCode);
    if (!pmp) throw new Error(`PMP for ${projectCode} not found`);
    const stepIdx = this.pmpApprovalSteps.findIndex(s => s.id === stepId);
    if (stepIdx === -1) throw new Error(`Approval step ${stepId} not found`);
    this.pmpApprovalSteps[stepIdx].status = approved ? 'Approved' : 'Returned';
    this.pmpApprovalSteps[stepIdx].comment = comment;
    this.pmpApprovalSteps[stepIdx].actionDate = new Date().toISOString();
    // Update cycle status based on all steps in cycle
    const cycleId = this.pmpApprovalSteps[stepIdx].approvalCycleId;
    const cycleIdx = this.pmpApprovalCycles.findIndex(c => c.id === cycleId);
    if (cycleIdx !== -1) {
      const cycleSteps = this.pmpApprovalSteps.filter(s => s.approvalCycleId === cycleId);
      if (!approved) {
        this.pmpApprovalCycles[cycleIdx].status = 'Returned';
        pmp.status = 'Returned';
      } else if (cycleSteps.every(s => s.status === 'Approved')) {
        this.pmpApprovalCycles[cycleIdx].status = 'Approved';
        pmp.status = 'Approved';
      }
    }
    pmp.lastUpdatedAt = new Date().toISOString();
    return this.assemblePMP(pmp);
  }

  public async signPMP(projectCode: string, signatureId: number, comment: string): Promise<IProjectManagementPlan> {
    await delay();
    const pmp = this.pmps.find(p => p.projectCode === projectCode);
    if (!pmp) throw new Error(`PMP for ${projectCode} not found`);
    const sigIdx = this.pmpSignatures.findIndex(s => s.id === signatureId && s.pmpId === pmp.id);
    if (sigIdx === -1) throw new Error(`Signature ${signatureId} not found`);
    this.pmpSignatures[sigIdx].status = 'Signed';
    this.pmpSignatures[sigIdx].signedDate = new Date().toISOString();
    this.pmpSignatures[sigIdx].comment = comment;
    pmp.lastUpdatedAt = new Date().toISOString();
    return this.assemblePMP(pmp);
  }

  public async getDivisionApprovers(): Promise<IDivisionApprover[]> {
    await delay();
    return [...this.divisionApprovers];
  }

  public async getPMPBoilerplate(): Promise<IPMPBoilerplateSection[]> {
    await delay();
    return [...this.boilerplate];
  }

  // ---------------------------------------------------------------------------
  // Monthly Project Review
  // ---------------------------------------------------------------------------

  private assembleMonthlyReview(review: IMonthlyProjectReview): IMonthlyProjectReview {
    return {
      ...review,
      checklistItems: this.monthlyChecklistItems.filter(i => i.reviewId === review.id),
      followUps: this.monthlyFollowUps.filter(f => f.reviewId === review.id),
    };
  }

  public async getMonthlyReviews(projectCode: string): Promise<IMonthlyProjectReview[]> {
    await delay();
    return this.monthlyReviews.filter(r => r.projectCode === projectCode)
      .sort((a, b) => b.reviewMonth.localeCompare(a.reviewMonth))
      .map(r => this.assembleMonthlyReview(r));
  }

  public async getMonthlyReview(reviewId: number): Promise<IMonthlyProjectReview | null> {
    await delay();
    const review = this.monthlyReviews.find(r => r.id === reviewId);
    return review ? this.assembleMonthlyReview(review) : null;
  }

  public async updateMonthlyReview(reviewId: number, data: Partial<IMonthlyProjectReview>): Promise<IMonthlyProjectReview> {
    await delay();
    const index = this.monthlyReviews.findIndex(r => r.id === reviewId);
    if (index === -1) throw new Error(`Monthly review ${reviewId} not found`);
    // If checklist items or follow-ups are passed, update the flat arrays
    if (data.checklistItems) {
      this.monthlyChecklistItems = this.monthlyChecklistItems.filter(i => i.reviewId !== reviewId);
      for (const item of data.checklistItems) {
        this.monthlyChecklistItems.push({ ...item, reviewId });
      }
    }
    if (data.followUps) {
      this.monthlyFollowUps = this.monthlyFollowUps.filter(f => f.reviewId !== reviewId);
      for (const fu of data.followUps) {
        this.monthlyFollowUps.push({ ...fu, reviewId });
      }
    }
    this.monthlyReviews[index] = { ...this.monthlyReviews[index], ...data, lastUpdatedAt: new Date().toISOString() };
    return this.assembleMonthlyReview(this.monthlyReviews[index]);
  }

  public async createMonthlyReview(data: Partial<IMonthlyProjectReview>): Promise<IMonthlyProjectReview> {
    await delay();
    const reviewId = this.getNextId();
    const newReview: IMonthlyProjectReview = {
      id: reviewId,
      projectCode: data.projectCode ?? '',
      reviewMonth: data.reviewMonth ?? '',
      status: 'NotStarted',
      dueDate: data.dueDate ?? '',
      meetingDate: data.meetingDate ?? null,
      pmSubmittedDate: null,
      pxReviewDate: null,
      pxValidationDate: null,
      leadershipSubmitDate: null,
      completedDate: null,
      checklistItems: [],
      followUps: [],
      reportDocumentUrls: [],
      createdBy: 'kfoster@hedrickbrothers.com',
      createdAt: new Date().toISOString(),
      lastUpdatedBy: 'kfoster@hedrickbrothers.com',
      lastUpdatedAt: new Date().toISOString(),
    };
    // Flatten checklist items
    if (data.checklistItems) {
      for (const item of data.checklistItems) {
        this.monthlyChecklistItems.push({ ...item, reviewId });
      }
    }
    this.monthlyReviews.push(newReview);
    return this.assembleMonthlyReview(newReview);
  }

  // ---------------------------------------------------------------------------
  // App Context
  // ---------------------------------------------------------------------------

  public async getAppContextConfig(
    siteUrl: string
  ): Promise<{ RenderMode: string; AppTitle: string; VisibleModules: string[] } | null> {
    await delay();

    // Default full config for any URL
    const configs: Array<{ SiteURL: string; RenderMode: string; AppTitle: string; VisibleModules: string[] }> = [
      {
        SiteURL: 'https://hedrickbrothers.sharepoint.com/sites/HBCHub',
        RenderMode: 'full',
        AppTitle: 'HBC Project Controls',
        VisibleModules: ['Pipeline', 'LeadIntake', 'GoNoGo', 'Estimating', 'Executive', 'Admin']
      },
      {
        SiteURL: 'https://hedrickbrothers.sharepoint.com/sites/HBPrecon',
        RenderMode: 'standalone',
        AppTitle: 'HBC Estimating Tracker',
        VisibleModules: ['EstimatingDashboard', 'PursuitDetail', 'GoNoGoTracker']
      },
      {
        SiteURL: 'default-project',
        RenderMode: 'project',
        AppTitle: 'Project Controls',
        VisibleModules: ['ProjectHome', 'GoNoGo', 'Kickoff', 'Deliverables', 'WinLoss', 'Contract', 'Turnover', 'Closeout']
      }
    ];

    const match = configs.find(c => siteUrl.startsWith(c.SiteURL) || c.SiteURL === siteUrl);
    if (match) {
      return {
        RenderMode: match.RenderMode,
        AppTitle: match.AppTitle,
        VisibleModules: match.VisibleModules
      };
    }

    // For project site URLs, return the default-project config
    if (siteUrl.includes('sharepoint.com/sites/')) {
      const projectConfig = configs.find(c => c.SiteURL === 'default-project');
      if (projectConfig) {
        return {
          RenderMode: projectConfig.RenderMode,
          AppTitle: projectConfig.AppTitle,
          VisibleModules: projectConfig.VisibleModules
        };
      }
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // Estimating Kick-Off
  // ---------------------------------------------------------------------------

  private assembleEstimatingKickoff(kickoff: IEstimatingKickoff): IEstimatingKickoff {
    return {
      ...kickoff,
      items: this.estimatingKickoffItems.filter(i => i.kickoffId === kickoff.id),
    };
  }

  public async getEstimatingKickoff(projectCode: string): Promise<IEstimatingKickoff | null> {
    await delay();
    const kickoff = this.estimatingKickoffs.find(k => k.ProjectCode === projectCode);
    return kickoff ? this.assembleEstimatingKickoff(kickoff) : null;
  }

  public async getEstimatingKickoffByLeadId(leadId: number): Promise<IEstimatingKickoff | null> {
    await delay();
    const kickoff = this.estimatingKickoffs.find(k => k.LeadID === leadId);
    return kickoff ? this.assembleEstimatingKickoff(kickoff) : null;
  }

  public async createEstimatingKickoff(data: Partial<IEstimatingKickoff>): Promise<IEstimatingKickoff> {
    await delay();
    const kickoffId = this.getNextId();
    const items = data.items && data.items.length > 0 ? data.items : createEstimatingKickoffTemplate();
    const kickoff: IEstimatingKickoff = {
      id: kickoffId,
      LeadID: data.LeadID ?? 0,
      ProjectCode: data.ProjectCode ?? '',
      Architect: data.Architect,
      ProposalDueDateTime: data.ProposalDueDateTime,
      ProposalType: data.ProposalType,
      RFIFormat: data.RFIFormat,
      PrimaryOwnerContact: data.PrimaryOwnerContact,
      ProposalDeliveryMethod: data.ProposalDeliveryMethod,
      CopiesIfHandDelivered: data.CopiesIfHandDelivered,
      HBProposalDue: data.HBProposalDue,
      SubcontractorProposalsDue: data.SubcontractorProposalsDue,
      PreSubmissionReview: data.PreSubmissionReview,
      SubcontractorSiteWalkThru: data.SubcontractorSiteWalkThru,
      OwnerEstimateReview: data.OwnerEstimateReview,
      items,
      KickoffMeetingId: data.KickoffMeetingId,
      KickoffMeetingDate: data.KickoffMeetingDate,
      CreatedBy: data.CreatedBy ?? 'system',
      CreatedDate: data.CreatedDate ?? new Date().toISOString(),
      ModifiedBy: data.ModifiedBy,
      ModifiedDate: data.ModifiedDate,
    };
    // Flatten items into flat array
    for (const item of items) {
      this.estimatingKickoffItems.push({ ...item, kickoffId, projectCode: kickoff.ProjectCode });
    }
    this.estimatingKickoffs.push(kickoff);
    return this.assembleEstimatingKickoff(kickoff);
  }

  public async updateEstimatingKickoff(id: number, data: Partial<IEstimatingKickoff>): Promise<IEstimatingKickoff> {
    await delay();
    const index = this.estimatingKickoffs.findIndex(k => k.id === id);
    if (index === -1) throw new Error(`Estimating kickoff ${id} not found`);

    if (data.items) {
      // Replace flat items for this kickoff
      this.estimatingKickoffItems = this.estimatingKickoffItems.filter(i => i.kickoffId !== id);
      for (const item of data.items) {
        this.estimatingKickoffItems.push({ ...item, kickoffId: id, projectCode: this.estimatingKickoffs[index].ProjectCode });
      }
    }

    this.estimatingKickoffs[index] = {
      ...this.estimatingKickoffs[index],
      ...data,
      ModifiedDate: new Date().toISOString(),
    };

    return this.assembleEstimatingKickoff(this.estimatingKickoffs[index]);
  }

  public async updateKickoffItem(
    kickoffId: number,
    itemId: number,
    data: Partial<IEstimatingKickoffItem>
  ): Promise<IEstimatingKickoffItem> {
    await delay();
    const kickoff = this.estimatingKickoffs.find(k => k.id === kickoffId);
    if (!kickoff) throw new Error(`Estimating kickoff ${kickoffId} not found`);

    const idx = this.estimatingKickoffItems.findIndex(i => i.id === itemId && i.kickoffId === kickoffId);
    if (idx === -1) throw new Error(`Kickoff item ${itemId} not found`);

    this.estimatingKickoffItems[idx] = { ...this.estimatingKickoffItems[idx], ...data };
    kickoff.ModifiedDate = new Date().toISOString();
    return { ...this.estimatingKickoffItems[idx] };
  }

  public async addKickoffItem(kickoffId: number, item: Partial<IEstimatingKickoffItem>): Promise<IEstimatingKickoffItem> {
    await delay();
    const kickoff = this.estimatingKickoffs.find(k => k.id === kickoffId);
    if (!kickoff) throw new Error(`Estimating kickoff ${kickoffId} not found`);

    const kickoffItems = this.estimatingKickoffItems.filter(i => i.kickoffId === kickoffId);
    const nextItemId = kickoffItems.length > 0
      ? Math.max(...kickoffItems.map(i => i.id)) + 1
      : 1;

    const newItem: IEstimatingKickoffItem = {
      id: nextItemId,
      kickoffId,
      projectCode: kickoff.ProjectCode,
      section: item.section ?? 'managing',
      task: item.task ?? 'New Task',
      status: item.status ?? null,
      responsibleParty: item.responsibleParty ?? '',
      deadline: item.deadline ?? '',
      frequency: item.frequency ?? '',
      notes: item.notes ?? '',
      tabRequired: item.tabRequired,
      isCustom: item.isCustom ?? true,
      sortOrder: item.sortOrder ?? kickoffItems.length + 1,
    };

    this.estimatingKickoffItems.push(newItem);
    kickoff.ModifiedDate = new Date().toISOString();
    return { ...newItem };
  }

  public async removeKickoffItem(kickoffId: number, itemId: number): Promise<void> {
    await delay();
    const kickoff = this.estimatingKickoffs.find(k => k.id === kickoffId);
    if (!kickoff) throw new Error(`Estimating kickoff ${kickoffId} not found`);

    this.estimatingKickoffItems = this.estimatingKickoffItems.filter(i => !(i.id === itemId && i.kickoffId === kickoffId));
    kickoff.ModifiedDate = new Date().toISOString();
  }

  public async updateKickoffKeyPersonnel(kickoffId: number, personnel: IKeyPersonnelEntry[]): Promise<IEstimatingKickoff> {
    await delay();
    const kickoff = this.estimatingKickoffs.find(k => k.id === kickoffId);
    if (!kickoff) throw new Error(`Estimating kickoff ${kickoffId} not found`);
    kickoff.keyPersonnel = personnel;
    kickoff.ModifiedDate = new Date().toISOString();
    return this.assembleEstimatingKickoff(kickoff);
  }

  // ---------------------------------------------------------------------------
  // Job Number Requests
  // ---------------------------------------------------------------------------

  public async getJobNumberRequests(status?: JobNumberRequestStatus): Promise<IJobNumberRequest[]> {
    await delay();
    if (status) {
      return this.jobNumberRequests.filter(r => r.RequestStatus === status);
    }
    return [...this.jobNumberRequests];
  }

  public async getJobNumberRequestByLeadId(leadId: number): Promise<IJobNumberRequest | null> {
    await delay();
    // Return the most recent request for this lead
    const requests = this.jobNumberRequests
      .filter(r => r.LeadID === leadId)
      .sort((a, b) => new Date(b.RequestDate).getTime() - new Date(a.RequestDate).getTime());
    return requests.length > 0 ? { ...requests[0] } : null;
  }

  public async createJobNumberRequest(data: Partial<IJobNumberRequest>): Promise<IJobNumberRequest> {
    await delay();
    const request: IJobNumberRequest = {
      id: this.getNextId(),
      LeadID: data.LeadID ?? 0,
      RequestDate: data.RequestDate ?? new Date().toISOString().split('T')[0],
      Originator: data.Originator ?? '',
      RequiredByDate: data.RequiredByDate ?? '',
      ProjectAddress: data.ProjectAddress ?? '',
      ProjectExecutive: data.ProjectExecutive ?? '',
      ProjectManager: data.ProjectManager,
      ProjectType: data.ProjectType ?? '',
      ProjectTypeLabel: data.ProjectTypeLabel ?? '',
      IsEstimatingOnly: data.IsEstimatingOnly ?? false,
      RequestedCostCodes: data.RequestedCostCodes ?? [],
      RequestStatus: JobNumberRequestStatus.Pending,
      SiteProvisioningHeld: data.SiteProvisioningHeld ?? true,
      TempProjectCode: data.TempProjectCode,
      Notes: data.Notes,
    };
    this.jobNumberRequests.push(request);

    // Link the request to the lead
    const leadIndex = this.leads.findIndex(l => l.id === request.LeadID);
    if (leadIndex !== -1) {
      this.leads[leadIndex].JobNumberRequestId = request.id;
    }

    return { ...request };
  }

  public async finalizeJobNumber(requestId: number, jobNumber: string, assignedBy: string): Promise<IJobNumberRequest> {
    await delay();
    const index = this.jobNumberRequests.findIndex(r => r.id === requestId);
    if (index === -1) throw new Error(`Job number request ${requestId} not found`);

    const request = this.jobNumberRequests[index];
    request.RequestStatus = JobNumberRequestStatus.Completed;
    request.AssignedJobNumber = jobNumber;
    request.AssignedBy = assignedBy;
    request.AssignedDate = new Date().toISOString().split('T')[0];

    // Sync back to the lead
    const leadIndex = this.leads.findIndex(l => l.id === request.LeadID);
    if (leadIndex !== -1) {
      this.leads[leadIndex].OfficialJobNumber = jobNumber;
      this.leads[leadIndex].ProjectExecutive = request.ProjectExecutive;
      this.leads[leadIndex].ProjectManager = request.ProjectManager;
    }

    return { ...request };
  }

  // ---------------------------------------------------------------------------
  // Reference Data
  // ---------------------------------------------------------------------------

  public async getProjectTypes(): Promise<IProjectType[]> {
    await delay();
    return JSON.parse(JSON.stringify(mockProjectTypes)) as IProjectType[];
  }

  public async getStandardCostCodes(): Promise<IStandardCostCode[]> {
    await delay();
    return JSON.parse(JSON.stringify(mockStandardCostCodes)) as IStandardCostCode[];
  }

  // ---------------------------------------------------------------------------
  // Buyout Log
  // ---------------------------------------------------------------------------

  public async getBuyoutEntries(projectCode: string): Promise<IBuyoutEntry[]> {
    await delay();
    return this.buyoutEntries
      .filter(e => e.projectCode === projectCode)
      .sort((a, b) => a.divisionCode.localeCompare(b.divisionCode));
  }

  public async getBuyoutEntriesPage(request: ICursorPageRequest): Promise<ICursorPageResult<IBuyoutEntry>> {
    await delay();
    const projectCode = request.projectCode ?? String(request.filters?.projectCode ?? '');
    const rows = this.buyoutEntries
      .filter(e => e.projectCode === projectCode)
      .sort((a, b) => a.divisionCode.localeCompare(b.divisionCode));
    return this.paginateArray(rows, request);
  }

  public async initializeBuyoutLog(projectCode: string): Promise<IBuyoutEntry[]> {
    await delay();
    const existing = this.buyoutEntries.filter(e => e.projectCode === projectCode);
    if (existing.length > 0) return existing;

    const now = new Date().toISOString();
    const newEntries: IBuyoutEntry[] = STANDARD_BUYOUT_DIVISIONS.map(div => ({
      id: this.getNextId(),
      projectCode,
      divisionCode: div.divisionCode,
      divisionDescription: div.divisionDescription,
      isStandard: true,
      originalBudget: 0,
      estimatedTax: 0,
      totalBudget: 0,
      enrolledInSDI: false,
      bondRequired: false,
      commitmentStatus: 'Budgeted' as const,
      waiverRequired: false,
      approvalHistory: [],
      status: 'Not Started' as const,
      createdDate: now,
      modifiedDate: now,
    }));

    this.buyoutEntries.push(...newEntries);
    return newEntries;
  }

  public async addBuyoutEntry(projectCode: string, entry: Partial<IBuyoutEntry>): Promise<IBuyoutEntry> {
    await delay();
    const now = new Date().toISOString();
    const totalBudget = (entry.originalBudget || 0) + (entry.estimatedTax || 0);
    const overUnder = entry.contractValue != null ? totalBudget - entry.contractValue : undefined;

    const newEntry: IBuyoutEntry = {
      id: this.getNextId(),
      projectCode,
      divisionCode: entry.divisionCode || '',
      divisionDescription: entry.divisionDescription || '',
      isStandard: entry.isStandard ?? false,
      originalBudget: entry.originalBudget || 0,
      estimatedTax: entry.estimatedTax || 0,
      totalBudget,
      subcontractorName: entry.subcontractorName,
      contractValue: entry.contractValue,
      overUnder,
      enrolledInSDI: entry.enrolledInSDI ?? false,
      bondRequired: entry.bondRequired ?? false,
      commitmentStatus: entry.commitmentStatus || 'Budgeted',
      waiverRequired: entry.waiverRequired ?? false,
      approvalHistory: entry.approvalHistory ?? [],
      loiSentDate: entry.loiSentDate,
      loiReturnedDate: entry.loiReturnedDate,
      contractSentDate: entry.contractSentDate,
      contractExecutedDate: entry.contractExecutedDate,
      insuranceCOIReceivedDate: entry.insuranceCOIReceivedDate,
      status: entry.status || 'Not Started',
      notes: entry.notes,
      createdDate: now,
      modifiedDate: now,
    };

    this.buyoutEntries.push(newEntry);
    return newEntry;
  }

  public async updateBuyoutEntry(projectCode: string, entryId: number, data: Partial<IBuyoutEntry>): Promise<IBuyoutEntry> {
    await delay();
    const idx = this.buyoutEntries.findIndex(e => e.id === entryId && e.projectCode === projectCode);
    if (idx === -1) throw new Error(`Buyout entry ${entryId} not found`);

    const current = this.buyoutEntries[idx];
    const updated = { ...current, ...data, modifiedDate: new Date().toISOString() };

    // Recalculate derived fields
    updated.totalBudget = updated.originalBudget + updated.estimatedTax;
    if (updated.contractValue != null) {
      updated.overUnder = updated.totalBudget - updated.contractValue;
    }

    this.buyoutEntries[idx] = updated;
    return updated;
  }

  public async removeBuyoutEntry(projectCode: string, entryId: number): Promise<void> {
    await delay();
    const idx = this.buyoutEntries.findIndex(e => e.id === entryId && e.projectCode === projectCode);
    if (idx === -1) throw new Error(`Buyout entry ${entryId} not found`);
    this.buyoutEntries.splice(idx, 1);
  }

  // ---------------------------------------------------------------------------
  // Commitment Approval
  // ---------------------------------------------------------------------------

  public async submitCommitmentForApproval(projectCode: string, entryId: number, submittedBy: string): Promise<IBuyoutEntry> {
    await delay();
    const idx = this.buyoutEntries.findIndex(e => e.id === entryId && e.projectCode === projectCode);
    if (idx === -1) throw new Error(`Buyout entry ${entryId} not found`);

    const entry = this.buyoutEntries[idx];

    // Run risk evaluation
    const { evaluateCommitmentRisk, determineWaiverType } = require('../utils/riskEngine');
    const risk = evaluateCommitmentRisk(entry);

    const approvalStep: ICommitmentApproval = {
      id: this.getNextId(),
      buyoutEntryId: entryId,
      projectCode,
      step: 'PX',
      approverName: 'Kim Foster',
      approverEmail: 'kfoster@hedrickbrothers.com',
      status: 'Pending',
      waiverType: risk.requiresWaiver ? determineWaiverType(entry) : undefined,
    };

    entry.waiverRequired = risk.requiresWaiver;
    entry.waiverType = risk.requiresWaiver ? determineWaiverType(entry) : undefined;
    entry.commitmentStatus = risk.requiresWaiver ? 'WaiverPending' : 'PendingReview';
    entry.currentApprovalStep = 'PX';
    entry.approvalHistory = [...(entry.approvalHistory || []), approvalStep];
    entry.modifiedDate = new Date().toISOString();

    this.buyoutEntries[idx] = entry;
    return { ...entry };
  }

  public async respondToCommitmentApproval(
    projectCode: string,
    entryId: number,
    approved: boolean,
    comment: string,
    escalate?: boolean
  ): Promise<IBuyoutEntry> {
    await delay();
    const idx = this.buyoutEntries.findIndex(e => e.id === entryId && e.projectCode === projectCode);
    if (idx === -1) throw new Error(`Buyout entry ${entryId} not found`);

    const entry = this.buyoutEntries[idx];
    const now = new Date().toISOString();

    // Find the pending approval step
    const pendingIdx = (entry.approvalHistory || []).findIndex(
      a => a.status === 'Pending'
    );
    if (pendingIdx === -1) throw new Error('No pending approval step found');

    const pendingStep = entry.approvalHistory[pendingIdx];
    pendingStep.actionDate = now;
    pendingStep.comment = comment;

    if (!approved) {
      // Rejected at any stage
      pendingStep.status = 'Rejected';
      entry.commitmentStatus = 'Rejected';
      entry.currentApprovalStep = undefined;
    } else if (escalate && pendingStep.step === 'ComplianceManager') {
      // Compliance Manager escalates to CFO
      pendingStep.status = 'Escalated';
      const cfoStep: ICommitmentApproval = {
        id: this.getNextId(),
        buyoutEntryId: entryId,
        projectCode,
        step: 'CFO',
        approverName: 'CFO',
        approverEmail: 'cfo@hedrickbrothers.com',
        status: 'Pending',
        waiverType: entry.waiverType,
      };
      entry.approvalHistory.push(cfoStep);
      entry.commitmentStatus = 'CFOReview';
      entry.currentApprovalStep = 'CFO';
    } else if (pendingStep.step === 'PX' && entry.waiverRequired && (entry.contractValue ?? 0) >= 250000) {
      // PX approved but needs Compliance Manager escalation for high-value
      pendingStep.status = 'Approved';
      const complianceStep: ICommitmentApproval = {
        id: this.getNextId(),
        buyoutEntryId: entryId,
        projectCode,
        step: 'ComplianceManager',
        approverName: 'Compliance Manager',
        approverEmail: 'compliance@hedrickbrothers.com',
        status: 'Pending',
        waiverType: entry.waiverType,
      };
      entry.approvalHistory.push(complianceStep);
      entry.commitmentStatus = 'ComplianceReview';
      entry.currentApprovalStep = 'ComplianceManager';
    } else {
      // Final approval (PX for <$250k, ComplianceManager, or CFO)
      pendingStep.status = 'Approved';
      entry.commitmentStatus = 'Committed';
      entry.currentApprovalStep = undefined;
      // Sync buyout status
      entry.status = 'Executed';
    }

    entry.modifiedDate = now;
    this.buyoutEntries[idx] = entry;
    return { ...entry };
  }

  public async getCommitmentApprovalHistory(projectCode: string, entryId: number): Promise<ICommitmentApproval[]> {
    await delay();
    const entry = this.buyoutEntries.find(e => e.id === entryId && e.projectCode === projectCode);
    if (!entry) throw new Error(`Buyout entry ${entryId} not found`);
    return [...(entry.approvalHistory || [])];
  }

  // ---------------------------------------------------------------------------
  // Contract Tracking Workflow (Mock)
  // ---------------------------------------------------------------------------

  private static readonly TRACKING_STEP_ORDER: ContractTrackingStep[] = ['APM_PA', 'ProjectManager', 'RiskManager', 'ProjectExecutive'];

  private static readonly TRACKING_STEP_STATUS: Record<ContractTrackingStep, ContractTrackingStatus> = {
    APM_PA: 'PendingAPM',
    ProjectManager: 'PendingPM',
    RiskManager: 'PendingRiskMgr',
    ProjectExecutive: 'PendingPX',
  };

  private static readonly TRACKING_STEP_APPROVERS: Record<ContractTrackingStep, { name: string; email: string }> = {
    APM_PA: { name: 'Sarah Johnson', email: 'sjohnson@hedrickbrothers.com' },
    ProjectManager: { name: 'Robert Davis', email: 'rdavis@hedrickbrothers.com' },
    RiskManager: { name: 'Jennifer Adams', email: 'jadams@hedrickbrothers.com' },
    ProjectExecutive: { name: 'Kim Foster', email: 'kfoster@hedrickbrothers.com' },
  };

  private static readonly TRACKING_STEP_TO_ORDER: Record<ContractTrackingStep, number> = {
    APM_PA: 1, ProjectManager: 2, RiskManager: 3, ProjectExecutive: 4,
  };

  private getNextTrackingStep(current: ContractTrackingStep): ContractTrackingStep | null {
    const steps = MockDataService.TRACKING_STEP_ORDER;
    const idx = steps.indexOf(current);
    return idx < steps.length - 1 ? steps[idx + 1] : null;
  }

  private resolveTrackingStepApprover(
    chain: IResolvedWorkflowStep[],
    step: ContractTrackingStep
  ): { name: string; email: string } {
    const stepOrder = MockDataService.TRACKING_STEP_TO_ORDER[step];
    const resolved = chain.find(s => s.stepOrder === stepOrder);
    if (resolved?.assignee?.email) {
      return { name: resolved.assignee.displayName, email: resolved.assignee.email };
    }
    return MockDataService.TRACKING_STEP_APPROVERS[step]; // fallback
  }

  public async submitContractTracking(projectCode: string, entryId: number, _submittedBy: string): Promise<IBuyoutEntry> {
    await delay();
    const idx = this.buyoutEntries.findIndex(e => e.id === entryId && e.projectCode === projectCode);
    if (idx === -1) throw new Error(`Buyout entry ${entryId} not found`);

    const entry = this.buyoutEntries[idx];

    // Resolve workflow chain to check if APM_PA step is skippable and get assignees
    let firstStep: ContractTrackingStep = 'APM_PA';
    let chain: IResolvedWorkflowStep[] | null = null;
    try {
      chain = await this.resolveWorkflowChain(WorkflowKey.CONTRACT_TRACKING, projectCode);
      const apmStep = chain.find(s => s.stepOrder === 1);
      if (apmStep?.skipped) {
        firstStep = 'ProjectManager';
        // Create a Skipped record for APM_PA
        const skippedApprover = this.resolveTrackingStepApprover(chain, 'APM_PA');
        const skippedRecord: IContractTrackingApproval = {
          id: this.getNextId(),
          buyoutEntryId: entryId,
          projectCode,
          step: 'APM_PA',
          approverName: skippedApprover.name,
          approverEmail: skippedApprover.email,
          status: 'Skipped',
          actionDate: new Date().toISOString(),
          skippedReason: 'No APM/PA assigned for this project',
        };
        entry.contractTrackingHistory = [...(entry.contractTrackingHistory || []), skippedRecord];
      }
    } catch { /* default to APM_PA */ }

    const approver = chain
      ? this.resolveTrackingStepApprover(chain, firstStep)
      : MockDataService.TRACKING_STEP_APPROVERS[firstStep];
    const approvalRecord: IContractTrackingApproval = {
      id: this.getNextId(),
      buyoutEntryId: entryId,
      projectCode,
      step: firstStep,
      approverName: approver.name,
      approverEmail: approver.email,
      status: 'Pending',
    };

    entry.contractTrackingStatus = MockDataService.TRACKING_STEP_STATUS[firstStep];
    entry.currentContractTrackingStep = firstStep;
    entry.contractTrackingHistory = [...(entry.contractTrackingHistory || []), approvalRecord];
    entry.modifiedDate = new Date().toISOString();

    this.buyoutEntries[idx] = entry;
    this.logAudit({ Action: AuditAction.ContractTrackingSubmitted, EntityType: EntityType.ContractTracking, EntityId: String(entryId), Details: `Contract tracking submitted for ${entry.divisionDescription}` });
    return { ...entry };
  }

  public async respondToContractTracking(
    projectCode: string,
    entryId: number,
    approved: boolean,
    comment: string
  ): Promise<IBuyoutEntry> {
    await delay();
    const idx = this.buyoutEntries.findIndex(e => e.id === entryId && e.projectCode === projectCode);
    if (idx === -1) throw new Error(`Buyout entry ${entryId} not found`);

    const entry = this.buyoutEntries[idx];
    const now = new Date().toISOString();
    const history = entry.contractTrackingHistory || [];

    const pendingIdx = history.findIndex(a => a.status === 'Pending');
    if (pendingIdx === -1) throw new Error('No pending contract tracking step found');

    const pendingStep = { ...history[pendingIdx] };
    pendingStep.actionDate = now;
    pendingStep.comment = comment;

    if (!approved) {
      pendingStep.status = 'Rejected';
      entry.contractTrackingStatus = 'Rejected';
      entry.currentContractTrackingStep = undefined;
      this.logAudit({ Action: AuditAction.ContractTrackingRejected, EntityType: EntityType.ContractTracking, EntityId: String(entryId), Details: `Contract tracking rejected at ${pendingStep.step}` });
    } else {
      pendingStep.status = 'Approved';
      const nextStep = this.getNextTrackingStep(pendingStep.step);

      if (nextStep) {
        let approver = MockDataService.TRACKING_STEP_APPROVERS[nextStep];
        try {
          const chain = await this.resolveWorkflowChain(WorkflowKey.CONTRACT_TRACKING, projectCode);
          approver = this.resolveTrackingStepApprover(chain, nextStep);
        } catch { /* fallback to hardcoded */ }
        const nextRecord: IContractTrackingApproval = {
          id: this.getNextId(),
          buyoutEntryId: entryId,
          projectCode,
          step: nextStep,
          approverName: approver.name,
          approverEmail: approver.email,
          status: 'Pending',
        };
        history.push(nextRecord);
        entry.contractTrackingStatus = MockDataService.TRACKING_STEP_STATUS[nextStep];
        entry.currentContractTrackingStep = nextStep;
        this.logAudit({ Action: AuditAction.ContractTrackingApproved, EntityType: EntityType.ContractTracking, EntityId: String(entryId), Details: `Contract tracking approved at ${pendingStep.step}, advancing to ${nextStep}` });
      } else {
        // Final approval — fully tracked
        entry.contractTrackingStatus = 'Tracked';
        entry.currentContractTrackingStep = undefined;
        this.logAudit({ Action: AuditAction.ContractTrackingApproved, EntityType: EntityType.ContractTracking, EntityId: String(entryId), Details: `Contract tracking fully approved — status: Tracked` });
      }
    }

    history[pendingIdx] = pendingStep;
    entry.contractTrackingHistory = history;
    entry.modifiedDate = now;
    this.buyoutEntries[idx] = entry;
    return { ...entry };
  }

  public async getContractTrackingHistory(projectCode: string, entryId: number): Promise<IContractTrackingApproval[]> {
    await delay();
    const entry = this.buyoutEntries.find(e => e.id === entryId && e.projectCode === projectCode);
    if (!entry) throw new Error(`Buyout entry ${entryId} not found`);
    return [...(entry.contractTrackingHistory || [])];
  }

  // ---------------------------------------------------------------------------
  // File Upload (Mock)
  // ---------------------------------------------------------------------------

  public async uploadCommitmentDocument(projectCode: string, entryId: number, file: File): Promise<{ fileId: string; fileName: string; fileUrl: string }> {
    await delay();
    const entry = this.buyoutEntries.find(e => e.id === entryId && e.projectCode === projectCode);
    if (!entry) throw new Error(`Buyout entry ${entryId} not found`);

    const fileId = `file-${Date.now()}`;
    const fileName = `${projectCode}_${entryId}_${file.name}`;
    const fileUrl = `/sites/${projectCode}/Shared Documents/Commitments/${fileName}`;

    entry.compiledCommitmentFileId = fileId;
    entry.compiledCommitmentFileName = fileName;
    entry.compiledCommitmentPdfUrl = fileUrl;
    entry.modifiedDate = new Date().toISOString();

    return { fileId, fileName, fileUrl };
  }

  // ---------------------------------------------------------------------------
  // Compliance Log
  // ---------------------------------------------------------------------------

  public async getComplianceLog(filters?: IComplianceLogFilter): Promise<IComplianceEntry[]> {
    await delay();

    // Get all buyout entries with a subcontractor assigned
    let entries = this.buyoutEntries.filter(e => !!e.subcontractorName);

    if (filters?.projectCode) {
      entries = entries.filter(e => e.projectCode === filters.projectCode);
    }
    if (filters?.commitmentStatus) {
      entries = entries.filter(e => e.commitmentStatus === filters.commitmentStatus);
    }
    if (filters?.eVerifyStatus) {
      entries = entries.filter(e => (e.eVerifyStatus || 'Not Sent') === filters.eVerifyStatus);
    }
    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      entries = entries.filter(e =>
        (e.subcontractorName || '').toLowerCase().includes(q) ||
        e.projectCode.toLowerCase().includes(q) ||
        e.divisionDescription.toLowerCase().includes(q)
      );
    }

    return entries.map(e => this.mapBuyoutToComplianceEntry(e));
  }

  public async getComplianceLogPage(request: ICursorPageRequest): Promise<ICursorPageResult<IComplianceEntry>> {
    const filters = (request.filters ?? {}) as Partial<IComplianceLogFilter>;
    const rows = await this.getComplianceLog({
      projectCode: request.projectCode ?? filters.projectCode,
      commitmentStatus: filters.commitmentStatus,
      eVerifyStatus: filters.eVerifyStatus,
      searchQuery: filters.searchQuery,
    });
    return this.paginateArray(rows, request);
  }

  public async getComplianceSummary(): Promise<IComplianceSummary> {
    await delay();
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

  private mapBuyoutToComplianceEntry(entry: IBuyoutEntry): IComplianceEntry {
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

    // Use lead lookup to try to get a project name
    const lead = this.leads.find(l => l.ProjectCode === entry.projectCode);

    return {
      id: entry.id,
      projectCode: entry.projectCode,
      projectName: lead?.Title || entry.projectCode,
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

  private enrichBuyoutEntriesWithEVerify(entries: IBuyoutEntry[]): IBuyoutEntry[] {
    const eVerifyStatuses: EVerifyStatus[] = ['Received', 'Sent', 'Reminder Sent', 'Not Sent', 'Overdue'];
    const compassStatuses: ('Approved' | 'Pending' | 'Expired')[] = ['Approved', 'Approved', 'Approved', 'Pending', 'Expired'];

    return entries.map((entry, idx) => {
      const hasSubcontractor = !!entry.subcontractorName;
      if (!hasSubcontractor) return entry;

      const evStatus = eVerifyStatuses[idx % eVerifyStatuses.length];
      const compassStatus = compassStatuses[idx % compassStatuses.length];

      return {
        ...entry,
        qScore: entry.qScore ?? (60 + Math.floor(Math.random() * 35)),
        compassPreQualStatus: entry.compassPreQualStatus ?? compassStatus,
        scopeMatchesBudget: entry.scopeMatchesBudget ?? (idx % 4 !== 3),
        exhibitCInsuranceConfirmed: entry.exhibitCInsuranceConfirmed ?? (idx % 5 !== 4),
        exhibitDScheduleConfirmed: entry.exhibitDScheduleConfirmed ?? (idx % 6 !== 5),
        exhibitESafetyConfirmed: entry.exhibitESafetyConfirmed ?? (idx % 7 !== 6),
        compiledCommitmentPdfUrl: entry.compiledCommitmentPdfUrl ?? (idx % 3 !== 2 ? `/sites/${entry.projectCode}/Shared Documents/Commitments/${entry.divisionCode}_commitment.pdf` : undefined),
        compiledCommitmentFileId: entry.compiledCommitmentPdfUrl ? `file-${entry.id}` : undefined,
        compiledCommitmentFileName: entry.compiledCommitmentPdfUrl ? `${entry.divisionCode}_commitment.pdf` : undefined,
        eVerifyContractNumber: hasSubcontractor ? `SC-${entry.projectCode}-${entry.divisionCode}` : undefined,
        eVerifySentDate: evStatus !== 'Not Sent' ? '2025-11-01' : undefined,
        eVerifyReminderDate: evStatus === 'Reminder Sent' || evStatus === 'Received' || evStatus === 'Overdue' ? '2025-11-15' : undefined,
        eVerifyReceivedDate: evStatus === 'Received' ? '2025-11-20' : undefined,
        eVerifyStatus: evStatus,
      };
    });
  }

  // ---------------------------------------------------------------------------
  // Re-Key Operation
  // ---------------------------------------------------------------------------

  public async rekeyProjectCode(oldCode: string, newCode: string, leadId: number): Promise<void> {
    await delay();

    // 1. Update the lead
    const leadIndex = this.leads.findIndex(l => l.id === leadId);
    if (leadIndex !== -1) {
      this.leads[leadIndex].ProjectCode = newCode;
      this.leads[leadIndex].OfficialJobNumber = newCode;
    }

    // 2. Update estimating records
    for (const rec of this.estimatingRecords) {
      if (rec.ProjectCode === oldCode) {
        rec.ProjectCode = newCode;
      }
    }

    // 3. Update team members
    for (const tm of this.teamMembers) {
      if (tm.projectCode === oldCode) {
        tm.projectCode = newCode;
      }
    }

    // 4. Update deliverables
    for (const d of this.deliverables) {
      if (d.projectCode === oldCode) {
        d.projectCode = newCode;
      }
    }

    // 5. Update turnover items
    for (const t of this.turnoverItems) {
      if (t.projectCode === oldCode) {
        t.projectCode = newCode;
      }
    }

    // 6. Update closeout items
    for (const c of this.closeoutItems) {
      if (c.projectCode === oldCode) {
        c.projectCode = newCode;
      }
    }

    // 7. Update checklist items
    for (const ci of this.checklistItems) {
      if (ci.projectCode === oldCode) {
        ci.projectCode = newCode;
      }
    }

    // 8. Update internal matrix tasks
    for (const mt of this.internalMatrixTasks) {
      if (mt.projectCode === oldCode) {
        mt.projectCode = newCode;
      }
    }

    // 9. Update team role assignments
    for (const tra of this.teamRoleAssignments) {
      if (tra.projectCode === oldCode) {
        tra.projectCode = newCode;
      }
    }

    // 10. Update owner contract articles
    for (const oca of this.ownerContractArticles) {
      if (oca.projectCode === oldCode) {
        oca.projectCode = newCode;
      }
    }

    // 11. Update sub contract clauses
    for (const scc of this.subContractClauses) {
      if (scc.projectCode === oldCode) {
        scc.projectCode = newCode;
      }
    }

    // 12. Update marketing records
    for (const mr of this.marketingRecords) {
      if (mr.projectCode === oldCode) {
        mr.projectCode = newCode;
      }
    }

    // 13. Update risk/cost records
    for (const rc of this.riskCostRecords) {
      if (rc.projectCode === oldCode) {
        rc.projectCode = newCode;
      }
    }

    // 14. Update quality concerns
    for (const qc of this.qualityConcerns) {
      if (qc.projectCode === oldCode) {
        qc.projectCode = newCode;
      }
    }

    // 15. Update safety concerns
    for (const sc of this.safetyConcerns) {
      if (sc.projectCode === oldCode) {
        sc.projectCode = newCode;
      }
    }

    // 16. Update schedule records
    for (const sr of this.scheduleRecords) {
      if (sr.projectCode === oldCode) {
        sr.projectCode = newCode;
      }
    }

    // 17. Update superintendent plans
    for (const sp of this.superintendentPlans) {
      if (sp.projectCode === oldCode) {
        sp.projectCode = newCode;
      }
    }

    // 18. Update lessons learned
    for (const ll of this.lessonsLearned) {
      if (ll.projectCode === oldCode) {
        ll.projectCode = newCode;
      }
    }

    // 19. Update PMPs
    for (const pmp of this.pmps) {
      if (pmp.projectCode === oldCode) {
        pmp.projectCode = newCode;
      }
    }

    // 20. Update monthly reviews
    for (const mr of this.monthlyReviews) {
      if (mr.projectCode === oldCode) {
        mr.projectCode = newCode;
      }
    }

    // 21. Update provisioning logs
    for (const pl of this.provisioningLogs) {
      if (pl.projectCode === oldCode) {
        pl.projectCode = newCode;
      }
    }

    // 22. Update buyout entries
    for (const be of this.buyoutEntries) {
      if (be.projectCode === oldCode) {
        be.projectCode = newCode;
      }
    }
  }

  // -- Lookups ----------------------------------------------------------

  public async getTemplates(): Promise<Array<{ TemplateName: string; SourceURL: string; TargetFolder: string; Division: string; Active: boolean }>> {
    await delay();
    try {
      const templates = require('../mock/templateRegistry.json');
      return templates;
    } catch {
      return [];
    }
  }

  public async getRegions(): Promise<string[]> {
    await delay();
    const { Region } = require('../models/enums');
    return Object.values(Region) as string[];
  }

  public async getSectors(): Promise<string[]> {
    await delay();
    const { Sector } = require('../models/enums');
    return Object.values(Sector) as string[];
  }

  // ---------------------------------------------------------------------------
  // Active Projects Portfolio
  // ---------------------------------------------------------------------------

  public async getActiveProjects(options?: IActiveProjectsQueryOptions): Promise<IActiveProject[]> {
    await delay();
    let filtered = [...this.activeProjects];

    // Apply filters
    if (options?.status) {
      filtered = filtered.filter(p => p.status === options.status);
    }
    if (options?.sector) {
      filtered = filtered.filter(p => p.sector === options.sector);
    }
    if (options?.projectExecutive) {
      filtered = filtered.filter(p => p.personnel.projectExecutive === options.projectExecutive);
    }
    if (options?.projectManager) {
      filtered = filtered.filter(p => p.personnel.leadPM === options.projectManager);
    }
    if (options?.region) {
      filtered = filtered.filter(p => p.region === options.region);
    }
    if (options?.hasAlerts) {
      filtered = filtered.filter(p => p.hasUnbilledAlert || p.hasScheduleAlert || p.hasFeeErosionAlert);
    }

    // Apply sorting
    if (options?.orderBy) {
      const key = options.orderBy as keyof IActiveProject;
      const asc = options.orderAscending !== false;
      filtered.sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;
        if (aVal < bVal) return asc ? -1 : 1;
        if (aVal > bVal) return asc ? 1 : -1;
        return 0;
      });
    }

    // Apply pagination
    const skip = options?.skip ?? 0;
    const top = options?.top ?? filtered.length;
    return filtered.slice(skip, skip + top);
  }

  public async getActiveProjectById(id: number): Promise<IActiveProject | null> {
    await delay();
    return this.activeProjects.find(p => p.id === id) ?? null;
  }

  public async syncActiveProject(projectCode: string): Promise<IActiveProject> {
    await delay();
    const existing = this.activeProjects.find(p => p.projectCode === projectCode);
    if (existing) {
      existing.lastSyncDate = new Date().toISOString();
      return { ...existing };
    }
    throw new Error(`Project ${projectCode} not found`);
  }

  public async updateActiveProject(id: number, data: Partial<IActiveProject>): Promise<IActiveProject> {
    await delay();
    const index = this.activeProjects.findIndex(p => p.id === id);
    if (index === -1) throw new Error(`Active project ${id} not found`);
    
    this.activeProjects[index] = {
      ...this.activeProjects[index],
      ...data,
      lastModified: new Date().toISOString(),
    };
    return { ...this.activeProjects[index] };
  }

  public async getPortfolioSummary(filters?: IActiveProjectsFilter): Promise<IPortfolioSummary> {
    await delay();
    let projects = [...this.activeProjects];

    // Apply filters
    if (filters?.status) {
      projects = projects.filter(p => p.status === filters.status);
    }
    if (filters?.sector) {
      projects = projects.filter(p => p.sector === filters.sector);
    }
    if (filters?.projectExecutive) {
      projects = projects.filter(p => p.personnel.projectExecutive === filters.projectExecutive);
    }
    if (filters?.projectManager) {
      projects = projects.filter(p => p.personnel.leadPM === filters.projectManager);
    }
    if (filters?.region) {
      projects = projects.filter(p => p.region === filters.region);
    }

    // Calculate summary metrics
    const totalBacklog = projects.reduce((sum, p) => sum + (p.financials.remainingValue || 0), 0);
    const totalOriginalContract = projects.reduce((sum, p) => sum + (p.financials.originalContract || 0), 0);
    const totalBillingsToDate = projects.reduce((sum, p) => sum + (p.financials.billingsToDate || 0), 0);
    const totalUnbilled = projects.reduce((sum, p) => sum + (p.financials.unbilled || 0), 0);
    
    const projectsWithFee = projects.filter(p => p.financials.projectedFeePct != null);
    const averageFeePct = projectsWithFee.length > 0
      ? projectsWithFee.reduce((sum, p) => sum + (p.financials.projectedFeePct || 0), 0) / projectsWithFee.length
      : 0;

    // Monthly burn rate (simplified: total billings / months active)
    const monthlyBurnRate = totalBillingsToDate / 12; // Simplified calculation

    // Count by status
    const projectsByStatus: Record<ProjectStatus, number> = {
      'Precon': projects.filter(p => p.status === 'Precon').length,
      'Construction': projects.filter(p => p.status === 'Construction').length,
      'Final Payment': projects.filter(p => p.status === 'Final Payment').length,
    };

    // Count by sector
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

  public async getPersonnelWorkload(role?: 'PX' | 'PM' | 'Super'): Promise<IPersonnelWorkload[]> {
    await delay();
    const workloadMap = new Map<string, IPersonnelWorkload>();

    for (const project of this.activeProjects) {
      // Process PX
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

      // Process PM
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

      // Process Super
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

  public async triggerPortfolioSync(): Promise<void> {
    await delay();
    // In mock, just update all lastSyncDate
    const now = new Date().toISOString();
    for (const project of this.activeProjects) {
      project.lastSyncDate = now;
    }
  }

  // ---------------------------------------------------------------------------
  // Audit Log Scalability
  // ---------------------------------------------------------------------------

  public async purgeOldAuditEntries(olderThanDays: number): Promise<number> {
    await delay();
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    const before = this.auditLog.length;
    this.auditLog = this.auditLog.filter(e => new Date(e.Timestamp).getTime() >= cutoff);
    return before - this.auditLog.length;
  }

  // ---------------------------------------------------------------------------
  // Denormalized Field Sync
  // ---------------------------------------------------------------------------

  public async syncDenormalizedFields(leadId: number): Promise<void> {
    await delay();
    const lead = this.leads.find(l => l.id === leadId);
    if (!lead) return;

    // Sync Title → denormalized projectName fields
    for (const est of this.estimatingRecords) {
      if (est.LeadID === leadId) {
        est.Title = lead.Title;
      }
    }
    for (const pmp of this.pmps) {
      if (pmp.projectCode === lead.ProjectCode) {
        pmp.projectName = lead.Title;
      }
    }
    for (const mr of this.marketingRecords) {
      if (mr.projectCode === lead.ProjectCode) {
        mr.projectName = lead.Title;
      }
    }
    for (const pl of this.provisioningLogs) {
      if (pl.projectCode === lead.ProjectCode) {
        pl.projectName = lead.Title;
      }
    }

    // Sync ProjectExecutive, ProjectManager → job number requests
    for (const jnr of this.jobNumberRequests) {
      if (jnr.LeadID === leadId) {
        jnr.ProjectExecutive = lead.ProjectExecutive ?? jnr.ProjectExecutive;
        jnr.ProjectManager = lead.ProjectManager ?? jnr.ProjectManager;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Closeout Promotion — copy lessons to hub
  // ---------------------------------------------------------------------------

  public async promoteToHub(projectCode: string): Promise<void> {
    await delay();

    // 1. Copy lessons learned flagged for final record to hub-level array
    const projectLessons = this.lessonsLearned.filter(
      l => l.projectCode === projectCode && l.isIncludedInFinalRecord
    );
    for (const lesson of projectLessons) {
      const exists = this.lessonsLearnedHub.some(
        l => l.projectCode === lesson.projectCode && l.id === lesson.id
      );
      if (!exists) {
        this.lessonsLearnedHub.push({ ...lesson });
      }
    }

    // 2. Update PMP status to Closed if exists
    const pmpIndex = this.pmps.findIndex(p => p.projectCode === projectCode);
    if (pmpIndex !== -1 && this.pmps[pmpIndex].status !== 'Closed') {
      this.pmps[pmpIndex].status = 'Closed';
      this.pmps[pmpIndex].lastUpdatedAt = new Date().toISOString();
    }
  }

  // ---------------------------------------------------------------------------
  // Workflow Definitions
  // ---------------------------------------------------------------------------

  public async getWorkflowDefinitions(): Promise<IWorkflowDefinition[]> {
    await delay();
    return JSON.parse(JSON.stringify(this.workflowDefinitions));
  }

  public async getWorkflowDefinition(workflowKey: WorkflowKey): Promise<IWorkflowDefinition | null> {
    await delay();
    const def = this.workflowDefinitions.find(w => w.workflowKey === workflowKey);
    return def ? JSON.parse(JSON.stringify(def)) : null;
  }

  public async updateWorkflowStep(workflowId: number, stepId: number, data: Partial<IWorkflowStep>): Promise<IWorkflowStep> {
    await delay();
    const workflow = this.workflowDefinitions.find(w => w.id === workflowId);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);
    const stepIndex = workflow.steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) throw new Error(`Step ${stepId} not found`);
    workflow.steps[stepIndex] = { ...workflow.steps[stepIndex], ...data, id: stepId, workflowId };
    workflow.lastModifiedDate = new Date().toISOString();
    return JSON.parse(JSON.stringify(workflow.steps[stepIndex]));
  }

  public async addConditionalAssignment(stepId: number, assignment: Partial<IConditionalAssignment>): Promise<IConditionalAssignment> {
    await delay();
    for (const workflow of this.workflowDefinitions) {
      const step = workflow.steps.find(s => s.id === stepId);
      if (step) {
        const newAssignment: IConditionalAssignment = {
          id: this.getNextId(),
          stepId,
          conditions: assignment.conditions || [],
          assignee: assignment.assignee || { userId: '', displayName: '', email: '' },
          priority: assignment.priority || step.conditionalAssignees.length + 1,
        };
        step.conditionalAssignees.push(newAssignment);
        workflow.lastModifiedDate = new Date().toISOString();
        return JSON.parse(JSON.stringify(newAssignment));
      }
    }
    throw new Error(`Step ${stepId} not found`);
  }

  public async updateConditionalAssignment(assignmentId: number, data: Partial<IConditionalAssignment>): Promise<IConditionalAssignment> {
    await delay();
    for (const workflow of this.workflowDefinitions) {
      for (const step of workflow.steps) {
        const idx = step.conditionalAssignees.findIndex(a => a.id === assignmentId);
        if (idx !== -1) {
          step.conditionalAssignees[idx] = { ...step.conditionalAssignees[idx], ...data, id: assignmentId };
          workflow.lastModifiedDate = new Date().toISOString();
          return JSON.parse(JSON.stringify(step.conditionalAssignees[idx]));
        }
      }
    }
    throw new Error(`Conditional assignment ${assignmentId} not found`);
  }

  public async removeConditionalAssignment(assignmentId: number): Promise<void> {
    await delay();
    for (const workflow of this.workflowDefinitions) {
      for (const step of workflow.steps) {
        const idx = step.conditionalAssignees.findIndex(a => a.id === assignmentId);
        if (idx !== -1) {
          step.conditionalAssignees.splice(idx, 1);
          workflow.lastModifiedDate = new Date().toISOString();
          return;
        }
      }
    }
    throw new Error(`Conditional assignment ${assignmentId} not found`);
  }

  public async getWorkflowOverrides(projectCode: string): Promise<IWorkflowStepOverride[]> {
    await delay();
    return JSON.parse(JSON.stringify(this.workflowStepOverrides.filter(o => o.projectCode === projectCode)));
  }

  public async setWorkflowStepOverride(override: Partial<IWorkflowStepOverride>): Promise<IWorkflowStepOverride> {
    await delay();
    // Remove existing override for this project+step combination
    this.workflowStepOverrides = this.workflowStepOverrides.filter(
      o => !(o.projectCode === override.projectCode && o.stepId === override.stepId)
    );
    const newOverride: IWorkflowStepOverride = {
      id: this.getNextId(),
      projectCode: override.projectCode || '',
      workflowKey: override.workflowKey || WorkflowKey.GO_NO_GO,
      stepId: override.stepId || 0,
      overrideAssignee: override.overrideAssignee || { userId: '', displayName: '', email: '' },
      overrideReason: override.overrideReason,
      overriddenBy: override.overriddenBy || '',
      overriddenDate: new Date().toISOString(),
    };
    this.workflowStepOverrides.push(newOverride);
    return JSON.parse(JSON.stringify(newOverride));
  }

  public async removeWorkflowStepOverride(overrideId: number): Promise<void> {
    await delay();
    const idx = this.workflowStepOverrides.findIndex(o => o.id === overrideId);
    if (idx === -1) throw new Error(`Override ${overrideId} not found`);
    this.workflowStepOverrides.splice(idx, 1);
  }

  public async resolveWorkflowChain(workflowKey: WorkflowKey, projectCode: string): Promise<IResolvedWorkflowStep[]> {
    await delay();
    const workflow = this.workflowDefinitions.find(w => w.workflowKey === workflowKey);
    if (!workflow) return [];

    const overrides = this.workflowStepOverrides.filter(
      o => o.projectCode === projectCode && o.workflowKey === workflowKey
    );
    const teamMembers = this.teamMembers.filter(tm => tm.projectCode === projectCode);
    const lead = this.leads.find(l => l.ProjectCode === projectCode);

    const resolved: IResolvedWorkflowStep[] = [];

    for (const step of workflow.steps) {
      // 0. Feature flag gating
      if (step.featureFlagName) {
        const flag = this.featureFlags.find(f => f.FeatureName === step.featureFlagName);
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
          // Unresolvable — no team member with that role
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
        let conditionMet = !step.isConditional; // Non-conditional steps are always met

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getLeadFieldValue(lead: any, field: ConditionField): string {
    switch (field) {
      case ConditionField.Division: return lead.Division || '';
      case ConditionField.Region: return lead.Region || '';
      case ConditionField.Sector: return lead.Sector || '';
      default: return '';
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // ──── Turnover Agenda ────
  // ═══════════════════════════════════════════════════════════════════

  private assembleTurnoverAgenda(agendaId: number): ITurnoverAgenda | null {
    const agenda = this.turnoverAgendas.find(a => a.id === agendaId);
    if (!agenda) return null;
    const header = this.turnoverHeaders.find(h => h.turnoverAgendaId === agendaId);
    const overview = this.turnoverEstimateOverviews.find(e => e.turnoverAgendaId === agendaId);
    const prereqs = this.turnoverPrerequisites.filter(p => p.turnoverAgendaId === agendaId).sort((a, b) => a.sortOrder - b.sortOrder);
    const items = this.turnoverDiscussionItems.filter(d => d.turnoverAgendaId === agendaId).sort((a, b) => a.sortOrder - b.sortOrder);
    const subs = this.turnoverSubcontractors.filter(s => s.turnoverAgendaId === agendaId);
    const exhibits = this.turnoverExhibits.filter(e => e.turnoverAgendaId === agendaId).sort((a, b) => a.sortOrder - b.sortOrder);
    const sigs = this.turnoverSignatures.filter(s => s.turnoverAgendaId === agendaId).sort((a, b) => a.sortOrder - b.sortOrder);

    // Attach attachments to discussion items
    const itemsWithAttachments = items.map(item => ({
      ...item,
      attachments: this.turnoverAttachments.filter(a => a.discussionItemId === item.id),
    }));

    return JSON.parse(JSON.stringify({
      ...agenda,
      header: header || {} as ITurnoverProjectHeader,
      estimateOverview: overview || {} as ITurnoverEstimateOverview,
      prerequisites: prereqs,
      discussionItems: itemsWithAttachments,
      subcontractors: subs,
      exhibits,
      signatures: sigs,
    }));
  }

  async getTurnoverAgenda(projectCode: string): Promise<ITurnoverAgenda | null> {
    await delay();
    const agenda = this.turnoverAgendas.find(a => a.projectCode === projectCode);
    if (!agenda) return null;
    return this.assembleTurnoverAgenda(agenda.id);
  }

  async createTurnoverAgenda(projectCode: string, leadId: number): Promise<ITurnoverAgenda> {
    await delay();
    const lead = this.leads.find(l => l.id === leadId);
    const agendaId = ++this.nextId;

    const newAgenda: ITurnoverAgenda = {
      id: agendaId,
      projectCode,
      leadId,
      status: TurnoverStatus.Draft,
      projectName: lead?.Title || '',
      header: {} as ITurnoverProjectHeader,
      estimateOverview: {} as ITurnoverEstimateOverview,
      prerequisites: [],
      discussionItems: [],
      subcontractors: [],
      exhibits: [],
      signatures: [],
      createdBy: 'Current User',
      createdDate: new Date().toISOString(),
    };
    this.turnoverAgendas.push(newAgenda);

    // Create header from lead data
    const headerId = ++this.nextId;
    this.turnoverHeaders.push({
      id: headerId,
      turnoverAgendaId: agendaId,
      projectName: lead?.Title || '',
      projectCode,
      clientName: lead?.ClientName || '',
      projectValue: lead?.ProjectValue || 0,
      deliveryMethod: lead?.DeliveryMethod || '',
      projectExecutive: lead?.ProjectExecutive || '',
      projectManager: lead?.ProjectManager || '',
      leadEstimator: '',
      overrides: {},
    });

    // Create estimate overview from lead data
    const overviewId = ++this.nextId;
    const projectValue = lead?.ProjectValue || 0;
    const feePct = lead?.AnticipatedFeePct || 5;
    this.turnoverEstimateOverviews.push({
      id: overviewId,
      turnoverAgendaId: agendaId,
      contractAmount: projectValue,
      originalEstimate: projectValue,
      buyoutTarget: Math.round(projectValue * 0.9),
      estimatedFee: Math.round(projectValue * (feePct / 100)),
      estimatedGrossMargin: lead?.AnticipatedGrossMargin || 0,
      contingency: Math.round(projectValue * 0.015),
      notes: '',
      overrides: {},
    });

    // Create default prerequisites
    for (const prereq of DEFAULT_PREREQUISITES) {
      this.turnoverPrerequisites.push({
        id: ++this.nextId,
        turnoverAgendaId: agendaId,
        sortOrder: prereq.sortOrder,
        label: prereq.label,
        description: prereq.description,
        completed: false,
      });
    }

    // Create default discussion items
    for (const item of DEFAULT_DISCUSSION_ITEMS) {
      this.turnoverDiscussionItems.push({
        id: ++this.nextId,
        turnoverAgendaId: agendaId,
        sortOrder: item.sortOrder,
        label: item.label,
        description: item.description,
        discussed: false,
        notes: '',
        attachments: [],
      });
    }

    // Create default exhibits
    for (const exhibit of DEFAULT_EXHIBITS) {
      this.turnoverExhibits.push({
        id: ++this.nextId,
        turnoverAgendaId: agendaId,
        sortOrder: exhibit.sortOrder,
        label: exhibit.label,
        isDefault: exhibit.isDefault,
        reviewed: false,
      });
    }

    // Create default signatures — resolve names from team members
    const teamMembers = this.teamMembers.filter(tm => tm.projectCode === projectCode);
    for (const sig of DEFAULT_SIGNATURES) {
      let signerName = '';
      let signerEmail = '';
      if (sig.role === 'Lead Estimator') {
        const estCoord = teamMembers.find(tm => tm.role === RoleName.EstimatingCoordinator);
        signerName = estCoord?.name || '';
        signerEmail = estCoord?.email || '';
      } else if (sig.role === 'Project Executive') {
        signerName = lead?.ProjectExecutive || '';
        const px = teamMembers.find(tm => tm.role === RoleName.ExecutiveLeadership);
        signerEmail = px?.email || '';
      } else if (sig.role === 'Project Manager') {
        signerName = lead?.ProjectManager || '';
        const pm = teamMembers.find(tm => tm.role === RoleName.OperationsTeam && tm.department === 'Project Management');
        signerEmail = pm?.email || '';
      } else if (sig.role === 'Superintendent') {
        const super_ = teamMembers.find(tm => tm.role === RoleName.OperationsTeam && tm.department === 'Field Operations');
        signerName = super_?.name || '';
        signerEmail = super_?.email || '';
      }
      this.turnoverSignatures.push({
        id: ++this.nextId,
        turnoverAgendaId: agendaId,
        sortOrder: sig.sortOrder,
        role: sig.role,
        signerName,
        signerEmail,
        affidavitText: TURNOVER_SIGNATURE_AFFIDAVIT,
        signed: false,
      });
    }

    return this.assembleTurnoverAgenda(agendaId)!;
  }

  async updateTurnoverAgenda(projectCode: string, data: Partial<ITurnoverAgenda>): Promise<ITurnoverAgenda> {
    await delay();
    const idx = this.turnoverAgendas.findIndex(a => a.projectCode === projectCode);
    if (idx === -1) throw new Error('Turnover agenda not found');
    this.turnoverAgendas[idx] = { ...this.turnoverAgendas[idx], ...data, lastModifiedDate: new Date().toISOString() };
    return this.assembleTurnoverAgenda(this.turnoverAgendas[idx].id)!;
  }

  async updateTurnoverPrerequisite(prerequisiteId: number, data: Partial<ITurnoverPrerequisite>): Promise<ITurnoverPrerequisite> {
    await delay();
    const idx = this.turnoverPrerequisites.findIndex(p => p.id === prerequisiteId);
    if (idx === -1) throw new Error('Prerequisite not found');
    this.turnoverPrerequisites[idx] = { ...this.turnoverPrerequisites[idx], ...data };
    return JSON.parse(JSON.stringify(this.turnoverPrerequisites[idx]));
  }

  async updateTurnoverDiscussionItem(itemId: number, data: Partial<ITurnoverDiscussionItem>): Promise<ITurnoverDiscussionItem> {
    await delay();
    const idx = this.turnoverDiscussionItems.findIndex(d => d.id === itemId);
    if (idx === -1) throw new Error('Discussion item not found');
    this.turnoverDiscussionItems[idx] = { ...this.turnoverDiscussionItems[idx], ...data };
    const item = this.turnoverDiscussionItems[idx];
    return JSON.parse(JSON.stringify({
      ...item,
      attachments: this.turnoverAttachments.filter(a => a.discussionItemId === item.id),
    }));
  }

  async addTurnoverDiscussionAttachment(itemId: number, _file: File): Promise<ITurnoverAttachment> {
    await delay();
    const attachment: ITurnoverAttachment = {
      id: ++this.nextId,
      discussionItemId: itemId,
      fileName: _file.name,
      fileUrl: `https://hedrickbrothers.sharepoint.com/sites/mock/Turnover/${_file.name}`,
      uploadedBy: 'Current User',
      uploadedDate: new Date().toISOString(),
    };
    this.turnoverAttachments.push(attachment);
    return JSON.parse(JSON.stringify(attachment));
  }

  async removeTurnoverDiscussionAttachment(attachmentId: number): Promise<void> {
    await delay();
    const idx = this.turnoverAttachments.findIndex(a => a.id === attachmentId);
    if (idx !== -1) this.turnoverAttachments.splice(idx, 1);
  }

  async addTurnoverSubcontractor(turnoverAgendaId: number, data: Partial<ITurnoverSubcontractor>): Promise<ITurnoverSubcontractor> {
    await delay();
    const sub: ITurnoverSubcontractor = {
      id: ++this.nextId,
      turnoverAgendaId,
      trade: data.trade || '',
      subcontractorName: data.subcontractorName || '',
      contactName: data.contactName || '',
      contactPhone: data.contactPhone || '',
      contactEmail: data.contactEmail || '',
      qScore: data.qScore ?? null,
      isPreferred: data.isPreferred ?? false,
      isRequired: data.isRequired ?? false,
      notes: data.notes || '',
    };
    this.turnoverSubcontractors.push(sub);
    return JSON.parse(JSON.stringify(sub));
  }

  async updateTurnoverSubcontractor(subId: number, data: Partial<ITurnoverSubcontractor>): Promise<ITurnoverSubcontractor> {
    await delay();
    const idx = this.turnoverSubcontractors.findIndex(s => s.id === subId);
    if (idx === -1) throw new Error('Subcontractor not found');
    this.turnoverSubcontractors[idx] = { ...this.turnoverSubcontractors[idx], ...data };
    return JSON.parse(JSON.stringify(this.turnoverSubcontractors[idx]));
  }

  async removeTurnoverSubcontractor(subId: number): Promise<void> {
    await delay();
    const idx = this.turnoverSubcontractors.findIndex(s => s.id === subId);
    if (idx !== -1) this.turnoverSubcontractors.splice(idx, 1);
  }

  async updateTurnoverExhibit(exhibitId: number, data: Partial<ITurnoverExhibit>): Promise<ITurnoverExhibit> {
    await delay();
    const idx = this.turnoverExhibits.findIndex(e => e.id === exhibitId);
    if (idx === -1) throw new Error('Exhibit not found');
    this.turnoverExhibits[idx] = { ...this.turnoverExhibits[idx], ...data };
    return JSON.parse(JSON.stringify(this.turnoverExhibits[idx]));
  }

  async addTurnoverExhibit(turnoverAgendaId: number, data: Partial<ITurnoverExhibit>): Promise<ITurnoverExhibit> {
    await delay();
    const existing = this.turnoverExhibits.filter(e => e.turnoverAgendaId === turnoverAgendaId);
    const maxOrder = existing.length > 0 ? Math.max(...existing.map(e => e.sortOrder)) : 0;
    const exhibit: ITurnoverExhibit = {
      id: ++this.nextId,
      turnoverAgendaId,
      sortOrder: maxOrder + 1,
      label: data.label || 'Custom Exhibit',
      isDefault: false,
      reviewed: false,
      ...data,
    };
    this.turnoverExhibits.push(exhibit);
    return JSON.parse(JSON.stringify(exhibit));
  }

  async removeTurnoverExhibit(exhibitId: number): Promise<void> {
    await delay();
    const idx = this.turnoverExhibits.findIndex(e => e.id === exhibitId);
    if (idx !== -1) this.turnoverExhibits.splice(idx, 1);
  }

  async uploadTurnoverExhibitFile(exhibitId: number, _file: File): Promise<{ fileUrl: string; fileName: string }> {
    await delay();
    const idx = this.turnoverExhibits.findIndex(e => e.id === exhibitId);
    if (idx === -1) throw new Error('Exhibit not found');
    const fileUrl = `https://hedrickbrothers.sharepoint.com/sites/mock/Turnover/${_file.name}`;
    this.turnoverExhibits[idx] = {
      ...this.turnoverExhibits[idx],
      uploadedFileName: _file.name,
      uploadedFileUrl: fileUrl,
    };
    return { fileUrl, fileName: _file.name };
  }

  async signTurnoverAgenda(signatureId: number, comment?: string): Promise<ITurnoverSignature> {
    await delay();
    const idx = this.turnoverSignatures.findIndex(s => s.id === signatureId);
    if (idx === -1) throw new Error('Signature not found');
    this.turnoverSignatures[idx] = {
      ...this.turnoverSignatures[idx],
      signed: true,
      signedDate: new Date().toISOString(),
      comment: comment || '',
    };
    return JSON.parse(JSON.stringify(this.turnoverSignatures[idx]));
  }

  async updateTurnoverEstimateOverview(projectCode: string, data: Partial<ITurnoverEstimateOverview>): Promise<ITurnoverEstimateOverview> {
    await delay();
    const agenda = this.turnoverAgendas.find(a => a.projectCode === projectCode);
    if (!agenda) throw new Error('Turnover agenda not found');
    const idx = this.turnoverEstimateOverviews.findIndex(e => e.turnoverAgendaId === agenda.id);
    if (idx === -1) throw new Error('Estimate overview not found');
    this.turnoverEstimateOverviews[idx] = { ...this.turnoverEstimateOverviews[idx], ...data };
    return JSON.parse(JSON.stringify(this.turnoverEstimateOverviews[idx]));
  }

  // --- Hub Site URL Configuration ---
  async getHubSiteUrl(): Promise<string> {
    await delay();
    return this.hubSiteUrl;
  }

  async setHubSiteUrl(url: string): Promise<void> {
    await delay();
    this.hubSiteUrl = url;
  }

  // --- Action Inbox Aggregation ---
  async getActionItems(userEmail: string): Promise<IActionInboxItem[]> {
    await delay();
    const items: IActionInboxItem[] = [];
    const email = userEmail.toLowerCase();
    const now = new Date();

    const computePriority = (dateStr: string): ActionPriority => {
      const days = Math.floor((now.getTime() - new Date(dateStr).getTime()) / 86400000);
      if (days > 7) return ActionPriority.Urgent;
      if (days >= 1) return ActionPriority.Normal;
      return ActionPriority.New;
    };
    const computeDays = (dateStr: string): number =>
      Math.max(0, Math.floor((now.getTime() - new Date(dateStr).getTime()) / 86400000));

    // 1. Go/No-Go Scorecards — pending approval steps
    for (const sc of this.scorecards) {
      const assembled = this.assembleScorecard(sc);
      if (!assembled.approvalCycles?.length) continue;
      const activeCycle = assembled.approvalCycles.find(c => c.status === 'Active');
      if (!activeCycle) continue;
      const pendingStep = activeCycle.steps?.find(
        s => s.status === 'Pending' && s.assigneeEmail?.toLowerCase() === email
      );
      if (pendingStep) {
        const lead = this.leads.find(l => l.id === sc.LeadID);
        const prevStep = activeCycle.steps?.find(s => s.stepOrder === pendingStep.stepOrder - 1);
        const requestedDate = prevStep?.actionDate || activeCycle.startedDate || now.toISOString().split('T')[0];
        items.push({
          id: `gonogo-${sc.id}-${pendingStep.id}`,
          workflowType: pendingStep.stepOrder === 1
            ? WorkflowActionType.GoNoGoRevision
            : WorkflowActionType.GoNoGoReview,
          actionLabel: pendingStep.stepOrder === 1
            ? 'Revise Go/No-Go Scorecard'
            : 'Review Go/No-Go Scorecard',
          projectCode: lead?.ProjectCode || '',
          projectName: lead?.Title || `Lead ${sc.LeadID}`,
          entityId: sc.id,
          requestedBy: prevStep?.assigneeName || 'System',
          requestedByEmail: prevStep?.assigneeEmail || '',
          requestedDate,
          waitingDays: computeDays(requestedDate),
          routePath: `/lead/${sc.LeadID}/gonogo`,
          priority: computePriority(requestedDate),
        });
      }
    }

    // 2. PMP Approval — pending approval steps
    for (const pmp of this.pmps) {
      const assembled = this.assemblePMP(pmp);
      if (!assembled.approvalCycles?.length) continue;
      const activeCycle = assembled.approvalCycles.find(c => c.status === 'InProgress');
      if (!activeCycle) continue;
      const pendingStep = activeCycle.steps?.find(
        s => s.status === 'Pending' && s.approverEmail?.toLowerCase() === email
      );
      if (pendingStep) {
        const requestedDate = activeCycle.submittedDate || now.toISOString().split('T')[0];
        items.push({
          id: `pmp-approval-${pmp.id}-${pendingStep.id}`,
          workflowType: WorkflowActionType.PMPApproval,
          actionLabel: 'Approve Project Management Plan',
          projectCode: pmp.projectCode,
          projectName: pmp.projectName || pmp.projectCode,
          entityId: pmp.id,
          requestedBy: activeCycle.submittedBy || 'Unknown',
          requestedByEmail: '',
          requestedDate,
          waitingDays: computeDays(requestedDate),
          routePath: `/operations/management-plan`,
          priority: computePriority(requestedDate),
        });
      }
    }

    // 3. PMP Signatures — pending signatures
    for (const pmp of this.pmps) {
      const assembled = this.assemblePMP(pmp);
      const pendingSigs = [...(assembled.startupSignatures || []), ...(assembled.completionSignatures || [])]
        .filter(s => s.status === 'Pending' && s.personEmail?.toLowerCase() === email);
      for (const sig of pendingSigs) {
        const requestedDate = pmp.lastUpdatedAt || pmp.createdAt || now.toISOString().split('T')[0];
        items.push({
          id: `pmp-sig-${pmp.id}-${sig.id}`,
          workflowType: WorkflowActionType.PMPSignature,
          actionLabel: `Sign PMP (${sig.signatureType})`,
          projectCode: pmp.projectCode,
          projectName: pmp.projectName || pmp.projectCode,
          entityId: pmp.id,
          requestedBy: pmp.createdBy || 'Unknown',
          requestedByEmail: '',
          requestedDate,
          waitingDays: computeDays(requestedDate),
          routePath: `/operations/management-plan`,
          priority: computePriority(requestedDate),
        });
      }
    }

    // 4. Monthly Reviews — status-based assignee inference
    for (const review of this.monthlyReviews) {
      const assembled = this.assembleMonthlyReview(review);
      const status = assembled.status;
      // PX-facing statuses: check if user has Executive Leadership role (approximated by email match)
      if ((status === 'PendingPXReview' || status === 'PendingPXValidation')) {
        // In mock mode, PX users are Executive Leadership — check all roles
        const currentUserData = this.users.find(u => u.email?.toLowerCase() === email);
        const isPX = currentUserData?.roles?.includes(RoleName.ExecutiveLeadership) ||
          currentUserData?.roles?.includes(RoleName.DepartmentDirector);
        if (isPX) {
          const requestedDate = assembled.lastUpdatedAt || assembled.createdAt || now.toISOString().split('T')[0];
          items.push({
            id: `monthly-review-${assembled.id}`,
            workflowType: WorkflowActionType.MonthlyReviewValidation,
            actionLabel: status === 'PendingPXReview' ? 'Review Monthly Report' : 'Validate Monthly Report',
            projectCode: assembled.projectCode,
            projectName: assembled.projectCode,
            entityId: assembled.id,
            requestedBy: assembled.createdBy || 'PM',
            requestedByEmail: '',
            requestedDate,
            waitingDays: computeDays(requestedDate),
            routePath: `/operations/monthly-review`,
            priority: computePriority(requestedDate),
          });
        }
      }
      // PM-facing statuses: match createdBy
      if ((status === 'PMRevising' || status === 'InProgress' || status === 'FollowUpPending') &&
          assembled.createdBy?.toLowerCase() === email) {
        const requestedDate = assembled.lastUpdatedAt || assembled.createdAt || now.toISOString().split('T')[0];
        items.push({
          id: `monthly-input-${assembled.id}`,
          workflowType: WorkflowActionType.MonthlyReviewInput,
          actionLabel: status === 'FollowUpPending' ? 'Respond to Follow-Ups' : 'Complete Monthly Review',
          projectCode: assembled.projectCode,
          projectName: assembled.projectCode,
          entityId: assembled.id,
          requestedBy: 'Project Executive',
          requestedByEmail: '',
          requestedDate,
          waitingDays: computeDays(requestedDate),
          routePath: `/operations/monthly-review`,
          priority: computePriority(requestedDate),
        });
      }
    }

    // 5. Commitment Approvals — pending approval steps on buyout entries
    for (const entry of this.buyoutEntries) {
      if (!entry.approvalHistory?.length) continue;
      const pendingApproval = entry.approvalHistory.find(
        a => a.status === 'Pending' && a.approverEmail?.toLowerCase() === email
      );
      if (pendingApproval) {
        // Use the most recent approved step's actionDate or fallback to today
        const previousSteps = entry.approvalHistory.filter(a => a.status === 'Approved' && a.actionDate);
        const lastApprovedDate = previousSteps.length > 0
          ? previousSteps.sort((a, b) => new Date(b.actionDate!).getTime() - new Date(a.actionDate!).getTime())[0].actionDate!
          : now.toISOString().split('T')[0];
        items.push({
          id: `commitment-${entry.id}-${pendingApproval.id}`,
          workflowType: WorkflowActionType.CommitmentApproval,
          actionLabel: `Approve Commitment: ${entry.divisionDescription || entry.divisionCode}`,
          projectCode: entry.projectCode,
          projectName: entry.projectCode,
          entityId: entry.id,
          requestedBy: previousSteps.length > 0 ? previousSteps[0].approverName : 'Unknown',
          requestedByEmail: previousSteps.length > 0 ? previousSteps[0].approverEmail : '',
          requestedDate: lastApprovedDate,
          waitingDays: computeDays(lastApprovedDate),
          routePath: `/operations/buyout-log`,
          priority: computePriority(lastApprovedDate),
        });
      }
    }

    // 6. Turnover Signatures — unsigned signatures on pending turnovers
    for (const agenda of this.turnoverAgendas) {
      if (agenda.status !== TurnoverStatus.PendingSignatures) continue;
      const unsignedSigs = this.turnoverSignatures.filter(
        s => s.turnoverAgendaId === agenda.id && !s.signed && s.signerEmail?.toLowerCase() === email
      );
      for (const sig of unsignedSigs) {
        const lead = this.leads.find(l => l.id === agenda.leadId);
        const requestedDate = now.toISOString().split('T')[0];
        items.push({
          id: `turnover-sig-${agenda.id}-${sig.id}`,
          workflowType: WorkflowActionType.TurnoverSignature,
          actionLabel: 'Sign Turnover Agenda',
          projectCode: agenda.projectCode,
          projectName: lead?.Title || agenda.projectCode,
          entityId: agenda.id,
          requestedBy: 'System',
          requestedByEmail: '',
          requestedDate,
          waitingDays: computeDays(requestedDate),
          routePath: `/preconstruction/pursuit/${agenda.leadId}/turnover`,
          priority: computePriority(requestedDate),
        });
      }
    }

    // Sort: Urgent first, then oldest first
    const priorityOrder: Record<string, number> = { Urgent: 0, Normal: 1, New: 2 };
    return items.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(a.requestedDate).getTime() - new Date(b.requestedDate).getTime();
    });
  }

  // ========== Permission Templates ==========

  async getPermissionTemplates(): Promise<IPermissionTemplate[]> {
    await delay();
    return JSON.parse(JSON.stringify(this.permissionTemplates));
  }

  async getPermissionTemplate(id: number): Promise<IPermissionTemplate | null> {
    await delay();
    const t = this.permissionTemplates.find(t => t.id === id);
    return t ? JSON.parse(JSON.stringify(t)) : null;
  }

  async createPermissionTemplate(data: Partial<IPermissionTemplate>): Promise<IPermissionTemplate> {
    await delay();
    const newTemplate: IPermissionTemplate = {
      id: ++this.nextId,
      name: data.name || 'New Template',
      description: data.description || '',
      isGlobal: data.isGlobal ?? false,
      globalAccess: data.globalAccess ?? false,
      identityType: data.identityType || 'Internal',
      toolAccess: data.toolAccess || [],
      isDefault: data.isDefault ?? false,
      isActive: data.isActive ?? true,
      version: data.version ?? 1,
      createdBy: data.createdBy || 'System',
      createdDate: new Date().toISOString(),
      lastModifiedBy: data.lastModifiedBy || data.createdBy || 'System',
      lastModifiedDate: new Date().toISOString(),
    };
    this.permissionTemplates.push(newTemplate);
    return JSON.parse(JSON.stringify(newTemplate));
  }

  async updatePermissionTemplate(id: number, data: Partial<IPermissionTemplate>): Promise<IPermissionTemplate> {
    await delay();
    const idx = this.permissionTemplates.findIndex(t => t.id === id);
    if (idx === -1) throw new Error(`Template ${id} not found`);
    this.permissionTemplates[idx] = {
      ...this.permissionTemplates[idx],
      ...data,
      id,
      lastModifiedDate: new Date().toISOString(),
    };
    return JSON.parse(JSON.stringify(this.permissionTemplates[idx]));
  }

  async deletePermissionTemplate(id: number): Promise<void> {
    await delay();
    const idx = this.permissionTemplates.findIndex(t => t.id === id);
    if (idx === -1) throw new Error(`Template ${id} not found`);
    this.permissionTemplates.splice(idx, 1);
  }

  // ========== Security Group Mappings ==========

  async getSecurityGroupMappings(): Promise<ISecurityGroupMapping[]> {
    await delay();
    return JSON.parse(JSON.stringify(this.securityGroupMappings));
  }

  async createSecurityGroupMapping(data: Partial<ISecurityGroupMapping>): Promise<ISecurityGroupMapping> {
    await delay();
    const newMapping: ISecurityGroupMapping = {
      id: ++this.nextId,
      securityGroupId: data.securityGroupId || '',
      securityGroupName: data.securityGroupName || '',
      defaultTemplateId: data.defaultTemplateId || 0,
      isActive: data.isActive ?? true,
    };
    this.securityGroupMappings.push(newMapping);
    return JSON.parse(JSON.stringify(newMapping));
  }

  async updateSecurityGroupMapping(id: number, data: Partial<ISecurityGroupMapping>): Promise<ISecurityGroupMapping> {
    await delay();
    const idx = this.securityGroupMappings.findIndex(m => m.id === id);
    if (idx === -1) throw new Error(`Security group mapping ${id} not found`);
    this.securityGroupMappings[idx] = { ...this.securityGroupMappings[idx], ...data, id };
    return JSON.parse(JSON.stringify(this.securityGroupMappings[idx]));
  }

  // ========== Project Team Assignments ==========

  async getProjectTeamAssignments(projectCode: string): Promise<IProjectTeamAssignment[]> {
    await delay();
    return JSON.parse(JSON.stringify(
      this.projectTeamAssignments.filter(a => a.projectCode === projectCode && a.isActive)
    ));
  }

  async getMyProjectAssignments(userEmail: string): Promise<IProjectTeamAssignment[]> {
    await delay();
    const email = userEmail.toLowerCase();
    return JSON.parse(JSON.stringify(
      this.projectTeamAssignments.filter(a => a.userEmail.toLowerCase() === email && a.isActive)
    ));
  }

  async createProjectTeamAssignment(data: Partial<IProjectTeamAssignment>): Promise<IProjectTeamAssignment> {
    await delay();
    const newAssignment: IProjectTeamAssignment = {
      id: ++this.nextId,
      projectCode: data.projectCode || '',
      userId: data.userId || '',
      userDisplayName: data.userDisplayName || '',
      userEmail: data.userEmail || '',
      assignedRole: data.assignedRole || '',
      templateOverrideId: data.templateOverrideId,
      granularFlagOverrides: data.granularFlagOverrides,
      assignedBy: data.assignedBy || 'System',
      assignedDate: new Date().toISOString(),
      isActive: data.isActive ?? true,
    };
    this.projectTeamAssignments.push(newAssignment);
    return JSON.parse(JSON.stringify(newAssignment));
  }

  async updateProjectTeamAssignment(id: number, data: Partial<IProjectTeamAssignment>): Promise<IProjectTeamAssignment> {
    await delay();
    const idx = this.projectTeamAssignments.findIndex(a => a.id === id);
    if (idx === -1) throw new Error(`Project team assignment ${id} not found`);
    this.projectTeamAssignments[idx] = { ...this.projectTeamAssignments[idx], ...data, id };
    return JSON.parse(JSON.stringify(this.projectTeamAssignments[idx]));
  }

  async removeProjectTeamAssignment(id: number): Promise<void> {
    await delay();
    const idx = this.projectTeamAssignments.findIndex(a => a.id === id);
    if (idx === -1) throw new Error(`Project team assignment ${id} not found`);
    this.projectTeamAssignments[idx].isActive = false;
  }

  async getAllProjectTeamAssignments(): Promise<IProjectTeamAssignment[]> {
    await delay();
    return JSON.parse(JSON.stringify(
      this.projectTeamAssignments.filter((a: IProjectTeamAssignment) => a.isActive)
    ));
  }

  async inviteToProjectSiteGroup(projectCode: string, userEmail: string, role: string): Promise<void> {
    console.log(`[Mock] Would invite ${userEmail} to SP group for project ${projectCode} with role ${role}`);
  }

  // ========== Permission Resolution ==========

  async resolveUserPermissions(userEmail: string, projectCode: string | null): Promise<IResolvedPermissions> {
    await delay();
    const email = userEmail.toLowerCase();

    // Dev super-admin: return union of ALL permissions (bypasses template chain)
    if (this._isDevSuperAdmin) {
      const allPerms = new Set<string>();
      for (const perms of Object.values(ROLE_PERMISSIONS)) {
        for (const p of perms) allPerms.add(p);
      }
      return {
        userId: email,
        projectCode,
        templateId: 0,
        templateName: 'Dev Super-Admin',
        source: 'SecurityGroupDefault',
        toolLevels: {},
        granularFlags: {},
        permissions: allPerms,
        globalAccess: true,
      };
    }

    // Step 1: Find the user's default template via security group mapping
    // In mock mode, map the current role to a security group by convention
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

    const roleName = this._currentRole;
    const groupName = roleToGroupMap[roleName] || 'HBC - Read Only';
    const groupMapping = this.securityGroupMappings.find(m => m.securityGroupName === groupName && m.isActive);
    const defaultTemplateId = groupMapping?.defaultTemplateId || 8; // fallback to Read-Only
    let templateId = defaultTemplateId;
    let source: 'SecurityGroupDefault' | 'ProjectOverride' | 'DirectAssignment' = 'SecurityGroupDefault';

    // Step 2: Check for project-level template override
    if (projectCode) {
      const assignment = this.projectTeamAssignments.find(
        a => a.userEmail.toLowerCase() === email && a.projectCode === projectCode && a.isActive
      );
      if (assignment?.templateOverrideId) {
        templateId = assignment.templateOverrideId;
        source = 'ProjectOverride';
      }
    }

    // Step 3: Load template
    const template = this.permissionTemplates.find(t => t.id === templateId);
    if (!template) {
      // Fallback to empty permissions
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
    const toolAccess = [...template.toolAccess];
    if (projectCode) {
      const assignment = this.projectTeamAssignments.find(
        a => a.userEmail.toLowerCase() === email && a.projectCode === projectCode && a.isActive
      );
      if (assignment?.granularFlagOverrides) {
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

    // Step 5: Flatten to permission strings
    const permissionStrings = resolveToolPermissions(toolAccess, TOOL_DEFINITIONS);
    const permissions = new Set<string>(permissionStrings);

    // Build toolLevels and granularFlags maps
    const toolLevels: Record<string, PermissionLevel> = {};
    const granularFlags: Record<string, string[]> = {};
    for (const ta of toolAccess) {
      toolLevels[ta.toolKey] = ta.level as PermissionLevel;
      if (ta.granularFlags && ta.granularFlags.length > 0) {
        granularFlags[ta.toolKey] = ta.granularFlags;
      }
    }

    console.log('[PermissionEngine] resolved', {
      email,
      projectCode,
      templateName: template.name,
      source,
      globalAccess: template.globalAccess,
      permissionCount: permissions.size,
    });

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
    await delay();
    const email = userEmail.toLowerCase();

    // First check if user has globalAccess via their template
    const resolved = await this.resolveUserPermissions(email, null);
    if (resolved.globalAccess) {
      // Return all project codes from leads that have project codes
      return [...new Set(this.leads.filter(l => l.ProjectCode).map(l => l.ProjectCode!))];
    }

    // Otherwise return only assigned project codes
    const assignments = this.projectTeamAssignments.filter(
      a => a.userEmail.toLowerCase() === email && a.isActive
    );
    return [...new Set(assignments.map(a => a.projectCode))];
  }

  // --- Environment Configuration ---
  private environmentConfig: IEnvironmentConfig = JSON.parse(JSON.stringify(mockEnvironmentConfig));

  async getEnvironmentConfig(): Promise<IEnvironmentConfig> {
    await new Promise(r => setTimeout(r, 100));
    return JSON.parse(JSON.stringify(this.environmentConfig));
  }

  async promoteTemplates(fromTier: EnvironmentTier, toTier: EnvironmentTier, promotedBy: string): Promise<void> {
    await new Promise(r => setTimeout(r, 500));
    // Increment version on all active templates
    for (const tpl of this.permissionTemplates) {
      if (tpl.isActive) {
        tpl.version = (tpl.version || 1) + 1;
        tpl.promotedFromTier = fromTier;
        tpl.lastModifiedBy = promotedBy;
        tpl.lastModifiedDate = new Date().toISOString();
      }
    }
    // Record promotion
    if (!this.environmentConfig.promotionHistory) {
      this.environmentConfig.promotionHistory = [];
    }
    this.environmentConfig.promotionHistory.push({
      fromTier,
      toTier,
      promotedBy,
      promotedDate: new Date().toISOString(),
      templateCount: this.permissionTemplates.filter(t => t.isActive).length,
    });
  }

  // --- Sector Definitions ---
  private sectorDefinitions: ISectorDefinition[] = JSON.parse(JSON.stringify(mockSectorDefinitions));

  async getSectorDefinitions(): Promise<ISectorDefinition[]> {
    await new Promise(r => setTimeout(r, 100));
    return JSON.parse(JSON.stringify(this.sectorDefinitions.sort((a, b) => a.sortOrder - b.sortOrder)));
  }

  async createSectorDefinition(data: Partial<ISectorDefinition>): Promise<ISectorDefinition> {
    await new Promise(r => setTimeout(r, 200));
    const maxId = this.sectorDefinitions.reduce((max, s) => Math.max(max, s.id), 0);
    const maxSort = this.sectorDefinitions.reduce((max, s) => Math.max(max, s.sortOrder), 0);
    const newSector: ISectorDefinition = {
      id: maxId + 1,
      code: data.code || data.label?.toUpperCase().replace(/[^A-Z0-9]/g, '_') || 'NEW',
      label: data.label || 'New Sector',
      isActive: data.isActive ?? true,
      parentDivision: data.parentDivision,
      sortOrder: data.sortOrder ?? maxSort + 1,
    };
    this.sectorDefinitions.push(newSector);
    return JSON.parse(JSON.stringify(newSector));
  }

  async updateSectorDefinition(id: number, data: Partial<ISectorDefinition>): Promise<ISectorDefinition> {
    await new Promise(r => setTimeout(r, 200));
    const idx = this.sectorDefinitions.findIndex(s => s.id === id);
    if (idx === -1) throw new Error(`Sector definition ${id} not found`);
    this.sectorDefinitions[idx] = { ...this.sectorDefinitions[idx], ...data };
    return JSON.parse(JSON.stringify(this.sectorDefinitions[idx]));
  }

  // --- BD Leads Folder Operations ---
  private bdLeadFolders: Set<string> = new Set();

  async createBdLeadFolder(leadTitle: string, originatorName: string): Promise<void> {
    await delay();
    const parentPath = `BD Leads/${new Date().getFullYear()}`;
    const leadFolderPath = `${parentPath}/${leadTitle} - ${originatorName}`;

    // Create parent year folder
    this.bdLeadFolders.add(parentPath);
    // Create lead folder
    this.bdLeadFolders.add(leadFolderPath);
    // Create subfolders
    const subfolders = [
      'Client Information', 'Correspondence', 'Proposal Documents',
      'Site and Project Plans', 'Financial Estimates', 'Evaluations and Scorecards',
      'Contracts and Legal', 'Media and Visuals', 'Archives',
    ];
    for (const sub of subfolders) {
      this.bdLeadFolders.add(`${leadFolderPath}/${sub}`);
    }
  }

  async checkFolderExists(path: string): Promise<boolean> {
    await delay();
    return this.bdLeadFolders.has(path);
  }

  async createFolder(path: string): Promise<void> {
    await delay();
    this.bdLeadFolders.add(path);
  }

  async renameFolder(oldPath: string, newPath: string): Promise<void> {
    await delay();
    // Remove old path and all children, add new path and all children
    const toRemove: string[] = [];
    const toAdd: string[] = [];
    for (const existing of this.bdLeadFolders) {
      if (existing === oldPath || existing.startsWith(oldPath + '/')) {
        toRemove.push(existing);
        toAdd.push(newPath + existing.substring(oldPath.length));
      }
    }
    for (const r of toRemove) this.bdLeadFolders.delete(r);
    for (const a of toAdd) this.bdLeadFolders.add(a);
  }

  // --- Assignment Mappings ---
  private assignmentMappings: IAssignmentMapping[] = JSON.parse(JSON.stringify(mockAssignmentMappings));

  async getAssignmentMappings(): Promise<IAssignmentMapping[]> {
    await delay();
    return JSON.parse(JSON.stringify(this.assignmentMappings));
  }

  async createAssignmentMapping(data: Partial<IAssignmentMapping>): Promise<IAssignmentMapping> {
    await delay();
    const maxId = this.assignmentMappings.reduce((max, m) => Math.max(max, m.id), 0);
    const newMapping: IAssignmentMapping = {
      id: maxId + 1,
      region: data.region || 'All Regions',
      sector: data.sector || 'All Sectors',
      assignmentType: data.assignmentType || 'Director',
      assignee: data.assignee || { userId: '', displayName: '', email: '' },
    };
    this.assignmentMappings.push(newMapping);
    return JSON.parse(JSON.stringify(newMapping));
  }

  async updateAssignmentMapping(id: number, data: Partial<IAssignmentMapping>): Promise<IAssignmentMapping> {
    await delay();
    const idx = this.assignmentMappings.findIndex(m => m.id === id);
    if (idx === -1) throw new Error(`Assignment mapping ${id} not found`);
    this.assignmentMappings[idx] = { ...this.assignmentMappings[idx], ...data };
    return JSON.parse(JSON.stringify(this.assignmentMappings[idx]));
  }

  async deleteAssignmentMapping(id: number): Promise<void> {
    await delay();
    const idx = this.assignmentMappings.findIndex(m => m.id === id);
    if (idx === -1) throw new Error(`Assignment mapping ${id} not found`);
    this.assignmentMappings.splice(idx, 1);
  }

  // --- Scorecard Reject / Archive (Phase 22) ---

  async rejectScorecard(scorecardId: number, reason: string): Promise<IGoNoGoScorecard> {
    await delay();
    const { scorecard, index } = this.findScorecardOrThrow(scorecardId);
    scorecard.scorecardStatus = ScorecardStatus.Rejected;
    scorecard.isLocked = true;
    scorecard.finalDecision = GoNoGoDecision.NoGo;
    scorecard.finalDecisionDate = new Date().toISOString().split('T')[0];

    // Complete active cycle
    const activeCycle = scorecard.approvalCycles?.find(c => c.status === 'Active');
    if (activeCycle) {
      activeCycle.status = 'Completed';
      activeCycle.completedDate = new Date().toISOString().split('T')[0];
      const pendingStep = activeCycle.steps?.find(s => s.status === 'Pending');
      if (pendingStep) {
        pendingStep.status = 'Returned';
        pendingStep.comment = `Rejected: ${reason}`;
        pendingStep.actionDate = new Date().toISOString().split('T')[0];
      }
    }

    this.createVersionSnapshot(scorecard, `Rejected: ${reason}`, scorecard.finalDecisionBy || 'system');
    this.scorecards[index] = scorecard;
    return { ...scorecard };
  }

  public setProjectSiteUrl(_siteUrl: string | null): void {
    // No-op: mock data uses in-memory arrays filtered by projectCode
  }

  async archiveScorecard(scorecardId: number, archivedBy: string): Promise<IGoNoGoScorecard> {
    await delay();
    const { scorecard, index } = this.findScorecardOrThrow(scorecardId);
    scorecard.isArchived = true;
    scorecard.archivedDate = new Date().toISOString().split('T')[0];
    scorecard.archivedBy = archivedBy;

    // Rename folder if it exists
    const lead = this.leads.find(l => l.id === scorecard.LeadID);
    if (lead) {
      const yearStr = new Date().getFullYear().toString();
      const oldPath = `BD Leads/${yearStr}/${lead.Title}`;
      if (this.bdLeadFolders.has(oldPath)) {
        await this.renameFolder(oldPath, `${oldPath}-ARCHIVED`);
      }
    }

    this.scorecards[index] = scorecard;
    return { ...scorecard };
  }

  // ── Performance Monitoring ──────────────────────────────────────────────

  async logPerformanceEntry(entry: Partial<IPerformanceLog>): Promise<IPerformanceLog> {
    await delay();
    const log: IPerformanceLog = {
      id: this.nextId++,
      SessionId: entry.SessionId || 'unknown',
      Timestamp: entry.Timestamp || new Date().toISOString(),
      UserEmail: entry.UserEmail || 'unknown',
      SiteUrl: entry.SiteUrl || '',
      ProjectCode: entry.ProjectCode,
      IsProjectSite: entry.IsProjectSite ?? false,
      WebPartLoadMs: entry.WebPartLoadMs ?? 0,
      AppInitMs: entry.AppInitMs ?? 0,
      DataFetchMs: entry.DataFetchMs,
      TotalLoadMs: entry.TotalLoadMs ?? 0,
      Marks: entry.Marks || [],
      UserAgent: entry.UserAgent || 'unknown',
      SpfxVersion: entry.SpfxVersion || '1.0.0',
      Notes: entry.Notes,
    };
    this.performanceLogs.push(log);
    return JSON.parse(JSON.stringify(log));
  }

  async getPerformanceLogs(options?: IPerformanceQueryOptions): Promise<IPerformanceLog[]> {
    await delay();
    let logs = [...this.performanceLogs];

    if (options?.startDate) {
      logs = logs.filter(l => l.Timestamp >= options.startDate!);
    }
    if (options?.endDate) {
      logs = logs.filter(l => l.Timestamp <= options.endDate!);
    }
    if (options?.siteUrl) {
      logs = logs.filter(l => l.SiteUrl === options.siteUrl);
    }
    if (options?.projectCode) {
      logs = logs.filter(l => l.ProjectCode === options.projectCode);
    }

    // Sort newest first
    logs.sort((a, b) => b.Timestamp.localeCompare(a.Timestamp));

    if (options?.limit && options.limit > 0) {
      logs = logs.slice(0, options.limit);
    }

    return JSON.parse(JSON.stringify(logs));
  }

  async getPerformanceSummary(options?: IPerformanceQueryOptions): Promise<IPerformanceSummary> {
    const logs = await this.getPerformanceLogs(options);

    if (logs.length === 0) {
      return {
        avgTotalLoadMs: 0,
        avgWebPartLoadMs: 0,
        avgAppInitMs: 0,
        p95TotalLoadMs: 0,
        totalSessions: 0,
        slowSessionCount: 0,
        byDay: [],
      };
    }

    const totalLoads = logs.map(l => l.TotalLoadMs);
    const sorted = [...totalLoads].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);

    const avgTotal = Math.round(totalLoads.reduce((a, b) => a + b, 0) / logs.length);
    const avgWebPart = Math.round(logs.reduce((a, l) => a + l.WebPartLoadMs, 0) / logs.length);
    const avgAppInit = Math.round(logs.reduce((a, l) => a + l.AppInitMs, 0) / logs.length);

    // Group by day
    const dayMap = new Map<string, { total: number; count: number }>();
    for (const log of logs) {
      const day = log.Timestamp.split('T')[0];
      const existing = dayMap.get(day) || { total: 0, count: 0 };
      existing.total += log.TotalLoadMs;
      existing.count += 1;
      dayMap.set(day, existing);
    }

    const byDay = Array.from(dayMap.entries())
      .map(([date, { total, count }]) => ({
        date,
        avgMs: Math.round(total / count),
        count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      avgTotalLoadMs: avgTotal,
      avgWebPartLoadMs: avgWebPart,
      avgAppInitMs: avgAppInit,
      p95TotalLoadMs: sorted[p95Index] ?? sorted[sorted.length - 1],
      totalSessions: logs.length,
      slowSessionCount: logs.filter(l => l.TotalLoadMs > 5000).length,
      byDay,
    };
  }

  // ── Help & Support ──────────────────────────────────────────────────────

  async getHelpGuides(moduleKey?: string): Promise<IHelpGuide[]> {
    await delay();
    let guides = this.helpGuides.filter(g => g.isActive);
    if (moduleKey) {
      guides = guides.filter(g => g.moduleKey === moduleKey);
    }
    guides.sort((a, b) => a.sortOrder - b.sortOrder);
    return JSON.parse(JSON.stringify(guides));
  }

  async getHelpGuideById(id: number): Promise<IHelpGuide | null> {
    await delay();
    const guide = this.helpGuides.find(g => g.id === id);
    return guide ? JSON.parse(JSON.stringify(guide)) : null;
  }

  private _supportConfig: ISupportConfig = {
    supportEmail: 'support@hedrickbrothers.com',
    supportPhone: '(561) 844-2922',
    knowledgeBaseUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/HBCentral/SitePages/Help.aspx',
    feedbackFormUrl: 'https://forms.office.com/r/HBCFeedback',
    responseTimeHours: 24,
  };

  async getSupportConfig(): Promise<ISupportConfig> {
    await delay();
    return { ...this._supportConfig };
  }

  async updateHelpGuide(id: number, data: Partial<IHelpGuide>): Promise<IHelpGuide> {
    await delay();
    const idx = this.helpGuides.findIndex(g => g.id === id);
    if (idx === -1) throw new Error(`Help guide not found: ${id}`);
    this.helpGuides[idx] = { ...this.helpGuides[idx], ...data, lastModifiedDate: new Date().toISOString() };
    return JSON.parse(JSON.stringify(this.helpGuides[idx]));
  }

  async sendSupportEmail(to: string, subject: string, htmlBody: string, fromUserEmail: string): Promise<void> {
    await delay();
    console.log('[MockDataService] Support email sent:', { to, subject, from: fromUserEmail, bodyLength: htmlBody.length });
  }

  async updateSupportConfig(config: Partial<ISupportConfig>): Promise<ISupportConfig> {
    await delay();
    this._supportConfig = { ...this._supportConfig, ...config };
    return { ...this._supportConfig };
  }

  // ---------------------------------------------------------------------------
  // Project Data Mart
  // ---------------------------------------------------------------------------

  async syncToDataMart(projectCode: string): Promise<IDataMartSyncResult> {
    await delay();
    const now = new Date().toISOString();

    // Find the active project (source of financial data)
    const activeProject = this.activeProjects.find(p => p.projectCode === projectCode);
    if (!activeProject) {
      return { projectCode, success: false, syncedAt: now, error: `Project ${projectCode} not found in portfolio` };
    }

    // Aggregate buyout data
    const buyouts = this.buyoutEntries.filter(b => b.projectCode === projectCode);
    const executedBuyouts = buyouts.filter(b => b.status === 'Executed');
    const buyoutCommittedTotal = executedBuyouts.reduce((sum, b) => sum + (b.contractValue || 0), 0);
    const qScores = buyouts.filter(b => b.qScore != null).map(b => b.qScore!);
    const averageQScore = qScores.length > 0 ? qScores.reduce((s, v) => s + v, 0) / qScores.length : 0;
    const openWaiverCount = buyouts.filter(b => b.waiverRequired && b.commitmentStatus !== 'Committed').length;
    const pendingCommitments = buyouts.filter(b => b.commitmentStatus !== 'Committed').length;

    // Aggregate quality/safety concerns
    const qualityConcerns = this.qualityConcerns.filter(c => c.projectCode === projectCode);
    const openQuality = qualityConcerns.filter(c => c.status === 'Open' || c.status === 'Monitoring').length;
    const safetyConcerns = this.safetyConcerns.filter(c => c.projectCode === projectCode);
    const openSafety = safetyConcerns.filter(c => c.status === 'Open' || c.status === 'Monitoring').length;

    // Schedule data
    const schedule = this.scheduleRecords.find(s => s.projectCode === projectCode);
    const activeCriticalPaths = this.criticalPathItems.filter(
      c => c.projectCode === projectCode && c.status === 'Active'
    ).length;
    const completionDate = schedule?.substantialCompletionDate || activeProject.schedule.substantialCompletionDate;
    const daysVariance = completionDate
      ? Math.round((new Date(completionDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0;

    // Monthly review status
    const reviews = this.monthlyReviews.filter(r => r.projectCode === projectCode);
    const latestReview = reviews.sort((a, b) => (b.meetingDate || '').localeCompare(a.meetingDate || ''))[0];

    // Turnover status
    const turnover = this.turnoverAgendas.find(t => t.projectCode === projectCode);

    // PMP status
    const pmp = this.pmps.find(p => p.projectCode === projectCode);

    // Compute financials
    const originalContract = activeProject.financials.originalContract || 0;
    const changeOrders = activeProject.financials.changeOrders || 0;
    const currentContractValue = originalContract + changeOrders;
    const billingsToDate = activeProject.financials.billingsToDate || 0;
    const unbilledAmount = currentContractValue - billingsToDate;
    const projectedFee = activeProject.financials.projectedFee || 0;
    const projectedFeePct = activeProject.financials.projectedFeePct || 0;

    // Compute alerts
    const unbilledPct = currentContractValue > 0 ? (unbilledAmount / currentContractValue) * 100 : 0;
    const hasUnbilledAlert = unbilledPct >= DEFAULT_ALERT_THRESHOLDS.unbilledWarningPct;
    const hasScheduleAlert = daysVariance < -DEFAULT_ALERT_THRESHOLDS.scheduleDelayDays;
    const hasFeeErosionAlert = projectedFeePct < DEFAULT_ALERT_THRESHOLDS.feeErosionPct;

    // Compute compliance status
    const complianceStatus: DataMartHealthStatus =
      openWaiverCount > 3 || averageQScore < 60 ? 'Red' :
      openWaiverCount > 1 || averageQScore < 75 ? 'Yellow' : 'Green';

    // Compute overall health (worst-of-dimensions)
    const dimensions: DataMartHealthStatus[] = [complianceStatus];
    if (hasUnbilledAlert) dimensions.push('Red');
    if (hasScheduleAlert) dimensions.push('Red');
    if (hasFeeErosionAlert) dimensions.push('Yellow');
    if (openQuality > 5 || openSafety > 3) dimensions.push('Red');
    else if (openQuality > 2 || openSafety > 1) dimensions.push('Yellow');

    const overallHealth: DataMartHealthStatus =
      dimensions.includes('Red') ? 'Red' :
      dimensions.includes('Yellow') ? 'Yellow' : 'Green';

    const record: IProjectDataMart = {
      id: this.nextId++,
      projectCode,
      jobNumber: activeProject.jobNumber,
      projectName: activeProject.projectName,
      status: activeProject.status,
      sector: activeProject.sector,
      region: activeProject.region || '',
      projectExecutive: activeProject.personnel.projectExecutive || '',
      projectExecutiveEmail: activeProject.personnel.projectExecutiveEmail || '',
      leadPM: activeProject.personnel.leadPM || '',
      leadPMEmail: activeProject.personnel.leadPMEmail || '',
      leadSuperintendent: activeProject.personnel.leadSuper || '',
      leadSuperintendentEmail: '',
      originalContract,
      changeOrders,
      currentContractValue,
      billingsToDate,
      unbilledAmount,
      projectedFee,
      projectedFeePct,
      buyoutCommittedTotal,
      buyoutExecutedCount: executedBuyouts.length,
      buyoutOpenCount: buyouts.length - executedBuyouts.length,
      startDate: schedule?.startDate || activeProject.schedule.startDate || null,
      substantialCompletionDate: completionDate || null,
      percentComplete: activeProject.schedule.percentComplete || 0,
      criticalPathItemCount: activeCriticalPaths,
      scheduleDaysVariance: daysVariance,
      openQualityConcerns: openQuality,
      openSafetyConcerns: openSafety,
      averageQScore: Math.round(averageQScore * 10) / 10,
      openWaiverCount,
      pendingCommitments,
      complianceStatus,
      overallHealth,
      hasUnbilledAlert,
      hasScheduleAlert,
      hasFeeErosionAlert,
      monthlyReviewStatus: latestReview?.status || '',
      lastMonthlyReviewDate: latestReview?.meetingDate || null,
      turnoverStatus: turnover?.status || '',
      pmpStatus: pmp?.status || '',
      lastSyncDate: now,
      lastSyncBy: 'MockDataService',
    };

    // Upsert
    const existingIdx = this.dataMartRecords.findIndex(r => r.projectCode === projectCode);
    if (existingIdx >= 0) {
      record.id = this.dataMartRecords[existingIdx].id;
      this.dataMartRecords[existingIdx] = record;
    } else {
      this.dataMartRecords.push(record);
    }

    return { projectCode, success: true, syncedAt: now };
  }

  async getDataMartRecords(filters?: IDataMartFilter): Promise<IProjectDataMart[]> {
    await delay();
    let results = [...this.dataMartRecords];

    if (filters?.status) results = results.filter(r => r.status === filters.status);
    if (filters?.sector) results = results.filter(r => r.sector === filters.sector);
    if (filters?.region) results = results.filter(r => r.region === filters.region);
    if (filters?.projectExecutive) results = results.filter(r => r.projectExecutive === filters.projectExecutive);
    if (filters?.overallHealth) results = results.filter(r => r.overallHealth === filters.overallHealth);
    if (filters?.hasAlerts) {
      results = results.filter(r => r.hasUnbilledAlert || r.hasScheduleAlert || r.hasFeeErosionAlert);
    }

    return results;
  }

  async getDataMartRecord(projectCode: string): Promise<IProjectDataMart | null> {
    await delay();
    return this.dataMartRecords.find(r => r.projectCode === projectCode) ?? null;
  }

  async triggerDataMartSync(): Promise<IDataMartSyncResult[]> {
    await delay();
    const results: IDataMartSyncResult[] = [];
    for (const project of this.activeProjects) {
      const result = await this.syncToDataMart(project.projectCode);
      results.push(result);
    }
    return results;
  }

  // ---------------------------------------------------------------------------
  // Schedule Module
  // ---------------------------------------------------------------------------

  public async getScheduleActivities(projectCode: string): Promise<IScheduleActivity[]> {
    await delay();
    return this.scheduleActivities
      .filter(a => a.projectCode === projectCode)
      .map(a => ({ ...a }));
  }

  public async importScheduleActivities(
    projectCode: string,
    activities: IScheduleActivity[],
    importMeta: Partial<IScheduleImport>
  ): Promise<IScheduleActivity[]> {
    await delay();
    const now = new Date().toISOString();

    // Create import record
    const importId = Math.max(0, ...this.scheduleImports.map(i => i.id)) + 1;
    const importRecord: IScheduleImport = {
      id: importId,
      projectCode,
      fileName: importMeta.fileName || 'import.csv',
      format: importMeta.format || 'P6-CSV',
      importDate: now,
      importedBy: importMeta.importedBy || 'Unknown',
      activityCount: activities.length,
      notes: importMeta.notes || '',
    };
    this.scheduleImports.push(importRecord);

    // Remove existing activities for this project (replace strategy)
    this.scheduleActivities = this.scheduleActivities.filter(a => a.projectCode !== projectCode);

    // Add new activities with proper IDs
    let nextId = Math.max(0, ...this.scheduleActivities.map(a => a.id)) + 1;
    const imported: IScheduleActivity[] = activities.map(a => ({
      ...a,
      id: nextId++,
      projectCode,
      importId,
      createdDate: now,
      modifiedDate: now,
    }));
    this.scheduleActivities.push(...imported);

    this.logAudit({
      Action: AuditAction.ScheduleActivitiesImported,
      EntityType: EntityType.ScheduleActivity,
      EntityId: String(importId),
      Details: `Imported ${activities.length} activities for ${projectCode}`,
    });

    return imported;
  }

  public async updateScheduleActivity(
    projectCode: string,
    activityId: number,
    data: Partial<IScheduleActivity>
  ): Promise<IScheduleActivity> {
    await delay();
    const idx = this.scheduleActivities.findIndex(a => a.id === activityId && a.projectCode === projectCode);
    if (idx === -1) throw new Error(`Schedule activity ${activityId} not found`);

    const updated = { ...this.scheduleActivities[idx], ...data, modifiedDate: new Date().toISOString() };
    this.scheduleActivities[idx] = updated;

    this.logAudit({
      Action: AuditAction.ScheduleActivityUpdated,
      EntityType: EntityType.ScheduleActivity,
      EntityId: String(activityId),
      Details: `Updated activity ${updated.taskCode}`,
    });

    return { ...updated };
  }

  public async deleteScheduleActivity(projectCode: string, activityId: number): Promise<void> {
    await delay();
    const idx = this.scheduleActivities.findIndex(a => a.id === activityId && a.projectCode === projectCode);
    if (idx === -1) throw new Error(`Schedule activity ${activityId} not found`);

    const activity = this.scheduleActivities[idx];
    this.scheduleActivities.splice(idx, 1);

    this.logAudit({
      Action: AuditAction.ScheduleActivityDeleted,
      EntityType: EntityType.ScheduleActivity,
      EntityId: String(activityId),
      Details: `Deleted activity ${activity.taskCode}`,
    });
  }

  public async getScheduleImports(projectCode: string): Promise<IScheduleImport[]> {
    await delay();
    return this.scheduleImports
      .filter(i => i.projectCode === projectCode)
      .map(i => ({ ...i }));
  }

  public async getScheduleMetrics(projectCode: string): Promise<IScheduleMetrics> {
    await delay();
    const activities = this.scheduleActivities.filter(a => a.projectCode === projectCode);
    return computeScheduleMetrics(activities);
  }

  // ---------------------------------------------------------------------------
  // Constraints Log
  // ---------------------------------------------------------------------------

  public async getAllConstraints(): Promise<IConstraintLog[]> {
    await delay();
    return this.constraintLogs.map(c => ({ ...c }));
  }

  public async getConstraints(projectCode: string): Promise<IConstraintLog[]> {
    await delay();
    return this.constraintLogs
      .filter(c => c.projectCode === projectCode)
      .map(c => ({ ...c }));
  }

  public async getConstraintsPage(request: ICursorPageRequest): Promise<ICursorPageResult<IConstraintLog>> {
    await delay();
    const projectCode = request.projectCode ?? String(request.filters?.projectCode ?? '');
    const rows = this.constraintLogs
      .filter(c => c.projectCode === projectCode)
      .map(c => ({ ...c }))
      .sort((a, b) => a.constraintNumber - b.constraintNumber);
    return this.paginateArray(rows, request);
  }

  public async addConstraint(projectCode: string, constraint: Partial<IConstraintLog>): Promise<IConstraintLog> {
    await delay();
    const projectConstraints = this.constraintLogs.filter(c => c.projectCode === projectCode);
    const nextNumber = projectConstraints.length > 0
      ? Math.max(...projectConstraints.map(c => c.constraintNumber)) + 1
      : 1;
    const id = Math.max(0, ...this.constraintLogs.map(c => c.id)) + 1;
    const created: IConstraintLog = {
      id,
      projectCode,
      constraintNumber: nextNumber,
      category: constraint.category || 'Other',
      description: constraint.description || '',
      status: constraint.status || 'Open',
      assignedTo: constraint.assignedTo || '',
      dateIdentified: constraint.dateIdentified || new Date().toISOString().split('T')[0],
      dueDate: constraint.dueDate || '',
      dateClosed: constraint.dateClosed,
      reference: constraint.reference,
      closureDocument: constraint.closureDocument,
      budgetImpactCost: constraint.budgetImpactCost,
      comments: constraint.comments,
    };
    this.constraintLogs.push(created);

    this.logAudit({
      Action: AuditAction.ConstraintUpdated,
      EntityType: EntityType.Constraint,
      EntityId: String(id),
      Details: `Added constraint #${nextNumber} for ${projectCode}`,
    });

    return { ...created };
  }

  public async updateConstraint(projectCode: string, constraintId: number, data: Partial<IConstraintLog>): Promise<IConstraintLog> {
    await delay();
    const idx = this.constraintLogs.findIndex(c => c.id === constraintId && c.projectCode === projectCode);
    if (idx === -1) throw new Error(`Constraint ${constraintId} not found`);

    const updated = { ...this.constraintLogs[idx], ...data };
    this.constraintLogs[idx] = updated;

    this.logAudit({
      Action: AuditAction.ConstraintUpdated,
      EntityType: EntityType.Constraint,
      EntityId: String(constraintId),
      Details: `Updated constraint #${updated.constraintNumber}`,
    });

    return { ...updated };
  }

  public async removeConstraint(projectCode: string, constraintId: number): Promise<void> {
    await delay();
    const idx = this.constraintLogs.findIndex(c => c.id === constraintId && c.projectCode === projectCode);
    if (idx === -1) throw new Error(`Constraint ${constraintId} not found`);

    const removed = this.constraintLogs[idx];
    this.constraintLogs.splice(idx, 1);

    this.logAudit({
      Action: AuditAction.ConstraintUpdated,
      EntityType: EntityType.Constraint,
      EntityId: String(constraintId),
      Details: `Removed constraint #${removed.constraintNumber}`,
    });
  }

  // ---------------------------------------------------------------------------
  // Permits Log
  // ---------------------------------------------------------------------------

  public async getPermits(projectCode: string): Promise<IPermit[]> {
    await delay();
    return this.permits
      .filter(p => p.projectCode === projectCode)
      .map(p => ({ ...p }));
  }

  public async getPermitsPage(request: ICursorPageRequest): Promise<ICursorPageResult<IPermit>> {
    await delay();
    const projectCode = request.projectCode ?? String(request.filters?.projectCode ?? '');
    const rows = this.permits
      .filter(p => p.projectCode === projectCode)
      .map(p => ({ ...p }));
    return this.paginateArray(rows, request);
  }

  public async addPermit(projectCode: string, permit: Partial<IPermit>): Promise<IPermit> {
    await delay();
    const id = Math.max(0, ...this.permits.map(p => p.id)) + 1;
    const created: IPermit = {
      id,
      projectCode,
      refNumber: permit.refNumber || String(id),
      parentRefNumber: permit.parentRefNumber,
      location: permit.location || '',
      type: permit.type || 'PRIMARY',
      permitNumber: permit.permitNumber || 'Not Issued',
      description: permit.description || '',
      responsibleContractor: permit.responsibleContractor || '',
      address: permit.address || '',
      dateRequired: permit.dateRequired,
      dateSubmitted: permit.dateSubmitted,
      dateReceived: permit.dateReceived,
      dateExpires: permit.dateExpires,
      status: permit.status || 'Pending Application',
      ahj: permit.ahj || '',
      comments: permit.comments,
    };
    this.permits.push(created);

    this.logAudit({
      Action: AuditAction.PermitUpdated,
      EntityType: EntityType.Permit,
      EntityId: String(id),
      Details: `Added permit ${created.refNumber} for ${projectCode}`,
    });

    return { ...created };
  }

  public async updatePermit(projectCode: string, permitId: number, data: Partial<IPermit>): Promise<IPermit> {
    await delay();
    const idx = this.permits.findIndex(p => p.id === permitId && p.projectCode === projectCode);
    if (idx === -1) throw new Error(`Permit ${permitId} not found`);

    const updated = { ...this.permits[idx], ...data };
    this.permits[idx] = updated;

    this.logAudit({
      Action: AuditAction.PermitUpdated,
      EntityType: EntityType.Permit,
      EntityId: String(permitId),
      Details: `Updated permit ${updated.refNumber}`,
    });

    return { ...updated };
  }

  public async removePermit(projectCode: string, permitId: number): Promise<void> {
    await delay();
    const idx = this.permits.findIndex(p => p.id === permitId && p.projectCode === projectCode);
    if (idx === -1) throw new Error(`Permit ${permitId} not found`);

    const removed = this.permits[idx];
    this.permits.splice(idx, 1);

    this.logAudit({
      Action: AuditAction.PermitUpdated,
      EntityType: EntityType.Permit,
      EntityId: String(permitId),
      Details: `Removed permit ${removed.refNumber}`,
    });
  }
}

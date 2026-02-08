import {
  IDataService,
  IListQueryOptions,
  IPagedResult,
  IActiveProjectsQueryOptions,
  IActiveProjectsFilter
} from './IDataService';

import {
  ILead,
  ILeadFormData,
  IGoNoGoScorecard,
  IEstimatingTracker,
  IRole,
  ICurrentUser,
  IFeatureFlag,
  IMeeting,
  ICalendarAvailability,
  INotification,
  IAuditEntry,
  IProvisioningLog,
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
  Stage,
  RoleName,
  AuditAction,
  EntityType,
  NotificationType,
  MeetingType,
  ProvisioningStatus,
  JobNumberRequestStatus,
  ICommitmentApproval,
  IActiveProject,
  IPortfolioSummary,
  IPersonnelWorkload,
  ProjectStatus,
  SectorType,
  DEFAULT_ALERT_THRESHOLDS
} from '../models';

import { IJobNumberRequest } from '../models/IJobNumberRequest';
import { IProjectType } from '../models/IProjectType';
import { IStandardCostCode } from '../models/IStandardCostCode';

import { ROLE_PERMISSIONS } from '../utils/permissions';

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
import { createEstimatingKickoffTemplate } from '../utils/estimatingKickoffTemplate';
import { STANDARD_BUYOUT_DIVISIONS } from '../utils/buyoutTemplate';
import { IEstimatingKickoff, IEstimatingKickoffItem } from '../models/IEstimatingKickoff';
import { IBuyoutEntry, EVerifyStatus } from '../models/IBuyoutEntry';
import { IComplianceEntry, IComplianceSummary, IComplianceLogFilter } from '../models/IComplianceSummary';

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
  private activeProjects: IActiveProject[];
  private nextId: number;

  // Dev-only: overridable role for the RoleSwitcher toolbar
  private _currentRole: RoleName = RoleName.OperationsTeam;

  /** Set the mock user role (called by the dev RoleSwitcher). */
  public setCurrentUserRole(role: RoleName): void {
    this._currentRole = role;
  }

  constructor() {
    this.leads = JSON.parse(JSON.stringify(mockLeads)) as ILead[];
    this.scorecards = JSON.parse(JSON.stringify(mockScorecards)) as IGoNoGoScorecard[];
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
    this.activeProjects = this.generateMockActiveProjects();
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
  // Go/No-Go Scorecards
  // ---------------------------------------------------------------------------

  public async getScorecardByLeadId(leadId: number): Promise<IGoNoGoScorecard | null> {
    await delay();
    return this.scorecards.find(s => s.LeadID === leadId) ?? null;
  }

  public async getScorecards(): Promise<IGoNoGoScorecard[]> {
    await delay();
    return [...this.scorecards];
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
      ScoredBy_Cmte: data.ScoredBy_Cmte
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

    this.scorecards[index] = { ...this.scorecards[index], ...data };
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
        case GoNoGoDecision.Wait:
          lead.Stage = Stage.GoNoGoWait;
          break;
      }
    }
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

    const roleName = this._currentRole;
    const perms = ROLE_PERMISSIONS[roleName] ?? [];

    return {
      id: 5,
      displayName: 'Dev User',
      email: 'devuser@hedrickbrothers.com',
      loginName: 'i:0#.f|membership|devuser@hedrickbrothers.com',
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

  // ---------------------------------------------------------------------------
  // Provisioning
  // ---------------------------------------------------------------------------

  public async triggerProvisioning(
    leadId: number,
    projectCode: string,
    projectName: string,
    requestedBy: string
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
    return this.closeoutItems.filter(c => c.projectCode === projectCode);
  }

  public async updateCloseoutItem(id: number, data: Partial<ICloseoutItem>): Promise<ICloseoutItem> {
    await delay();
    const index = this.closeoutItems.findIndex(c => c.id === id);
    if (index === -1) throw new Error(`Closeout item with id ${id} not found`);
    this.closeoutItems[index] = { ...this.closeoutItems[index], ...data };
    return { ...this.closeoutItems[index] };
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
      this.leads[leadIndex].ProjectAddress = request.ProjectAddress;
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
}

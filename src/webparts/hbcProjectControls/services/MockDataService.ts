import {
  IDataService,
  IListQueryOptions,
  IPagedResult
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
  GoNoGoDecision,
  Stage,
  RoleName,
  AuditAction,
  EntityType,
  NotificationType,
  MeetingType,
  ProvisioningStatus,
  JobNumberRequestStatus
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
  private qualityConcerns: IQualityConcern[];
  private safetyConcerns: ISafetyConcern[];
  private scheduleRecords: IProjectScheduleCriticalPath[];
  private superintendentPlans: ISuperintendentPlan[];
  private lessonsLearned: ILessonLearned[];
  private pmps: IProjectManagementPlan[];
  private divisionApprovers: IDivisionApprover[];
  private monthlyReviews: IMonthlyProjectReview[];
  private boilerplate: IPMPBoilerplateSection[];
  private jobNumberRequests: IJobNumberRequest[];
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
    this.lossAutopsies = [];
    this.checklistItems = JSON.parse(JSON.stringify(mockStartupChecklist)) as IStartupChecklistItem[];
    const matrixData = JSON.parse(JSON.stringify(mockInternalMatrix)) as { tasks: IInternalMatrixTask[]; recurringItems: unknown[]; teamAssignments: ITeamRoleAssignment[] };
    this.internalMatrixTasks = matrixData.tasks;
    this.teamRoleAssignments = matrixData.teamAssignments;
    this.ownerContractArticles = JSON.parse(JSON.stringify(mockOwnerContractMatrix)) as IOwnerContractArticle[];
    this.subContractClauses = JSON.parse(JSON.stringify(mockSubContractMatrix)) as ISubContractClause[];
    this.marketingRecords = JSON.parse(JSON.stringify(mockMarketingRecords)) as IMarketingProjectRecord[];
    this.riskCostRecords = JSON.parse(JSON.stringify(mockRiskCost)) as IRiskCostManagement[];
    this.qualityConcerns = JSON.parse(JSON.stringify(mockQualityConcerns)) as IQualityConcern[];
    this.safetyConcerns = JSON.parse(JSON.stringify(mockSafetyConcerns)) as ISafetyConcern[];
    this.scheduleRecords = JSON.parse(JSON.stringify(mockSchedules)) as IProjectScheduleCriticalPath[];
    this.superintendentPlans = JSON.parse(JSON.stringify(mockSuperPlan)) as ISuperintendentPlan[];
    this.lessonsLearned = JSON.parse(JSON.stringify(mockLessonsLearned)) as ILessonLearned[];
    this.pmps = JSON.parse(JSON.stringify(mockPMPs)) as IProjectManagementPlan[];
    this.divisionApprovers = JSON.parse(JSON.stringify(mockDivisionApprovers)) as IDivisionApprover[];
    this.monthlyReviews = JSON.parse(JSON.stringify(mockMonthlyReviews)) as IMonthlyProjectReview[];
    this.boilerplate = JSON.parse(JSON.stringify(mockBoilerplate)) as IPMPBoilerplateSection[];
    this.jobNumberRequests = JSON.parse(JSON.stringify(mockJobNumberRequests)) as IJobNumberRequest[];
    this.nextId = 1000;
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

  public async getAuditLog(entityType?: string, entityId?: string): Promise<IAuditEntry[]> {
    await delay();

    let results = [...this.auditLog];

    if (entityType) {
      results = results.filter(e => e.EntityType === entityType);
    }
    if (entityId) {
      results = results.filter(e => e.EntityId === entityId);
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
    };
    this.lossAutopsies.push(newItem);
    return { ...newItem };
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

  public async getRiskCostManagement(projectCode: string): Promise<IRiskCostManagement | null> {
    await delay();
    return this.riskCostRecords.find(r => r.projectCode === projectCode) ?? null;
  }

  public async updateRiskCostManagement(projectCode: string, data: Partial<IRiskCostManagement>): Promise<IRiskCostManagement> {
    await delay();
    const index = this.riskCostRecords.findIndex(r => r.projectCode === projectCode);
    if (index === -1) throw new Error(`Risk/Cost record for ${projectCode} not found`);
    this.riskCostRecords[index] = { ...this.riskCostRecords[index], ...data, lastUpdatedAt: new Date().toISOString() };
    return { ...this.riskCostRecords[index] };
  }

  public async addRiskCostItem(projectCode: string, item: Partial<IRiskCostItem>): Promise<IRiskCostItem> {
    await delay();
    const record = this.riskCostRecords.find(r => r.projectCode === projectCode);
    if (!record) throw new Error(`Risk/Cost record for ${projectCode} not found`);
    const newItem: IRiskCostItem = {
      id: this.getNextId(),
      category: item.category ?? 'Risk',
      letter: item.letter ?? 'A',
      description: item.description ?? '',
      estimatedValue: item.estimatedValue ?? 0,
      status: item.status ?? 'Open',
      notes: item.notes ?? '',
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0],
    };
    if (newItem.category === 'Buyout') record.buyoutOpportunities.push(newItem);
    else if (newItem.category === 'Risk') record.potentialRisks.push(newItem);
    else record.potentialSavings.push(newItem);
    record.lastUpdatedAt = new Date().toISOString();
    return { ...newItem };
  }

  public async updateRiskCostItem(projectCode: string, itemId: number, data: Partial<IRiskCostItem>): Promise<IRiskCostItem> {
    await delay();
    const record = this.riskCostRecords.find(r => r.projectCode === projectCode);
    if (!record) throw new Error(`Risk/Cost record for ${projectCode} not found`);
    const allItems = [...record.buyoutOpportunities, ...record.potentialRisks, ...record.potentialSavings];
    const item = allItems.find(i => i.id === itemId);
    if (!item) throw new Error(`Risk/Cost item ${itemId} not found`);
    Object.assign(item, data, { updatedDate: new Date().toISOString().split('T')[0] });
    record.lastUpdatedAt = new Date().toISOString();
    return { ...item };
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

  public async getProjectSchedule(projectCode: string): Promise<IProjectScheduleCriticalPath | null> {
    await delay();
    return this.scheduleRecords.find(s => s.projectCode === projectCode) ?? null;
  }

  public async updateProjectSchedule(projectCode: string, data: Partial<IProjectScheduleCriticalPath>): Promise<IProjectScheduleCriticalPath> {
    await delay();
    const index = this.scheduleRecords.findIndex(s => s.projectCode === projectCode);
    if (index === -1) throw new Error(`Schedule for ${projectCode} not found`);
    this.scheduleRecords[index] = { ...this.scheduleRecords[index], ...data, lastUpdatedAt: new Date().toISOString() };
    return { ...this.scheduleRecords[index] };
  }

  public async addCriticalPathItem(projectCode: string, item: Partial<ICriticalPathItem>): Promise<ICriticalPathItem> {
    await delay();
    const record = this.scheduleRecords.find(s => s.projectCode === projectCode);
    if (!record) throw new Error(`Schedule for ${projectCode} not found`);
    const newItem: ICriticalPathItem = {
      id: this.getNextId(),
      letter: item.letter ?? 'A',
      description: item.description ?? '',
      impactDescription: item.impactDescription ?? '',
      status: item.status ?? 'Active',
      mitigationPlan: item.mitigationPlan ?? '',
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0],
    };
    record.criticalPathConcerns.push(newItem);
    record.lastUpdatedAt = new Date().toISOString();
    return { ...newItem };
  }

  // ---------------------------------------------------------------------------
  // Superintendent Plan
  // ---------------------------------------------------------------------------

  public async getSuperintendentPlan(projectCode: string): Promise<ISuperintendentPlan | null> {
    await delay();
    return this.superintendentPlans.find(p => p.projectCode === projectCode) ?? null;
  }

  public async updateSuperintendentPlanSection(projectCode: string, sectionId: number, data: Partial<ISuperintendentPlanSection>): Promise<ISuperintendentPlanSection> {
    await delay();
    const plan = this.superintendentPlans.find(p => p.projectCode === projectCode);
    if (!plan) throw new Error(`Superintendent plan for ${projectCode} not found`);
    const section = plan.sections.find(s => s.id === sectionId);
    if (!section) throw new Error(`Section ${sectionId} not found`);
    Object.assign(section, data);
    plan.lastUpdatedAt = new Date().toISOString();
    return { ...section };
  }

  public async createSuperintendentPlan(projectCode: string, data: Partial<ISuperintendentPlan>): Promise<ISuperintendentPlan> {
    await delay();
    const newPlan: ISuperintendentPlan = {
      id: this.getNextId(),
      projectCode,
      superintendentName: data.superintendentName ?? '',
      sections: data.sections ?? [],
      createdBy: 'kfoster@hedrickbrothers.com',
      createdAt: new Date().toISOString(),
      lastUpdatedBy: 'kfoster@hedrickbrothers.com',
      lastUpdatedAt: new Date().toISOString(),
    };
    this.superintendentPlans.push(newPlan);
    return { ...newPlan };
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

  public async getProjectManagementPlan(projectCode: string): Promise<IProjectManagementPlan | null> {
    await delay();
    return this.pmps.find(p => p.projectCode === projectCode) ?? null;
  }

  public async updateProjectManagementPlan(projectCode: string, data: Partial<IProjectManagementPlan>): Promise<IProjectManagementPlan> {
    await delay();
    const index = this.pmps.findIndex(p => p.projectCode === projectCode);
    if (index === -1) throw new Error(`PMP for ${projectCode} not found`);
    this.pmps[index] = { ...this.pmps[index], ...data, lastUpdatedAt: new Date().toISOString() };
    return { ...this.pmps[index] };
  }

  public async submitPMPForApproval(projectCode: string, submittedBy: string): Promise<IProjectManagementPlan> {
    await delay();
    const pmp = this.pmps.find(p => p.projectCode === projectCode);
    if (!pmp) throw new Error(`PMP for ${projectCode} not found`);
    const newCycle = pmp.currentCycleNumber + 1;
    const divApprover = this.divisionApprovers.find(d => d.division === pmp.division);
    const steps = [
      { id: this.getNextId(), projectCode, stepOrder: 1, approverRole: 'Project Executive', approverName: 'Kim Foster', approverEmail: 'kfoster@hedrickbrothers.com', status: 'Pending' as const, comment: '', actionDate: null, approvalCycleNumber: newCycle },
      ...(divApprover ? [{ id: this.getNextId(), projectCode, stepOrder: 2, approverRole: 'Division Head', approverName: divApprover.approverName, approverEmail: divApprover.approverEmail, status: 'Pending' as const, comment: '', actionDate: null, approvalCycleNumber: newCycle }] : []),
    ];
    const cycle = { cycleNumber: newCycle, submittedBy, submittedDate: new Date().toISOString(), status: 'InProgress' as const, steps, changesFromPrevious: [] as string[] };
    pmp.approvalCycles.push(cycle);
    pmp.currentCycleNumber = newCycle;
    pmp.status = 'PendingApproval';
    pmp.lastUpdatedAt = new Date().toISOString();
    return { ...pmp };
  }

  public async respondToPMPApproval(projectCode: string, stepId: number, approved: boolean, comment: string): Promise<IProjectManagementPlan> {
    await delay();
    const pmp = this.pmps.find(p => p.projectCode === projectCode);
    if (!pmp) throw new Error(`PMP for ${projectCode} not found`);
    const currentCycle = pmp.approvalCycles.find(c => c.cycleNumber === pmp.currentCycleNumber);
    if (!currentCycle) throw new Error('No active approval cycle');
    const step = currentCycle.steps.find(s => s.id === stepId);
    if (!step) throw new Error(`Approval step ${stepId} not found`);
    step.status = approved ? 'Approved' : 'Returned';
    step.comment = comment;
    step.actionDate = new Date().toISOString();
    if (!approved) {
      currentCycle.status = 'Returned';
      pmp.status = 'Returned';
    } else if (currentCycle.steps.every(s => s.status === 'Approved')) {
      currentCycle.status = 'Approved';
      pmp.status = 'Approved';
    }
    pmp.lastUpdatedAt = new Date().toISOString();
    return { ...pmp };
  }

  public async signPMP(projectCode: string, signatureId: number, comment: string): Promise<IProjectManagementPlan> {
    await delay();
    const pmp = this.pmps.find(p => p.projectCode === projectCode);
    if (!pmp) throw new Error(`PMP for ${projectCode} not found`);
    const allSigs = [...pmp.startupSignatures, ...pmp.completionSignatures];
    const sig = allSigs.find(s => s.id === signatureId);
    if (!sig) throw new Error(`Signature ${signatureId} not found`);
    sig.status = 'Signed';
    sig.signedDate = new Date().toISOString();
    sig.comment = comment;
    pmp.lastUpdatedAt = new Date().toISOString();
    return { ...pmp };
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

  public async getMonthlyReviews(projectCode: string): Promise<IMonthlyProjectReview[]> {
    await delay();
    return this.monthlyReviews.filter(r => r.projectCode === projectCode)
      .sort((a, b) => b.reviewMonth.localeCompare(a.reviewMonth));
  }

  public async getMonthlyReview(reviewId: number): Promise<IMonthlyProjectReview | null> {
    await delay();
    return this.monthlyReviews.find(r => r.id === reviewId) ?? null;
  }

  public async updateMonthlyReview(reviewId: number, data: Partial<IMonthlyProjectReview>): Promise<IMonthlyProjectReview> {
    await delay();
    const index = this.monthlyReviews.findIndex(r => r.id === reviewId);
    if (index === -1) throw new Error(`Monthly review ${reviewId} not found`);
    this.monthlyReviews[index] = { ...this.monthlyReviews[index], ...data, lastUpdatedAt: new Date().toISOString() };
    return { ...this.monthlyReviews[index] };
  }

  public async createMonthlyReview(data: Partial<IMonthlyProjectReview>): Promise<IMonthlyProjectReview> {
    await delay();
    const newReview: IMonthlyProjectReview = {
      id: this.getNextId(),
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
      checklistItems: data.checklistItems ?? [],
      followUps: [],
      reportDocumentUrls: [],
      createdBy: 'kfoster@hedrickbrothers.com',
      createdAt: new Date().toISOString(),
      lastUpdatedBy: 'kfoster@hedrickbrothers.com',
      lastUpdatedAt: new Date().toISOString(),
    };
    this.monthlyReviews.push(newReview);
    return { ...newReview };
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
      if ((rec as Record<string, unknown>).ProjectCode === oldCode) {
        (rec as Record<string, unknown>).ProjectCode = newCode;
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
}

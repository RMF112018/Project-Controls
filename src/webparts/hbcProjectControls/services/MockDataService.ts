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
  GoNoGoDecision,
  Stage,
  RoleName,
  AuditAction,
  EntityType,
  NotificationType,
  MeetingType,
  ProvisioningStatus
} from '../models';

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
  private nextId: number;

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

    const roleName = RoleName.BDRepresentative;
    const perms = ROLE_PERMISSIONS[roleName] ?? [];

    return {
      id: 5,
      displayName: 'Karen Foster',
      email: 'kfoster@hedrickbrothers.com',
      loginName: 'i:0#.f|membership|kfoster@hedrickbrothers.com',
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
}

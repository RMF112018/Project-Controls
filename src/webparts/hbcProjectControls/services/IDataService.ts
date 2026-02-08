import { ILead, ILeadFormData } from '../models/ILead';
import { IGoNoGoScorecard } from '../models/IGoNoGoScorecard';
import { IEstimatingTracker } from '../models/IEstimatingTracker';
import { IRole, ICurrentUser } from '../models/IRole';
import { IFeatureFlag } from '../models/IFeatureFlag';
import { IMeeting, ICalendarAvailability } from '../models/IMeeting';
import { INotification } from '../models/INotification';
import { IAuditEntry } from '../models/IAuditEntry';
import { IProvisioningLog } from '../models/IProvisioningLog';
import { IDeliverable } from '../models/IDeliverable';
import { ITeamMember } from '../models/ITeamMember';
import { IInterviewPrep } from '../models/IInterviewPrep';
import { IContractInfo } from '../models/IContractInfo';
import { ITurnoverItem } from '../models/ITurnoverItem';
import { ICloseoutItem } from '../models/ICloseoutItem';
import { ILossAutopsy } from '../models/ILossAutopsy';
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
import { IBuyoutEntry } from '../models/IBuyoutEntry';
import { ICommitmentApproval } from '../models/ICommitmentApproval';
import { GoNoGoDecision, Stage } from '../models/enums';

export interface IListQueryOptions {
  filter?: string;
  orderBy?: string;
  orderAscending?: boolean;
  top?: number;
  skip?: number;
  select?: string[];
}

export interface IPagedResult<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
}

export interface IDataService {
  // Leads
  getLeads(options?: IListQueryOptions): Promise<IPagedResult<ILead>>;
  getLeadById(id: number): Promise<ILead | null>;
  getLeadsByStage(stage: Stage): Promise<ILead[]>;
  createLead(data: ILeadFormData): Promise<ILead>;
  updateLead(id: number, data: Partial<ILead>): Promise<ILead>;
  deleteLead(id: number): Promise<void>;
  searchLeads(query: string): Promise<ILead[]>;

  // Go/No-Go Scorecards
  getScorecardByLeadId(leadId: number): Promise<IGoNoGoScorecard | null>;
  getScorecards(): Promise<IGoNoGoScorecard[]>;
  createScorecard(data: Partial<IGoNoGoScorecard>): Promise<IGoNoGoScorecard>;
  updateScorecard(id: number, data: Partial<IGoNoGoScorecard>): Promise<IGoNoGoScorecard>;
  submitGoNoGoDecision(scorecardId: number, decision: GoNoGoDecision, projectCode?: string): Promise<void>;

  // Estimating Tracker
  getEstimatingRecords(options?: IListQueryOptions): Promise<IPagedResult<IEstimatingTracker>>;
  getEstimatingRecordById(id: number): Promise<IEstimatingTracker | null>;
  getEstimatingByLeadId(leadId: number): Promise<IEstimatingTracker | null>;
  createEstimatingRecord(data: Partial<IEstimatingTracker>): Promise<IEstimatingTracker>;
  updateEstimatingRecord(id: number, data: Partial<IEstimatingTracker>): Promise<IEstimatingTracker>;
  getCurrentPursuits(): Promise<IEstimatingTracker[]>;
  getPreconEngagements(): Promise<IEstimatingTracker[]>;
  getEstimateLog(): Promise<IEstimatingTracker[]>;

  // RBAC
  getCurrentUser(): Promise<ICurrentUser>;
  getRoles(): Promise<IRole[]>;
  updateRole(id: number, data: Partial<IRole>): Promise<IRole>;

  // Feature Flags
  getFeatureFlags(): Promise<IFeatureFlag[]>;
  updateFeatureFlag(id: number, data: Partial<IFeatureFlag>): Promise<IFeatureFlag>;

  // Meetings / Calendar
  getCalendarAvailability(emails: string[], startDate: string, endDate: string): Promise<ICalendarAvailability[]>;
  createMeeting(meeting: Partial<IMeeting>): Promise<IMeeting>;
  getMeetings(projectCode?: string): Promise<IMeeting[]>;

  // Notifications
  sendNotification(notification: Partial<INotification>): Promise<INotification>;
  getNotifications(projectCode?: string): Promise<INotification[]>;

  // Audit Log
  logAudit(entry: Partial<IAuditEntry>): Promise<void>;
  getAuditLog(entityType?: string, entityId?: string): Promise<IAuditEntry[]>;

  // Provisioning
  triggerProvisioning(leadId: number, projectCode: string, projectName: string, requestedBy: string): Promise<IProvisioningLog>;
  getProvisioningStatus(projectCode: string): Promise<IProvisioningLog | null>;
  updateProvisioningLog(projectCode: string, data: Partial<IProvisioningLog>): Promise<IProvisioningLog>;
  getProvisioningLogs(): Promise<IProvisioningLog[]>;
  retryProvisioning(projectCode: string, fromStep: number): Promise<IProvisioningLog>;

  // Phase 6 — Workflow
  getTeamMembers(projectCode: string): Promise<ITeamMember[]>;
  getDeliverables(projectCode: string): Promise<IDeliverable[]>;
  createDeliverable(data: Partial<IDeliverable>): Promise<IDeliverable>;
  updateDeliverable(id: number, data: Partial<IDeliverable>): Promise<IDeliverable>;
  getInterviewPrep(leadId: number): Promise<IInterviewPrep | null>;
  saveInterviewPrep(data: Partial<IInterviewPrep>): Promise<IInterviewPrep>;
  getContractInfo(projectCode: string): Promise<IContractInfo | null>;
  saveContractInfo(data: Partial<IContractInfo>): Promise<IContractInfo>;
  getTurnoverItems(projectCode: string): Promise<ITurnoverItem[]>;
  updateTurnoverItem(id: number, data: Partial<ITurnoverItem>): Promise<ITurnoverItem>;
  getCloseoutItems(projectCode: string): Promise<ICloseoutItem[]>;
  updateCloseoutItem(id: number, data: Partial<ICloseoutItem>): Promise<ICloseoutItem>;
  getLossAutopsy(leadId: number): Promise<ILossAutopsy | null>;
  saveLossAutopsy(data: Partial<ILossAutopsy>): Promise<ILossAutopsy>;
  finalizeLossAutopsy(leadId: number, data: Partial<ILossAutopsy>): Promise<ILossAutopsy>;
  isAutopsyFinalized(leadId: number): Promise<boolean>;
  getAllLossAutopsies(): Promise<ILossAutopsy[]>;

  // Startup Checklist
  getStartupChecklist(projectCode: string): Promise<IStartupChecklistItem[]>;
  updateChecklistItem(projectCode: string, itemId: number, data: Partial<IStartupChecklistItem>): Promise<IStartupChecklistItem>;
  addChecklistItem(projectCode: string, item: Partial<IStartupChecklistItem>): Promise<IStartupChecklistItem>;
  removeChecklistItem(projectCode: string, itemId: number): Promise<void>;

  // Internal Responsibility Matrix
  getInternalMatrix(projectCode: string): Promise<IInternalMatrixTask[]>;
  updateInternalMatrixTask(projectCode: string, taskId: number, data: Partial<IInternalMatrixTask>): Promise<IInternalMatrixTask>;
  addInternalMatrixTask(projectCode: string, task: Partial<IInternalMatrixTask>): Promise<IInternalMatrixTask>;
  removeInternalMatrixTask(projectCode: string, taskId: number): Promise<void>;

  // Team Role Assignments
  getTeamRoleAssignments(projectCode: string): Promise<ITeamRoleAssignment[]>;
  updateTeamRoleAssignment(projectCode: string, role: string, person: string, email?: string): Promise<ITeamRoleAssignment>;

  // Owner Contract Matrix
  getOwnerContractMatrix(projectCode: string): Promise<IOwnerContractArticle[]>;
  updateOwnerContractArticle(projectCode: string, itemId: number, data: Partial<IOwnerContractArticle>): Promise<IOwnerContractArticle>;
  addOwnerContractArticle(projectCode: string, item: Partial<IOwnerContractArticle>): Promise<IOwnerContractArticle>;
  removeOwnerContractArticle(projectCode: string, itemId: number): Promise<void>;

  // Sub-Contract Matrix
  getSubContractMatrix(projectCode: string): Promise<ISubContractClause[]>;
  updateSubContractClause(projectCode: string, itemId: number, data: Partial<ISubContractClause>): Promise<ISubContractClause>;
  addSubContractClause(projectCode: string, item: Partial<ISubContractClause>): Promise<ISubContractClause>;
  removeSubContractClause(projectCode: string, itemId: number): Promise<void>;

  // Marketing Project Record
  getMarketingProjectRecord(projectCode: string): Promise<IMarketingProjectRecord | null>;
  createMarketingProjectRecord(data: Partial<IMarketingProjectRecord>): Promise<IMarketingProjectRecord>;
  updateMarketingProjectRecord(projectCode: string, data: Partial<IMarketingProjectRecord>): Promise<IMarketingProjectRecord>;
  getAllMarketingProjectRecords(): Promise<IMarketingProjectRecord[]>;

  // Risk & Cost Management
  getRiskCostManagement(projectCode: string): Promise<IRiskCostManagement | null>;
  updateRiskCostManagement(projectCode: string, data: Partial<IRiskCostManagement>): Promise<IRiskCostManagement>;
  addRiskCostItem(projectCode: string, item: Partial<IRiskCostItem>): Promise<IRiskCostItem>;
  updateRiskCostItem(projectCode: string, itemId: number, data: Partial<IRiskCostItem>): Promise<IRiskCostItem>;

  // Quality Concerns
  getQualityConcerns(projectCode: string): Promise<IQualityConcern[]>;
  addQualityConcern(projectCode: string, concern: Partial<IQualityConcern>): Promise<IQualityConcern>;
  updateQualityConcern(projectCode: string, concernId: number, data: Partial<IQualityConcern>): Promise<IQualityConcern>;

  // Safety Concerns
  getSafetyConcerns(projectCode: string): Promise<ISafetyConcern[]>;
  addSafetyConcern(projectCode: string, concern: Partial<ISafetyConcern>): Promise<ISafetyConcern>;
  updateSafetyConcern(projectCode: string, concernId: number, data: Partial<ISafetyConcern>): Promise<ISafetyConcern>;

  // Project Schedule & Critical Path
  getProjectSchedule(projectCode: string): Promise<IProjectScheduleCriticalPath | null>;
  updateProjectSchedule(projectCode: string, data: Partial<IProjectScheduleCriticalPath>): Promise<IProjectScheduleCriticalPath>;
  addCriticalPathItem(projectCode: string, item: Partial<ICriticalPathItem>): Promise<ICriticalPathItem>;

  // Superintendent Plan
  getSuperintendentPlan(projectCode: string): Promise<ISuperintendentPlan | null>;
  updateSuperintendentPlanSection(projectCode: string, sectionId: number, data: Partial<ISuperintendentPlanSection>): Promise<ISuperintendentPlanSection>;
  createSuperintendentPlan(projectCode: string, data: Partial<ISuperintendentPlan>): Promise<ISuperintendentPlan>;

  // Lessons Learned
  getLessonsLearned(projectCode: string): Promise<ILessonLearned[]>;
  addLessonLearned(projectCode: string, lesson: Partial<ILessonLearned>): Promise<ILessonLearned>;
  updateLessonLearned(projectCode: string, lessonId: number, data: Partial<ILessonLearned>): Promise<ILessonLearned>;

  // Project Management Plan
  getProjectManagementPlan(projectCode: string): Promise<IProjectManagementPlan | null>;
  updateProjectManagementPlan(projectCode: string, data: Partial<IProjectManagementPlan>): Promise<IProjectManagementPlan>;
  submitPMPForApproval(projectCode: string, submittedBy: string): Promise<IProjectManagementPlan>;
  respondToPMPApproval(projectCode: string, stepId: number, approved: boolean, comment: string): Promise<IProjectManagementPlan>;

  // PMP Signatures & Division Approvers
  signPMP(projectCode: string, signatureId: number, comment: string): Promise<IProjectManagementPlan>;
  getDivisionApprovers(): Promise<IDivisionApprover[]>;
  getPMPBoilerplate(): Promise<IPMPBoilerplateSection[]>;

  // Monthly Project Review
  getMonthlyReviews(projectCode: string): Promise<IMonthlyProjectReview[]>;
  getMonthlyReview(reviewId: number): Promise<IMonthlyProjectReview | null>;
  updateMonthlyReview(reviewId: number, data: Partial<IMonthlyProjectReview>): Promise<IMonthlyProjectReview>;
  createMonthlyReview(data: Partial<IMonthlyProjectReview>): Promise<IMonthlyProjectReview>;

  // Estimating Kick-Off
  getEstimatingKickoff(projectCode: string): Promise<IEstimatingKickoff | null>;
  getEstimatingKickoffByLeadId(leadId: number): Promise<IEstimatingKickoff | null>;
  createEstimatingKickoff(data: Partial<IEstimatingKickoff>): Promise<IEstimatingKickoff>;
  updateEstimatingKickoff(id: number, data: Partial<IEstimatingKickoff>): Promise<IEstimatingKickoff>;
  updateKickoffItem(kickoffId: number, itemId: number, data: Partial<IEstimatingKickoffItem>): Promise<IEstimatingKickoffItem>;
  addKickoffItem(kickoffId: number, item: Partial<IEstimatingKickoffItem>): Promise<IEstimatingKickoffItem>;
  removeKickoffItem(kickoffId: number, itemId: number): Promise<void>;

  // Job Number Requests
  getJobNumberRequests(status?: JobNumberRequestStatus): Promise<IJobNumberRequest[]>;
  getJobNumberRequestByLeadId(leadId: number): Promise<IJobNumberRequest | null>;
  createJobNumberRequest(data: Partial<IJobNumberRequest>): Promise<IJobNumberRequest>;
  finalizeJobNumber(requestId: number, jobNumber: string, assignedBy: string): Promise<IJobNumberRequest>;

  // Reference Data
  getProjectTypes(): Promise<IProjectType[]>;
  getStandardCostCodes(): Promise<IStandardCostCode[]>;

  // Re-Key Operation
  rekeyProjectCode(oldCode: string, newCode: string, leadId: number): Promise<void>;

  // Buyout Log
  getBuyoutEntries(projectCode: string): Promise<IBuyoutEntry[]>;
  initializeBuyoutLog(projectCode: string): Promise<IBuyoutEntry[]>;
  addBuyoutEntry(projectCode: string, entry: Partial<IBuyoutEntry>): Promise<IBuyoutEntry>;
  updateBuyoutEntry(projectCode: string, entryId: number, data: Partial<IBuyoutEntry>): Promise<IBuyoutEntry>;
  removeBuyoutEntry(projectCode: string, entryId: number): Promise<void>;

  // Commitment Approval
  submitCommitmentForApproval(projectCode: string, entryId: number, submittedBy: string): Promise<IBuyoutEntry>;
  respondToCommitmentApproval(projectCode: string, entryId: number, approved: boolean, comment: string, escalate?: boolean): Promise<IBuyoutEntry>;
  getCommitmentApprovalHistory(projectCode: string, entryId: number): Promise<ICommitmentApproval[]>;

  // App Context
  getAppContextConfig(siteUrl: string): Promise<{ RenderMode: string; AppTitle: string; VisibleModules: string[] } | null>;
}

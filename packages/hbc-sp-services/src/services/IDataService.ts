import { ILead, ILeadFormData } from '../models/ILead';
import { IGoNoGoScorecard, IScorecardVersion } from '../models/IGoNoGoScorecard';
import { IPersonAssignment } from '../models/IWorkflowDefinition';
import { IEstimatingTracker } from '../models/IEstimatingTracker';
import { IRole, ICurrentUser } from '../models/IRole';
import { IFeatureFlag } from '../models/IFeatureFlag';
import { IMeeting, ICalendarAvailability } from '../models/IMeeting';
import { INotification } from '../models/INotification';
import { IAuditEntry } from '../models/IAuditEntry';
import { IProvisioningLog, IFieldDefinition } from '../models/IProvisioningLog';
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
import { IContractTrackingApproval } from '../models/IContractTrackingApproval';
import { IActiveProject, IPortfolioSummary, IPersonnelWorkload, ProjectStatus, SectorType } from '../models/IActiveProject';
import { IProjectDataMart, IDataMartSyncResult, IDataMartFilter } from '../models/IProjectDataMart';
import { IComplianceEntry, IComplianceSummary, IComplianceLogFilter } from '../models/IComplianceSummary';
import { IWorkflowDefinition, IWorkflowStep, IConditionalAssignment, IWorkflowStepOverride, IResolvedWorkflowStep } from '../models/IWorkflowDefinition';
import { ITurnoverAgenda, ITurnoverPrerequisite, ITurnoverDiscussionItem, ITurnoverSubcontractor, ITurnoverExhibit, ITurnoverSignature, ITurnoverEstimateOverview, ITurnoverAttachment } from '../models/ITurnoverAgenda';
import { IActionInboxItem } from '../models/IActionInbox';
import { IPermissionTemplate, ISecurityGroupMapping, IProjectTeamAssignment, IResolvedPermissions } from '../models/IPermissionTemplate';
import { IEnvironmentConfig, EnvironmentTier } from '../models/IEnvironmentConfig';
import { ISectorDefinition } from '../models/ISectorDefinition';
import { IAssignmentMapping } from '../models/IAssignmentMapping';
import { IPerformanceLog, IPerformanceQueryOptions, IPerformanceSummary } from '../models/IPerformanceLog';
import { IHelpGuide, ISupportConfig } from '../models/IHelpGuide';
import { IScheduleActivity, IScheduleImport, IScheduleMetrics } from '../models/IScheduleActivity';
import { IConstraintLog } from '../models/IConstraintLog';
import { IPermit } from '../models/IPermit';
import { ITemplateRegistry, ITemplateSiteConfig, ITemplateManifestLog } from '../models/ITemplateManifest';
import { GoNoGoDecision, Stage, WorkflowKey } from '../models/enums';

export interface IListQueryOptions {
  filter?: string;
  orderBy?: string;
  orderAscending?: boolean;
  top?: number;
  skip?: number;
  select?: string[];
}

export interface ICursorToken {
  nextLink?: string;
  lastId?: number;
  lastModified?: string;
}

export interface ICursorPageRequest {
  pageSize: number;
  token?: ICursorToken | null;
  projectCode?: string;
  filters?: Record<string, unknown>;
}

export interface ICursorPageResult<T> {
  items: T[];
  nextToken: ICursorToken | null;
  hasMore: boolean;
  totalApprox?: number;
}

// GitOps Template Provisioning — file metadata from the live template site
export interface ITemplateFileMetadata {
  sourcePath: string;
  fileName: string;
  fileHash: string;
  fileSize: number;
  lastModified: string;
  division: string;
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

  // Scorecard workflow (Phase 16)
  submitScorecard(scorecardId: number, submittedBy: string, approverOverride?: IPersonAssignment): Promise<IGoNoGoScorecard>;
  respondToScorecardSubmission(scorecardId: number, approved: boolean, comment: string): Promise<IGoNoGoScorecard>;
  enterCommitteeScores(scorecardId: number, scores: Record<string, number>, enteredBy: string): Promise<IGoNoGoScorecard>;
  recordFinalDecision(scorecardId: number, decision: GoNoGoDecision, conditions?: string, decidedBy?: string): Promise<IGoNoGoScorecard>;
  unlockScorecard(scorecardId: number, reason: string): Promise<IGoNoGoScorecard>;
  relockScorecard(scorecardId: number, startNewCycle: boolean): Promise<IGoNoGoScorecard>;
  getScorecardVersions(scorecardId: number): Promise<IScorecardVersion[]>;

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
  getAuditLog(entityType?: string, entityId?: string, startDate?: string, endDate?: string): Promise<IAuditEntry[]>;
  getAuditLogPage(request: ICursorPageRequest): Promise<ICursorPageResult<IAuditEntry>>;
  purgeOldAuditEntries(olderThanDays: number): Promise<number>;

  // Provisioning
  triggerProvisioning(leadId: number, projectCode: string, projectName: string, requestedBy: string, metadata?: { division?: string; region?: string; clientName?: string }): Promise<IProvisioningLog>;
  getProvisioningStatus(projectCode: string): Promise<IProvisioningLog | null>;
  updateProvisioningLog(projectCode: string, data: Partial<IProvisioningLog>): Promise<IProvisioningLog>;
  getProvisioningLogs(): Promise<IProvisioningLog[]>;
  retryProvisioning(projectCode: string, fromStep: number): Promise<IProvisioningLog>;

  // Provisioning Operations (Step Implementations)
  createProjectSite(projectCode: string, projectName: string, siteAlias: string): Promise<{ siteUrl: string }>;
  provisionProjectLists(siteUrl: string, projectCode: string): Promise<void>;
  associateWithHubSite(siteUrl: string, hubSiteUrl: string): Promise<void>;
  createProjectSecurityGroups(siteUrl: string, projectCode: string, division: string): Promise<void>;
  copyTemplateFiles(siteUrl: string, projectCode: string, division: string): Promise<void>;
  copyLeadDataToProjectSite(siteUrl: string, leadId: number, projectCode: string): Promise<void>;
  updateSiteProperties(siteUrl: string, properties: Record<string, string>): Promise<void>;
  createList(siteUrl: string, listName: string, templateType: number, fields: IFieldDefinition[]): Promise<void>;

  // GitOps Template Provisioning
  getTemplateSiteConfig(): Promise<ITemplateSiteConfig | null>;
  updateTemplateSiteConfig(data: Partial<ITemplateSiteConfig>): Promise<ITemplateSiteConfig>;
  getCommittedTemplateRegistry(): Promise<ITemplateRegistry>;
  getTemplateSiteFiles(): Promise<ITemplateFileMetadata[]>;
  applyGitOpsTemplates(siteUrl: string, division: string, registry: ITemplateRegistry): Promise<{ appliedCount: number }>;
  logTemplateSyncPR(entry: Omit<ITemplateManifestLog, 'id'>): Promise<ITemplateManifestLog>;

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
  addCloseoutItem(projectCode: string, item: Partial<ICloseoutItem>): Promise<ICloseoutItem>;
  removeCloseoutItem(projectCode: string, itemId: number): Promise<void>;
  getLossAutopsy(leadId: number): Promise<ILossAutopsy | null>;
  saveLossAutopsy(data: Partial<ILossAutopsy>): Promise<ILossAutopsy>;
  finalizeLossAutopsy(leadId: number, data: Partial<ILossAutopsy>): Promise<ILossAutopsy>;
  isAutopsyFinalized(leadId: number): Promise<boolean>;
  getAllLossAutopsies(): Promise<ILossAutopsy[]>;

  // Startup Checklist
  getStartupChecklist(projectCode: string): Promise<IStartupChecklistItem[]>;
  getStartupChecklistPage(request: ICursorPageRequest): Promise<ICursorPageResult<IStartupChecklistItem>>;
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
  updateKickoffKeyPersonnel(kickoffId: number, personnel: import('../models/IEstimatingKickoff').IKeyPersonnelEntry[]): Promise<IEstimatingKickoff>;

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
  getBuyoutEntriesPage(request: ICursorPageRequest): Promise<ICursorPageResult<IBuyoutEntry>>;
  initializeBuyoutLog(projectCode: string): Promise<IBuyoutEntry[]>;
  addBuyoutEntry(projectCode: string, entry: Partial<IBuyoutEntry>): Promise<IBuyoutEntry>;
  updateBuyoutEntry(projectCode: string, entryId: number, data: Partial<IBuyoutEntry>): Promise<IBuyoutEntry>;
  removeBuyoutEntry(projectCode: string, entryId: number): Promise<void>;

  // Commitment Approval
  submitCommitmentForApproval(projectCode: string, entryId: number, submittedBy: string): Promise<IBuyoutEntry>;
  respondToCommitmentApproval(projectCode: string, entryId: number, approved: boolean, comment: string, escalate?: boolean): Promise<IBuyoutEntry>;
  getCommitmentApprovalHistory(projectCode: string, entryId: number): Promise<ICommitmentApproval[]>;

  // Contract Tracking Workflow
  submitContractTracking(projectCode: string, entryId: number, submittedBy: string): Promise<IBuyoutEntry>;
  respondToContractTracking(projectCode: string, entryId: number, approved: boolean, comment: string): Promise<IBuyoutEntry>;
  getContractTrackingHistory(projectCode: string, entryId: number): Promise<IContractTrackingApproval[]>;

  // File Upload
  uploadCommitmentDocument(projectCode: string, entryId: number, file: File): Promise<{ fileId: string; fileName: string; fileUrl: string }>;

  // Compliance Log
  getComplianceLog(filters?: IComplianceLogFilter): Promise<IComplianceEntry[]>;
  getComplianceLogPage(request: ICursorPageRequest): Promise<ICursorPageResult<IComplianceEntry>>;
  getComplianceSummary(): Promise<IComplianceSummary>;

  // App Context
  getAppContextConfig(siteUrl: string): Promise<{ RenderMode: string; AppTitle: string; VisibleModules: string[] } | null>;

  // Active Projects Portfolio
  getActiveProjects(options?: IActiveProjectsQueryOptions): Promise<IActiveProject[]>;
  getActiveProjectById(id: number): Promise<IActiveProject | null>;
  syncActiveProject(projectCode: string): Promise<IActiveProject>;
  updateActiveProject(id: number, data: Partial<IActiveProject>): Promise<IActiveProject>;
  getPortfolioSummary(filters?: IActiveProjectsFilter): Promise<IPortfolioSummary>;
  getPersonnelWorkload(role?: 'PX' | 'PM' | 'Super'): Promise<IPersonnelWorkload[]>;
  triggerPortfolioSync(): Promise<void>;

  // Data Integrity — sync denormalized fields when lead is updated
  syncDenormalizedFields(leadId: number): Promise<void>;

  // Closeout Promotion — copy lessons learned to hub and update closeout data
  promoteToHub(projectCode: string): Promise<void>;

  // Workflow Definitions
  getWorkflowDefinitions(): Promise<IWorkflowDefinition[]>;
  getWorkflowDefinition(workflowKey: WorkflowKey): Promise<IWorkflowDefinition | null>;
  updateWorkflowStep(workflowId: number, stepId: number, data: Partial<IWorkflowStep>): Promise<IWorkflowStep>;
  addConditionalAssignment(stepId: number, assignment: Partial<IConditionalAssignment>): Promise<IConditionalAssignment>;
  updateConditionalAssignment(assignmentId: number, data: Partial<IConditionalAssignment>): Promise<IConditionalAssignment>;
  removeConditionalAssignment(assignmentId: number): Promise<void>;
  getWorkflowOverrides(projectCode: string): Promise<IWorkflowStepOverride[]>;
  setWorkflowStepOverride(override: Partial<IWorkflowStepOverride>): Promise<IWorkflowStepOverride>;
  removeWorkflowStepOverride(overrideId: number): Promise<void>;
  resolveWorkflowChain(workflowKey: WorkflowKey, projectCode: string): Promise<IResolvedWorkflowStep[]>;

  // Turnover Agenda
  getTurnoverAgenda(projectCode: string): Promise<ITurnoverAgenda | null>;
  createTurnoverAgenda(projectCode: string, leadId: number): Promise<ITurnoverAgenda>;
  updateTurnoverAgenda(projectCode: string, data: Partial<ITurnoverAgenda>): Promise<ITurnoverAgenda>;

  // Turnover Prerequisites
  updateTurnoverPrerequisite(prerequisiteId: number, data: Partial<ITurnoverPrerequisite>): Promise<ITurnoverPrerequisite>;

  // Turnover Discussion Items
  updateTurnoverDiscussionItem(itemId: number, data: Partial<ITurnoverDiscussionItem>): Promise<ITurnoverDiscussionItem>;
  addTurnoverDiscussionAttachment(itemId: number, file: File): Promise<ITurnoverAttachment>;
  removeTurnoverDiscussionAttachment(attachmentId: number): Promise<void>;

  // Turnover Subcontractors
  addTurnoverSubcontractor(turnoverAgendaId: number, data: Partial<ITurnoverSubcontractor>): Promise<ITurnoverSubcontractor>;
  updateTurnoverSubcontractor(subId: number, data: Partial<ITurnoverSubcontractor>): Promise<ITurnoverSubcontractor>;
  removeTurnoverSubcontractor(subId: number): Promise<void>;

  // Turnover Exhibits
  updateTurnoverExhibit(exhibitId: number, data: Partial<ITurnoverExhibit>): Promise<ITurnoverExhibit>;
  addTurnoverExhibit(turnoverAgendaId: number, data: Partial<ITurnoverExhibit>): Promise<ITurnoverExhibit>;
  removeTurnoverExhibit(exhibitId: number): Promise<void>;
  uploadTurnoverExhibitFile(exhibitId: number, file: File): Promise<{ fileUrl: string; fileName: string }>;

  // Turnover Signatures
  signTurnoverAgenda(signatureId: number, comment?: string): Promise<ITurnoverSignature>;

  // Turnover Estimate Overview
  updateTurnoverEstimateOverview(projectCode: string, data: Partial<ITurnoverEstimateOverview>): Promise<ITurnoverEstimateOverview>;

  // Hub Site URL Configuration
  getHubSiteUrl(): Promise<string>;
  setHubSiteUrl(url: string): Promise<void>;

  // Action Inbox aggregation
  getActionItems(userEmail: string): Promise<IActionInboxItem[]>;

  // Permission Templates
  getPermissionTemplates(): Promise<IPermissionTemplate[]>;
  getPermissionTemplate(id: number): Promise<IPermissionTemplate | null>;
  createPermissionTemplate(data: Partial<IPermissionTemplate>): Promise<IPermissionTemplate>;
  updatePermissionTemplate(id: number, data: Partial<IPermissionTemplate>): Promise<IPermissionTemplate>;
  deletePermissionTemplate(id: number): Promise<void>;

  // Security Group Mappings
  getSecurityGroupMappings(): Promise<ISecurityGroupMapping[]>;
  createSecurityGroupMapping(data: Partial<ISecurityGroupMapping>): Promise<ISecurityGroupMapping>;
  updateSecurityGroupMapping(id: number, data: Partial<ISecurityGroupMapping>): Promise<ISecurityGroupMapping>;

  // Project Team Assignments
  getProjectTeamAssignments(projectCode: string): Promise<IProjectTeamAssignment[]>;
  getAllProjectTeamAssignments(): Promise<IProjectTeamAssignment[]>;
  getMyProjectAssignments(userEmail: string): Promise<IProjectTeamAssignment[]>;
  createProjectTeamAssignment(data: Partial<IProjectTeamAssignment>): Promise<IProjectTeamAssignment>;
  updateProjectTeamAssignment(id: number, data: Partial<IProjectTeamAssignment>): Promise<IProjectTeamAssignment>;
  removeProjectTeamAssignment(id: number): Promise<void>;

  // Project Site Group Invitations
  inviteToProjectSiteGroup(projectCode: string, userEmail: string, role: string): Promise<void>;

  // Permission Resolution
  resolveUserPermissions(userEmail: string, projectCode: string | null): Promise<IResolvedPermissions>;
  getAccessibleProjects(userEmail: string): Promise<string[]>;

  // Environment Configuration
  getEnvironmentConfig(): Promise<IEnvironmentConfig>;
  promoteTemplates(fromTier: EnvironmentTier, toTier: EnvironmentTier, promotedBy: string): Promise<void>;

  // Sector Definitions
  getSectorDefinitions(): Promise<ISectorDefinition[]>;
  createSectorDefinition(data: Partial<ISectorDefinition>): Promise<ISectorDefinition>;
  updateSectorDefinition(id: number, data: Partial<ISectorDefinition>): Promise<ISectorDefinition>;

  // BD Leads Document Library (folder operations)
  createBdLeadFolder(leadTitle: string, originatorName: string): Promise<void>;
  checkFolderExists(path: string): Promise<boolean>;
  createFolder(path: string): Promise<void>;
  renameFolder(oldPath: string, newPath: string): Promise<void>;

  // Assignment Mappings
  getAssignmentMappings(): Promise<IAssignmentMapping[]>;
  createAssignmentMapping(data: Partial<IAssignmentMapping>): Promise<IAssignmentMapping>;
  updateAssignmentMapping(id: number, data: Partial<IAssignmentMapping>): Promise<IAssignmentMapping>;
  deleteAssignmentMapping(id: number): Promise<void>;

  // Scorecard archive (Phase 22)
  rejectScorecard(scorecardId: number, reason: string): Promise<IGoNoGoScorecard>;
  archiveScorecard(scorecardId: number, archivedBy: string): Promise<IGoNoGoScorecard>;

  // Performance monitoring
  logPerformanceEntry(entry: Partial<IPerformanceLog>): Promise<IPerformanceLog>;
  getPerformanceLogs(options?: IPerformanceQueryOptions): Promise<IPerformanceLog[]>;
  getPerformanceSummary(options?: IPerformanceQueryOptions): Promise<IPerformanceSummary>;

  // Help & Support
  getHelpGuides(moduleKey?: string): Promise<IHelpGuide[]>;
  getHelpGuideById(id: number): Promise<IHelpGuide | null>;
  getSupportConfig(): Promise<ISupportConfig>;
  updateHelpGuide(id: number, data: Partial<IHelpGuide>): Promise<IHelpGuide>;
  sendSupportEmail(to: string, subject: string, htmlBody: string, fromUserEmail: string): Promise<void>;
  updateSupportConfig(config: Partial<ISupportConfig>): Promise<ISupportConfig>;

  // Project Data Mart
  syncToDataMart(projectCode: string): Promise<IDataMartSyncResult>;
  getDataMartRecords(filters?: IDataMartFilter): Promise<IProjectDataMart[]>;
  getDataMartRecord(projectCode: string): Promise<IProjectDataMart | null>;
  triggerDataMartSync(): Promise<IDataMartSyncResult[]>;

  // Schedule Module
  getScheduleActivities(projectCode: string): Promise<IScheduleActivity[]>;
  importScheduleActivities(projectCode: string, activities: IScheduleActivity[], importMeta: Partial<IScheduleImport>): Promise<IScheduleActivity[]>;
  updateScheduleActivity(projectCode: string, activityId: number, data: Partial<IScheduleActivity>): Promise<IScheduleActivity>;
  deleteScheduleActivity(projectCode: string, activityId: number): Promise<void>;
  getScheduleImports(projectCode: string): Promise<IScheduleImport[]>;
  getScheduleMetrics(projectCode: string): Promise<IScheduleMetrics>;

  // Constraints Log
  getAllConstraints(): Promise<IConstraintLog[]>;
  getConstraintsPage(request: ICursorPageRequest): Promise<ICursorPageResult<IConstraintLog>>;
  getConstraints(projectCode: string): Promise<IConstraintLog[]>;
  addConstraint(projectCode: string, constraint: Partial<IConstraintLog>): Promise<IConstraintLog>;
  updateConstraint(projectCode: string, constraintId: number, data: Partial<IConstraintLog>): Promise<IConstraintLog>;
  removeConstraint(projectCode: string, constraintId: number): Promise<void>;

  // Permits Log
  getPermits(projectCode: string): Promise<IPermit[]>;
  getPermitsPage(request: ICursorPageRequest): Promise<ICursorPageResult<IPermit>>;
  addPermit(projectCode: string, permit: Partial<IPermit>): Promise<IPermit>;
  updatePermit(projectCode: string, permitId: number, data: Partial<IPermit>): Promise<IPermit>;
  removePermit(projectCode: string, permitId: number): Promise<void>;

  // Project site URL targeting (Phase 26)
  setProjectSiteUrl(siteUrl: string | null): void;
}

export interface IActiveProjectsQueryOptions extends IListQueryOptions {
  status?: ProjectStatus;
  sector?: SectorType;
  projectExecutive?: string;
  projectManager?: string;
  region?: string;
  hasAlerts?: boolean;
}

export interface IActiveProjectsFilter {
  status?: ProjectStatus;
  sector?: SectorType;
  projectExecutive?: string;
  projectManager?: string;
  region?: string;
}

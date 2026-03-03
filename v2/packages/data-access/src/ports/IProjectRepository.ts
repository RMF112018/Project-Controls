import type {
  IActiveProject,
  IPortfolioSummary,
  IPersonnelWorkload,
  ProjectStatus,
  SectorType,
  IDeliverable,
  ITeamMember,
  ITurnoverItem,
  ICloseoutItem,
  IStartupChecklistItem,
  ILessonLearned,
  IMarketingProjectRecord,
  IInterviewPrep,
  ILossAutopsy,
  IJobNumberRequest,
  JobNumberRequestStatus,
  IProjectType,
  IStandardCostCode,
  IConstraintLog,
  IPermit,
} from '@hbc/models';
import type { IListQueryOptions, ICursorPageRequest, ICursorPageResult } from '@hbc/models';

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

/**
 * Project repository — portfolio, team, deliverables, closeout, constraints, permits.
 */
export interface IProjectRepository {
  // Active Projects Portfolio
  getActiveProjects(options?: IActiveProjectsQueryOptions): Promise<IActiveProject[]>;
  getActiveProjectById(id: number): Promise<IActiveProject | null>;
  syncActiveProject(projectCode: string): Promise<IActiveProject>;
  updateActiveProject(id: number, data: Partial<IActiveProject>): Promise<IActiveProject>;
  getPortfolioSummary(filters?: IActiveProjectsFilter): Promise<IPortfolioSummary>;
  getPersonnelWorkload(role?: 'PX' | 'PM' | 'Super'): Promise<IPersonnelWorkload[]>;
  triggerPortfolioSync(): Promise<void>;

  // Team
  getTeamMembers(projectCode: string): Promise<ITeamMember[]>;

  // Deliverables
  getDeliverables(projectCode: string): Promise<IDeliverable[]>;
  createDeliverable(data: Partial<IDeliverable>): Promise<IDeliverable>;
  updateDeliverable(id: number, data: Partial<IDeliverable>): Promise<IDeliverable>;

  // Turnover Items
  getTurnoverItems(projectCode: string): Promise<ITurnoverItem[]>;
  updateTurnoverItem(id: number, data: Partial<ITurnoverItem>): Promise<ITurnoverItem>;

  // Closeout
  getCloseoutItems(projectCode: string): Promise<ICloseoutItem[]>;
  updateCloseoutItem(id: number, data: Partial<ICloseoutItem>): Promise<ICloseoutItem>;
  addCloseoutItem(projectCode: string, item: Partial<ICloseoutItem>): Promise<ICloseoutItem>;
  removeCloseoutItem(projectCode: string, itemId: number): Promise<void>;

  // Startup Checklist
  getStartupChecklist(projectCode: string): Promise<IStartupChecklistItem[]>;
  getStartupChecklistPage(request: ICursorPageRequest): Promise<ICursorPageResult<IStartupChecklistItem>>;
  updateChecklistItem(projectCode: string, itemId: number, data: Partial<IStartupChecklistItem>): Promise<IStartupChecklistItem>;
  addChecklistItem(projectCode: string, item: Partial<IStartupChecklistItem>): Promise<IStartupChecklistItem>;
  removeChecklistItem(projectCode: string, itemId: number): Promise<void>;

  // Lessons Learned
  getLessonsLearned(projectCode: string): Promise<ILessonLearned[]>;
  addLessonLearned(projectCode: string, lesson: Partial<ILessonLearned>): Promise<ILessonLearned>;
  updateLessonLearned(projectCode: string, lessonId: number, data: Partial<ILessonLearned>): Promise<ILessonLearned>;

  // Marketing Project Record
  getMarketingProjectRecord(projectCode: string): Promise<IMarketingProjectRecord | null>;
  createMarketingProjectRecord(data: Partial<IMarketingProjectRecord>): Promise<IMarketingProjectRecord>;
  updateMarketingProjectRecord(projectCode: string, data: Partial<IMarketingProjectRecord>): Promise<IMarketingProjectRecord>;
  getAllMarketingProjectRecords(): Promise<IMarketingProjectRecord[]>;

  // Interview Prep
  getInterviewPrep(leadId: number): Promise<IInterviewPrep | null>;
  saveInterviewPrep(data: Partial<IInterviewPrep>): Promise<IInterviewPrep>;

  // Loss Autopsy
  getLossAutopsy(leadId: number): Promise<ILossAutopsy | null>;
  saveLossAutopsy(data: Partial<ILossAutopsy>): Promise<ILossAutopsy>;
  finalizeLossAutopsy(leadId: number, data: Partial<ILossAutopsy>): Promise<ILossAutopsy>;
  isAutopsyFinalized(leadId: number): Promise<boolean>;
  getAllLossAutopsies(): Promise<ILossAutopsy[]>;

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

  // Data Integrity
  syncDenormalizedFields(leadId: number): Promise<void>;
  promoteToHub(projectCode: string): Promise<void>;

  // Constraints
  getAllConstraints(): Promise<IConstraintLog[]>;
  getConstraintsPage(request: ICursorPageRequest): Promise<ICursorPageResult<IConstraintLog>>;
  getConstraints(projectCode: string): Promise<IConstraintLog[]>;
  addConstraint(projectCode: string, constraint: Partial<IConstraintLog>): Promise<IConstraintLog>;
  updateConstraint(projectCode: string, constraintId: number, data: Partial<IConstraintLog>): Promise<IConstraintLog>;
  removeConstraint(projectCode: string, constraintId: number): Promise<void>;

  // Permits
  getPermits(projectCode: string): Promise<IPermit[]>;
  getPermitsPage(request: ICursorPageRequest): Promise<ICursorPageResult<IPermit>>;
  addPermit(projectCode: string, permit: Partial<IPermit>): Promise<IPermit>;
  updatePermit(projectCode: string, permitId: number, data: Partial<IPermit>): Promise<IPermit>;
  removePermit(projectCode: string, permitId: number): Promise<void>;
}

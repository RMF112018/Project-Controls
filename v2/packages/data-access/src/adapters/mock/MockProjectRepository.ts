import type { IActiveProject, IPortfolioSummary, IPersonnelWorkload, IDeliverable, ITeamMember, ITurnoverItem, ICloseoutItem, IStartupChecklistItem, ILessonLearned, IMarketingProjectRecord, IInterviewPrep, ILossAutopsy, IJobNumberRequest, IProjectType, IStandardCostCode, IConstraintLog, IPermit, ICursorPageRequest, ICursorPageResult, JobNumberRequestStatus } from '@hbc/models';
import type { IProjectRepository, IActiveProjectsQueryOptions, IActiveProjectsFilter } from '../../ports/IProjectRepository';

export class MockProjectRepository implements IProjectRepository {
  async getActiveProjects(_options?: IActiveProjectsQueryOptions): Promise<IActiveProject[]> { return []; }
  async getActiveProjectById(_id: number): Promise<IActiveProject | null> { return null; }
  async syncActiveProject(_projectCode: string): Promise<IActiveProject> { throw new Error('Not implemented'); }
  async updateActiveProject(_id: number, _data: Partial<IActiveProject>): Promise<IActiveProject> { throw new Error('Not implemented'); }
  async getPortfolioSummary(_filters?: IActiveProjectsFilter): Promise<IPortfolioSummary> { return {} as IPortfolioSummary; }
  async getPersonnelWorkload(_role?: 'PX' | 'PM' | 'Super'): Promise<IPersonnelWorkload[]> { return []; }
  async triggerPortfolioSync(): Promise<void> {}
  async getTeamMembers(_projectCode: string): Promise<ITeamMember[]> { return []; }
  async getDeliverables(_projectCode: string): Promise<IDeliverable[]> { return []; }
  async createDeliverable(data: Partial<IDeliverable>): Promise<IDeliverable> { return { id: 1, ...data } as IDeliverable; }
  async updateDeliverable(_id: number, _data: Partial<IDeliverable>): Promise<IDeliverable> { throw new Error('Not implemented'); }
  async getTurnoverItems(_projectCode: string): Promise<ITurnoverItem[]> { return []; }
  async updateTurnoverItem(_id: number, _data: Partial<ITurnoverItem>): Promise<ITurnoverItem> { throw new Error('Not implemented'); }
  async getCloseoutItems(_projectCode: string): Promise<ICloseoutItem[]> { return []; }
  async updateCloseoutItem(_id: number, _data: Partial<ICloseoutItem>): Promise<ICloseoutItem> { throw new Error('Not implemented'); }
  async addCloseoutItem(_projectCode: string, _item: Partial<ICloseoutItem>): Promise<ICloseoutItem> { throw new Error('Not implemented'); }
  async removeCloseoutItem(_projectCode: string, _itemId: number): Promise<void> {}
  async getStartupChecklist(_projectCode: string): Promise<IStartupChecklistItem[]> { return []; }
  async getStartupChecklistPage(_request: ICursorPageRequest): Promise<ICursorPageResult<IStartupChecklistItem>> { return { items: [], nextToken: null, hasMore: false }; }
  async updateChecklistItem(_projectCode: string, _itemId: number, _data: Partial<IStartupChecklistItem>): Promise<IStartupChecklistItem> { throw new Error('Not implemented'); }
  async addChecklistItem(_projectCode: string, _item: Partial<IStartupChecklistItem>): Promise<IStartupChecklistItem> { throw new Error('Not implemented'); }
  async removeChecklistItem(_projectCode: string, _itemId: number): Promise<void> {}
  async getLessonsLearned(_projectCode: string): Promise<ILessonLearned[]> { return []; }
  async addLessonLearned(_projectCode: string, _lesson: Partial<ILessonLearned>): Promise<ILessonLearned> { throw new Error('Not implemented'); }
  async updateLessonLearned(_projectCode: string, _lessonId: number, _data: Partial<ILessonLearned>): Promise<ILessonLearned> { throw new Error('Not implemented'); }
  async getMarketingProjectRecord(_projectCode: string): Promise<IMarketingProjectRecord | null> { return null; }
  async createMarketingProjectRecord(_data: Partial<IMarketingProjectRecord>): Promise<IMarketingProjectRecord> { throw new Error('Not implemented'); }
  async updateMarketingProjectRecord(_projectCode: string, _data: Partial<IMarketingProjectRecord>): Promise<IMarketingProjectRecord> { throw new Error('Not implemented'); }
  async getAllMarketingProjectRecords(): Promise<IMarketingProjectRecord[]> { return []; }
  async getInterviewPrep(_leadId: number): Promise<IInterviewPrep | null> { return null; }
  async saveInterviewPrep(_data: Partial<IInterviewPrep>): Promise<IInterviewPrep> { throw new Error('Not implemented'); }
  async getLossAutopsy(_leadId: number): Promise<ILossAutopsy | null> { return null; }
  async saveLossAutopsy(_data: Partial<ILossAutopsy>): Promise<ILossAutopsy> { throw new Error('Not implemented'); }
  async finalizeLossAutopsy(_leadId: number, _data: Partial<ILossAutopsy>): Promise<ILossAutopsy> { throw new Error('Not implemented'); }
  async isAutopsyFinalized(_leadId: number): Promise<boolean> { return false; }
  async getAllLossAutopsies(): Promise<ILossAutopsy[]> { return []; }
  async getJobNumberRequests(_status?: JobNumberRequestStatus): Promise<IJobNumberRequest[]> { return []; }
  async getJobNumberRequestByLeadId(_leadId: number): Promise<IJobNumberRequest | null> { return null; }
  async createJobNumberRequest(_data: Partial<IJobNumberRequest>): Promise<IJobNumberRequest> { throw new Error('Not implemented'); }
  async finalizeJobNumber(_requestId: number, _jobNumber: string, _assignedBy: string): Promise<IJobNumberRequest> { throw new Error('Not implemented'); }
  async getProjectTypes(): Promise<IProjectType[]> { return []; }
  async getStandardCostCodes(): Promise<IStandardCostCode[]> { return []; }
  async rekeyProjectCode(_oldCode: string, _newCode: string, _leadId: number): Promise<void> {}
  async syncDenormalizedFields(_leadId: number): Promise<void> {}
  async promoteToHub(_projectCode: string): Promise<void> {}
  async getAllConstraints(): Promise<IConstraintLog[]> { return []; }
  async getConstraintsPage(_request: ICursorPageRequest): Promise<ICursorPageResult<IConstraintLog>> { return { items: [], nextToken: null, hasMore: false }; }
  async getConstraints(_projectCode: string): Promise<IConstraintLog[]> { return []; }
  async addConstraint(_projectCode: string, _constraint: Partial<IConstraintLog>): Promise<IConstraintLog> { throw new Error('Not implemented'); }
  async updateConstraint(_projectCode: string, _constraintId: number, _data: Partial<IConstraintLog>): Promise<IConstraintLog> { throw new Error('Not implemented'); }
  async removeConstraint(_projectCode: string, _constraintId: number): Promise<void> {}
  async getPermits(_projectCode: string): Promise<IPermit[]> { return []; }
  async getPermitsPage(_request: ICursorPageRequest): Promise<ICursorPageResult<IPermit>> { return { items: [], nextToken: null, hasMore: false }; }
  async addPermit(_projectCode: string, _permit: Partial<IPermit>): Promise<IPermit> { throw new Error('Not implemented'); }
  async updatePermit(_projectCode: string, _permitId: number, _data: Partial<IPermit>): Promise<IPermit> { throw new Error('Not implemented'); }
  async removePermit(_projectCode: string, _permitId: number): Promise<void> {}
}

import type { IProjectManagementPlan, IDivisionApprover, IPMPBoilerplateSection, ISuperintendentPlan, ISuperintendentPlanSection, IMonthlyProjectReview } from '@hbc/models';
import type { IPMPRepository } from '../../ports/IPMPRepository';

export class MockPMPRepository implements IPMPRepository {
  async getPlan(_projectCode: string): Promise<IProjectManagementPlan | null> { return null; }
  async updatePlan(_projectCode: string, _data: Partial<IProjectManagementPlan>): Promise<IProjectManagementPlan> { throw new Error('Not implemented'); }
  async submitForApproval(_projectCode: string, _submittedBy: string): Promise<IProjectManagementPlan> { throw new Error('Not implemented'); }
  async respondToApproval(_projectCode: string, _stepId: number, _approved: boolean, _comment: string): Promise<IProjectManagementPlan> { throw new Error('Not implemented'); }
  async sign(_projectCode: string, _signatureId: number, _comment: string): Promise<IProjectManagementPlan> { throw new Error('Not implemented'); }
  async getDivisionApprovers(): Promise<IDivisionApprover[]> { return []; }
  async getBoilerplate(): Promise<IPMPBoilerplateSection[]> { return []; }
  async getSuperintendentPlan(_projectCode: string): Promise<ISuperintendentPlan | null> { return null; }
  async updateSuperintendentPlanSection(_projectCode: string, _sectionId: number, _data: Partial<ISuperintendentPlanSection>): Promise<ISuperintendentPlanSection> { throw new Error('Not implemented'); }
  async createSuperintendentPlan(_projectCode: string, _data: Partial<ISuperintendentPlan>): Promise<ISuperintendentPlan> { throw new Error('Not implemented'); }
  async getMonthlyReviews(_projectCode: string): Promise<IMonthlyProjectReview[]> { return []; }
  async getMonthlyReview(_reviewId: number): Promise<IMonthlyProjectReview | null> { return null; }
  async updateMonthlyReview(_reviewId: number, _data: Partial<IMonthlyProjectReview>): Promise<IMonthlyProjectReview> { throw new Error('Not implemented'); }
  async createMonthlyReview(_data: Partial<IMonthlyProjectReview>): Promise<IMonthlyProjectReview> { throw new Error('Not implemented'); }
}

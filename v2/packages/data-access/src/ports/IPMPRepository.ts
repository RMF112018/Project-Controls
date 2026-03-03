import type {
  IProjectManagementPlan,
  IDivisionApprover,
  IPMPBoilerplateSection,
  ISuperintendentPlan,
  ISuperintendentPlanSection,
  IMonthlyProjectReview,
} from '@hbc/models';

/**
 * PMP, superintendent plan, and monthly review repository.
 */
export interface IPMPRepository {
  // Project Management Plan
  getPlan(projectCode: string): Promise<IProjectManagementPlan | null>;
  updatePlan(projectCode: string, data: Partial<IProjectManagementPlan>): Promise<IProjectManagementPlan>;
  submitForApproval(projectCode: string, submittedBy: string): Promise<IProjectManagementPlan>;
  respondToApproval(projectCode: string, stepId: number, approved: boolean, comment: string): Promise<IProjectManagementPlan>;
  sign(projectCode: string, signatureId: number, comment: string): Promise<IProjectManagementPlan>;
  getDivisionApprovers(): Promise<IDivisionApprover[]>;
  getBoilerplate(): Promise<IPMPBoilerplateSection[]>;

  // Superintendent Plan
  getSuperintendentPlan(projectCode: string): Promise<ISuperintendentPlan | null>;
  updateSuperintendentPlanSection(projectCode: string, sectionId: number, data: Partial<ISuperintendentPlanSection>): Promise<ISuperintendentPlanSection>;
  createSuperintendentPlan(projectCode: string, data: Partial<ISuperintendentPlan>): Promise<ISuperintendentPlan>;

  // Monthly Project Review
  getMonthlyReviews(projectCode: string): Promise<IMonthlyProjectReview[]>;
  getMonthlyReview(reviewId: number): Promise<IMonthlyProjectReview | null>;
  updateMonthlyReview(reviewId: number, data: Partial<IMonthlyProjectReview>): Promise<IMonthlyProjectReview>;
  createMonthlyReview(data: Partial<IMonthlyProjectReview>): Promise<IMonthlyProjectReview>;
}

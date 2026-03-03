import type {
  IRiskCostManagement,
  IRiskCostItem,
  IQualityConcern,
  ISafetyConcern,
} from '@hbc/models';

/**
 * Risk, quality, and safety concerns repository.
 */
export interface IRiskRepository {
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
}

import type { IRiskCostManagement, IRiskCostItem, IQualityConcern, ISafetyConcern } from '@hbc/models';
import type { IRiskRepository } from '../../ports/IRiskRepository';

export class MockRiskRepository implements IRiskRepository {
  async getRiskCostManagement(_projectCode: string): Promise<IRiskCostManagement | null> { return null; }
  async updateRiskCostManagement(_projectCode: string, _data: Partial<IRiskCostManagement>): Promise<IRiskCostManagement> { throw new Error('Not implemented'); }
  async addRiskCostItem(_projectCode: string, _item: Partial<IRiskCostItem>): Promise<IRiskCostItem> { throw new Error('Not implemented'); }
  async updateRiskCostItem(_projectCode: string, _itemId: number, _data: Partial<IRiskCostItem>): Promise<IRiskCostItem> { throw new Error('Not implemented'); }
  async getQualityConcerns(_projectCode: string): Promise<IQualityConcern[]> { return []; }
  async addQualityConcern(_projectCode: string, _concern: Partial<IQualityConcern>): Promise<IQualityConcern> { throw new Error('Not implemented'); }
  async updateQualityConcern(_projectCode: string, _concernId: number, _data: Partial<IQualityConcern>): Promise<IQualityConcern> { throw new Error('Not implemented'); }
  async getSafetyConcerns(_projectCode: string): Promise<ISafetyConcern[]> { return []; }
  async addSafetyConcern(_projectCode: string, _concern: Partial<ISafetyConcern>): Promise<ISafetyConcern> { throw new Error('Not implemented'); }
  async updateSafetyConcern(_projectCode: string, _concernId: number, _data: Partial<ISafetyConcern>): Promise<ISafetyConcern> { throw new Error('Not implemented'); }
}

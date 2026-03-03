import type { IContractInfo, IInternalMatrixTask, ITeamRoleAssignment, IOwnerContractArticle, ISubContractClause } from '@hbc/models';
import type { IContractRepository } from '../../ports/IContractRepository';

export class MockContractRepository implements IContractRepository {
  async getContractInfo(_projectCode: string): Promise<IContractInfo | null> { return null; }
  async saveContractInfo(data: Partial<IContractInfo>): Promise<IContractInfo> { return { id: 1, ...data } as IContractInfo; }
  async getInternalMatrix(_projectCode: string): Promise<IInternalMatrixTask[]> { return []; }
  async updateInternalMatrixTask(_projectCode: string, _taskId: number, _data: Partial<IInternalMatrixTask>): Promise<IInternalMatrixTask> { throw new Error('Not implemented'); }
  async addInternalMatrixTask(_projectCode: string, _task: Partial<IInternalMatrixTask>): Promise<IInternalMatrixTask> { throw new Error('Not implemented'); }
  async removeInternalMatrixTask(_projectCode: string, _taskId: number): Promise<void> {}
  async getTeamRoleAssignments(_projectCode: string): Promise<ITeamRoleAssignment[]> { return []; }
  async updateTeamRoleAssignment(_projectCode: string, _role: string, _person: string, _email?: string): Promise<ITeamRoleAssignment> { throw new Error('Not implemented'); }
  async getOwnerContractMatrix(_projectCode: string): Promise<IOwnerContractArticle[]> { return []; }
  async updateOwnerContractArticle(_projectCode: string, _itemId: number, _data: Partial<IOwnerContractArticle>): Promise<IOwnerContractArticle> { throw new Error('Not implemented'); }
  async addOwnerContractArticle(_projectCode: string, _item: Partial<IOwnerContractArticle>): Promise<IOwnerContractArticle> { throw new Error('Not implemented'); }
  async removeOwnerContractArticle(_projectCode: string, _itemId: number): Promise<void> {}
  async getSubContractMatrix(_projectCode: string): Promise<ISubContractClause[]> { return []; }
  async updateSubContractClause(_projectCode: string, _itemId: number, _data: Partial<ISubContractClause>): Promise<ISubContractClause> { throw new Error('Not implemented'); }
  async addSubContractClause(_projectCode: string, _item: Partial<ISubContractClause>): Promise<ISubContractClause> { throw new Error('Not implemented'); }
  async removeSubContractClause(_projectCode: string, _itemId: number): Promise<void> {}
}

import type {
  IContractInfo,
  IInternalMatrixTask,
  ITeamRoleAssignment,
  IOwnerContractArticle,
  ISubContractClause,
} from '@hbc/models';

/**
 * Contract & responsibility matrix repository.
 */
export interface IContractRepository {
  // Contract Info
  getContractInfo(projectCode: string): Promise<IContractInfo | null>;
  saveContractInfo(data: Partial<IContractInfo>): Promise<IContractInfo>;

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
}

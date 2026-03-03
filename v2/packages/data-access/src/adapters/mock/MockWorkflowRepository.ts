import type { IWorkflowDefinition, IWorkflowStep, IConditionalAssignment, IWorkflowStepOverride, IResolvedWorkflowStep, WorkflowKey } from '@hbc/models';
import type { IWorkflowRepository } from '../../ports/IWorkflowRepository';

export class MockWorkflowRepository implements IWorkflowRepository {
  async getDefinitions(): Promise<IWorkflowDefinition[]> { return []; }
  async getDefinition(_workflowKey: WorkflowKey): Promise<IWorkflowDefinition | null> { return null; }
  async updateStep(_workflowId: number, _stepId: number, _data: Partial<IWorkflowStep>): Promise<IWorkflowStep> { throw new Error('Not implemented'); }
  async addConditionalAssignment(_stepId: number, _assignment: Partial<IConditionalAssignment>): Promise<IConditionalAssignment> { throw new Error('Not implemented'); }
  async updateConditionalAssignment(_assignmentId: number, _data: Partial<IConditionalAssignment>): Promise<IConditionalAssignment> { throw new Error('Not implemented'); }
  async removeConditionalAssignment(_assignmentId: number): Promise<void> {}
  async getOverrides(_projectCode: string): Promise<IWorkflowStepOverride[]> { return []; }
  async setOverride(_override: Partial<IWorkflowStepOverride>): Promise<IWorkflowStepOverride> { throw new Error('Not implemented'); }
  async removeOverride(_overrideId: number): Promise<void> {}
  async resolveChain(_workflowKey: WorkflowKey, _projectCode: string): Promise<IResolvedWorkflowStep[]> { return []; }
}

import type {
  IWorkflowDefinition,
  IWorkflowStep,
  IConditionalAssignment,
  IWorkflowStepOverride,
  IResolvedWorkflowStep,
  WorkflowKey,
} from '@hbc/models';

/**
 * Workflow definitions repository — definitions, steps, conditions, overrides.
 */
export interface IWorkflowRepository {
  getDefinitions(): Promise<IWorkflowDefinition[]>;
  getDefinition(workflowKey: WorkflowKey): Promise<IWorkflowDefinition | null>;
  updateStep(workflowId: number, stepId: number, data: Partial<IWorkflowStep>): Promise<IWorkflowStep>;
  addConditionalAssignment(stepId: number, assignment: Partial<IConditionalAssignment>): Promise<IConditionalAssignment>;
  updateConditionalAssignment(assignmentId: number, data: Partial<IConditionalAssignment>): Promise<IConditionalAssignment>;
  removeConditionalAssignment(assignmentId: number): Promise<void>;
  getOverrides(projectCode: string): Promise<IWorkflowStepOverride[]>;
  setOverride(override: Partial<IWorkflowStepOverride>): Promise<IWorkflowStepOverride>;
  removeOverride(overrideId: number): Promise<void>;
  resolveChain(workflowKey: WorkflowKey, projectCode: string): Promise<IResolvedWorkflowStep[]>;
}

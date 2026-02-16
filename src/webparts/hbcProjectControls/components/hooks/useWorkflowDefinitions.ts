import {
  IWorkflowDefinition,
  IWorkflowStep,
  IConditionalAssignment,
  IWorkflowStepOverride,
  IResolvedWorkflowStep,
  WorkflowKey,
  EntityType,
  IEntityChangedMessage,
} from '@hbc/sp-services';
import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';

export interface IUseWorkflowDefinitionsReturn {
  workflows: IWorkflowDefinition[];
  loading: boolean;
  error: string | null;
  fetchDefinitions: () => Promise<void>;
  updateStep: (workflowId: number, stepId: number, data: Partial<IWorkflowStep>) => Promise<void>;
  addCondition: (stepId: number, assignment: Partial<IConditionalAssignment>) => Promise<void>;
  updateCondition: (assignmentId: number, data: Partial<IConditionalAssignment>) => Promise<void>;
  removeCondition: (assignmentId: number) => Promise<void>;
  resolveChain: (workflowKey: WorkflowKey, projectCode: string) => Promise<IResolvedWorkflowStep[]>;
  getOverrides: (projectCode: string) => Promise<IWorkflowStepOverride[]>;
  setOverride: (override: Partial<IWorkflowStepOverride>) => Promise<void>;
  removeOverride: (overrideId: number) => Promise<void>;
}

export function useWorkflowDefinitions(): IUseWorkflowDefinitionsReturn {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const [workflows, setWorkflows] = React.useState<IWorkflowDefinition[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchDefinitions = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dataService.getWorkflowDefinitions();
      setWorkflows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflow definitions');
    } finally {
      setLoading(false);
    }
  }, [dataService]);

  // SignalR: refresh on WorkflowDefinition entity changes from other users
  useSignalR({
    entityType: EntityType.WorkflowDefinition,
    onEntityChanged: React.useCallback(() => { fetchDefinitions(); }, [fetchDefinitions]),
  });

  // Helper to broadcast workflow definition changes
  const broadcastWorkflowChange = React.useCallback((
    entityId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.WorkflowDefinition,
      entityId: String(entityId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
    });
  }, [broadcastChange, currentUser]);

  const updateStep = React.useCallback(async (workflowId: number, stepId: number, data: Partial<IWorkflowStep>) => {
    try {
      await dataService.updateWorkflowStep(workflowId, stepId, data);
      await fetchDefinitions();
      broadcastWorkflowChange(stepId, 'updated', 'Workflow step updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update step');
      throw err;
    }
  }, [dataService, fetchDefinitions, broadcastWorkflowChange]);

  const addCondition = React.useCallback(async (stepId: number, assignment: Partial<IConditionalAssignment>) => {
    try {
      await dataService.addConditionalAssignment(stepId, assignment);
      await fetchDefinitions();
      broadcastWorkflowChange(stepId, 'created', 'Conditional assignment added');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add condition');
      throw err;
    }
  }, [dataService, fetchDefinitions, broadcastWorkflowChange]);

  const updateCondition = React.useCallback(async (assignmentId: number, data: Partial<IConditionalAssignment>) => {
    try {
      await dataService.updateConditionalAssignment(assignmentId, data);
      await fetchDefinitions();
      broadcastWorkflowChange(assignmentId, 'updated', 'Conditional assignment updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update condition');
      throw err;
    }
  }, [dataService, fetchDefinitions, broadcastWorkflowChange]);

  const removeCondition = React.useCallback(async (assignmentId: number) => {
    try {
      await dataService.removeConditionalAssignment(assignmentId);
      await fetchDefinitions();
      broadcastWorkflowChange(assignmentId, 'deleted', 'Conditional assignment removed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove condition');
      throw err;
    }
  }, [dataService, fetchDefinitions, broadcastWorkflowChange]);

  const resolveChain = React.useCallback(async (workflowKey: WorkflowKey, projectCode: string): Promise<IResolvedWorkflowStep[]> => {
    try {
      return await dataService.resolveWorkflowChain(workflowKey, projectCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve chain');
      return [];
    }
  }, [dataService]);

  const getOverrides = React.useCallback(async (projectCode: string): Promise<IWorkflowStepOverride[]> => {
    try {
      return await dataService.getWorkflowOverrides(projectCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get overrides');
      return [];
    }
  }, [dataService]);

  const setOverride = React.useCallback(async (override: Partial<IWorkflowStepOverride>) => {
    try {
      await dataService.setWorkflowStepOverride(override);
      broadcastWorkflowChange(override.id ?? 0, 'updated', 'Workflow override set');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set override');
      throw err;
    }
  }, [dataService, broadcastWorkflowChange]);

  const removeOverride = React.useCallback(async (overrideId: number) => {
    try {
      await dataService.removeWorkflowStepOverride(overrideId);
      broadcastWorkflowChange(overrideId, 'deleted', 'Workflow override removed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove override');
      throw err;
    }
  }, [dataService, broadcastWorkflowChange]);

  return {
    workflows,
    loading,
    error,
    fetchDefinitions,
    updateStep,
    addCondition,
    updateCondition,
    removeCondition,
    resolveChain,
    getOverrides,
    setOverride,
    removeOverride,
  };
}

import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import {
  IWorkflowDefinition,
  IWorkflowStep,
  IConditionalAssignment,
  IWorkflowStepOverride,
  IResolvedWorkflowStep,
} from '../../models/IWorkflowDefinition';
import { WorkflowKey } from '../../models/enums';

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
  const { dataService } = useAppContext();
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

  const updateStep = React.useCallback(async (workflowId: number, stepId: number, data: Partial<IWorkflowStep>) => {
    try {
      await dataService.updateWorkflowStep(workflowId, stepId, data);
      await fetchDefinitions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update step');
      throw err;
    }
  }, [dataService, fetchDefinitions]);

  const addCondition = React.useCallback(async (stepId: number, assignment: Partial<IConditionalAssignment>) => {
    try {
      await dataService.addConditionalAssignment(stepId, assignment);
      await fetchDefinitions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add condition');
      throw err;
    }
  }, [dataService, fetchDefinitions]);

  const updateCondition = React.useCallback(async (assignmentId: number, data: Partial<IConditionalAssignment>) => {
    try {
      await dataService.updateConditionalAssignment(assignmentId, data);
      await fetchDefinitions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update condition');
      throw err;
    }
  }, [dataService, fetchDefinitions]);

  const removeCondition = React.useCallback(async (assignmentId: number) => {
    try {
      await dataService.removeConditionalAssignment(assignmentId);
      await fetchDefinitions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove condition');
      throw err;
    }
  }, [dataService, fetchDefinitions]);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set override');
      throw err;
    }
  }, [dataService]);

  const removeOverride = React.useCallback(async (overrideId: number) => {
    try {
      await dataService.removeWorkflowStepOverride(overrideId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove override');
      throw err;
    }
  }, [dataService]);

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

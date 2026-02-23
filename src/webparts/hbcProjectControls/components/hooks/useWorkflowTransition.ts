import * as React from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import type { UseWorkflowMachineResult } from './useWorkflowMachine';

export interface IUseWorkflowTransitionOptions<TVariables, TData, TContext extends { userPermissions: string[] }> {
  workflow: UseWorkflowMachineResult<TContext>;
  mutation: UseMutationResult<TData, Error, TVariables>;
}

export interface IUseWorkflowTransitionResult<TVariables> {
  transition: (eventType: string, variables: TVariables, eventPayload?: Record<string, unknown>) => Promise<void>;
  isTransitioning: boolean;
}

export function useWorkflowTransition<TVariables, TData, TContext extends { userPermissions: string[] }>(
  options: IUseWorkflowTransitionOptions<TVariables, TData, TContext>
): IUseWorkflowTransitionResult<TVariables> {
  const { workflow, mutation } = options;

  const transition = React.useCallback(async (
    eventType: string,
    variables: TVariables,
    eventPayload?: Record<string, unknown>
  ): Promise<void> => {
    if (!workflow.can(eventType)) {
      throw new Error(`Transition '${eventType}' is not allowed in state '${workflow.state}'`);
    }

    await mutation.mutateAsync(variables);
    workflow.send({ type: eventType, ...(eventPayload ?? {}) });
  }, [workflow, mutation]);

  return {
    transition,
    isTransitioning: mutation.isPending,
  };
}

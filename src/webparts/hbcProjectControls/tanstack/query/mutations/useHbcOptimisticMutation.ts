import * as React from 'react';
import { useMutation, useQueryClient, type UseMutationOptions, type UseMutationResult } from '@tanstack/react-query';
import { useMutationFeatureGate } from './useMutationFeatureGate';

interface IOptimisticContext<TState> {
  previousState?: TState;
}

type MutationMethodKey = string;

const WAVE_A_METHODS = new Set<string>([
  'createLead',
  'updateLead',
  'deleteLead',
  'createEstimatingRecord',
  'updateEstimatingRecord',
  'addBuyoutEntry',
  'updateBuyoutEntry',
  'removeBuyoutEntry',
  'updateProjectManagementPlan',
  'updateScheduleActivity',
  'submitPMPForApproval',
  'respondToPMPApproval',
  'signPMP',
]);

export interface IUseHbcOptimisticMutationOptions<TData, TVariables, TState>
  extends Omit<UseMutationOptions<TData, Error, TVariables, IOptimisticContext<TState>>, 'mutationFn'> {
  method: MutationMethodKey;
  domainFlag: string;
  mutationFn: (variables: TVariables) => Promise<TData>;
  getStateKey?: (variables: TVariables) => readonly unknown[];
  applyOptimistic?: (previous: TState | undefined, variables: TVariables) => TState;
  onOptimisticStateChange?: (state: TState | undefined) => void;
  onSuccessEffects?: (data: TData, variables: TVariables) => Promise<void> | void;
  onSettledEffects?: (variables: TVariables) => Promise<void> | void;
}

export function useHbcOptimisticMutation<TData, TVariables, TState = unknown>(
  options: IUseHbcOptimisticMutationOptions<TData, TVariables, TState>
): UseMutationResult<TData, Error, TVariables, IOptimisticContext<TState>> {
  const queryClient = useQueryClient();
  const {
    method,
    domainFlag,
    mutationFn,
    getStateKey,
    applyOptimistic,
    onOptimisticStateChange,
    onSuccess,
    onSettled,
    onError,
    onSuccessEffects,
    onSettledEffects,
    ...rest
  } = options;

  const optimisticEnabledByFlag = useMutationFeatureGate(domainFlag);
  const isMapped = React.useMemo(() => WAVE_A_METHODS.has(method), [method]);
  const useOptimisticLifecycle = optimisticEnabledByFlag && isMapped;

  // Explicit pessimistic fallback for disabled flags or unmapped methods.
  if (!useOptimisticLifecycle) {
    return useMutation<TData, Error, TVariables, IOptimisticContext<TState>>({
      ...rest,
      mutationFn,
      onSuccess: async (data, variables, context, mutationContext) => {
        await onSuccessEffects?.(data, variables);
        await onSuccess?.(data, variables, context, mutationContext);
      },
      onSettled: async (data, error, variables, context, mutationContext) => {
        await onSettledEffects?.(variables);
        await onSettled?.(data, error, variables, context, mutationContext);
      },
      onError,
    });
  }

  return useMutation<TData, Error, TVariables, IOptimisticContext<TState>>({
    ...rest,
    mutationFn,
    onMutate: async (variables) => {
      if (!getStateKey || !applyOptimistic) {
        return {};
      }
      const key = getStateKey(variables);
      await queryClient.cancelQueries({ queryKey: key });
      const previousState = queryClient.getQueryData<TState>(key);
      const optimisticState = applyOptimistic(previousState, variables);
      queryClient.setQueryData<TState>(key, optimisticState);
      onOptimisticStateChange?.(optimisticState);
      return { previousState };
    },
    onError: async (error, variables, context, mutationContext) => {
      if (getStateKey && context?.previousState !== undefined) {
        queryClient.setQueryData(getStateKey(variables), context.previousState);
        onOptimisticStateChange?.(context.previousState);
      }
      await onError?.(error, variables, context, mutationContext);
    },
    onSuccess: async (data, variables, context, mutationContext) => {
      await onSuccessEffects?.(data, variables);
      await onSuccess?.(data, variables, context, mutationContext);
    },
    onSettled: async (data, error, variables, context, mutationContext) => {
      await onSettledEffects?.(variables);
      await onSettled?.(data, error, variables, context, mutationContext);
    },
  });
}

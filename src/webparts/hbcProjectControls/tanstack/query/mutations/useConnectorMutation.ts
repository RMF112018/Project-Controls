/**
 * useConnectorMutation — TanStack Query mutation hook with configurable retry/backoff
 * for connector operations (Phase 5A).
 *
 * When `ConnectorMutationResilience` feature flag is enabled:
 *   - Overrides global `retry: 0` with per-mutation retry from IConnectorRetryPolicy
 *   - Exponential backoff: baseDelayMs * 2^attempt, capped at maxDelayMs
 *   - Auto-invalidates related query keys on success
 *   - SOC2 audit log on every mutation attempt
 *
 * When flag is disabled: fires mutation with retry=0 (standard behavior).
 */
import * as React from 'react';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { useAppContext } from '../../../components/contexts/AppContext';
import type { IConnectorRetryPolicy } from '@hbc/sp-services';
import { OPTIMISTIC_MUTATION_FLAGS } from './optimisticMutationFlags';

export interface IUseConnectorMutationOptions<TData, TVariables> {
  /** Descriptive name for audit logging (e.g., 'procore:syncProjects') */
  operationName: string;
  /** The async mutation function */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** Retry policy from the connector adapter */
  retryPolicy: IConnectorRetryPolicy;
  /** Query keys to invalidate on success */
  invalidateKeys?: readonly (readonly unknown[])[];
  /** Optional callback after successful mutation */
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  /** Optional callback on error (after all retries exhausted) */
  onError?: (error: Error, variables: TVariables) => void | Promise<void>;
}

export function useConnectorMutation<TData, TVariables>(
  options: IUseConnectorMutationOptions<TData, TVariables>
): UseMutationResult<TData, Error, TVariables> {
  const { operationName, mutationFn, retryPolicy, invalidateKeys, onSuccess, onError } = options;
  const queryClient = useQueryClient();
  const { isFeatureEnabled, dataService } = useAppContext();

  const isResilienceEnabled = React.useMemo(() => {
    if (typeof isFeatureEnabled !== 'function') return false;
    // Stage 6 Sub-task 4: retained as a deprecated disabled gate for compatibility;
    // when off, retry remains 0 to preserve established production behavior.
    return isFeatureEnabled(OPTIMISTIC_MUTATION_FLAGS.connectors);
  }, [isFeatureEnabled]);

  /** Audit log helper — fire-and-forget */
  const logAudit = React.useCallback(
    (action: string, details: string) => {
      if (!dataService?.logAudit) return;
      dataService.logAudit({
        Action: action,
        EntityType: 'Connector',
        EntityId: operationName,
        User: 'system',
        Details: details,
      } as Record<string, unknown>).catch(() => { /* audit is non-blocking */ });
    },
    [dataService, operationName]
  );

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables) => {
      logAudit('ConnectorMutationStarted', `Operation: ${operationName}`);
      return mutationFn(variables);
    },
    retry: isResilienceEnabled ? retryPolicy.maxRetries : 0,
    retryDelay: isResilienceEnabled
      ? (attemptIndex: number) => {
          const delay = Math.min(
            retryPolicy.baseDelayMs * Math.pow(2, attemptIndex),
            retryPolicy.maxDelayMs
          );
          return delay;
        }
      : undefined,
    onSuccess: async (data, variables) => {
      logAudit('ConnectorMutationSucceeded', `Operation: ${operationName}`);
      // Invalidate related query keys
      if (invalidateKeys) {
        await Promise.all(
          invalidateKeys.map(key => queryClient.invalidateQueries({ queryKey: key as unknown[] }))
        );
      }
      await onSuccess?.(data, variables);
    },
    onError: async (error, variables) => {
      logAudit(
        'ConnectorMutationFailed',
        `Operation: ${operationName}, Error: ${error.message}`
      );
      await onError?.(error, variables);
    },
  });
}

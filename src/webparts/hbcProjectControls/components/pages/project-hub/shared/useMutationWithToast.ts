/**
 * useMutationWithToast — Standardized mutation UX feedback.
 *
 * Two-part API for consistent toast feedback on mutations:
 *
 * 1. `withToastFeedback(fn, addToast, config)` — Promise wrapper for
 *    `useEstimatingMutation` consumers (PostBidAutopsyPage, ProjectNumberRequestForm).
 *
 * 2. `useMutationWithToast(options)` — Hook wrapping `useMutation` with auto
 *    toast callbacks for raw `useMutation` consumers (DepartmentTrackingPage).
 *
 * Both share `IToastConfig` for consistency.
 *
 * @example withToastFeedback
 * ```tsx
 * void withToastFeedback(
 *   () => saveAutopsy({ projectCode, data }),
 *   addToast,
 *   { errorMessage: 'Failed to save field.' }
 * );
 * ```
 *
 * @example useMutationWithToast
 * ```tsx
 * const mutation = useMutationWithToast({
 *   mutationFn: ({ id, patch }) => dataService.update(id, patch),
 *   toast: {
 *     successMessage: (_data, { field }) => `${field} saved`,
 *     errorMessage: (_error, { field }) => `Unable to save ${field}.`,
 *   },
 * });
 * ```
 */
import { useMutation, type UseMutationOptions, type UseMutationResult } from '@tanstack/react-query';
import { useToast, type ToastType } from '../../../shared/ToastContainer';

// ── Shared Config ────────────────────────────────────────────────────

export interface IToastConfig<TData = unknown, TVariables = unknown> {
  /** Success message. undefined = silent success (no toast). */
  successMessage?: string | ((data: TData, variables: TVariables) => string);
  /** Error message. Defaults to 'An error occurred.' */
  errorMessage?: string | ((error: unknown, variables: TVariables) => string);
  /** Success toast duration in ms. Defaults to 4000. */
  successDuration?: number;
  /** Error toast duration in ms. Defaults to 4000. */
  errorDuration?: number;
}

// ── Resolve helpers ──────────────────────────────────────────────────

function resolveMessage<TPayload, TVariables>(
  template: string | ((payload: TPayload, variables: TVariables) => string) | undefined,
  payload: TPayload,
  variables: TVariables,
  fallback?: string,
): string | undefined {
  if (template === undefined) return fallback;
  return typeof template === 'function' ? template(payload, variables) : template;
}

// ── withToastFeedback ────────────────────────────────────────────────

type AddToastFn = (message: string, type?: ToastType, duration?: number) => string;

/**
 * Wraps a Promise-returning function with toast feedback.
 * Re-throws on error so callers can chain additional handling.
 */
export async function withToastFeedback<TData = unknown>(
  fn: () => Promise<TData>,
  addToast: AddToastFn,
  config: Omit<IToastConfig<TData, void>, 'successMessage' | 'errorMessage'> & {
    successMessage?: string;
    errorMessage?: string;
  },
): Promise<TData> {
  try {
    const data = await fn();
    if (config.successMessage) {
      addToast(config.successMessage, 'success', config.successDuration ?? 4000);
    }
    return data;
  } catch (error) {
    const msg = config.errorMessage ?? 'An error occurred.';
    addToast(msg, 'error', config.errorDuration ?? 4000);
    throw error;
  }
}

// ── useMutationWithToast ─────────────────────────────────────────────

interface IUseMutationWithToastOptions<TData, TError, TVariables, TContext>
  extends UseMutationOptions<TData, TError, TVariables, TContext> {
  toast: IToastConfig<TData, TVariables>;
}

/**
 * Wraps `useMutation` with automatic toast feedback on success/error.
 * Preserves full `UseMutationResult` including `isPending` for disabled states.
 */
export function useMutationWithToast<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  options: IUseMutationWithToastOptions<TData, TError, TVariables, TContext>,
): UseMutationResult<TData, TError, TVariables, TContext> {
  const { addToast } = useToast();
  const { toast: toastConfig, onSuccess, onError, ...rest } = options;

  return useMutation<TData, TError, TVariables, TContext>({
    ...rest,
    onSuccess: (...args) => {
      const [data, variables] = args;
      const msg = resolveMessage(toastConfig.successMessage, data, variables);
      if (msg) {
        addToast(msg, 'success', toastConfig.successDuration ?? 4000);
      }
      onSuccess?.(...args);
    },
    onError: (...args) => {
      const [error, variables] = args;
      const msg = resolveMessage(toastConfig.errorMessage, error, variables, 'An error occurred.');
      if (msg) {
        addToast(msg, 'error', toastConfig.errorDuration ?? 4000);
      }
      onError?.(...args);
    },
  });
}

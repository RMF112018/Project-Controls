import * as React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useHbcOptimisticMutation } from '../useHbcOptimisticMutation';

const mockUseAppContext = jest.fn();

jest.mock('../../../../components/contexts/AppContext', () => ({
  useAppContext: () => mockUseAppContext(),
}));

function createWrapper(client: QueryClient): React.FC<{ children: React.ReactNode }> {
  return function Wrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useHbcOptimisticMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not run optimistic lifecycle when global flag is off', async () => {
    mockUseAppContext.mockReturnValue({ isFeatureEnabled: () => false });

    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
    const key = ['test', 'items'] as const;
    queryClient.setQueryData(key, [{ id: 1 }]);

    let resolveMutation: ((value: { id: number }) => void) | null = null;
    const pendingMutation = new Promise<{ id: number }>((resolve) => {
      resolveMutation = resolve;
    });

    const { result } = renderHook(() => useHbcOptimisticMutation<{ id: number }, { id: number }, Array<{ id: number }>>({
      method: 'updateLead',
      domainFlag: 'OptimisticMutations_Leads',
      mutationFn: async () => pendingMutation,
      getStateKey: () => key,
      applyOptimistic: (previous) => [{ id: 999 }, ...(previous ?? [])],
    }), { wrapper: createWrapper(queryClient) });

    act(() => {
      void result.current.mutate({ id: 2 });
    });

    expect(queryClient.getQueryData(key)).toEqual([{ id: 1 }]);

    act(() => {
      resolveMutation?.({ id: 2 });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('runs optimistic lifecycle when global + domain flags are on and method is mapped', async () => {
    mockUseAppContext.mockReturnValue({
      isFeatureEnabled: (name: string) => name === 'OptimisticMutationsEnabled' || name === 'OptimisticMutations_Leads',
    });

    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
    const key = ['test', 'items'] as const;
    queryClient.setQueryData(key, [{ id: 1 }]);

    const { result } = renderHook(() => useHbcOptimisticMutation<{ id: number }, { id: number }, Array<{ id: number }>>({
      method: 'updateLead',
      domainFlag: 'OptimisticMutations_Leads',
      mutationFn: async (vars) => ({ id: vars.id }),
      getStateKey: () => key,
      applyOptimistic: (previous) => [{ id: -1 }, ...(previous ?? [])],
    }), { wrapper: createWrapper(queryClient) });

    await act(async () => {
      await result.current.mutateAsync({ id: 2 });
    });

    expect((queryClient.getQueryData(key) as Array<{ id: number }>)[0].id).toBe(-1);
  });

  it('falls back to pessimistic path for unmapped methods', async () => {
    mockUseAppContext.mockReturnValue({
      isFeatureEnabled: (name: string) => name === 'OptimisticMutationsEnabled' || name === 'OptimisticMutations_Leads',
    });

    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
    const key = ['test', 'items'] as const;
    queryClient.setQueryData(key, [{ id: 1 }]);

    let resolveMutation: ((value: { id: number }) => void) | null = null;
    const pendingMutation = new Promise<{ id: number }>((resolve) => {
      resolveMutation = resolve;
    });

    const { result } = renderHook(() => useHbcOptimisticMutation<{ id: number }, { id: number }, Array<{ id: number }>>({
      method: 'nonMappedMethod',
      domainFlag: 'OptimisticMutations_Leads',
      mutationFn: async () => pendingMutation,
      getStateKey: () => key,
      applyOptimistic: (previous) => [{ id: -1 }, ...(previous ?? [])],
    }), { wrapper: createWrapper(queryClient) });

    act(() => {
      void result.current.mutate({ id: 3 });
    });

    expect(queryClient.getQueryData(key)).toEqual([{ id: 1 }]);

    act(() => {
      resolveMutation?.({ id: 3 });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

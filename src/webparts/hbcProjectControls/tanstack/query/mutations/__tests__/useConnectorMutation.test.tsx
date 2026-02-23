import * as React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useConnectorMutation } from '../useConnectorMutation';
import type { IConnectorRetryPolicy } from '@hbc/sp-services';

const mockLogAudit = jest.fn().mockResolvedValue(undefined);
const mockUseAppContext = jest.fn();

jest.mock('../../../../components/contexts/AppContext', () => ({
  useAppContext: () => mockUseAppContext(),
}));

const PROCORE_RETRY_POLICY: IConnectorRetryPolicy = {
  retryableStatuses: [429, 500, 502, 503, 504],
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
};

function createWrapper(client: QueryClient): React.FC<{ children: React.ReactNode }> {
  return function Wrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
}

describe('useConnectorMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppContext.mockReturnValue({
      isFeatureEnabled: () => false,
      dataService: { logAudit: mockLogAudit },
    });
  });

  it('fires mutation successfully without retry when flag is disabled', async () => {
    const queryClient = createQueryClient();
    const mutationFn = jest.fn().mockResolvedValue({ synced: 10 });

    const { result } = renderHook(
      () =>
        useConnectorMutation<{ synced: number }, { connectorId: string }>({
          operationName: 'procore:syncProjects',
          mutationFn,
          retryPolicy: PROCORE_RETRY_POLICY,
        }),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      await result.current.mutateAsync({ connectorId: 'abc' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mutationFn).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry when ConnectorMutationResilience flag is disabled', async () => {
    const queryClient = createQueryClient();
    const mutationFn = jest.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(
      () =>
        useConnectorMutation<void, { id: string }>({
          operationName: 'procore:sync',
          mutationFn,
          retryPolicy: PROCORE_RETRY_POLICY,
        }),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      try {
        await result.current.mutateAsync({ id: '1' });
      } catch {
        // expected
      }
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    // Only 1 call — no retries
    expect(mutationFn).toHaveBeenCalledTimes(1);
  });

  it('retries up to maxRetries when flag IS enabled', async () => {
    mockUseAppContext.mockReturnValue({
      isFeatureEnabled: (name: string) => name === 'ConnectorMutationResilience',
      dataService: { logAudit: mockLogAudit },
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false }, // Default, but hook overrides
        queries: { retry: false },
      },
    });

    const mutationFn = jest.fn().mockRejectedValue(new Error('503 Service Unavailable'));

    const { result } = renderHook(
      () =>
        useConnectorMutation<void, { id: string }>({
          operationName: 'procore:sync',
          mutationFn,
          retryPolicy: {
            retryableStatuses: [503],
            maxRetries: 2,
            baseDelayMs: 10, // very short for test speed
            maxDelayMs: 50,
          },
        }),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      try {
        await result.current.mutateAsync({ id: '1' });
      } catch {
        // expected after retries exhausted
      }
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // 1 initial + 2 retries = 3 total
    expect(mutationFn).toHaveBeenCalledTimes(3);
  });

  it('invalidates query keys on success', async () => {
    const queryClient = createQueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(
      () =>
        useConnectorMutation<{ ok: boolean }, { id: string }>({
          operationName: 'procore:testConnection',
          mutationFn: jest.fn().mockResolvedValue({ ok: true }),
          retryPolicy: PROCORE_RETRY_POLICY,
          invalidateKeys: [['connectors', 'status'], ['connectors', 'history']],
        }),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      await result.current.mutateAsync({ id: '1' });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['connectors', 'status'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['connectors', 'history'] });
  });

  it('calls onSuccess callback', async () => {
    const queryClient = createQueryClient();
    const onSuccess = jest.fn();

    const { result } = renderHook(
      () =>
        useConnectorMutation<{ synced: number }, { id: string }>({
          operationName: 'bamboo:sync',
          mutationFn: jest.fn().mockResolvedValue({ synced: 25 }),
          retryPolicy: PROCORE_RETRY_POLICY,
          onSuccess,
        }),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      await result.current.mutateAsync({ id: '1' });
    });

    expect(onSuccess).toHaveBeenCalledWith({ synced: 25 }, { id: '1' });
  });

  it('calls onError callback after failure', async () => {
    const queryClient = createQueryClient();
    const onError = jest.fn();

    const { result } = renderHook(
      () =>
        useConnectorMutation<void, { id: string }>({
          operationName: 'procore:sync',
          mutationFn: jest.fn().mockRejectedValue(new Error('Timeout')),
          retryPolicy: PROCORE_RETRY_POLICY,
          onError,
        }),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      try {
        await result.current.mutateAsync({ id: '1' });
      } catch {
        // expected
      }
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
    expect(onError.mock.calls[0][0].message).toBe('Timeout');
  });

  it('logs audit on mutation start and success', async () => {
    const queryClient = createQueryClient();

    const { result } = renderHook(
      () =>
        useConnectorMutation<{ ok: boolean }, { id: string }>({
          operationName: 'procore:testConnection',
          mutationFn: jest.fn().mockResolvedValue({ ok: true }),
          retryPolicy: PROCORE_RETRY_POLICY,
        }),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      await result.current.mutateAsync({ id: '1' });
    });

    // Should have logged start + success
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        Action: 'ConnectorMutationStarted',
        EntityId: 'procore:testConnection',
      })
    );
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        Action: 'ConnectorMutationSucceeded',
        EntityId: 'procore:testConnection',
      })
    );
  });

  it('logs audit on mutation failure', async () => {
    const queryClient = createQueryClient();

    const { result } = renderHook(
      () =>
        useConnectorMutation<void, { id: string }>({
          operationName: 'procore:sync',
          mutationFn: jest.fn().mockRejectedValue(new Error('Rate limited')),
          retryPolicy: PROCORE_RETRY_POLICY,
        }),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      try {
        await result.current.mutateAsync({ id: '1' });
      } catch {
        // expected
      }
    });

    await waitFor(() => {
      expect(mockLogAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          Action: 'ConnectorMutationFailed',
          Details: expect.stringContaining('Rate limited'),
        })
      );
    });
  });
});

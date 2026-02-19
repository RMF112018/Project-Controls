import * as React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInfiniteSharePointList } from '../useInfiniteSharePointList';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useInfiniteSharePointList', () => {
  it('uses full-list fallback when infinite is disabled', async () => {
    const fetchAll = jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const fetchPage = jest.fn();

    const { result } = renderHook(() => useInfiniteSharePointList({
      infiniteEnabled: false,
      queryKey: ['test', 'fallback'],
      fetchAll,
      fetchPage,
    }), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.mode).toBe('full');
      if (result.current.mode === 'full') {
        expect(result.current.fullQuery.isSuccess).toBe(true);
      }
    });

    expect(fetchAll).toHaveBeenCalledTimes(1);
    expect(fetchPage).not.toHaveBeenCalled();
  });

  it('uses infinite query path when enabled', async () => {
    const fetchAll = jest.fn();
    const fetchPage = jest.fn().mockResolvedValue({
      items: [{ id: 1 }],
      nextToken: null,
      hasMore: false,
      totalApprox: 1,
    });

    const { result } = renderHook(() => useInfiniteSharePointList({
      infiniteEnabled: true,
      queryKey: ['test', 'infinite'],
      fetchAll,
      fetchPage,
    }), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.mode).toBe('infinite');
      if (result.current.mode === 'infinite') {
        expect(result.current.infiniteQuery.isSuccess).toBe(true);
      }
    });

    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchAll).not.toHaveBeenCalled();
  });
});

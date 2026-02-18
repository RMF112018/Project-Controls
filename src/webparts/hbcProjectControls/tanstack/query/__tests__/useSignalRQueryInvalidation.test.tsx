import * as React from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EntityType } from '@hbc/sp-services';
import { useSignalRQueryInvalidation } from '../useSignalRQueryInvalidation';

let entityChangedHandler: (() => void) | null = null;

jest.mock('../../../components/hooks/useSignalR', () => ({
  useSignalR: (options: { onEntityChanged?: () => void }) => {
    entityChangedHandler = options.onEntityChanged ?? null;
    return { connectionStatus: 'connected', isEnabled: true };
  },
}));

function createWrapper(client: QueryClient): React.FC<{ children: React.ReactNode }> {
  return function Wrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return (
      <QueryClientProvider client={client}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('useSignalRQueryInvalidation', () => {
  beforeEach(() => {
    entityChangedHandler = null;
  });

  it('invalidates configured query keys when a matching SignalR event is received', () => {
    const queryClient = new QueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const onInvalidated = jest.fn();

    renderHook(() =>
      useSignalRQueryInvalidation({
        entityType: EntityType.DataMart,
        queryKeys: [
          ['scope', 'mock', 'hub', 'http://localhost', null, 'dataMart'],
          ['scope', 'mock', 'hub', 'http://localhost', null, 'compliance'],
        ],
        onInvalidated,
      }),
    {
      wrapper: createWrapper(queryClient),
    });

    expect(entityChangedHandler).not.toBeNull();

    act(() => {
      entityChangedHandler?.();
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(2);
    expect(invalidateSpy).toHaveBeenNthCalledWith(1, {
      queryKey: ['scope', 'mock', 'hub', 'http://localhost', null, 'dataMart'],
    });
    expect(invalidateSpy).toHaveBeenNthCalledWith(2, {
      queryKey: ['scope', 'mock', 'hub', 'http://localhost', null, 'compliance'],
    });
    expect(onInvalidated).toHaveBeenCalledTimes(1);
  });
});

import * as React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { IDataService } from '@hbc/sp-services';
import { useDataMart } from '../useDataMart';
import { qk, type IQueryScope } from '../../../tanstack/query/queryKeys';

const scope: IQueryScope = {
  mode: 'mock',
  siteContext: 'hub',
  siteUrl: 'http://localhost',
  projectCode: null,
};

const mockUseAppContext = jest.fn();

jest.mock('../../contexts/AppContext', () => ({
  useAppContext: () => mockUseAppContext(),
}));

jest.mock('../../../tanstack/query/useQueryScope', () => ({
  useQueryScope: () => scope,
}));

jest.mock('../../../tanstack/query/useSignalRQueryInvalidation', () => ({
  useSignalRQueryInvalidation: () => undefined,
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

describe('useDataMart optimistic lifecycles', () => {
  it('invalidates DataMart queries only once per syncProject call', async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const dataService: Partial<IDataService> = {
      getDataMartRecords: jest.fn().mockResolvedValue([]),
      syncToDataMart: jest.fn().mockResolvedValue({
        projectCode: '25-001-01',
        success: true,
        syncedAt: new Date().toISOString(),
      }),
      triggerDataMartSync: jest.fn().mockResolvedValue([]),
      getDataMartRecord: jest.fn().mockResolvedValue(null),
    };

    mockUseAppContext.mockReturnValue({
      dataService,
      currentUser: { email: 'tester@hbc.com' },
    });

    const { result } = renderHook(() => useDataMart(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect((dataService.getDataMartRecords as jest.Mock)).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.syncProject('25-001-01');
    });

    const dataMartBaseCalls = invalidateSpy.mock.calls.filter(
      ([arg]) => JSON.stringify(arg) === JSON.stringify({ queryKey: qk.dataMart.base(scope) })
    );

    expect(dataMartBaseCalls).toHaveLength(1);
  });
});

import * as React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { IDataService, IEstimatingTracker } from '@hbc/sp-services';
import { useEstimating } from '../useEstimating';

const mockUseAppContext = jest.fn();
const mockUseSignalRContext = jest.fn();

jest.mock('../../contexts/AppContext', () => ({
  useAppContext: () => mockUseAppContext(),
}));

jest.mock('../../contexts/SignalRContext', () => ({
  useSignalRContext: () => mockUseSignalRContext(),
}));

jest.mock('../useSignalR', () => ({
  useSignalR: jest.fn(),
}));

function createWrapper(client: QueryClient): React.FC<{ children: React.ReactNode }> {
  return function Wrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function makeRecord(overrides: Partial<IEstimatingTracker> = {}): IEstimatingTracker {
  return {
    id: 1,
    LeadID: 1,
    ProjectCode: 'HBC-001',
    Title: 'Estimate',
    Division: 'Operations',
    BidDate: '2026-02-19',
    AwardStatus: 'Pending',
    ...overrides,
  } as IEstimatingTracker;
}

describe('useEstimating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSignalRContext.mockReturnValue({ broadcastChange: jest.fn() });
  });

  it('uses pessimistic fallback when flags are off', async () => {
    const dataService = {
      getEstimatingRecords: jest.fn().mockResolvedValue({ items: [makeRecord()], totalCount: 1, hasMore: false }),
      createEstimatingRecord: jest.fn(),
      updateEstimatingRecord: jest.fn(),
      getEstimatingRecordById: jest.fn(),
      getEstimatingByLeadId: jest.fn(),
      getCurrentPursuits: jest.fn(),
      getPreconEngagements: jest.fn(),
      getEstimateLog: jest.fn(),
    } as unknown as IDataService;

    let resolveCreate: ((value: IEstimatingTracker) => void) | null = null;
    (dataService.createEstimatingRecord as jest.Mock).mockReturnValue(new Promise<IEstimatingTracker>((resolve) => { resolveCreate = resolve; }));

    mockUseAppContext.mockReturnValue({
      dataService,
      currentUser: { email: 'test@hbc.com', displayName: 'Tester' },
      isFeatureEnabled: () => false,
    });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const { result } = renderHook(() => useEstimating(), { wrapper: createWrapper(queryClient) });

    await act(async () => {
      await result.current.fetchRecords();
    });

    act(() => {
      void result.current.createRecord({ Title: 'New Record' });
    });

    expect(result.current.records.some((record) => record.id < 0)).toBe(false);

    act(() => {
      resolveCreate?.(makeRecord({ id: 2, Title: 'New Record' }));
    });

    await waitFor(() => {
      expect(result.current.records.some((record) => record.id === 2)).toBe(true);
    });
  });

  it('applies optimistic state when flags are on', async () => {
    const dataService = {
      getEstimatingRecords: jest.fn().mockResolvedValue({ items: [makeRecord()], totalCount: 1, hasMore: false }),
      createEstimatingRecord: jest.fn().mockReturnValue(new Promise<IEstimatingTracker>(() => { /* pending */ })),
      updateEstimatingRecord: jest.fn(),
      getEstimatingRecordById: jest.fn(),
      getEstimatingByLeadId: jest.fn(),
      getCurrentPursuits: jest.fn(),
      getPreconEngagements: jest.fn(),
      getEstimateLog: jest.fn(),
    } as unknown as IDataService;

    mockUseAppContext.mockReturnValue({
      dataService,
      currentUser: { email: 'test@hbc.com', displayName: 'Tester' },
      isFeatureEnabled: (name: string) => name === 'OptimisticMutationsEnabled' || name === 'OptimisticMutations_Estimating',
    });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const { result } = renderHook(() => useEstimating(), { wrapper: createWrapper(queryClient) });

    await act(async () => {
      await result.current.fetchRecords();
    });

    act(() => {
      void result.current.createRecord({ Title: 'New Record' });
    });

    await waitFor(() => {
      expect(result.current.records.some((record) => record.id < 0)).toBe(true);
    });
  });
});

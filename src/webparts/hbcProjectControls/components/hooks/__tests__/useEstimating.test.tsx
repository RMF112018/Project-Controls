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

function makeAppContextMock(dataService: unknown, isFeatureEnabled: (name: string) => boolean = () => false) {
  return {
    dataService,
    currentUser: { email: 'test@hbc.com', displayName: 'Tester' },
    isFeatureEnabled,
    dataServiceMode: 'mock',
    selectedProject: null,
    isProjectSite: false,
  };
}

describe('useEstimating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSignalRContext.mockReturnValue({ broadcastChange: jest.fn() });
  });

  it('uses pessimistic fallback when flags are off', async () => {
    const newRecord = makeRecord({ id: 2, Title: 'New Record' });
    let callCount = 0;
    const dataService = {
      getEstimatingRecords: jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount <= 1) {
          return Promise.resolve({ items: [makeRecord()], totalCount: 1, hasMore: false });
        }
        return Promise.resolve({ items: [makeRecord(), newRecord], totalCount: 2, hasMore: false });
      }),
      createEstimatingRecord: jest.fn().mockResolvedValue(newRecord),
      updateEstimatingRecord: jest.fn(),
      getEstimatingRecordById: jest.fn(),
      getEstimatingByLeadId: jest.fn(),
      getCurrentPursuits: jest.fn(),
      getPreconEngagements: jest.fn(),
      getEstimateLog: jest.fn(),
    } as unknown as IDataService;

    mockUseAppContext.mockReturnValue(makeAppContextMock(dataService));

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const { result } = renderHook(() => useEstimating(), { wrapper: createWrapper(queryClient) });

    // Wait for initial data
    await waitFor(() => {
      expect(result.current.records.length).toBe(1);
    });

    // Trigger create — pessimistic, so data appears after mutation settles + refetch
    await act(async () => {
      await result.current.createRecord({ Title: 'New Record' });
    });

    await waitFor(() => {
      expect(result.current.records.some((record) => record.id === 2)).toBe(true);
    });
  });

  it('applies optimistic state when flags are on', async () => {
    const newRecord = makeRecord({ id: 2, Title: 'New Record' });
    let callCount = 0;
    const dataService = {
      getEstimatingRecords: jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount <= 1) {
          return Promise.resolve({ items: [makeRecord()], totalCount: 1, hasMore: false });
        }
        return Promise.resolve({ items: [makeRecord(), newRecord], totalCount: 2, hasMore: false });
      }),
      createEstimatingRecord: jest.fn().mockResolvedValue(newRecord),
      updateEstimatingRecord: jest.fn(),
      getEstimatingRecordById: jest.fn(),
      getEstimatingByLeadId: jest.fn(),
      getCurrentPursuits: jest.fn(),
      getPreconEngagements: jest.fn(),
      getEstimateLog: jest.fn(),
    } as unknown as IDataService;

    mockUseAppContext.mockReturnValue(
      makeAppContextMock(dataService, (name: string) => name === 'OptimisticMutationsEnabled' || name === 'OptimisticMutations_Estimating')
    );

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const { result } = renderHook(() => useEstimating(), { wrapper: createWrapper(queryClient) });

    // Wait for initial data
    await waitFor(() => {
      expect(result.current.records.length).toBe(1);
    });

    // Trigger create — mutation settles then refetch returns updated data
    await act(async () => {
      await result.current.createRecord({ Title: 'New Record' });
    });

    await waitFor(() => {
      expect(result.current.records.some((record) => record.id === 2)).toBe(true);
    });
  });
});

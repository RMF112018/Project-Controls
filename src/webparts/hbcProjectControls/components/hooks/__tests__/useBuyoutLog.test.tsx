import * as React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { IDataService, IBuyoutEntry } from '@hbc/sp-services';

import { useBuyoutLog } from '../useBuyoutLog';

const mockUseAppContext = jest.fn();
const mockUseSignalRContext = jest.fn();
const mockUseQueryScope = jest.fn();

jest.mock('../../contexts/AppContext', () => ({
  useAppContext: () => mockUseAppContext(),
}));

jest.mock('../../contexts/SignalRContext', () => ({
  useSignalRContext: () => mockUseSignalRContext(),
}));

jest.mock('../../../tanstack/query/useQueryScope', () => ({
  useQueryScope: () => mockUseQueryScope(),
}));

jest.mock('../../../tanstack/query/useSignalRQueryInvalidation', () => ({
  useSignalRQueryInvalidation: jest.fn(),
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

function makeEntry(overrides: Partial<IBuyoutEntry> = {}): IBuyoutEntry {
  return {
    id: 1,
    projectCode: 'HBC-001',
    divisionCode: '03-100',
    divisionDescription: 'Concrete',
    isStandard: true,
    originalBudget: 100000,
    estimatedTax: 5000,
    totalBudget: 105000,
    enrolledInSDI: false,
    bondRequired: false,
    commitmentStatus: 'Budgeted',
    waiverRequired: false,
    approvalHistory: [],
    status: 'Not Started',
    createdDate: '2026-02-18T00:00:00.000Z',
    modifiedDate: '2026-02-18T00:00:00.000Z',
    ...overrides,
  };
}

describe('useBuyoutLog', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseQueryScope.mockReturnValue({
      mode: 'mock',
      siteContext: 'hub',
      siteUrl: 'http://localhost',
      projectCode: null,
    });

    mockUseSignalRContext.mockReturnValue({
      broadcastChange: jest.fn(),
    });
  });

  it('rolls back optimistic add mutation when create fails', async () => {
    const initialEntries = [makeEntry()];

    const createdEntry = makeEntry({ id: 2, divisionCode: '04-200', divisionDescription: 'Masonry' });
    const dataService = {
      getBuyoutEntries: jest
        .fn()
        .mockResolvedValueOnce(initialEntries)
        .mockResolvedValueOnce([...initialEntries, createdEntry]),
      addBuyoutEntry: jest.fn(),
      initializeBuyoutLog: jest.fn(),
      updateBuyoutEntry: jest.fn(),
      removeBuyoutEntry: jest.fn(),
    } as unknown as IDataService;

    let rejectAdd: ((reason?: unknown) => void) | null = null;
    const pendingAdd = new Promise<IBuyoutEntry>((_resolve, reject) => {
      rejectAdd = reject;
    });
    (dataService.addBuyoutEntry as jest.Mock).mockReturnValue(pendingAdd);

    mockUseAppContext.mockReturnValue({
      dataService,
      currentUser: { email: 'tester@hbc.com', displayName: 'Tester' },
      isFeatureEnabled: (featureName: string) =>
        featureName === 'OptimisticMutationsEnabled' || featureName === 'OptimisticMutations_Buyout',
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const { result } = renderHook(() => useBuyoutLog(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.fetchEntries('HBC-001');
    });

    expect(result.current.entries).toHaveLength(1);

    act(() => {
      void result.current.addEntry('HBC-001', {
        divisionCode: '04-200',
        divisionDescription: 'Masonry',
      }).catch(() => { /* expected failure */ });
    });

    await waitFor(() => {
      expect(result.current.entries.some((entry) => entry.id < 0)).toBe(true);
    });

    act(() => {
      rejectAdd?.(new Error('Create failed'));
    });

    await waitFor(() => {
      expect(result.current.entries).toHaveLength(1);
      expect(result.current.entries[0].divisionCode).toBe('03-100');
    });
  });

  it('uses pessimistic fallback when mutation flags are disabled', async () => {
    const initialEntries = [makeEntry()];
    const createdEntry = makeEntry({ id: 2, divisionCode: '04-200', divisionDescription: 'Masonry' });

    const dataService = {
      getBuyoutEntries: jest
        .fn()
        .mockResolvedValueOnce(initialEntries)
        .mockResolvedValueOnce([...initialEntries, createdEntry]),
      addBuyoutEntry: jest.fn(),
      initializeBuyoutLog: jest.fn(),
      updateBuyoutEntry: jest.fn(),
      removeBuyoutEntry: jest.fn(),
    } as unknown as IDataService;

    let resolveAdd: ((value: IBuyoutEntry) => void) | null = null;
    const pendingAdd = new Promise<IBuyoutEntry>((resolve) => {
      resolveAdd = resolve;
    });
    (dataService.addBuyoutEntry as jest.Mock).mockReturnValue(pendingAdd);

    mockUseAppContext.mockReturnValue({
      dataService,
      currentUser: { email: 'tester@hbc.com', displayName: 'Tester' },
      isFeatureEnabled: () => false,
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const { result } = renderHook(() => useBuyoutLog(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.fetchEntries('HBC-001');
    });

    act(() => {
      void result.current.addEntry('HBC-001', {
        divisionCode: '04-200',
        divisionDescription: 'Masonry',
      }).catch(() => { /* not expected */ });
    });

    expect(result.current.entries.some((entry) => entry.id < 0)).toBe(false);

    act(() => {
      resolveAdd?.(createdEntry);
    });

    await waitFor(() => {
      expect(result.current.entries.some((entry) => entry.id === 2)).toBe(true);
    });
  });
});

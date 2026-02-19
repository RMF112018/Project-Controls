import * as React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { IDataService, IProjectManagementPlan } from '@hbc/sp-services';
import { useProjectManagementPlan } from '../useProjectManagementPlan';

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

function makePmp(overrides: Partial<IProjectManagementPlan> = {}): IProjectManagementPlan {
  return {
    id: 1,
    projectCode: 'HBC-001',
    projectName: 'Project',
    jobNumber: 'J-1',
    status: 'Draft',
    currentCycleNumber: 1,
    division: 'Operations',
    superintendentPlan: 'Plan',
    preconMeetingNotes: '',
    siteManagementNotes: '',
    projectAdminBuyoutDate: null,
    attachmentUrls: [],
    riskCostData: null,
    qualityConcerns: [],
    safetyConcerns: [],
    scheduleData: null,
    superintendentPlanData: { completionPercentage: 0 },
    lessonsLearned: [],
    teamAssignments: [],
    startupSignatures: [],
    completionSignatures: [],
    approvalCycles: [],
    boilerplate: [],
    createdBy: 'test',
    createdAt: '2026-02-19T00:00:00.000Z',
    lastUpdatedBy: 'test',
    lastUpdatedAt: '2026-02-19T00:00:00.000Z',
    ...overrides,
  };
}

describe('useProjectManagementPlan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSignalRContext.mockReturnValue({ broadcastChange: jest.fn() });
  });

  it('uses pessimistic fallback when flags are off', async () => {
    const base = makePmp();
    const dataService = {
      getProjectManagementPlan: jest.fn().mockResolvedValue(base),
      getPMPBoilerplate: jest.fn().mockResolvedValue([]),
      getDivisionApprovers: jest.fn().mockResolvedValue([]),
      updateProjectManagementPlan: jest.fn(),
      submitPMPForApproval: jest.fn(),
      respondToPMPApproval: jest.fn(),
      signPMP: jest.fn(),
    } as unknown as IDataService;

    let resolveUpdate: ((value: IProjectManagementPlan) => void) | null = null;
    (dataService.updateProjectManagementPlan as jest.Mock).mockReturnValue(new Promise<IProjectManagementPlan>((resolve) => { resolveUpdate = resolve; }));

    mockUseAppContext.mockReturnValue({
      dataService,
      currentUser: { email: 'test@hbc.com', displayName: 'Tester' },
      isFeatureEnabled: () => false,
    });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const { result } = renderHook(() => useProjectManagementPlan(), { wrapper: createWrapper(queryClient) });

    await act(async () => {
      await result.current.fetchPlan('HBC-001');
    });

    act(() => {
      void result.current.updatePlan('HBC-001', { superintendentPlan: 'Optimistic Plan' });
    });

    expect(result.current.pmp?.superintendentPlan).toBe('Plan');

    act(() => {
      resolveUpdate?.(makePmp({ superintendentPlan: 'Final Plan' }));
    });

    await waitFor(() => {
      expect(result.current.pmp?.superintendentPlan).toBe('Final Plan');
    });
  });

  it('applies optimistic state when flags are on', async () => {
    const base = makePmp();
    const dataService = {
      getProjectManagementPlan: jest.fn().mockResolvedValue(base),
      getPMPBoilerplate: jest.fn().mockResolvedValue([]),
      getDivisionApprovers: jest.fn().mockResolvedValue([]),
      updateProjectManagementPlan: jest.fn().mockReturnValue(new Promise<IProjectManagementPlan>(() => { /* pending */ })),
      submitPMPForApproval: jest.fn(),
      respondToPMPApproval: jest.fn(),
      signPMP: jest.fn(),
    } as unknown as IDataService;

    mockUseAppContext.mockReturnValue({
      dataService,
      currentUser: { email: 'test@hbc.com', displayName: 'Tester' },
      isFeatureEnabled: (name: string) => name === 'OptimisticMutationsEnabled' || name === 'OptimisticMutations_PMP',
    });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const { result } = renderHook(() => useProjectManagementPlan(), { wrapper: createWrapper(queryClient) });

    await act(async () => {
      await result.current.fetchPlan('HBC-001');
    });

    act(() => {
      void result.current.updatePlan('HBC-001', { superintendentPlan: 'Optimistic Plan' });
    });

    await waitFor(() => {
      expect(result.current.pmp?.superintendentPlan).toBe('Optimistic Plan');
    });
  });
});

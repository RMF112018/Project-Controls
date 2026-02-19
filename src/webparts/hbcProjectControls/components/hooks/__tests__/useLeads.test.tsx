import * as React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { IDataService, ILead, ILeadFormData } from '@hbc/sp-services';
import { Stage } from '@hbc/sp-services';
import { useLeads } from '../useLeads';

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

function makeLead(overrides: Partial<ILead> = {}): ILead {
  return {
    id: 1,
    Title: 'Lead 1',
    ClientName: 'Client',
    Region: 'North' as ILead['Region'],
    Sector: 'Commercial' as ILead['Sector'],
    Division: 'Operations' as ILead['Division'],
    Originator: 'Originator',
    DepartmentOfOrigin: 'Operations' as ILead['DepartmentOfOrigin'],
    DateOfEvaluation: '2026-02-19T00:00:00.000Z',
    Stage: Stage.LeadDiscovery,
    ...overrides,
  };
}

const createPayload: ILeadFormData = {
  Title: 'New Lead',
  ClientName: 'Client B',
  Region: 'North' as ILead['Region'],
  Sector: 'Commercial' as ILead['Sector'],
  Division: 'Operations' as ILead['Division'],
  DepartmentOfOrigin: 'Operations' as ILead['DepartmentOfOrigin'],
  Stage: Stage.LeadDiscovery,
};

describe('useLeads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSignalRContext.mockReturnValue({ broadcastChange: jest.fn() });
  });

  it('uses pessimistic fallback when flags are off', async () => {
    const initialLeads = [makeLead()];
    const dataService = {
      getLeads: jest.fn().mockResolvedValue({ items: initialLeads, totalCount: 1, hasMore: false }),
      createLead: jest.fn(),
      getLeadsByStage: jest.fn(),
      updateLead: jest.fn(),
      deleteLead: jest.fn(),
      searchLeads: jest.fn(),
      getLeadById: jest.fn(),
    } as unknown as IDataService;

    let resolveCreate: ((value: ILead) => void) | null = null;
    (dataService.createLead as jest.Mock).mockReturnValue(new Promise<ILead>((resolve) => { resolveCreate = resolve; }));

    mockUseAppContext.mockReturnValue({
      dataService,
      currentUser: { email: 'test@hbc.com', displayName: 'Tester' },
      isFeatureEnabled: () => false,
    });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const { result } = renderHook(() => useLeads(), { wrapper: createWrapper(queryClient) });

    await act(async () => {
      await result.current.fetchLeads();
    });

    act(() => {
      void result.current.createLead(createPayload);
    });

    expect(result.current.leads.some((lead) => lead.id < 0)).toBe(false);

    act(() => {
      resolveCreate?.(makeLead({ id: 2, Title: 'New Lead' }));
    });

    await waitFor(() => {
      expect(result.current.leads.some((lead) => lead.id === 2)).toBe(true);
    });
  });

  it('applies optimistic state when flags are on', async () => {
    const initialLeads = [makeLead()];
    const dataService = {
      getLeads: jest.fn().mockResolvedValue({ items: initialLeads, totalCount: 1, hasMore: false }),
      createLead: jest.fn(),
      getLeadsByStage: jest.fn(),
      updateLead: jest.fn(),
      deleteLead: jest.fn(),
      searchLeads: jest.fn(),
      getLeadById: jest.fn(),
    } as unknown as IDataService;

    (dataService.createLead as jest.Mock).mockReturnValue(new Promise<ILead>(() => { /* keep pending */ }));

    mockUseAppContext.mockReturnValue({
      dataService,
      currentUser: { email: 'test@hbc.com', displayName: 'Tester' },
      isFeatureEnabled: (name: string) => name === 'OptimisticMutationsEnabled' || name === 'OptimisticMutations_Leads',
    });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const { result } = renderHook(() => useLeads(), { wrapper: createWrapper(queryClient) });

    await act(async () => {
      await result.current.fetchLeads();
    });

    act(() => {
      void result.current.createLead(createPayload);
    });

    await waitFor(() => {
      expect(result.current.leads.some((lead) => lead.id < 0)).toBe(true);
    });
  });
});

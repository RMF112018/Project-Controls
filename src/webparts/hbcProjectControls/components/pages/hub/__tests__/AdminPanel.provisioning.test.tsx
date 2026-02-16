import * as React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { ProvisioningStatus } from '@hbc/sp-services';
import type { IProvisioningLog, IFeatureFlag } from '@hbc/sp-services';
import { renderWithProviders, createComponentMockDataService } from '../../../../../../__tests__/test-utils';

// --- Module mocks (must be before component import) ---

// Mock SignalR hooks/context used by AdminPanel and its sub-hooks
jest.mock('../../../hooks/useSignalR', () => ({
  useSignalR: () => ({ isEnabled: false, connectionStatus: 'Disconnected' }),
}));

jest.mock('../../../contexts/SignalRContext', () => ({
  SignalRProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSignalRContext: () => ({
    connectionStatus: 'Disconnected',
    isEnabled: false,
    subscribe: jest.fn(() => jest.fn()),
    broadcastChange: jest.fn(),
  }),
}));

// Mock heavy sub-tabs to keep the test focused on provisioning
jest.mock('../WorkflowDefinitionsPanel', () => ({
  WorkflowDefinitionsPanel: () => <div data-testid="mock-workflows">WorkflowDefinitionsPanel</div>,
}));

jest.mock('../PermissionTemplateEditor', () => ({
  PermissionTemplateEditor: () => <div data-testid="mock-permissions">PermissionTemplateEditor</div>,
}));

jest.mock('../ProjectAssignmentsPanel', () => ({
  ProjectAssignmentsPanel: () => <div data-testid="mock-assignments">ProjectAssignmentsPanel</div>,
}));

// Mock ProvisioningService constructor to avoid PnP.js deps
jest.mock('@hbc/sp-services', () => {
  const actual = jest.requireActual('@hbc/sp-services');
  return {
    ...actual,
    ProvisioningService: jest.fn().mockImplementation(() => ({
      retryFromStep: jest.fn().mockResolvedValue(undefined),
      retryHubNavLink: jest.fn().mockResolvedValue(undefined),
    })),
    MockHubNavigationService: jest.fn().mockImplementation(() => ({})),
  };
});

import { AdminPanel } from '../AdminPanel';

function createProvLog(overrides: Partial<IProvisioningLog> = {}): IProvisioningLog {
  return {
    id: 1,
    projectCode: '25-042-01',
    projectName: 'Test Project Alpha',
    leadId: 100,
    status: ProvisioningStatus.Completed,
    currentStep: 7,
    completedSteps: 7,
    retryCount: 0,
    requestedBy: 'admin@test.com',
    requestedAt: '2026-02-16T10:00:00.000Z',
    ...overrides,
  };
}

function createFlag(overrides: Partial<IFeatureFlag> = {}): IFeatureFlag {
  return {
    id: 1,
    FeatureName: 'ProvisioningRealOps',
    DisplayName: 'Provisioning Real Operations',
    Enabled: false,
    Category: 'Infrastructure' as IFeatureFlag['Category'],
    Notes: '',
    TargetDate: '',
    ...overrides,
  } as IFeatureFlag;
}

describe('AdminPanel — Provisioning Tab', () => {
  it('shows empty state when no logs', async () => {
    const dataService = createComponentMockDataService({
      getProvisioningLogs: jest.fn().mockResolvedValue([]),
    });

    renderWithProviders(<AdminPanel />, {
      initialEntries: ['/admin?tab=provisioning'],
      dataService,
    });

    await waitFor(() => {
      expect(screen.getByText('No Provisioning Requests')).toBeInTheDocument();
    });
  });

  it('renders provisioning logs in table', async () => {
    const logs = [
      createProvLog({ id: 1, projectCode: '25-042-01', projectName: 'Alpha' }),
      createProvLog({ id: 2, projectCode: '25-043-02', projectName: 'Beta' }),
    ];
    const dataService = createComponentMockDataService({
      getProvisioningLogs: jest.fn().mockResolvedValue(logs),
    });

    renderWithProviders(<AdminPanel />, {
      initialEntries: ['/admin?tab=provisioning'],
      dataService,
    });

    await waitFor(() => {
      expect(screen.getByText('25-042-01')).toBeInTheDocument();
      expect(screen.getByText('25-043-02')).toBeInTheDocument();
    });
  });

  it('shows "Simulation" badge when ProvisioningRealOps disabled', async () => {
    const dataService = createComponentMockDataService({
      getProvisioningLogs: jest.fn().mockResolvedValue([]),
      getFeatureFlags: jest.fn().mockResolvedValue([
        createFlag({ FeatureName: 'ProvisioningRealOps', Enabled: false }),
      ]),
    });

    renderWithProviders(<AdminPanel />, {
      initialEntries: ['/admin?tab=provisioning'],
      dataService,
    });

    await waitFor(() => {
      expect(screen.getByText('Simulation')).toBeInTheDocument();
    });
  });

  it('shows "Live" badge when ProvisioningRealOps enabled', async () => {
    const dataService = createComponentMockDataService({
      getProvisioningLogs: jest.fn().mockResolvedValue([]),
      getFeatureFlags: jest.fn().mockResolvedValue([
        createFlag({ FeatureName: 'ProvisioningRealOps', Enabled: true }),
      ]),
    });

    renderWithProviders(<AdminPanel />, {
      initialEntries: ['/admin?tab=provisioning'],
      dataService,
    });

    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument();
    });
  });

  it('shows Retry button on Failed logs', async () => {
    const logs = [
      createProvLog({
        status: ProvisioningStatus.Failed,
        completedSteps: 2,
        failedStep: 3,
        errorMessage: 'Site creation throttled',
      }),
    ];
    const dataService = createComponentMockDataService({
      getProvisioningLogs: jest.fn().mockResolvedValue(logs),
    });

    renderWithProviders(<AdminPanel />, {
      initialEntries: ['/admin?tab=provisioning'],
      dataService,
    });

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('shows "Retry Nav" on completed log with failed hubNavLinkStatus', async () => {
    const logs = [
      createProvLog({
        status: ProvisioningStatus.Completed,
        completedSteps: 7,
        hubNavLinkStatus: 'failed',
      }),
    ];
    const dataService = createComponentMockDataService({
      getProvisioningLogs: jest.fn().mockResolvedValue(logs),
    });

    renderWithProviders(<AdminPanel />, {
      initialEntries: ['/admin?tab=provisioning'],
      dataService,
    });

    await waitFor(() => {
      expect(screen.getByText('Retry Nav')).toBeInTheDocument();
    });
  });

  it('Details button expands ProvisioningStatusView', async () => {
    const logs = [createProvLog({ projectCode: '25-042-01' })];
    const dataService = createComponentMockDataService({
      getProvisioningLogs: jest.fn().mockResolvedValue(logs),
      getProvisioningStatus: jest.fn().mockResolvedValue(createProvLog({ projectCode: '25-042-01' })),
    });

    renderWithProviders(<AdminPanel />, {
      initialEntries: ['/admin?tab=provisioning'],
      dataService,
    });

    await waitFor(() => {
      expect(screen.getByText('Details')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Details'));

    await waitFor(() => {
      expect(screen.getByText(/Provisioning Details: 25-042-01/)).toBeInTheDocument();
    });
  });

  it('permission gating shows denied message for non-admin users', async () => {
    const nonAdminUser = {
      id: 2,
      displayName: 'Regular User',
      email: 'user@hedrickbrothers.com',
      loginName: 'i:0#.f|membership|user@hedrickbrothers.com',
      roles: ['BD Representative' as const],
      permissions: new Set<string>(),
    };

    const dataService = createComponentMockDataService({
      getCurrentUser: jest.fn().mockResolvedValue(nonAdminUser),
      getProvisioningLogs: jest.fn().mockResolvedValue([]),
    });

    renderWithProviders(<AdminPanel />, {
      initialEntries: ['/admin?tab=provisioning'],
      dataService,
    });

    await waitFor(() => {
      expect(screen.getByText(/Access Restricted/)).toBeInTheDocument();
    });
  });
});

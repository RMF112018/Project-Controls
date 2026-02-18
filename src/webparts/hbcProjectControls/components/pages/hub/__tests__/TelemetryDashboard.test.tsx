/**
 * TelemetryDashboard.test.tsx
 *
 * Component tests for the TelemetryDashboard page.
 * All ECharts are mocked via src/__mocks__/ (echarts-for-react returns
 * <div data-testid="echarts-mock" data-chart-type="..." />).
 */
import * as React from 'react';
import { screen, waitFor } from '@testing-library/react';
import type { IFeatureFlag, IAuditEntry, IPerformanceLog } from '@hbc/sp-services';
import { AuditAction, EntityType } from '@hbc/sp-services';
import { renderWithProviders, createComponentMockDataService } from '../../../../../../__tests__/test-utils';

// Mock SignalR — not needed for this page
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

import { TelemetryDashboard } from '../TelemetryDashboard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeFeatureFlag(name: string, enabled: boolean): IFeatureFlag {
  return {
    id: 99,
    FeatureName: name,
    DisplayName: name,
    Enabled: enabled,
    Category: 'Debug' as IFeatureFlag['Category'],
    Notes: '',
    TargetDate: '',
    EnabledForRoles: undefined,
  } as IFeatureFlag;
}

function makeAuditEntry(overrides: Partial<IAuditEntry> = {}): IAuditEntry {
  return {
    id: 1,
    Timestamp: '2026-02-01T09:00:00Z',
    User: 'user@hbc.com',
    Action: AuditAction.LeadCreated,
    EntityType: EntityType.Lead,
    EntityId: '1',
    ProjectCode: 'HBC-001',
    Details: '',
    ...overrides,
  };
}

function makePerformanceLog(overrides: Partial<IPerformanceLog> = {}): IPerformanceLog {
  return {
    id: 1,
    Title: 'Load',
    Timestamp: '2026-02-01T09:00:00Z',
    UserEmail: 'user@hbc.com',
    SiteUrl: 'https://hbc.sharepoint.com',
    IsProjectSite: false,
    TotalLoadMs: 800,
    PnpInitMs: 200,
    ContextInitMs: 100,
    DataFetchMs: 400,
    RenderMs: 100,
    ProjectCode: undefined,
    WebPartVersion: '1.0',
    ...overrides,
  } as IPerformanceLog;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('TelemetryDashboard', () => {
  it('renders 8 ChartCard containers when data is available', async () => {
    const dataService = createComponentMockDataService({
      getPerformanceLogs: jest.fn().mockResolvedValue([makePerformanceLog()]),
      getAuditLog: jest.fn().mockResolvedValue([makeAuditEntry(), makeAuditEntry({ id: 2, User: 'other@hbc.com' })]),
      getFeatureFlags: jest.fn().mockResolvedValue([
        makeFeatureFlag('TelemetryDashboard', true),
        makeFeatureFlag('PermissionEngine', false),
      ]),
    });

    renderWithProviders(<TelemetryDashboard />, { dataService });

    await waitFor(() => {
      const cards = screen.getAllByTestId('chart-card');
      expect(cards).toHaveLength(8);
    });
  });

  it('renders chart containers plus empty-state messages together covering all 8 sections', async () => {
    const dataService = createComponentMockDataService({
      getPerformanceLogs: jest.fn().mockResolvedValue([makePerformanceLog()]),
      getAuditLog: jest.fn().mockResolvedValue([makeAuditEntry()]),
      getFeatureFlags: jest.fn().mockResolvedValue([makeFeatureFlag('PermissionEngine', false)]),
    });

    renderWithProviders(<TelemetryDashboard />, { dataService });

    await waitFor(() => {
      // Every chart section is either an echarts-mock OR an empty-state message
      const echartMocks = screen.queryAllByTestId('echarts-mock');
      const emptyMessages = screen.queryAllByText(/No .+ data available|No exceptions/i);
      // Total sections = 8 (each section renders exactly one of these)
      expect(echartMocks.length + emptyMessages.length).toBe(8);
    });
  });

  it('renders KPI row with 4 metric cards', async () => {
    const dataService = createComponentMockDataService({
      getPerformanceLogs: jest.fn().mockResolvedValue([makePerformanceLog({ TotalLoadMs: 1200 })]),
      getAuditLog: jest.fn().mockResolvedValue([makeAuditEntry(), makeAuditEntry({ id: 2, User: 'other@hbc.com' })]),
      getFeatureFlags: jest.fn().mockResolvedValue([makeFeatureFlag('PermissionEngine', false)]),
    });

    renderWithProviders(<TelemetryDashboard />, { dataService });

    await waitFor(() => {
      expect(screen.getByText('Avg Load Time')).toBeInTheDocument();
      expect(screen.getByText('Active Users (30d)')).toBeInTheDocument();
      expect(screen.getByText('Provisioning Success')).toBeInTheDocument();
      expect(screen.getByText('Total Events')).toBeInTheDocument();
    });
  });

  it('shows page title', async () => {
    const dataService = createComponentMockDataService({
      getPerformanceLogs: jest.fn().mockResolvedValue([]),
      getAuditLog: jest.fn().mockResolvedValue([]),
      getFeatureFlags: jest.fn().mockResolvedValue([makeFeatureFlag('PermissionEngine', false)]),
    });

    renderWithProviders(<TelemetryDashboard />, { dataService });

    await waitFor(() => {
      expect(screen.getByText('Telemetry Dashboard')).toBeInTheDocument();
    });
  });

  it('shows empty-state chart for error trend when no errors', async () => {
    const dataService = createComponentMockDataService({
      getPerformanceLogs: jest.fn().mockResolvedValue([]),
      getAuditLog: jest.fn().mockResolvedValue([]),
      getFeatureFlags: jest.fn().mockResolvedValue([makeFeatureFlag('PermissionEngine', false)]),
    });

    renderWithProviders(<TelemetryDashboard />, { dataService });

    await waitFor(() => {
      expect(screen.getByText('No exceptions in the selected period')).toBeInTheDocument();
    });
  });

  it('shows skeleton loader while data is loading', () => {
    // getAuditLog never resolves during this test
    const dataService = createComponentMockDataService({
      getPerformanceLogs: jest.fn().mockReturnValue(new Promise(() => { /* pending */ })),
      getAuditLog: jest.fn().mockReturnValue(new Promise(() => { /* pending */ })),
      getFeatureFlags: jest.fn().mockResolvedValue([makeFeatureFlag('PermissionEngine', false)]),
    });

    renderWithProviders(<TelemetryDashboard />, { dataService });

    // Skeleton renders immediately during loading
    expect(screen.queryByTestId('chart-card')).not.toBeInTheDocument();
  });

  it('computes unique user count correctly', async () => {
    const entries = [
      makeAuditEntry({ id: 1, User: 'alice@hbc.com' }),
      makeAuditEntry({ id: 2, User: 'alice@hbc.com' }), // duplicate
      makeAuditEntry({ id: 3, User: 'bob@hbc.com' }),
    ];
    const dataService = createComponentMockDataService({
      getPerformanceLogs: jest.fn().mockResolvedValue([]),
      getAuditLog: jest.fn().mockResolvedValue(entries),
      getFeatureFlags: jest.fn().mockResolvedValue([makeFeatureFlag('PermissionEngine', false)]),
    });

    renderWithProviders(<TelemetryDashboard />, { dataService });

    await waitFor(() => {
      // 2 unique users: alice + bob
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('handles data service error gracefully — no crash', async () => {
    const dataService = createComponentMockDataService({
      getPerformanceLogs: jest.fn().mockRejectedValue(new Error('SP error')),
      getAuditLog: jest.fn().mockRejectedValue(new Error('SP error')),
      getFeatureFlags: jest.fn().mockResolvedValue([makeFeatureFlag('PermissionEngine', false)]),
    });

    // Should not throw
    expect(() => {
      renderWithProviders(<TelemetryDashboard />, { dataService });
    }).not.toThrow();

    // After error resolves, no crash
    await waitFor(() => {
      // Page still renders (no charts), no unhandled error
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});

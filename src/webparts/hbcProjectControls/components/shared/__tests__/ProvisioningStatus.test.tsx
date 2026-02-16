import * as React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { ProvisioningStatus as ProvStatus, PROVISIONING_STEPS } from '@hbc/sp-services';
import type { IProvisioningLog } from '@hbc/sp-services';
import { renderWithProviders, createComponentMockDataService } from '../../../../../__tests__/test-utils';
import { ProvisioningStatusView } from '../ProvisioningStatus';

// Mock useSignalR — returns disabled SignalR by default
jest.mock('../../hooks/useSignalR', () => ({
  useSignalR: () => ({ isEnabled: false, connectionStatus: 'Disconnected' }),
}));

function createLog(overrides: Partial<IProvisioningLog> = {}): IProvisioningLog {
  return {
    id: 1,
    projectCode: '25-042-01',
    projectName: 'Test Project',
    leadId: 100,
    status: ProvStatus.Queued,
    currentStep: 0,
    completedSteps: 0,
    retryCount: 0,
    requestedBy: 'admin@test.com',
    requestedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('ProvisioningStatusView', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders loading spinner when fetching', async () => {
    // getProvisioningStatus returns a never-resolving promise
    const dataService = createComponentMockDataService({
      getProvisioningStatus: jest.fn().mockReturnValue(new Promise(() => {})),
    });

    renderWithProviders(
      <ProvisioningStatusView projectCode="25-042-01" pollInterval={0} />,
      { dataService }
    );

    await waitFor(() => {
      expect(screen.getByText('Loading provisioning status...')).toBeInTheDocument();
    });
  });

  it('shows "No provisioning record found" when null', async () => {
    const dataService = createComponentMockDataService({
      getProvisioningStatus: jest.fn().mockResolvedValue(null),
    });

    renderWithProviders(
      <ProvisioningStatusView projectCode="25-042-01" pollInterval={0} />,
      { dataService }
    );

    await waitFor(() => {
      expect(screen.getByText('No provisioning record found.')).toBeInTheDocument();
    });
  });

  it('renders all 7 step labels', async () => {
    const log = createLog({ status: ProvStatus.Queued });

    renderWithProviders(
      <ProvisioningStatusView projectCode="25-042-01" log={log} pollInterval={0} />,
      {}
    );

    await waitFor(() => {
      for (const { step, label } of PROVISIONING_STEPS) {
        expect(screen.getByText(`Step ${step}: ${label}`)).toBeInTheDocument();
      }
    });
  });

  it('shows completed checkmarks and current step indicator', async () => {
    const log = createLog({
      status: ProvStatus.InProgress,
      currentStep: 3,
      completedSteps: 2,
      requestedAt: new Date().toISOString(),
    });

    const { container } = renderWithProviders(
      <ProvisioningStatusView projectCode="25-042-01" log={log} pollInterval={0} />,
      {}
    );

    await waitFor(() => {
      // Steps 1-2 should have checkmark (✓ = &#10003;)
      const checkmarks = container.querySelectorAll('span');
      const checkmarkChars = Array.from(checkmarks).filter(el => el.textContent === '\u2713');
      expect(checkmarkChars.length).toBe(2);

      // Step 3 should have current indicator (● = &#9679;)
      const bullets = Array.from(checkmarks).filter(el => el.textContent === '\u25CF');
      expect(bullets.length).toBe(1);
    });
  });

  it('displays error message on failed step', async () => {
    const log = createLog({
      status: ProvStatus.Failed,
      currentStep: 2,
      completedSteps: 1,
      failedStep: 2,
      errorMessage: 'Throttled by SharePoint',
    });

    renderWithProviders(
      <ProvisioningStatusView projectCode="25-042-01" log={log} pollInterval={0} />,
      {}
    );

    await waitFor(() => {
      expect(screen.getByText('Throttled by SharePoint')).toBeInTheDocument();
    });
  });

  it('shows site URL link when Completed', async () => {
    const log = createLog({
      status: ProvStatus.Completed,
      completedSteps: 7,
      siteUrl: 'https://tenant.sharepoint.com/sites/25-042-01',
    });

    renderWithProviders(
      <ProvisioningStatusView projectCode="25-042-01" log={log} pollInterval={0} />,
      {}
    );

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /25-042-01/ });
      expect(link).toHaveAttribute('href', 'https://tenant.sharepoint.com/sites/25-042-01');
    });
  });

  it('external log skips polling', async () => {
    const log = createLog({ status: ProvStatus.Queued });
    const dataService = createComponentMockDataService();

    renderWithProviders(
      <ProvisioningStatusView projectCode="25-042-01" log={log} pollInterval={800} />,
      { dataService }
    );

    // When an external log is provided, getProvisioningStatus should NOT be called
    await waitFor(() => {
      expect(screen.getByText('Step 1: Create SharePoint Site')).toBeInTheDocument();
    });

    expect(dataService.getProvisioningStatus).not.toHaveBeenCalled();
  });

  it('compact mode hides title and metadata', async () => {
    const log = createLog({
      status: ProvStatus.InProgress,
      currentStep: 1,
      completedSteps: 0,
      division: 'South Florida',
      region: 'Miami',
      requestedAt: new Date().toISOString(),
    });

    renderWithProviders(
      <ProvisioningStatusView projectCode="25-042-01" log={log} compact pollInterval={0} />,
      {}
    );

    await waitFor(() => {
      // Step labels should still render
      expect(screen.getByText('Step 1: Create SharePoint Site')).toBeInTheDocument();
    });

    // "Site Provisioning" title should NOT be in the DOM in compact mode
    expect(screen.queryByText('Site Provisioning')).not.toBeInTheDocument();
    // Division/region metadata should NOT render in compact mode
    expect(screen.queryByText('South Florida')).not.toBeInTheDocument();
    expect(screen.queryByText('Miami')).not.toBeInTheDocument();
  });
});

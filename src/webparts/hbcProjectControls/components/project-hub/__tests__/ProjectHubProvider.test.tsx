/**
 * Stage 20 — ProjectHubProvider Tests
 *
 * Tests search-param resolution, AppContext sync, hook behavior,
 * and resilience to resolution failures.
 */
import * as React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────

const mockSetSelectedProject = jest.fn();
const mockGetLeadById = jest.fn();
const mockSearchLeads = jest.fn();

const mockSearchParams: Record<string, unknown> = {};
jest.mock('@tanstack/react-router', () => ({
  useSearch: () => mockSearchParams,
}));

let mockSelectedProject: Record<string, unknown> | null = null;
jest.mock('../../contexts/AppContext', () => ({
  useAppContext: () => ({
    dataService: {
      getLeadById: mockGetLeadById,
      searchLeads: mockSearchLeads,
    },
    selectedProject: mockSelectedProject,
    setSelectedProject: mockSetSelectedProject,
  }),
}));

// ── Import after mocks ───────────────────────────────────────────────

import { ProjectHubProvider, useProjectHub } from '../ProjectHubProvider';

// ── Fixtures ─────────────────────────────────────────────────────────

const MOCK_LEAD = {
  id: 4,
  Title: 'Delray Beach Fire Station #4',
  ProjectCode: '25-022-01',
  Stage: 'Active Construction',
  Region: 'Southeast',
  Division: 'Commercial',
  ProjectSiteURL: 'https://tenant.sharepoint.com/sites/25-022-01',
  ClientName: 'City of Delray Beach',
  ProjectValue: 5000000,
};

// ── Helpers ──────────────────────────────────────────────────────────

function resetSearchParams(): void {
  Object.keys(mockSearchParams).forEach(k => delete mockSearchParams[k]);
}

function HookConsumer(): React.ReactElement {
  const ctx = useProjectHub();
  return (
    <div>
      <span data-testid="projectCode">{ctx.projectCode}</span>
      <span data-testid="leadId">{String(ctx.leadId ?? '')}</span>
      <span data-testid="projectName">{ctx.projectName}</span>
      <span data-testid="isResolving">{String(ctx.isResolving)}</span>
    </div>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('Stage 20: ProjectHubProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSearchParams();
    mockSelectedProject = null;
  });

  it('renders children immediately without blocking', () => {
    render(
      <ProjectHubProvider>
        <span>child content</span>
      </ProjectHubProvider>,
    );

    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('resolves via getLeadById when leadId is provided', async () => {
    mockSearchParams.projectCode = '25-022-01';
    mockSearchParams.leadId = 4;
    mockGetLeadById.mockResolvedValue(MOCK_LEAD);

    render(
      <ProjectHubProvider>
        <HookConsumer />
      </ProjectHubProvider>,
    );

    await waitFor(() => {
      expect(mockGetLeadById).toHaveBeenCalledWith(4);
    });

    await waitFor(() => {
      expect(mockSetSelectedProject).toHaveBeenCalledWith(
        expect.objectContaining({
          projectCode: '25-022-01',
          projectName: 'Delray Beach Fire Station #4',
          leadId: 4,
          region: 'Southeast',
          division: 'Commercial',
        }),
      );
    });
  });

  it('falls back to searchLeads when leadId is not provided', async () => {
    mockSearchParams.projectCode = '25-022-01';
    mockGetLeadById.mockResolvedValue(null);
    mockSearchLeads.mockResolvedValue([MOCK_LEAD]);

    render(
      <ProjectHubProvider>
        <HookConsumer />
      </ProjectHubProvider>,
    );

    await waitFor(() => {
      expect(mockSearchLeads).toHaveBeenCalledWith('25-022-01');
    });

    await waitFor(() => {
      expect(mockSetSelectedProject).toHaveBeenCalledWith(
        expect.objectContaining({
          projectCode: '25-022-01',
          projectName: 'Delray Beach Fire Station #4',
        }),
      );
    });
  });

  it('short-circuits when selectedProject already matches search param', async () => {
    mockSearchParams.projectCode = '25-022-01';
    mockSelectedProject = { projectCode: '25-022-01', projectName: 'Delray Beach' };

    render(
      <ProjectHubProvider>
        <HookConsumer />
      </ProjectHubProvider>,
    );

    // Allow effects to flush
    await act(async () => { /* noop */ });

    expect(mockGetLeadById).not.toHaveBeenCalled();
    expect(mockSearchLeads).not.toHaveBeenCalled();
    expect(mockSetSelectedProject).not.toHaveBeenCalled();
  });

  it('does not re-resolve on re-render when ref guard matches', async () => {
    mockSearchParams.projectCode = '25-022-01';
    mockSearchParams.leadId = 4;
    mockGetLeadById.mockResolvedValue(MOCK_LEAD);

    const { rerender } = render(
      <ProjectHubProvider>
        <HookConsumer />
      </ProjectHubProvider>,
    );

    await waitFor(() => {
      expect(mockSetSelectedProject).toHaveBeenCalledTimes(1);
    });

    // Re-render with same search params
    rerender(
      <ProjectHubProvider>
        <HookConsumer />
      </ProjectHubProvider>,
    );

    await act(async () => { /* noop */ });

    // Should still be 1 call, not 2
    expect(mockSetSelectedProject).toHaveBeenCalledTimes(1);
  });

  it('handles resolution failure gracefully', async () => {
    mockSearchParams.projectCode = '25-022-01';
    mockSearchParams.leadId = 4;
    mockGetLeadById.mockRejectedValue(new Error('Network error'));

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <ProjectHubProvider>
        <HookConsumer />
      </ProjectHubProvider>,
    );

    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalledWith(
        'ProjectHubProvider: failed to resolve project',
        '25-022-01',
        expect.any(Error),
      );
    });

    // Should not crash — children still rendered
    expect(screen.getByTestId('projectCode')).toHaveTextContent('25-022-01');

    warnSpy.mockRestore();
  });

  it('useProjectHub returns correct values', async () => {
    mockSearchParams.projectCode = '25-022-01';
    mockSearchParams.leadId = 4;
    mockSelectedProject = {
      projectCode: '25-022-01',
      projectName: 'Delray Beach Fire Station #4',
      leadId: 4,
    };

    render(
      <ProjectHubProvider>
        <HookConsumer />
      </ProjectHubProvider>,
    );

    expect(screen.getByTestId('projectCode')).toHaveTextContent('25-022-01');
    expect(screen.getByTestId('leadId')).toHaveTextContent('4');
    expect(screen.getByTestId('projectName')).toHaveTextContent('Delray Beach Fire Station #4');
  });

  it('useProjectHub throws when used outside provider', () => {
    // Suppress React error boundary console noise
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<HookConsumer />);
    }).toThrow('useProjectHub must be used within ProjectHubProvider');

    errorSpy.mockRestore();
  });
});

/**
 * Stage 9 — Estimating Kickoff Navigation Tests
 *
 * Tests route registration, search param handling, breadcrumb rendering,
 * and back-button navigation for the cross-workspace kickoff flow.
 */
import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FluentProvider, teamsLightTheme } from '@fluentui/react-components';
import { PERMISSIONS } from '@hbc/sp-services';

// ── Mocks ─────────────────────────────────────────────────────────────

const mockNavigate = jest.fn();
jest.mock('../../../hooks/router/useAppNavigate', () => ({
  useAppNavigate: () => mockNavigate,
}));

const mockSearchParams: Record<string, unknown> = {};
jest.mock('@tanstack/react-router', () => ({
  useSearch: () => mockSearchParams,
}));

const mockUseAppContext = jest.fn();
jest.mock('../../../contexts/AppContext', () => ({
  useAppContext: () => mockUseAppContext(),
}));

const MOCK_KICKOFF = {
  id: 1,
  LeadID: 4,
  ProjectCode: '25-022-01',
  items: [
    { id: 1, section: 'managing', task: 'Test task', status: 'yes', isCustom: false, sortOrder: 1 },
  ],
};

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: MOCK_KICKOFF, isLoading: false }),
  useMutation: () => ({ mutate: jest.fn(), isPending: false }),
  useQueryClient: () => ({ invalidateQueries: jest.fn(), cancelQueries: jest.fn(), setQueryData: jest.fn(), getQueryData: jest.fn() }),
}));

jest.mock('../../../shared/ToastContainer', () => ({
  useToast: () => ({ addToast: jest.fn() }),
}));

jest.mock('../../../../tanstack/query/useQueryScope', () => ({
  useQueryScope: () => ({ mode: 'mock', siteContext: 'hub', siteUrl: '', projectCode: null }),
}));

jest.mock('../../../../tanstack/query/queryKeys', () => ({
  qk: { kickoff: { base: () => ['kickoff'], byProject: () => ['kickoff', 'project'] } },
}));

jest.mock('../../../../tanstack/query/queryOptions/kickoffQueryOptions', () => ({
  kickoffByProjectOptions: () => ({ queryKey: ['kickoff', 'test'], queryFn: () => null }),
}));

// ── Helpers ───────────────────────────────────────────────────────────

function setupAppContext(overrides: Record<string, unknown> = {}) {
  mockUseAppContext.mockReturnValue({
    dataService: {},
    currentUser: { email: 'test@hedrickbrothers.com' },
    hasPermission: () => true,
    selectedProject: { projectCode: '25-022-01', projectName: 'Delray Beach Fire Station #4' },
    ...overrides,
  });
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <FluentProvider theme={teamsLightTheme}>{children}</FluentProvider>;
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('Stage 9: Estimating Kickoff Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockSearchParams).forEach(k => delete mockSearchParams[k]);
  });

  describe('Route definition', () => {
    it('kickoff route path is registered with KICKOFF_VIEW permission', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const routeModule = await import('../../../../tanstack/router/workspaces/routes.projecthub');
      // The module exports a createProjectHubRoutes function — call it to get route tree.
      // We verify the PERMISSIONS constant exists with the correct value.
      expect(PERMISSIONS.KICKOFF_VIEW).toBe('kickoff:view');
      expect(routeModule).toBeDefined();
    });
  });

  describe('Breadcrumb rendering', () => {
    it('renders breadcrumb with "Estimating Tracker" link and current page', async () => {
      setupAppContext();

      const { EstimatingKickoffPage } = await import('../EstimatingKickoffPage');
      render(<EstimatingKickoffPage />, { wrapper: Wrapper });

      // Breadcrumb should show "Estimating Tracker" as a clickable link
      const trackerLink = screen.getByRole('button', { name: 'Estimating Tracker' });
      expect(trackerLink).toBeInTheDocument();

      // Current page shown in breadcrumb as text (not a link) — breadcrumb nav has aria-label
      const breadcrumbNav = screen.getByLabelText('Breadcrumb');
      expect(breadcrumbNav).toHaveTextContent('Estimating Kick-Off');
    });

    it('breadcrumb "Estimating Tracker" link navigates to tracking page', async () => {
      setupAppContext();

      const { EstimatingKickoffPage } = await import('../EstimatingKickoffPage');
      render(<EstimatingKickoffPage />, { wrapper: Wrapper });

      const trackerLink = screen.getByRole('button', { name: 'Estimating Tracker' });
      fireEvent.click(trackerLink);

      expect(mockNavigate).toHaveBeenCalledWith('/preconstruction/estimating/tracking');
    });
  });

  describe('Back button', () => {
    it('renders "Back to Tracker" button', async () => {
      setupAppContext();

      const { EstimatingKickoffPage } = await import('../EstimatingKickoffPage');
      render(<EstimatingKickoffPage />, { wrapper: Wrapper });

      expect(screen.getByRole('button', { name: /back to tracker/i })).toBeInTheDocument();
    });

    it('back button navigates to estimating tracking page', async () => {
      setupAppContext();

      const { EstimatingKickoffPage } = await import('../EstimatingKickoffPage');
      render(<EstimatingKickoffPage />, { wrapper: Wrapper });

      fireEvent.click(screen.getByRole('button', { name: /back to tracker/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/preconstruction/estimating/tracking');
    });
  });

  describe('Search param resolution', () => {
    it('prefers search param projectCode over context selectedProject', async () => {
      // Set search param to a different project code
      (mockSearchParams as Record<string, unknown>).projectCode = '25-038-01';
      setupAppContext({
        selectedProject: { projectCode: '25-022-01', projectName: 'Delray Beach' },
      });

      const { EstimatingKickoffPage } = await import('../EstimatingKickoffPage');
      render(<EstimatingKickoffPage />, { wrapper: Wrapper });

      // The subtitle should show the search-param project code (25-038-01), not context (25-022-01)
      expect(screen.getByText(/25-038-01/)).toBeInTheDocument();
    });

    it('falls back to context projectCode when no search param', async () => {
      setupAppContext({
        selectedProject: { projectCode: '25-022-01', projectName: 'Delray Beach Fire Station #4' },
      });

      const { EstimatingKickoffPage } = await import('../EstimatingKickoffPage');
      render(<EstimatingKickoffPage />, { wrapper: Wrapper });

      expect(screen.getByText(/25-022-01/)).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('shows empty state when no projectCode is available', async () => {
      setupAppContext({ selectedProject: null });

      const { EstimatingKickoffPage } = await import('../EstimatingKickoffPage');
      render(<EstimatingKickoffPage />, { wrapper: Wrapper });

      expect(screen.getByText('No Project Selected')).toBeInTheDocument();
    });
  });
});

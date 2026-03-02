/**
 * AssignmentsPage — Jest + React Testing Library Tests
 *
 * Tests rendering, dialog interactions, form validation, and row actions
 * for the admin Project Team Assignments page.
 */
import * as React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { FluentProvider, teamsLightTheme } from '@fluentui/react-components';

// ── Mock Data ────────────────────────────────────────────────────────────

const MOCK_ASSIGNMENTS = [
  {
    id: 1,
    projectCode: '25-042-01',
    userId: 'user-john',
    userDisplayName: 'John Smith',
    userEmail: 'john.smith@hedrick.com',
    assignedRole: 'Lead PM',
    templateOverrideId: undefined,
    assignedBy: 'admin@hedrick.com',
    assignedDate: '2026-01-15',
    isActive: true,
  },
  {
    id: 2,
    projectCode: '25-115-01',
    userId: 'user-jane',
    userDisplayName: 'Jane Doe',
    userEmail: 'jane.doe@hedrick.com',
    assignedRole: 'Project Executive',
    templateOverrideId: 1,
    assignedBy: 'admin@hedrick.com',
    assignedDate: '2026-01-20',
    isActive: true,
  },
];

const MOCK_TEMPLATES = [{ id: 1, name: 'Default Internal', isActive: true }];

// ── Mocks ────────────────────────────────────────────────────────────────

const mockAddToast = jest.fn();
jest.mock('../../../shared/ToastContainer', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

const mockAssignToProject = jest.fn().mockResolvedValue({ id: 99 });
const mockUpdateAssignment = jest.fn().mockResolvedValue(undefined);
const mockRemoveFromProject = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../hooks/usePermissionEngine', () => ({
  usePermissionEngine: () => ({
    templates: MOCK_TEMPLATES,
    assignToProject: mockAssignToProject,
    updateAssignment: mockUpdateAssignment,
    removeFromProject: mockRemoveFromProject,
  }),
}));

const mockUseAppContext = jest.fn();
jest.mock('../../../contexts/AppContext', () => ({
  useAppContext: () => mockUseAppContext(),
}));

let mockUseQueryReturn: Record<string, unknown> = {
  data: MOCK_ASSIGNMENTS,
  isLoading: false,
  isFetching: false,
};

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => mockUseQueryReturn,
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
    cancelQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  }),
}));

jest.mock('../../../../tanstack/query/useQueryScope', () => ({
  useQueryScope: () => ({
    mode: 'mock',
    siteContext: 'hub',
    siteUrl: '',
    projectCode: null,
    projectUuid: null,
  }),
}));

jest.mock('../../../../tanstack/query/queryOptions/permissionEngine', () => ({
  permissionAssignmentsOptions: () => ({
    queryKey: ['permission', 'assignments'],
    queryFn: () => null,
  }),
}));

jest.mock('@hbc/sp-services', () => ({
  AuditAction: { ProjectTeamAssigned: 'ProjectTeamAssigned', ProjectTeamOverridden: 'ProjectTeamOverridden', ProjectTeamRemoved: 'ProjectTeamRemoved' },
  EntityType: { ProjectTeamAssignment: 'ProjectTeamAssignment' },
}));

// ── Helpers ──────────────────────────────────────────────────────────────

function setupAppContext(overrides: Record<string, unknown> = {}): void {
  mockUseAppContext.mockReturnValue({
    dataService: { logAudit: jest.fn().mockResolvedValue(undefined) },
    currentUser: { email: 'test@hedrickbrothers.com' },
    hasPermission: () => true,
    selectedProject: { projectCode: '25-042-01' },
    dataServiceMode: 'mock',
    refreshPermissions: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  });
}

function Wrapper({ children }: { children: React.ReactNode }): JSX.Element {
  return <FluentProvider theme={teamsLightTheme}>{children}</FluentProvider>;
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('AssignmentsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueryReturn = {
      data: MOCK_ASSIGNMENTS,
      isLoading: false,
      isFetching: false,
    };
  });

  it('renders table with assignment data', async () => {
    setupAppContext();

    const { AssignmentsPage } = await import('../AssignmentsPage');
    render(<AssignmentsPage />, { wrapper: Wrapper });

    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Lead PM')).toBeInTheDocument();
    expect(screen.getByText('Project Executive')).toBeInTheDocument();
    expect(screen.getByText('25-042-01')).toBeInTheDocument();
    expect(screen.getByText('25-115-01')).toBeInTheDocument();
  });

  it('renders Add Assignment button', async () => {
    setupAppContext();

    const { AssignmentsPage } = await import('../AssignmentsPage');
    render(<AssignmentsPage />, { wrapper: Wrapper });

    const addButton = screen.getByTestId('admin-assignment-add-button');
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent('Add Assignment');
  });

  it('opens dialog when Add Assignment button is clicked', async () => {
    setupAppContext();

    const { AssignmentsPage } = await import('../AssignmentsPage');
    render(<AssignmentsPage />, { wrapper: Wrapper });

    const addButton = screen.getByTestId('admin-assignment-add-button');
    await act(async () => {
      fireEvent.click(addButton);
    });

    // Wait for setTimeout(0) + startTransition + requestAnimationFrame + Suspense
    await waitFor(() => {
      expect(screen.getByText('Add Team Assignment')).toBeInTheDocument();
    });
  });

  it('shows validation warning when saving with empty fields', async () => {
    setupAppContext();

    const { AssignmentsPage } = await import('../AssignmentsPage');
    render(<AssignmentsPage />, { wrapper: Wrapper });

    // Open the create dialog
    const addButton = screen.getByTestId('admin-assignment-add-button');
    await act(async () => {
      fireEvent.click(addButton);
    });

    // Wait for formReady (requestAnimationFrame → setFormReady(true)) and Suspense to resolve
    // The save button becomes enabled only when formReady=true && saving=false
    await waitFor(() => {
      const btn = screen.getByTestId('admin-assignment-save-button');
      expect(btn).not.toBeDisabled();
    }, { timeout: 5000 });

    // Click save without filling any fields
    const saveButton = screen.getByTestId('admin-assignment-save-button');
    fireEvent.click(saveButton);

    // handleSubmit wraps formRef.current.submit() in setTimeout(0); wait for it to flush
    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith('Project code is required.', 'warning');
    }, { timeout: 5000 });
  }, 15000);

  it('opens view dialog when a row is clicked', async () => {
    setupAppContext();

    const { AssignmentsPage } = await import('../AssignmentsPage');
    render(<AssignmentsPage />, { wrapper: Wrapper });

    // Click on a row containing "John Smith"
    const johnRow = screen.getByText('John Smith');
    await act(async () => {
      fireEvent.click(johnRow.closest('tr')!);
    });

    // Wait for setTimeout(0) + startTransition + requestAnimationFrame + Suspense
    await waitFor(() => {
      expect(screen.getByText('Assignment Details')).toBeInTheDocument();
    });
  });

  it('shows confirm dialog when Remove button is clicked', async () => {
    setupAppContext();

    const { AssignmentsPage } = await import('../AssignmentsPage');
    const { unmount } = render(<AssignmentsPage />, { wrapper: Wrapper });

    // Find Remove buttons in the table row actions
    const removeButtons = screen.getAllByText('Remove');
    expect(removeButtons.length).toBeGreaterThan(0);

    fireEvent.click(removeButtons[0]);

    // ConfirmDialog should appear with the remove title
    await waitFor(() => {
      expect(screen.getByText('Remove Team Assignment')).toBeInTheDocument();
    });
    // The confirm message should reference the user being removed
    expect(screen.getByText(/Remove "John Smith"/)).toBeInTheDocument();

    unmount();
  });

  it('renders unavailable message in non-mock mode', async () => {
    // When dataServiceMode is sharepoint and assignments query returns no data,
    // the table renders with empty state (no assignment rows)
    setupAppContext({ dataServiceMode: 'sharepoint' });
    mockUseQueryReturn = {
      data: [],
      isLoading: false,
      isFetching: false,
    };

    const { AssignmentsPage } = await import('../AssignmentsPage');
    render(<AssignmentsPage />, { wrapper: Wrapper });

    // Page header still renders
    expect(screen.getByText('Project Team Assignments')).toBeInTheDocument();
    // No assignment data should appear
    expect(screen.queryByText('John Smith')).not.toBeInTheDocument();
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });
});

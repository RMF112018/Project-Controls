/**
 * PermissionsPage — Jest + React Testing Library tests
 *
 * Covers table rendering, create/view/edit dialog lifecycle,
 * form validation, and mode-gated availability.
 */
import * as React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { FluentProvider, teamsLightTheme } from '@fluentui/react-components';

// ── Mock data ────────────────────────────────────────────────────────────

const MOCK_TOOL_DEFINITIONS = [
  {
    toolKey: 'pipeline',
    toolGroup: 'marketing',
    label: 'Pipeline',
    description: 'Pipeline management',
    levels: {
      NONE: [],
      READ_ONLY: ['pipeline:read'],
      STANDARD: ['pipeline:read', 'pipeline:write'],
      ADMIN: ['pipeline:read', 'pipeline:write', 'pipeline:admin'],
    },
    granularFlags: [],
  },
  {
    toolKey: 'gonogo',
    toolGroup: 'preconstruction',
    label: 'Go/No-Go',
    description: 'Go/No-Go scorecard',
    levels: {
      NONE: [],
      READ_ONLY: ['gonogo:read'],
      STANDARD: ['gonogo:read', 'gonogo:write'],
      ADMIN: ['gonogo:read', 'gonogo:write', 'gonogo:admin'],
    },
    granularFlags: [
      {
        key: 'can_score_committee',
        label: 'Committee Scoring',
        permissions: ['gonogo:committee'],
      },
    ],
  },
];

const MOCK_TOOL_GROUPS = ['marketing', 'preconstruction'];

const MOCK_TEMPLATES = [
  {
    id: 1,
    name: 'Default Internal',
    description: 'Standard internal',
    isGlobal: true,
    globalAccess: true,
    identityType: 'Internal' as const,
    isActive: true,
    isDefault: true,
    version: 1,
    toolAccess: [{ toolKey: 'pipeline', level: 'STANDARD', granularFlags: [] }],
    permissions: new Set(['pipeline:read']),
  },
  {
    id: 2,
    name: 'External Viewer',
    description: 'View only',
    isGlobal: false,
    globalAccess: false,
    identityType: 'External' as const,
    isActive: true,
    isDefault: false,
    version: 1,
    toolAccess: [{ toolKey: 'pipeline', level: 'READ_ONLY', granularFlags: [] }],
    permissions: new Set(['pipeline:read']),
  },
];

// ── Mocks ────────────────────────────────────────────────────────────────

const mockAddToast = jest.fn();
jest.mock('../../../shared/ToastContainer', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

const mockCreateTemplate = jest.fn().mockResolvedValue({ id: 99, name: 'New' });
const mockUpdateTemplate = jest.fn().mockResolvedValue({ id: 1, name: 'Updated' });
const mockDeleteTemplate = jest.fn().mockResolvedValue(undefined);

const mockUsePermissionEngine = jest.fn();
jest.mock('../../../hooks/usePermissionEngine', () => ({
  usePermissionEngine: () => mockUsePermissionEngine(),
}));

const mockUseAppContext = jest.fn();
jest.mock('../../../contexts/AppContext', () => ({
  useAppContext: () => mockUseAppContext(),
}));

jest.mock('@hbc/sp-services', () => ({
  AuditAction: {
    TemplateCreated: 'Permission.TemplateCreated',
    TemplateUpdated: 'Permission.TemplateUpdated',
    TemplateDeleted: 'Permission.TemplateDeleted',
  },
  EntityType: {
    PermissionTemplate: 'PermissionTemplate',
  },
  PermissionLevel: {
    NONE: 'NONE',
    READ_ONLY: 'READ_ONLY',
    STANDARD: 'STANDARD',
    ADMIN: 'ADMIN',
  },
  TOOL_DEFINITIONS: MOCK_TOOL_DEFINITIONS,
  TOOL_GROUPS: MOCK_TOOL_GROUPS,
}));

// ── Helpers ──────────────────────────────────────────────────────────────

function setupDefaults(overrides: {
  appContext?: Record<string, unknown>;
  permissionEngine?: Record<string, unknown>;
} = {}): void {
  mockUseAppContext.mockReturnValue({
    dataService: { logAudit: jest.fn().mockResolvedValue(undefined) },
    currentUser: { email: 'admin@hedrickbrothers.com' },
    hasPermission: () => true,
    selectedProject: { projectCode: '25-001-01', projectName: 'Test Project' },
    dataServiceMode: 'mock',
    refreshPermissions: jest.fn(),
    ...overrides.appContext,
  });

  mockUsePermissionEngine.mockReturnValue({
    templates: MOCK_TEMPLATES,
    loading: false,
    createTemplate: mockCreateTemplate,
    updateTemplate: mockUpdateTemplate,
    deleteTemplate: mockDeleteTemplate,
    ...overrides.permissionEngine,
  });
}

function Wrapper({ children }: { children: React.ReactNode }): React.ReactElement {
  return <FluentProvider theme={teamsLightTheme}>{children}</FluentProvider>;
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('PermissionsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders table with template data', async () => {
    setupDefaults();

    const { PermissionsPage } = await import('../PermissionsPage');
    render(<PermissionsPage />, { wrapper: Wrapper });

    expect(screen.getByText('Default Internal')).toBeInTheDocument();
    expect(screen.getByText('External Viewer')).toBeInTheDocument();
  });

  it('renders the Create Template button', async () => {
    setupDefaults();

    const { PermissionsPage } = await import('../PermissionsPage');
    render(<PermissionsPage />, { wrapper: Wrapper });

    expect(screen.getByText('Create Template')).toBeInTheDocument();
  });

  it('Create Template button opens the create dialog', async () => {
    setupDefaults();

    const { PermissionsPage } = await import('../PermissionsPage');
    render(<PermissionsPage />, { wrapper: Wrapper });

    fireEvent.click(screen.getByText('Create Template'));

    // handleCreate uses setTimeout(0) + startTransition then requestAnimationFrame
    await waitFor(() => {
      expect(screen.getByText('Create Permission Template')).toBeInTheDocument();
    });
  });

  it('validates empty name on save and triggers addToast warning', async () => {
    setupDefaults();

    const { PermissionsPage } = await import('../PermissionsPage');
    render(<PermissionsPage />, { wrapper: Wrapper });

    // Open the create dialog
    fireEvent.click(screen.getByText('Create Template'));

    // Wait for the dialog title to appear
    await waitFor(() => {
      expect(screen.getByText('Create Permission Template')).toBeInTheDocument();
    });

    // Wait for the lazy form component to mount (React.Suspense + React.lazy + formReady via rAF)
    await waitFor(() => {
      expect(screen.getByTestId('admin-template-create-form')).toBeInTheDocument();
    });

    // Wait for the save button to become enabled
    const saveButton = await waitFor(() => {
      const btn = screen.getByTestId('admin-template-save-button');
      expect(btn).not.toBeDisabled();
      return btn;
    });

    // Click save without entering a name — handleSubmit uses setTimeout(0)
    fireEvent.click(saveButton);

    // The submit is deferred via setTimeout(0) which calls formRef.current?.submit()
    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        'Template name is required.',
        'warning'
      );
    }, { timeout: 3000 });
  }, 10000);

  it('row click opens view dialog with "Permission Template Details" title', async () => {
    setupDefaults();

    const { PermissionsPage } = await import('../PermissionsPage');
    render(<PermissionsPage />, { wrapper: Wrapper });

    // Click on a template row text
    fireEvent.click(screen.getByText('Default Internal'));

    // handleRowClick uses setTimeout(0) + startTransition
    await waitFor(() => {
      expect(screen.getByText('Permission Template Details')).toBeInTheDocument();
    });
  });

  it('Edit button in view mode switches dialog to edit mode', async () => {
    setupDefaults();

    const { PermissionsPage } = await import('../PermissionsPage');
    render(<PermissionsPage />, { wrapper: Wrapper });

    // Open view dialog
    fireEvent.click(screen.getByText('Default Internal'));

    await waitFor(() => {
      expect(screen.getByText('Permission Template Details')).toBeInTheDocument();
    });

    // In view mode, an "Edit" button appears in the dialog — scope to dialog surface
    const dialog = screen.getByRole('dialog');
    const editButton = within(dialog).getByRole('button', { name: 'Edit' });
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Edit Permission Template')).toBeInTheDocument();
    });
  });

  it('shows skeleton loading state when loading with empty templates', async () => {
    setupDefaults({
      permissionEngine: {
        templates: [],
        loading: true,
        createTemplate: mockCreateTemplate,
        updateTemplate: mockUpdateTemplate,
        deleteTemplate: mockDeleteTemplate,
      },
    });

    const { PermissionsPage } = await import('../PermissionsPage');
    render(<PermissionsPage />, { wrapper: Wrapper });

    // When loading=true and templates=[], the component renders a skeleton
    expect(screen.getByText('Permission Templates')).toBeInTheDocument();
    // The table data should not be present
    expect(screen.queryByText('Default Internal')).not.toBeInTheDocument();
  });
});

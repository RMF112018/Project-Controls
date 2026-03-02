/**
 * DevUsersPage Tests
 *
 * Tests rendering, add/edit/view dialogs, form validation, and
 * non-mock mode unavailable message for the Dev Users admin page.
 */
import * as React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { FluentProvider, teamsLightTheme } from '@fluentui/react-components';

// ── Mocks ─────────────────────────────────────────────────────────────

const mockAddToast = jest.fn();
jest.mock('../../../shared/ToastContainer', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

const mockUseAppContext = jest.fn();
jest.mock('../../../contexts/AppContext', () => ({
  useAppContext: () => mockUseAppContext(),
  __esModule: true,
  default: React.createContext(null),
}));

jest.mock('@hbc/sp-services', () => ({
  CANONICAL_ROLES: [
    'Administrator',
    'Business Development Manager',
    'Estimator',
    'Commercial Operations Manager',
    'Leadership',
    'Preconstruction Manager',
  ],
}));

// ── Helpers ───────────────────────────────────────────────────────────

function setupAppContext(overrides: Record<string, unknown> = {}) {
  mockUseAppContext.mockReturnValue({
    dataServiceMode: 'mock',
    ...overrides,
  });
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <FluentProvider theme={teamsLightTheme}>{children}</FluentProvider>;
}

/**
 * Render the component and advance past the 300ms loading skeleton.
 * Uses fake timers only for the initial load, then switches to real
 * timers so that Dialog / Suspense / startTransition resolve naturally.
 */
async function renderAndLoad() {
  jest.useFakeTimers();
  const { DevUsersPage } = await import('../DevUsersPage');
  const result = render(<DevUsersPage />, { wrapper: Wrapper });

  // Advance past the 300ms loading timer
  await act(async () => {
    jest.advanceTimersByTime(400);
  });

  // Switch to real timers so Dialog / Suspense / startTransition work
  jest.useRealTimers();

  return result;
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('DevUsersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders table with mock user data', async () => {
    setupAppContext();

    await renderAndLoad();

    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Mike Johnson')).toBeInTheDocument();
  });

  it('renders Add User button', async () => {
    setupAppContext();

    await renderAndLoad();

    const addButton = screen.getByTestId('admin-user-add-button');
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent('Add User');
  });

  it('Add User opens dialog with "Create User" title', async () => {
    setupAppContext();

    await renderAndLoad();

    const addButton = screen.getByTestId('admin-user-add-button');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Create User' })).toBeInTheDocument();
    });
  });

  it('validates empty display name on save', async () => {
    setupAppContext();

    await renderAndLoad();

    // Open create dialog
    fireEvent.click(screen.getByTestId('admin-user-add-button'));

    // Wait for dialog and form to be ready
    await waitFor(() => {
      expect(screen.getByTestId('admin-user-save-button')).toBeInTheDocument();
    });

    // Wait for form to become enabled (formReady = true via requestAnimationFrame)
    await waitFor(() => {
      expect(screen.getByTestId('admin-user-save-button')).not.toBeDisabled();
    });

    // Click save without entering any data
    fireEvent.click(screen.getByTestId('admin-user-save-button'));

    // The handleSubmit uses setTimeout(0), so wait for validation
    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        'Display name is required.',
        'warning'
      );
    });
  });

  it('row click opens view dialog with "User Details" title', async () => {
    setupAppContext();

    await renderAndLoad();

    // Click on the row containing "John Smith"
    const johnSmithCell = screen.getByText('John Smith');
    const row = johnSmithCell.closest('tr');
    expect(row).toBeTruthy();
    fireEvent.click(row!);

    await waitFor(() => {
      expect(screen.getByText('User Details')).toBeInTheDocument();
    });
  });

  it('edit mode from view dialog shows "Edit User" title', async () => {
    setupAppContext();

    await renderAndLoad();

    // Click on a row to open view dialog
    const johnSmithCell = screen.getByText('John Smith');
    const row = johnSmithCell.closest('tr');
    fireEvent.click(row!);

    await waitFor(() => {
      expect(screen.getByText('User Details')).toBeInTheDocument();
    });

    // The dialog actions contain an "Edit" button; row actions also have "Edit" buttons.
    // Target the one inside the DialogActions (DialogSurface) specifically.
    const dialogSurface = screen.getByText('User Details').closest('[class*="DialogSurface"]')
      ?? screen.getByText('User Details').closest('[role="dialog"]');

    let editButton: HTMLElement;
    if (dialogSurface) {
      const buttons = Array.from(dialogSurface.querySelectorAll('button'));
      editButton = buttons.find(b => b.textContent?.trim() === 'Edit')!;
    } else {
      // Fallback: getAllByRole and pick the last Edit (dialog actions are rendered after row actions)
      const editButtons = screen.getAllByRole('button', { name: 'Edit' });
      editButton = editButtons[editButtons.length - 1];
    }

    expect(editButton).toBeTruthy();
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Edit User')).toBeInTheDocument();
    });
  });

  it('shows unavailable message in non-mock mode', async () => {
    setupAppContext({ dataServiceMode: 'sharepoint' });

    const { DevUsersPage } = await import('../DevUsersPage');
    render(<DevUsersPage />, { wrapper: Wrapper });

    expect(
      screen.getByText(/Dev Users is only available in mock mode/)
    ).toBeInTheDocument();
  });
});

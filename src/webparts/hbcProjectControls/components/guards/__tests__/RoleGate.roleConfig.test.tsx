import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { RoleName } from '@hbc/sp-services';
import type { ICurrentUser } from '@hbc/sp-services';
import { RoleGate } from '../RoleGate';

// Mock useAppContext to control currentUser in each test
const mockUseAppContext = jest.fn();
jest.mock('../../contexts/AppContext', () => ({
  useAppContext: () => mockUseAppContext(),
}));

function makeUser(roles: RoleName[], overrides: Partial<ICurrentUser> = {}): ICurrentUser {
  return {
    id: 1,
    displayName: 'Test User',
    email: 'test@hedrickbrothers.com',
    loginName: 'test@hedrickbrothers.com',
    roles,
    permissions: new Set<string>(),
    ...overrides,
  };
}

describe('RoleGate — Role Configuration Normalization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows access when user has matching canonical role (Admin maps from SharePointAdmin)', () => {
    // SharePointAdmin (legacy enum) normalizes to 'Admin'
    // User has 'Admin' as a role string — but RoleName.SharePointAdmin = 'SharePoint Admin'
    // normalizeRoleName('SharePoint Admin') → 'Admin', normalizeRoleName('Admin') → 'Admin' (pass-through)
    mockUseAppContext.mockReturnValue({
      currentUser: makeUser(['Admin' as RoleName]),
    });

    render(
      <RoleGate allowedRoles={[RoleName.SharePointAdmin]}>
        <div>Admin Content</div>
      </RoleGate>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('allows access when user has legacy role that maps to allowed canonical role', () => {
    // User has ExecutiveLeadership (legacy enum value 'Executive Leadership')
    // normalizeRoleName('Executive Leadership') → 'Leadership'
    // Allowed list uses 'Leadership' (canonical) — normalizeRoleName('Leadership') → 'Leadership'
    mockUseAppContext.mockReturnValue({
      currentUser: makeUser([RoleName.ExecutiveLeadership]),
    });

    render(
      <RoleGate allowedRoles={['Leadership' as RoleName]}>
        <div>Leadership Content</div>
      </RoleGate>
    );

    expect(screen.getByText('Leadership Content')).toBeInTheDocument();
  });

  it('allows access when allowed list uses legacy name and user has canonical', () => {
    // User has canonical 'Leadership' role
    // Allowed list has ExecutiveLeadership ('Executive Leadership')
    // normalizeRoleName('Leadership') → 'Leadership' (pass-through)
    // normalizeRoleName('Executive Leadership') → 'Leadership'
    // Both normalize to 'Leadership' → match
    mockUseAppContext.mockReturnValue({
      currentUser: makeUser(['Leadership' as RoleName]),
    });

    render(
      <RoleGate allowedRoles={[RoleName.ExecutiveLeadership]}>
        <div>Canonical User Content</div>
      </RoleGate>
    );

    expect(screen.getByText('Canonical User Content')).toBeInTheDocument();
  });

  it('blocks access when no role match after normalization', () => {
    // BD Representative normalizes to 'Business Development Manager'
    // Operations Team normalizes to 'Project Manager'
    // No overlap → blocked
    mockUseAppContext.mockReturnValue({
      currentUser: makeUser([RoleName.BDRepresentative]),
    });

    render(
      <RoleGate
        allowedRoles={[RoleName.OperationsTeam]}
        fallback={<div>Access Denied</div>}
      >
        <div>Protected Content</div>
      </RoleGate>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('renders fallback when user is null', () => {
    mockUseAppContext.mockReturnValue({
      currentUser: null,
    });

    render(
      <RoleGate
        allowedRoles={[RoleName.SharePointAdmin]}
        fallback={<div>Please log in</div>}
      >
        <div>Secret Content</div>
      </RoleGate>
    );

    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
    expect(screen.getByText('Please log in')).toBeInTheDocument();
  });

  it('renders children when any normalized role matches', () => {
    // IDS normalizes to 'Admin', Marketing normalizes to 'Business Development Manager'
    // Allowed list: SharePointAdmin → 'Admin', OperationsTeam → 'Project Manager'
    // IDS → 'Admin' matches SharePointAdmin → 'Admin'
    mockUseAppContext.mockReturnValue({
      currentUser: makeUser([RoleName.IDS, RoleName.Marketing]),
    });

    render(
      <RoleGate allowedRoles={[RoleName.SharePointAdmin, RoleName.OperationsTeam]}>
        <div>Accessible</div>
      </RoleGate>
    );

    expect(screen.getByText('Accessible')).toBeInTheDocument();
  });

  it('backward compatibility: existing RoleName enum values still work as before', () => {
    // Both user role and allowed role are the same legacy enum value
    // ExecutiveLeadership → 'Leadership', ExecutiveLeadership → 'Leadership' — match
    mockUseAppContext.mockReturnValue({
      currentUser: makeUser([RoleName.ExecutiveLeadership]),
    });

    render(
      <RoleGate allowedRoles={[RoleName.ExecutiveLeadership]}>
        <div>Backward Compatible</div>
      </RoleGate>
    );

    expect(screen.getByText('Backward Compatible')).toBeInTheDocument();
  });

  it('multiple roles: user with multiple roles passes if any matches', () => {
    // User has BDRepresentative ('BD Representative' → 'Business Development Manager')
    //   and EstimatingCoordinator ('Estimating Coordinator' → 'Estimating Coordinator')
    // Allowed: EstimatingCoordinator → 'Estimating Coordinator' — matches second user role
    mockUseAppContext.mockReturnValue({
      currentUser: makeUser([RoleName.BDRepresentative, RoleName.EstimatingCoordinator]),
    });

    render(
      <RoleGate allowedRoles={[RoleName.EstimatingCoordinator]}>
        <div>Multi-Role Access</div>
      </RoleGate>
    );

    expect(screen.getByText('Multi-Role Access')).toBeInTheDocument();
  });
});

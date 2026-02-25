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

  it('allows access when user has matching canonical role (SharePoint Admin maps to Administrator)', () => {
    // Legacy 'SharePoint Admin' normalizes to 'Administrator'
    // User has 'SharePoint Admin' (legacy) → normalizeRoleName('SharePoint Admin') → 'Administrator'
    // Allowed list uses RoleName.Administrator = 'Administrator' → both match
    mockUseAppContext.mockReturnValue({
      currentUser: makeUser(['SharePoint Admin' as RoleName]),
    });

    render(
      <RoleGate allowedRoles={[RoleName.Administrator]}>
        <div>Admin Content</div>
      </RoleGate>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('allows access when user has legacy role that maps to allowed canonical role', () => {
    // User has 'Executive Leadership' (legacy) → normalizeRoleName('Executive Leadership') → 'Leadership'
    // Allowed list uses RoleName.Leadership = 'Leadership' — both match
    mockUseAppContext.mockReturnValue({
      currentUser: makeUser(['Executive Leadership' as RoleName]),
    });

    render(
      <RoleGate allowedRoles={[RoleName.Leadership]}>
        <div>Leadership Content</div>
      </RoleGate>
    );

    expect(screen.getByText('Leadership Content')).toBeInTheDocument();
  });

  it('allows access when allowed list uses legacy name and user has canonical', () => {
    // User has canonical 'Leadership' role
    // Allowed list has 'Executive Leadership' (legacy) → normalizes to 'Leadership'
    // Both normalize to 'Leadership' → match
    mockUseAppContext.mockReturnValue({
      currentUser: makeUser([RoleName.Leadership]),
    });

    render(
      <RoleGate allowedRoles={['Executive Leadership' as RoleName]}>
        <div>Canonical User Content</div>
      </RoleGate>
    );

    expect(screen.getByText('Canonical User Content')).toBeInTheDocument();
  });

  it('blocks access when no role match after normalization', () => {
    // Business Development Manager and Commercial Operations Manager are distinct
    // User has Business Development Manager, allowed requires Commercial Operations Manager
    // No overlap → blocked
    mockUseAppContext.mockReturnValue({
      currentUser: makeUser([RoleName.BusinessDevelopmentManager]),
    });

    render(
      <RoleGate
        allowedRoles={[RoleName.CommercialOperationsManager]}
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
        allowedRoles={[RoleName.Administrator]}
        fallback={<div>Please log in</div>}
      >
        <div>Secret Content</div>
      </RoleGate>
    );

    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
    expect(screen.getByText('Please log in')).toBeInTheDocument();
  });

  it('renders children when any normalized role matches', () => {
    // User has IDS Manager and Marketing Manager (canonical roles)
    // Allowed list: Administrator, Commercial Operations Manager, IDS Manager
    // IDS Manager matches
    mockUseAppContext.mockReturnValue({
      currentUser: makeUser([RoleName.IDSManager, RoleName.MarketingManager]),
    });

    render(
      <RoleGate allowedRoles={[RoleName.Administrator, RoleName.CommercialOperationsManager, RoleName.IDSManager]}>
        <div>Accessible</div>
      </RoleGate>
    );

    expect(screen.getByText('Accessible')).toBeInTheDocument();
  });

  it('backward compatibility: existing RoleName enum values still work as before', () => {
    // Both user role and allowed role are the same legacy enum value
    // ExecutiveLeadership → 'Leadership', ExecutiveLeadership → 'Leadership' — match
    mockUseAppContext.mockReturnValue({
      currentUser: makeUser([RoleName.Leadership]),
    });

    render(
      <RoleGate allowedRoles={[RoleName.Leadership]}>
        <div>Backward Compatible</div>
      </RoleGate>
    );

    expect(screen.getByText('Backward Compatible')).toBeInTheDocument();
  });

  it('multiple roles: user with multiple roles passes if any matches', () => {
    // User has Business Development Manager and Estimator
    // Allowed: Estimator — matches second user role
    mockUseAppContext.mockReturnValue({
      currentUser: makeUser([RoleName.BusinessDevelopmentManager, RoleName.Estimator]),
    });

    render(
      <RoleGate allowedRoles={[RoleName.Estimator]}>
        <div>Multi-Role Access</div>
      </RoleGate>
    );

    expect(screen.getByText('Multi-Role Access')).toBeInTheDocument();
  });
});

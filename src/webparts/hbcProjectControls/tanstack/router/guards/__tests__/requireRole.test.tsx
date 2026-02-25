import { requireRole } from '../requireRole';
import { RoleName } from '@hbc/sp-services';
import type { ITanStackRouteContext } from '../../routeContext';

function makeContext(roles: RoleName[]): ITanStackRouteContext {
  return {
    currentUser: {
      id: 1,
      displayName: 'Test User',
      email: 'test@hbc.com',
      loginName: 'test@hbc.com',
      roles,
      permissions: new Set<string>(),
    },
    queryClient: {} as never,
    dataService: {} as never,
    scope: {} as never,
    selectedProject: null,
    isFeatureEnabled: () => true,
  };
}

describe('requireRole guard', () => {
  it('does not throw when user has an allowed role', () => {
    const ctx = makeContext([RoleName.Administrator]);
    expect(() => requireRole(ctx, ['Administrator'])).not.toThrow();
  });

  it('does not throw when user has any of multiple allowed roles', () => {
    const ctx = makeContext([RoleName.Estimator]);
    expect(() =>
      requireRole(ctx, ['Administrator', 'Preconstruction Manager', 'Estimator'])
    ).not.toThrow();
  });

  it('throws redirect when user has no matching role', () => {
    const ctx = makeContext([RoleName.MarketingManager]);
    expect(() => requireRole(ctx, ['Administrator'])).toThrow();
  });

  it('throws redirect when currentUser is null', () => {
    const ctx = { ...makeContext([]), currentUser: null };
    expect(() => requireRole(ctx, ['Administrator'])).toThrow();
  });

  it('throws redirect when user roles array is empty', () => {
    const ctx = makeContext([]);
    expect(() => requireRole(ctx, ['Administrator'])).toThrow();
  });

  it('handles multi-role users correctly', () => {
    const ctx = makeContext([RoleName.SafetyManager, RoleName.QualityControlManager]);
    expect(() => requireRole(ctx, ['Quality Control Manager'])).not.toThrow();
    expect(() => requireRole(ctx, ['Safety Manager'])).not.toThrow();
    expect(() => requireRole(ctx, ['Administrator'])).toThrow();
  });
});

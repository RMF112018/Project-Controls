import { PERMISSIONS, RoleName } from '@hbc/sp-services';
import type { ITanStackRouteContext } from '../../routeContext';
import { requirePermission } from '../requirePermission';

function makeContext(options?: {
  roles?: RoleName[];
  permissions?: Set<string>;
  currentUser?: ITanStackRouteContext['currentUser'];
}): ITanStackRouteContext {
  return {
    currentUser: options?.currentUser ?? {
      id: 1,
      displayName: 'Estimator Dev',
      email: 'estimator@hedrickbrothers.com',
      loginName: 'estimator@hedrickbrothers.com',
      roles: options?.roles ?? [RoleName.Estimator],
      permissions: options?.permissions ?? new Set<string>(),
    },
    queryClient: {} as never,
    dataService: {} as never,
    scope: {} as never,
    selectedProject: null,
    isFeatureEnabled: () => true,
  };
}

describe('requirePermission guard', () => {
  it('allows direct hydrated permission path', () => {
    const context = makeContext({
      permissions: new Set([PERMISSIONS.JOB_NUMBER_REQUEST_CREATE]),
    });
    expect(() => requirePermission(context, PERMISSIONS.JOB_NUMBER_REQUEST_CREATE)).not.toThrow();
  });

  it('allows Estimator via role-derived fallback when permissions set is not hydrated', () => {
    const context = makeContext({
      roles: [RoleName.Estimator],
      permissions: new Set<string>(),
    });
    expect(() => requirePermission(context, PERMISSIONS.JOB_NUMBER_REQUEST_CREATE)).not.toThrow();
  });

  it('redirects when neither hydrated nor role-derived permission exists', () => {
    const context = makeContext({
      roles: [RoleName.MarketingManager],
      permissions: new Set<string>(),
    });
    expect(() => requirePermission(context, PERMISSIONS.JOB_NUMBER_REQUEST_CREATE)).toThrow();
  });
});


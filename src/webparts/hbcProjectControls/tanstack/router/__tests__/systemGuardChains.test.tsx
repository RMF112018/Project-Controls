import { QueryClient } from '@tanstack/react-query';
import { Stage, PERMISSIONS } from '@hbc/sp-services';
import type { IDataService } from '@hbc/sp-services';
import type { ITanStackRouteContext } from '../routeContext';

if (typeof globalThis.TextEncoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const util = require('util') as { TextEncoder: typeof TextEncoder; TextDecoder: typeof TextDecoder };
  globalThis.TextEncoder = util.TextEncoder;
  globalThis.TextDecoder = util.TextDecoder;
}

// Import after TextEncoder polyfill to avoid TanStack runtime issues in jsdom.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharedServicesRoutes = require('../workspaces/routes.sharedservices') as typeof import('../workspaces/routes.sharedservices');

function buildContext(overrides?: Partial<ITanStackRouteContext>): ITanStackRouteContext {
  const enabledFeatures = new Set<string>([]);

  const base: ITanStackRouteContext = {
    queryClient: new QueryClient(),
    dataService: {} as IDataService,
    currentUser: {
      id: 1,
      displayName: 'Marketing User',
      email: 'marketing@hedrickbrothers.com',
      loginName: 'i:0#.f|membership|marketing@hedrickbrothers.com',
      roles: [],
      permissions: new Set([
        PERMISSIONS.MARKETING_DASHBOARD_VIEW,
      ]),
    },
    scope: {
      mode: 'mock',
      siteContext: 'hub',
      siteUrl: 'https://tenant.sharepoint.com/sites/HBCentral',
      projectCode: null,
    },
    selectedProject: {
      projectCode: 'P-1001',
      projectName: 'Pilot Project',
      stage: Stage.ActiveConstruction,
    },
    isFeatureEnabled: (featureName: string) => enabledFeatures.has(featureName),
  };

  return { ...base, ...overrides };
}

describe('system route guard chains', () => {
  it('marketing guard throws when marketing permission is missing', () => {
    const context = buildContext({
      currentUser: {
        ...buildContext().currentUser!,
        permissions: new Set(),
      },
    });
    expect(() => sharedServicesRoutes.guardMarketing(context)).toThrow();
  });

  it('marketing guard passes when permission is present', () => {
    const context = buildContext();
    expect(() => sharedServicesRoutes.guardMarketing(context)).not.toThrow();
  });
});

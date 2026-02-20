import { QueryClient } from '@tanstack/react-query';
import { PERMISSIONS } from '@hbc/sp-services';
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
const batchE = require('../routes.system.batchE') as typeof import('../routes.system.batchE');

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
    activeProjectCode: 'P-1001',
    scope: {
      mode: 'mock',
      siteContext: 'hub',
      siteUrl: 'https://tenant.sharepoint.com/sites/HBCentral',
      projectCode: null,
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
    expect(() => batchE.guardMarketing(context)).toThrow();
  });

  it('marketing guard passes when permission is present', () => {
    const context = buildContext();
    expect(() => batchE.guardMarketing(context)).not.toThrow();
  });
});

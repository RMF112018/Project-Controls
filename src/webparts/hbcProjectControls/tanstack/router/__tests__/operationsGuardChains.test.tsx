import { QueryClient } from '@tanstack/react-query';
import { Stage } from '@hbc/sp-services';
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
const opsRoutes = require('../workspaces/routes.operations') as typeof import('../workspaces/routes.operations');

function buildContext(overrides?: Partial<ITanStackRouteContext>): ITanStackRouteContext {
  const enabledFeatures = new Set([
    'ContractTracking',
    'ProjectStartup',
    'ProjectManagementPlan',
    'ScheduleModule',
    'MonthlyProjectReview',
    'ConstraintsLog',
  ]);

  const base: ITanStackRouteContext = {
    queryClient: new QueryClient(),
    dataService: {} as IDataService,
    currentUser: {
      id: 1,
      displayName: 'Ops User',
      email: 'ops@hedrickbrothers.com',
      loginName: 'i:0#.f|membership|ops@hedrickbrothers.com',
      roles: [],
      permissions: new Set([
        'project:buyout:view',
        'project:risk:edit',
        'project:constraints:view',
        'project:permits:view',
        'project:pmp:edit',
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

describe('operations route guard chains', () => {
  it('project settings redirects to access denied when ContractTracking feature is disabled', () => {
    const context = buildContext({
      isFeatureEnabled: (featureName: string) => featureName !== 'ContractTracking',
    });
    expect(() => opsRoutes.guardProjectSettings(context)).toThrow();
  });

  it('project settings redirects to operations when project is missing', () => {
    const context = buildContext({ selectedProject: null });
    expect(() => opsRoutes.guardProjectSettings(context)).toThrow();
  });

  it('management plan redirects to access denied when PMP permission is missing', () => {
    const context = buildContext({
      currentUser: {
        ...buildContext().currentUser!,
        permissions: new Set(['project:buyout:view']),
      },
    });
    expect(() => opsRoutes.guardManagementPlan(context)).toThrow();
  });

  it('constraints redirects to access denied when feature is disabled', () => {
    const context = buildContext({
      isFeatureEnabled: () => false,
    });
    expect(() => opsRoutes.guardConstraints(context)).toThrow();
  });

  it('permits redirects to access denied when permission is missing', () => {
    const context = buildContext({
      currentUser: {
        ...buildContext().currentUser!,
        permissions: new Set(['project:buyout:view']),
      },
    });
    expect(() => opsRoutes.guardPermits(context)).toThrow();
  });

  it('responsibility route redirects to access denied when ProjectStartup feature is off', () => {
    const context = buildContext({
      isFeatureEnabled: (featureName: string) =>
        featureName === 'ProjectManagementPlan',
    });
    expect(() => opsRoutes.guardResponsibility(context)).toThrow();
  });

  it('go/no-go route redirects to operations when project is missing', () => {
    const context = buildContext({ selectedProject: null });
    expect(() => opsRoutes.guardProjectOnly(context)).toThrow();
  });

  it('project-only guard chain passes when project is selected', () => {
    const context = buildContext();
    expect(() => opsRoutes.guardProjectOnly(context)).not.toThrow();
  });
});

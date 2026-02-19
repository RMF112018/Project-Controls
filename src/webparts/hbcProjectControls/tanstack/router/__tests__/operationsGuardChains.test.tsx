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
const batchA = require('../routes.operations.batchA') as typeof import('../routes.operations.batchA');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const batchB = require('../routes.operations.batchB') as typeof import('../routes.operations.batchB');

function buildContext(overrides?: Partial<ITanStackRouteContext>): ITanStackRouteContext {
  const enabledFeatures = new Set([
    'TanStackRouterPilot',
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
  it('project settings redirects to access denied when pilot flag is disabled', () => {
    const context = buildContext({
      isFeatureEnabled: (featureName: string) => featureName !== 'TanStackRouterPilot',
    });
    expect(() => batchA.guardProjectSettings(context)).toThrow();
  });

  it('project settings redirects to operations when project is missing', () => {
    const context = buildContext({ selectedProject: null });
    expect(() => batchA.guardProjectSettings(context)).toThrow();
  });

  it('management plan redirects to access denied when PMP permission is missing', () => {
    const context = buildContext({
      currentUser: {
        ...buildContext().currentUser!,
        permissions: new Set(['project:buyout:view']),
      },
    });
    expect(() => batchA.guardManagementPlan(context)).toThrow();
  });

  it('constraints redirects to access denied when feature is disabled', () => {
    const context = buildContext({
      isFeatureEnabled: (featureName: string) => featureName === 'TanStackRouterPilot',
    });
    expect(() => batchA.guardConstraints(context)).toThrow();
  });

  it('permits redirects to access denied when permission is missing', () => {
    const context = buildContext({
      currentUser: {
        ...buildContext().currentUser!,
        permissions: new Set(['project:buyout:view']),
      },
    });
    expect(() => batchA.guardPermits(context)).toThrow();
  });

  it('responsibility route redirects to access denied when ProjectStartup feature is off', () => {
    const context = buildContext({
      isFeatureEnabled: (featureName: string) =>
        featureName === 'TanStackRouterPilot',
    });
    expect(() => batchB.guardResponsibility(context)).toThrow();
  });

  it('go/no-go route redirects to operations when project is missing', () => {
    const context = buildContext({ selectedProject: null });
    expect(() => batchB.guardProjectOnly(context)).toThrow();
  });

  it('project-only guard chain passes when pilot is enabled and project is selected', () => {
    const context = buildContext();
    expect(() => batchA.guardProjectOnly(context)).not.toThrow();
  });
});

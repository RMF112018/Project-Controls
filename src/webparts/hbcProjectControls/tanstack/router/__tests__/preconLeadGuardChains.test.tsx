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

// eslint-disable-next-line @typescript-eslint/no-var-requires
const preconRoutes = require('../workspaces/routes.preconstruction') as typeof import('../workspaces/routes.preconstruction');

function buildContext(overrides?: Partial<ITanStackRouteContext>): ITanStackRouteContext {
  const enabledFeatures = new Set([
    'EstimatingTracker',
    'PipelineDashboard',
    'LossAutopsy',
    'TurnoverWorkflow',
    'LeadIntake',
    'GoNoGoScorecard',
  ]);

  const base: ITanStackRouteContext = {
    queryClient: new QueryClient(),
    dataService: {} as IDataService,
    currentUser: {
      id: 1,
      displayName: 'BD User',
      email: 'bd@hedrickbrothers.com',
      loginName: 'i:0#.f|membership|bd@hedrickbrothers.com',
      roles: [],
      permissions: new Set([
        'precon:kickoff:view',
        'precon:autopsy:view',
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

describe('preconstruction and lead guard chains', () => {
  it('estimating tracker guard throws when estimating feature is disabled', () => {
    const context = buildContext({
      isFeatureEnabled: (featureName: string) => featureName !== 'EstimatingTracker',
    });
    expect(() => preconRoutes.guardEstimatingTracker(context)).toThrow();
  });

  it('autopsy list guard throws without autopsy permission', () => {
    const context = buildContext({
      currentUser: {
        ...buildContext().currentUser!,
        permissions: new Set(['precon:kickoff:view']),
      },
    });
    expect(() => preconRoutes.guardAutopsyList(context)).toThrow();
  });

  it('kickoff pursuit guard throws without kickoff permission', () => {
    const context = buildContext({
      currentUser: {
        ...buildContext().currentUser!,
        permissions: new Set(['precon:autopsy:view']),
      },
    });
    expect(() => preconRoutes.guardKickoffPage(context)).toThrow();
  });

  it('turnover guard throws when feature is disabled', () => {
    const context = buildContext({
      isFeatureEnabled: (featureName: string) =>
        featureName !== 'TurnoverWorkflow',
    });
    expect(() => preconRoutes.guardTurnover(context)).toThrow();
  });

  it('lead intake guard throws when LeadIntake feature is disabled', () => {
    const context = buildContext({
      isFeatureEnabled: (featureName: string) =>
        featureName !== 'LeadIntake',
    });
    expect(() => preconRoutes.guardLeadIntake(context)).toThrow();
  });

  it('go/no-go guard throws when scorecard feature is disabled', () => {
    const context = buildContext({
      isFeatureEnabled: (featureName: string) =>
        featureName !== 'GoNoGoScorecard',
    });
    expect(() => preconRoutes.guardGoNoGo(context)).toThrow();
  });

  it('pilot-only guard passes without pilot feature gate', () => {
    const context = buildContext();
    expect(() => preconRoutes.guardPilotOnly(context)).not.toThrow();
  });
});

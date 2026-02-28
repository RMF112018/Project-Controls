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

// Import guard modules after TextEncoder polyfill for TanStack router runtime.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { requireFeature } = require('../guards/requireFeature') as { requireFeature: (context: ITanStackRouteContext, featureName: string) => void };
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { requirePermission } = require('../guards/requirePermission') as { requirePermission: (context: ITanStackRouteContext, permission: string) => void };
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { requireProject } = require('../guards/requireProject') as { requireProject: (context: ITanStackRouteContext) => void };

function buildContext(overrides?: Partial<ITanStackRouteContext>): ITanStackRouteContext {
  const base: ITanStackRouteContext = {
    queryClient: new QueryClient(),
    dataService: {} as IDataService,
    currentUser: {
      id: 1,
      displayName: 'Test User',
      email: 'test@hedrickbrothers.com',
      loginName: 'i:0#.f|membership|test@hedrickbrothers.com',
      roles: [],
      permissions: new Set(['permission:read']),
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
    isFeatureEnabled: (featureName: string) => featureName === 'EnabledFeature',
  };

  return { ...base, ...overrides };
}

describe('tanstack router guard helpers', () => {
  it('requirePermission throws when permission is missing', () => {
    const context = buildContext();
    expect(() => requirePermission(context, 'permission:missing')).toThrow();
  });

  it('requirePermission does not throw when permission exists', () => {
    const context = buildContext();
    expect(() => requirePermission(context, 'permission:read')).not.toThrow();
  });

  it('requireProject throws when selected project is missing', () => {
    const context = buildContext({ selectedProject: null });
    expect(() => requireProject(context)).toThrow();
  });

  it('requireFeature throws when the feature is disabled', () => {
    const context = buildContext();
    expect(() => requireFeature(context, 'DisabledFeature')).toThrow();
  });

  // Stage 20: Layout beforeLoad returns minimal ISelectedProject from search params.
  // requireProject must pass with only projectCode (empty projectName, default stage).
  it('requireProject passes with minimal ISelectedProject from layout context extension', () => {
    const context = buildContext({
      selectedProject: {
        projectCode: '25-022-01',
        projectName: '',
        stage: Stage.Pursuit,
      },
    });
    expect(() => requireProject(context)).not.toThrow();
  });
});

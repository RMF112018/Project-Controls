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
const adminRoutes = require('../workspaces/routes.admin') as typeof import('../workspaces/routes.admin');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharedServicesRoutes = require('../workspaces/routes.sharedservices') as typeof import('../workspaces/routes.sharedservices');

function buildContext(overrides?: Partial<ITanStackRouteContext>): ITanStackRouteContext {
  const enabledFeatures = new Set([
    'PerformanceMonitoring',
    'EnableHelpSystem',
    'TelemetryDashboard',
  ]);

  const base: ITanStackRouteContext = {
    queryClient: new QueryClient(),
    dataService: {} as IDataService,
    currentUser: {
      id: 1,
      displayName: 'Admin User',
      email: 'admin@hedrickbrothers.com',
      loginName: 'i:0#.f|membership|admin@hedrickbrothers.com',
      roles: [],
      permissions: new Set([
        PERMISSIONS.ADMIN_CONFIG,
        PERMISSIONS.ACCOUNTING_QUEUE_VIEW,
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

describe('admin and accounting route guard chains', () => {
  it('accounting queue guard throws when accounting permission is missing', () => {
    const context = buildContext({
      currentUser: {
        ...buildContext().currentUser!,
        permissions: new Set([PERMISSIONS.ADMIN_CONFIG]),
      },
    });
    expect(() => sharedServicesRoutes.guardAccountingQueue(context)).toThrow();
  });

  it('admin guard throws when ADMIN_CONFIG permission is missing', () => {
    const context = buildContext({
      currentUser: {
        ...buildContext().currentUser!,
        permissions: new Set([PERMISSIONS.ACCOUNTING_QUEUE_VIEW]),
      },
    });
    expect(() => adminRoutes.guardAdmin(context)).toThrow();
  });

  it('admin performance guard throws when PerformanceMonitoring feature is disabled', () => {
    const context = buildContext({
      isFeatureEnabled: (featureName: string) =>
        featureName !== 'PerformanceMonitoring',
    });
    expect(() => adminRoutes.guardAdminPerformance(context)).toThrow();
  });

  it('admin support guard throws when EnableHelpSystem feature is disabled', () => {
    const context = buildContext({
      isFeatureEnabled: (featureName: string) =>
        featureName !== 'EnableHelpSystem',
    });
    expect(() => adminRoutes.guardAdminSupport(context)).toThrow();
  });

  it('admin telemetry guard throws when TelemetryDashboard feature is disabled', () => {
    const context = buildContext({
      isFeatureEnabled: (featureName: string) =>
        featureName !== 'TelemetryDashboard',
    });
    expect(() => adminRoutes.guardAdminTelemetry(context)).toThrow();
  });

  it('all admin/accounting guard chains pass when features and permission are present', () => {
    const context = buildContext();
    expect(() => sharedServicesRoutes.guardAccountingQueue(context)).not.toThrow();
    expect(() => adminRoutes.guardAdmin(context)).not.toThrow();
    expect(() => adminRoutes.guardAdminPerformance(context)).not.toThrow();
    expect(() => adminRoutes.guardAdminSupport(context)).not.toThrow();
    expect(() => adminRoutes.guardAdminTelemetry(context)).not.toThrow();
  });
});

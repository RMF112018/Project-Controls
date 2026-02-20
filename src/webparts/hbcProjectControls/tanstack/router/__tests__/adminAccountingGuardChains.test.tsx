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
const batchD = require('../routes.adminAccounting.batchD') as typeof import('../routes.adminAccounting.batchD');

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

describe('admin and accounting route guard chains', () => {
  it('accounting queue guard throws when accounting permission is missing', () => {
    const context = buildContext({
      currentUser: {
        ...buildContext().currentUser!,
        permissions: new Set([PERMISSIONS.ADMIN_CONFIG]),
      },
    });
    expect(() => batchD.guardAccountingQueue(context)).toThrow();
  });

  it('admin guard throws when ADMIN_CONFIG permission is missing', () => {
    const context = buildContext({
      currentUser: {
        ...buildContext().currentUser!,
        permissions: new Set([PERMISSIONS.ACCOUNTING_QUEUE_VIEW]),
      },
    });
    expect(() => batchD.guardAdmin(context)).toThrow();
  });

  it('admin performance guard throws when PerformanceMonitoring feature is disabled', () => {
    const context = buildContext({
      isFeatureEnabled: (featureName: string) =>
        featureName !== 'PerformanceMonitoring',
    });
    expect(() => batchD.guardAdminPerformance(context)).toThrow();
  });

  it('admin support guard throws when EnableHelpSystem feature is disabled', () => {
    const context = buildContext({
      isFeatureEnabled: (featureName: string) =>
        featureName !== 'EnableHelpSystem',
    });
    expect(() => batchD.guardAdminSupport(context)).toThrow();
  });

  it('admin telemetry guard throws when TelemetryDashboard feature is disabled', () => {
    const context = buildContext({
      isFeatureEnabled: (featureName: string) =>
        featureName !== 'TelemetryDashboard',
    });
    expect(() => batchD.guardAdminTelemetry(context)).toThrow();
  });

  it('all admin/accounting guard chains pass when features and permission are present', () => {
    const context = buildContext();
    expect(() => batchD.guardAccountingQueue(context)).not.toThrow();
    expect(() => batchD.guardAdmin(context)).not.toThrow();
    expect(() => batchD.guardAdminPerformance(context)).not.toThrow();
    expect(() => batchD.guardAdminSupport(context)).not.toThrow();
    expect(() => batchD.guardAdminTelemetry(context)).not.toThrow();
  });
});

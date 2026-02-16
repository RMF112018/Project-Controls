import * as React from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { AppProvider } from '../webparts/hbcProjectControls/components/contexts/AppContext';
import type { IDataService, ICurrentUser, RoleName } from '@hbc/sp-services';

/**
 * Test user with admin-level permissions for component testing.
 */
const TEST_USER: ICurrentUser = {
  id: 1,
  displayName: 'Test Admin',
  email: 'admin@hedrickbrothers.com',
  loginName: 'i:0#.f|membership|admin@hedrickbrothers.com',
  roles: ['Executive Leadership' as RoleName, 'IDS' as RoleName],
  permissions: new Set([
    'admin:roles', 'admin:flags', 'admin:config', 'admin:connections', 'admin:provisioning',
    'admin:assignments', 'workflow:manage', 'permission:templates:manage', 'permission:project_team:manage',
  ]),
};

/**
 * Create a Proxy-based mock of IDataService where all methods are jest.fn()
 * with sensible defaults for the most common calls.
 */
export function createComponentMockDataService(
  overrides?: Partial<Record<keyof IDataService, jest.Mock>>
): IDataService {
  const mocks: Record<string, jest.Mock> = {
    getCurrentUser: jest.fn().mockResolvedValue(TEST_USER),
    getFeatureFlags: jest.fn().mockResolvedValue([]),
    getProvisioningStatus: jest.fn().mockResolvedValue(null),
    getProvisioningLogs: jest.fn().mockResolvedValue([]),
    setProjectSiteUrl: jest.fn(),
    resolveUserPermissions: jest.fn().mockResolvedValue({ permissions: TEST_USER.permissions, roles: TEST_USER.roles }),
    searchLeads: jest.fn().mockResolvedValue([]),
    getHubSiteUrl: jest.fn().mockResolvedValue('https://tenant.sharepoint.com/sites/HBCentral'),
    logAudit: jest.fn().mockResolvedValue(undefined),
    getRoles: jest.fn().mockResolvedValue([]),
    getAuditLog: jest.fn().mockResolvedValue([]),
    ...overrides,
  };

  return new Proxy(mocks, {
    get(target, prop: string) {
      if (prop in target) return target[prop];
      // Auto-create a mock for any unhandled method
      target[prop] = jest.fn().mockResolvedValue(undefined);
      return target[prop];
    },
  }) as unknown as IDataService;
}

interface IRenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  dataService?: IDataService;
}

/**
 * Render a component wrapped in FluentProvider + MemoryRouter + AppProvider.
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: IRenderWithProvidersOptions = {}
): RenderResult & { dataService: IDataService } {
  const {
    initialEntries = ['/'],
    dataService = createComponentMockDataService(),
    ...renderOptions
  } = options;

  function Wrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return (
      <FluentProvider theme={webLightTheme}>
        <MemoryRouter initialEntries={initialEntries}>
          <AppProvider dataService={dataService}>
            {children}
          </AppProvider>
        </MemoryRouter>
      </FluentProvider>
    );
  }

  const result = render(ui, { wrapper: Wrapper, ...renderOptions });
  return { ...result, dataService };
}

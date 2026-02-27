import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { FluentProvider } from '@fluentui/react-components';
import { App } from '@components/App';
import type { IDevToolsConfig } from '@components/App';
import { MockDataService, RoleName, ROLE_LANDING_ROUTES } from '@hbc/sp-services';
import type { IDataService } from '@hbc/sp-services';
import type { ISiteContext } from '@hbc/sp-services';
import { hbcLightTheme } from '../src/webparts/hbcProjectControls/theme/hbcTheme';
import { MockAuthScreen } from '../src/webparts/hbcProjectControls/components/shared/MockAuthScreen';
import { MSALAuthProvider } from './auth/MSALAuthProvider';
import { MsalBoundary } from './auth/MsalBoundary';
import { setMockUserRole, getMockUserRole } from './mockContext';
import { getQueryClient } from '../src/webparts/hbcProjectControls/tanstack/query/queryClient';

type DataServiceMode = 'mock' | 'standalone';

const ROLE_OPTIONS: ReadonlyArray<{ label: string; value: string }> = Object.values(RoleName).map(
  (role) => ({ label: role, value: role })
);

const STORAGE_KEY = 'hbc-dev-mode';
const ROLE_SESSION_KEY = 'hbc-dev-selected-role';

const getInitialMode = (): DataServiceMode => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const envMode = (process.env.DATA_SERVICE_MODE as DataServiceMode | undefined);
  if (stored === 'standalone' && envMode === 'standalone') return 'standalone';
  return 'mock';
};

const getPersistedRole = (): RoleName | null => {
  const stored = sessionStorage.getItem(ROLE_SESSION_KEY);
  if (stored && Object.values(RoleName).includes(stored as RoleName)) {
    return stored as RoleName;
  }
  return null;
};

const mockDataService = new MockDataService();

const DevRoot: React.FC = () => {
  const [mode, setMode] = React.useState<DataServiceMode>(getInitialMode);
  const [standaloneService, setStandaloneService] = React.useState<IDataService | null>(null);
  const [standaloneUser, setStandaloneUser] = React.useState<{ displayName: string; email: string } | null>(null);
  const [standaloneSiteContext, setStandaloneSiteContext] = React.useState<ISiteContext | null>(null);
  const [authError, setAuthError] = React.useState<string | null>(null);

  const persistedRole = getPersistedRole();
  const [role, setRole] = React.useState<RoleName | null>(persistedRole);
  const [hasSelectedRole, setHasSelectedRole] = React.useState(persistedRole !== null);

  const navigateToRoleLanding = React.useCallback((selectedRole: RoleName) => {
    // Defer hash mutation until after React commits local role state to avoid guard race conditions.
    window.setTimeout(() => {
      window.location.hash = `#${ROLE_LANDING_ROUTES[selectedRole] ?? '/'}`;
    }, 0);
  }, []);

  // If we recovered a persisted role, prime the data service on mount
  React.useEffect(() => {
    if (persistedRole) {
      mockDataService.setCurrentUserRole(persistedRole);
      setMockUserRole(persistedRole);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInitialRoleSelect = React.useCallback((selectedRole: RoleName) => {
    mockDataService.setCurrentUserRole(selectedRole);
    setMockUserRole(selectedRole);
    sessionStorage.setItem(ROLE_SESSION_KEY, selectedRole);
    setRole(selectedRole);
    setHasSelectedRole(true);
    navigateToRoleLanding(selectedRole);
  }, [navigateToRoleLanding]);

  const handleRoleChange = React.useCallback(
    (newRole: string) => {
      if (newRole === String(role)) return;
      const typedRole = newRole as RoleName;
      mockDataService.setDevSuperAdminMode(false);
      setMockUserRole(typedRole);
      mockDataService.setCurrentUserRole(typedRole);
      sessionStorage.setItem(ROLE_SESSION_KEY, typedRole);
      getQueryClient().invalidateQueries({
        predicate: (query) =>
          ['projects', 'pipeline', 'analytics', 'permissions', 'user'].some((k) =>
            String(query.queryKey[0]).includes(k)
          ),
      });
      setRole(typedRole);
      navigateToRoleLanding(typedRole);
    },
    [navigateToRoleLanding, role]
  );

  const handleEnterStandalone = React.useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'standalone');
    setMode('standalone');
  }, []);

  const handleReturnToMock = React.useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'mock');
    setStandaloneService(null);
    setStandaloneUser(null);
    setStandaloneSiteContext(null);
    setAuthError(null);
    setMode('mock');
  }, []);

  const handleStandaloneReady = React.useCallback(
    (
      svc: IDataService,
      user: { displayName: string; email: string; loginName: string },
      siteContext: ISiteContext
    ) => {
      setStandaloneService(svc);
      setStandaloneUser(user);
      setStandaloneSiteContext(siteContext);
    },
    []
  );

  const hubUrl = process.env.SP_HUB_URL ?? '';

  // Standalone mode
  if (mode === 'standalone') {
    if (!standaloneService) {
      return (
        <MsalBoundary onReset={() => { setAuthError(null); setStandaloneService(null); }}>
          <MSALAuthProvider
            hubSiteUrl={hubUrl}
            onReady={handleStandaloneReady}
            onLogout={handleReturnToMock}
            onAuthError={(err) => {
              setStandaloneService(null);
              setStandaloneUser(null);
              setAuthError(err.message);
            }}
            sessionExpiredMessage={authError ?? undefined}
          />
        </MsalBoundary>
      );
    }
    const standaloneDevToolsConfig: IDevToolsConfig = {
      currentRole: String(role ?? ''),
      roleOptions: ROLE_OPTIONS,
      onRoleChange: () => { /* role switching disabled in standalone */ },
      onSwitchMode: handleReturnToMock,
      mode: 'standalone',
    };
    return (
      <MsalBoundary onReset={() => { setAuthError(null); setStandaloneService(null); }}>
        <App
          key="standalone"
          dataService={standaloneService}
          siteUrl={standaloneSiteContext?.siteUrl ?? hubUrl}
          dataServiceMode="standalone"
          devToolsConfig={standaloneDevToolsConfig}
        />
      </MsalBoundary>
    );
  }

  // Mock mode: show role picker if no role selected yet
  if (!hasSelectedRole || !role) {
    return (
      <FluentProvider theme={hbcLightTheme}>
        <MockAuthScreen onRoleSelect={handleInitialRoleSelect} />
      </FluentProvider>
    );
  }

  // Mock mode: app with selected role
  const mockDevToolsConfig: IDevToolsConfig = {
    currentRole: String(role),
    roleOptions: ROLE_OPTIONS,
    onRoleChange: handleRoleChange,
    onSwitchMode: handleEnterStandalone,
    mode: 'mock',
  };
  return (
    <App
      key={String(role)}
      dataService={mockDataService}
      dataServiceMode="mock"
      devToolsConfig={mockDevToolsConfig}
    />
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<DevRoot />);
}

import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@components/App';
import { MockDataService, RoleName, StandaloneSharePointDataService } from '@hbc/sp-services';
import type { IDataService } from '@hbc/sp-services';
import type { ISiteContext } from '@hbc/sp-services';
import { RoleSwitcher } from './RoleSwitcher';
import { MSALAuthProvider } from './auth/MSALAuthProvider';
import { MsalBoundary } from './auth/MsalBoundary';
import { setMockUserRole, getMockUserRole } from './mockContext';

const DEV_SUPER_ADMIN = 'DEV_SUPER_ADMIN';
type RoleValue = RoleName | typeof DEV_SUPER_ADMIN;
type DataServiceMode = 'mock' | 'standalone';

// Persist mode across refreshes (MSAL already caches tokens in localStorage)
const STORAGE_KEY = 'hbc-dev-mode';
const getInitialMode = (): DataServiceMode => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const envMode = (process.env.DATA_SERVICE_MODE as DataServiceMode | undefined);
  if (stored === 'standalone' && envMode === 'standalone') return 'standalone';
  return 'mock';
};

const mockDataService = new MockDataService(); // singleton — never recreated

const DevRoot: React.FC = () => {
  const [mode, setMode] = React.useState<DataServiceMode>(getInitialMode);
  const [standaloneService, setStandaloneService] = React.useState<IDataService | null>(null);
  const [standaloneUser, setStandaloneUser] = React.useState<{ displayName: string; email: string } | null>(null);
  const [standaloneSiteContext, setStandaloneSiteContext] = React.useState<ISiteContext | null>(null);
  const [role, setRole] = React.useState<RoleValue>(getMockUserRole());
  const [authError, setAuthError] = React.useState<string | null>(null);

  const handleRoleChange = React.useCallback(
    (newRole: RoleValue) => {
      if (newRole === role) return;
      if (newRole === DEV_SUPER_ADMIN) {
        mockDataService.setDevSuperAdminMode(true);
      } else {
        mockDataService.setDevSuperAdminMode(false);
        setMockUserRole(newRole as RoleName);
        mockDataService.setCurrentUserRole(newRole as RoleName);
      }
      window.location.hash = '#/';
      setRole(newRole);
    },
    [role]
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
    return (
      <MsalBoundary onReset={() => { setAuthError(null); setStandaloneService(null); }}>
        <RoleSwitcher
          role={role}
          onRoleChange={() => { /* role switching disabled in standalone — real user */ }}
          mode="standalone"
          standaloneUser={standaloneUser}
          onSwitchMode={handleReturnToMock}
          authError={authError}
        />
        <App
          key="standalone"
          dataService={standaloneService}
          siteUrl={standaloneSiteContext?.siteUrl ?? hubUrl}
          dataServiceMode="standalone"
        />
      </MsalBoundary>
    );
  }

  // Default: mock mode
  return (
    <>
      <RoleSwitcher
        role={role}
        onRoleChange={handleRoleChange}
        mode="mock"
        onSwitchMode={handleEnterStandalone}
      />
      <App
        key={String(role)}
        dataService={mockDataService}
        dataServiceMode="mock"
      />
    </>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<DevRoot />);
}

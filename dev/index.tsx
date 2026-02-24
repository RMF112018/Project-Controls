import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@components/App';
import type { IDevToolsConfig } from '@components/App';
import { MockDataService, RoleName } from '@hbc/sp-services';
import type { IDataService } from '@hbc/sp-services';
import type { ISiteContext } from '@hbc/sp-services';
import { MSALAuthProvider } from './auth/MSALAuthProvider';
import { MsalBoundary } from './auth/MsalBoundary';
import { setMockUserRole, getMockUserRole } from './mockContext';
import { getQueryClient } from '../src/webparts/hbcProjectControls/tanstack/query/queryClient';

const DEV_SUPER_ADMIN = 'DEV_SUPER_ADMIN';
type RoleValue = RoleName | typeof DEV_SUPER_ADMIN;
type DataServiceMode = 'mock' | 'standalone';

/** Central role options for the dev role switcher (consolidated from dev/RoleSwitcher.tsx). */
const ROLE_OPTIONS: ReadonlyArray<{ label: string; value: string }> = [
  { label: '\u26A1 DEV: Super-Admin', value: DEV_SUPER_ADMIN },
  { label: 'President / VP Operations', value: RoleName.ExecutiveLeadership },
  { label: 'OpEx Manager', value: RoleName.IDS },
  { label: 'Department Director', value: RoleName.DepartmentDirector },
  { label: 'SharePoint Admin', value: RoleName.SharePointAdmin },
  { label: 'Project Executive', value: RoleName.OperationsTeam },
  { label: 'Project Manager', value: RoleName.OperationsTeam },
  { label: 'Estimating Coordinator', value: RoleName.EstimatingCoordinator },
  { label: 'BD Representative', value: RoleName.BDRepresentative },
  { label: 'Accounting Controller', value: RoleName.AccountingManager },
  { label: 'Legal / Risk Manager', value: RoleName.Legal },
  { label: 'Marketing', value: RoleName.Marketing },
  { label: 'Quality Control', value: RoleName.QualityControl },
  { label: 'Safety', value: RoleName.Safety },
  { label: 'Read-Only Observer', value: RoleName.RiskManagement },
];

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
    (newRole: RoleValue | string) => {
      if (newRole === role) return;
      if (newRole === DEV_SUPER_ADMIN) {
        mockDataService.setDevSuperAdminMode(true);
      } else {
        mockDataService.setDevSuperAdminMode(false);
        setMockUserRole(newRole as RoleName);
        mockDataService.setCurrentUserRole(newRole as RoleName);
      }
      // Targeted invalidation of role-dependent query caches
      getQueryClient().invalidateQueries({
        predicate: (query) =>
          ['projects', 'pipeline', 'analytics', 'permissions', 'user'].some((k) =>
            String(query.queryKey[0]).includes(k)
          ),
      });
      window.location.hash = '#/';
      setRole(newRole as RoleValue);
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
    const standaloneDevToolsConfig: IDevToolsConfig = {
      currentRole: String(role),
      roleOptions: ROLE_OPTIONS,
      onRoleChange: () => { /* role switching disabled in standalone — real user */ },
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

  // Default: mock mode
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

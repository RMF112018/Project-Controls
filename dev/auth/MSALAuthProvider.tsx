/**
 * Standalone mode bootstrapper.
 * Handles MSAL initialization, login, silent token refresh, and SPFI wiring.
 * Returns ready-to-use IDataService (StandaloneSharePointDataService) to parent.
 */
import * as React from 'react';
import { MsalProvider, useIsAuthenticated, useMsal } from '@azure/msal-react';
import type { AccountInfo } from '@azure/msal-browser';
import { StandaloneSharePointDataService } from '@hbc/sp-services';
import type { IDataService } from '@hbc/sp-services';
import { msalInstance, SP_SCOPE } from './msalConfig';
import { createStandaloneSpfi } from './createStandaloneSpfi';

interface IStandaloneBootstrapperProps {
  hubSiteUrl: string;
  onReady: (dataService: IDataService, user: { displayName: string; email: string; loginName: string }) => void;
  onLogout: () => void;
}

function StandaloneBootstrapper({ hubSiteUrl, onReady, onLogout }: IStandaloneBootstrapperProps) {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [error, setError] = React.useState<string | null>(null);

  const initDataService = React.useCallback(async (account: AccountInfo) => {
    try {
      const sp = createStandaloneSpfi(instance, account, hubSiteUrl, SP_SCOPE);
      const user = {
        displayName: account.name ?? account.username,
        email: account.username,
        loginName: `i:0#.f|membership|${account.username}`,
      };
      const svc = StandaloneSharePointDataService.create(sp, { ...user, id: 0 });
      onReady(svc, user);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to initialize data service');
    }
  }, [instance, hubSiteUrl, onReady]);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    const account = accounts[0];
    if (account) void initDataService(account);
  }, [isAuthenticated, accounts, initDataService]);

  const handleLogin = async () => {
    try {
      await instance.loginPopup({ scopes: [SP_SCOPE] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh', gap: 16, fontFamily: 'Segoe UI, sans-serif',
        background: '#1a1a2e', color: '#fff',
      }}>
        <h2 style={{ color: '#fff', marginBottom: 8 }}>HBC Project Controls</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>Standalone Mode — Sign in to access live SharePoint data</p>
        <button
          onClick={handleLogin}
          style={{
            padding: '12px 24px', fontSize: 16,
            background: '#0078d4', color: '#fff', border: 'none',
            borderRadius: 4, cursor: 'pointer',
          }}
        >
          Sign in with Microsoft
        </button>
        <button
          onClick={onLogout}
          style={{
            padding: '6px 16px', fontSize: 12,
            background: 'transparent', color: 'rgba(255,255,255,0.5)',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, cursor: 'pointer',
          }}
        >
          ← Return to Mock Mode
        </button>
        {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}
      </div>
    );
  }

  // Authenticated — loading spinner while SPFI wires up
  return (
    <div style={{ padding: 32, textAlign: 'center', color: '#fff', background: '#1a1a2e', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Connecting to SharePoint…
    </div>
  );
}

/** Exported: wraps children in MsalProvider + bootstrapper */
export function MSALAuthProvider({ hubSiteUrl, onReady, onLogout }: IStandaloneBootstrapperProps) {
  return (
    <MsalProvider instance={msalInstance}>
      <StandaloneBootstrapper hubSiteUrl={hubSiteUrl} onReady={onReady} onLogout={onLogout} />
    </MsalProvider>
  );
}

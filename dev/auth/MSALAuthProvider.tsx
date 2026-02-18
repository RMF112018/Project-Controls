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
import type { ISiteContext } from '@hbc/sp-services';
import { GRAPH_SCOPES, msalInstance, SP_SCOPE } from './msalConfig';
import { createStandaloneRuntimeContext } from './createStandaloneSpfi';

interface IStandaloneBootstrapperProps {
  hubSiteUrl: string;
  onReady: (
    dataService: IDataService,
    user: { displayName: string; email: string; loginName: string },
    siteContext: ISiteContext
  ) => void;
  onLogout: () => void;
  onAuthError?: (error: Error) => void;
  sessionExpiredMessage?: string;
}

function StandaloneBootstrapper({ hubSiteUrl, onReady, onLogout, onAuthError, sessionExpiredMessage }: IStandaloneBootstrapperProps) {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [error, setError] = React.useState<string | null>(null);

  const initDataService = React.useCallback(async (account: AccountInfo) => {
    try {
      const runtime = await createStandaloneRuntimeContext(
        instance,
        account,
        hubSiteUrl,
        SP_SCOPE,
        GRAPH_SCOPES
      );
      const user = {
        displayName: account.name ?? account.username,
        email: account.username,
        loginName: `i:0#.f|membership|${account.username}`,
      };
      const svc = StandaloneSharePointDataService.create(runtime.sp, { ...user, id: 0 }, {
        siteContext: runtime.siteContext,
        graphMembership: runtime.graphMembership,
      });
      onReady(svc, user, runtime.siteContext);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to initialize data service');
      setError(err.message);
      onAuthError?.(err);
    }
  }, [instance, hubSiteUrl, onReady, onAuthError]);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    const account = accounts[0];
    if (account) void initDataService(account);
  }, [isAuthenticated, accounts, initDataService]);

  const handleLogin = async (): Promise<void> => {
    try {
      await instance.loginPopup({ scopes: [SP_SCOPE] });
    } catch (e) {
      const rawMessage = e instanceof Error ? e.message : 'Login failed';
      const friendlyMessage = rawMessage.includes('popup_window_error')
        ? 'Popup was blocked. Please allow popups for this site and try again.'
        : rawMessage.includes('user_cancelled')
        ? 'Sign-in was cancelled.'
        : rawMessage.includes('interaction_in_progress')
        ? 'Another sign-in is in progress. Please wait and try again.'
        : rawMessage;
      setError(friendlyMessage);
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
        {sessionExpiredMessage && (
          <p style={{ color: '#ffd700', fontSize: 13, marginBottom: 8, maxWidth: 360, textAlign: 'center' }}>
            &#9888; {sessionExpiredMessage}
          </p>
        )}
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
export function MSALAuthProvider({ hubSiteUrl, onReady, onLogout, onAuthError, sessionExpiredMessage }: IStandaloneBootstrapperProps) {
  return (
    <MsalProvider instance={msalInstance}>
      <StandaloneBootstrapper
        hubSiteUrl={hubSiteUrl}
        onReady={onReady}
        onLogout={onLogout}
        onAuthError={onAuthError}
        sessionExpiredMessage={sessionExpiredMessage}
      />
    </MsalProvider>
  );
}

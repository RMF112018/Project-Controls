/**
 * PnP v4 custom behavior — injects MSAL Bearer token into every SP request.
 * Lives exclusively in dev/auth/ — never imported by src/ or @hbc/sp-services.
 */
import type { Queryable } from '@pnp/queryable';
import type { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';

export function MsalBehavior(
  msalInstance: IPublicClientApplication,
  account: AccountInfo,
  scope: string
) {
  return (instance: Queryable): Queryable => {
    instance.on.auth.replace(async (url: URL, init: RequestInit) => {
      let accessToken: string;
      try {
        const result = await msalInstance.acquireTokenSilent({ account, scopes: [scope] });
        accessToken = result.accessToken;
      } catch {
        // Silent failed — interactive fallback (rare: consent required, token expired)
        const result = await msalInstance.acquireTokenPopup({ account, scopes: [scope] });
        accessToken = result.accessToken;
      }
      const headers = (init.headers ?? {}) as Record<string, string>;
      headers['Authorization'] = `Bearer ${accessToken}`;
      init.headers = headers;
      return [url, init];
    });
    return instance;
  };
}

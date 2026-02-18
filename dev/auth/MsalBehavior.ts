/**
 * PnP v4 custom behavior — injects MSAL Bearer token into every SP request.
 * Lives exclusively in dev/auth/ — never imported by src/ or @hbc/sp-services.
 */
import type { Queryable } from '@pnp/queryable';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
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
      } catch (silentErr) {
        if (silentErr instanceof InteractionRequiredAuthError) {
          // Consent required, token expired, or MFA needed — interactive popup fallback
          try {
            const result = await msalInstance.acquireTokenPopup({ account, scopes: [scope] });
            accessToken = result.accessToken;
          } catch (popupErr) {
            // Popup blocked, user cancelled, or consent revoked
            throw popupErr instanceof Error
              ? popupErr
              : new Error('Authentication popup was blocked or cancelled. Please disable popup blockers and try again.');
          }
        } else {
          // Network error, config error, or other non-interaction error — propagate as-is
          throw silentErr;
        }
      }
      const headers = (init.headers ?? {}) as Record<string, string>;
      headers['Authorization'] = `Bearer ${accessToken}`;
      init.headers = headers;
      return [url, init];
    });
    return instance;
  };
}

import {
  PublicClientApplication,
  Configuration,
  LogLevel,
  BrowserCacheLocation,
} from '@azure/msal-browser';

// Env vars injected by webpack DefinePlugin from .env
declare const process: { env: Record<string, string | undefined> };

const msalConfiguration: Configuration = {
  auth: {
    clientId: process.env.AAD_CLIENT_ID ?? '',
    authority: `https://login.microsoftonline.com/${process.env.AAD_TENANT_ID ?? 'common'}`,
    redirectUri: window.location.origin, // http://localhost:3000 in dev
  },
  cache: {
    cacheLocation: BrowserCacheLocation.LocalStorage,
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning,
      loggerCallback: (level, message) => {
        if (level === LogLevel.Error) console.error('[MSAL]', message);
      },
    },
  },
};

// Singleton — created once at module load
export const msalInstance = new PublicClientApplication(msalConfiguration);

// SharePoint REST scope derived from hub URL (e.g. "https://tenant.sharepoint.com/.default")
export const SP_SCOPE = (() => {
  try {
    const url = new URL(process.env.SP_HUB_URL ?? 'https://placeholder.sharepoint.com');
    return `${url.origin}/.default`;
  } catch {
    return 'https://placeholder.sharepoint.com/.default';
  }
})();

export const GRAPH_SCOPES = [
  'User.Read',
  'Sites.ReadWrite.All',
  'Group.Read.All',
];

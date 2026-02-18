/**
 * Creates a PnP SPFI instance authenticated via MSAL for standalone dev mode.
 * Mirrors the SPFx WebPart pattern: spfi().using(SPFx(context)) → spfi().using(DefaultHeaders(), DefaultInit(), BrowserFetch(), MsalBehavior(...))
 */
import { spfi, SPFI } from '@pnp/sp';
import { DefaultHeaders, DefaultInit, BrowserFetch } from '@pnp/core';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/folders';
import '@pnp/sp/files';
import '@pnp/sp/batching';
import '@pnp/sp/site-users/web';
import '@pnp/sp/hubsites';
import type { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
import { MsalBehavior } from './MsalBehavior';

export function createStandaloneSpfi(
  msalInstance: IPublicClientApplication,
  account: AccountInfo,
  hubSiteUrl: string,
  scope: string
): SPFI {
  return spfi(hubSiteUrl).using(
    DefaultHeaders(),
    DefaultInit(),
    BrowserFetch(),
    MsalBehavior(msalInstance, account, scope)
  );
}

export type { SPFI };
